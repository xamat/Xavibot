// Config starter code
  
  import { createChatBotMessage } from 'react-chatbot-kit';

  const config = {
    initialMessages: [
      createChatBotMessage(
        <div 
        dangerouslySetInnerHTML={{ __html:`This is a chatbot designed to respond as Xavi Amatriain.<br> 
        <p>For more details on how this chatbot was created, read the <a href="https://amatria.in/blog/aidevelopment" target="_blank" rel="noopener noreferrer">blogpost</a>.It provides
        a link to the codebase in Github among other things.</p>
        All that being said, how can I help you today, human? `
         }}>
      </div>
      ),
      
    ],
    // ... other config options
    botName: 'XaviBot',
    customStyles: {
        botMessageBox: {
          backgroundColor: '#376B7E',
        },
        chatButton: {
          backgroundColor: '#5ccc9d',
        },
      },
      state: {
        gist: '',
        infoBox: '',
      },
      widgets: [],
  };

  
  export default config;
  
