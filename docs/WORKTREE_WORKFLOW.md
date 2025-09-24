# 🚀 Parallel Development with Git Worktrees & Claude Code

## Overview

Git worktrees enable **parallel development** by allowing multiple working directories for different branches simultaneously. Combined with Claude Code, this creates a **productivity multiplier** effect.

## Why Worktrees?

### Traditional Workflow Problems
```
main branch → feature branch → hotfix → back to feature
    ↓              ↓              ↓           ↓
 (stash)      (stash)        (stash)     (unstash)
    ↓              ↓              ↓           ↓
  5 min         5 min          5 min        5 min
```
**Total context switch time: 20 minutes**

### Worktree Workflow
```
Terminal 1: main      ←→ Terminal 2: feature ←→ Terminal 3: hotfix
     ↓                        ↓                      ↓
  claude                   claude                 claude
     ↓                        ↓                      ↓
  port 3000               port 3001             port 3002
```
**Total context switch time: 0 seconds**

## Setup Guide

### 1. Initial Setup
```bash
# Make the worktree script executable
chmod +x scripts/bob-worktree.sh

# Add alias to your shell profile
echo "alias bw='bash ~/GitHub/bob/scripts/bob-worktree.sh'" >> ~/.zshrc
source ~/.zshrc

# Configure pnpm for shared package store (saves disk space)
pnpm config set store-dir ~/.pnpm-store
```

### 2. Create Your First Worktree
```bash
# Create a feature worktree
bw create feature/new-ai-chat

# Output:
# ✓ Worktree created at: bob-worktrees/feature-new-ai-chat
# ✓ App port: 3001, Database port: 54323
# ✓ Start Claude: cd bob-worktrees/feature-new-ai-chat && claude
```

### 3. Start Parallel Development
```bash
# Terminal 1: Main branch monitoring
cd ~/GitHub/bob
claude  # Production monitoring context

# Terminal 2: Feature development
cd ~/GitHub/bob-worktrees/feature-new-ai-chat
claude  # Feature-specific context

# Terminal 3: Performance optimization
bw create perf/optimize-queries
cd ~/GitHub/bob-worktrees/perf-optimize-queries
claude  # Performance profiling context
```

## Workflow Patterns

### Pattern 1: Feature Development + Hotfix
```bash
# Working on feature
cd bob-worktrees/feature-new-ui
npm run dev  # Port 3001

# Urgent bug reported!
# WITHOUT stopping feature work:
bw create hotfix/critical-bug main
cd bob-worktrees/hotfix-critical-bug
claude  # Fresh context for hotfix
npm run dev  # Port 3002, no conflict!

# Fix bug, merge, deploy
git push origin hotfix/critical-bug
# Create PR, merge

# Return to feature - exactly where you left off
cd ../feature-new-ui
# Claude context still intact!
```

### Pattern 2: A/B Implementation Testing
```bash
# Approach A: REST API
bw create experiment/rest-api
cd bob-worktrees/experiment-rest-api
claude "implement user API with REST"

# Approach B: GraphQL
bw create experiment/graphql
cd bob-worktrees/experiment-graphql
claude "implement user API with GraphQL"

# Compare side-by-side
# Both running on different ports
# Both have separate Claude contexts
# Performance test both simultaneously
```

### Pattern 3: Multi-Feature Parallel Development
```bash
# Frontend developer
bw create feature/ui-redesign
cd bob-worktrees/feature-ui-redesign
claude  # UI-focused context

# Backend developer (same machine!)
bw create feature/api-v2
cd bob-worktrees/feature-api-v2
claude  # API-focused context

# Both can run simultaneously
# No port conflicts (3001 vs 3002)
# No database conflicts (54323 vs 54324)
```

## Docker Integration

Each worktree gets isolated Docker resources:

### Automatic docker-compose.override.yml
```yaml
# Created automatically for each worktree
services:
  app:
    ports:
      - "3001:3000"  # Unique port per worktree
  db:
    ports:
      - "54323:5432"  # Unique DB port
    volumes:
      - bob-feature-new-ai-chat-postgres:/var/lib/postgresql/data
```

### Start Services
```bash
# In any worktree
docker-compose -f docker-compose.dev.yml up

# Each worktree has isolated:
# - Database volume
# - Redis instance
# - Supabase services
```

## Claude Code Optimization

### Per-Worktree Context
Each worktree has modified `CLAUDE.md`:
```markdown
# Worktree Context: feature/new-ai-chat
- Branch Type: feature
- App Port: 3001
- Database Port: 54323
- Focus: Implementing AI chat features

## Other Active Worktrees
- main (3000): Production monitoring
- hotfix/bug-123 (3002): Critical fix
```

### Isolated Claude Settings
`.claude/settings.local.json` per worktree:
```json
{
  "worktree": {
    "name": "feature/new-ai-chat",
    "ports": {
      "app": 3001,
      "database": 54323
    }
  }
}
```

## Port Management

### Default Allocations
| Branch Pattern | App Port | DB Port | Supabase Port |
|---------------|----------|---------|---------------|
| main          | 3000     | 54322   | 54400         |
| feature/*     | 3001     | 54323   | 54401         |
| hotfix/*      | 3002     | 54324   | 54402         |
| experiment/*  | 3003     | 54325   | 54403         |
| perf/*        | 3004     | 54326   | 54404         |

### Check Port Usage
```bash
# See all port allocations
bw status

# Output:
# Port Allocation:
#   main (3000): In Use
#   feature (3001): In Use
#   hotfix (3002): Available
```

## Best Practices

### 1. Naming Conventions
```bash
# Good
feature/user-auth
hotfix/payment-bug
experiment/new-algorithm
perf/db-optimization

# Bad
my-branch
test
work
```

### 2. Resource Management
```bash
# Clean up finished worktrees
bw remove feature/completed-feature

# Sync all dependencies
bw sync

# Check resource usage
bw status
```

### 3. Claude Code Sessions
```bash
# Start Claude in specific worktree
bw claude feature/new-ui

# Or manually
cd bob-worktrees/feature-new-ui
claude
```

### 4. Dependency Management
```bash
# Use pnpm for shared store
pnpm config set store-dir ~/.pnpm-store

# Each worktree shares packages
# 500MB → 50MB per additional worktree
```

## Troubleshooting

### Port Conflicts
```bash
# Find what's using a port
lsof -i :3001

# Kill process on port
lsof -ti:3001 | xargs kill -9

# Reset port allocation
bw status  # Check allocations
```

### Worktree Cleanup
```bash
# Remove worktree and all resources
bw remove feature/old-branch

# Prune deleted worktrees
git worktree prune

# Clean Docker volumes
docker volume prune
```

### Sync Issues
```bash
# Force sync all worktrees
bw sync

# Manual sync for specific worktree
cd bob-worktrees/feature-x
pnpm install
```

## Advanced Patterns

### CI/CD Integration
```yaml
# .github/workflows/worktree-ci.yml
name: Worktree CI
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Create worktree
        run: |
          git worktree add ../pr-${{ github.event.number }} ${{ github.head_ref }}
      - name: Test in isolation
        run: |
          cd ../pr-${{ github.event.number }}
          npm test
```

### Automated Cleanup
```bash
# Add to crontab
# Clean up old worktrees weekly
0 0 * * 0 cd ~/GitHub/bob && git worktree prune && docker volume prune -f
```

### Performance Monitoring
```bash
# Track worktree performance
alias bw-perf='ps aux | grep -E "node|claude|docker" | grep -v grep'

# Monitor all Claude sessions
alias bw-claude='ps aux | grep claude | grep -v grep'
```

## Expected Benefits

### Productivity Metrics
- **Context Switch Time**: 5min → 0s (100% reduction)
- **Parallel Features**: 1 → 3-4 (300% increase)
- **Bug Fix Response**: 30min → 5min (83% reduction)
- **A/B Testing**: Sequential → Parallel (2x speed)

### Developer Experience
- ✅ No more stashing/unstashing
- ✅ No more branch confusion
- ✅ No more "what was I working on?"
- ✅ No more port conflicts
- ✅ No more database migrations conflicts

### Team Collaboration
- Multiple developers on same machine
- Parallel feature development
- Instant hotfix capability
- Risk-free experimentation

## Migration Guide

### From Traditional to Worktree Workflow

#### Week 1: Setup
- Install worktree script
- Configure pnpm shared store
- Create first worktree

#### Week 2: Adoption
- Use for hotfixes only
- Keep main work in primary directory

#### Week 3: Expansion
- Move feature development to worktrees
- Start using parallel Claude sessions

#### Week 4: Full Migration
- All branches in worktrees
- Primary directory for main only
- Full parallel workflow

## Conclusion

Worktrees transform Bob from a sequential development model to a **parallel powerhouse**. Combined with Claude Code's context isolation, you can:

1. **Develop 3-4 features simultaneously**
2. **Never lose context when switching**
3. **Instantly respond to critical issues**
4. **A/B test implementations side-by-side**
5. **Reduce development time by 40-60%**

Start with one worktree today and experience the productivity boost!