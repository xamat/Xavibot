const express = require('express');

function createApp({ sessionProvider, serverConfig, logger = console }) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    const allowedOrigin = serverConfig.CORS_ORIGIN;
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-session-id');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  function isAllowedOrigin(req) {
    const allowedOrigin = serverConfig.CORS_ORIGIN;
    const origin = req.header('origin');
    if (!allowedOrigin) return true;
    if (!origin) return false;
    return origin === allowedOrigin;
  }

  function publicSessionState(session) {
    return {
      sessionId: session.id,
      assistantId: session.assistantId,
      threadId: session.threadId,
      provider: session.provider,
    };
  }

  function requireBrowserSession(req, res, next) {
    if (!isAllowedOrigin(req)) {
      return res.status(403).json({ message: 'Forbidden origin.' });
    }

    const sessionId = req.body?.sessionId || req.header('x-session-id');
    const session = sessionProvider.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Missing or invalid browser session.' });
    }

    req.webSession = session;
    return next();
  }

  function authenticateAPI(req, res, next) {
    const configuredKey = serverConfig.API_KEY;
    if (!configuredKey) {
      logger.warn('WARNING: No XAVIBOT_API_KEY configured. API is public.');
      return next();
    }
    if (req.header('x-api-key') !== configuredKey) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing API key.' });
    }
    return next();
  }

  app.post('/session/init', async (req, res) => {
    try {
      if (!isAllowedOrigin(req)) {
        return res.status(403).json({ message: 'Forbidden origin.' });
      }

      const session = await sessionProvider.createSession();
      return res.json(publicSessionState(session));
    } catch (error) {
      logger.error('Error initializing browser session:', error);
      return res.status(500).json({ message: 'Failed to initialize browser session.' });
    }
  });

  app.get('/session/state', requireBrowserSession, async (req, res) => {
    const session = await sessionProvider.getSettledSession(req.webSession.id);
    if (!session) {
      return res.status(401).json({ message: 'Missing or invalid browser session.' });
    }
    return res.json(publicSessionState(session));
  });

  app.post('/session/provider', requireBrowserSession, async (req, res) => {
    const { provider } = req.body;
    if (typeof provider !== 'string' || !['gemini', 'openai'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider. Choose Gemini or OpenAI.' });
    }

    try {
      const session = await sessionProvider.selectProvider(req.webSession.id, provider);
      return res.json({
        ...publicSessionState(session),
        message: `This session is now using ${provider === 'openai' ? 'OpenAI' : 'Gemini'}.`,
      });
    } catch (error) {
      logger.error(`Failed to select ${provider} for browser session:`, error);
      const session = sessionProvider.getSession(req.webSession.id);
      return res.status(503).json({
        message: `${provider === 'openai' ? 'OpenAI' : 'Gemini'} is unavailable. This session is still using ${session.provider === 'openai' ? 'OpenAI' : 'Gemini'}.`,
        provider: session.provider,
      });
    }
  });

  app.post('/chatWithAssistant', requireBrowserSession, async (req, res) => {
    if (typeof req.body.message !== 'string' || !req.body.message.trim()) {
      return res.status(400).json({ message: 'A message is required.' });
    }

    try {
      const result = await sessionProvider.chat(req.webSession.id, req.body.message);
      return res.json(result);
    } catch (error) {
      logger.error('Assistant request failed:', error);
      return res.status(500).json({ message: 'Error running the assistant.' });
    }
  });

  app.post('/get-assistant', authenticateAPI, async (req, res) => {
    try {
      const backend = await sessionProvider.getBackend('gemini');
      return res.json(await backend.getAssistant());
    } catch (error) {
      logger.error('Error getting assistant:', error);
      return res.status(500).json({ error: 'Failed to get assistant' });
    }
  });

  app.post('/create-thread', authenticateAPI, async (req, res) => {
    try {
      const backend = await sessionProvider.getBackend('gemini');
      return res.json(await backend.createThread());
    } catch (error) {
      logger.error('Error creating thread:', error);
      return res.status(500).json({ error: 'Failed to create thread' });
    }
  });

  app.get('/health', async (req, res) => {
    try {
      await sessionProvider.getBackend('gemini');
      return res.status(200).json({
        status: 'Server is up and running',
        backend: 'gemini',
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      return res.status(500).json({ status: 'Server error' });
    }
  });

  app.get('/prewarm', authenticateAPI, async (req, res) => {
    try {
      const backend = await sessionProvider.getBackend('gemini');
      await backend.getAssistant();
      await backend.createThread();
      return res.status(200).json({
        status: 'Backend pre-warmed successfully',
        backend: 'gemini',
      });
    } catch (error) {
      logger.error('Pre-warm failed:', error);
      return res.status(500).json({ status: 'Pre-warm failed' });
    }
  });

  return app;
}

module.exports = { createApp };
