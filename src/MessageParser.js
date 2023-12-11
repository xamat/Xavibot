
// MessageParser.js
import React, { useContext } from 'react';
import ChatbotContext from './ChatbotContext';

class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
    this.threadId = this.context.threadId;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello")) {
      this.actionProvider.greet();
    } else if (lowerCaseMessage.includes("help")) {
      this.actionProvider.handleHelp();
    } else {
      // Send the message to the backend
      console.log('MessageParser calling ActionProvider with threaId',this.state.threadId);
      this.actionProvider.sendMessageToBackend(message);

      //Use assistant instead
      //console.log('MessageParser calling ActionProvider with threaId',this.state.threadId);
      //this.actionProvider.sendMessageToAssistantBackend(message, this.state.threadId);
      //this.actionProvider.handleUnknown();
    }
  }
}

/* class MessageParser {
    constructor(actionProvider, state, options) {
      console.log('Constructing Message Parser');
      this.actionProvider = actionProvider;
      this.state = state;
      if (options && 'threadId' in options) {
        console.log('Setting threadId in MessageParser:',options.threadId)
        this.threadId = options.threadId;
      } else {
        // Handle the case where threadId is not provided
        this.threadId = null; // or some default value
      }
    }  
  } */
MessageParser.contextType = ChatbotContext; 
export default MessageParser;

 