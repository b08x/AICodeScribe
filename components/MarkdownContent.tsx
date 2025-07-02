
import React from 'react';

interface MarkdownContentProps {
  content: string;
}

const CodeBlock: React.FC<{ children: React.ReactNode, language: string }> = ({ children, language }) => (
    <div className="bg-slate-900 rounded-md my-4">
        <div className="bg-slate-700/50 text-slate-300 text-xs px-4 py-2 rounded-t-md flex justify-between items-center">
            <span>{language || 'code'}</span>
        </div>
        <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
            <code>{children}</code>
        </pre>
    </div>
);

const renderLine = (line: string): React.ReactNode => {
    // Bold and Italic
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Inline code
    line = line.replace(/`(.*?)`/g, '<code class="bg-slate-700 text-xs rounded px-1.5 py-1 text-cyan-300">$1</code>');

    return <span dangerouslySetInnerHTML={{ __html: line }} />;
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let isCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let listItems: string[] = [];

    const flushList = (key: string | number) => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={key} className="list-disc pl-6 space-y-2 my-2">
                    {listItems.map((item, i) => (
                        <li key={i} className="text-slate-300 leading-relaxed">{renderLine(item)}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };
    
    lines.forEach((line, index) => {
        if (line.trim().startsWith('```')) {
            flushList(`list-before-code-${index}`);
            if (isCodeBlock) {
                elements.push(<CodeBlock key={`code-${index}`} language={codeBlockLanguage}>{codeBlockContent.join('\n')}</CodeBlock>);
                codeBlockContent = [];
                codeBlockLanguage = '';
            } else {
                codeBlockLanguage = line.substring(3).trim();
            }
            isCodeBlock = !isCodeBlock;
            return;
        }

        if (isCodeBlock) {
            codeBlockContent.push(line);
            return;
        }

        if (line.startsWith('## ')) {
            flushList(`list-${index}`);
            elements.push(<h2 key={index} className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-slate-600 text-cyan-300">{line.substring(3)}</h2>);
        } else if (line.startsWith('### ')) {
            flushList(`list-${index}`);
            elements.push(<h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-slate-200">{line.substring(4)}</h3>);
        } else if (line.match(/^(\s*[\*\-]\s)/)) {
            listItems.push(line.replace(/^(\s*[\*\-]\s)/, ''));
        } else if (line.trim() !== '') {
            flushList(`list-${index}`);
            elements.push(<p key={index} className="text-slate-300 leading-relaxed my-2">{renderLine(line)}</p>);
        } else { // Empty line
             flushList(`list-${index}`);
        }
    });

    flushList('final-list');

    if (codeBlockContent.length > 0) {
      elements.push(<CodeBlock key="final-code-block" language={codeBlockLanguage}>{codeBlockContent.join('\n')}</CodeBlock>);
    }

    return <>{elements}</>;
};
