# Session provider selection

## Production behavior

Gemini is the immutable startup provider and the default for every new browser session. The UI exposes a Gemini/OpenAI selector after session initialization. Selecting OpenAI changes only the current browser session; it does not mutate process configuration or another session.

Provider state is explicit in the browser API:

- `POST /session/init` creates a Gemini session and returns `sessionId`, `provider`, `assistantId`, and `threadId`.
- `GET /session/state` returns the current session state.
- `POST /session/provider` accepts `sessionId` and `provider` (`gemini` or `openai`). A successful change creates a fresh provider conversation.
- `POST /chatWithAssistant` dispatches through the provider and thread recorded for that session.

The former process-global runtime switcher and `BACKEND_TYPE` override are not used. Compatibility slash commands direct visitors to the visible selector so UI and server state cannot diverge.

If OpenAI initialization or conversation creation fails, the server leaves that session's provider and Gemini thread unchanged. Client responses are generic and do not include SDK errors or credentials.

## OpenAI backend

The OpenAI adapter uses the Responses API and durable Conversations API:

- `createThread()` creates an OpenAI conversation.
- `chatWithAssistant()` sends each turn to `responses.create` with that conversation identifier.
- Persona instructions come from `src/server/config.js`.
- Knowledge-base parity uses the pre-provisioned Responses `file_search` vector store.

Required when a session selects OpenAI:

- `OPENAI_API_KEY`
- `OPENAI_VECTOR_STORE_ID`

Optional:

- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_REQUEST_TIMEOUT_MS` (default: `30000`)

The selector does not provision, upload, or modify the vector store.

## Gemini backend

Gemini startup and knowledge-base behavior are unchanged. The local PDFs are uploaded or loaded from the existing cache, and conversation history remains keyed by Gemini thread ID.

## Cloud Run multi-instance boundary

Browser sessions and Gemini conversation history remain process-local. Requests that reach a different Cloud Run instance fail closed with `401` rather than falling back to a process-wide provider, so they cannot cross sessions or accidentally invoke OpenAI. Reliable multi-instance continuity would require a shared session/history store or configured affinity; that infrastructure change is intentionally outside this UI re-enablement.

## Local development

Run the frontend and server with:

```bash
npm run dev
```

All new sessions still start on Gemini. OpenAI initializes lazily only when that session selects it in the UI.

## Rollout boundary

This change does not alter Cloud Run, secrets, vector-store contents, traffic, deployment configuration, or production deployment. Live provider checks remain a separate explicitly authorized step because they may be billable.
