
import { IAiProvider, IAiProviderConfig } from './provider';
import { GeminiProvider } from './geminiProvider';
import { OpenRouterProvider } from './openRouterProvider';
import { TransformersJsProvider } from './transformersJsProvider';

export class ProviderFactory {
    staticcreate(config: IAiProviderConfig): IAiProvider {
        switch (config.provider) {
            case 'gemini':
                return new GeminiProvider(config);
            case 'openrouter':
                return new OpenRouterProvider(config);
            case 'transformers.js':
                return new TransformersJsProvider(config);
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }
}
