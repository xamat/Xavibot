const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const crypto = require('crypto');
const app = express();
const config = require('./config');
const BackendSwitcher = require('./backend-switcher');

// Global variables
let backendSwitcher = null;
let backend = null;
const webSessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigin = config.SERVER.CORS_ORIGIN;
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

function isAllowedOrigin(req) {
  const allowedOrigin = config.SERVER.CORS_ORIGIN;
  const origin = req.header('origin');

  if (!allowedOrigin) return true;
  if (!origin) return false;

  return origin === allowedOrigin;
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of webSessions.entries()) {
    if ((now - session.updatedAt) > SESSION_TTL_MS) {
      webSessions.delete(sessionId);
    }
  }
}

function createWebSession() {
  pruneExpiredSessions();
  const sessionId = crypto.randomBytes(24).toString('hex');
  const session = {
    id: sessionId,
    threadId: null,
    assistantId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  webSessions.set(sessionId, session);
  return session;
}

function getWebSession(sessionId) {
  pruneExpiredSessions();
  if (!sessionId) return null;
  const session = webSessions.get(sessionId);
  if (!session) return null;
  session.updatedAt = Date.now();
  return session;
}

function requireBrowserSession(req, res, next) {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Forbidden origin.' });
  }

  const sessionId = req.body.sessionId || req.header('x-session-id');
  const session = getWebSession(sessionId);

  if (!session) {
    return res.status(401).json({ message: 'Missing or invalid browser session.' });
  }

  req.webSession = session;
  next();
}

// Authentication middleware for non-browser/admin API use
const authenticateAPI = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  const configuredKey = config.SERVER.API_KEY;

  if (!configuredKey) {
    console.warn('WARNING: No XAVIBOT_API_KEY configured. API is public.');
    return next();
  }

  if (apiKey !== configuredKey) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing API key.' });
  }
  next();
};

app.post('/session/init', async (req, res) => {
  try {
    if (!isAllowedOrigin(req)) {
      return res.status(403).json({ message: 'Forbidden origin.' });
    }

    if (!backend) {
      await initializeApp();
    }

    const assistantId = await backend.getAssistant();
    const threadId = await backend.createThread();
    const session = createWebSession();
    session.assistantId = assistantId;
    session.threadId = threadId;
    session.updatedAt = Date.now();

    res.json({
      sessionId: session.id,
      assistantId,
      threadId,
      backend: backendSwitcher ? backendSwitcher.getBackendType() : 'unknown'
    });
  } catch (error) {
    console.error('Error initializing browser session:', error);
    res.status(500).json({ error: 'Failed to initialize browser session' });
  }
});

app.post('/switch-backend', requireBrowserSession, async (req, res) => {
  const { backendType } = req.body;
  if (!backendType || (backendType !== 'openai' && backendType !== 'gemini')) {
    return res.status(400).json({ message: 'Invalid backend type specified. Use "openai" or "gemini".' });
  }

  try {
    if (!backendSwitcher) {
      console.error('BackendSwitcher not initialized during switch attempt.');
      await initializeApp();
    }

    backend = await backendSwitcher.switchBackend(backendType);

    const newThreadId = await backend.createThread();
    const assistantId = await backend.getAssistant();

    req.webSession.threadId = newThreadId;
    req.webSession.assistantId = assistantId;
    req.webSession.updatedAt = Date.now();

    res.json({
      message: `Successfully switched to ${backendType} backend.`,
      threadId: newThreadId,
      assistantId
    });
  } catch (error) {
    console.error(`Error switching backend to ${backendType}:`, error);
    let currentBackend = 'unknown';
    if (backendSwitcher) {
      currentBackend = backendSwitcher.getBackendType();
    }
    res.status(500).json({ message: `Failed to switch to ${backendType} backend. Current backend: ${currentBackend}. Error: ${error.message}` });
  }
});

async function initializeApp() {
  try {
    backendSwitcher = new BackendSwitcher();
    backend = await backendSwitcher.initialize();
    console.log(`Backend initialized: ${backendSwitcher.getBackendType()}`);
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
}

initializeApp().catch(error => {
  console.error('Failed to initialize backend:', error);
  process.exit(1);
});

app.post('/get-assistant', authenticateAPI, async (req, res) => {
  try {
    if (!backend) {
      await initializeApp();
    }
    const assistantId = await backend.getAssistant();
    res.json(assistantId);
  } catch (error) {
    console.error('Error getting assistant:', error);
    res.status(500).json({ error: 'Failed to get assistant' });
  }
});

app.post('/create-thread', authenticateAPI, async (req, res) => {
  try {
    if (!backend) {
      await initializeApp();
    }
    const threadId = await backend.createThread();
    res.json(threadId);
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

app.get('/health', async (req, res) => {
  try {
    if (!backend) {
      await initializeApp();
    }
    res.status(200).json({
      status: 'Server is up and running',
      backend: backendSwitcher ? backendSwitcher.getBackendType() : 'not initialized'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'Server error'
    });
  }
});

app.get('/prewarm', authenticateAPI, async (req, res) => {
  try {
    if (!backend) {
      await initializeApp();
    }

    await backend.getAssistant();
    await backend.createThread();

    res.status(200).json({
      status: 'Backend pre-warmed successfully',
      backend: backendSwitcher ? backendSwitcher.getBackendType() : 'unknown'
    });
  } catch (error) {
    console.error('Pre-warm failed:', error);
    res.status(500).json({
      status: 'Pre-warm failed'
    });
  }
});

app.post('/chatWithAssistant', requireBrowserSession, async (req, res) => {
  const userMessage = req.body.message;

  try {
    if (!backend) {
      console.warn('Backend not initialized at chatWithAssistant call. Attempting to initialize.');
      await initializeApp();
      if (!backend) {
        throw new Error('Backend could not be initialized for chat.');
      }
    }

    const threadId = req.webSession.threadId;
    const result = await backend.chatWithAssistant(userMessage, threadId);
    req.webSession.threadId = result.threadId || threadId;
    req.webSession.updatedAt = Date.now();

    res.json({
      ...result,
      sessionId: req.webSession.id
    });
  } catch (error) {
    console.error('Assistant error:', error.message);
    res.status(500).json({ message: `Error running the assistant: ${error.message}` });
  }
});

module.exports = app;
