// RAG service that coordinates document processing, embedding, and retrieval
import { DocumentProcessor, DocumentChunk, EmbeddedChunk } from './documentProcessor';
import { VectorStore, SimilarityResult } from './vectorStore';
import { IAiProvider } from '../ai/provider';

export interface RAGContext {
  relevantChunks: SimilarityResult[];
  contextText: string;
  sources: string[];
}

export class RAGService {
  private vectorStore: VectorStore;
  private aiProvider: IAiProvider;
  private isInitialized: boolean = false;
  
  constructor(aiProvider: IAiProvider) {
    this.vectorStore = new VectorStore();
    this.aiProvider = aiProvider;
  }
  
  // Initialize RAG with documentation and codebase
  async initialize(markdown: string, projectContent: string): Promise<void> {
    console.log('Initializing RAG service...');
    
    // Clear existing data
    this.vectorStore.clear();
    
    // Process documents into chunks
    const docChunks = DocumentProcessor.chunkDocumentation(markdown);
    const codeChunks = DocumentProcessor.chunkCodebase(projectContent);
    const allChunks = [...docChunks, ...codeChunks];
    
    console.log(`Processing ${allChunks.length} chunks...`);
    
    // Generate embeddings for all chunks
    const embeddedChunks: EmbeddedChunk[] = [];
    
    for (const chunk of allChunks) {
      try {
        const embedding = await this.aiProvider.generateEmbedding(chunk.content);
        
        embeddedChunks.push({
          ...chunk,
          embedding
        });
      } catch (error) {
        console.warn(`Failed to generate embedding for chunk ${chunk.id}:`, error);
      }
    }
    
    // Add to vector store
    this.vectorStore.addChunks(embeddedChunks);
    
    const stats = this.vectorStore.getStats();
    console.log(`RAG initialized with ${stats.totalChunks} chunks (${stats.docChunks} docs, ${stats.codeChunks} code)`);
    
    this.isInitialized = true;
  }
  
  // Retrieve relevant context for a query
  async retrieveContext(query: string, topK: number = 3): Promise<RAGContext> {
    if (!this.isInitialized) {
      return { relevantChunks: [], contextText: '', sources: [] };
    }
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.aiProvider.generateEmbedding(query);
      
      // Search for similar chunks
      const relevantChunks = this.vectorStore.search(queryEmbedding, topK, 0.3);
      
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
  
  // Check if RAG is ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Get statistics
  getStats() {
    return this.vectorStore.getStats();
  }
  
  // Clear RAG data
  clear(): void {
    this.vectorStore.clear();
    this.isInitialized = false;
  }
}