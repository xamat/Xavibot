const OpenAIBackend = require('./openai-backend').OpenAIBackend;

function createHarness(overrides = {}) {
  const client = {
    conversations: {
      create: jest.fn().mockResolvedValue({ id: 'conv_test' }),
    },
    responses: {
      create: jest.fn(),
    },
  };
  const OpenAIClient = jest.fn(() => client);
  const backend = new OpenAIBackend({
    OpenAIClient,
    env: {
      OPENAI_API_KEY: 'test-api-key',
      OPENAI_VECTOR_STORE_ID: 'vs_test',
      ...overrides.env,
    },
    openAIConfig: {
      MODEL: 'gpt-test',
      INSTRUCTIONS: 'Test instructions',
      REQUEST_TIMEOUT_MS: 30000,
      ...overrides.openAIConfig,
    },
  });

  return { backend, client, OpenAIClient };
}

describe('OpenAI Responses backend', () => {
  test('initializes the current OpenAI client without looking up a retired assistant', async () => {
    const { backend, client, OpenAIClient } = createHarness();

    await backend.initialize();

    expect(OpenAIClient).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      maxRetries: 2,
      timeout: 30000,
    });
    expect(backend.openai).toBe(client);
    await expect(backend.getAssistant()).resolves.toBe('openai-responses');
  });

  test('requires both the API key and a populated knowledge-base vector store', async () => {
    const missingKey = createHarness({ env: { OPENAI_API_KEY: undefined } });
    const missingVectorStore = createHarness({
      env: { OPENAI_VECTOR_STORE_ID: undefined },
    });

    await expect(missingKey.backend.initialize()).rejects.toThrow(
      'OPENAI_API_KEY environment variable is required'
    );
    await expect(missingVectorStore.backend.initialize()).rejects.toThrow(
      'OPENAI_VECTOR_STORE_ID environment variable is required'
    );
    expect(missingKey.OpenAIClient).not.toHaveBeenCalled();
    expect(missingVectorStore.OpenAIClient).not.toHaveBeenCalled();
  });

  test('creates a durable conversation while preserving the threadId contract', async () => {
    const { backend, client } = createHarness();
    await backend.initialize();

    const threadId = await backend.createThread();

    expect(client.conversations.create).toHaveBeenCalledWith({
      metadata: { application: 'xavibot' },
    });
    expect(threadId).toBe('conv_test');
  });

  test('uses Responses with durable conversation state, instructions, and file search', async () => {
    const { backend, client } = createHarness();
    client.responses.create.mockResolvedValue({
      id: 'resp_test',
      status: 'completed',
      error: null,
      output_text: 'Hello from Responses',
      output: [],
    });
    await backend.initialize();

    const result = await backend.chatWithAssistant('Hello', 'conv_test');

    expect(client.responses.create).toHaveBeenCalledWith({
      model: 'gpt-test',
      instructions: 'Test instructions',
      input: [{ role: 'user', content: 'Hello' }],
      conversation: 'conv_test',
      tools: [{ type: 'file_search', vector_store_ids: ['vs_test'] }],
    });
    expect(result).toEqual({
      message: 'Hello from Responses',
      threadId: 'conv_test',
    });
  });

  test('rejects incomplete Responses instead of returning a partial answer', async () => {
    const { backend, client } = createHarness();
    client.responses.create.mockResolvedValue({
      id: 'resp_incomplete',
      status: 'incomplete',
      error: null,
      incomplete_details: { reason: 'max_output_tokens' },
      output_text: 'Partial answer',
      output: [],
    });
    await backend.initialize();

    await expect(
      backend.chatWithAssistant('Hello', 'conv_test')
    ).rejects.toThrow('OpenAI response incomplete: max_output_tokens');
  });

  test('surfaces structured Responses API errors', async () => {
    const { backend, client } = createHarness();
    client.responses.create.mockResolvedValue({
      id: 'resp_failed',
      status: 'failed',
      error: { message: 'Provider failure' },
      output_text: '',
      output: [],
    });
    await backend.initialize();

    await expect(
      backend.chatWithAssistant('Hello', 'conv_test')
    ).rejects.toThrow('OpenAI response failed: Provider failure');
  });

  test('returns a model refusal when no output text is available', async () => {
    const { backend, client } = createHarness();
    client.responses.create.mockResolvedValue({
      id: 'resp_refusal',
      status: 'completed',
      error: null,
      output_text: '',
      output: [{
        type: 'message',
        content: [{ type: 'refusal', refusal: 'I cannot help with that.' }],
      }],
    });
    await backend.initialize();

    await expect(
      backend.chatWithAssistant('Disallowed request', 'conv_test')
    ).resolves.toEqual({
      message: 'I cannot help with that.',
      threadId: 'conv_test',
    });
  });
});
