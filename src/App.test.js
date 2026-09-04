import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the chatbot initialization state', () => {
  render(<App />);
  const statusElement = screen.getByText(/initializing chatbot/i);
  expect(statusElement).toBeTruthy();
});
