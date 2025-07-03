import React from 'react';
import { LoaderIcon } from './icons/LoaderIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface StatusPageProps {
  isLoading: boolean;
  progress: {
    step: string;
    description: string;
    percentage: number;
  };
  error: string;
  onComplete: () => void;
}

export const StatusPage: React.FC<StatusPageProps> = ({
  isLoading,
  progress,
  error,
  onComplete,
}) => {
  const steps = [
    { id: 'parsing', label: 'Parsing Dependencies', description: 'Analyzing uploaded files...' },
    { id: 'processing', label: 'Processing Code', description: 'Extracting code structure and patterns...' },
    { id: 'embedding', label: 'Creating Embeddings', description: 'Generating vector embeddings for RAG...' },
    { id: 'indexing', label: 'Building Index', description: 'Creating searchable knowledge base...' },
    { id: 'finalizing', label: 'Finalizing', description: 'Preparing chat interface...' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === progress.step);

  React.useEffect(() => {
    if (!isLoading && !error && progress.percentage === 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500); // Small delay to show completion
      return () => clearTimeout(timer);
    }
  }, [isLoading, error, progress.percentage, onComplete]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
            AI Code-Scribe
          </h1>
          <p className="text-slate-400 text-lg">
            Generating your knowledge base...
          </p>
        </header>

        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 shadow-lg">
          {error ? (
            <div className="text-center">
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
                <p>{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">Overall Progress</span>
                  <span className="text-sm font-medium text-slate-300">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {isLoading ? <LoaderIcon /> : <SparklesIcon />}
                  <h2 className="text-2xl font-semibold text-cyan-400">
                    {progress.step === 'complete' ? 'Complete!' : steps.find(s => s.id === progress.step)?.label || 'Processing...'}
                  </h2>
                </div>
                <p className="text-slate-400 text-lg">
                  {progress.description}
                </p>
              </div>

              {/* Step Indicators */}
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex || progress.percentage === 100;
                  const isCurrent = index === currentStepIndex;
                  const isPending = index > currentStepIndex && progress.percentage < 100;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-900/30 border border-green-700/50'
                          : isCurrent
                          ? 'bg-cyan-900/30 border border-cyan-700/50'
                          : 'bg-slate-800/30 border border-slate-700/50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isCompleted
                            ? 'bg-green-600 text-white'
                            : isCurrent
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            isCompleted
                              ? 'text-green-300'
                              : isCurrent
                              ? 'text-cyan-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </h3>
                        <p
                          className={`text-sm ${
                            isCompleted
                              ? 'text-green-400'
                              : isCurrent
                              ? 'text-cyan-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                      {isCurrent && isLoading && (
                        <div className="w-6 h-6">
                          <LoaderIcon />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {progress.percentage === 100 && !isLoading && (
                <div className="text-center mt-8">
                  <div className="bg-green-900/30 border border-green-700/50 text-green-300 p-4 rounded-lg mb-4">
                    <p className="font-semibold">Knowledge base generated successfully!</p>
                    <p className="text-sm text-green-400">Redirecting to chat interface...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>Powered by AI. Built with React & Tailwind CSS.</p>
        </footer>
      </main>
    </div>
  );
};