#!/bin/bash

# Bob Project Worktree Management System
# Enables parallel Claude Code development with isolated environments

set -e

# Configuration
PROJECT_NAME="bob"
BASE_DIR=$(pwd)
WORKTREE_BASE="${BASE_DIR}-worktrees"
MAIN_BRANCH="main"

# Port allocation
declare -A PORT_MAP=(
    ["main"]=3000
    ["feature"]=3001
    ["hotfix"]=3002
    ["experiment"]=3003
    ["perf"]=3004
)

declare -A DB_PORT_MAP=(
    ["main"]=54322
    ["feature"]=54323
    ["hotfix"]=54324
    ["experiment"]=54325
    ["perf"]=54326
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Detect branch type from name
get_branch_type() {
    local branch=$1
    case $branch in
        main|master) echo "main" ;;
        feature/*) echo "feature" ;;
        hotfix/*) echo "hotfix" ;;
        experiment/*) echo "experiment" ;;
        perf/*) echo "perf" ;;
        *) echo "feature" ;;
    esac
}

# Create a new worktree
create_worktree() {
    local branch_name=$1
    local base_branch=${2:-$MAIN_BRANCH}

    if [ -z "$branch_name" ]; then
        print_error "Branch name required"
        echo "Usage: $0 create <branch-name> [base-branch]"
        exit 1
    fi

    local worktree_path="${WORKTREE_BASE}/${branch_name//\//-}"
    local branch_type=$(get_branch_type "$branch_name")
    local app_port=${PORT_MAP[$branch_type]}
    local db_port=${DB_PORT_MAP[$branch_type]}

    print_status "Creating worktree for branch: $branch_name"
    print_status "Type: $branch_type | App Port: $app_port | DB Port: $db_port"

    # Create worktree directory if not exists
    mkdir -p "$WORKTREE_BASE"

    # Create the worktree
    if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
        # Branch exists
        git worktree add "$worktree_path" "$branch_name"
    else
        # Create new branch
        git worktree add -b "$branch_name" "$worktree_path" "$base_branch"
    fi

    cd "$worktree_path"

    # Set up environment variables
    print_status "Setting up environment..."
    if [ -f "../$PROJECT_NAME/.env.local" ]; then
        cp "../$PROJECT_NAME/.env.local" .env.local
    fi

    # Update ports in .env.local
    if [ -f ".env.local" ]; then
        # Update port configurations
        echo "" >> .env.local
        echo "# Worktree Configuration" >> .env.local
        echo "PORT=$app_port" >> .env.local
        echo "DATABASE_PORT=$db_port" >> .env.local
        echo "WORKTREE_NAME=$branch_name" >> .env.local
    fi

    # Create Claude Code configuration
    print_status "Configuring Claude Code..."
    mkdir -p .claude

    cat > .claude/settings.local.json << EOF
{
  "worktree": {
    "name": "$branch_name",
    "type": "$branch_type",
    "ports": {
      "app": $app_port,
      "database": $db_port
    }
  },
  "env": {
    "PORT": "$app_port",
    "DATABASE_PORT": "$db_port"
  }
}
EOF

    # Create worktree-specific CLAUDE.md header
    cat > CLAUDE_WORKTREE.md << EOF
# Worktree Context: $branch_name

## Configuration
- **Branch Type**: $branch_type
- **App Port**: $app_port
- **Database Port**: $db_port
- **Docker Volume**: ${PROJECT_NAME}-${branch_name//\//-}-data

## Active Worktrees
Run \`bob-worktree list\` to see all active worktrees and their ports.

## Important
This is a worktree of the main Bob repository. Changes here are isolated from other worktrees.
Use the assigned ports to avoid conflicts with other running instances.

---

EOF

    # Prepend to existing CLAUDE.md if exists
    if [ -f "CLAUDE.md" ]; then
        cat CLAUDE.md >> CLAUDE_WORKTREE.md
        mv CLAUDE_WORKTREE.md CLAUDE.md
    fi

    # Create docker-compose.override.yml for port mapping
    cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    ports:
      - "$app_port:3000"
    environment:
      - PORT=$app_port
      - WORKTREE_NAME=$branch_name

  db:
    ports:
      - "$db_port:5432"
    volumes:
      - ${PROJECT_NAME}-${branch_name//\//-}-postgres:/var/lib/postgresql/data

volumes:
  ${PROJECT_NAME}-${branch_name//\//-}-postgres:
EOF

    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        print_status "Installing dependencies with pnpm..."
        if command -v pnpm &> /dev/null; then
            pnpm install
        else
            npm ci
        fi
    fi

    print_success "Worktree created at: $worktree_path"
    print_success "Start Claude Code with: cd $worktree_path && claude"
    print_success "Start dev server with: npm run dev (port $app_port)"
}

# List all worktrees
list_worktrees() {
    print_status "Active worktrees for $PROJECT_NAME:"
    echo ""

    git worktree list | while read -r line; do
        local path=$(echo "$line" | awk '{print $1}')
        local branch=$(echo "$line" | awk '{print $3}' | tr -d '[]')

        if [[ $path == *"$WORKTREE_BASE"* ]]; then
            local worktree_name=$(basename "$path")
            local branch_type=$(get_branch_type "$branch")
            local app_port=${PORT_MAP[$branch_type]}
            local db_port=${DB_PORT_MAP[$branch_type]}

            echo -e "${GREEN}●${NC} $branch"
            echo "  Path: $path"
            echo "  Ports: App=$app_port, DB=$db_port"

            # Check if services are running
            if lsof -Pi :$app_port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "  Status: ${GREEN}Running${NC}"
            else
                echo -e "  Status: ${YELLOW}Stopped${NC}"
            fi
            echo ""
        fi
    done
}

# Remove a worktree
remove_worktree() {
    local branch_name=$1

    if [ -z "$branch_name" ]; then
        print_error "Branch name required"
        echo "Usage: $0 remove <branch-name>"
        exit 1
    fi

    local worktree_path="${WORKTREE_BASE}/${branch_name//\//-}"

    print_warning "Removing worktree: $branch_name"

    # Stop any running services
    if [ -d "$worktree_path" ]; then
        cd "$worktree_path"

        # Stop Docker containers if running
        if [ -f "docker-compose.yml" ]; then
            docker-compose down 2>/dev/null || true
        fi

        cd "$BASE_DIR"
    fi

    # Remove the worktree
    git worktree remove "$worktree_path" --force

    # Clean up Docker volumes
    docker volume rm "${PROJECT_NAME}-${branch_name//\//-}-postgres" 2>/dev/null || true

    print_success "Worktree removed: $branch_name"
}

# Show status of all worktrees
status_worktrees() {
    print_status "Worktree Status Dashboard"
    echo "════════════════════════════════════════"

    local total=0
    local running=0

    git worktree list | while read -r line; do
        local path=$(echo "$line" | awk '{print $1}')

        if [[ $path == *"$WORKTREE_BASE"* ]]; then
            ((total++))
            local branch=$(echo "$line" | awk '{print $3}' | tr -d '[]')
            local branch_type=$(get_branch_type "$branch")
            local app_port=${PORT_MAP[$branch_type]}

            if lsof -Pi :$app_port -sTCP:LISTEN -t >/dev/null 2>&1; then
                ((running++))
            fi
        fi
    done

    echo "Total Worktrees: $total"
    echo "Running: $running"
    echo ""

    # Port usage summary
    echo "Port Allocation:"
    for type in "${!PORT_MAP[@]}"; do
        local port=${PORT_MAP[$type]}
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  $type ($port): ${GREEN}In Use${NC}"
        else
            echo -e "  $type ($port): ${YELLOW}Available${NC}"
        fi
    done
}

# Sync dependencies across worktrees
sync_worktrees() {
    print_status "Syncing dependencies across all worktrees..."

    git worktree list | while read -r line; do
        local path=$(echo "$line" | awk '{print $1}')

        if [[ $path == *"$WORKTREE_BASE"* ]] && [ -f "$path/package.json" ]; then
            local branch=$(echo "$line" | awk '{print $3}' | tr -d '[]')
            print_status "Updating $branch..."

            cd "$path"
            if command -v pnpm &> /dev/null; then
                pnpm install
            else
                npm ci
            fi
            cd "$BASE_DIR"
        fi
    done

    print_success "All worktrees synced"
}

# Start Claude in specific worktree
claude_worktree() {
    local branch_name=$1

    if [ -z "$branch_name" ]; then
        print_error "Branch name required"
        echo "Usage: $0 claude <branch-name>"
        exit 1
    fi

    local worktree_path="${WORKTREE_BASE}/${branch_name//\//-}"

    if [ ! -d "$worktree_path" ]; then
        print_error "Worktree not found: $branch_name"
        exit 1
    fi

    print_status "Starting Claude Code in worktree: $branch_name"
    cd "$worktree_path"
    exec claude
}

# Main command router
case "$1" in
    create)
        create_worktree "$2" "$3"
        ;;
    list|ls)
        list_worktrees
        ;;
    remove|rm)
        remove_worktree "$2"
        ;;
    status)
        status_worktrees
        ;;
    sync)
        sync_worktrees
        ;;
    claude)
        claude_worktree "$2"
        ;;
    *)
        echo "Bob Worktree Manager"
        echo "Usage: $0 {create|list|remove|status|sync|claude} [options]"
        echo ""
        echo "Commands:"
        echo "  create <branch> [base]  - Create new worktree"
        echo "  list                    - List all worktrees"
        echo "  remove <branch>         - Remove worktree"
        echo "  status                  - Show status dashboard"
        echo "  sync                    - Sync dependencies"
        echo "  claude <branch>         - Start Claude in worktree"
        echo ""
        echo "Examples:"
        echo "  $0 create feature/new-ui"
        echo "  $0 create hotfix/bug-123 main"
        echo "  $0 list"
        echo "  $0 claude feature/new-ui"
        exit 1
        ;;
esac