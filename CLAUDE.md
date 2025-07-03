# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Code-Scribe is a React-based web application that analyzes codebases and generates AI-powered documentation and interactive knowledge bases. The application allows users to upload dependency files (like Gemfile, package.json) and project code (in JSON format) to create contextual documentation using AI providers.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

- Requires Node.js
- Set `GEMINI_API_KEY` in `.env.local` for Gemini API access
- Vite configuration exposes environment variables as `process.env.GEMINI_API_KEY` and `process.env.API_KEY`

## Architecture

### Core Application Flow

1. **Landing Page** (`LandingPage.tsx`) - Initial user entry point
2. **Setup Page** (`SetupPage.tsx`) - AI provider configuration
3. **Main App** (`App.tsx`) - File upload, documentation generation, and chat interface

### Key State Management

The main application (`App.tsx`) manages several critical state pieces:

- View state: `'landing' | 'setup' | 'app'`
- AI configuration: `IAiProviderConfig`
- File content: separate states for dependency files and project JSON
- Chat session: `IChatSession` with conversation history
- Generated documentation and backlog data

### AI Provider Architecture

- **Provider Interface** (`services/ai/provider.ts`): Defines contracts for AI providers
- **Provider Factory** (`services/ai/index.ts`): Creates provider instances and validates API keys
- **Supported Providers**: Gemini and OpenRouter
- **Key Methods**: `generateDocumentation()`, `createChatSession()`, `generateBacklog()`

### Component Structure

- **Upload Components**: Handle dependency files and JSON project uploads
- **Chat Interface**: Interactive AI conversation after documentation generation  
- **Documentation Display**: Renders generated markdown documentation
- **Modal Components**: Backlog display and other overlays
- **Icon Components**: Reusable SVG icons in `components/icons/`

### File Processing

- Dependency files: Plain text processing (Gemfile, package.json, etc.)
- Project files: JSON format with required `files` array structure
- Each file object should contain `content` property with code content

### TypeScript Configuration

- Uses strict mode with comprehensive linting rules
- Path aliases: `@/*` maps to project root
- Vite bundler with React JSX support
- ES2020 target with modern module resolution

## Key Features

- Multi-provider AI support (Gemini, OpenRouter)
- Real-time chat interface with conversation history
- Backlog generation from chat conversations
- Responsive design with Tailwind CSS
- File upload validation and error handling
