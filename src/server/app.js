const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = require('./config');
const gemini = require('./gemini-backend');
const openai = require('./openai-backend');
const { createApp } = require('./create-app');
const { SessionProvider } = require('./session-provider');

const sessionProvider = new SessionProvider({ gemini, openai });
const app = createApp({
  sessionProvider,
  serverConfig: config.SERVER,
});

// Gemini remains the immutable process startup/default provider. OpenAI is
// initialized lazily only after an individual browser session selects it.
sessionProvider.getBackend('gemini').catch(error => {
  console.error('Failed to initialize Gemini backend:', error);
  process.exit(1);
});

module.exports = app;
