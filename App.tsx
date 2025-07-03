
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getAiProvider } from './services/ai';
import { IAiProvider, IAiProviderConfig, IChatSession } from './services/ai/provider';
import { RAGProvider } from './services/rag';

import { LoaderIcon } from './components/icons/LoaderIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { FileIcon } from './components/icons/FileIcon';
import { LandingPage } from './components/LandingPage';
import { ChatInterface, ChatMessage } from './components/ChatInterface';
import { BacklogDisplayModal } from './components/BacklogDisplayModal';
import { SetupPage } from './components/SetupPage';
import { DocumentationSidebar, DocSection } from './components/DocumentationSidebar';
import { DocumentationDetailModal } from './components/DocumentationDetailModal';


const App = () => {
  const [view, setView] = useState<'landing' | 'setup' | 'app'>('landing');
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
  
  // Documentation state
  const [docSections, setDocSections] = useState<DocSection[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [selectedDocSection, setSelectedDocSection] = useState<DocSection | null>(null);

  // Chat state
  const [chatSession, setChatSession] = useState<IChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Backlog state
  const [isBacklogLoading, setIsBacklogLoading] = useState<boolean>(false);
  const [isBacklogVisible, setIsBacklogVisible] = useState<boolean>(false);
  const [backlogJson, setBacklogJson] = useState<string | null>(null);

  const gemfileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const handleConfigured = (cConfig: IAiProviderConfig, eConfig: IAiProviderConfig) => {
    setChatConfig(cConfig);
    setEmbeddingConfig(eConfig);
    setView('app');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'gemfile' | 'project') => {
    const file = event.target.files?.[0];
    if (!file) {
      if (type === 'gemfile') {
        setGemfileContent('');
        setGemfileName(null);
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
        if(gemfileInputRef.current) gemfileInputRef.current.value = '';
      } else {
        setUploadedFileName(null);
        setProjectFilesContent('');
        if(projectFileInputRef.current) projectFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };
  
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

    setIsLoading(true);
    setError('');
    setDocSections([]);
    setChatSession(null);
    setChatHistory([]);

    try {
      const { docs, initialQuestion } = await aiProvider.generateDocumentation(gemfileContent, projectFilesContent);
      const sections = parseDocsToSections(docs);
      setDocSections(sections);
      
      const chat = await aiProvider.createChatSession(gemfileContent, projectFilesContent, docs);
      setChatSession(chat);

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
  }, [gemfileContent, projectFilesContent, isLoading, aiProvider]);

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

  const handleDocSectionClick = (section: DocSection) => {
      setSelectedDocSection(section);
      setIsDocModalOpen(true);
  };

  const handleCloseDocModal = () => {
      setIsDocModalOpen(false);
      setSelectedDocSection(null);
  };

  const handleClearRAG = () => {
    if (aiProvider && aiProvider instanceof RAGProvider) {
      aiProvider.clearRAG();
      // Force a re-render to update stats
      setChatHistory(prev => [...prev]);
    }
  };

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('setup')} />;
  }
  
  if (view === 'setup') {
    return <SetupPage onConfigured={handleConfigured} />;
  }

  const ragStats = aiProvider instanceof RAGProvider && aiProvider.isRAGReady() 
    ? aiProvider.getRAGStats() 
    : null;

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
        <main className="max-w-6xl mx-auto">
          <header className="text-center mb-8 relative">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
              AI Code-Scribe
            </h1>
            <p className="text-slate-400 text-lg">
              Upload your codebase to generate your knowledge base.
            </p>
             <div className="absolute top-0 right-0 text-right">
                <p className="text-sm font-semibold text-slate-300">{chatConfig?.providerName}</p>
                <p className="text-xs text-slate-500">{chatConfig?.model}</p>
            </div>
          </header>

          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Gemfile Upload */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-semibold mb-4 text-cyan-400">1. Upload Dependencies</h2>
                  <div className="flex-grow w-full h-48 md:h-64 border-2 border-dashed border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 bg-slate-900 transition-all duration-200 flex items-center justify-center">
                      <input
                        ref={gemfileInputRef}
                        type="file"
                        id="gemfile-upload"
                        onChange={(e) => handleFileChange(e, 'gemfile')}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <label
                        htmlFor="gemfile-upload"
                        className={`w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-800/50'}`}
                      >
                        {gemfileName ? (
                          <>
                            <FileIcon color="text-cyan-400"/>
                            <span className="mt-2 font-sans font-semibold text-cyan-400 break-all">{gemfileName}</span>
                            <span className="mt-1 text-xs text-slate-400">Click to choose a different file</span>
                          </>
                        ) : (
                          <>
                            <UploadIcon />
                            <span className="mt-2 font-sans font-semibold text-slate-300">Click to upload dependency file</span>
                            <span className="mt-1 text-xs text-slate-400">e.g., Gemfile, package.json</span>
                          </>
                        )}
                      </label>
                    </div>
                </div>
                
                {/* Project JSON Upload */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-semibold mb-4 text-green-400">2. Upload Project (JSON)</h2>
                  <div className="flex-grow w-full h-48 md:h-64 border-2 border-dashed border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 bg-slate-900 transition-all duration-200 flex items-center justify-center">
                      <input
                        ref={projectFileInputRef}
                        type="file"
                        id="project-file-upload"
                        accept=".json,application/json"
                        onChange={(e) => handleFileChange(e, 'project')}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <label
                        htmlFor="project-file-upload"
                        className={`w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-800/50'}`}
                      >
                        {uploadedFileName ? (
                          <>
                            <FileIcon color="text-green-400"/>
                            <span className="mt-2 font-sans font-semibold text-green-400 break-all">{uploadedFileName}</span>
                            <span className="mt-1 text-xs text-slate-400">Click to choose a different file</span>
                          </>
                        ) : (
                          <>
                            <UploadIcon />
                            <span className="mt-2 font-sans font-semibold text-slate-300">Click to upload JSON file</span>
                            <span className="mt-1 text-xs text-slate-400">Contains your entire codebase.</span>
                          </>
                        )}
                      </label>
                    </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="rag-toggle" className="font-semibold text-slate-300">Enable RAG</label>
                    <input 
                        id="rag-toggle"
                        type="checkbox" 
                        checked={enableRAG} 
                        onChange={(e) => setEnableRAG(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500"
                    />
                </div>
                <button
                  onClick={handleGenerateClick}
                  disabled={!gemfileContent || !projectFilesContent || isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon />
                      Generate Knowledge Base
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                <p className="font-semibold">An Error Occurred</p>
                <p>{error}</p>
              </div>
            )}

            {isLoading && docSections.length === 0 && (
              <div className="flex justify-center items-center flex-col gap-4 bg-slate-800/50 rounded-lg p-12 border border-slate-700 shadow-lg">
                  <LoaderIcon />
                  <p className="text-lg text-slate-300 animate-pulse">Analyzing your project with {chatConfig?.providerName}... this may take a moment.</p>
              </div>
            )}

            {docSections.length > 0 && !isLoading && (
              <div className="mt-6 flex flex-col lg:flex-row gap-6">
                  <div className="w-full lg:w-1/4">
                    <DocumentationSidebar sections={docSections} onSectionClick={handleDocSectionClick} />
                    {ragStats && (
                        <div className="mt-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-lg text-indigo-300 mb-2">RAG Status</h3>
                            <p className="text-sm text-slate-400">
                                <span className="font-bold">{ragStats.totalChunks}</span> chunks indexed
                            </p>
                            <p className="text-xs text-slate-500">
                                ({ragStats.docChunks} from docs, {ragStats.codeChunks} from code)
                            </p>
                            <button 
                                onClick={handleClearRAG}
                                className="mt-3 w-full text-center px-3 py-1.5 text-xs font-semibold bg-red-800/50 hover:bg-red-700/50 rounded-md transition-colors"
                            >
                                Clear RAG Data
                            </button>
                        </div>
                    )}
                  </div>
                  <div className="flex-1">
                      <ChatInterface
                          history={chatHistory}
                          isLoading={isChatLoading}
                          onSendMessage={handleSendMessage}
                          isBacklogLoading={isBacklogLoading}
                          onGenerateBacklog={handleGenerateBacklog}
                      />
                  </div>
              </div>
            )}
          </div>

          <footer className="text-center mt-12 text-slate-500 text-sm">
              <p>Powered by AI. Built with React & Tailwind CSS.</p>
          </footer>
        </main>
      </div>
      <BacklogDisplayModal
        isOpen={isBacklogVisible}
        isLoading={isBacklogLoading}
        jsonContent={backlogJson}
        onClose={() => setIsBacklogVisible(false)}
        error={error}
      />
      <DocumentationDetailModal
        isOpen={isDocModalOpen}
        section={selectedDocSection}
        onClose={handleCloseDocModal}
      />
    </>
  );
};

export default App;
