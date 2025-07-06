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
    const startTime = Date.now();
    console.log('=== GEMINI CACHE SETUP START ===');
    console.log('Setting up cached knowledge base...');
    
    const cacheFile = path.join(__dirname, 'gemini_cache.json');
    console.log('Cache file path:', cacheFile);
    console.log('__dirname:', __dirname);
    console.log('Current working directory:', process.cwd());
    
    // Try to load cached file URIs
    try {
      if (fs.existsSync(cacheFile)) {
        const cacheReadStart = Date.now();
        console.log('Cache file exists, reading...');
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const cacheReadTime = Date.now() - cacheReadStart;
        console.log(`Cache read time: ${cacheReadTime}ms`);
        console.log('Cache data loaded:', JSON.stringify(cacheData, null, 2));
        const cacheAge = Date.now() - cacheData.timestamp;
        console.log('Cache age in hours:', cacheAge / (1000 * 60 * 60));
        console.log('Cache age threshold (24 hours):', 24 * 60 * 60 * 1000);
        console.log('Is cache valid?', cacheAge < 24 * 60 * 60 * 1000);
        
        // Use cache if it's less than 24 hours old
        if (cacheAge < 24 * 60 * 60 * 1000) {
          const cacheLoadStart = Date.now();
          console.log('*** CACHE IS VALID - USING CACHED FILES ***');
          this.uploadedFiles = cacheData.files.map(fileInfo => ({
            name: fileInfo.name,
            file: { uri: fileInfo.uri }
          }));
          const cacheLoadTime = Date.now() - cacheLoadStart;
          console.log(`Cache load time: ${cacheLoadTime}ms`);
          console.log(`Loaded ${this.uploadedFiles.length} cached files`);
          console.log('Cached files:', this.uploadedFiles);
          console.log('*** RETURNING EARLY - NO UPLOAD NEEDED ***');
          const totalTime = Date.now() - startTime;
          console.log(`=== GEMINI CACHE SETUP COMPLETE: ${totalTime}ms (USED CACHE) ===`);
          return;
        } else {
          console.log('*** CACHE EXPIRED - RE-UPLOADING FILES ***');
        }
      } else {
        console.log('*** NO CACHE FILE FOUND - UPLOADING FILES ***');
      }
    } catch (error) {
      console.log('*** ERROR LOADING CACHE - WILL RE-UPLOAD FILES ***');
      console.log('Error loading cache, will re-upload files:', error.message);
      console.log('Error details:', error);
    }

    // Upload PDF files using the correct API signature
    const uploadStartTime = Date.now();
    console.log('=== STARTING FILE UPLOADS ===');
    
    for (const filename of config.GEMINI.KNOWLEDGE_BASE_FILES) {
      try {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
          const fileUploadStart = Date.now();
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
          
          const fileUploadTime = Date.now() - fileUploadStart;
          console.log(`Successfully uploaded ${filename} in ${fileUploadTime}ms`);
        } else {
          console.warn(`File not found: ${filename}`);
        }
      } catch (error) {
        console.error(`Error uploading ${filename}:`, error);
      }
    }
    
    const totalUploadTime = Date.now() - uploadStartTime;
    console.log(`=== FILE UPLOADS COMPLETE: ${totalUploadTime}ms ===`);

    // Save cache for future use
    const cacheSaveStart = Date.now();
    try {
      const cacheData = {
        timestamp: Date.now(),
        files: this.uploadedFiles.map(file => ({
          name: file.name,
          uri: file.file.uri
        }))
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      const cacheSaveTime = Date.now() - cacheSaveStart;
      console.log(`File URIs cached for future use in ${cacheSaveTime}ms`);
    } catch (error) {
      console.warn('Could not save cache file:', error.message);
    }

    const totalTime = Date.now() - startTime;
    console.log(`Setup complete: ${this.uploadedFiles.length} files uploaded and cached`);
    console.log(`=== GEMINI CACHE SETUP COMPLETE: ${totalTime}ms (UPLOADED FILES) ===`);
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
    const startTime = Date.now();
    console.log('=== GEMINI CHAT START ===');
    console.log('userMessage:', userMessage);
    console.log('threadId:', threadId);
    console.log('uploadedFiles count:', this.uploadedFiles.length);
    
    try {
      // Get or create conversation history for this thread
      let history = this.conversationHistory.get(threadId) || [];
      let aiMessage;
      
      // Use the instructions from config
      const systemPrompt = config.GEMINI.INSTRUCTIONS;

      // If this is the first message in the thread, use uploaded files if available
      if (history.length === 0 && this.uploadedFiles.length > 0) {
        const firstMessageStart = Date.now();
        console.log(`Using ${this.uploadedFiles.length} cached files for first message`);
        
        // Create content with uploaded files using the correct API
        const fileParts = this.uploadedFiles.map(file => ({
          fileData: {
            mimeType: 'application/pdf',
            fileUri: file.file.uri
          }
        }));
        
        const generateStart = Date.now();
        console.log('About to generate content with files...');
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
        const generateTime = Date.now() - generateStart;
        console.log('Content generation completed in', generateTime, 'ms');
        
        aiMessage = result.text;
        
        // Add the exchange to history (without system prompt in history)
        history.push(
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: aiMessage }] }
        );
        
        const firstMessageTime = Date.now() - firstMessageStart;
        console.log('First message processing completed in', firstMessageTime, 'ms');
      } else {
        const subsequentMessageStart = Date.now();
        console.log('Processing subsequent message with history...');
        
        // Continue conversation with history, but include system prompt
        const generateStart = Date.now();
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
        const generateTime = Date.now() - generateStart;
        console.log('Content generation completed in', generateTime, 'ms');
        
        aiMessage = result.text;
        
        // Add the exchange to history
        history.push(
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: aiMessage }] }
        );
        
        const subsequentMessageTime = Date.now() - subsequentMessageStart;
        console.log('Subsequent message processing completed in', subsequentMessageTime, 'ms');
      }
      
      // Update conversation history
      this.conversationHistory.set(threadId, history);
      
      const totalTime = Date.now() - startTime;
      console.log('=== GEMINI CHAT COMPLETE:', totalTime, 'ms ===');
      
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