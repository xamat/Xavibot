// globalState.js
const globalState = {
  threadId: null,
  assistantId: null,
  sessionId: null,
  provider: 'gemini',
  setThreadId(id) { this.threadId = id; },
  setAssistantId(id) { this.assistantId = id; },
  setSessionId(id) { this.sessionId = id; },
  setProvider(provider) { this.provider = provider; }
};

export default globalState;
