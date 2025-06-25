//import React from 'react';
import axios from 'axios';

class ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage, idToken) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
      this.createClientMessage = createClientMessage;
      this.idToken = idToken;
      this.threadId = null;
      this.assistantId = null;
      this.sendMessageToBackend = this.sendMessageToBackend.bind(this);
      this.sendMessageToAssistantBackend = this.sendMessageToAssistantBackend.bind(this);
    }
  
    setThreadId(threadId) {
      this.threadId = threadId;
    }

    setAssistantId(assistantId) {
      this.assistantId = assistantId;
    }

    addBotMessage(message) {
      const botMessage = this.createChatBotMessage(message);
      this.updateChatbotState(botMessage);
    }
  
    greet() {
      const greetingMessage = this.createChatBotMessage("Hello! How can I help you?");
      this.updateChatbotState(greetingMessage);
    }
  
    handleHello() {
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
      const apiUrl = process.env.REACT_APP_API_URL;  
      
      try {
        const response = await axios.post(`${apiUrl}/chatWithAssistant`, {
          message: userMessage,
          threadId: this.threadId,
          assistantId: this.assistantId
        });
        
        if (response.data && response.data.message) {
          this.addBotMessage(response.data.message);
        } else {
          this.addBotMessage('Sorry, I received an empty response from the server.');
        }
      } catch (error) {
        console.error('Error communicating with backend:', error);
        this.addBotMessage('Sorry, I encountered an error while processing your message.');
      }
    }

    async sendMessageToAssistantBackend(userMessage) {
      const apiUrl = process.env.REACT_APP_API_URL;
      
      try {
        const response = await axios.post(`${apiUrl}/chatWithAssistant`, {
          message: userMessage,
          threadId: this.threadId,
          assistantId: this.assistantId
        });
        
        if (response.data && response.data.message) {
          this.addBotMessage(response.data.message);
        } else {
          this.addBotMessage('Sorry, I received an empty response from the server.');
        }
      } catch (error) {
        console.error('Error communicating with assistant backend:', error);
        this.addBotMessage('Sorry, I encountered an error while processing your message.');
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
 