jest.mock('./gemini-backend', () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./openai-backend', () => ({
  initialize: jest.fn().mockRejectedValue(new Error('OpenAI returned 404')),
}));

const BackendSwitcher = require('./backend-switcher');
const geminiBackend = require('./gemini-backend');

test('reports a failed switch after successfully restoring Gemini', async () => {
  const switcher = new BackendSwitcher();
  await switcher.initialize('gemini');

  let switchError;
  try {
    await switcher.switchBackend('openai');
  } catch (error) {
    switchError = error;
  }

  expect(switchError.message).toBe(
    'Failed to switch to openai, reverted to gemini. Original error: OpenAI returned 404'
  );
  expect(switcher.getBackendType()).toBe('gemini');
  expect(switcher.getBackend()).toBe(geminiBackend);
  expect(geminiBackend.initialize).toHaveBeenCalledTimes(2);
});
