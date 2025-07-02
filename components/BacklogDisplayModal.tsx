
import React from 'react';
import { CopyButton } from './CopyButton';
import { CloseIcon } from './icons/CloseIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface BacklogDisplayModalProps {
  isOpen: boolean;
  isLoading: boolean;
  jsonContent: string | null;
  onClose: () => void;
  error?: string | null;
}

export const BacklogDisplayModal: React.FC<BacklogDisplayModalProps> = ({ isOpen, isLoading, jsonContent, onClose, error }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-indigo-300">Generated Task Backlog</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700">
            <CloseIcon />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64">
              <LoaderIcon />
              <p className="mt-4 text-slate-300">Generating backlog from session...</p>
            </div>
          )}
          
          {!isLoading && error && (
             <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
              <p className="font-semibold">Could not generate backlog</p>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && jsonContent && (
            <div className="bg-slate-900 rounded-md">
                <div className="bg-slate-700/50 text-slate-300 text-xs px-4 py-2 rounded-t-md flex justify-between items-center">
                    <span>backlog.json</span>
                    <CopyButton textToCopy={jsonContent} />
                </div>
                <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
                    <code>{jsonContent}</code>
                </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
