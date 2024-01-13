
  
  
  // Config starter code
  import { createChatBotMessage } from "react-chatbot-kit";
  
  const config = {
    initialMessages: [createChatBotMessage(`This is a chatbot designed to respond as Xavi Amatriain. 
    It uses OpenAI's Assistants API, which is in Beta. If anything fails, and, for example, you get an Unhandled Exception, blame OpenAI.
    For more details on how this chatbot was created, read the blogpost (https://amatriain.net/blog/aidevelopment), which provides
    a link to the codebase in Github among other things.\n 
    
    All that being said, how can I help you human? `)],
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
  