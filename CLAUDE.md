# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bob is an intelligent automation dashboard and open-source chat interface supporting multiple AI models. Built with Next.js 15, TypeScript, React Query, Tailwind CSS, and shadcn/ui components.

## Development Commands

### Core Development
```bash
npm run dev            # Start dev server with Turbopack on localhost:3000
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

### Testing
```bash
npm run test           # Run Vitest in watch mode
npm run test:run       # Single test run
npm run test:coverage  # Coverage report
npm run test:ui        # Interactive test UI

# E2E Testing with Playwright
npm run test:e2e                  # Run all E2E tests
npm run test:e2e:ui              # Interactive Playwright UI
npm run test:e2e:chromium        # Chromium only (CI mode)
npm run test:visual              # Visual regression tests
npm run test:performance         # Performance tests
```

### Analysis
```bash
ANALYZE=true npm run build       # Bundle analysis with @next/bundle-analyzer
```

## Architecture

### Route Structure
- `/` - Main chat interface
- `/c/[chatId]` - Individual chat sessions
- `/p/[projectId]` - Project workspaces
- `/share/[chatId]` - Shared chat views
- `/auth` - Authentication flow (Google OAuth via Supabase)

### Core Systems

**State Management**
- Zustand stores in `lib/*-store/` directories
- React Query for server state (`lib/tanstack-query/`)
- Session persistence via IndexedDB (`idb-keyval`)

**AI Integration**
- Multi-provider support via Vercel AI SDK in `lib/models/`
- Model configs in `lib/models/constants.ts`
- Streaming responses with `ai` package hooks
- Local models via Ollama integration

**Authentication & Users**
- Supabase Auth with Google OAuth
- Anonymous session support with rate limiting
- User profiles stored in Supabase
- Dev mode authentication bypass (`NEXT_PUBLIC_DEV_AUTH=true`)

**File Handling**
- File uploads via Supabase Storage
- Image/document processing in `lib/file-handling.ts`
- MIME type validation with `file-type` package

## Environment Configuration

Required variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE` - Service role for server operations
- `CSRF_SECRET` - 32-character CSRF token (generate: `openssl rand -hex 16`)
- `ENCRYPTION_KEY` - Base64 encryption key (generate: `openssl rand -base64 32`)

AI Provider Keys (optional, BYOK supported):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`
- `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`

## Testing Approach

**Unit Tests** - Vitest with React Testing Library
- Test files: `*.test.ts` or `*.spec.ts` in `src/` directory
- Setup in `tests/setup.ts`
- Run specific test: `npm run test -- path/to/test`

**E2E Tests** - Playwright
- Test files in `tests/e2e/` and `tests/visual/`
- Page objects pattern for maintainability
- Visual regression with screenshot comparison

## Key Dependencies

**UI Framework**
- `shadcn/ui` components in `components/ui/`
- `motion` for animations
- `lucide-react` and `@phosphor-icons/react` for icons

**AI & Chat**
- `ai` SDK for streaming responses
- Multiple provider SDKs (`@ai-sdk/*`)
- `react-markdown` with GitHub flavored markdown

**Data & State**
- `@tanstack/react-query` for server state
- `zustand` for client state
- `@supabase/ssr` for auth/database

## Development Patterns

**API Routes**
- Server actions in `app/api/` directory
- CSRF protection via `lib/csrf.ts`
- Rate limiting checks in `lib/api.ts`

**Component Structure**
- Shared components in `components/`
- Feature-specific components co-located with routes
- Provider components wrap functionality in `lib/providers/`

**Error Handling**
- Custom error classes (e.g., `UsageLimitError`)
- Error boundaries in React components
- Consistent error responses from API routes

## Performance Considerations

- Turbopack enabled for faster dev builds (`--turbopack` flag)
- Standalone output mode for optimized Docker deployments
- Bundle analysis available for optimization
- Parallel test execution with Vitest forks

## Deployment

- Vercel deployment ready with `vercel.json` configuration
- Docker support with standalone output
- Environment-specific builds with `.env.production`
- Official deployment flag: `BOB_OFFICIAL=true`