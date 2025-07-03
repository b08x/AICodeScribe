/**
 * Example integration of comprehensive gem documentation with AICodeScribe
 * This shows how to integrate the gem documentation service with your existing AI providers
 */

import { GemDocumentationService, GemDocumentationConfig } from '../services/gemDocumentationService';
import { IAiProvider } from '../services/ai/provider';

/**
 * Enhanced AI Provider wrapper that includes comprehensive gem documentation
 */
export class EnhancedAiProvider {
  private baseProvider: IAiProvider;
  private gemDocService: GemDocumentationService;

  constructor(baseProvider: IAiProvider, gemDocConfig?: Partial<GemDocumentationConfig>) {
    this.baseProvider = baseProvider;
    this.gemDocService = new GemDocumentationService(gemDocConfig);
  }

  /**
   * Enhanced documentation generation with comprehensive gem analysis
   */
  async generateDocumentationWithGemAnalysis(
    gemfileContent: string,
    projectContext: string
  ): Promise<{
    docs: string;
    initialQuestion?: string;
    gemAnalysisMetadata: any;
  }> {
    console.log('Starting enhanced documentation generation...');

    // Step 1: Enhance the context with comprehensive gem documentation
    const enhancedResult = await this.gemDocService.enhanceGemfileAnalysis(
      gemfileContent,
      projectContext
    );

    console.log('Gem analysis completed:', enhancedResult.analysisMetadata);

    // Step 2: Use the enhanced context for AI documentation generation
    const result = await this.baseProvider.generateDocumentation(
      enhancedResult.enhancedContext,
      projectContext
    );

    return {
      ...result,
      gemAnalysisMetadata: enhancedResult.analysisMetadata
    };
  }

  /**
   * Enhanced chat session with gem documentation context
   */
  async createEnhancedChatSession(
    gemfileContent: string,
    projectContext: string,
    generatedDocs: string
  ) {
    // Enhance the context with gem documentation
    const enhancedResult = await this.gemDocService.enhanceGemfileAnalysis(
      gemfileContent,
      projectContext
    );

    // Create chat session with enhanced context
    return this.baseProvider.createChatSession(
      enhancedResult.enhancedContext,
      projectContext,
      generatedDocs
    );
  }

  // Delegate other methods to base provider
  async generateBacklog(chatHistory: any[]) {
    return this.baseProvider.generateBacklog(chatHistory);
  }
}

/**
 * Example usage with different configurations
 */
export class GemDocumentationExamples {
  
  /**
   * Basic configuration for quick analysis
   */
  static getBasicConfig(): Partial<GemDocumentationConfig> {
    return {
      enableSourceCodeFetching: false,
      enableRDocFetching: true,
      enableExampleExtraction: true,
      maxGemsToAnalyze: 10,
      maxSourceFilesPerGem: 2,
      analysisDepth: 'basic',
      cacheDocumentation: true,
      cacheDurationHours: 12
    };
  }

  /**
   * Comprehensive configuration for detailed analysis
   */
  static getComprehensiveConfig(): Partial<GemDocumentationConfig> {
    return {
      enableSourceCodeFetching: true,
      enableRDocFetching: true,
      enableExampleExtraction: true,
      maxGemsToAnalyze: 25,
      maxSourceFilesPerGem: 10,
      analysisDepth: 'comprehensive',
      cacheDocumentation: true,
      cacheDurationHours: 24
    };
  }

  /**
   * Fast configuration for development/testing
   */
  static getFastConfig(): Partial<GemDocumentationConfig> {
    return {
      enableSourceCodeFetching: false,
      enableRDocFetching: false,
      enableExampleExtraction: true,
      maxGemsToAnalyze: 5,
      maxSourceFilesPerGem: 1,
      analysisDepth: 'basic',
      cacheDocumentation: true,
      cacheDurationHours: 1
    };
  }

  /**
   * Example: Analyze a Rails application Gemfile
   */
  static async analyzeRailsGemfile(): Promise<void> {
    const sampleGemfile = `
source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.1.0'

gem 'rails', '~> 7.0.0'
gem 'pg', '~> 1.1'
gem 'puma', '~> 5.0'
gem 'sass-rails', '>= 6'
gem 'webpacker', '~> 5.0'
gem 'turbo-rails'
gem 'stimulus-rails'
gem 'jbuilder', '~> 2.7'
gem 'bootsnap', '>= 1.4.4', require: false
gem 'devise'
gem 'pundit'
gem 'sidekiq'
gem 'redis', '~> 4.0'

group :development, :test do
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  gem 'rspec-rails'
  gem 'factory_bot_rails'
end

group :development do
  gem 'web-console', '>= 4.1.0'
  gem 'listen', '~> 3.3'
  gem 'spring'
end
    `;

    const sampleProjectContext = `
# Sample Rails application structure
class ApplicationController < ActionController::Base
  include Pundit
  protect_from_forgery with: :exception
  before_action :authenticate_user!
end

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end

class PostsController < ApplicationController
  before_action :authenticate_user!
  
  def index
    @posts = policy_scope(Post)
  end
  
  def create
    @post = current_user.posts.build(post_params)
    authorize @post
    
    if @post.save
      ProcessPostJob.perform_later(@post)
      redirect_to @post
    else
      render :new
    end
  end
end

class ProcessPostJob < ApplicationJob
  queue_as :default
  
  def perform(post)
    # Process the post
  end
end
    `;

    const service = new GemDocumentationService(
      GemDocumentationExamples.getComprehensiveConfig()
    );

    try {
      const result = await service.enhanceGemfileAnalysis(
        sampleGemfile,
        sampleProjectContext
      );

      console.log('Analysis Results:');
      console.log('================');
      console.log(`Total gems: ${result.analysisMetadata.totalGems}`);
      console.log(`Analyzed gems: ${result.analysisMetadata.analyzedGems}`);
      console.log(`Cache hits: ${result.analysisMetadata.cacheHits}`);
      console.log(`Fetch time: ${result.analysisMetadata.fetchTime}ms`);
      console.log('');
      console.log('Enhanced Context Preview:');
      console.log(result.enhancedContext.substring(0, 1000) + '...');

    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }

  /**
   * Example: Performance comparison
   */
  static async comparePerformance(): Promise<void> {
    const sampleGemfile = `
gem 'rails'
gem 'devise'
gem 'pundit'
gem 'sidekiq'
gem 'redis'
    `;

    const projectContext = 'class User < ApplicationRecord; end';

    console.log('Performance Comparison:');
    console.log('======================');

    // Test basic config
    const basicService = new GemDocumentationService(
      GemDocumentationExamples.getBasicConfig()
    );
    
    const basicStart = Date.now();
    const basicResult = await basicService.enhanceGemfileAnalysis(sampleGemfile, projectContext);
    const basicTime = Date.now() - basicStart;

    console.log(`Basic config: ${basicTime}ms`);
    console.log(`  - Analyzed: ${basicResult.analysisMetadata.analyzedGems} gems`);

    // Test comprehensive config
    const comprehensiveService = new GemDocumentationService(
      GemDocumentationExamples.getComprehensiveConfig()
    );
    
    const compStart = Date.now();
    const compResult = await comprehensiveService.enhanceGemfileAnalysis(sampleGemfile, projectContext);
    const compTime = Date.now() - compStart;

    console.log(`Comprehensive config: ${compTime}ms`);
    console.log(`  - Analyzed: ${compResult.analysisMetadata.analyzedGems} gems`);

    console.log(`Performance difference: ${((compTime - basicTime) / basicTime * 100).toFixed(1)}%`);
  }
}

// Example usage in your existing codebase:
/*
// In your AI provider factory or service initialization:
import { getAiProvider } from './services/ai';
import { EnhancedAiProvider, GemDocumentationExamples } from './examples/gemDocumentationIntegration';

// Create enhanced provider
const baseProvider = getAiProvider(config);
const enhancedProvider = new EnhancedAiProvider(
  baseProvider,
  GemDocumentationExamples.getComprehensiveConfig()
);

// Use in your existing workflow:
const result = await enhancedProvider.generateDocumentationWithGemAnalysis(
  gemfileContent,
  projectContext
);

// The result will include comprehensive gem documentation and analysis
*/

export default GemDocumentationExamples;