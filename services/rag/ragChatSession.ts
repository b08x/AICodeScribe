// RAG-enhanced chat session that retrieves context before generating responses
import { IChatSession, ChatResponse } from '../ai/provider';
import { ChatMessage } from '../../components/ChatInterface';
import { RAGService, RAGContext } from './ragService';
import { EnhancedRAGService } from './enhancedRagService';

export class RAGChatSession implements IChatSession {
  private baseChatSession: IChatSession;
  private ragService: RAGService | EnhancedRAGService;
  
  constructor(baseChatSession: IChatSession, ragService: RAGService | EnhancedRAGService) {
    this.baseChatSession = baseChatSession;
    this.ragService = ragService;
  }
  
  async sendMessage(message: string, history: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse> {
    try {
      // Retrieve relevant context using RAG
      const ragContext = await this.ragService.retrieveContext(message, 3);
      
      // Enhance the message with retrieved context if available
      let enhancedMessage = message;
      
      if (ragContext.contextText && ragContext.sources.length > 0) {
        enhancedMessage = this.buildContextualMessage(message, ragContext);
      }
      
      // Send the enhanced message to the base chat session
      const response = await this.baseChatSession.sendMessage(enhancedMessage, history, signal);
      
      // Optionally add source attribution to the response
      if (ragContext.sources.length > 0) {
        response.text += this.buildSourceAttribution(ragContext.sources);
      }
      
      return response;
    } catch (error) {
      console.error('Error in RAG chat session:', error);
      // Fallback to base chat session without RAG
      return await this.baseChatSession.sendMessage(message, history, signal);
    }
  }
  
  private buildContextualMessage(originalMessage: string, context: RAGContext): string {
    return `Based on the following relevant information from the codebase and documentation:

${context.contextText}

---

User Question: ${originalMessage}

Please answer the user's question using the provided context above. If the context doesn't contain enough information to answer the question fully, please say so and provide what information you can based on the available context.`;
  }
  
  private buildSourceAttribution(sources: string[]): string {
    if (sources.length === 0) return '';
    
    const sourceList = sources.map((source, index) => `${index + 1}. ${source}`).join('\n');
    
    return `\n\n---\n**Sources:**\n${sourceList}`;
  }
}