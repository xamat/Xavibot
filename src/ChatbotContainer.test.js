import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatbotContainer from './ChatbotContainer';
import api from './api';

jest.mock('./api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('react-chatbot-kit', () => ({
  __esModule: true,
  default: function MockChatbot() {
    return <div>Chatbot ready</div>;
  },
  createChatBotMessage: message => ({ message }),
}));

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

test('initializes only one session under React StrictMode', async () => {
  api.post
    .mockResolvedValueOnce({
      data: {
        sessionId: 'strict-session',
        assistantId: 'gemini-assistant',
        threadId: 'gemini-thread',
        provider: 'gemini',
      },
    })
    .mockResolvedValueOnce({
      data: {
        sessionId: 'strict-session',
        assistantId: 'openai-assistant',
        threadId: 'openai-thread',
        provider: 'openai',
        message: 'This session is now using OpenAI.',
      },
    });

  render(
    <React.StrictMode>
      <ChatbotContainer />
    </React.StrictMode>
  );

  const selector = await screen.findByRole('combobox', { name: /ai provider/i });
  expect(api.post).toHaveBeenCalledTimes(1);

  fireEvent.change(selector, { target: { value: 'openai' } });

  await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/session/provider', {
    sessionId: 'strict-session',
    provider: 'openai',
  }));
  await screen.findByText('This session is now using OpenAI.');
});

test('initializes on Gemini and switches only its session through the structured API', async () => {
  api.post
    .mockResolvedValueOnce({
      data: {
        sessionId: 'session-one',
        assistantId: 'gemini-assistant',
        threadId: 'gemini-thread',
        provider: 'gemini',
      },
    })
    .mockResolvedValueOnce({
      data: {
        sessionId: 'session-one',
        assistantId: 'openai-assistant',
        threadId: 'openai-thread',
        provider: 'openai',
        message: 'This session is now using OpenAI.',
      },
    });

  render(<ChatbotContainer />);

  const selector = await screen.findByRole('combobox', { name: /ai provider/i });
  expect(selector.value).toBe('gemini');
  fireEvent.change(selector, { target: { value: 'openai' } });

  await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/session/provider', {
    sessionId: 'session-one',
    provider: 'openai',
  }));
  await waitFor(() => expect(selector.value).toBe('openai'));
  expect(screen.getByText('This session is now using OpenAI.')).toBeTruthy();
});

test('keeps Gemini selected when OpenAI initialization fails', async () => {
  api.post
    .mockResolvedValueOnce({
      data: {
        sessionId: 'session-two',
        assistantId: 'gemini-assistant',
        threadId: 'gemini-thread',
        provider: 'gemini',
      },
    })
    .mockRejectedValueOnce({
      response: {
        data: {
          provider: 'gemini',
          message: 'OpenAI is unavailable. This session is still using Gemini.',
        },
      },
    });

  render(<ChatbotContainer />);
  const selector = await screen.findByRole('combobox', { name: /ai provider/i });

  fireEvent.change(selector, { target: { value: 'openai' } });

  await screen.findByText('OpenAI is unavailable. This session is still using Gemini.');
  expect(selector.value).toBe('gemini');
  expect(api.get).not.toHaveBeenCalled();
});

test('reconciles session state when the provider change response is lost', async () => {
  api.post
    .mockResolvedValueOnce({
      data: {
        sessionId: 'session-three',
        assistantId: 'gemini-assistant',
        threadId: 'gemini-thread',
        provider: 'gemini',
      },
    })
    .mockRejectedValueOnce(new Error('connection reset'));
  api.get.mockResolvedValueOnce({
    data: {
      sessionId: 'session-three',
      assistantId: 'openai-assistant',
      threadId: 'openai-thread',
      provider: 'openai',
    },
  });

  render(<ChatbotContainer />);
  const selector = await screen.findByRole('combobox', { name: /ai provider/i });

  fireEvent.change(selector, { target: { value: 'openai' } });

  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/session/state', {
    headers: { 'x-session-id': 'session-three' },
  }));
  await waitFor(() => expect(selector.value).toBe('openai'));
  expect(screen.getByText('Provider status refreshed. This session is using OpenAI.')).toBeTruthy();
});
