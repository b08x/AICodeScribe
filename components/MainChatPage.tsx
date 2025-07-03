import React, { useState } from 'react';
import { ChatInterface, ChatMessage } from './ChatInterface';
import { DocumentationSidebar, DocSection, GemInfo } from './DocumentationSidebar';
import { DocumentationDetailModal } from './DocumentationDetailModal';
import { BacklogDisplayModal } from './BacklogDisplayModal';
import { IAiProvider } from '../services/ai/provider';
import { RAGProvider } from '../services/rag';

interface MainChatPageProps {
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string, options: { isRegenerating: boolean; signal?: AbortSignal }) => void;
  docSections: DocSection[];
  gems: GemInfo[];
  selectedGems: Set<string>;
  onGemSelectionChange: (gemName: string, selected: boolean) => void;
  aiProvider: IAiProvider | null;
  isBacklogLoading: boolean;
  onGenerateBacklog: () => void;
  backlogJson: string | null;
  isBacklogVisible: boolean;
  setIsBacklogVisible: (visible: boolean) => void;
  error: string;
  onClearRAG: () => void;
  chatConfig: any;
}

export const MainChatPage: React.FC<MainChatPageProps> = ({
  chatHistory,
  isChatLoading,
  onSendMessage,
  docSections,
  gems,
  selectedGems,
  onGemSelectionChange,
  aiProvider,
  isBacklogLoading,
  onGenerateBacklog,
  backlogJson,
  isBacklogVisible,
  setIsBacklogVisible,
  error,
  onClearRAG,
  chatConfig,
}) => {
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [selectedDocSection, setSelectedDocSection] = useState<DocSection | null>(null);

  const handleDocSectionClick = (section: DocSection) => {
    setSelectedDocSection(section);
    setIsDocModalOpen(true);
  };

  const handleCloseDocModal = () => {
    setIsDocModalOpen(false);
    setSelectedDocSection(null);
  };

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
              Chat with your codebase knowledge base.
            </p>
            <div className="absolute top-0 right-0 text-right">
              <p className="text-sm font-semibold text-slate-300">{chatConfig?.providerName}</p>
              <p className="text-xs text-slate-500">{chatConfig?.model}</p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/4">
              <DocumentationSidebar
                sections={docSections}
                gems={gems}
                selectedGems={selectedGems}
                onGemSelectionChange={onGemSelectionChange}
                onSectionClick={handleDocSectionClick}
              />
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
                    onClick={onClearRAG}
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
                onSendMessage={onSendMessage}
                isBacklogLoading={isBacklogLoading}
                onGenerateBacklog={onGenerateBacklog}
              />
            </div>
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