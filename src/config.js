
  
  
  // Config starter code
  import { createChatBotMessage } from "react-chatbot-kit";
  
  const config = {
    initialMessages: [createChatBotMessage(`Hello human`)],
    botName: 'XaviBot',
    customStyles: {
        botMessageBox: {
          backgroundColor: '#376B7E',
        },
        chatButton: {
          backgroundColor: '#5ccc9d',
        },
      },
  }
  
  export default config
  