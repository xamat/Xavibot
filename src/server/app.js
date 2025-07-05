const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const BackendSwitcher = require('./backend-switcher');

// Global variables
let backendSwitcher = null;
let backend = null;

app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

//TODO: In a production environment, you might want to restrict which origins are allowed to access your API for security reasons.

// Initialize the application
async function initializeApp() {
    try {
        // Initialize the backend switcher
        backendSwitcher = new BackendSwitcher();
        backend = await backendSwitcher.initialize();
        console.log(`Backend initialized: ${backendSwitcher.getBackendType()}`);
    } catch (error) {
        console.error('Failed to initialize application:', error);
        throw error;
    }
}

// Initialize the backend when the module is loaded
initializeApp().catch(error => {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
});

app.post('/get-assistant', async (req, res) => {
  try {
    // Wait for backend to be initialized
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



app.post('/create-thread', async (req, res) => {
  try {
    // Wait for backend to be initialized
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
    // Ensure backend is initialized
    if (!backend) {
      await initializeApp();
    }
    res.status(200).json({ 
      status: 'Server is up and running',
      backend: backendSwitcher ? backendSwitcher.getBackendType() : 'not initialized',
      initialized: !!backend
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'Server error',
      error: error.message 
    });
  }
});

app.get('/prewarm', async (req, res) => {
  try {
    // Ensure backend is fully initialized and warmed up
    if (!backend) {
      await initializeApp();
    }
    
    // Pre-warm by creating a test assistant and thread
    const assistantId = await backend.getAssistant();
    const threadId = await backend.createThread();
    
    res.status(200).json({ 
      status: 'Backend pre-warmed successfully',
      assistantId,
      threadId,
      backend: backendSwitcher ? backendSwitcher.getBackendType() : 'unknown'
    });
  } catch (error) {
    console.error('Pre-warm failed:', error);
    res.status(500).json({ 
      status: 'Pre-warm failed',
      error: error.message 
    });
  }
});



app.post('/chatWithAssistant', async (req, res) => {
  const userMessage = req.body.message;
  const threadId = req.body.threadId;
  
  try {
    // Wait for backend to be initialized
    if (!backend) {
      await initializeApp();
    }
    const result = await backend.chatWithAssistant(userMessage, threadId);
    res.json(result);
  } catch (error) {
    console.error("Assistant error:", error.message);
    res.status(500).json({ message: `Error running the assistant: ${error.message}` });
  }
});

module.exports = app;

