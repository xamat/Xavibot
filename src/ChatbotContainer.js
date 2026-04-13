import React, { useEffect, useState } from 'react';
import globalState from './GlobalState.js';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import api from './api';

function ChatbotContainer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        const sessionResponse = await api.post('/session/init');
        globalState.setSessionId(sessionResponse.data.sessionId);
        globalState.setAssistantId(sessionResponse.data.assistantId);
        globalState.setThreadId(sessionResponse.data.threadId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing chatbot:', error);
      }
    };

    initializeChatbot();
  }, []);

  class CustomActionProvider extends ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage) {
      super(createChatBotMessage, setStateFunc, createClientMessage, null);
      this.setSessionId(globalState.sessionId);
      this.setThreadId(globalState.threadId);
      this.setAssistantId(globalState.assistantId);
    }
  }

  if (!isInitialized) {
    return <div>Initializing chatbot...</div>;
  }

  return (
    <Chatbot
      config={config}
      headerText='Xavibot'
      actionProvider={CustomActionProvider}
      messageParser={MessageParser}
    />
  );
}

export default ChatbotContainer;
