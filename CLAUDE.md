# CLAUDE.md - Bob Dashboard Configuration

## Project Overview
Bob is an intelligent automation dashboard and open-source chat interface supporting multiple AI models.
Tech Stack: Next.js 15, TypeScript, React Query, Tailwind CSS, shadcn/ui, Supabase

## Quick Start Commands
```bash
# Docker Development (Recommended - Full Stack)
docker compose -f docker-compose.dev.yml up    # Start dev environment
docker compose -f docker-compose.dev.yml down  # Stop all services

# Quick Frontend Development
npm ci                    # Faster than npm install
npm run dev              # Turbopack enabled on localhost:3000

# Validation (ALWAYS run before marking complete)
npm run type-check
npm run lint
npm run test:run
npm run test:e2e:chromium  # E2E tests in CI mode
```

## Architecture Rules
- **Routes**: `/c/[chatId]` (chats), `/p/[projectId]` (projects), `/share/[chatId]` (shared)
- **State**: Zustand stores in `lib/*-store/`, React Query for server state
- **Auth**: Supabase with Google OAuth, anonymous sessions supported
- **Files**: Supabase Storage with MIME validation
- **AI**: Multi-provider via Vercel AI SDK, configs in `lib/models/`

## Development Patterns
- **ALWAYS** run type-check and lint before completing tasks
- Use Docker dev for full-stack features (includes Supabase)
- Prefer Read/Grep/Glob tools over bash cat/grep/find
- Batch file operations when possible
- Use absolute paths in all file operations
- Never create README/docs unless explicitly requested

## Available CLI Tools
- **fd**: Modern file finder (`fd pattern` or `fd -t f -d 2` for depth limit)
- **rg**: Fast text search (`rg pattern --type typescript`)
- **bat**: Better file viewer with syntax highlighting
- **eza**: Enhanced ls with git status (`eza -la --git`)
- Use these modern tools for better performance than find/grep/cat/ls

## Testing Strategy
- **Unit**: Vitest + React Testing Library (`*.test.ts` in `src/`)
- **E2E**: Playwright (`tests/e2e/`)
- **Visual**: Screenshot comparison (`tests/visual/`)
- **Performance**: `npm run test:performance`

## Environment Setup
Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role
CSRF_SECRET=$(openssl rand -hex 16)  # 32 chars
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

## Docker Workflow
- Dev includes hot reload and local Supabase
- App: `localhost:3000`, PostgreSQL: `localhost:54322`
- Volumes preserve node_modules between runs
- Production test: `docker compose up` (without -f flag)

## Parallel Development with Worktrees
- **Setup**: `bash scripts/worktree-quickstart.sh`
- **Create**: `bw create feature/name` (auto-assigns ports)
- **List**: `bw list` (shows all active worktrees)
- **Claude**: `bw claude feature/name` (starts in worktree)
- **Ports**: main=3000, features=3001, hotfix=3002, experiments=3003
- **Benefits**: 3-4x parallel development, zero context switching
- **Docs**: See `docs/WORKTREE_WORKFLOW.md` for complete guide

## Performance Optimization
- Turbopack enabled in dev mode
- Bundle analysis: `ANALYZE=true npm run build`
- Parallel test execution with Vitest
- Standalone Docker output for production

## Common Fixes
```bash
# Module issues
rm -rf node_modules package-lock.json && npm ci

# Port conflicts
lsof -ti:3000 | xargs kill -9

# Docker cleanup
docker compose -f docker-compose.dev.yml down -v
```