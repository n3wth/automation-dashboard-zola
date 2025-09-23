# Bob - Project Documentation Index

> **Bob by Newth.ai** - Intelligent automation dashboard and open-source chat interface
> Version: 0.1.0 | License: Apache 2.0 | [Live Demo](https://bob.newth.ai)

## 📚 Documentation Overview

This index provides comprehensive documentation for the Bob project, covering architecture, API reference, component structure, and development guidelines.

## 🏗 Project Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript 5.x with strict mode
- **Styling**: Tailwind CSS v4 with custom animations
- **State**: Zustand stores + React Query (TanStack)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI SDKs**: Vercel AI SDK with multi-provider support

### Directory Structure
```
bob/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes and server actions
│   ├── auth/              # Authentication flow pages
│   ├── c/[chatId]/        # Individual chat sessions
│   ├── p/[projectId]/     # Project workspaces
│   └── share/[chatId]/    # Shared chat views
├── components/            # React components
│   ├── common/           # Shared business components
│   ├── icons/            # Provider icon components
│   ├── motion-primitives/ # Animation components
│   ├── prompt-kit/       # AI chat UI components
│   └── ui/               # shadcn/ui base components
├── lib/                   # Core application logic
│   ├── api/              # API client utilities
│   ├── auth/             # Authentication logic
│   ├── chat-store/       # Chat state management
│   ├── hooks/            # Custom React hooks
│   ├── models/           # AI model configurations
│   ├── providers/        # Context providers
│   └── supabase/         # Database client
├── public/               # Static assets
├── tests/                # Test suites
│   ├── e2e/             # End-to-end tests
│   └── visual/          # Visual regression tests
└── docs/                # Documentation files
```

## 🔌 API Reference

### Core API Endpoints

#### Chat Management
- `POST /api/create-chat` - Create new chat session
- `POST /api/chat` - Stream chat messages with AI
- `GET /api/chats` - List user's chat sessions
- `POST /api/update-chat-model` - Change chat model
- `POST /api/toggle-chat-pin` - Pin/unpin chat

#### User Management
- `POST /api/create-guest` - Create anonymous user
- `GET /api/user-preferences` - Get user settings
- `POST /api/user-preferences` - Update settings
- `POST /api/user-keys` - Manage API keys (BYOK)
- `GET /api/user-key-status` - Check key validity

#### Projects & Messages
- `GET /api/projects` - List user projects
- `GET /api/projects/[projectId]` - Get project details
- `GET /api/messages` - Retrieve chat messages

#### System & Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/csrf` - Get CSRF token
- `GET /api/rate-limits` - Check usage limits
- `GET /api/monitoring/usage` - Usage statistics
- `GET /api/monitoring/models` - Model usage stats

### Authentication Flow
1. **Anonymous Access**: Auto-creates guest session
2. **Google OAuth**: Sign in via Supabase Auth
3. **Session Management**: JWT tokens with refresh
4. **Rate Limiting**: Daily limits for guest/authenticated

## 🎨 Component Architecture

### Component Categories

#### UI Foundation (shadcn/ui)
Base components following Radix UI patterns:
- **Dialog System**: `dialog`, `alert-dialog`, `drawer`, `sheet`
- **Form Controls**: `input`, `textarea`, `select`, `checkbox`, `switch`
- **Navigation**: `tabs`, `dropdown-menu`, `command`, `sidebar`
- **Feedback**: `toast`, `sonner`, `progress`, `skeleton`

#### Prompt Kit Components
AI chat interface components:
- `<Message />` - Chat message display with markdown
- `<PromptInput />` - Multi-line input with file upload
- `<FileUpload />` - Drag & drop file handling
- `<CodeBlock />` - Syntax highlighted code display
- `<ChatContainer />` - Scrollable chat viewport

#### Motion Primitives
Animation-enhanced components:
- `<MorphingDialog />` - Smooth dialog transitions
- `<MorphingPopover />` - Animated popover
- `<TextMorph />` - Text animation effects
- `<ProgressiveBlur />` - Depth blur effects

#### Provider Icons
Model provider branding:
- OpenAI, Anthropic, Google, Mistral, Meta
- Ollama, OpenRouter, Perplexity, XAI
- Custom Bob mascot component

## 📊 State Management

### Store Architecture

#### Zustand Stores
```typescript
// Chat Session Store
useChatSession(): {
  chatId: string
  model: string
  messages: Message[]
  updateModel: (model) => void
  addMessage: (message) => void
}

// User Preferences Store
useUserPreferences(): {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  favoriteModels: string[]
  systemPrompt: string
  updatePreference: (key, value) => void
}

// Model Store
useModelStore(): {
  models: ModelConfig[]
  selectedModel: string
  userKeys: Record<string, string>
  setUserKey: (provider, key) => void
}
```

#### React Query Integration
- Cache management for API responses
- Optimistic updates for UI responsiveness
- Background refetching for data freshness
- Mutation handlers for server state

## 🤖 AI Model Integration

### Supported Providers
- **OpenAI**: GPT-4, GPT-3.5 models
- **Anthropic**: Claude 3 family
- **Google**: Gemini Pro, Flash
- **Mistral**: Small, Large models
- **Meta**: Llama models (via providers)
- **Ollama**: Local model support
- **OpenRouter**: BYOK aggregator

### Model Configuration
```typescript
interface ModelConfig {
  id: string           // Model identifier
  name: string         // Display name
  provider: string     // Provider name
  contextWindow: number // Max tokens
  vision?: boolean     // Image support
  tools?: boolean      // Function calling
  apiSdk: () => LanguageModelV1 // SDK instance
}
```

## 🚀 Developer Guide

### Quick Start
```bash
# Clone repository
git clone https://github.com/n3wth/bob.git
cd bob

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your keys

# Development server
npm run dev

# Run tests
npm run test:all
```

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=
CSRF_SECRET=           # openssl rand -hex 16
ENCRYPTION_KEY=        # openssl rand -base64 32

# Optional (BYOK)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
# ... other providers
```

### Development Workflow
1. **Feature Development**: Create feature branch
2. **Testing**: Write tests alongside code
3. **Type Safety**: Ensure no TypeScript errors
4. **Linting**: Run `npm run lint`
5. **Build**: Verify with `npm run build`
6. **E2E Tests**: Run `npm run test:e2e`

## 🧪 Testing Strategy

### Test Suites
- **Unit Tests**: Vitest for components/utilities
- **Integration**: API route testing
- **E2E Tests**: Playwright for user flows
- **Visual Tests**: Screenshot regression
- **Performance**: Lighthouse metrics

### Running Tests
```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
npm run test:e2e      # Playwright tests
npm run test:visual   # Visual regression
```

## 🔐 Security Features

### Implementation
- **CSRF Protection**: Token validation on state-changing operations
- **API Key Encryption**: AES-256 encryption for stored keys
- **Rate Limiting**: Daily usage limits per user tier
- **Content Security**: DOMPurify for XSS prevention
- **Auth Security**: Supabase RLS policies

### Best Practices
- Never commit `.env.local` files
- Use environment variables for secrets
- Validate all user inputs
- Sanitize markdown content
- Implement proper error boundaries

## 📈 Performance Optimization

### Strategies
- **Code Splitting**: Dynamic imports for routes
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: `ANALYZE=true npm run build`
- **Turbopack**: Fast development builds
- **React Query**: Intelligent caching
- **Parallel Testing**: Vitest fork pool

### Monitoring
- PostHog analytics (optional)
- Sentry error tracking (optional)
- Custom usage monitoring endpoints
- Health check endpoints

## 🚢 Deployment

### Platforms
- **Vercel**: One-click deployment
- **Docker**: Standalone container
- **Self-hosted**: Node.js server

### Production Build
```bash
npm run build
npm run start

# Docker
docker build -t bob .
docker run -p 3000:3000 bob
```

## 📖 Additional Resources

### Internal Documentation
- [API Documentation](./API.md)
- [Component Guide](./COMPONENTS.md)
- [State Management](./STATE.md)
- [Testing Guide](./TESTING.md)

### External Links
- [GitHub Repository](https://github.com/n3wth/bob)
- [Live Demo](https://bob.newth.ai)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- PR process
- Issue reporting

## 📝 License

Apache License 2.0 - See [LICENSE](../LICENSE) for details.

---

*This documentation index was generated for Bob v0.1.0*