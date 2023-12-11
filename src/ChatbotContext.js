// ChatbotContext.js
import React from 'react';

const ChatbotContext = React.createContext({
  threadId: null,
  setThreadId: () => {},
});

export default ChatbotContext;