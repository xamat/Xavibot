// MessageParser.js
import React, { useContext } from 'react';
import ChatbotContext from './ChatbotContext';

class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
    const { threadId } = useContext(ChatbotContext); // Access threadId
    this.threadId = threadId;
    /* const { runId } = useContext(ChatbotContext); // Access threadId
    this.runId = runId; */
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
  
  export default MessageParser;

 