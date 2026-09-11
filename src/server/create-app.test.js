const http = require('http');
const { createApp } = require('./create-app');
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

function request(app, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const payload = body === undefined ? null : JSON.stringify(body);
      const req = http.request({
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          ...(payload ? {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload),
          } : {}),
          ...headers,
        },
      }, response => {
        let raw = '';
        response.on('data', chunk => { raw += chunk; });
        response.on('end', () => {
          server.close();
          resolve({ status: response.statusCode, body: raw ? JSON.parse(raw) : null });
        });
      });
      req.on('error', error => {
        server.close();
        reject(error);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

function setup() {
  const gemini = createBackend('gemini');
  const openai = createBackend('openai');
  const sessionProvider = new SessionProvider({ gemini, openai });
  const app = createApp({
    sessionProvider,
    serverConfig: { CORS_ORIGIN: '', API_KEY: undefined },
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
  });
  return { app, gemini, openai, sessionProvider };
}

test('session initialization returns explicit Gemini provider state', async () => {
  const { app, openai } = setup();

  const response = await request(app, '/session/init', {});

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    provider: 'gemini',
    assistantId: 'gemini-assistant',
    threadId: 'gemini-thread-1',
  });
  expect(response.body.sessionId).toEqual(expect.any(String));
  expect(openai.initialize).not.toHaveBeenCalled();
});

test('provider selection changes only the authenticated browser session', async () => {
  const { app } = setup();
  const first = await request(app, '/session/init', {});
  const second = await request(app, '/session/init', {});

  const switched = await request(app, '/session/provider', {
    sessionId: first.body.sessionId,
    provider: 'openai',
  });
  const secondState = await request(app, '/session/state', undefined, {
    'x-session-id': second.body.sessionId,
  });

  expect(switched.status).toBe(200);
  expect(switched.body).toMatchObject({ provider: 'openai', threadId: 'openai-thread-1' });
  expect(secondState.status).toBe(200);
  expect(secondState.body).toMatchObject({ provider: 'gemini', threadId: second.body.threadId });
});

test('session state waits for an in-flight provider change before reconciling', async () => {
  let finishOpenAIThread;
  let markOpenAIThreadStarted;
  const openAIThreadStarted = new Promise(resolve => { markOpenAIThreadStarted = resolve; });
  const { app, openai, sessionProvider } = setup();
  openai.createThread.mockImplementationOnce(() => new Promise(resolve => {
    finishOpenAIThread = resolve;
    markOpenAIThreadStarted();
  }));
  const initialized = await request(app, '/session/init', {});

  const switching = request(app, '/session/provider', {
    sessionId: initialized.body.sessionId,
    provider: 'openai',
  });
  await openAIThreadStarted;

  let markStateReadStarted;
  const stateReadStarted = new Promise(resolve => { markStateReadStarted = resolve; });
  const getSession = sessionProvider.getSession.bind(sessionProvider);
  jest.spyOn(sessionProvider, 'getSession').mockImplementation(sessionId => {
    const session = getSession(sessionId);
    markStateReadStarted();
    return session;
  });
  let stateSettled = false;
  const stateRequest = request(app, '/session/state', undefined, {
    'x-session-id': initialized.body.sessionId,
  }).then(response => {
    stateSettled = true;
    return response;
  });
  await stateReadStarted;
  await new Promise(resolve => setTimeout(resolve, 0));

  const stateSettledBeforeSwitch = stateSettled;
  finishOpenAIThread('openai-thread-delayed');
  const [switched, state] = await Promise.all([switching, stateRequest]);
  expect(stateSettledBeforeSwitch).toBe(false);
  expect(switched.body).toMatchObject({ provider: 'openai', threadId: 'openai-thread-delayed' });
  expect(state.body).toMatchObject({ provider: 'openai', threadId: 'openai-thread-delayed' });
});

test('invalid providers are rejected without changing session state', async () => {
  const { app } = setup();
  const initialized = await request(app, '/session/init', {});

  const rejected = await request(app, '/session/provider', {
    sessionId: initialized.body.sessionId,
    provider: 'other',
  });
  const state = await request(app, '/session/state', undefined, {
    'x-session-id': initialized.body.sessionId,
  });

  expect(rejected.status).toBe(400);
  expect(rejected.body).toEqual({ message: 'Invalid provider. Choose Gemini or OpenAI.' });
  expect(state.body).toMatchObject({ provider: 'gemini', threadId: initialized.body.threadId });
});

test('failed OpenAI initialization keeps that session on Gemini and hides internal errors', async () => {
  const { app, openai } = setup();
  openai.initialize.mockRejectedValueOnce(new Error('secret-bearing SDK failure'));
  const initialized = await request(app, '/session/init', {});

  const rejected = await request(app, '/session/provider', {
    sessionId: initialized.body.sessionId,
    provider: 'openai',
  });
  const state = await request(app, '/session/state', undefined, {
    'x-session-id': initialized.body.sessionId,
  });

  expect(rejected.status).toBe(503);
  expect(rejected.body).toEqual({
    message: 'OpenAI is unavailable. This session is still using Gemini.',
    provider: 'gemini',
  });
  expect(JSON.stringify(rejected.body)).not.toContain('secret-bearing');
  expect(state.body).toMatchObject({ provider: 'gemini', threadId: initialized.body.threadId });
});

test('chat uses only the selected session provider and thread', async () => {
  const { app, gemini, openai } = setup();
  const geminiSession = await request(app, '/session/init', {});
  const openaiSession = await request(app, '/session/init', {});
  await request(app, '/session/provider', {
    sessionId: openaiSession.body.sessionId,
    provider: 'openai',
  });

  const first = await request(app, '/chatWithAssistant', {
    sessionId: geminiSession.body.sessionId,
    message: 'Gemini question',
  });
  const second = await request(app, '/chatWithAssistant', {
    sessionId: openaiSession.body.sessionId,
    message: 'OpenAI question',
  });

  expect(first.body).toMatchObject({ provider: 'gemini', message: 'gemini:Gemini question' });
  expect(second.body).toMatchObject({ provider: 'openai', message: 'openai:OpenAI question' });
  expect(gemini.chatWithAssistant).toHaveBeenCalledWith('Gemini question', geminiSession.body.threadId);
  expect(openai.chatWithAssistant).toHaveBeenCalledWith('OpenAI question', 'openai-thread-1');
});

test('an instance-unknown session fails closed without invoking a provider', async () => {
  const firstInstance = setup();
  const secondInstance = setup();
  const initialized = await request(firstInstance.app, '/session/init', {});

  const response = await request(secondInstance.app, '/chatWithAssistant', {
    sessionId: initialized.body.sessionId,
    message: 'Do not dispatch',
  });

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ message: 'Missing or invalid browser session.' });
  expect(secondInstance.gemini.chatWithAssistant).not.toHaveBeenCalled();
  expect(secondInstance.openai.initialize).not.toHaveBeenCalled();
});

module.exports = { createBackend, request, setup };
