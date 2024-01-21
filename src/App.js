
import './App.css';

import 'react-chatbot-kit/build/main.css';

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