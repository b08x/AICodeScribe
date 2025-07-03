// Simple in-memory vector store for RAG
import { DocumentChunk, EmbeddedChunk } from './documentProcessor';

export interface SimilarityResult {
  chunk: EmbeddedChunk;
  similarity: number;
}

export class VectorStore {
  private chunks: EmbeddedChunk[] = [];
  
  // Add chunks with embeddings
  addChunks(chunks: EmbeddedChunk[]): void {
    this.chunks.push(...chunks);
  }
  
  // Clear all chunks
  clear(): void {
    this.chunks = [];
  }
  
  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  // Search for similar chunks
  search(queryEmbedding: number[], topK: number = 5, minSimilarity: number = 0.5): SimilarityResult[] {
    const results: SimilarityResult[] = [];
    
    for (const chunk of this.chunks) {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({ chunk, similarity });
      }
    }
    
    // Sort by similarity (highest first) and take top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
  
  // Get statistics about the vector store
  getStats(): { totalChunks: number; docChunks: number; codeChunks: number } {
    const docChunks = this.chunks.filter(c => c.metadata.source === 'documentation').length;
    const codeChunks = this.chunks.filter(c => c.metadata.source === 'code').length;
    
    return {
      totalChunks: this.chunks.length,
      docChunks,
      codeChunks
    };
  }
  
  // Get all chunks for debugging
  getAllChunks(): EmbeddedChunk[] {
    return [...this.chunks];
  }
}