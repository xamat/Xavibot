import './App.css';
import 'react-chatbot-kit/build/main.css';
import React from 'react';
import ChatbotContainer from './ChatbotContainer';
 
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <ChatbotContainer />
      </header>
    </div>
  ); 
}

export default App;