const OpenAI = require('openai');
const config = require('./config');

class OpenAIBackend {
  constructor({
    OpenAIClient = OpenAI,
    env = process.env,
    openAIConfig = config.OPENAI,
  } = {}) {
    this.OpenAIClient = OpenAIClient;
    this.env = env;
    this.config = openAIConfig;
    this.openai = null;
  }

  async initialize() {
    if (!this.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    if (!this.env.OPENAI_VECTOR_STORE_ID) {
      throw new Error('OPENAI_VECTOR_STORE_ID environment variable is required');
    }

    this.openai = new this.OpenAIClient({
      apiKey: this.env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: this.config.REQUEST_TIMEOUT_MS,
    });
  }

  async getAssistant() {
    return 'openai-responses';
  }

  async createThread() {
    const conversation = await this.openai.conversations.create({
      metadata: { application: 'xavibot' },
    });
    return conversation.id;
  }

  async chatWithAssistant(userMessage, threadId) {
    const response = await this.openai.responses.create({
      model: this.config.MODEL,
      instructions: this.config.INSTRUCTIONS,
      input: [{ role: 'user', content: userMessage }],
      conversation: threadId,
      tools: [{
        type: 'file_search',
        vector_store_ids: [this.env.OPENAI_VECTOR_STORE_ID],
      }],
    });

    if (response.error) {
      throw new Error(`OpenAI response failed: ${response.error.message || 'unknown error'}`);
    }

    if (response.status !== 'completed') {
      const reason = response.incomplete_details?.reason || response.status || 'unknown reason';
      throw new Error(`OpenAI response incomplete: ${reason}`);
    }

    const message = response.output_text || this.extractFallbackText(response.output);

    return {
      message,
      threadId,
    };
  }

  extractFallbackText(output = []) {
    const contentParts = output
      .filter(item => item.type === 'message')
      .flatMap(item => item.content || []);
    const text = contentParts
      .map(part => part.type === 'output_text' ? part.text : part.refusal)
      .filter(Boolean)
      .join('\n');

    if (!text) {
      throw new Error('OpenAI response did not contain text output');
    }

    return text;
  }
}

module.exports = new OpenAIBackend();
module.exports.OpenAIBackend = OpenAIBackend;
