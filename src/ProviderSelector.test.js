import { fireEvent, render, screen } from '@testing-library/react';
import ProviderSelector from './ProviderSelector';

test('renders Gemini and OpenAI and requests a session provider change', async () => {
  const onSelect = jest.fn().mockResolvedValue(undefined);
  render(<ProviderSelector provider="gemini" onSelect={onSelect} />);

  const selector = screen.getByRole('combobox', { name: /ai provider/i });
  expect(selector.value).toBe('gemini');
  expect(screen.getByRole('option', { name: 'Gemini' })).toBeTruthy();
  expect(screen.getByRole('option', { name: 'OpenAI' })).toBeTruthy();

  fireEvent.change(selector, { target: { value: 'openai' } });

  expect(onSelect).toHaveBeenCalledWith('openai');
});

test('disables provider changes while a switch is pending', () => {
  render(<ProviderSelector provider="gemini" onSelect={jest.fn()} isSwitching />);

  expect(screen.getByRole('combobox', { name: /ai provider/i }).disabled).toBe(true);
  expect(screen.getByText('Switching provider…')).toBeTruthy();
});
