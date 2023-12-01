//import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chatbot from 'react-chatbot-kit';

import 'react-chatbot-kit/build/main.css';

import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';

function App() {
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
}

function ChatbotContainer() {
  const [assistantCreated, setAssistantCreated] = useState(false);

  useEffect(() => {
    const createAssistant = async () => {
      try {
        // Make a POST request to create the assistant
        await axios.post('http://localhost:3000/create-assistant', {
          // Your assistant data here
        });
        setAssistantCreated(true);
      } catch (error) {
        console.error('Error creating assistant:', error);
      }
    };

    if (!assistantCreated) {
      createAssistant();
    }
  }, [assistantCreated]);

  return (
    <div>
      {/* Render the Chatbot only if the assistant is created */}
      {assistantCreated && (
        <Chatbot 
          config={config} 
          actionProvider={ActionProvider} 
          messageParser={MessageParser}
        />
      )}
    </div>
  );
}

export default App;
