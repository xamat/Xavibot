# Knowledge Base Strategies for Gemini Migration

## Overview

When migrating from OpenAI's Assistant API to Google Gemini, one of the biggest challenges is handling the knowledge base (PDF files). Unlike OpenAI's built-in file search capabilities, Gemini requires manual implementation of knowledge base strategies.

## Current Implementation (Inefficient)

The basic `app-gemini.js` loads and sends the entire knowledge base with every request:

```javascript
// ❌ INEFFICIENT: Loads files on every request
async function loadKnowledgeBase() {
    const files = ['xamatriain.pdf', 'xamatriain_guide.pdf', 'blog.pdf'];
    // ... loads all content and sends with every prompt
}
```

**Problems:**
- **Token Waste**: Paying for the same content repeatedly
- **Cost Inefficient**: High token usage per request
- **Performance**: File I/O on every request
- **Token Limits**: May exceed context limits

## Strategy 1: Cached Knowledge Base

**Best for:** Small to medium knowledge bases, cost optimization

```javascript
// ✅ EFFICIENT: Cache knowledge base in memory
let cachedKnowledgeBase = null;
let knowledgeBaseLastModified = null;

async function loadKnowledgeBaseWithCache() {
    // Check if files have been modified
    const maxModifiedTime = getMaxFileModifiedTime();
    
    if (cachedKnowledgeBase && knowledgeBaseLastModified >= maxModifiedTime) {
        return cachedKnowledgeBase; // Use cached version
    }
    
    // Load fresh content only when files change
    cachedKnowledgeBase = await loadFreshKnowledgeBase();
    knowledgeBaseLastModified = maxModifiedTime;
    return cachedKnowledgeBase;
}
```

**Pros:**
- ✅ Eliminates repeated file I/O
- ✅ Reduces token usage
- ✅ Automatic cache invalidation
- ✅ Simple implementation

**Cons:**
- ❌ Still sends full knowledge base with every request
- ❌ May hit token limits with large files
- ❌ Memory usage scales with file size

## Strategy 2: Chunked Retrieval

**Best for:** Large knowledge bases, semantic search

```javascript
// ✅ EFFICIENT: Only send relevant chunks
const knowledgeChunks = [];

async function findRelevantChunks(query, chunks, topK = 3) {
    // Simple keyword matching (or use embeddings)
    const scoredChunks = chunks.map(chunk => ({
        ...chunk,
        score: calculateRelevanceScore(query, chunk.content)
    }));
    
    return scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}
```

**Pros:**
- ✅ Minimal token usage
- ✅ Scalable to large knowledge bases
- ✅ Context-aware responses
- ✅ Better cost efficiency

**Cons:**
- ❌ More complex implementation
- ❌ Requires relevance scoring
- ❌ May miss relevant information

## Strategy 3: Hybrid Approach

**Best for:** Balanced performance and accuracy

```javascript
async function createSystemPrompt(strategy, userQuery) {
    switch (strategy) {
        case 'cached':
            return await loadKnowledgeBaseWithCache();
        case 'chunked':
            return await findRelevantChunks(userQuery);
        case 'minimal':
            return 'Rely on model training data';
        default:
            return await loadKnowledgeBaseWithCache();
    }
}
```

## Strategy 4: Vector Database Integration

**Best for:** Production systems, advanced semantic search

```javascript
// Using a vector database like Pinecone or Weaviate
async function findRelevantChunksVector(query, topK = 5) {
    const queryEmbedding = await generateEmbedding(query);
    const results = await vectorDB.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true
    });
    
    return results.matches.map(match => ({
        content: match.metadata.content,
        source: match.metadata.source,
        score: match.score
    }));
}
```

## Strategy 5: RAG (Retrieval-Augmented Generation)

**Best for:** Advanced systems, best accuracy

```javascript
async function ragPipeline(userQuery) {
    // 1. Retrieve relevant documents
    const relevantDocs = await findRelevantChunks(userQuery);
    
    // 2. Create context-aware prompt
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    
    // 3. Generate response with context
    const prompt = `Context: ${context}\n\nQuestion: ${userQuery}\n\nAnswer:`;
    
    return await generateResponse(prompt);
}
```

## Cost Comparison

| Strategy | Tokens per Request | Cost Efficiency | Implementation Complexity |
|----------|-------------------|-----------------|---------------------------|
| Full Knowledge Base | 10,000-50,000 | ❌ Poor | ✅ Simple |
| Cached | 10,000-50,000 | ⚠️ Moderate | ✅ Simple |
| Chunked | 1,000-5,000 | ✅ Good | ⚠️ Moderate |
| Vector DB | 500-2,000 | ✅ Excellent | ❌ Complex |
| RAG | 500-2,000 | ✅ Excellent | ❌ Complex |

## Recommended Implementation

For your Xavibot project, I recommend starting with **Strategy 2 (Chunked Retrieval)**:

### Phase 1: Basic Chunking
```javascript
// Split PDFs into manageable chunks
const chunks = content.split('\n\n').filter(chunk => 
    chunk.trim().length > 50
);
```

### Phase 2: Simple Keyword Matching
```javascript
// Basic relevance scoring
function calculateRelevanceScore(query, content) {
    const queryWords = query.toLowerCase().split(' ');
    let score = 0;
    queryWords.forEach(word => {
        if (content.toLowerCase().includes(word)) {
            score += 1;
        }
    });
    return score;
}
```

### Phase 3: Advanced Embeddings (Future)
```javascript
// Use Gemini's embedding model
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
```

## Implementation Steps

1. **Install Dependencies**
   ```bash
   npm install @google/generative-ai
   ```

2. **Create Chunked Knowledge Base**
   ```javascript
   // Pre-process PDFs into chunks
   const knowledgeChunks = await loadKnowledgeBaseChunks();
   ```

3. **Implement Relevance Search**
   ```javascript
   // Find relevant chunks for each query
   const relevantChunks = await findRelevantChunks(userQuery, knowledgeChunks);
   ```

4. **Update System Prompt**
   ```javascript
   // Only include relevant context
   const systemPrompt = createSystemPrompt('chunked', userQuery);
   ```

## Testing Different Strategies

You can test different strategies by modifying the request:

```javascript
// Test different strategies
const response = await fetch('/chatWithAssistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: userMessage,
        threadId: threadId,
        strategy: 'chunked' // or 'cached', 'minimal'
    })
});
```

## Production Considerations

### 1. **Database Storage**
```javascript
// Store chunks in database for persistence
const db = admin.firestore();
await db.collection('knowledge_chunks').add({
    content: chunk.content,
    source: chunk.source,
    embedding: chunk.embedding
});
```

### 2. **Caching Layer**
```javascript
// Redis cache for frequently accessed chunks
const cache = redis.createClient();
await cache.set(`chunk_${chunkId}`, JSON.stringify(chunk));
```

### 3. **Monitoring**
```javascript
// Track token usage and costs
const tokenUsage = {
    input: response.usage.promptTokenCount,
    output: response.usage.candidatesTokenCount,
    total: response.usage.totalTokenCount
};
```

## Migration Path

1. **Start Simple**: Use cached full knowledge base
2. **Optimize**: Implement chunked retrieval
3. **Scale**: Add vector database for semantic search
4. **Advanced**: Implement full RAG pipeline

This approach allows you to migrate incrementally while maintaining functionality and optimizing costs. 