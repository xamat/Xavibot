// MessageParser.js
import globalState from './GlobalState';

class MessageParser {
  
  constructor(actionProvider, getContext) {
    this.actionProvider = actionProvider;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello")) {
      this.actionProvider.handleHello();
    } else if (lowerCaseMessage.includes("help")) {
      this.actionProvider.handleHelp();
    } else {
      // Send the message to the assistant backend
      this.actionProvider.sendMessageToAssistantBackend(message);
    }
  }
}
export default MessageParser;

 