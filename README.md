# AI Code-Scribe

**Transform your codebase into an AI-powered knowledge base with intelligent documentation and interactive chat.**

AI Code-Scribe is a React-based web application that analyzes your codebase and generates comprehensive documentation using AI providers like Google Gemini and OpenRouter. Upload your dependency files and project code to create contextual documentation, then chat with an AI assistant that understands your codebase.

## ✨ Key Features

### 🔍 **Intelligent Code Analysis**

- Upload dependency files (Gemfile, package.json, etc.) and project JSON
- AI-powered analysis of your entire codebase structure
- Contextual understanding of frameworks, libraries, and dependencies

### 📚 **Auto-Generated Documentation**  

- Comprehensive markdown documentation generated from your code
- Structured sections covering architecture, components, and functionality
- Interactive sidebar navigation for easy browsing

### 💬 **Interactive AI Chat**

- Real-time conversation with AI that understands your codebase
- Regenerate responses, voice input support, and message editing
- Generate development backlogs from chat conversations

### 🎛️ **Multi-Provider AI Support**

- **Google Gemini**: Advanced code understanding with Gemini Pro models
- **OpenRouter**: Access to multiple AI models (Mixtral, Mistral, etc.)
- Configurable temperature settings for creativity control

### 🎨 **Modern UI/UX**

- Responsive design built with React 19 and Tailwind CSS
- Dark theme with gradient accents and smooth animations
- File upload with drag-and-drop support

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- AI provider API key (Gemini or OpenRouter)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd AICodeScribe
   npm install
   ```

2. **Configure API keys:**
   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   API_KEY=your_openrouter_api_key_here
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📖 How It Works

### 1. **Setup & Configuration**

- Choose your preferred AI provider (Gemini or OpenRouter)
- Enter and validate your API key
- Select model and adjust temperature settings

### 2. **Upload Your Codebase**

- **Dependencies**: Upload files like `Gemfile`, `package.json`, `requirements.txt`
- **Project Code**: Upload a JSON file containing your entire codebase structure

### 3. **Generate Documentation**

- AI analyzes your dependencies and code structure
- Generates comprehensive markdown documentation
- Creates structured sections for easy navigation

### 4. **Interactive Chat**

- Chat with AI assistant that understands your codebase
- Ask questions about architecture, components, or functionality
- Generate development backlogs and task lists

## 📁 Project Structure

```
AICodeScribe/
├── components/           # React components
│   ├── icons/           # SVG icon components
│   ├── ChatInterface.tsx    # AI chat functionality
│   ├── DocumentationSidebar.tsx  # Doc navigation
│   ├── SetupPage.tsx    # AI provider configuration
│   └── ...
├── services/            # Core services
│   └── ai/             # AI provider implementations
│       ├── geminiProvider.ts
│       ├── openRouterProvider.ts
│       └── provider.ts  # Provider interface
├── App.tsx             # Main application component
├── config.ts           # Provider configurations
└── index.tsx          # Application entry point
```

## 🔧 Configuration

### AI Providers

#### Google Gemini

- **Models**: `gemini-2.5-flash-preview-04-17`, `gemini-pro`
- **API Key**: Get from [Google AI Studio](https://makersuite.google.com/)
- **Default Temperature**: 0.7

#### OpenRouter  

- **Models**: Multiple models including Mixtral, Mistral, and more
- **API Key**: Get from [OpenRouter](https://openrouter.ai/)
- **Default Temperature**: 0.8

### Environment Variables

```env
# Required for Gemini provider
GEMINI_API_KEY=your_gemini_api_key

# Required for OpenRouter provider  
API_KEY=your_openrouter_api_key
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API, OpenRouter API
- **State Management**: React Hooks (useState, useEffect, useMemo)

## 📋 File Format Requirements

### Dependency Files

- Plain text files (Gemfile, package.json, requirements.txt, etc.)
- Any dependency management file format

### Project JSON Format

```json
{
  "files": [
    {
      "path": "src/component.js",
      "content": "// Your code content here"
    },
    {
      "path": "src/utils.js", 
      "content": "// More code content"
    }
  ]
}
```

## 🎯 Use Cases

- **Documentation Generation**: Automatically create comprehensive docs for existing codebases
- **Code Onboarding**: Help new team members understand project structure
- **Architecture Analysis**: Get AI insights into your codebase architecture
- **Development Planning**: Generate backlogs and task lists from conversations
- **Knowledge Base**: Create searchable, interactive code documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check that your API keys are correctly configured
2. Ensure your project JSON follows the required format
3. Verify you're using Node.js v18 or higher
4. Check the browser console for detailed error messages

---

**Built with ❤️ using React, TypeScript, and AI**
EOF < /dev/null
