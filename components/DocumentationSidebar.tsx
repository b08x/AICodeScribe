import React from 'react';

export interface DocSection {
  title: string;
  markdown: string;
}

export interface GemInfo {
  name: string;
  version?: string;
}

interface DocumentationSidebarProps {
  sections: DocSection[];
  gems: GemInfo[];
  selectedGems: Set<string>;
  onGemSelectionChange: (gemName: string, selected: boolean) => void;
  onSectionClick: (section: DocSection) => void;
}

export const DocumentationSidebar: React.FC<DocumentationSidebarProps> = ({ sections, gems, selectedGems, onGemSelectionChange, onSectionClick }) => {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg self-start" style={{height: '70vh'}}>
      <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Knowledge Base</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Gems (Select for RAG)</h3>
        <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {gems.length === 0 && <li className="text-slate-500 text-sm">No gems found</li>}
          {gems.map(gem => (
            <li key={gem.name} className="text-slate-200 text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedGems.has(gem.name)}
                onChange={e => onGemSelectionChange(gem.name, e.target.checked)}
                className="accent-cyan-400"
                id={`gem-select-${gem.name}`}
              />
              <label htmlFor={`gem-select-${gem.name}`} className="font-mono text-cyan-300 cursor-pointer select-none">
                {gem.name}
              </label>
              {gem.version && <span className="text-slate-400">{gem.version}</span>}
            </li>
          ))}
        </ul>
      </div>
      <nav className="h-[calc(70vh-180px)] overflow-y-auto pr-2">
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.title}>
              <button
                onClick={() => onSectionClick(section)}
                className="w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-cyan-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={`View documentation for ${section.title}`}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
