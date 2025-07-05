# Migration from OpenAI Assistant API to Google Gemini

## Overview

This guide outlines the migration from OpenAI's Assistant API to Google Gemini for the Xavibot project.

## Key Differences

### OpenAI Assistant API
- **Persistent Assistants**: Create and store assistant configurations
- **Threads**: Persistent conversation threads
- **Runs**: Asynchronous execution with polling
- **File Search**: Built-in vector search capabilities
- **Complex State Management**: Requires managing assistant, thread, and run states

### Google Gemini
- **Stateless Model**: No persistent assistants or threads
- **Chat Sessions**: In-memory conversation history
- **Direct Responses**: Synchronous API calls
- **Context Management**: Manual conversation history management
- **Simpler Architecture**: Direct model interaction

## Migration Steps

### 1. Setup Google Cloud Project

1. Create a new Google Cloud project or use existing one
2. Enable the Gemini API
3. Create an API key in Google AI Studio
4. Store the API key in Google Secret Manager

### 2. Update Dependencies

```bash
npm install @google/generative-ai
npm uninstall openai
```

### 3. Environment Configuration

Update your Google Secret Manager to include:
- Secret name: `GEMINI_API_KEY`
- Project: `xavibot-personal`

### 4. Backend Changes

The new `app-gemini.js` implements:

#### Key Features:
- **Conversation History**: In-memory storage per thread ID
- **Knowledge Base Integration**: Loads PDF files as context
- **System Prompt**: Maintains Xavi's personality and instructions
- **API Compatibility**: Maintains same endpoints for frontend compatibility

#### Architecture Changes:
- Removes OpenAI-specific concepts (assistants, runs, file search)
- Implements conversation history management
- Uses Gemini's chat completion model
- Maintains thread-based conversation isolation

### 5. Testing the Migration

```bash
# Install new dependencies
npm install

# Test Gemini backend
npm run dev-gemini

# Test original OpenAI backend
npm run dev
```

### 6. Deployment Changes

Update your Cloud Run deployment:

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/xavibot-gemini', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/xavibot-gemini']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'xavibot-gemini'
      - '--image'
      - 'gcr.io/$PROJECT_ID/xavibot-gemini'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

## Advantages of Gemini Migration

### 1. **Simplified Architecture**
- No complex state management
- Direct API calls
- Easier debugging and maintenance

### 2. **Cost Benefits**
- Potentially lower costs for similar functionality
- Pay-per-use model
- No persistent resource costs

### 3. **Performance**
- Faster response times (no polling required)
- Synchronous API calls
- Reduced latency

### 4. **Google Cloud Integration**
- Native integration with Google Cloud services
- Better Secret Manager integration
- Unified billing and monitoring

## Limitations and Considerations

### 1. **File Processing**
- Gemini doesn't have built-in file search like OpenAI
- Knowledge base is loaded as text context
- May hit token limits with large files

### 2. **Conversation History**
- In-memory storage (not persistent)
- Lost on server restart
- Consider database storage for production

### 3. **Model Capabilities**
- Different model strengths and weaknesses
- May need prompt engineering adjustments
- Different response formats

## Production Considerations

### 1. **Database Integration**
```javascript
// Example: Store conversation history in Firestore
const db = admin.firestore();
await db.collection('conversations').doc(threadId).set({
  history: conversationHistory,
  updatedAt: new Date()
});
```

### 2. **Rate Limiting**
- Implement rate limiting for API calls
- Monitor usage and costs
- Set up alerts for quota limits

### 3. **Error Handling**
- Handle API quota exceeded errors
- Implement retry logic
- Graceful degradation

### 4. **Monitoring**
- Set up Google Cloud Monitoring
- Track API usage and costs
- Monitor response times and errors

## Rollback Plan

If issues arise, you can easily rollback:

1. Keep the original `app.js` file
2. Switch back to OpenAI dependencies
3. Update environment variables
4. Redeploy with original configuration

## Next Steps

1. **Test thoroughly** with the new Gemini backend
2. **Compare performance** and response quality
3. **Monitor costs** and usage patterns
4. **Implement production features** (database, monitoring)
5. **Update documentation** and deployment scripts

## Support

For issues with the migration:
- Check Google AI documentation
- Review Gemini API quotas and limits
- Monitor Google Cloud Console for errors
- Test with smaller conversations first 