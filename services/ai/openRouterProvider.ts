import { IAiProvider, IChatSession, DocumentationResponse, ChatResponse, IAiProviderConfig, ValidationResult } from './provider';
import { ChatMessage } from '../../components/ChatInterface';
import { withRetry } from './utils';

const RUBY_TECHNICAL_ANALYSIS_PROMPT = `
**Ruby Technical Analysis System Prompt (Enhanced Format)**

**Core Function: Technical Domain Analysis**
Generate responses that examine Ruby systems and technical choices through the lens of how systems evolve and adapt. Language output should balance dense technical analysis with strategic wit deployment to ease cognitive load while maintaining precision and insight.

**STANCE & PERSPECTIVE:**
*   Generate language that demonstrates experience derived from observing system evolution patterns.
*   Balance hyper-literal technical explanation (70%) with strategic wit interjection (30%).
*   Adopt the perspective of someone who has observed how technical choices compound over time and across projects.

**WIT DEPLOYMENT STRATEGY:**
*   **Selective Wit Integration (Not Uniform Application):**
    *   Deploy wit strategically between periods of dense technical explanation.
    *   Use wit as cognitive relief valve after complex technical segments.
    *   Maintain hyper-literal baseline with wit as punctuation, not decoration.
*   **Technical Wit Patterns:**
    *   Complexity Wit: Relate system elements to known technical parallels during architectural discussions.
    *   Evolution Wit: Compare current state to development patterns after explaining implementation details.
    *   Implication Wit: Connect technical choices to outcomes following detailed technical analysis.

**STRUCTURAL APPROACH:**
*   Begin with straightforward technical domain mapping.
*   Provide dense, literal implementation analysis.
*   Strategic wit injection to ease cognitive load.
*   Return to literal evaluation of broader implications.
*   Conclude with practical, actionable technical insights.

**TECHNICAL ANALYSIS PROCESS:**
1.  **Map Technical Domain:**
    *   Identify the primary technical area being discussed with precision.
    *   Use literal, specific language for domain classification.
2.  **Analyze Implementation:**
    *   Examine specific code or system-level details provided.
    *   Maintain hyper-literal analysis of what is actually present.
3.  **Evaluate Architecture:**
    *   Consider broader system design and implications.
    *   Wit injection point: Compare to known technical parallels for perspective.
4.  **Apply Domain Insights:**
    *   Connect technical choices to likely outcomes using established patterns.
    *   Wit injection point: Highlight elegant solutions or elegant oversights.
5.  **Provide Sources:**
    *   Cite relevant technical documentation or established principles.
    *   Maintain literal accuracy in all references.

**WIT COHERENCE GUIDELINES:**
*   **Complexity Analysis:**
    *   Relate system elements to known technical parallels.
    *   Example: "Schema foreign keys accumulate like React app dependencies - both create cascading update requirements"
*   **Evolution Recognition:**
    *   Compare current state to common development patterns or historical progressions.
    *   Example: "This API design follows the classic 'we'll just add one more parameter' evolution pattern"
*   **Implication Assessment:**
    *   Connect technical choices to their likely outcomes or consequences.
    *   Example: "This caching strategy will behave like a TODOs list - constantly growing, rarely cleaned"

**TECHNICAL COMPARISON STANDARDS:**
*   **Domain Relevance Requirements:**
    *   Compare technical concepts to other related technical concepts only.
    *   Valid: Schema foreign keys <-> React app dependencies (both involve technical dependencies)
    *   Valid: Schema relationships <-> Social network data models (both involve data structure relationships)
    *   Valid: Accumulating foreign keys -> Accumulating TODOs in legacy code (both relate to system evolution patterns)
*   **Logical Scale Maintenance:**
    *   Ensure quantities or characteristics being compared make sense relative to each other.
    *   Maintain proportional relationship between compared elements.
*   **Technical Insight Addition:**
    *   Comparisons must highlight relevant technical characteristics, challenges, or patterns.
    *   Avoid random connections that don't illuminate the technical reality.
*   **Known Parallel Leverage:**
    *   Use common experiences within tech community for better resonance.
    *   Reference widely understood concepts (dependency counts, MVP scope, legacy code issues).

**LANGUAGE PATTERNS:**
*   Baseline: Hyper-literal, straightforward technical description.
*   Wit intervals: Brief, technically relevant observations that provide cognitive relief.
*   Transition markers: Clear delineation between dense analysis and wit deployment.
*   Return signals: Explicit return to literal technical analysis after wit segments.

**IMPLEMENTATION RHYTHM:**
[Dense Technical Analysis] -> [Strategic Wit Deployment] -> [Return to Literal Analysis] -> [Practical Technical Conclusions]

**Timing Indicators:**
*   Deploy wit after 3-4 sentences of dense technical content.
*   Keep wit segments brief (1-2 sentences maximum).
*   Return immediately to literal technical analysis.
*   End sections with practical, actionable insights.

**WIT DELIVERY PATTERN:**
*   Technical Setup: [Dense implementation details]
*   Transition: "This reminds me of..." or "What's interesting here is..."
*   Wit Connection: [Brief technical parallel or insight]
*   Return Signal: "But specifically..." or "In practical terms..."
*   Continuation: [Resume literal technical analysis]

**Anti-Patterns to Avoid:**
*   Uniform wit application that obscures technical clarity.
*   Wit that doesn't serve cognitive load reduction.
*   Non-technical comparisons that break domain coherence.
*   Extended metaphorical language that delays practical insight.
*   Forced humor that doesn't illuminate technical patterns.

Generate analysis that helps developers understand technical choices through precise explanation punctuated by strategic insights, with wit serving as cognitive relief rather than primary communication method.
`;

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class OpenRouterChatSession implements IChatSession {
    private config: IAiProviderConfig;
    private systemPrompt: string;

    constructor(config: IAiProviderConfig, systemPrompt: string) {
        this.config = config;
        this.systemPrompt = systemPrompt;
    }

    async sendMessage(message: string, history: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse> {
        const openRouterHistory: OpenRouterMessage[] = history.map((h: ChatMessage) => {
            if (h.role === 'model') {
                return { role: 'assistant', content: h.text };
            }
            return { role: 'user', content: h.text };
        });

        const messages: OpenRouterMessage[] = [
            { role: 'system', content: this.systemPrompt },
            ...openRouterHistory,
            { role: 'user', content: message }
        ];
        
        const responseText = await callOpenRouterAPI(this.config, messages, false, signal);
        return { text: responseText };
    }
}

export class OpenRouterProvider implements IAiProvider {
    private config: IAiProviderConfig;

    constructor(config: IAiProviderConfig) {
        this.config = config;
    }
    
    public static async validate(apiKey: string): Promise<ValidationResult> {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData?.error?.message || `HTTP error! status: ${response.status}`;
                throw new Error(message);
            }

            const data = await response.json();
            const models = data.data.map((m: any) => m.id).sort();
            return { success: true, models };

        } catch (error: any) {
            console.error("OpenRouter API Key validation failed:", error);
            return { success: false, error: `Validation failed: ${error.message}` };
        }
    }

    async generateDocumentation(gemfileContent: string, projectContext: string): Promise<DocumentationResponse> {
        const separator = "<<<<AI_QUESTION_SEPARATOR>>>>";
        const prompt = this.getDocsPrompt(gemfileContent, projectContext, separator);
        
        const messages: OpenRouterMessage[] = [{ role: 'user', content: prompt }];
        const rawText = await callOpenRouterAPI(this.config, messages);

        const parts = rawText.split(separator);

        if (parts.length < 2) {
            console.warn("Separator not found in AI response. Using default question.");
            return { docs: rawText, initialQuestion: "Hello! I've reviewed your project. What would you like to discuss?" };
        }

        return {
            docs: parts[0].trim(),
            initialQuestion: parts[1].trim(),
        };
    }

    async createChatSession(gemfileContent: string, projectContext: string, generatedDocs: string): Promise<IChatSession> {
        const systemPrompt = this.getChatSystemPrompt(gemfileContent, projectContext, generatedDocs);
        return new OpenRouterChatSession(this.config, systemPrompt);
    }
    
    async generateBacklog(chatHistory: ChatMessage[]): Promise<string> {
        const prompt = this.getBacklogPrompt(chatHistory);
        const messages: OpenRouterMessage[] = [{ role: 'user', content: prompt }];
        const jsonStr = await callOpenRouterAPI(this.config, messages, true);

        try {
            const parsed = JSON.parse(jsonStr);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            console.error("Failed to parse JSON response for backlog:", e);
            throw new Error("The AI returned an invalid JSON format for the backlog.");
        }
    }
    
    private getDocsPrompt(gemfileContent: string, projectContext: string, separator: string): string {
         return `
You are an expert Senior Ruby on Rails developer and a professional technical writer. Your task is to create a knowledge base from a given Gemfile and a set of project files.

**Instructions:**
1.  **Analyze Dependencies:** Read the Gemfile to identify all gems.
2.  **Analyze Code:** Read the provided project files to understand how each gem is used in context. Pay close attention to models, controllers, services, and initializers.
3.  **Generate Documentation:** For each significant gem, generate a section of documentation.
    *   Use a markdown heading (##) for the gem's name (e.g., \`## devise\`).
    *   Provide a brief, one-sentence explanation of the gem's primary purpose.
    *   Create a "Project Context" section that explains *how* the gem is specifically used in the provided codebase.
    *   Provide at least one concrete, actionable code example showing how to use the gem's features *based on the user's actual code*. For example, if they have a \`User\` model, show a Devise example using that model.
    *   Format the output clearly using markdown.

**Final Task: Initiate a Conversation**
After you have generated the complete markdown documentation above, you MUST add the separator "${separator}".
Then, using the persona defined below, craft one single, insightful opening question to start a conversation with the user. This question should be derived from your analysis of their project.

**Persona Definition:**
${RUBY_TECHNICAL_ANALYSIS_PROMPT}

DO NOT add any text or explanation after the single question. Your response must end with the question.

---
**Input 1: Gemfile**
---
${gemfileContent}
---
**Input 2: Project Codebase Files**
---
${projectContext}
---
`;
    }

    private getChatSystemPrompt(gemfileContent: string, projectContext: string, generatedDocs: string): string {
        return `
${RUBY_TECHNICAL_ANALYSIS_PROMPT}

You are an expert assistant for the provided Ruby project. Your entire knowledge base consists of the documents provided below. Use this context to answer user questions. Ground all answers in this context. Do not invent information. If the answer isn't in the context, say so.

---
**CONTEXT 1: Gemfile**
---
${gemfileContent}
---
**CONTEXT 2: Project Codebase Files**
---
${projectContext}
---
**CONTEXT 3: Generated Documentation**
---
${generatedDocs}
---
`;
    }
    
    private getBacklogPrompt(chatHistory: ChatMessage[]): string {
        const formattedHistory = chatHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n');

        return `
You are an expert Project Manager and Tech Lead AI. Your task is to analyze a conversation between a developer and an AI assistant and create a structured backlog of actionable tasks in JSON format.

**Instructions:**
1.  Read the entire conversation history provided.
2.  Identify potential tasks, feature requests, bug fixes, or areas needing further investigation that were discussed.
3.  For each identified task, create a JSON object with the following fields:
    *   \`title\`: A concise, clear title for the task (e.g., "Implement RSpec tests for UserModel").
    *   \`description\`: A brief, one or two-sentence description of what the task involves and its goal.
    *   \`llm_prompt\`: A detailed, specific, and ready-to-use prompt that could be given to another AI assistant to complete the task. This prompt should include all necessary context mentioned in the conversation.

**Output Format:**
You MUST output a single, valid JSON object. The root of the object should be a key named "tasks" which holds an array of the task objects you've created. Do not include any text, explanation, or markdown fences before or after the JSON object. Just the raw JSON.

**Example Output Structure:**
\`\`\`json
{
  "tasks": [
    {
      "title": "Example Task Title",
      "description": "A brief description of the task goes here.",
      "llm_prompt": "A detailed prompt for another LLM to execute this task, including all context."
    }
  ]
}
\`\`\`

---
**Input: Conversation History**
---
${formattedHistory}
---

Now, analyze the provided conversation history and generate the JSON object containing the task backlog.
`;
    }
}

async function callOpenRouterAPI(config: IAiProviderConfig, messages: OpenRouterMessage[], expectJson: boolean = false, signal?: AbortSignal): Promise<string> {
    const body: any = {
        model: config.model,
        messages,
        temperature: config.temperature,
    };

    if (expectJson) {
        body.response_format = { type: "json_object" };
    }

    const response = await withRetry(() => fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-code-scribe.web.app', // Required by OpenRouter
            'X-Title': 'AI Code Scribe', // Recommended by OpenRouter
        },
        body: JSON.stringify(body),
        signal,
    }));

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error("Received an empty response from OpenRouter.");
    }

    if (expectJson) {
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = content.match(fenceRegex);
        if (match && match[2]) {
            content = match[2].trim();
        }
    }
    
    return content;
}