const config = require('./config');

class BackendSwitcher {
  constructor() {
    this.backend = null;
    this.backendType = config.BACKEND_TYPE.toLowerCase();
  }

  async initialize() {
    console.log(`Initializing ${this.backendType} backend...`);
    
    try {
      if (this.backendType === 'openai') {
        // Use the existing OpenAI implementation
        this.backend = require('./openai-backend');
      } else if (this.backendType === 'gemini') {
        // Use the Gemini implementation
        this.backend = require('./gemini-backend');
      } else {
        throw new Error(`Unsupported backend type: ${this.backendType}`);
      }

      await this.backend.initialize();
      console.log(`${this.backendType} backend initialized successfully`);
      return this.backend;
    } catch (error) {
      console.error(`Failed to initialize ${this.backendType} backend:`, error);
      throw error;
    }
  }

  getBackend() {
    if (!this.backend) {
      throw new Error('Backend not initialized. Call initialize() first.');
    }
    return this.backend;
  }

  getBackendType() {
    return this.backendType;
  }
}

module.exports = BackendSwitcher; 