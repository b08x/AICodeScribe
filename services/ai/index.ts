
import { IAiProvider, IAiProviderConfig, ValidationResult } from './provider';
import { GeminiProvider } from './geminiProvider';
import { OpenRouterProvider } from './openRouterProvider';

/**
 * Factory function to get an instance of an AI provider.
 * @param config The user-defined configuration for the provider.
 * @returns An instance of the requested AI provider.
 */
export const getAiProvider = (config: IAiProviderConfig): IAiProvider => {
    switch (config.provider) {
        case 'gemini':
            return new GeminiProvider(config);
        case 'openrouter':
            return new OpenRouterProvider(config);
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
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
        default:
            return { success: false, error: 'Unknown provider selected for validation.' };
    }
};
