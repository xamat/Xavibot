const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const config = require('./config');

class GeminiBackend {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.uploadedFiles = []; // Store uploaded file references
    this.cachedContent = null; // Store cached content reference
    this.conversationHistory = new Map(); // threadId -> conversation history
  }

  async initialize() {
    console.log('Initializing Gemini backend...');
    
    // Check if API key is available in environment variables first
    if (!process.env.GEMINI_API_KEY) {
      // Try to get the Gemini API key from Google Cloud Secret Manager
      const secretRetrieved = await this.getSecretFromSecretManager();
      if (!secretRetrieved) {
        throw new Error('Failed to retrieve Gemini API key from environment or Secret Manager');
      }
    }

    // Initialize Gemini client with API key using the new SDK format
    const apiKey = process.env.GEMINI_API_KEY.trim();
    this.genAI = new GoogleGenAI({ apiKey: apiKey });
    this.modelName = config.GEMINI.MODEL;

    // Upload PDF files and create cached content
    await this.setupCachedKnowledgeBase();

    console.log('Gemini backend initialized successfully');
  }

  async getSecretFromSecretManager() {
    const client = new SecretManagerServiceClient();
    const name = 'projects/xavibot-personal/secrets/GEMINI_API_KEY/versions/latest';

    try {
      const [version] = await client.accessSecretVersion({ name: name });
      const payload = version.payload.data.toString();
      process.env.GEMINI_API_KEY = payload;
      return true;
    } catch (err) {
      console.error('Error retrieving Gemini API key from Secret Manager:', err);
      return false;
    }
  }

  async setupCachedKnowledgeBase() {
    console.log('Setting up cached knowledge base...');
    this.uploadedFiles = [];

    // Upload PDF files using the correct API signature
    for (const filename of config.GEMINI.KNOWLEDGE_BASE_FILES) {
      try {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
          console.log(`Uploading ${filename}...`);
          
          // Upload using the correct API signature: upload(file, config)
          const uploadedFile = await this.genAI.files.upload(
            filePath,  // First parameter: file path
            {          // Second parameter: config object
              mimeType: 'application/pdf'
            }
          );
          
          this.uploadedFiles.push({
            name: filename,
            file: uploadedFile
          });
          
          console.log(`Successfully uploaded ${filename}`);
        } else {
          console.warn(`File not found: ${filename}`);
        }
      } catch (error) {
        console.error(`Error uploading ${filename}:`, error);
      }
    }

    console.log(`Setup complete: ${this.uploadedFiles.length} files uploaded`);
  }

  async getAssistant() {
    // For Gemini, we don't need to create assistants like OpenAI
    // Just return a placeholder ID
    return 'gemini-assistant';
  }

  async createAssistant() {
    // For Gemini, we don't need to create assistants like OpenAI
    // Just return a placeholder ID
    return 'gemini-assistant';
  }

  async createThread() {
    // For Gemini, we create a unique thread ID
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory.set(threadId, []);
    return threadId;
  }

  async chatWithAssistant(userMessage, threadId) {
    try {
      // Get or create conversation history for this thread
      let history = this.conversationHistory.get(threadId) || [];
      let aiMessage;
      
      // Use the instructions from config
      const systemPrompt = config.GEMINI.INSTRUCTIONS;

      // If this is the first message in the thread, use uploaded files if available
      if (history.length === 0 && this.uploadedFiles.length > 0) {
        // Create content with uploaded files using the correct API
        const fileParts = this.uploadedFiles.map(file => ({
          fileData: {
            mimeType: 'application/pdf',
            fileUri: file.file.uri
          }
        }));
        
        const result = await this.genAI.models.generateContent({
          model: this.modelName,
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\nUser: " + userMessage },
                ...fileParts
              ]
            }
          ]
        });
        
        aiMessage = result.text;
        
        // Add the exchange to history (without system prompt in history)
        history.push(
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: aiMessage }] }
        );
      } else {
        // Continue conversation with history, but include system prompt
        const result = await this.genAI.models.generateContent({
          model: this.modelName,
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\nConversation history:\n" + 
                  history.map(msg => `${msg.role === 'user' ? 'User' : 'Xavi'}: ${msg.parts[0].text}`).join('\n') +
                  "\n\nUser: " + userMessage
                }
              ]
            }
          ]
        });
        
        aiMessage = result.text;
        
        // Add the exchange to history
        history.push(
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: aiMessage }] }
        );
      }
      
      // Update conversation history
      this.conversationHistory.set(threadId, history);
      
      return {
        message: aiMessage,
        threadId: threadId
      };
    } catch (error) {
      console.error('Gemini assistant error:', error);
      throw error;
    }
  }
}

module.exports = new GeminiBackend(); 