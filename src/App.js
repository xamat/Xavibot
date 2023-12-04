//import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chatbot from 'react-chatbot-kit';

import 'react-chatbot-kit/build/main.css';

import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';

function ChatbotContainer() {
  console.log("ChatbotContainer is called");

  const [assistantCreated, setAssistantCreated] = useState(false);
  const [threadId, setThreadId] = useState(null);

  
  useEffect(() => {
    const initializeChatbot = async () => {
      if (!assistantCreated) {
        try {
          // Make a POST request to create the assistant
          console.log("Creating assistant from use effect");
          await axios.post('http://localhost:3001/create-assistant', {
            // Your assistant data here
          });
          console.log("Assistant created");
          setAssistantCreated(true);
        } catch (error) {
          console.error('Error creating assistant:', error);
        }
      }

      if (assistantCreated && !threadId) {
        try {
          const threadResponse = await axios.post('http://localhost:3001/create-thread');
          setThreadId(threadResponse.data); // Update based on your actual response structure
          console.log("Assistant and thread created");
          console.log(threadResponse.data);
        } catch (error) {
          console.error('Error creating thread:', error);
        }
      }
    };

    initializeChatbot();
  }, [assistantCreated, threadId]);

  return (
    <div>
      {/* Render the Chatbot only if the assistant and thread are created */}
      {assistantCreated && threadId && (
        <Chatbot 
          config={config} 
          actionProvider={ActionProvider} 
          messageParser={MessageParser}
        />
      )}
    </div>
  );
}


 /* function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Chatbot
          config={config}
          messageParser={MessageParser}
          actionProvider={ActionProvider}
        />
      </header>
    </div>
  );
} */
 

function App() {
  console.log("APP is called");

  return (
    <div className="App">
      <header className="App-header">
        <ChatbotContainer 
        config={config} 
        actionProvider={ActionProvider} 
        messageParser={MessageParser}/>
      </header>
    </div>
  ); 
}

export default App;
