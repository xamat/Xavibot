import React, { useEffect } from 'react';
import globalState from './GlobalState.js';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import axios from 'axios';

  function ChatbotContainer() {
    useEffect(() => {
        const initializeChatbot = async () => {
            try {
                const apiUrl = process.env.REACT_APP_API_URL;

                // Create Assistant and store its ID
                const assistantResponse = await axios.post(`${apiUrl}/create-assistant`);
                globalState.setAssistantId(assistantResponse.data);
                console.log('Chatbot Initialized with AssistantId:',globalState.assistantId);

                // Create Thread and Update Global State
                const threadResponse = await axios.post(`${apiUrl}/create-thread`);
                globalState.setThreadId(threadResponse.data);
                console.log('Chatbot Initialized with ThreadId:',globalState.threadId);
            } catch (error) {
                console.error('Error initializing chatbot:', error);
            }
        };
        initializeChatbot();
    }, []);

    return (
        <Chatbot
            config={config}
            actionProvider={ActionProvider}
            messageParser={MessageParser}
        />
    );
  }
  
 export default ChatbotContainer;