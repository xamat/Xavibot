import React, { useEffect, useRef, useState } from 'react';
import globalState from './GlobalState.js';
import config from './config.js';
import MessageParser from './MessageParser.js';
import ActionProvider from './ActionProvider.js';
import Chatbot from 'react-chatbot-kit';
import api from './api';
import ProviderSelector from './ProviderSelector.js';

function applyGlobalSessionState(session) {
  globalState.setSessionId(session.sessionId);
  globalState.setAssistantId(session.assistantId);
  globalState.setThreadId(session.threadId);
  globalState.setProvider(session.provider);
}

class SessionActionProvider extends ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    super(createChatBotMessage, setStateFunc, createClientMessage, null);
    this.setSessionId(globalState.sessionId);
    this.setThreadId(globalState.threadId);
    this.setAssistantId(globalState.assistantId);
  }
}

function ChatbotContainer() {
  const initializationStarted = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [provider, setProvider] = useState('gemini');
  const [isSwitching, setIsSwitching] = useState(false);
  const [providerStatus, setProviderStatus] = useState('Using Gemini for this session.');

  useEffect(() => {
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const initializeChatbot = async () => {
      try {
        const sessionResponse = await api.post('/session/init');
        applyGlobalSessionState(sessionResponse.data);
        setProvider(sessionResponse.data.provider);
        setIsInitialized(true);
      } catch (error) {
        console.error('Chatbot session initialization failed.');
      }
    };

    initializeChatbot();
  }, []);

  const handleProviderSelect = async selectedProvider => {
    if (selectedProvider === provider) return;

    setIsSwitching(true);
    setProviderStatus('');
    try {
      const response = await api.post('/session/provider', {
        sessionId: globalState.sessionId,
        provider: selectedProvider,
      });
      applyGlobalSessionState(response.data);
      setProvider(response.data.provider);
      setProviderStatus(response.data.message);
    } catch (error) {
      if (error.response?.data?.provider) {
        setProvider(error.response.data.provider);
        setProviderStatus(error.response.data.message);
      } else {
        try {
          const stateResponse = await api.get('/session/state', {
            headers: { 'x-session-id': globalState.sessionId },
          });
          applyGlobalSessionState(stateResponse.data);
          setProvider(stateResponse.data.provider);
          setProviderStatus(
            `Provider status refreshed. This session is using ${stateResponse.data.provider === 'openai' ? 'OpenAI' : 'Gemini'}.`
          );
        } catch (stateError) {
          setProviderStatus('Provider change failed. Current provider could not be confirmed.');
        }
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isInitialized) {
    return <div>Initializing chatbot...</div>;
  }

  return (
    <>
      <ProviderSelector
        provider={provider}
        onSelect={handleProviderSelect}
        isSwitching={isSwitching}
        statusMessage={providerStatus}
      />
      <Chatbot
        config={config}
        headerText='Xavibot'
        actionProvider={SessionActionProvider}
        messageParser={MessageParser}
      />
    </>
  );
}

export default ChatbotContainer;
