# Worktree Context: other-logings

## Configuration
- **Branch Type**: feature
- **App Port**: 3001
- **Database Port**: 54323
- **Docker Volume**: bob-other-logings-data

## Active Worktrees
Run `bob-worktree list` to see all active worktrees and their ports.

## Important
This is a worktree of the main Bob repository. Changes here are isolated from other worktrees.
Use the assigned ports to avoid conflicts with other running instances.

---

# Worktree Context: improve-docs

## Configuration
- **Branch Type**: feature
- **App Port**: 3001
- **Database Port**: 54323
- **Docker Volume**: bob-improve-docs-data

## Active Worktrees
Run `bob-worktree list` to see all active worktrees and their ports.

## Important
This is a worktree of the main Bob repository. Changes here are isolated from other worktrees.
Use the assigned ports to avoid conflicts with other running instances.

---

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

## Available Modern CLI Tools

### Core System Tools (10x faster than Unix equivalents)
- **fd**: Modern file finder (`fd pattern` or `fd -t f -d 2` for depth limit) - faster than find
- **rg (ripgrep)**: Ultra-fast text search (`rg pattern --type typescript`) - faster than grep
- **bat**: Better file viewer with syntax highlighting (`bat file.tsx`) - better than cat
- **eza**: Enhanced ls with git status (`eza -la --git`) - better than ls
- **fzf**: Fuzzy finder (`fd | fzf` or `rg pattern | fzf`) - interactive selection
- **zoxide**: Smart cd (`z project-name`) - jumps to frequently used directories
- **jq**: JSON processor (`curl api | jq '.data'`) - parse JSON responses
- **bash 5.3**: Modern Bash available at `/opt/homebrew/bin/bash` (vs system Bash 3.2 from 2007)

### AI CLI Tools (complement Claude)
- **aichat** (alias: `ai`): Multi-model AI chat (`ai "explain this code"`)
- **sgpt** (alias: `ask`): Shell GPT (`asksh "find large files"`, `askcode "write function"`)
- **mods**: Pipe content to AI (`git log | mods "summarize commits"`)
- **fabric**: AI pattern processing (`curl url | fabric --pattern summarize`)

### Useful Aliases Available
- `search='rg -i'`, `preview='fzf --preview "bat {}"'`, `tree='eza --tree'`
- `ask=sgpt`, `askcode='sgpt --code'`, `asksh='sgpt --shell'`

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

## Multi-Agent Development Patterns

### Hybrid Claude + Codex Workflows
Leverage both Claude's strategic reasoning and Codex's fast execution capabilities:

**Agent Specialization**:
- **Claude**: Architecture planning, code review, complex reasoning, strategic decisions
- **Codex**: Fast file edits, CLI operations, deterministic tasks, test execution

**Coordination Patterns**:
```bash
# Sequential Pipeline: Plan → Implement → Review → Fix
claude "analyze issue #123, create implementation plan"
codex "implement auth middleware from plan.md"
claude "review implementation, suggest improvements"
codex "apply fixes and run final tests"

# Parallel Execution: Architecture + Implementation
# Terminal 1: Claude handles high-level design
# Terminal 2: Codex executes specific file changes
```

### Multi-Agent Worktree Strategy
Combine isolated worktrees with specialized agents for maximum productivity:

```bash
# Create isolated development environments
bw create feature/auth-system main    # Claude: strategic planning
bw create hotfix/security-patch main  # Codex: fast implementation
bw create experiment/ui-redesign main # Mixed: exploration + execution

# Agent-specific workflows
bw claude feature/auth-system "design auth architecture"
bw codex hotfix/security-patch "implement security fixes"
```

### Implementation Patterns

**Meta-Agent Orchestration**:
```bash
#!/bin/bash
# hybrid-workflow.sh - Orchestrate Claude + Codex collaboration

ISSUE=$1
MAIN_BRANCH=${2:-main}

# 1. Claude: Strategic analysis and planning
claude "analyze GitHub issue $ISSUE, create detailed implementation plan"

# 2. Create isolated worktree for implementation
BRANCH="feature/issue-$ISSUE"
bw create $BRANCH $MAIN_BRANCH

# 3. Codex: Tactical implementation
bw codex $BRANCH "implement plan from issue $ISSUE, focus on file edits"

# 4. Claude: Code review and architectural validation
bw claude $BRANCH "review implementation, check architecture compliance"

# 5. Codex: Apply feedback and finalize
bw codex $BRANCH "apply review feedback, run tests, fix any failures"
```

**Agent Monitoring Dashboard**:
```bash
# Check active agents across worktrees
agent-status() {
  echo "=== Active Development Sessions ==="
  bw list | grep -E "(claude|codex|active)"

  echo "=== Recent Agent Activity ==="
  tail -20 ~/.claude-metrics/tool-usage.log

  echo "=== Process Status ==="
  ps aux | grep -E "(claude|codex)" | grep -v grep
}
```

### Role-Based Task Distribution

**Claude Optimal Tasks**:
- Requirements analysis and architectural planning
- Code review and quality assessment
- Complex problem decomposition
- Integration strategy and system design
- Technical decision making with trade-off analysis

**Codex Optimal Tasks**:
- File editing and code generation
- Test implementation and execution
- CLI command execution and scripting
- Refactoring and code transformations
- Build process and deployment tasks

### Integration with Existing Tools
Multi-agent patterns work seamlessly with your current stack:
- **Docker dev**: Each worktree runs isolated containers with different ports
- **Modern CLI tools**: Both agents benefit from fd/rg/bat performance
- **AI ecosystem**: Complement with aichat/sgpt for quick consultations
- **Quality gates**: Automated validation across all agent outputs

## Common Fixes
```bash
# Module issues
rm -rf node_modules package-lock.json && npm ci

# Port conflicts
lsof -ti:3000 | xargs kill -9

# Docker cleanup
docker compose -f docker-compose.dev.yml down -v

# Multi-agent session cleanup
pkill -f "claude.*bob"
pkill -f "codex.*bob"
bw clean  # Remove unused worktrees
```