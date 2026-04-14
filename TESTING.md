# Regression Test Checklist

## Quick smoke test after deploy

Open:
- `https://amatria.in/Xavibot/`

Verify:
1. Page loads
2. App does not stay on `Initializing chatbot...`
3. Initial chatbot UI appears
4. Sending `hello` works
5. Sending a normal question works
6. `/useGemini` works
7. `/useOpenAI` works
8. Another normal question works after backend switch

## Browser network checks

In DevTools, inspect:
- `POST /session/init`
- `POST /chatWithAssistant`
- `POST /switch-backend`

Expected:
- HTTP 200 responses
- no 401 for browser traffic
- no missing route / 404 on `/session/init`

## Frontend build check

```bash
npm ci
REACT_APP_API_URL=https://xavibot-backend-852440180218.us-central1.run.app npm run build
```

## Backend check

```bash
curl https://xavibot-backend-852440180218.us-central1.run.app/health
```

## Known failure patterns

- Stuck on `Initializing chatbot...`
  - check `/session/init`
  - likely backend not redeployed or CORS issue

- GitHub Pages build fails with `crypto is not defined`
  - check workflow Node version
  - should be `22`

- Browser gets 401 from chat routes
  - browser should use server session id flow, not `x-api-key`
