
import { ChatMessage } from '../../components/ChatInterface';

export interface IAiProviderConfig {
    provider: string;
    providerName: string;
    apiKey: string;
    model: string;
    temperature: number;
}

export interface ValidationResult {
    success: boolean;
    models?: string[];
    error?: string;
}

export interface DocumentationResponse {
    docs: string;
    initialQuestion: string;
}

export interface ChatResponse {
    text: string;
}

export interface IChatSession {
    sendMessage(message: string, history: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse>;
}

export interface IAiProvider {
    generateDocumentation(gemfileContent: string, projectContext: string): Promise<DocumentationResponse>;
    createChatSession(gemfileContent: string, projectContext: string, generatedDocs: string): Promise<IChatSession>;
    generateBacklog(chatHistory: ChatMessage[]): Promise<string>;
    generateEmbedding(text: string): Promise<number[]>;
}
