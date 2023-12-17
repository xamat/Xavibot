// MessageParser.js
import React,{ useContext } from 'react';
//import ChatbotContext from './ChatbotContext';
import globalState from './GlobalState';

class MessageParser {
  
  constructor(actionProvider, getContext) {
    this.actionProvider = actionProvider;
  }

  parse(message) {
    //const { threadId, assistantId } = this.getContext();
    const threadId = globalState.threadId;
    const assistantId = globalState.assistantId;

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
      console.log('MessageParser calling ActionProvider with threadId, assistantId: ', threadId, assistantId);
      this.actionProvider.sendMessageToAssistantBackend(message, threadId, assistantId);
      
      //this.actionProvider.handleUnknown();
    }
  }
}
export default MessageParser;

 