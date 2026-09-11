// MessageParser.js

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
    } else if (lowerCaseMessage === "/usegemini" || lowerCaseMessage === "/useopenai") {
      this.actionProvider.addBotMessage(
        "Use the AI provider selector above the chat to change this session."
      );
    } else {
      // Send the message to the assistant backend
      this.actionProvider.sendMessageToAssistantBackend(message);
    }
  }
}
export default MessageParser;

 