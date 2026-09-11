# Backend Switching Guide

## Current production posture

Gemini is the default and production backend. The frontend intentionally exposes only Gemini while the OpenAI migration is validated separately. Do not switch production traffic or re-enable `/useOpenAI` as part of backend implementation work.

The server still supports `BACKEND_TYPE=openai` for isolated validation. Runtime switching creates a fresh provider conversation; it does not carry history between providers.

## OpenAI backend

The OpenAI adapter uses the Responses API and durable Conversations API:

- `createThread()` creates an OpenAI conversation and returns its `conv_...` identifier as the existing `threadId` contract.
- `chatWithAssistant()` sends the user turn to `responses.create` with the conversation identifier.
- Persona instructions are source-controlled in `src/server/config.js` and sent on every response request.
- Knowledge-base parity uses the Responses `file_search` tool and a pre-provisioned vector store.
- Responses are synchronous for this flow; the SDK enforces a bounded request timeout and retries transient failures.

Required for isolated OpenAI validation:

- `OPENAI_API_KEY`
- `OPENAI_VECTOR_STORE_ID` — must identify a populated vector store containing the three knowledge-base PDFs

Optional:

- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_REQUEST_TIMEOUT_MS` (default: `30000`)

The adapter fails initialization when the vector-store ID is absent so knowledge-base behavior cannot be silently dropped. Provisioning/uploading that store is deliberately out of band: server startup does not create billable resources or duplicate files.

## Gemini backend

Gemini behavior is unchanged:

- `BACKEND_TYPE=gemini` remains the default.
- The local PDFs are uploaded/cached through the existing Gemini implementation.
- Gemini retains its existing in-memory conversation history behavior.

## Knowledge base

The source documents remain in `src/server/`:

- `xamatriain.pdf`
- `xamatriain_guide.pdf`
- `blog.pdf`

Gemini consumes these files directly. OpenAI requires equivalent copies to be fully processed in the vector store referenced by `OPENAI_VECTOR_STORE_ID`.

## Local commands

Gemini (default):

```bash
npm run dev-gemini
```

OpenAI, only after configuring an isolated key and populated vector store:

```bash
npm run dev-openai
```

## Rollout boundary

A later controlled rollout must separately:

1. Provision or verify the OpenAI vector store and its three files.
2. Make a non-billable configuration check, then obtain explicit authorization for a billable live response test.
3. Compare persona/file-search behavior, errors, latency, and cost against Gemini.
4. Re-enable the frontend selector in its own reviewed change only after parity is accepted.
5. Change production configuration/traffic only through the normal deployment process.
