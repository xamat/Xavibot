// MessageParser.js
import { useContext } from 'react';
import ChatbotContext from './ChatbotContext';

class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
    const { threadId } = useContext(ChatbotContext); // Access threadId
    this.threadId = threadId;
    const { assistantId } = useContext(ChatbotContext); // Access assistantId
    this.assistantId = assistantId;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello")) {
      this.actionProvider.greet();
    } else if (lowerCaseMessage.includes("help")) {
      this.actionProvider.handleHelp();
    } else {
      // Send the message to the backend
      //console.log('MessageParser calling ActionProvider with threaId',this.threadId);
      //this.actionProvider.sendMessageToBackend(message);

      //Use assistant instead
      console.log('MessageParser calling ActionProvider with threadId, runId: ', this.threadId, this.assistantId);
      this.actionProvider.sendMessageToAssistantBackend(message, this.threadId, this.assistantId);
      //this.actionProvider.handleUnknown();
    }
  }
}
  
  export default MessageParser;

 