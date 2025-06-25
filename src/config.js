// Config starter code
  
  import { createChatBotMessage } from 'react-chatbot-kit';
  import React from 'react';

  const config = {
    initialMessages: [
      createChatBotMessage(
        <div 
        dangerouslySetInnerHTML={{ __html:`This is a chatbot designed to respond as Xavi Amatriain.<br> 
        <p>For more details on how this chatbot was created, read the <a href="https://amatria.in/blog/aidevelopment" target="_blank" rel="noopener noreferrer">blogpost</a>.It provides
        a link to the codebase in Github among other things.</p>
        <p>If you prefer to ask questions and listen to an audio overview, you should visit my 
        <a href="https://notebooklm.google.com/notebook/56e35827-04fd-4f93-8f7d-9eaab9bf3852?_gl=1*1ojl3rl*_ga*ODMwNTc0ODMuMTc0OTI3OTM0Mg..*_ga_W0LDH41ZCB*czE3NDkyNzkzNDIkbzEkZzAkdDE3NDkyNzkzNDIkajYwJGwwJGgw&pli=1"
        target="_blank" rel="noopener noreferrer">NotebookLM notebook</a>
        </p>
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
  
