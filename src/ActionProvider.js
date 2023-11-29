//import React from 'react';
import axios from 'axios';

class ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
      this.createClientMessage = createClientMessage;
      this.sendMessageToBackend = this.sendMessageToBackend.bind(this);
    }
  
    greet() {
      const greetingMessage = this.createChatBotMessage("Hello! How can I help you?");
      this.updateChatbotState(greetingMessage);
    }
  
    handleHelp() {
      const helpMessage = this.createChatBotMessage("Here's some help...");
      this.updateChatbotState(helpMessage);
    }
  
    handleUnknown() {
      const unknownMessage = this.createChatBotMessage("Sorry, I didn't understand that.");
      this.updateChatbotState(unknownMessage);
    }

    async sendMessageToBackend(userMessage) {
        try {
          const response = await axios.post('http://localhost:3001/chat', { message: userMessage });
          const botMessage = response.data.message;
          
          // Method to add the bot's response to the chat
          this.addMessageToChat(botMessage);
        } catch (error) {
          console.error('Error sending message to backend:', error);
          console.log('Error');
          //this.handleUnknown();
          // Handle the error (e.g., by displaying an error message in the chat)
          
          this.addMessageToChat("Caught Exception: Error sending message to backend");
        }
      }
    
      addMessageToChat(message) {
        const chatMessage = this.createChatBotMessage(message);
        this.updateChatbotState(chatMessage);
      }
  
    updateChatbotState(message) {
      this.setState(prevState => ({
        ...prevState,
        messages: [...prevState.messages, message]
      }));
    }
  }
  
  export default ActionProvider;
 