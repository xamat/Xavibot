const config = require('./config');

class BackendSwitcher {
  constructor() {
    this.backend = null;
    // Initialize with default backend type from config, but allow it to be changed.
    this.backendType = config.BACKEND_TYPE.toLowerCase();
  }

  async initialize(backendTypeToInit) {
    const typeToInitialize = backendTypeToInit || this.backendType;
    console.log(`Initializing ${typeToInitialize} backend...`);
    
    try {
      // Clear any previously cached backend module to ensure fresh require
      if (typeToInitialize === 'openai') {
        delete require.cache[require.resolve('./openai-backend')];
        this.backend = require('./openai-backend');
      } else if (typeToInitialize === 'gemini') {
        delete require.cache[require.resolve('./gemini-backend')];
        this.backend = require('./gemini-backend');
      } else {
        throw new Error(`Unsupported backend type: ${typeToInitialize}`);
      }

      await this.backend.initialize(); // Call initialize on the backend instance
      this.backendType = typeToInitialize; // Update the current backend type
      console.log(`${this.backendType} backend initialized successfully`);
      return this.backend;
    } catch (error) {
      console.error(`Failed to initialize ${typeToInitialize} backend:`, error);
      // Attempt to revert to the previous backend type if initialization fails during a switch
      if (backendTypeToInit && this.backendType !== typeToInitialize) {
        console.warn(`Attempting to revert to previous backend: ${this.backendType}`);
        try {
            await this.initialize(this.backendType); // Re-initialize with the original type
            console.log(`Successfully reverted to ${this.backendType} backend.`);
            // Indicate that the switch failed by throwing a new error or returning a specific status
            throw new Error(`Failed to switch to ${typeToInitialize}, reverted to ${this.backendType}. Original error: ${error.message}`);
        } catch (revertError) {
            console.error(`Failed to revert to ${this.backendType} backend:`, revertError);
            throw new Error(`Failed to initialize ${typeToInitialize} and also failed to revert. System may be unstable. Original error: ${error.message}, Revert error: ${revertError.message}`);
        }
      }
      throw error; // Re-throw original error if not a switch or if revert fails
    }
  }

  async switchBackend(newBackendType) {
    const lowerNewBackendType = newBackendType.toLowerCase();
    if (lowerNewBackendType !== 'openai' && lowerNewBackendType !== 'gemini') {
      throw new Error(`Unsupported backend type for switching: ${newBackendType}`);
    }

    if (this.backendType === lowerNewBackendType && this.backend) {
      console.log(`Backend is already set to ${lowerNewBackendType}. Re-initializing.`);
      // Even if it's the same, re-initialize to ensure consistency,
      // or you could choose to skip if re-initialization is costly and not needed.
      // For now, we re-initialize.
    }

    console.log(`Switching backend from ${this.backendType} to ${lowerNewBackendType}...`);
    // The initialize method will now handle setting this.backendType and this.backend
    return this.initialize(lowerNewBackendType);
  }

  getBackend() {
    if (!this.backend) {
      // This state should ideally be avoided by ensuring initialize is always called.
      throw new Error('Backend not initialized. Call initialize() or switchBackend() first.');
    }
    return this.backend;
  }

  getBackendType() {
    return this.backendType;
  }
}

module.exports = BackendSwitcher; 