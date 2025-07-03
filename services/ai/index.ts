
import { IAiProvider, IAiProviderConfig, ValidationResult } from './provider';
import { GeminiProvider } from './geminiProvider';
import { OpenRouterProvider } from './openRouterProvider';
import { TransformersJsProvider } from './transformersJsProvider';
import { RAGProvider } from '../rag/ragProvider';
import { EnhancedRAGConfig } from '../rag/enhancedRagService';

/**
 * Factory function to get an instance of an AI provider.
 * @param config The user-defined configuration for the provider.
 * @param enableRAG A boolean to enable or disable the RAG provider.
 * @param ragConfig Configuration for the RAG service, including persistent storage settings.
 * @returns An instance of the requested AI provider, optionally wrapped in a RAG provider.
 */
export const getAiProvider = (
    config: IAiProviderConfig, 
    enableRAG: boolean = true, 
    ragConfig: EnhancedRAGConfig = { usePersistentStorage: false }
): IAiProvider => {
    let baseProvider: IAiProvider;

    switch (config.provider) {
        case 'gemini':
            baseProvider = new GeminiProvider(config);
            break;
        case 'openrouter':
            baseProvider = new OpenRouterProvider(config);
            break;
        case 'transformers.js':
            baseProvider = new TransformersJsProvider(config);
            break;
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }

    if (enableRAG) {
        return new RAGProvider(baseProvider, baseProvider, ragConfig);
    }
    
    return baseProvider;
};

/**
 * Validates an API key for a given provider.
 * @param provider The name of the provider.
 * @param apiKey The API key to validate.
 * @returns A promise that resolves to a ValidationResult object.
 */
export const validateApiKey = async (provider: string, apiKey: string): Promise<ValidationResult> => {
    switch (provider) {
        case 'gemini':
            return GeminiProvider.validate(apiKey);
        case 'openrouter':
            return OpenRouterProvider.validate(apiKey);
        case 'transformers.js':
            return TransformersJsProvider.validate(apiKey);
        default:
            return { success: false, error: 'Unknown provider selected for validation.' };
    }
};
