
import React from 'react';
import { MarkdownContent } from './MarkdownContent';

interface DocumentationDisplayProps {
  markdown: string;
}

export const DocumentationDisplay: React.FC<DocumentationDisplayProps> = ({ markdown }) => {
  return (
    <div className="prose-styles">
      <MarkdownContent content={markdown} />
    </div>
  );
};
