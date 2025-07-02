import React from 'react';
import { CopyButton } from './CopyButton';
import { CloseIcon } from './icons/CloseIcon';
import { DocumentationDisplay } from './DocumentationDisplay';

export interface DocSection {
  title: string;
  markdown: string;
}

interface DocumentationDetailModalProps {
  isOpen: boolean;
  section: DocSection | null;
  onClose: () => void;
}

export const DocumentationDetailModal: React.FC<DocumentationDetailModalProps> = ({ isOpen, section, onClose }) => {
  if (!isOpen || !section) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="doc-modal-title" className="text-2xl font-semibold text-cyan-300">{section.title}</h2>
          <div className="flex items-center gap-2">
            <CopyButton textToCopy={section.markdown} />
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label="Close documentation view">
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          <DocumentationDisplay markdown={section.markdown} />
        </div>
      </div>
    </div>
  );
};
