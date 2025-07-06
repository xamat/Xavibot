//import React from 'react';
import axios from 'axios';
import globalState from './GlobalState.js';

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
  
    async handleBackendSwitch(backendType) {
      const apiUrl = process.env.REACT_APP_API_URL;
      try {
        console.log('Switching to backend:', backendType);
        
        // Clear the old thread ID first
        this.setThreadId(null);
        
        const response = await axios.post(`${apiUrl}/switch-backend`, { backendType });
        this.addBotMessage(response.data.message);
        
        // Get the new thread ID and assistant ID from the response
        if (response.data.threadId) {
          this.setThreadId(response.data.threadId);
          
          // Also update the global state to keep it in sync
          if (typeof globalState !== 'undefined') {
            globalState.setThreadId(response.data.threadId);
          }
        }
        
        // Get the new assistant ID from the response
        if (response.data.assistantId) {
          this.setAssistantId(response.data.assistantId);
          
          // Also update the global state to keep it in sync
          if (typeof globalState !== 'undefined') {
            globalState.setAssistantId(response.data.assistantId);
          }
        }
        
        // Add a confirmation message that the backend is ready
        this.addBotMessage(`Backend switched to ${backendType}. You can now start chatting!`);
      } catch (error) {
        console.error('Error switching backend:', error);
        this.addBotMessage('Sorry, I encountered an error while switching the backend.');
      }
    }

    handleUnknown() {
      const unknownMessage = this.createChatBotMessage("Sorry, I didn't understand that.");
      this.updateChatbotState(unknownMessage);
    }

    async sendMessageToBackend(userMessage) {
      const apiUrl = process.env.REACT_APP_API_URL;  
      
      // Check if we have a valid thread ID
      if (!this.threadId) {
        try {
          const threadResponse = await axios.post(`${apiUrl}/create-thread`);
          this.setThreadId(threadResponse.data);
          
          // Also update the global state
          globalState.setThreadId(threadResponse.data);
        } catch (threadError) {
          console.error('Error creating thread:', threadError);
          this.addBotMessage('Error: Could not create a thread. Please try again.');
          return;
        }
      }
      
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
 