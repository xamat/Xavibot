import React, { useEffect, useState } from 'react';
import globalState from './GlobalState.js';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import axios from 'axios';

function ChatbotContainer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;

        // Pre-warm the backend to reduce first message latency
        console.log('Pre-warming backend...');
        await axios.get(`${apiUrl}/prewarm`);
        console.log('Backend pre-warmed successfully');

        // Create Assistant and store its ID
        const assistantResponse = await axios.post(`${apiUrl}/get-assistant`);
        globalState.setAssistantId(assistantResponse.data);
        
        // Create Thread and Update Global State
        const threadResponse = await axios.post(`${apiUrl}/create-thread`);
        globalState.setThreadId(threadResponse.data);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing chatbot:', error);
      }
    };
    
    initializeChatbot();
  }, []);

  // Create a custom ActionProvider class that doesn't require authentication
  class CustomActionProvider extends ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage) {
      super(createChatBotMessage, setStateFunc, createClientMessage, null);
      
      // Set the thread and assistant IDs after initialization
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