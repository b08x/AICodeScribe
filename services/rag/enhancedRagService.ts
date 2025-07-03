// Enhanced RAG service with persistent storage and text-embedding-004 support
import { DocumentProcessor, DocumentChunk, EmbeddedChunk } from './documentProcessor';
import { VectorStore, SimilarityResult } from './vectorStore';
import { PersistentVectorStore, VectorStoreConfig } from './persistentVectorStore';
import { IAiProvider } from '../ai/provider';

export interface RAGContext {
  relevantChunks: SimilarityResult[];
  contextText: string;
  sources: string[];
}

export interface EnhancedRAGConfig {
  usePersistentStorage: boolean;
  vectorStoreConfig?: Partial<VectorStoreConfig>;
  batchSize?: number;
  embeddingModel?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export class EnhancedRAGService {
  private vectorStore: VectorStore | PersistentVectorStore;
  private aiProvider: IAiProvider;
  private isInitialized: boolean = false;
  private config: EnhancedRAGConfig;
  
  constructor(aiProvider: IAiProvider, config: EnhancedRAGConfig = { usePersistentStorage: false }) {
    this.aiProvider = aiProvider;
    this.config = {
      batchSize: 10,
      embeddingModel: 'text-embedding-004',
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    
    if (config.usePersistentStorage) {
      this.vectorStore = new PersistentVectorStore(config.vectorStoreConfig);
    } else {
      this.vectorStore = new VectorStore();
    }
  }

  // Initialize RAG with documentation and codebase
  async initialize(markdown: string, projectContent: string): Promise<void> {
    console.log('Initializing Enhanced RAG service...');
    
    // Initialize persistent storage if needed
    if (this.vectorStore instanceof PersistentVectorStore) {
      await this.vectorStore.initialize();
    }
    
    // Clear existing data
    await this.vectorStore.clear();
    
    // Process documents into chunks
    const docChunks = DocumentProcessor.chunkDocumentation(markdown);
    const codeChunks = DocumentProcessor.chunkCodebase(projectContent);
    const allChunks = [...docChunks, ...codeChunks];
    
    console.log(`Processing ${allChunks.length} chunks...`);
    
    // Generate embeddings for all chunks with batching and retry logic
    const embeddedChunks = await this.generateEmbeddingsBatch(allChunks);
    
    // Add to vector store
    await this.vectorStore.addChunks(embeddedChunks);
    
    const stats = await this.vectorStore.getStats();
    console.log(`Enhanced RAG initialized with ${stats.totalChunks} chunks (${stats.docChunks} docs, ${stats.codeChunks} code)`);
    
    if (this.vectorStore instanceof PersistentVectorStore) {
      const storageInfo = await this.vectorStore.getStorageInfo();
      console.log(`Storage usage: ${(storageInfo.estimatedUsage / (1024 * 1024)).toFixed(2)} MB`);
    }
    
    this.isInitialized = true;
  }

  // Generate embeddings in batches with retry logic
  private async generateEmbeddingsBatch(chunks: DocumentChunk[]): Promise<EmbeddedChunk[]> {
    const batchSize = this.config.batchSize || 10;
    const embeddedChunks: EmbeddedChunk[] = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);
      
      const batchPromises = batch.map(async (chunk) => {
        return await this.generateEmbeddingWithRetry(chunk);
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null) as EmbeddedChunk[];
      embeddedChunks.push(...validResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await this.delay(200);
      }
    }
    
    return embeddedChunks;
  }

  // Generate embedding with retry logic
  private async generateEmbeddingWithRetry(chunk: DocumentChunk): Promise<EmbeddedChunk | null> {
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const embedding = await this.aiProvider.generateEmbedding(chunk.content);
        
        return {
          ...chunk,
          embedding
        };
      } catch (error) {
        console.warn(`Failed to generate embedding for chunk ${chunk.id} (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    console.error(`Failed to generate embedding for chunk ${chunk.id} after ${maxRetries} attempts`);
    return null;
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Update existing documents with incremental updates
  async updateDocuments(markdown: string, projectContent: string): Promise<void> {
    if (!this.config.usePersistentStorage) {
      // For in-memory store, just reinitialize
      await this.initialize(markdown, projectContent);
      return;
    }

    console.log('Updating documents with incremental updates...');
    
    // Process new documents
    const docChunks = DocumentProcessor.chunkDocumentation(markdown);
    const codeChunks = DocumentProcessor.chunkCodebase(projectContent);
    const allChunks = [...docChunks, ...codeChunks];
    
    // Generate embeddings for new chunks
    const embeddedChunks = await this.generateEmbeddingsBatch(allChunks);
    
    // PersistentVectorStore will handle MD5 comparison automatically
    await this.vectorStore.addChunks(embeddedChunks);
    
    console.log('Document update completed');
  }

  // Retrieve relevant context for a query
  async retrieveContext(query: string, topK: number = 3): Promise<RAGContext> {
    if (!this.isInitialized) {
      return { relevantChunks: [], contextText: '', sources: [] };
    }
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateQueryEmbeddingWithRetry(query);
      
      if (!queryEmbedding) {
        return { relevantChunks: [], contextText: '', sources: [] };
      }
      
      // Search for similar chunks
      const relevantChunks = await this.vectorStore.search(queryEmbedding, topK, 0.3);
      
      // Build context text
      const contextText = relevantChunks
        .map((result, index) => 
          `[Source ${index + 1}: ${result.chunk.title}]\n${result.chunk.content}`
        )
        .join('\n\n---\n\n');
      
      // Extract sources
      const sources = relevantChunks.map(result => 
        `${result.chunk.title} (${(result.similarity * 100).toFixed(1)}% match)`
      );
      
      return {
        relevantChunks,
        contextText,
        sources
      };
    } catch (error) {
      console.error('Error retrieving context:', error);
      return { relevantChunks: [], contextText: '', sources: [] };
    }
  }

  // Generate query embedding with retry logic
  private async generateQueryEmbeddingWithRetry(query: string): Promise<number[] | null> {
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.aiProvider.generateEmbedding(query);
      } catch (error) {
        console.warn(`Failed to generate query embedding (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt);
        }
      }
    }
    
    console.error(`Failed to generate query embedding after ${maxRetries} attempts`);
    return null;
  }

  // Check if RAG is ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Get statistics
  async getStats() {
    return await this.vectorStore.getStats();
  }
  
  // Clear RAG data
  async clear(): Promise<void> {
    await this.vectorStore.clear();
    this.isInitialized = false;
  }

  // Get configuration info
  getConfig(): EnhancedRAGConfig {
    return { ...this.config };
  }

  // Switch between vector store implementations
  async switchVectorStore(usePersistentStorage: boolean): Promise<void> {
    if (usePersistentStorage === this.config.usePersistentStorage) {
      return; // No change needed
    }

    // Get existing chunks if any
    const existingChunks = await this.vectorStore.getAllChunks();
    
    // Clear current store
    await this.vectorStore.clear();
    
    // Close existing store if persistent
    if (this.vectorStore instanceof PersistentVectorStore) {
      await this.vectorStore.close();
    }
    
    // Create new store
    this.config.usePersistentStorage = usePersistentStorage;
    
    if (usePersistentStorage) {
      this.vectorStore = new PersistentVectorStore(this.config.vectorStoreConfig);
      await this.vectorStore.initialize();
    } else {
      this.vectorStore = new VectorStore();
    }
    
    // Migrate existing chunks if any
    if (existingChunks.length > 0) {
      await this.vectorStore.addChunks(existingChunks);
    }
    
    console.log(`Switched to ${usePersistentStorage ? 'persistent' : 'in-memory'} vector store`);
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const stats = await this.getStats();
    const details: any = {
      initialized: this.isInitialized,
      vectorStore: this.config.usePersistentStorage ? 'persistent (IndexedDB)' : 'in-memory',
      stats: stats,
      config: this.config
    };

    if (this.vectorStore instanceof PersistentVectorStore) {
      try {
        const storageInfo = await this.vectorStore.getStorageInfo();
        details.storageInfo = {
          usage: `${(storageInfo.estimatedUsage / (1024 * 1024)).toFixed(2)} MB`,
          quota: `${(storageInfo.quota / (1024 * 1024)).toFixed(2)} MB`,
          usagePercent: storageInfo.quota > 0 
            ? ((storageInfo.estimatedUsage / storageInfo.quota) * 100).toFixed(1) + '%'
            : 'unknown'
        };
      } catch (error) {
        details.storageInfo = { error: 'Could not retrieve storage info' };
      }
    }

    const healthy = this.isInitialized;

    return { healthy, details };
  }

  // Export data for backup
  async exportData(): Promise<{ chunks: EmbeddedChunk[]; metadata: any }> {
    const chunks = await this.vectorStore.getAllChunks();
    const stats = await this.getStats();
    
    const metadata = {
      exportDate: new Date().toISOString(),
      config: this.config,
      stats: stats,
      version: '1.0'
    };

    return { chunks, metadata };
  }

  // Import data from backup
  async importData(data: { chunks: EmbeddedChunk[]; metadata?: any }): Promise<void> {
    console.log(`Importing ${data.chunks.length} chunks...`);
    
    await this.vectorStore.clear();
    await this.vectorStore.addChunks(data.chunks);
    
    this.isInitialized = true;
    
    const stats = await this.getStats();
    console.log(`Import completed: ${stats.totalChunks} chunks imported`);
  }
}