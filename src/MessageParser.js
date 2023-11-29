
import React from 'react';

class MessageParser {
    constructor(actionProvider, state) {
      this.actionProvider = actionProvider;
      this.state = state;
    }
  
    parse(message) {
      const lowerCaseMessage = message.toLowerCase();
  
      if (lowerCaseMessage.includes("hello")) {
        this.actionProvider.greet();
      } else if (lowerCaseMessage.includes("help")) {
        this.actionProvider.handleHelp();
      } else {
        // Send the message to the backend
        this.actionProvider.sendMessageToBackend(message);
        //this.actionProvider.handleUnknown();
      }
    }
  }
  
 export default MessageParser;