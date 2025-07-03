
const MAX_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 2000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isRateLimitError = (error: any): boolean => {
    if (error?.error?.code === 429) return true;
    if (error?.status === 429) return true; // For fetch responses
    
    if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toUpperCase().includes('RESOURCE_EXHAUSTED')) {
            return true;
        }
        try {
            if (error.message.trim().startsWith('{')) {
                const parsedError = JSON.parse(error.message);
                if (parsedError?.error?.code === 429) return true;
                if (parsedError?.error?.status === 429) return true;
            }
        } catch (e) { /* Not a JSON string */ }
    }
    return false;
};

export const isAbortError = (error: any): boolean => {
    // DOMException is thrown by fetch on abort, its name is 'AbortError'
    // The Gemini SDK might also throw an error with this name.
    return error?.name === 'AbortError';
};


export const withRetry = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            console.error(`Attempt ${attempt} of ${MAX_ATTEMPTS} failed.`, error);

            if (isAbortError(error)) {
                console.log("API call was aborted by the user.");
                throw error; // Re-throw immediately, do not retry
            }

            if (isRateLimitError(error)) {
                if (attempt < MAX_ATTEMPTS) {
                    const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    console.log(`Rate limit error detected. Retrying in ${Math.round(backoffTime)}ms...`);
                    await delay(backoffTime);
                } else {
                    console.error("Max attempts reached for rate limit error.");
                    throw new Error(`API rate limit exceeded after ${MAX_ATTEMPTS} attempts. Please check your plan and billing details or try again later.`);
                }
            } else {
                console.error("A non-retriable error occurred:", error);
                 if (error instanceof Error) {
                    throw error;
                }
                const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
                throw new Error(`An unexpected error occurred: ${errorMessage}`);
            }
        }
    }
    throw new Error("Failed to execute API call after multiple attempts.");
};
