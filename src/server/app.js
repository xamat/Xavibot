const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const { OAuth2Client } = require('google-auth-library');
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

// Google ID Token validation middleware
async function validateGoogleToken(req, res, next) {
    // Skip validation for health check endpoint
    if (req.path === '/health') {
        return next();
    }
    
    const authHeader = req.headers['authorization'];
    
    // Make authentication optional for chatbot endpoints
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = { email: 'anonymous@example.com' };
        return next();
    }
    
    // For now, just accept any Bearer token to test
    req.user = { email: 'test-user@example.com' };
    next();
}

// Apply Google token validation to all routes except health
app.use(validateGoogleToken);

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

app.post('/create-assistant', async (req, res) => {
  try {
    // Wait for backend to be initialized
    if (!backend) {
      await initializeApp();
    }
    const assistantId = await backend.createAssistant();
    res.json(assistantId);
  } catch (error) {
    console.error('Error creating assistant:', error);
    res.status(500).json({ error: 'Failed to create assistant' });
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

app.get('/health', (req, res) => {
  res.status(200).send('Server is up and running');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-3.5-turbo", // Or your chosen conversational model
    messages: [{ role: "user", content: userMessage }] // Wrap user message in 'messages' array
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  if (response.data.choices && response.data.choices.length > 0) {
    // Extract the message object
    const messageObject = response.data.choices[0].message;

    if (messageObject) {
      // Assuming the message object contains a property like 'content' with the response text
      const aiMessage = messageObject.content ? messageObject.content.trim() : "";
      res.json({ message: aiMessage });
    } else {
      res.status(500).json({ message: "Received an unexpected response format from OpenAI API." });
    }
  } else {
    res.status(500).json({ message: "No choices found in the response from OpenAI API." });
  }
} catch (error) {
  console.error("OpenAI API error:", error.response ? error.response.data : error.message);
  let errorMessage = 'Error communicating with OpenAI';
  if (error.response && error.response.data) {
    errorMessage += `: ${error.response.data.error}`;
  }
  res.status(500).json({ message: errorMessage });
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

