//import React from 'react';
import api from './api';
import globalState from './GlobalState.js';

class ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage, idToken) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
      this.createClientMessage = createClientMessage;
      this.idToken = idToken;
      this.threadId = null;
      this.assistantId = null;
      this.sessionId = null;
      this.sendMessageToBackend = this.sendMessageToBackend.bind(this);
      this.sendMessageToAssistantBackend = this.sendMessageToAssistantBackend.bind(this);
    }

    setThreadId(threadId) {
      this.threadId = threadId;
    }

    setAssistantId(assistantId) {
      this.assistantId = assistantId;
    }

    setSessionId(sessionId) {
      this.sessionId = sessionId;
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
      try {
        console.log('Switching to backend:', backendType);
        this.setThreadId(null);

        const response = await api.post('/switch-backend', {
          backendType,
          sessionId: this.sessionId
        });
        this.addBotMessage(response.data.message);

        if (response.data.threadId) {
          this.setThreadId(response.data.threadId);
          globalState.setThreadId(response.data.threadId);
        }

        if (response.data.assistantId) {
          this.setAssistantId(response.data.assistantId);
          globalState.setAssistantId(response.data.assistantId);
        }

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
      await this.sendMessageToAssistantBackend(userMessage);
    }

    async sendMessageToAssistantBackend(userMessage) {
      try {
        const response = await api.post('/chatWithAssistant', {
          message: userMessage,
          sessionId: this.sessionId
        });

        if (response.data && response.data.threadId) {
          this.setThreadId(response.data.threadId);
          globalState.setThreadId(response.data.threadId);
        }

        if (response.data && response.data.sessionId) {
          this.setSessionId(response.data.sessionId);
          globalState.setSessionId(response.data.sessionId);
        }

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
