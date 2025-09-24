# Bob

**Intelligent automation dashboard with multi-model AI chat**

[bob.newth.ai](https://bob.newth.ai)

Bob delivers complete control over your AI interactions through a self-hosted dashboard that works with any AI model—from cloud providers to local instances running on your hardware.

![Bob dashboard](./public/cover_bob.png)

## Why Bob

**Own Your AI Infrastructure**
Run everything on your own servers. Your conversations, files, and data never leave your control. Built for teams and individuals who need privacy without compromising functionality.

**Multi-Model Flexibility**
Switch seamlessly between OpenAI, Anthropic Claude, Google Gemini, Mistral, xAI Grok, Perplexity, and local models via Ollama. No vendor lock-in. Use your own API keys or run models locally.

**Professional Interface**
Clean, responsive design built with modern React components. Dark/light themes, customizable layouts, file uploads, and real-time synchronization. Designed for daily professional use.

**Enterprise-Ready Architecture**
Built on Next.js 15 with TypeScript. Supabase backend for authentication and data persistence when needed. Comprehensive testing with Vitest and Playwright. Docker-first deployment.

## Getting Started

Clone and run locally with your preferred AI models:

```bash
git clone https://github.com/n3wth/bob.git
cd bob
npm install
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```bash
# Choose one or more AI providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Security keys (required)
CSRF_SECRET=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

### Local AI with Ollama

For complete independence from cloud providers:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2

# Bob will auto-detect your local models
npm run dev
```

### Full Stack Development

For advanced features including authentication, file uploads, and persistent chat history:

```bash
cp .env.example .env.local
# Configure Supabase variables in .env.local
docker-compose -f docker-compose.dev.yml up
```

Includes PostgreSQL database, file storage, and hot reload.

## Architecture

**Frontend**: Next.js 15 with TypeScript and Tailwind CSS
**UI Components**: shadcn/ui with Radix primitives
**AI Integration**: Vercel AI SDK for unified provider interface
**Backend**: Supabase for auth, database, and storage
**Testing**: Vitest for units, Playwright for E2E
**Deployment**: Docker with standalone output optimization

The application is built with a local-first approach—core functionality works without external services. Authentication, file uploads, and chat persistence are optional features that enhance the experience when configured.

## Development

**Requirements**: Node.js 18+, npm or pnpm

**Commands**:
- `npm run dev` — Development server with Turbopack
- `npm run build` — Production build
- `npm run type-check` — TypeScript validation
- `npm run lint` — Code linting
- `npm run test` — Unit tests with Vitest
- `npm run test:e2e` — End-to-end tests with Playwright

**Testing Strategy**:
Unit tests for components and utilities, E2E tests for critical user flows, visual regression testing for UI consistency, and performance monitoring for Core Web Vitals.

## Deployment

**Docker Production**:
```bash
docker-compose up
```

**Manual Deployment**:
Build with `npm run build` and deploy the `dist/` directory to any static hosting provider or Node.js environment.

**Configuration**:
See `.env.example` for all environment variables. Minimum requirement is one AI provider API key and security keys for encryption.

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details.
