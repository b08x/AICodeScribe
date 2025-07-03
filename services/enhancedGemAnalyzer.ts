/**
 * Enhanced Gem Analyzer
 * Integrates comprehensive gem documentation fetching with AI analysis
 */

import { GemDocumentationFetcher, GemDocumentation } from './gemDocumentationFetcher';

export interface EnhancedGemInfo {
  name: string;
  version?: string;
  documentation: GemDocumentation;
  analysisContext: string;
  usagePatterns: string[];
  recommendations: string[];
}

export interface GemAnalysisOptions {
  includeSourceCode: boolean;
  includeRDoc: boolean;
  includeExamples: boolean;
  maxSourceFiles: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

export class EnhancedGemAnalyzer {
  private documentationFetcher: GemDocumentationFetcher;

  constructor() {
    this.documentationFetcher = new GemDocumentationFetcher();
  }

  /**
   * Analyze gems with comprehensive documentation
   */
  async analyzeGemsWithDocumentation(
    gemNames: string[],
    projectContext: string,
    options: Partial<GemAnalysisOptions> = {}
  ): Promise<EnhancedGemInfo[]> {
    const defaultOptions: GemAnalysisOptions = {
      includeSourceCode: true,
      includeRDoc: true,
      includeExamples: true,
      maxSourceFiles: 10,
      analysisDepth: 'detailed'
    };

    const finalOptions = { ...defaultOptions, ...options };
    const enhancedGems: EnhancedGemInfo[] = [];

    console.log(`Analyzing ${gemNames.length} gems with comprehensive documentation...`);

    for (const gemName of gemNames) {
      try {
        console.log(`Fetching documentation for ${gemName}...`);
        const documentation = await this.documentationFetcher.fetchGemDocumentation(gemName);
        
        const analysisContext = this.generateAnalysisContext(
          documentation,
          projectContext,
          finalOptions
        );

        const usagePatterns = this.extractUsagePatterns(documentation, projectContext);
        const recommendations = this.generateRecommendations(documentation, projectContext);

        enhancedGems.push({
          name: gemName,
          version: documentation.version,
          documentation,
          analysisContext,
          usagePatterns,
          recommendations
        });

        console.log(`✓ Completed analysis for ${gemName}`);
      } catch (error) {
        console.error(`Failed to analyze ${gemName}:`, error);
        // Add basic gem info even if documentation fetch fails
        enhancedGems.push({
          name: gemName,
          documentation: { name: gemName },
          analysisContext: `Basic gem: ${gemName} (documentation unavailable)`,
          usagePatterns: [],
          recommendations: []
        });
      }
    }

    return enhancedGems;
  }

  /**
   * Generate comprehensive analysis context for AI processing
   */
  private generateAnalysisContext(
    doc: GemDocumentation,
    projectContext: string,
    options: GemAnalysisOptions
  ): string {
    const sections: string[] = [];

    // Basic gem information
    sections.push(`# ${doc.name} Analysis Context`);
    sections.push(`Version: ${doc.version || 'latest'}`);
    
    if (doc.summary) {
      sections.push(`Summary: ${doc.summary}`);
    }

    if (doc.description) {
      sections.push(`Description: ${doc.description}`);
    }

    // Dependencies
    if (doc.dependencies && doc.dependencies.length > 0) {
      sections.push(`Dependencies: ${doc.dependencies.join(', ')}`);
    }

    // README content (most important for understanding usage)
    if (options.includeRDoc && doc.readmeContent) {
      sections.push(`## README Documentation`);
      sections.push(this.extractKeyReadmeSections(doc.readmeContent));
    }

    // Source code analysis
    if (options.includeSourceCode && doc.sourceFiles) {
      sections.push(`## Key Source Files`);
      const limitedFiles = doc.sourceFiles.slice(0, options.maxSourceFiles);
      
      limitedFiles.forEach(file => {
        if (file.type === 'ruby') {
          sections.push(`### ${file.path}`);
          sections.push(this.extractKeyCodePatterns(file.content));
        }
      });
    }

    // RDoc/YARD documentation
    if (options.includeRDoc && doc.rdocContent) {
      sections.push(`## API Documentation`);
      sections.push(doc.rdocContent.substring(0, 2000));
    }

    // Project-specific context
    sections.push(`## Project Context Analysis`);
    sections.push(this.analyzeProjectUsage(doc.name, projectContext));

    return sections.join('\n\n');
  }

  /**
   * Extract key sections from README
   */
  private extractKeyReadmeSections(readme: string): string {
    const sections = readme.split(/^#+\s/m);
    const keywordSections = ['usage', 'example', 'getting started', 'installation', 'configuration'];
    
    const relevantSections = sections.filter(section => {
      const header = section.split('\n')[0].toLowerCase();
      return keywordSections.some(keyword => header.includes(keyword));
    });

    return relevantSections.join('\n\n').substring(0, 3000);
  }

  /**
   * Extract key code patterns from source files
   */
  private extractKeyCodePatterns(content: string): string {
    const patterns: string[] = [];
    
    // Extract class definitions
    const classMatches = content.match(/class\s+\w+.*?(?=\n\s*class|\n\s*module|\n\s*end\s*$|$)/gs);
    if (classMatches) {
      patterns.push('Classes: ' + classMatches.slice(0, 3).map(match => 
        match.split('\n')[0].trim()
      ).join(', '));
    }

    // Extract module definitions
    const moduleMatches = content.match(/module\s+\w+.*?(?=\n\s*class|\n\s*module|\n\s*end\s*$|$)/gs);
    if (moduleMatches) {
      patterns.push('Modules: ' + moduleMatches.slice(0, 3).map(match => 
        match.split('\n')[0].trim()
      ).join(', '));
    }

    // Extract public method definitions
    const methodMatches = content.match(/def\s+\w+.*$/gm);
    if (methodMatches) {
      patterns.push('Key Methods: ' + methodMatches.slice(0, 5).join(', '));
    }

    return patterns.join('\n').substring(0, 1000);
  }

  /**
   * Analyze how the gem might be used in the project context
   */
  private analyzeProjectUsage(gemName: string, projectContext: string): string {
    const usageIndicators: string[] = [];
    
    // Look for gem usage in project files
    const gemUsagePattern = new RegExp(`\\b${gemName}\\b`, 'gi');
    const matches = projectContext.match(gemUsagePattern);
    
    if (matches) {
      usageIndicators.push(`Found ${matches.length} references to ${gemName} in project code`);
    }

    // Look for common patterns
    const commonPatterns = [
      { pattern: /require\s+['"](.*?)['"]/, description: 'Required files' },
      { pattern: /include\s+(\w+)/, description: 'Included modules' },
      { pattern: /extend\s+(\w+)/, description: 'Extended modules' },
      { pattern: /(\w+)\.new/, description: 'Object instantiation' },
      { pattern: /(\w+)\.configure/, description: 'Configuration usage' }
    ];

    commonPatterns.forEach(({ pattern, description }) => {
      const matches = projectContext.match(pattern);
      if (matches) {
        usageIndicators.push(`${description}: ${matches.slice(0, 3).join(', ')}`);
      }
    });

    return usageIndicators.length > 0 
      ? usageIndicators.join('\n')
      : 'No direct usage patterns detected in project code';
  }

  /**
   * Extract usage patterns from documentation
   */
  private extractUsagePatterns(doc: GemDocumentation, projectContext: string): string[] {
    const patterns: string[] = [];

    // Extract from README
    if (doc.readmeContent) {
      const codeBlocks = doc.readmeContent.match(/```ruby\n(.*?)\n```/gs);
      if (codeBlocks) {
        patterns.push(...codeBlocks.slice(0, 3).map(block => 
          block.replace(/```ruby\n|\n```/g, '').trim()
        ));
      }
    }

    // Extract from source files
    if (doc.sourceFiles) {
      doc.sourceFiles.forEach(file => {
        if (file.path.includes('example') || file.path.includes('demo')) {
          patterns.push(`Example from ${file.path}:\n${file.content.substring(0, 500)}`);
        }
      });
    }

    return patterns;
  }

  /**
   * Generate recommendations based on gem analysis
   */
  private generateRecommendations(doc: GemDocumentation, projectContext: string): string[] {
    const recommendations: string[] = [];

    // Version recommendations
    if (doc.version) {
      recommendations.push(`Current version: ${doc.version} - check for updates regularly`);
    }

    // Security recommendations
    if (doc.dependencies && doc.dependencies.length > 5) {
      recommendations.push('High dependency count - monitor for security vulnerabilities');
    }

    // Usage recommendations based on gem type
    if (doc.description) {
      const desc = doc.description.toLowerCase();
      if (desc.includes('authentication')) {
        recommendations.push('Security-critical gem - ensure proper configuration and regular updates');
      }
      if (desc.includes('database') || desc.includes('orm')) {
        recommendations.push('Database-related gem - monitor query performance and migrations');
      }
      if (desc.includes('api') || desc.includes('http')) {
        recommendations.push('API-related gem - implement proper error handling and rate limiting');
      }
    }

    return recommendations;
  }

  /**
   * Generate enhanced prompt context for AI providers
   */
  generateEnhancedPromptContext(enhancedGems: EnhancedGemInfo[]): string {
    const sections: string[] = [];

    sections.push('# Enhanced Gem Analysis Context');
    sections.push('The following gems have been analyzed with comprehensive documentation:');

    enhancedGems.forEach(gem => {
      sections.push(`\n## ${gem.name} ${gem.version || ''}`);
      sections.push(gem.analysisContext);
      
      if (gem.usagePatterns.length > 0) {
        sections.push('### Usage Patterns');
        gem.usagePatterns.forEach(pattern => {
          sections.push(`\`\`\`ruby\n${pattern}\n\`\`\``);
        });
      }

      if (gem.recommendations.length > 0) {
        sections.push('### Recommendations');
        gem.recommendations.forEach(rec => {
          sections.push(`- ${rec}`);
        });
      }
    });

    return sections.join('\n');
  }
}

// Export utility function for easy integration
export async function enhanceGemfileWithDocumentation(
  gemNames: string[],
  projectContext: string,
  options?: Partial<GemAnalysisOptions>
): Promise<string> {
  const analyzer = new EnhancedGemAnalyzer();
  const enhancedGems = await analyzer.analyzeGemsWithDocumentation(
    gemNames,
    projectContext,
    options
  );
  
  return analyzer.generateEnhancedPromptContext(enhancedGems);
}