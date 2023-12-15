import React, { useEffect, useState } from 'react';
import ChatbotContext from './ChatbotContext';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import axios from 'axios';

function ChatbotContainer() {
    const [threadId, setThreadId] = useState(null);
    //const [assistantId, setAssistantId] = useState(null);
    //const [runId, setRunId] = useState(null);

    useEffect(() => {
      const initializeChatbot = async () => {
        try {
          // Step 1: Create Assistant
          // Create Assistant and store its ID
            const apiUrl = process.env.REACT_APP_API_URL;
            console.log("Creating assistant. Calling backend in:", apiUrl);
  
            const assistantResponse = await axios.post(`${apiUrl}/create-assistant`);
            const newAssistantId = assistantResponse.data;  // Assuming this is the ID
            //setAssistantId(newAssistantId);
            console.log("Assistant created with ID:", newAssistantId);
  
          // Step 2: Create Thread and Update Context
          const threadResponse = await axios.post(`${apiUrl}/create-thread`);
          setThreadId(threadResponse.data);
          console.log("Thread created with ID:", threadResponse.data);
  
        } catch (error) {
          console.error('Error initializing chatbot:', error);
        }
      };
  
      initializeChatbot();
    }, [setThreadId]);

  return (
    <ChatbotContext.Provider value={{ threadId, setThreadId }}>
      <Chatbot
        config={config}
        actionProvider={ActionProvider}
        messageParser={MessageParser}
      />
    </ChatbotContext.Provider>
  );
}


  
 export default ChatbotContainer;