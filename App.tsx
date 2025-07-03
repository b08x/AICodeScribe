import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getAiProvider } from './services/ai';
import { IAiProvider, IAiProviderConfig, IChatSession } from './services/ai/provider';
import { RAGProvider } from './services/rag';

import { LandingPage } from './components/LandingPage';
import { ChatMessage } from './components/ChatInterface';
import { SetupPage } from './components/SetupPage';
import { UploadPage } from './components/UploadPage';
import { StatusPage } from './components/StatusPage';
import { MainChatPage } from './components/MainChatPage';
import { DocSection, GemInfo } from './components/DocumentationSidebar';


const App = () => {
  const [view, setView] = useState<'landing' | 'setup' | 'upload' | 'status' | 'chat'>('landing');
  const [chatConfig, setChatConfig] = useState<IAiProviderConfig | null>(null);
  const [embeddingConfig, setEmbeddingConfig] = useState<IAiProviderConfig | null>(null);
  const [enableRAG, setEnableRAG] = useState<boolean>(true);

  const aiProvider: IAiProvider | null = useMemo(() => {
    if (!chatConfig) return null;
    
    const chatProvider = getAiProvider(chatConfig, false);
    if (!enableRAG || !embeddingConfig) {
        return chatProvider;
    }

    const embeddingProvider = getAiProvider(embeddingConfig, false);
    return new RAGProvider(chatProvider, embeddingProvider);

  }, [chatConfig, embeddingConfig, enableRAG]);

  const [gemfileContent, setGemfileContent] = useState<string>('');
  const [gemfileName, setGemfileName] = useState<string | null>(null);
  const [projectFilesContent, setProjectFilesContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  // Gems state
  const [gems, setGems] = useState<GemInfo[]>([]);
  const [selectedGems, setSelectedGems] = useState<Set<string>>(new Set());
  
  // Documentation state
  const [docSections, setDocSections] = useState<DocSection[]>([]);

  // Chat state
  const [chatSession, setChatSession] = useState<IChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Backlog state
  const [isBacklogLoading, setIsBacklogLoading] = useState<boolean>(false);
  const [isBacklogVisible, setIsBacklogVisible] = useState<boolean>(false);
  const [backlogJson, setBacklogJson] = useState<string | null>(null);

  // Status page state
  const [progress, setProgress] = useState({
    step: 'parsing',
    description: 'Analyzing uploaded files...',
    percentage: 0,
  });

  const gemfileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const handleConfigured = (cConfig: IAiProviderConfig, eConfig: IAiProviderConfig) => {
    setChatConfig(cConfig);
    setEmbeddingConfig(eConfig);
    setView('upload');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'gemfile' | 'project') => {
    const file = event.target.files?.[0];
    if (!file) {
      if (type === 'gemfile') {
        setGemfileContent('');
        setGemfileName(null);
        setGems([]);
      } else {
        setProjectFilesContent('');
        setUploadedFileName(null);
      }
      setError('');
      return;
    }

    if (type === 'project' && file.type !== 'application/json') {
      setError('Invalid file type for project. Please upload a JSON file.');
      setUploadedFileName(null);
      setProjectFilesContent('');
      if(projectFileInputRef.current) projectFileInputRef.current.value = '';
      return;
    }
    
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (type === 'gemfile') {
          setGemfileContent(text);
          setGemfileName(file.name);
          const parsed = parseGemfile(text);
          setGems(parsed);
          setSelectedGems(new Set(parsed.map(g => g.name)));
        } else {
          setProjectFilesContent(text); // Store the raw JSON string
          setUploadedFileName(file.name);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Error processing file: ${errorMessage}`);
        if (type === 'gemfile') {
          setGemfileName(null);
          setGemfileContent('');
          setGems([]);
          setSelectedGems(new Set());
          if(gemfileInputRef.current) gemfileInputRef.current.value = '';
        } else {
          setUploadedFileName(null);
          setProjectFilesContent('');
          if(projectFileInputRef.current) projectFileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      if (type === 'gemfile') {
        setGemfileName(null);
        setGemfileContent('');
        setGems([]);
        setSelectedGems(new Set());
        if(gemfileInputRef.current) gemfileInputRef.current.value = '';
      } else {
        setUploadedFileName(null);
        setProjectFilesContent('');
        if(projectFileInputRef.current) projectFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };
  
// Gemfile parser: extracts gem names and versions from Gemfile content
function parseGemfile(content: string): GemInfo[] {
  const lines = content.split(/\r?\n/);
  const gems: GemInfo[] = [];
  const gemRegex = /^\s*gem\s+['\"]([^'\"]+)['\"](?:\s*,\s*['\"]([^'\"]+)['\"])?/;
  for (const line of lines) {
    const match = line.match(gemRegex);
    if (match) {
      gems.push({ name: match[1], version: match[2] });
    }
  }
  return gems;
}
  
  const parseDocsToSections = (markdown: string): DocSection[] => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const sections: DocSection[] = [];
    let currentSectionContent: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('## ')) {
            if (currentSectionContent.length > 0) {
                const fullContent = currentSectionContent.join('\n');
                const title = currentSectionContent[0].replace(/^##\s+/, '').trim();
                sections.push({ title, markdown: fullContent });
            }
            currentSectionContent = [line];
        } else if (currentSectionContent.length > 0) {
            currentSectionContent.push(line);
        }
    }

    if (currentSectionContent.length > 0) {
        const fullContent = currentSectionContent.join('\n');
        const title = currentSectionContent[0].replace(/^##\s+/, '').trim();
        sections.push({ title, markdown: fullContent });
    }

    return sections;
  };

  const handleGenerateClick = useCallback(async () => {
    if (!gemfileContent || !projectFilesContent || isLoading || !aiProvider) return;

    // Filter Gemfile content to only include selected gems
    const filteredGemfile = gemfileContent
      .split(/\r?\n/)
      .filter(line => {
        const match = line.match(/^\s*gem\s+['\"]([^'\"]+)['\"]/)?.[1];
        return !match || selectedGems.has(match);
      })
      .join('\n');

    setIsLoading(true);
    setError('');
    setDocSections([]);
    setChatSession(null);
    setChatHistory([]);
    setView('status');

    // Reset progress
    setProgress({
      step: 'parsing',
      description: 'Analyzing uploaded files...',
      percentage: 0,
    });

    try {
      // Step 1: Parsing
      setProgress({
        step: 'parsing',
        description: 'Analyzing uploaded files...',
        percentage: 20,
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

      // Step 2: Processing
      setProgress({
        step: 'processing',
        description: 'Extracting code structure and patterns...',
        percentage: 40,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Embedding
      setProgress({
        step: 'embedding',
        description: 'Generating vector embeddings for RAG...',
        percentage: 60,
      });

      const { docs, initialQuestion } = await aiProvider.generateDocumentation(filteredGemfile, projectFilesContent);
      const sections = parseDocsToSections(docs);
      setDocSections(sections);

      // Step 4: Indexing
      setProgress({
        step: 'indexing',
        description: 'Creating searchable knowledge base...',
        percentage: 80,
      });

      const chat = await aiProvider.createChatSession(filteredGemfile, projectFilesContent, docs);
      setChatSession(chat);

      // Step 5: Finalizing
      setProgress({
        step: 'finalizing',
        description: 'Preparing chat interface...',
        percentage: 100,
      });

      if (initialQuestion) {
        setChatHistory([{ role: 'model', text: initialQuestion }]);
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to generate documentation: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [gemfileContent, projectFilesContent, isLoading, aiProvider, selectedGems]);

  const handleSendMessage = useCallback(async (
    message: string, 
    options: { isRegenerating: boolean, signal?: AbortSignal }
  ) => {
    if (!message.trim() || !chatSession) return;
    
    let historyForProvider = [...chatHistory];
    
    if (options.isRegenerating) {
        const lastUserMessageIndex = historyForProvider.map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex !== -1) {
            historyForProvider = historyForProvider.slice(0, lastUserMessageIndex);
        }
    }

    const userMessage: ChatMessage = { role: 'user', text: message };
    const currentChatHistory = [...historyForProvider, userMessage];
    setChatHistory(currentChatHistory);
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage(message, historyForProvider, options.signal);
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (err) {
       if (err instanceof Error && err.name === 'AbortError') {
           const abortedMessage: ChatMessage = { role: 'model', text: "Message generation was stopped by the user." };
           setChatHistory(prev => [...prev, abortedMessage]);
           return;
       }
       const errorMessageText = err instanceof Error ? err.message : 'Sorry, I encountered an error. Please try again.';
       const errorMessage: ChatMessage = { role: 'model', text: errorMessageText };
       setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatSession, chatHistory]);
  
  const handleGenerateBacklog = useCallback(async () => {
    if (chatHistory.length === 0 || isBacklogLoading || !aiProvider) return;

    setIsBacklogLoading(true);
    setError('');
    setBacklogJson(null);
    setIsBacklogVisible(true);
    
    try {
        const jsonResponse = await aiProvider.generateBacklog(chatHistory);
        setBacklogJson(jsonResponse);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate backlog: ${errorMessage}`);
        setBacklogJson(null);
    } finally {
        setIsBacklogLoading(false);
    }
  }, [chatHistory, isBacklogLoading, aiProvider]);

  const handleGemSelectionChange = (gemName: string, selected: boolean) => {
    setSelectedGems(prev => {
      const next = new Set(prev);
      if (selected) next.add(gemName); else next.delete(gemName);
      return next;
    });
  };

  const handleClearRAG = () => {
    if (aiProvider && aiProvider instanceof RAGProvider) {
      aiProvider.clearRAG();
      // Force a re-render to update stats
      setChatHistory(prev => [...prev]);
    }
  };

  const handleStatusComplete = () => {
    setView('chat');
  };

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('setup')} />;
  }
  
  if (view === 'setup') {
    return <SetupPage onConfigured={handleConfigured} />;
  }

  if (view === 'upload') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
        <main className="max-w-6xl mx-auto">
          <header className="text-center mb-8 relative">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
              AI Code-Scribe
            </h1>
            <p className="text-slate-400 text-lg">
              Upload your dependencies and project files.
            </p>
            <div className="absolute top-0 right-0 text-right">
              <p className="text-sm font-semibold text-slate-300">{chatConfig?.providerName}</p>
              <p className="text-xs text-slate-500">{chatConfig?.model}</p>
            </div>
          </header>

          <UploadPage
            gemfileContent={gemfileContent}
            projectFilesContent={projectFilesContent}
            gemfileName={gemfileName}
            uploadedFileName={uploadedFileName}
            isLoading={isLoading}
            error={error}
            gems={gems}
            selectedGems={selectedGems}
            handleFileChange={handleFileChange}
            handleGenerateClick={handleGenerateClick}
            setSelectedGems={setSelectedGems}
          />

          <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Powered by AI. Built with React & Tailwind CSS.</p>
          </footer>
        </main>
      </div>
    );
  }

  if (view === 'status') {
    return (
      <StatusPage
        isLoading={isLoading}
        progress={progress}
        error={error}
        onComplete={handleStatusComplete}
      />
    );
  }

  if (view === 'chat') {
    return (
      <MainChatPage
        chatHistory={chatHistory}
        isChatLoading={isChatLoading}
        onSendMessage={handleSendMessage}
        docSections={docSections}
        gems={gems}
        selectedGems={selectedGems}
        onGemSelectionChange={handleGemSelectionChange}
        aiProvider={aiProvider}
        isBacklogLoading={isBacklogLoading}
        onGenerateBacklog={handleGenerateBacklog}
        backlogJson={backlogJson}
        isBacklogVisible={isBacklogVisible}
        setIsBacklogVisible={setIsBacklogVisible}
        error={error}
        onClearRAG={handleClearRAG}
        chatConfig={chatConfig}
      />
    );
  }

  return null;
};

export default App;