
export interface ProviderDetails {
    key: string;
    name: string;
    models: string[];
    defaultTemperature: number;
}

export const chatProviders: ProviderDetails[] = [
    { 
        key: 'gemini', 
        name: 'Google Gemini',
        models: [
            "gemini-1.5-flash-latest",
            "gemini-pro",
        ],
        defaultTemperature: 0.7,
    },
    { 
        key: 'openrouter', 
        name: 'OpenRouter',
        // Models will be fetched from API, but we need a default for display
        models: [ 
            "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
            "mistralai/mistral-7b-instruct",
            "google/gemini-pro"
        ],
        defaultTemperature: 0.8,
    }
];

export const embeddingProviders: ProviderDetails[] = [
    {
        key: 'transformers.js',
        name: 'Local Embeddings (Transformers.js)',
        models: [
            'Xenova/all-MiniLM-L6-v2',
            'Xenova/bge-base-en-v1.5',
            'mixedbread-ai/mxbai-embed-large-v1'
        ],
        defaultTemperature: 0.0,
    },
    { 
        key: 'gemini', 
        name: 'Google Gemini',
        models: ["embedding-001"],
        defaultTemperature: 0.0,
    },
    { 
        key: 'openrouter', 
        name: 'OpenRouter',
        models: ["text-embedding-ada-002"],
        defaultTemperature: 0.0,
    }
];
