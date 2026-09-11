import React from 'react';

function ProviderSelector({ provider, onSelect, isSwitching = false, statusMessage = '' }) {
  return (
    <div className="provider-selector">
      <label htmlFor="provider-select">AI provider</label>
      <select
        id="provider-select"
        value={provider}
        disabled={isSwitching}
        onChange={event => onSelect(event.target.value)}
      >
        <option value="gemini">Gemini</option>
        <option value="openai">OpenAI</option>
      </select>
      <span className="provider-status" aria-live="polite">
        {isSwitching ? 'Switching provider…' : statusMessage}
      </span>
    </div>
  );
}

export default ProviderSelector;
