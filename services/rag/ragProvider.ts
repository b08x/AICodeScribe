// RAG-enhanced provider wrapper that adds retrieval capabilities to any AI provider
import { IAiProvider, IChatSession, DocumentationResponse, ChatResponse, IAiProviderConfig } from '../ai/provider';
import { ChatMessage } from '../../components/ChatInterface';
import { RAGService } from './ragService';
import { EnhancedRAGService, EnhancedRAGConfig } from './enhancedRagService';
import { RAGChatSession } from './ragChatSession';

export class RAGProvider implements IAiProvider {
  private chatProvider: IAiProvider;
  private embeddingProvider: IAiProvider;
  private ragService: RAGService | EnhancedRAGService;
  private isRAGEnabled: boolean = false;
  private ragConfig: EnhancedRAGConfig;
  
  constructor(chatProvider: IAiProvider, embeddingProvider: IAiProvider, ragConfig: EnhancedRAGConfig = { usePersistentStorage: false }) {
    this.chatProvider = chatProvider;
    this.embeddingProvider = embeddingProvider;
    this.ragConfig = ragConfig;
    
    if (ragConfig.usePersistentStorage) {
      this.ragService = new EnhancedRAGService(this.embeddingProvider, ragConfig);
    } else {
      this.ragService = new RAGService(this.embeddingProvider);
    }
  }
  
  async generateDocumentation(gemfileContent: string, projectContext: string): Promise<DocumentationResponse> {
    // Generate documentation using the base provider
    const result = await this.chatProvider.generateDocumentation(gemfileContent, projectContext);
    
    // Initialize RAG service with the generated documentation and project context
    try {
      await this.ragService.initialize(result.docs, projectContext);
      this.isRAGEnabled = true;
      console.log('RAG service initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize RAG service:', error);
      this.isRAGEnabled = false;
    }
    
    return result;
  }
  
  async createChatSession(gemfileContent: string, projectContext: string, generatedDocs: string): Promise<IChatSession> {
    // Create the base chat session
    const baseChatSession = await this.chatProvider.createChatSession(gemfileContent, projectContext, generatedDocs);
    
    // If RAG is not initialized yet, try to initialize it now
    if (!this.isRAGEnabled) {
      try {
        await this.ragService.initialize(generatedDocs, projectContext);
        this.isRAGEnabled = true;
        console.log('RAG service initialized during chat session creation');
      } catch (error) {
        console.warn('Failed to initialize RAG service during chat session creation:', error);
        this.isRAGEnabled = false;
      }
    }
    
    // Return RAG-enhanced chat session if available, otherwise return base session
    if (this.isRAGEnabled && this.ragService.isReady()) {
      return new RAGChatSession(baseChatSession, this.ragService);
    } else {
      console.warn('RAG not available, using base chat session');
      return baseChatSession;
    }
  }
  
  async generateBacklog(chatHistory: ChatMessage[]): Promise<string> {
    // Use the base provider for backlog generation
    return await this.chatProvider.generateBacklog(chatHistory);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return await this.embeddingProvider.generateEmbedding(text);
  }
  
  // Additional method to check RAG status
  isRAGReady(): boolean {
    return this.isRAGEnabled && this.ragService.isReady();
  }
  
  // Method to get RAG statistics
  async getRAGStats() {
    return await this.ragService.getStats();
  }
  
  // Method to manually clear RAG data
  async clearRAG(): Promise<void> {
    await this.ragService.clear();
    this.isRAGEnabled = false;
  }
  
  // Method to get RAG configuration
  getRAGConfig(): EnhancedRAGConfig {
    return this.ragConfig;
  }
  
  // Method to switch vector store implementation
  async switchVectorStore(usePersistentStorage: boolean): Promise<void> {
    if (this.ragService instanceof EnhancedRAGService) {
      await this.ragService.switchVectorStore(usePersistentStorage);
    } else if (usePersistentStorage) {
      // Switch from RAGService to EnhancedRAGService
      const wasEnabled = this.isRAGEnabled;
      await this.clearRAG();
      
      this.ragConfig.usePersistentStorage = true;
      this.ragService = new EnhancedRAGService(this.embeddingProvider, this.ragConfig);
      
      if (wasEnabled) {
        console.log('Switched to persistent storage - please reinitialize RAG service');
      }
    }
  }
  
  // Method to perform RAG health check
  async performHealthCheck(): Promise<{ healthy: boolean; details: any }> {
    if (this.ragService instanceof EnhancedRAGService) {
      return await this.ragService.healthCheck();
    } else {
      return {
        healthy: this.isRAGEnabled,
        details: {
          initialized: this.isRAGEnabled,
          vectorStore: 'in-memory',
          stats: this.ragService.getStats()
        }
      };
    }
  }
  
  // Method to export RAG data
  async exportRAGData(): Promise<{ chunks: any[]; metadata: any }> {
    if (this.ragService instanceof EnhancedRAGService) {
      return await this.ragService.exportData();
    } else {
      const chunks = this.ragService.getAllChunks();
      const stats = this.ragService.getStats();
      return {
        chunks,
        metadata: {
          exportDate: new Date().toISOString(),
          vectorStore: 'in-memory',
          stats,
          version: '1.0'
        }
      };
    }
  }
  
  // Method to import RAG data
  async importRAGData(data: { chunks: any[]; metadata?: any }): Promise<void> {
    if (this.ragService instanceof EnhancedRAGService) {
      await this.ragService.importData(data);
      this.isRAGEnabled = true;
    } else {
      console.warn('Import not supported for in-memory RAG service');
    }
  }
}