const crypto = require('crypto');

const DEFAULT_PROVIDER = 'gemini';
const SUPPORTED_PROVIDERS = new Set(['gemini', 'openai']);
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

class SessionProvider {
  constructor({ gemini, openai, now = Date.now, sessionTtlMs = SESSION_TTL_MS }) {
    this.backends = { gemini, openai };
    this.now = now;
    this.sessionTtlMs = sessionTtlMs;
    this.sessions = new Map();
    this.initializations = new Map();
    this.operations = new Map();
  }

  async getBackend(provider) {
    if (!SUPPORTED_PROVIDERS.has(provider)) {
      throw new RangeError('Unsupported provider.');
    }

    if (!this.initializations.has(provider)) {
      const initialization = Promise.resolve(this.backends[provider].initialize())
        .then(() => this.backends[provider])
        .catch(error => {
          this.initializations.delete(provider);
          throw error;
        });
      this.initializations.set(provider, initialization);
    }

    return this.initializations.get(provider);
  }

  async createSession() {
    this.pruneExpiredSessions();
    const backend = await this.getBackend(DEFAULT_PROVIDER);
    const session = {
      id: crypto.randomBytes(24).toString('hex'),
      provider: DEFAULT_PROVIDER,
      assistantId: await backend.getAssistant(),
      threadId: await backend.createThread(),
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  getSession(sessionId) {
    this.pruneExpiredSessions();
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.updatedAt = this.now();
    return { ...session };
  }

  async getSettledSession(sessionId) {
    const pendingOperation = this.operations.get(sessionId);
    if (pendingOperation) {
      await pendingOperation.catch(() => undefined);
    }
    return this.getSession(sessionId);
  }

  async selectProvider(sessionId, provider) {
    if (!SUPPORTED_PROVIDERS.has(provider)) {
      throw new RangeError('Unsupported provider.');
    }

    return this.runSessionOperation(sessionId, async session => {
      if (session.provider === provider) {
        return { ...session };
      }

      const backend = await this.getBackend(provider);
      const assistantId = await backend.getAssistant();
      const threadId = await backend.createThread();
      Object.assign(session, {
        provider,
        assistantId,
        threadId,
        updatedAt: this.now(),
      });
      return { ...session };
    });
  }

  async chat(sessionId, message) {
    return this.runSessionOperation(sessionId, async session => {
      const provider = session.provider;
      const backend = await this.getBackend(provider);
      const result = await backend.chatWithAssistant(message, session.threadId);
      session.threadId = result.threadId || session.threadId;
      session.updatedAt = this.now();
      return {
        ...result,
        provider,
        sessionId: session.id,
      };
    });
  }

  runSessionOperation(sessionId, operation) {
    const previous = this.operations.get(sessionId) || Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(() => {
        const session = this.sessions.get(sessionId);
        if (!session) {
          throw new ReferenceError('Session not found.');
        }
        return operation(session);
      });

    this.operations.set(sessionId, current);
    return current.finally(() => {
      if (this.operations.get(sessionId) === current) {
        this.operations.delete(sessionId);
      }
    });
  }

  pruneExpiredSessions() {
    const now = this.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if ((now - session.updatedAt) > this.sessionTtlMs) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = {
  DEFAULT_PROVIDER,
  SessionProvider,
  SUPPORTED_PROVIDERS,
};
