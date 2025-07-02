import React from 'react';

export interface DocSection {
  title: string;
  markdown: string;
}

interface DocumentationSidebarProps {
  sections: DocSection[];
  onSectionClick: (section: DocSection) => void;
}

export const DocumentationSidebar: React.FC<DocumentationSidebarProps> = ({ sections, onSectionClick }) => {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg self-start" style={{height: '70vh'}}>
      <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Knowledge Base</h2>
      <nav className="h-[calc(70vh-80px)] overflow-y-auto pr-2">
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
