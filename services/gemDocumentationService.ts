/**
 * Gem Documentation Service
 * Main service for integrating comprehensive gem documentation into AICodeScribe
 */

import { EnhancedGemAnalyzer, EnhancedGemInfo, GemAnalysisOptions } from './enhancedGemAnalyzer';

export interface GemDocumentationConfig {
  enableSourceCodeFetching: boolean;
  enableRDocFetching: boolean;
  enableExampleExtraction: boolean;
  maxGemsToAnalyze: number;
  maxSourceFilesPerGem: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  cacheDocumentation: boolean;
  cacheDurationHours: number;
}

export interface CachedGemDoc {
  gemName: string;
  documentation: EnhancedGemInfo;
  timestamp: number;
  version?: string;
}

export class GemDocumentationService {
  private analyzer: EnhancedGemAnalyzer;
  private config: GemDocumentationConfig;
  private cache: Map<string, CachedGemDoc> = new Map();

  constructor(config: Partial<GemDocumentationConfig> = {}) {
    this.analyzer = new EnhancedGemAnalyzer();
    this.config = {
      enableSourceCodeFetching: true,
      enableRDocFetching: true,
      enableExampleExtraction: true,
      maxGemsToAnalyze: 20,
      maxSourceFilesPerGem: 5,
      analysisDepth: 'detailed',
      cacheDocumentation: true,
      cacheDurationHours: 24,
      ...config
    };
  }

  /**
   * Main method to enhance Gemfile analysis with comprehensive documentation
   */
  async enhanceGemfileAnalysis(
    gemfileContent: string,
    projectContext: string
  ): Promise<{
    enhancedContext: string;
    gemDocumentations: EnhancedGemInfo[];
    analysisMetadata: {
      totalGems: number;
      analyzedGems: number;
      cacheHits: number;
      fetchTime: number;
    };
  }> {
    const startTime = Date.now();
    
    // Parse gems from Gemfile
    const gemNames = this.parseGemNames(gemfileContent);
    const limitedGems = gemNames.slice(0, this.config.maxGemsToAnalyze);
    
    console.log(`Enhancing analysis for ${limitedGems.length} gems...`);

    // Check cache and fetch documentation
    const { enhancedGems, cacheHits } = await this.getEnhancedGemDocumentations(
      limitedGems,
      projectContext
    );

    // Generate enhanced context
    const enhancedContext = this.generateEnhancedContext(
      gemfileContent,
      projectContext,
      enhancedGems
    );

    const fetchTime = Date.now() - startTime;

    return {
      enhancedContext,
      gemDocumentations: enhancedGems,
      analysisMetadata: {
        totalGems: gemNames.length,
        analyzedGems: enhancedGems.length,
        cacheHits,
        fetchTime
      }
    };
  }

  /**
   * Parse gem names from Gemfile content
   */
  private parseGemNames(gemfileContent: string): string[] {
    const gemRegex = /^\s*gem\s+['\"]([^'\"]+)['\"](?:\s*,\s*['\"]([^'\"]+)['\"])?/gm;
    const gems: string[] = [];
    let match;

    while ((match = gemRegex.exec(gemfileContent)) !== null) {
      gems.push(match[1]);
    }

    return gems;
  }

  /**
   * Get enhanced gem documentations with caching
   */
  private async getEnhancedGemDocumentations(
    gemNames: string[],
    projectContext: string
  ): Promise<{ enhancedGems: EnhancedGemInfo[]; cacheHits: number }> {
    const enhancedGems: EnhancedGemInfo[] = [];
    const gemsToFetch: string[] = [];
    let cacheHits = 0;

    // Check cache first
    if (this.config.cacheDocumentation) {
      for (const gemName of gemNames) {
        const cached = this.getCachedDocumentation(gemName);
        if (cached) {
          enhancedGems.push(cached.documentation);
          cacheHits++;
        } else {
          gemsToFetch.push(gemName);
        }
      }
    } else {
      gemsToFetch.push(...gemNames);
    }

    // Fetch documentation for non-cached gems
    if (gemsToFetch.length > 0) {
      console.log(`Fetching documentation for ${gemsToFetch.length} gems...`);
      
      const analysisOptions: Partial<GemAnalysisOptions> = {
        includeSourceCode: this.config.enableSourceCodeFetching,
        includeRDoc: this.config.enableRDocFetching,
        includeExamples: this.config.enableExampleExtraction,
        maxSourceFiles: this.config.maxSourceFilesPerGem,
        analysisDepth: this.config.analysisDepth
      };

      const newlyFetched = await this.analyzer.analyzeGemsWithDocumentation(
        gemsToFetch,
        projectContext,
        analysisOptions
      );

      // Cache the results
      if (this.config.cacheDocumentation) {
        newlyFetched.forEach(gem => {
          this.cacheDocumentation(gem);
        });
      }

      enhancedGems.push(...newlyFetched);
    }

    return { enhancedGems, cacheHits };
  }

  /**
   * Generate enhanced context for AI processing
   */
  private generateEnhancedContext(
    gemfileContent: string,
    projectContext: string,
    enhancedGems: EnhancedGemInfo[]
  ): string {
    const sections: string[] = [];

    sections.push('# Enhanced Gemfile Analysis with Comprehensive Documentation');
    sections.push('');
    sections.push('## Original Gemfile');
    sections.push('```ruby');
    sections.push(gemfileContent);
    sections.push('```');
    sections.push('');

    sections.push('## Comprehensive Gem Documentation');
    sections.push('Each gem has been analyzed with full documentation, source code, and usage patterns:');
    sections.push('');

    enhancedGems.forEach(gem => {
      sections.push(`### ${gem.name} ${gem.version || ''}`);
      sections.push('');
      
      // Basic information
      if (gem.documentation.summary) {
        sections.push(`**Summary:** ${gem.documentation.summary}`);
      }
      
      if (gem.documentation.description) {
        sections.push(`**Description:** ${gem.documentation.description}`);
      }

      // Dependencies
      if (gem.documentation.dependencies && gem.documentation.dependencies.length > 0) {
        sections.push(`**Dependencies:** ${gem.documentation.dependencies.join(', ')}`);
      }

      // Usage patterns
      if (gem.usagePatterns.length > 0) {
        sections.push('**Usage Examples:**');
        gem.usagePatterns.forEach((pattern, index) => {
          sections.push(`\`\`\`ruby`);
          sections.push(pattern);
          sections.push(`\`\`\``);
        });
      }

      // Recommendations
      if (gem.recommendations.length > 0) {
        sections.push('**Recommendations:**');
        gem.recommendations.forEach(rec => {
          sections.push(`- ${rec}`);
        });
      }

      // Documentation links
      if (gem.documentation.homepage) {
        sections.push(`**Homepage:** ${gem.documentation.homepage}`);
      }
      
      if (gem.documentation.documentationUri) {
        sections.push(`**Documentation:** ${gem.documentation.documentationUri}`);
      }

      sections.push('');
      sections.push('---');
      sections.push('');
    });

    sections.push('## Project Context Analysis');
    sections.push('Based on the project code and gem documentation, here are the key insights:');
    sections.push('');

    // Generate project-specific insights
    const insights = this.generateProjectInsights(enhancedGems, projectContext);
    sections.push(insights);

    return sections.join('\n');
  }

  /**
   * Generate project-specific insights
   */
  private generateProjectInsights(enhancedGems: EnhancedGemInfo[], projectContext: string): string {
    const insights: string[] = [];

    // Categorize gems
    const categories = this.categorizeGems(enhancedGems);
    
    Object.entries(categories).forEach(([category, gems]) => {
      if (gems.length > 0) {
        insights.push(`**${category}:** ${gems.map(g => g.name).join(', ')}`);
      }
    });

    // Identify potential issues
    const issues = this.identifyPotentialIssues(enhancedGems, projectContext);
    if (issues.length > 0) {
      insights.push('');
      insights.push('**Potential Issues:**');
      issues.forEach(issue => {
        insights.push(`- ${issue}`);
      });
    }

    // Suggest optimizations
    const optimizations = this.suggestOptimizations(enhancedGems, projectContext);
    if (optimizations.length > 0) {
      insights.push('');
      insights.push('**Optimization Suggestions:**');
      optimizations.forEach(opt => {
        insights.push(`- ${opt}`);
      });
    }

    return insights.join('\n');
  }

  /**
   * Categorize gems by their purpose
   */
  private categorizeGems(enhancedGems: EnhancedGemInfo[]): Record<string, EnhancedGemInfo[]> {
    const categories: Record<string, EnhancedGemInfo[]> = {
      'Authentication & Authorization': [],
      'Database & ORM': [],
      'API & HTTP': [],
      'Testing': [],
      'UI & Frontend': [],
      'Background Jobs': [],
      'Configuration': [],
      'Development Tools': [],
      'Other': []
    };

    enhancedGems.forEach(gem => {
      const desc = (gem.documentation.description || gem.documentation.summary || '').toLowerCase();
      
      if (desc.includes('auth') || desc.includes('login') || desc.includes('permission')) {
        categories['Authentication & Authorization'].push(gem);
      } else if (desc.includes('database') || desc.includes('orm') || desc.includes('sql')) {
        categories['Database & ORM'].push(gem);
      } else if (desc.includes('api') || desc.includes('http') || desc.includes('rest')) {
        categories['API & HTTP'].push(gem);
      } else if (desc.includes('test') || desc.includes('spec') || desc.includes('mock')) {
        categories['Testing'].push(gem);
      } else if (desc.includes('ui') || desc.includes('css') || desc.includes('javascript')) {
        categories['UI & Frontend'].push(gem);
      } else if (desc.includes('job') || desc.includes('queue') || desc.includes('background')) {
        categories['Background Jobs'].push(gem);
      } else if (desc.includes('config') || desc.includes('environment') || desc.includes('setting')) {
        categories['Configuration'].push(gem);
      } else if (desc.includes('debug') || desc.includes('development') || desc.includes('console')) {
        categories['Development Tools'].push(gem);
      } else {
        categories['Other'].push(gem);
      }
    });

    return categories;
  }

  /**
   * Identify potential issues
   */
  private identifyPotentialIssues(enhancedGems: EnhancedGemInfo[], projectContext: string): string[] {
    const issues: string[] = [];

    // Check for gems with many dependencies
    const heavyGems = enhancedGems.filter(gem => 
      gem.documentation.dependencies && gem.documentation.dependencies.length > 10
    );
    
    if (heavyGems.length > 0) {
      issues.push(`Heavy dependency gems detected: ${heavyGems.map(g => g.name).join(', ')}`);
    }

    // Check for potential security-sensitive gems
    const securityGems = enhancedGems.filter(gem => {
      const desc = (gem.documentation.description || '').toLowerCase();
      return desc.includes('auth') || desc.includes('security') || desc.includes('crypto');
    });

    if (securityGems.length > 0) {
      issues.push(`Security-sensitive gems require careful configuration: ${securityGems.map(g => g.name).join(', ')}`);
    }

    return issues;
  }

  /**
   * Suggest optimizations
   */
  private suggestOptimizations(enhancedGems: EnhancedGemInfo[], projectContext: string): string[] {
    const optimizations: string[] = [];

    // Check for unused gems
    const potentiallyUnused = enhancedGems.filter(gem => {
      const gemPattern = new RegExp(`\\b${gem.name}\\b`, 'gi');
      return !gemPattern.test(projectContext);
    });

    if (potentiallyUnused.length > 0) {
      optimizations.push(`Consider reviewing these potentially unused gems: ${potentiallyUnused.map(g => g.name).join(', ')}`);
    }

    // Suggest documentation improvements
    const poorlyDocumented = enhancedGems.filter(gem => 
      !gem.documentation.readmeContent && !gem.documentation.rdocContent
    );

    if (poorlyDocumented.length > 0) {
      optimizations.push(`These gems have limited documentation - consider adding inline comments: ${poorlyDocumented.map(g => g.name).join(', ')}`);
    }

    return optimizations;
  }

  /**
   * Cache documentation
   */
  private cacheDocumentation(gem: EnhancedGemInfo): void {
    const cacheKey = `${gem.name}:${gem.version || 'latest'}`;
    this.cache.set(cacheKey, {
      gemName: gem.name,
      documentation: gem,
      timestamp: Date.now(),
      version: gem.version
    });
  }

  /**
   * Get cached documentation
   */
  private getCachedDocumentation(gemName: string): CachedGemDoc | null {
    const cacheKey = `${gemName}:latest`; // Simplified for now
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;

    // Check if cache is still valid
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = this.config.cacheDurationHours * 60 * 60 * 1000;
    
    if (cacheAge > maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export convenience function for easy integration
export async function enhanceGemfileWithComprehensiveDocumentation(
  gemfileContent: string,
  projectContext: string,
  config?: Partial<GemDocumentationConfig>
): Promise<string> {
  const service = new GemDocumentationService(config);
  const result = await service.enhanceGemfileAnalysis(gemfileContent, projectContext);
  
  console.log(`Enhanced analysis completed:`, result.analysisMetadata);
  
  return result.enhancedContext;
}