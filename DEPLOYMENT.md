# Deployment Guide

## Backend

Deploy backend first.

```bash
git push origin main

gcloud builds submit --config cloudbuild.yaml

gcloud run deploy xavibot-backend \
  --image us-central1-docker.pkg.dev/xavibot-personal/xavibot/app-image:latest \
  --region us-central1 \
  --platform managed
```

Verify:

```bash
curl https://xavibot-backend-852440180218.us-central1.run.app/health
```

Keep backend-only secrets in Cloud Run or Secret Manager:
- `XAVIBOT_API_KEY`
- `GEMINI_API_KEY` or Secret Manager access
- optional OpenAI variables
- `CORS_ORIGIN=https://amatria.in`

## Frontend

Frontend deploys through GitHub Pages on pushes to `main`.

```bash
git push origin main
```

Then verify GitHub Actions:
- workflow: `Deploy to GitHub Pages`
- Node version: `22`

## Deployment order

1. Deploy backend
2. Deploy frontend

Do not deploy the new frontend before the backend is live, because the frontend depends on `/session/init`.

## Security notes

- Do not expose `XAVIBOT_API_KEY` in frontend code or frontend build variables.
- Browser clients should use the server-managed `/session/init` flow.
- The backend owns the real API key.
