/**
 * Comprehensive Gem Documentation Fetcher
 * Fetches documentation and source code for Ruby gems from multiple sources
 */

export interface GemDocumentation {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  sourceCodeUri?: string;
  documentationUri?: string;
  rdocContent?: string;
  readmeContent?: string;
  gemspecContent?: string;
  sourceFiles?: SourceFile[];
  dependencies?: string[];
  authors?: string[];
  license?: string;
  summary?: string;
}

export interface SourceFile {
  path: string;
  content: string;
  type: 'ruby' | 'markdown' | 'yaml' | 'other';
}

export class GemDocumentationFetcher {
  private readonly RUBYGEMS_API_BASE = 'https://rubygems.org/api/v1';
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly RUBYDOC_BASE = 'https://rubydoc.info';

  /**
   * Fetch comprehensive documentation for a gem
   */
  async fetchGemDocumentation(gemName: string, version?: string): Promise<GemDocumentation> {
    const doc: GemDocumentation = { name: gemName, version };

    try {
      // 1. Fetch basic gem metadata from RubyGems.org
      await this.fetchRubyGemsMetadata(doc);

      // 2. Fetch README and source files from repository
      if (doc.sourceCodeUri) {
        await this.fetchRepositoryContent(doc);
      }

      // 3. Fetch RDoc documentation
      await this.fetchRDocContent(doc);

      // 4. Fetch YARD documentation if available
      await this.fetchYardDocumentation(doc);

      return doc;
    } catch (error) {
      console.error(`Error fetching documentation for ${gemName}:`, error);
      return doc;
    }
  }

  /**
   * Fetch multiple gems' documentation in parallel
   */
  async fetchMultipleGems(gemNames: string[]): Promise<GemDocumentation[]> {
    const promises = gemNames.map(name => this.fetchGemDocumentation(name));
    return Promise.allSettled(promises).then(results =>
      results
        .filter((result): result is PromiseFulfilledResult<GemDocumentation> => 
          result.status === 'fulfilled')
        .map(result => result.value)
    );
  }

  /**
   * Fetch gem metadata from RubyGems.org API
   */
  private async fetchRubyGemsMetadata(doc: GemDocumentation): Promise<void> {
    try {
      const response = await fetch(`${this.RUBYGEMS_API_BASE}/gems/${doc.name}.json`);
      if (!response.ok) return;

      const data = await response.json();
      
      doc.description = data.info;
      doc.summary = data.summary;
      doc.homepage = data.homepage_uri;
      doc.sourceCodeUri = data.source_code_uri;
      doc.documentationUri = data.documentation_uri;
      doc.version = data.version;
      doc.authors = data.authors?.split(', ') || [];
      doc.license = data.licenses?.join(', ');
      doc.dependencies = data.dependencies?.runtime?.map((dep: any) => dep.name) || [];
    } catch (error) {
      console.error(`Failed to fetch RubyGems metadata for ${doc.name}:`, error);
    }
  }

  /**
   * Fetch repository content (README, source files, etc.)
   */
  private async fetchRepositoryContent(doc: GemDocumentation): Promise<void> {
    if (!doc.sourceCodeUri) return;

    try {
      const repoInfo = this.parseGitHubUrl(doc.sourceCodeUri);
      if (!repoInfo) return;

      // Fetch README
      await this.fetchReadme(doc, repoInfo);

      // Fetch gemspec
      await this.fetchGemspec(doc, repoInfo);

      // Fetch key source files
      await this.fetchSourceFiles(doc, repoInfo);
    } catch (error) {
      console.error(`Failed to fetch repository content for ${doc.name}:`, error);
    }
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  /**
   * Fetch README file from GitHub
   */
  private async fetchReadme(doc: GemDocumentation, repoInfo: { owner: string; repo: string }): Promise<void> {
    try {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${repoInfo.owner}/${repoInfo.repo}/readme`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3.raw'
          }
        }
      );
      
      if (response.ok) {
        doc.readmeContent = await response.text();
      }
    } catch (error) {
      console.error(`Failed to fetch README for ${doc.name}:`, error);
    }
  }

  /**
   * Fetch gemspec file
   */
  private async fetchGemspec(doc: GemDocumentation, repoInfo: { owner: string; repo: string }): Promise<void> {
    try {
      // Try common gemspec file patterns
      const gemspecPatterns = [
        `${doc.name}.gemspec`,
        `${repoInfo.repo}.gemspec`,
        'gemspec'
      ];

      for (const pattern of gemspecPatterns) {
        try {
          const response = await fetch(
            `${this.GITHUB_API_BASE}/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${pattern}`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );
          
          if (response.ok) {
            doc.gemspecContent = await response.text();
            break;
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    } catch (error) {
      console.error(`Failed to fetch gemspec for ${doc.name}:`, error);
    }
  }

  /**
   * Fetch key source files from the repository
   */
  private async fetchSourceFiles(doc: GemDocumentation, repoInfo: { owner: string; repo: string }): Promise<void> {
    try {
      // Get repository tree
      const treeResponse = await fetch(
        `${this.GITHUB_API_BASE}/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/HEAD?recursive=1`
      );
      
      if (!treeResponse.ok) return;
      
      const treeData = await treeResponse.json();
      const sourceFiles: SourceFile[] = [];

      // Filter for important files
      const importantFiles = treeData.tree.filter((file: any) => {
        const path = file.path.toLowerCase();
        return (
          file.type === 'blob' &&
          (
            path.startsWith('lib/') && path.endsWith('.rb') ||
            path === 'changelog.md' ||
            path === 'changelog' ||
            path === 'history.md' ||
            path.includes('example') && path.endsWith('.rb')
          )
        );
      }).slice(0, 20); // Limit to first 20 files

      // Fetch content for each important file
      for (const file of importantFiles) {
        try {
          const fileResponse = await fetch(
            `${this.GITHUB_API_BASE}/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${file.path}`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );
          
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            sourceFiles.push({
              path: file.path,
              content,
              type: this.getFileType(file.path)
            });
          }
        } catch (error) {
          // Continue with other files
        }
      }

      doc.sourceFiles = sourceFiles;
    } catch (error) {
      console.error(`Failed to fetch source files for ${doc.name}:`, error);
    }
  }

  /**
   * Determine file type based on extension
   */
  private getFileType(path: string): 'ruby' | 'markdown' | 'yaml' | 'other' {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'rb': return 'ruby';
      case 'md': case 'markdown': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      default: return 'other';
    }
  }

  /**
   * Fetch RDoc documentation
   */
  private async fetchRDocContent(doc: GemDocumentation): Promise<void> {
    try {
      // Try to fetch from rubydoc.info
      const rdocUrl = `${this.RUBYDOC_BASE}/gems/${doc.name}/${doc.version || 'frames'}`;
      const response = await fetch(rdocUrl);
      
      if (response.ok) {
        const html = await response.text();
        // Extract meaningful content from HTML (you might want to use a proper HTML parser)
        doc.rdocContent = this.extractTextFromHtml(html);
      }
    } catch (error) {
      console.error(`Failed to fetch RDoc for ${doc.name}:`, error);
    }
  }

  /**
   * Fetch YARD documentation
   */
  private async fetchYardDocumentation(doc: GemDocumentation): Promise<void> {
    try {
      // YARD documentation is often available at rubydoc.info
      const yardUrl = `${this.RUBYDOC_BASE}/gems/${doc.name}/${doc.version || 'latest'}`;
      const response = await fetch(yardUrl);
      
      if (response.ok) {
        const html = await response.text();
        // Parse YARD-specific content
        const yardContent = this.extractYardContent(html);
        if (yardContent && !doc.rdocContent) {
          doc.rdocContent = yardContent;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch YARD documentation for ${doc.name}:`, error);
    }
  }

  /**
   * Extract text content from HTML (basic implementation)
   */
  private extractTextFromHtml(html: string): string {
    // This is a basic implementation - you might want to use a proper HTML parser
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit content size
  }

  /**
   * Extract YARD-specific content
   */
  private extractYardContent(html: string): string | null {
    // Look for YARD-specific patterns and extract documentation
    const yardPatterns = [
      /<div[^>]*class="[^"]*docstring[^"]*"[^>]*>(.*?)<\/div>/gs,
      /<div[^>]*id="method_details"[^>]*>(.*?)<\/div>/gs
    ];

    for (const pattern of yardPatterns) {
      const match = html.match(pattern);
      if (match) {
        return this.extractTextFromHtml(match[1]);
      }
    }

    return null;
  }

  /**
   * Generate a comprehensive documentation summary for AI processing
   */
  generateDocumentationSummary(doc: GemDocumentation): string {
    const sections: string[] = [];

    sections.push(`# ${doc.name} ${doc.version || ''}`);
    
    if (doc.summary) {
      sections.push(`## Summary\n${doc.summary}`);
    }

    if (doc.description) {
      sections.push(`## Description\n${doc.description}`);
    }

    if (doc.dependencies && doc.dependencies.length > 0) {
      sections.push(`## Dependencies\n${doc.dependencies.join(', ')}`);
    }

    if (doc.readmeContent) {
      sections.push(`## README\n${doc.readmeContent.substring(0, 5000)}`);
    }

    if (doc.sourceFiles && doc.sourceFiles.length > 0) {
      sections.push(`## Key Source Files`);
      doc.sourceFiles.forEach(file => {
        if (file.type === 'ruby') {
          sections.push(`### ${file.path}\n\`\`\`ruby\n${file.content.substring(0, 2000)}\n\`\`\``);
        }
      });
    }

    if (doc.rdocContent) {
      sections.push(`## Documentation\n${doc.rdocContent.substring(0, 3000)}`);
    }

    return sections.join('\n\n');
  }
}

// Usage example:
export async function enhanceGemfileAnalysis(gemNames: string[]): Promise<string> {
  const fetcher = new GemDocumentationFetcher();
  const gemDocs = await fetcher.fetchMultipleGems(gemNames);
  
  return gemDocs
    .map(doc => fetcher.generateDocumentationSummary(doc))
    .join('\n\n---\n\n');
}