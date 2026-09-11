const { SessionProvider } = require('./session-provider');

function createBackend(name) {
  let threadNumber = 0;
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    getAssistant: jest.fn().mockResolvedValue(`${name}-assistant`),
    createThread: jest.fn().mockImplementation(async () => `${name}-thread-${++threadNumber}`),
    chatWithAssistant: jest.fn().mockImplementation(async (message, threadId) => ({
      message: `${name}:${message}`,
      threadId,
    })),
  };
}

test('new sessions default to Gemini without initializing OpenAI', async () => {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  const sessions = new SessionProvider({ gemini, openai });

  const session = await sessions.createSession();

  expect(session).toMatchObject({
    provider: 'gemini',
    assistantId: 'gemini-assistant',
    threadId: 'gemini-thread-1',
  });
  expect(gemini.initialize).toHaveBeenCalledTimes(1);
  expect(openai.initialize).not.toHaveBeenCalled();
});

test('concurrent sessions can use different providers without changing each other', async () => {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  const sessions = new SessionProvider({ gemini, openai });
  const [first, second] = await Promise.all([
    sessions.createSession(),
    sessions.createSession(),
  ]);

  const switched = await sessions.selectProvider(first.id, 'openai');

  expect(switched).toMatchObject({
    id: first.id,
    provider: 'openai',
    assistantId: 'openai-assistant',
    threadId: 'openai-thread-1',
  });
  expect(sessions.getSession(second.id)).toMatchObject({
    provider: 'gemini',
    assistantId: 'gemini-assistant',
  });
  expect(gemini.initialize).toHaveBeenCalledTimes(1);
  expect(openai.initialize).toHaveBeenCalledTimes(1);
});

test('chat dispatches through each session provider and conversation only', async () => {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  const sessions = new SessionProvider({ gemini, openai });
  const geminiSession = await sessions.createSession();
  const openaiSession = await sessions.createSession();
  await sessions.selectProvider(openaiSession.id, 'openai');

  const [geminiResult, openaiResult] = await Promise.all([
    sessions.chat(geminiSession.id, 'first question'),
    sessions.chat(openaiSession.id, 'second question'),
  ]);

  expect(geminiResult).toMatchObject({
    message: 'gemini:first question',
    threadId: geminiSession.threadId,
    provider: 'gemini',
  });
  expect(openaiResult).toMatchObject({
    message: 'openai:second question',
    threadId: 'openai-thread-1',
    provider: 'openai',
  });
  expect(gemini.chatWithAssistant).toHaveBeenCalledWith('first question', geminiSession.threadId);
  expect(openai.chatWithAssistant).toHaveBeenCalledWith('second question', 'openai-thread-1');
  expect(gemini.chatWithAssistant).not.toHaveBeenCalledWith('second question', expect.anything());
  expect(openai.chatWithAssistant).not.toHaveBeenCalledWith('first question', expect.anything());
});

test('failed OpenAI initialization leaves every session state unchanged', async () => {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  openai.initialize.mockRejectedValueOnce(new Error('OpenAI unavailable'));
  const sessions = new SessionProvider({ gemini, openai });
  const first = await sessions.createSession();
  const second = await sessions.createSession();

  await expect(sessions.selectProvider(first.id, 'openai')).rejects.toThrow('OpenAI unavailable');

  expect(sessions.getSession(first.id)).toMatchObject({
    provider: 'gemini',
    threadId: first.threadId,
  });
  expect(sessions.getSession(second.id)).toMatchObject({
    provider: 'gemini',
    threadId: second.threadId,
  });
});

test('rejects invalid providers before initializing a backend', async () => {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  const sessions = new SessionProvider({ gemini, openai });
  const session = await sessions.createSession();

  await expect(sessions.selectProvider(session.id, 'other')).rejects.toThrow('Unsupported provider.');

  expect(sessions.getSession(session.id).provider).toBe('gemini');
  expect(openai.initialize).not.toHaveBeenCalled();
});

test('serializes chat and provider changes to preserve provider-thread consistency', async () => {
  let finishGeminiChat;
  let markChatStarted;
  const chatStarted = new Promise(resolve => { markChatStarted = resolve; });
  const gemini = createBackend('gemini');
  gemini.chatWithAssistant.mockImplementationOnce(() => new Promise(resolve => {
    finishGeminiChat = resolve;
    markChatStarted();
  }));
  const openai = createBackend('openai');
  const sessions = new SessionProvider({ gemini, openai });
  const session = await sessions.createSession();

  const chat = sessions.chat(session.id, 'pending question');
  await chatStarted;
  const switchProvider = sessions.selectProvider(session.id, 'openai');
  await Promise.resolve();

  expect(openai.initialize).not.toHaveBeenCalled();
  finishGeminiChat({ message: 'gemini answer', threadId: session.threadId });

  await expect(chat).resolves.toMatchObject({
    message: 'gemini answer',
    provider: 'gemini',
    threadId: session.threadId,
  });
  await expect(switchProvider).resolves.toMatchObject({
    provider: 'openai',
    threadId: 'openai-thread-1',
  });
  expect(sessions.getSession(session.id)).toMatchObject({
    provider: 'openai',
    threadId: 'openai-thread-1',
  });
});
