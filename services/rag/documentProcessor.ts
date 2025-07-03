// Document processing and chunking for RAG
export interface DocumentChunk {
  id: string;
  content: string;
  title: string;
  section: string;
  metadata: {
    source: 'documentation' | 'code';
    type: string;
    size: number;
  };
}

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[];
}

export class DocumentProcessor {
  static chunkDocumentation(markdown: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sections = markdown.split(/^## /gm).filter(section => section.trim());
    
    sections.forEach((section, index) => {
      const lines = section.split('\n');
      const title = lines[0]?.replace(/^#+\s*/, '').trim() || `Section ${index + 1}`;
      
      // Split large sections into smaller chunks
      const maxChunkSize = 1000; // characters
      const content = lines.slice(1).join('\n').trim();
      
      if (content.length <= maxChunkSize) {
        chunks.push({
          id: `doc-${index}`,
          content,
          title,
          section: title,
          metadata: {
            source: 'documentation',
            type: 'section',
            size: content.length
          }
        });
      } else {
        // Split large sections into smaller chunks
        const words = content.split(' ');
        let currentChunk = '';
        let chunkIndex = 0;
        
        for (const word of words) {
          if ((currentChunk + ' ' + word).length > maxChunkSize && currentChunk) {
            chunks.push({
              id: `doc-${index}-${chunkIndex}`,
              content: currentChunk.trim(),
              title: `${title} (Part ${chunkIndex + 1})`,
              section: title,
              metadata: {
                source: 'documentation',
                type: 'section-part',
                size: currentChunk.length
              }
            });
            currentChunk = word;
            chunkIndex++;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        }
        
        if (currentChunk) {
          chunks.push({
            id: `doc-${index}-${chunkIndex}`,
            content: currentChunk.trim(),
            title: `${title} (Part ${chunkIndex + 1})`,
            section: title,
            metadata: {
              source: 'documentation',
              type: 'section-part',
              size: currentChunk.length
            }
          });
        }
      }
    });
    
    return chunks;
  }
  
  static chunkCodebase(projectContent: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    try {
      const parsed = JSON.parse(projectContent);
      if (parsed.files && Array.isArray(parsed.files)) {
        parsed.files.forEach((file: any, index: number) => {
          if (file.content && file.path) {
            chunks.push({
              id: `code-${index}`,
              content: file.content,
              title: file.path.split('/').pop() || file.path,
              section: file.path,
              metadata: {
                source: 'code',
                type: 'file',
                size: file.content.length
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing project content:', error);
    }
    
    return chunks;
  }
}