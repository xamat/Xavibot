import React, { useEffect, useState } from 'react';
import ChatbotContext from './ChatbotContext';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import axios from 'axios';

function ChatbotContainer() {
    const [threadId, setThreadId] = useState(null);
    const [assistantId, setAssistantId] = useState(null);
    const [runId, setRunId] = useState(null);

    useEffect(() => {
      const initializeChatbot = async () => {
        try {
          // Step 1: Create Assistant
          // Create Assistant and store its ID
            const assistantResponse = await axios.post('http://localhost:3001/create-assistant');
            const newAssistantId = assistantResponse.data;  // Assuming this is the ID
            setAssistantId(newAssistantId);
            console.log("Assistant created with ID:", newAssistantId);
  
          // Step 2: Create Thread and Update Context
          const threadResponse = await axios.post('http://localhost:3001/create-thread');
          setThreadId(threadResponse.data);
          console.log("Thread created with ID:", threadResponse.data);
  
          // Step 3: Create Run
          // Create run with both assistantId and threadId
          //const runResponse = await axios.post('http://localhost:3001/create-run', { threadId: threadResponse.data, assistantId: newAssistantId });
          //setRunId(runResponse.data)
          //console.log("Run created");
  
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

//function ChatbotContainer() {
    /* const [isReadyForChatbot, setIsReadyForChatbot] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [assistantId, setAssistantId] = useState(null);
  
    useEffect(() => {
      const initializeChatbot = async () => {
        try {
          // Create assistant and store its ID
          const assistantResponse = await axios.post('http://localhost:3001/create-assistant');
          const assistantId = assistantResponse.data;  // Assuming this is the ID
          setAssistantId(assistantId);
          console.log("Assistant created with ID:", assistantId);
  
          // Create thread and store its ID
          const threadResponse = await axios.post('http://localhost:3001/create-thread');
          setThreadId(threadResponse.data);
          console.log("Thread created with ID:", threadResponse.data);
  
          // Create run with both assistantId and threadId
          await axios.post('http://localhost:3001/create-run', { threadId: threadResponse.data, assistantId: assistantId });
          console.log("Run created");
  
          setIsReadyForChatbot(true);
        } catch (error) {
          console.error('Error initializing chatbot:', error);
        }
      };
  
      initializeChatbot();
    }, []);
  
    if (!isReadyForChatbot) {
      return <div>Loading...</div>;
    }
   */
    // Instantiate ActionProvider and MessageParser outside JSX
  
    //For now try to use threadId NULL
    //const threadId = null;
  
    //const actionProviderInstance = new ActionProvider();
    //const messageParserInstance = new MessageParser(actionProviderInstance, { threadId });
    //const messageParserInstance = new MessageParser(null, { threadId });
    
    /* const createMessageParser = () => {
      return new MessageParser(actionProviderInstance, { threadId });
    }; */
  
    /* const createMessageParser = () => {
      return new MessageParser(null, { threadId });
    }; 
  
    return (
      <div>
        <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
        />
      </div>
    ); */
  
    /* return (
      <div>
        <Chatbot 
          config={config}
          actionProvider={actionProviderInstance} // Pass the instance
          messageParser={messageParserInstance} // Pass the instance
        />
      </div>
    ); */
  //}
  
 export default ChatbotContainer;