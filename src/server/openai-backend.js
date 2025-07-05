const OpenAI = require('openai');
const config = require('./config');

class OpenAIBackend {
  constructor() {
    this.openai = null;
    this.assistant = null;
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

    // Create or get assistant
    await this.createAssistant();

    console.log('OpenAI backend initialized successfully');
  }

  async createAssistant() {
    try {
      // Check if assistant already exists
      const assistants = await this.openai.beta.assistants.list();
      const existingAssistant = assistants.data.find(a => a.name === 'Xavi Amatriain Assistant');
      
      if (existingAssistant) {
        this.assistant = existingAssistant;
        console.log('Using existing assistant:', this.assistant.id);
      } else {
        // Create new assistant
        this.assistant = await this.openai.beta.assistants.create({
          name: 'Xavi Amatriain Assistant',
          instructions: config.OPENAI.INSTRUCTIONS,
          model: config.OPENAI.MODEL,
          tools: [{ type: 'retrieval' }]
        });
        console.log('Created new assistant:', this.assistant.id);
      }
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    }
  }

  async getAssistant() {
    if (!this.assistant) {
      await this.createAssistant();
    }
    return this.assistant.id;
  }

  async createAssistant() {
    return this.getAssistant();
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
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
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