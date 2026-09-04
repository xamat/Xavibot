import { render, screen } from '@testing-library/react';
import config from './config';
import MessageParser from './MessageParser';

test('presents Gemini as the only available backend', () => {
  render(config.initialMessages[0].message);

  const backendStatus = screen.getByText('Gemini').closest('p');
  expect(backendStatus.textContent.replace(/\s+/g, ' ')).toContain('AI backend: Gemini');
  expect(screen.queryByText(/OpenAI/i)).toBeNull();
});

test('does not allow the OpenAI switch command', () => {
  const actionProvider = {
    addBotMessage: jest.fn(),
    handleBackendSwitch: jest.fn(),
    sendMessageToAssistantBackend: jest.fn(),
  };

  new MessageParser(actionProvider).parse('/useOpenAI');

  expect(actionProvider.handleBackendSwitch).not.toHaveBeenCalled();
  expect(actionProvider.sendMessageToAssistantBackend).not.toHaveBeenCalled();
  expect(actionProvider.addBotMessage).toHaveBeenCalledWith('Gemini is the only available backend.');
});
