//import logo from './logo.svg';
import './App.css';
//import Chatbot from 'react-chatbot-kit';

import 'react-chatbot-kit/build/main.css';

//import config from './config.js';
//import MessageParser from './MessageParser.js';
//import ActionProvider from './ActionProvider.js';
import ChatbotContainer from './ChatbotContainer';
 
function App() {
  console.log("APP is called");

  return (
    <div className="App">
      <header className="App-header">
        <ChatbotContainer />
      </header>
    </div>
  ); 
}

export default App;