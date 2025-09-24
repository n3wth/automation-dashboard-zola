# Bob by Newth.ai

[bob.newth.ai](https://bob.newth.ai)

**Bob** is an intelligent automation dashboard and open-source chat interface supporting multiple AI models with advanced features like file uploads, authentication, and local model support.

![Bob dashboard](./public/cover_bob.png)

## ✨ Features

### 🤖 Multi-Model AI Support
- **Cloud Models**: OpenAI, Anthropic Claude, Google Gemini, Mistral, xAI Grok, Perplexity
- **Local Models**: Ollama with automatic model detection
- **BYOK Support**: Bring your own API keys via OpenRouter
- **Model Switching**: Seamless switching between providers in conversations

### 🎨 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Theme Support**: Light/dark themes with system preference detection
- **Customizable Layouts**: Multiple chat layout options
- **shadcn/ui Components**: Beautiful, accessible UI components

### 📁 Advanced Features
- **File Uploads**: Support for documents, images, and various file types
- **Authentication**: Supabase-powered auth with Google OAuth
- **Data Persistence**: Chat history and user preferences
- **Real-time Updates**: Live chat synchronization
- **MCP Integration**: Model Context Protocol support (in development)

### 🔒 Self-Hostable & Secure
- **Open Source**: Apache 2.0 license
- **Self-Hosting**: Complete Docker setup included
- **Environment Isolation**: Secure environment variable handling
- **Privacy First**: Your data stays in your infrastructure

## 🚀 Quick Start

### Option 1: Cloud Models (Fastest)

```bash
git clone https://github.com/n3wth/bob.git
cd bob
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

### Option 2: Local AI with Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2  # or your preferred model

# Setup Bob
git clone https://github.com/n3wth/bob.git
cd bob
npm install
npm run dev
```

Bob will automatically detect your local Ollama models!

### Option 3: Full Stack with Docker

```bash
git clone https://github.com/n3wth/bob.git
cd bob
cp .env.example .env.local
# Configure environment variables
docker-compose -f docker-compose.dev.yml up
```

This includes:
- Next.js app with hot reload
- Local Supabase instance
- PostgreSQL database
- File storage

### Option 4: Production Docker

```bash
git clone https://github.com/n3wth/bob.git
cd bob
docker-compose up
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or pnpm
- Docker (optional, for full-stack development)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env.local`
4. Configure your API keys (see Configuration section)
5. Start development server: `npm run dev`

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run Playwright E2E tests

### Testing
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright across multiple browsers
- **Visual Testing**: Screenshot comparison tests
- **Performance Tests**: Core Web Vitals monitoring

## ⚙️ Configuration

### Required Environment Variables
```bash
# Security (generate with provided commands)
CSRF_SECRET=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# At least one AI provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### Full Stack Features (Optional)
```bash
# Supabase (for auth, file uploads, chat history)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

See `.env.example` for complete configuration options.

## 📋 Deployment

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/n3wth/bob)

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Vercel, Railway, DigitalOcean, etc.)

### Docker Production
```bash
docker-compose up
```

### Supabase Setup
If using authentication and file uploads:
1. Create a Supabase project
2. Run the provided SQL migrations
3. Configure OAuth providers
4. Update environment variables

See the deployment guides in the `scripts/` directory for detailed instructions.

## 🛠️ Built With

### Core Framework
- **[Next.js 15](https://nextjs.org/)** — React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework

### UI Components
- **[shadcn/ui](https://ui.shadcn.com)** — Beautiful, accessible React components
- **[Radix UI](https://radix-ui.com/)** — Low-level UI primitives
- **[Lucide Icons](https://lucide.dev/)** — Beautiful & consistent icon pack
- **[Framer Motion](https://framer.com/motion/)** — Motion library for React

### AI Integration
- **[Vercel AI SDK](https://sdk.vercel.ai/)** — Unified AI provider interface
- **[prompt-kit](https://prompt-kit.com/)** — AI components and utilities

### Backend & Database
- **[Supabase](https://supabase.com/)** — Backend-as-a-Service (auth, database, storage)
- **[PostgreSQL](https://postgresql.org/)** — Robust relational database
- **[TanStack Query](https://tanstack.com/query)** — Data fetching and state management

### Development & Testing
- **[Vitest](https://vitest.dev/)** — Fast unit testing framework
- **[Playwright](https://playwright.dev/)** — End-to-end testing
- **[ESLint](https://eslint.org/)** — JavaScript linting
- **[Docker](https://docker.com/)** — Containerization

## 📖 Documentation

- **[API Reference](./docs/api/)** — Complete API documentation
- **[Deployment Guide](./scripts/)** — Production deployment instructions
- **[Contributing Guide](./CONTRIBUTING.md)** — How to contribute
- **[Worktree Development](./docs/WORKTREE_WORKFLOW.md)** — Parallel development workflow

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test && npm run test:e2e`
5. Submit a pull request

### Code Style
- TypeScript with strict mode
- ESLint + Prettier for formatting
- Conventional commits for commit messages

## 📝 License

Licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for details.

## 💎 Sponsors

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

## 🔗 Links

- **Website**: [bob.newth.ai](https://bob.newth.ai)
- **Documentation**: [docs.bob.newth.ai](https://docs.bob.newth.ai)
- **Discord**: [Join our community](https://discord.gg/newth-ai)
- **Twitter**: [@newthai](https://twitter.com/newthai)

---

**Note**: This is an active open-source project. The codebase is continuously evolving with new features and improvements.
