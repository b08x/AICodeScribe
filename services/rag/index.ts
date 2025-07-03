// Main exports for RAG services
export { RAGService } from './ragService';
export { EnhancedRAGService } from './enhancedRagService';
export type { EnhancedRAGConfig } from './enhancedRagService';
export { RAGProvider } from './ragProvider';
export { RAGChatSession } from './ragChatSession';
export { PersistentVectorStore } from './persistentVectorStore';
export type { VectorStoreConfig } from './persistentVectorStore';
export { DocumentProcessor, DocumentChunk, EmbeddedChunk } from './documentProcessor';
export { VectorStore, SimilarityResult } from './vectorStore';

// Utility function to create enhanced RAG service configuration
export const createEnhancedRAGConfig = (usePersistentStorage: boolean = false): EnhancedRAGConfig => {
  const config: EnhancedRAGConfig = {
    usePersistentStorage,
    batchSize: 10,
    embeddingModel: 'text-embedding-004',
    maxRetries: 3,
    retryDelay: 1000
  };

  if (usePersistentStorage) {
    config.vectorStoreConfig = {
      dbName: 'AICodeScribeVectorDB',
      version: 1,
      storeName: 'embeddings',
      enableMD5Hashing: true,
      enableIncrementalUpdates: true
    };
  }

  return config;
};

// Utility function to validate persistent storage environment
export const validatePersistentStorageEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check IndexedDB support
  if (typeof window !== 'undefined' && !window.indexedDB) {
    errors.push('IndexedDB is not supported in this browser');
  }

  // Check storage API support
  if (typeof window !== 'undefined' && !('storage' in navigator)) {
    errors.push('Storage API is not supported in this browser');
  }

  if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
    errors.push('GEMINI_API_KEY or API_KEY environment variable is required for embeddings');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Utility function to get recommended RAG configuration
export const getRecommendedRAGConfig = (projectType: 'small' | 'medium' | 'large' = 'medium'): EnhancedRAGConfig => {
  const baseConfig = {
    embeddingModel: 'text-embedding-004',
    usePersistentStorage: true,
    maxRetries: 3,
    retryDelay: 1000
  };

  switch (projectType) {
    case 'small':
      return {
        ...baseConfig,
        batchSize: 5,
        vectorStoreConfig: {
          dbName: 'AICodeScribeVectorDB_Small',
          version: 1,
          storeName: 'embeddings',
          enableMD5Hashing: true,
          enableIncrementalUpdates: true
        }
      };
    case 'medium':
      return {
        ...baseConfig,
        batchSize: 10,
        vectorStoreConfig: {
          dbName: 'AICodeScribeVectorDB',
          version: 1,
          storeName: 'embeddings',
          enableMD5Hashing: true,
          enableIncrementalUpdates: true
        }
      };
    case 'large':
      return {
        ...baseConfig,
        batchSize: 15,
        vectorStoreConfig: {
          dbName: 'AICodeScribeVectorDB_Large',
          version: 1,
          storeName: 'embeddings',
          enableMD5Hashing: true,
          enableIncrementalUpdates: true
        }
      };
    default:
      return baseConfig;
  }
};

// Utility function to estimate storage requirements
export const estimateStorageRequirements = (
  numDocuments: number, 
  avgDocumentSize: number, 
  embeddingDimensions: number = 768
): { estimatedSize: string; recommendation: string } => {
  // Rough calculation: text content + embedding vectors + metadata
  const textSizeBytes = numDocuments * avgDocumentSize;
  const embeddingSizeBytes = numDocuments * embeddingDimensions * 4; // 4 bytes per float
  const metadataSizeBytes = numDocuments * 200; // rough estimate for metadata
  
  const totalSizeBytes = textSizeBytes + embeddingSizeBytes + metadataSizeBytes;
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  
  let recommendation = '';
  if (totalSizeMB < 10) {
    recommendation = 'Small project - all storage options suitable';
  } else if (totalSizeMB < 100) {
    recommendation = 'Medium project - persistent storage recommended';
  } else {
    recommendation = 'Large project - persistent storage required, consider chunking strategy';
  }
  
  return {
    estimatedSize: `${totalSizeMB.toFixed(2)} MB`,
    recommendation
  };
};