# Backend Switching Guide

This project now supports switching between OpenAI and Google Gemini backends using a simple configuration flag.

## Configuration

The backend is selected using the `BACKEND_TYPE` environment variable:

- `BACKEND_TYPE=openai` - Use OpenAI GPT-4o-mini with Assistant API
- `BACKEND_TYPE=gemini` - Use Google Gemini 1.5 Flash with hybrid caching

## Running the Application

### Development Mode

**Using OpenAI (default):**
```bash
npm run dev
# or explicitly
npm run dev-openai
```

**Using Gemini:**
```bash
npm run dev-gemini
```

### Testing Backend Switching

To test that both backends work correctly:
```bash
npm run test-backends
```

## Environment Variables

### OpenAI Backend
- `OPENAI_API_KEY` - Retrieved from Google Cloud Secret Manager
- `OPENAI_MODEL` - Model to use (default: `gpt-4o-mini`)

### Gemini Backend
- `GEMINI_API_KEY` - Retrieved from Google Cloud Secret Manager
- `GEMINI_MODEL` - Model to use (default: `gemini-1.5-flash`)

## Backend Differences

### OpenAI Backend
- Uses OpenAI Assistant API with file search capabilities
- Supports vector store for knowledge base
- Maintains conversation history through OpenAI threads
- More expensive but more powerful features

### Gemini Backend
- Uses Google Gemini with in-memory conversation history
- Loads knowledge base PDFs directly into context
- Hybrid approach: knowledge base cached in memory, sent only on first message
- More cost-effective, faster responses
- No external vector store needed

## Migration Strategy

1. **Start with OpenAI** (current production setup)
2. **Test Gemini locally** using `npm run dev-gemini`
3. **Compare performance and cost** between both backends
4. **Gradually migrate** by setting `BACKEND_TYPE=gemini` in production
5. **Monitor and optimize** based on usage patterns

## File Structure

```
src/server/
├── app.js                 # Main server with backend switching
├── config.js              # Configuration for both backends
├── backend-switcher.js    # Backend selection logic
├── openai-backend.js      # OpenAI implementation
├── gemini-backend.js      # Gemini implementation
└── test-backend-switching.js # Test script
```

## Troubleshooting

### OpenAI Quota Issues
If you encounter OpenAI quota errors, switch to Gemini:
```bash
npm run dev-gemini
```

### Gemini API Key
Make sure you have a Gemini API key stored in Google Cloud Secret Manager:
- Secret name: `projects/xavibot-personal/secrets/GEMINI_API_KEY/versions/latest`

### Knowledge Base Files
For Gemini backend, ensure these files exist in `src/server/`:
- `xamatriain.pdf`
- `xamatriain_guide.pdf`
- `blog.pdf`

## Performance Comparison

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| Response Time | ~5-15s | ~2-5s |
| Cost | Higher | Lower |
| Knowledge Base | Vector Store | Direct Context |
| Conversation History | OpenAI Threads | In-Memory |
| File Search | Built-in | Manual Context |
| Scalability | High | Medium |

## Production Deployment

To deploy with a specific backend:

**Google Cloud Run with OpenAI:**
```bash
gcloud run deploy xavibot --set-env-vars BACKEND_TYPE=openai
```

**Google Cloud Run with Gemini:**
```bash
gcloud run deploy xavibot --set-env-vars BACKEND_TYPE=gemini
``` 