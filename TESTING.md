# Regression Test Checklist

## Automated, non-billable checks

Provider SDK calls are mocked by the test suite.

```bash
CI=true npm test -- --runInBand --watchAll=false
npm run build
```

Coverage includes:

- Gemini default for every new browser session
- concurrent sessions on different providers
- invalid-provider rejection
- failed OpenAI initialization retaining Gemini state
- provider and conversation isolation
- structured provider API responses
- selector rendering, success, and failure behavior

## Authorized post-deploy smoke test

Do not run these checks as part of routine development: normal questions can call billable provider APIs. Run only after deployment is explicitly authorized.

Open `https://amatria.in/Xavibot/` and verify:

1. The app leaves `Initializing chatbot...` and shows Gemini selected.
2. A Gemini question succeeds.
3. Selecting OpenAI updates only that browser session and creates a fresh conversation.
4. A separate browser session remains on Gemini.
5. Selecting Gemini again creates a fresh Gemini conversation.
6. `/useGemini` and `/useOpenAI` direct the visitor to the visible selector.

## Browser network checks

Inspect:

- `POST /session/init`
- `GET /session/state`
- `POST /session/provider`
- `POST /chatWithAssistant`

Expected:

- session init returns `provider: "gemini"`
- provider selection returns explicit provider and conversation state
- invalid providers return `400`
- unavailable providers return a generic `503` while retaining the current provider
- missing or instance-unknown sessions return `401` and never fall back to a process default

## Frontend build check

```bash
npm ci
REACT_APP_API_URL=https://xavibot-backend-852440180218.us-central1.run.app npm run build
```

## Non-billable backend health check

```bash
curl https://xavibot-backend-852440180218.us-central1.run.app/health
```

## Known failure patterns

- Stuck on `Initializing chatbot...`
  - check `/session/init`
  - likely backend not deployed or CORS issue
- Browser gets `401` from session routes
  - the session may have expired or the request may have reached another Cloud Run instance
  - requests fail closed; multi-instance continuity needs shared state or configured affinity
- GitHub Pages build fails with `crypto is not defined`
  - check workflow Node version; it should be `22`
