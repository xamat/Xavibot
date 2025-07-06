const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('./config');

class OpenAIBackend {
  constructor() {
    this.openai = null;
    this.assistant = null;
    this.uploadedFiles = []; // Store uploaded file references
    this.conversationHistory = new Map(); // threadId -> conversation history
  }

  async initialize() {
    console.log('Initializing OpenAI backend...');
    
    // Check if API key is available in environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Get existing assistant (no file upload needed)
    await this.getExistingAssistant();

    console.log('OpenAI backend initialized successfully');
  }

  // File upload methods removed - using existing assistant with pre-uploaded files

  async getExistingAssistant() {
    try {
      // Get the existing assistant by name
      const assistants = await this.openai.beta.assistants.list();
      const existingAssistant = assistants.data.find(a => a.name === config.OPENAI.ASSISTANT_NAME);
      
      if (existingAssistant) {
        this.assistant = existingAssistant;
        console.log('Using existing assistant:', this.assistant.id);
      } else {
        throw new Error(`Assistant with name '${config.OPENAI.ASSISTANT_NAME}' not found. Please create it in your OpenAI account first.`);
      }
    } catch (error) {
      console.error('Error getting existing assistant:', error);
      throw error;
    }
  }

  async getAssistant() {
    if (!this.assistant) {
      await this.getExistingAssistant();
    }
    return this.assistant.id;
  }

  async createThread() {
    try {
      const thread = await this.openai.beta.threads.create();
      this.conversationHistory.set(thread.id, []);
      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  async chatWithAssistant(userMessage, threadId) {
    try {
      // Add user message to thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage
      });

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistant.id
      });

      // Wait for completion
      let runs = await this.openai.beta.threads.runs.list(threadId);
      let runStatus = runs.data.find(r => r.id === run.id);
      
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runs = await this.openai.beta.threads.runs.list(threadId);
        runStatus = runs.data.find(r => r.id === run.id);
      }

      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }

      // Get the response
      const messages = await this.openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0]; // Most recent message

      return {
        message: lastMessage.content[0].text.value,
        threadId: threadId
      };
    } catch (error) {
      console.error('OpenAI assistant error:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIBackend(); 