// RAG-enhanced provider wrapper that adds retrieval capabilities to any AI provider
import { IAiProvider, IChatSession, DocumentationResponse, ChatResponse, IAiProviderConfig } from '../ai/provider';
import { ChatMessage } from '../../components/ChatInterface';
import { RAGService } from './ragService';
import { RAGChatSession } from './ragChatSession';

export class RAGProvider implements IAiProvider {
  private chatProvider: IAiProvider;
  private embeddingProvider: IAiProvider;
  private ragService: RAGService;
  private isRAGEnabled: boolean = false;
  
  constructor(chatProvider: IAiProvider, embeddingProvider: IAiProvider) {
    this.chatProvider = chatProvider;
    this.embeddingProvider = embeddingProvider;
    this.ragService = new RAGService(this.embeddingProvider);
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
  getRAGStats() {
    return this.ragService.getStats();
  }
  
  // Method to manually clear RAG data
  clearRAG(): void {
    this.ragService.clear();
    this.isRAGEnabled = false;
  }
}