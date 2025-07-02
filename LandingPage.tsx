
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center justify-center p-4">
      <main className="max-w-4xl mx-auto text-center">
        <header className="mb-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-4">
            AI Code-Scribe
          </h1>
          <p className="text-slate-400 text-xl sm:text-2xl max-w-2xl mx-auto">
            Your AI-powered assistant for creating a contextual, project-specific knowledge base for your application.
          </p>
        </header>

        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 shadow-lg mb-8">
          <h2 className="text-3xl font-semibold mb-6 text-slate-100">How It Works</h2>
          <div className="flex flex-col md:flex-row gap-8 text-left">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 text-cyan-300 rounded-full flex items-center justify-center font-bold text-lg">1</span>
                <h3 className="text-xl font-semibold text-cyan-400">Configure AI</h3>
              </div>
              <p className="ml-11 text-slate-400">Choose your AI provider (like Google Gemini or OpenRouter), and provide your API key and model preferences.</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center font-bold text-lg">2</span>
                <h3 className="text-xl font-semibold text-green-400">Upload Project</h3>
              </div>
              <p className="ml-11 text-slate-400">Upload your dependency file (e.g., Gemfile) and a JSON file containing your project's codebase.</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                 <span className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-lg">3</span>
                <h3 className="text-xl font-semibold text-indigo-400">Generate & Chat</h3>
              </div>
              <p className="ml-11 text-slate-400">The AI analyzes your project to generate documentation and an interactive chat-based knowledge base.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onEnterApp}
          className="flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-8 py-4 font-semibold text-lg text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all transform hover:scale-105"
        >
          <SparklesIcon />
          Start Setup
        </button>
      </main>
      <footer className="absolute bottom-6 text-center text-slate-500 text-sm">
        <p>Powered by AI. Built with React & Tailwind CSS.</p>
      </footer>
    </div>
  );
};
