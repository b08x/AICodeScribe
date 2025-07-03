
import { IAiProvider, IChatSession, DocumentationResponse, ChatResponse, IAiProviderConfig, ValidationResult } from './provider';
import { ChatMessage } from '../../components/ChatInterface';
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

export class TransformersJsProvider implements IAiProvider {
    private embedder: any;

    constructor(config: IAiProviderConfig) {
        this.init(config.model);
    }

    private async init(model: string) {
        this.embedder = await pipeline('feature-extraction', model);
    }

    public static async validate(apiKey: string): Promise<ValidationResult> {
        // No validation needed for local provider
        return { success: true, models: ['Xenova/all-MiniLM-L6-v2'] };
    }

    async generateDocumentation(gemfileContent: string, projectContext: string): Promise<DocumentationResponse> {
        throw new Error("Documentation generation is not supported by the Transformers.js provider.");
    }

    async createChatSession(gemfileContent: string, projectContext: string, generatedDocs: string): Promise<IChatSession> {
        throw new Error("Chat sessions are not supported by the Transformers.js provider.");
    }

    async generateBacklog(chatHistory: ChatMessage[]): Promise<string> {
        throw new Error("Backlog generation is not supported by the Transformers.js provider.");
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.embedder) {
            await this.init('Xenova/all-MiniLM-L6-v2');
        }
        const embeddings = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(embeddings.data);
    }
}
