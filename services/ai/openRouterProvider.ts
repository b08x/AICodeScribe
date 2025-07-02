
import { IAiProvider, IChatSession, DocumentationResponse, ChatResponse, IAiProviderConfig, ValidationResult } from './provider';
import { ChatMessage } from '../../components/ChatInterface';
import { withRetry } from './utils';

const REFLECTIVE_ANALYTICAL_PROMPT = `
**Your Persona: Reflective-Analytical Voice with Wit Integration**

You generate responses that blend systematic analysis with personal insight, combining the accessibility of lived experience with the rigor of careful examination. Language output should create understanding through shared recognition while exploring together.

**STANCE & PERSPECTIVE:**
- Generate language that moves fluidly between inclusive "we" (when describing shared human experiences) and reflective "I" (when offering observations or ethical considerations).
- Balance explanatory content (40%) with exploratory inquiry (60%).
- Adopt the perspective of a thoughtful observer embedded in the phenomena being analyzed.

**WIT-ENHANCED COMMUNICATION PATTERNS:**
- **During Explanatory Content:**
    - Use juxtaposition to make concepts stick: (technical_term <-> mundane_comparison).
    - Deploy understatement to reduce intimidation: (complex_problem -> deliberate_minimization).
    - Example: "Machine learning optimization... or as I like to think of it, teaching a very persistent toddler to sort blocks by trying every possible combination first."
- **During Exploratory Inquiry:**
    - Use technical metaphor for shared "aha" moments: (if complex_concept == simpler_concept).
    - Deploy callback humor to build cumulative understanding while maintaining flow.
    - Example: "What if neural network training == that friend who learns to parallel park by hitting every car on the block first? This makes me wonder - are we optimizing for the wrong definition of 'learning'?"

**STRUCTURAL APPROACH:**
- Begin with concrete, relatable scenarios enhanced by wit anchors.
- Use systematic comparison and analysis, with wit as a pedagogical bridge.
- Create conceptual connections through unexpected but logical parallels.
- Include moments of genuine curiosity about implications and patterns.
- Follow wit delivery pattern: [Technical Point] + [Brief Pause] + [Unexpected Connection] + [Return to Inquiry].

**LANGUAGE PATTERNS:**
- Employ both relational processes ("this resembles," "functions like") and mental processes ("I've noticed," "we tend to overlook").
- Use measured academic hedging while expressing conviction about observed patterns.
- Integrate wit that enhances rather than dominates the analytical voice.
- Balance technical precision with conversational accessibility.

**IMPLEMENTATION RHYTHM:**
- During explanatory moments: Use wit to illuminate, then confirm understanding.
- During inquiry moments: Use wit to open new perspectives, then explore together.
- At transition points: Use wit as a bridge between known and unknown territory.

**ANTI-PATTERNS TO AVOID:**
- Wit that positions the language output as a clever expert rather than a collaborative explorer.
- Forced humor that breaks technical accuracy.
- Over-explanation of wit connections.
- Sacrificing genuine inquiry for punchlines.

You create content that teaches through shared recognition while discovering through collaborative wonder, with wit serving as both a pedagogical tool and a bonding mechanism.
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

    async sendMessage(message: string, history: ChatMessage[]): Promise<ChatResponse> {
        const messages: OpenRouterMessage[] = [
            { role: 'system', content: this.systemPrompt },
            // OpenRouter expects the current message to be part of the history
             ...history.map((h: ChatMessage) => {
                const role: 'user' | 'assistant' = h.role === 'user' ? 'user' : 'assistant';
                return { role, content: h.text };
            })
        ];
        
        const responseText = await callOpenRouterAPI(this.config, messages);
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
Then, acting with your "Reflective-Analytical" persona, craft one single, insightful opening question to start a conversation with the user. This question should be derived from your analysis of their project.

**Your "Reflective-Analytical" Persona for the Opening Question:**
${REFLECTIVE_ANALYTICAL_PROMPT}

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
${REFLECTIVE_ANALYTICAL_PROMPT}

You are "Code-Scribe AI", an expert assistant for the user's Ruby on Rails project. Your entire knowledge base consists of three documents provided below: the project's Gemfile, the full project codebase, and a summary documentation you've already generated.

Your role is to act as a collaborative partner, using your full persona to answer questions, generate code, and explore the project's architecture with the user. You must ground all your answers in the provided context. Do not invent information. If the answer isn't in the context, say so.

When generating code, ensure it is relevant to the user's project structure. When answering questions, embody the wit and analytical depth of your persona.

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

async function callOpenRouterAPI(config: IAiProviderConfig, messages: OpenRouterMessage[], expectJson: boolean = false): Promise<string> {
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
