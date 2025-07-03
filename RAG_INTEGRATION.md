# RAG Integration Guide for AICodeScribe

This document explains how to integrate the minimal RAG (Retrieval Augmented Generation) functionality into AICodeScribe, based on the Docs Agent implementation.

## Overview

The RAG implementation adds semantic search and context retrieval to the existing chat functionality, allowing the AI to provide more accurate answers by referencing relevant parts of the documentation and codebase.

## Architecture

### Core Components

1. **DocumentProcessor** (`services/rag/documentProcessor.ts`)
   - Chunks documentation and code into searchable segments
   - Handles both markdown documentation and JSON project files
   - Splits large sections to stay within token limits

2. **VectorStore** (`services/rag/vectorStore.ts`)
   - In-memory vector storage with cosine similarity search
   - Stores document chunks with embeddings
   - Provides semantic search functionality

3. **RAGService** (`services/rag/ragService.ts`)
   - Orchestrates document processing and retrieval
   - Generates embeddings (with fallback to simple text-based embeddings)
   - Retrieves relevant context for queries

4. **RAGChatSession** (`services/rag/ragChatSession.ts`)
   - Wraps existing chat sessions with RAG capabilities
   - Retrieves context before generating responses
   - Adds source attribution to responses

5. **RAGProvider** (`services/rag/ragProvider.ts`)
   - Wraps existing AI providers with RAG functionality
   - Initializes RAG during documentation generation
   - Returns RAG-enhanced chat sessions

## Integration Steps

### 1. Update AI Provider Factory

Modify `services/ai/index.ts` to include RAG functionality:

```typescript
import { RAGProvider } from '../rag/ragProvider';

export const getAiProvider = (config: IAiProviderConfig, enableRAG: boolean = true): IAiProvider => {
    let baseProvider: IAiProvider;
    
    switch (config.provider) {
        case 'gemini':
            baseProvider = new GeminiProvider(config);
            break;
        case 'openrouter':
            baseProvider = new OpenRouterProvider(config);
            break;
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
    
    // Wrap with RAG functionality if enabled
    if (enableRAG) {
        return new RAGProvider(baseProvider);
    }
    
    return baseProvider;
};
```

### 2. Update App.tsx (Optional)

You can optionally add a toggle to enable/disable RAG:

```typescript
const [enableRAG, setEnableRAG] = useState<boolean>(true);

const aiProvider: IAiProvider | null = useMemo(() => {
    if (!aiConfig) return null;
    return getAiProvider(aiConfig, enableRAG);
}, [aiConfig, enableRAG]);
```

### 3. Add RAG Status Indicator (Optional)

Show RAG status in the UI:

```typescript
// Check if provider is RAG-enabled
const isRAGEnabled = aiProvider && 'isRAGReady' in aiProvider && 
    (aiProvider as any).isRAGReady();

// Show in UI
{isRAGEnabled && (
    <div className="text-xs text-green-400">
        ✓ RAG Enhanced
    </div>
)}
```

## How It Works

### 1. Initialization
- When documentation is generated, RAG processes the markdown and project files
- Documents are chunked into manageable pieces (max 1000 characters)
- Embeddings are generated for each chunk (with simple text-based fallback)
- Chunks are stored in the in-memory vector store

### 2. Query Processing
- When a user asks a question, RAG generates an embedding for the query
- The vector store finds the most similar document chunks (top 3 by default)
- Relevant chunks are combined into contextual information
- The enhanced prompt includes both context and the original question

### 3. Response Enhancement
- The AI generates responses based on retrieved context
- Source attribution is added to show which documents were referenced
- Similarity scores indicate relevance of each source

## Features

### Smart Chunking
- Respects markdown structure (sections, headers)
- Handles large documents by splitting intelligently
- Preserves context with metadata (titles, sections, source type)

### Fallback Embeddings
- Uses AI provider embedding if available
- Falls back to simple text-based similarity matching
- Vocabulary-based vectorization for common code terms

### Context Building
- Retrieves multiple relevant chunks
- Combines with clear source attribution
- Limits context size to stay within token limits

### Source Attribution
- Shows which documents were used
- Includes similarity scores for transparency
- Helps users verify AI responses

## Configuration

### Embedding Strategy
The system automatically detects if the AI provider supports embeddings:
- If available: Uses provider's embedding API
- If not: Uses simple text-based similarity matching

### Search Parameters
- **topK**: Number of chunks to retrieve (default: 3)
- **minSimilarity**: Minimum similarity threshold (default: 0.3)
- **maxChunkSize**: Maximum chunk size in characters (default: 1000)

### Performance
- In-memory storage for fast retrieval
- Cosine similarity for relevance scoring
- Minimal overhead when RAG is disabled

## Testing

To test the RAG functionality:

1. Upload a dependency file and project JSON
2. Generate documentation (this initializes RAG)
3. Ask questions that should reference specific parts of the documentation
4. Look for source attribution in responses
5. Check browser console for RAG initialization messages

## Future Enhancements

1. **Persistent Storage**: Use IndexedDB for client-side persistence
2. **Advanced Embeddings**: Integrate with external embedding APIs
3. **Hybrid Search**: Combine semantic and keyword search
4. **Query Expansion**: Expand user queries for better retrieval
5. **Feedback Loop**: Learn from user interactions to improve retrieval

## Benefits

- **Improved Accuracy**: Responses are grounded in actual documentation
- **Source Attribution**: Users can verify information sources
- **Context Awareness**: AI understands project-specific details
- **Minimal Overhead**: Lightweight implementation with fallbacks
- **Backward Compatible**: Existing functionality remains unchanged

This RAG implementation provides a foundation for semantic search and context-aware responses while maintaining the simplicity and performance of the existing AICodeScribe application.