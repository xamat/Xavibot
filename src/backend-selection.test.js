import { render, screen } from '@testing-library/react';
import config from './config';
import MessageParser from './MessageParser';

test('presents Gemini as the default provider', () => {
  render(config.initialMessages[0].message);

  expect(screen.getByText('Default AI provider:')).toBeTruthy();
  expect(screen.getByText('Gemini')).toBeTruthy();
});

test('directs compatibility commands to the session provider selector', () => {
  const actionProvider = {
    addBotMessage: jest.fn(),
    handleBackendSwitch: jest.fn(),
    sendMessageToAssistantBackend: jest.fn(),
  };

  new MessageParser(actionProvider).parse('/useOpenAI');

  expect(actionProvider.handleBackendSwitch).not.toHaveBeenCalled();
  expect(actionProvider.addBotMessage).toHaveBeenCalledWith(
    'Use the AI provider selector above the chat to change this session.'
  );
  expect(actionProvider.sendMessageToAssistantBackend).not.toHaveBeenCalled();
});
