// globalState.js
const globalState = {
  threadId: null,
  assistantId: null,
  sessionId: null,
  setThreadId(id) { this.threadId = id; },
  setAssistantId(id) { this.assistantId = id; },
  setSessionId(id) { this.sessionId = id; }
};

export default globalState;
