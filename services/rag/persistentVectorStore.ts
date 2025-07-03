// Browser-compatible persistent vector store using IndexedDB
import { DocumentChunk, EmbeddedChunk } from './documentProcessor';
import { SimilarityResult } from './vectorStore';

export interface PersistentChunkData {
  id: string;
  content: string;
  title: string;
  section: string;
  source: 'documentation' | 'code';
  type: string;
  size: number;
  embedding: number[];
  md5Hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface VectorStoreConfig {
  dbName: string;
  version: number;
  storeName: string;
  enableMD5Hashing: boolean;
  enableIncrementalUpdates: boolean;
}

export class PersistentVectorStore {
  private db: IDBDatabase | null = null;
  private config: VectorStoreConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = {
      dbName: 'AICodeScribeVectorDB',
      version: 1,
      storeName: 'embeddings',
      enableMD5Hashing: true,
      enableIncrementalUpdates: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log(`IndexedDB '${this.config.dbName}' initialized successfully`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('md5Hash', 'md5Hash', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log(`Created object store '${this.config.storeName}' with indexes`);
        }
      };
    });
  }

  private generateMD5Hash(content: string): string {
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private documentChunkToPersistentData(chunk: EmbeddedChunk): PersistentChunkData {
    const md5Hash = this.config.enableMD5Hashing 
      ? this.generateMD5Hash(chunk.content)
      : '';

    return {
      id: chunk.id,
      content: chunk.content,
      title: chunk.title,
      section: chunk.section,
      source: chunk.metadata.source,
      type: chunk.metadata.type,
      size: chunk.metadata.size,
      embedding: chunk.embedding,
      md5Hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private persistentDataToEmbeddedChunk(data: PersistentChunkData): EmbeddedChunk {
    return {
      id: data.id,
      content: data.content,
      title: data.title,
      section: data.section,
      metadata: {
        source: data.source,
        type: data.type,
        size: data.size
      },
      embedding: data.embedding
    };
  }

  async addChunks(chunks: EmbeddedChunk[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      let addedCount = 0;
      let skippedCount = 0;

      const processChunk = async (chunk: EmbeddedChunk) => {
        const persistentData = this.documentChunkToPersistentData(chunk);

        if (this.config.enableIncrementalUpdates && this.config.enableMD5Hashing) {
          // Check if chunk with same hash already exists
          const existingRequest = store.index('md5Hash').get(persistentData.md5Hash);
          
          return new Promise<void>((resolveChunk) => {
            existingRequest.onsuccess = () => {
              if (existingRequest.result) {
                // Chunk with same content exists, skip
                skippedCount++;
                resolveChunk();
              } else {
                // New content, add it
                const addRequest = store.put(persistentData);
                addRequest.onsuccess = () => {
                  addedCount++;
                  resolveChunk();
                };
                addRequest.onerror = () => {
                  console.warn(`Failed to add chunk ${chunk.id}:`, addRequest.error);
                  resolveChunk();
                };
              }
            };
          });
        } else {
          // Always add/update the chunk
          return new Promise<void>((resolveChunk) => {
            const addRequest = store.put(persistentData);
            addRequest.onsuccess = () => {
              addedCount++;
              resolveChunk();
            };
            addRequest.onerror = () => {
              console.warn(`Failed to add chunk ${chunk.id}:`, addRequest.error);
              resolveChunk();
            };
          });
        }
      };

      // Process all chunks
      const promises = chunks.map(processChunk);
      
      transaction.oncomplete = async () => {
        await Promise.all(promises);
        console.log(`Added ${addedCount} chunks, skipped ${skippedCount} unchanged chunks`);
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
    });
  }

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

  async search(
    queryEmbedding: number[], 
    topK: number = 5, 
    minSimilarity: number = 0.5
  ): Promise<SimilarityResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const allData: PersistentChunkData[] = request.result;
        const results: SimilarityResult[] = [];

        for (const data of allData) {
          const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
          
          if (similarity >= minSimilarity) {
            results.push({
              chunk: this.persistentDataToEmbeddedChunk(data),
              similarity
            });
          }
        }

        // Sort by similarity (highest first) and take top K
        const topResults = results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK);

        resolve(topResults);
      };

      request.onerror = () => {
        reject(new Error(`Search failed: ${request.error}`));
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`Cleared all data from '${this.config.storeName}'`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error}`));
      };
    });
  }

  async getStats(): Promise<{ totalChunks: number; docChunks: number; codeChunks: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      
      const allRequest = store.getAll();
      
      allRequest.onsuccess = () => {
        const allData: PersistentChunkData[] = allRequest.result;
        
        const docChunks = allData.filter(data => data.source === 'documentation').length;
        const codeChunks = allData.filter(data => data.source === 'code').length;
        
        resolve({
          totalChunks: allData.length,
          docChunks,
          codeChunks
        });
      };

      allRequest.onerror = () => {
        reject(new Error(`Failed to get stats: ${allRequest.error}`));
      };
    });
  }

  async getAllChunks(): Promise<EmbeddedChunk[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const allData: PersistentChunkData[] = request.result;
        const chunks = allData.map(data => this.persistentDataToEmbeddedChunk(data));
        resolve(chunks);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all chunks: ${request.error}`));
      };
    });
  }

  async deleteChunksByHash(hashes: string[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const hashIndex = store.index('md5Hash');
      
      let deletedCount = 0;

      const deletePromises = hashes.map(hash => {
        return new Promise<void>((resolveDelete) => {
          const request = hashIndex.getAll(hash);
          request.onsuccess = () => {
            const itemsToDelete = request.result;
            let itemsDeleted = 0;
            
            if (itemsToDelete.length === 0) {
              resolveDelete();
              return;
            }

            itemsToDelete.forEach(item => {
              const deleteRequest = store.delete(item.id);
              deleteRequest.onsuccess = () => {
                itemsDeleted++;
                deletedCount++;
                if (itemsDeleted === itemsToDelete.length) {
                  resolveDelete();
                }
              };
              deleteRequest.onerror = () => {
                itemsDeleted++;
                if (itemsDeleted === itemsToDelete.length) {
                  resolveDelete();
                }
              };
            });
          };
        });
      });

      transaction.oncomplete = async () => {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletedCount} chunks by hash`);
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Delete transaction failed: ${transaction.error}`));
      };
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{ estimatedUsage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        estimatedUsage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    
    return { estimatedUsage: 0, quota: 0 };
  }
}