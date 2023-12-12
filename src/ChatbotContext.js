// ChatbotContext.js
import React from 'react';

const ChatbotContext = React.createContext({
  threadId: null,
  setThreadId: () => {},
  runId: null,
  setRunId: () => {},
  assistantId: null,
  setAssistantId: () => {},
});

export default ChatbotContext;