describe('backend selection configuration', () => {
  const originalBackendType = process.env.BACKEND_TYPE;

  afterEach(() => {
    if (originalBackendType === undefined) {
      delete process.env.BACKEND_TYPE;
    } else {
      process.env.BACKEND_TYPE = originalBackendType;
    }
    jest.resetModules();
  });

  test('defaults to Gemini when BACKEND_TYPE is unset', () => {
    delete process.env.BACKEND_TYPE;
    jest.resetModules();

    const config = require('./config');

    expect(config.BACKEND_TYPE).toBe('gemini');
  });

  test('respects an explicit OpenAI override', () => {
    process.env.BACKEND_TYPE = 'openai';
    jest.resetModules();

    const config = require('./config');

    expect(config.BACKEND_TYPE).toBe('openai');
  });

  test('uses a bounded OpenAI request timeout by default', () => {
    delete process.env.OPENAI_REQUEST_TIMEOUT_MS;
    jest.resetModules();

    const config = require('./config');

    expect(config.OPENAI.REQUEST_TIMEOUT_MS).toBe(30000);
  });
});
