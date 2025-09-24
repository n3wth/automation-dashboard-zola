#!/bin/bash
# cursor-agent-monitor.sh - Background agent for issue monitoring and automated PR creation

set -euo pipefail

# Configuration
REPO_OWNER="${REPO_OWNER:-$(git remote get-url origin | sed -E 's/.*github\.com[:/]([^/]+).*/\1/' 2>/dev/null || echo '')}"
REPO_NAME="${REPO_NAME:-$(basename "$(git remote get-url origin 2>/dev/null || echo 'bob')" .git)}"
POLL_INTERVAL="${POLL_INTERVAL:-300}"  # 5 minutes
MAX_CONCURRENT_AGENTS="${MAX_CONCURRENT_AGENTS:-3}"
LOG_FILE="${LOG_FILE:-$HOME/.cursor-agent-monitor.log}"
CURSOR_CLI="${CURSOR_CLI:-cursor-agent}"
CURSOR_HEADLESS="${CURSOR_HEADLESS:-true}"
CURSOR_OUTPUT_FORMAT="${CURSOR_OUTPUT_FORMAT:-text}"
CURSOR_AUTO_APPROVE="${CURSOR_AUTO_APPROVE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check dependencies
check_dependencies() {
    local deps=("$CURSOR_CLI" "gh" "jq")
    local missing_deps=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        log "${BLUE}💡 Install them with:${NC}"
        log "  - Cursor CLI: curl https://cursor.com/install -fsS | bash"
        log "  - GitHub CLI: brew install gh (macOS) or follow https://cli.github.com/"
        log "  - jq: brew install jq (macOS) or apt install jq (Ubuntu)"
        return 1
    fi

    log "${GREEN}✅ All dependencies found${NC}"
    return 0
}

# Get GitHub issues with filtering
get_filtered_issues() {
    local labels="${1:-good first issue,bug,enhancement}"
    local state="${2:-open}"
    local limit="${3:-10}"

    if ! gh api "repos/$REPO_OWNER/$REPO_NAME/issues?state=$state&per_page=$limit" \
        --jq ".[] | select(.pull_request == null and .assignee == null) | {number, title, labels: [.labels[].name], state, assignee, created_at}" 2>/dev/null; then
        log "${YELLOW}⚠️  Failed to fetch issues from GitHub API${NC}"
        return 1
    fi
}

# Check if issue is suitable for automation
is_issue_suitable() {
    local issue_json="$1"

    # Extract issue details
    local number=$(echo "$issue_json" | jq -r '.number')
    local title=$(echo "$issue_json" | jq -r '.title')
    local labels=$(echo "$issue_json" | jq -r '.labels[]' 2>/dev/null | tr '\n' ',' | sed 's/,$//' || echo "")
    local assignee=$(echo "$issue_json" | jq -r '.assignee // "null"')

    # Skip if already assigned
    if [[ "$assignee" != "null" ]]; then
        log "${YELLOW}⏭️  Issue #$number already assigned, skipping${NC}"
        return 1
    fi

    # Skip if already being worked on
    if [[ -f "/tmp/cursor-agent-$number.lock" ]]; then
        log "${YELLOW}⏭️  Issue #$number already being processed, skipping${NC}"
        return 1
    fi

    # Check for automation-friendly labels
    if [[ -z "$labels" ]] || echo "$labels" | grep -qE "(good first issue|bug|enhancement|documentation|refactor)"; then
        log "${GREEN}✅ Issue #$number ($title) is suitable for automation${NC}"
        return 0
    fi

    log "${YELLOW}⏭️  Issue #$number not suitable for automation (labels: $labels)${NC}"
    return 1
}

# Create working branch for issue
create_working_branch() {
    local issue_number="$1"
    local branch_name="cursor-agent/issue-$issue_number"

    # Ensure we're on main branch and up to date
    local main_branch
    if git show-ref --verify --quiet refs/heads/main; then
        main_branch="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        main_branch="master"
    else
        log "${RED}❌ No main or master branch found${NC}"
        return 1
    fi

    git checkout "$main_branch" 2>/dev/null
    git pull origin "$main_branch" 2>/dev/null || true

    # Create and checkout new branch
    if git checkout -b "$branch_name" 2>/dev/null; then
        log "${GREEN}✅ Created branch: $branch_name${NC}"
        echo "$branch_name"
        return 0
    else
        log "${RED}❌ Failed to create branch: $branch_name${NC}"
        return 1
    fi
}

# Process single issue with Cursor Agent
process_issue() {
    local issue_json="$1"
    local number=$(echo "$issue_json" | jq -r '.number')
    local title=$(echo "$issue_json" | jq -r '.title')
    local lock_file="/tmp/cursor-agent-$number.lock"

    # Create lock file
    echo $$ > "$lock_file"
    trap "rm -f '$lock_file'" EXIT

    log "${BLUE}🚀 Starting to process issue #$number: $title${NC}"

    # Get issue details
    local issue_body
    if ! issue_body=$(gh issue view "$number" --json body --jq '.body' 2>/dev/null); then
        log "${RED}❌ Failed to get issue details for #$number${NC}"
        return 1
    fi

    # Create working branch
    local branch_name
    if ! branch_name=$(create_working_branch "$number"); then
        return 1
    fi

    # Create agent prompt
    local prompt="Fix GitHub issue #$number: '$title'

Issue description:
$issue_body

Please analyze the codebase and implement the necessary changes to resolve this issue.
Focus on:
1. Understanding the problem thoroughly
2. Finding the relevant code files
3. Making minimal, focused changes
4. Following existing code patterns
5. Adding tests if needed

Make sure to maintain code quality and follow project conventions."

    log "${BLUE}🤖 Running Cursor Agent for issue #$number${NC}"

    # Build Cursor Agent command with proper flags
    local cursor_cmd=("$CURSOR_CLI" chat "$prompt")

    # Add headless mode if enabled
    if [[ "$CURSOR_HEADLESS" == "true" ]]; then
        cursor_cmd+=(--headless)
    fi

    # Add output format
    if [[ -n "$CURSOR_OUTPUT_FORMAT" ]]; then
        cursor_cmd+=(--output-format "$CURSOR_OUTPUT_FORMAT")
    fi

    # Add auto-approve if enabled (use with caution)
    if [[ "$CURSOR_AUTO_APPROVE" == "true" ]]; then
        cursor_cmd+=(--force)
    fi

    # Run Cursor Agent (use gtimeout on macOS if available, otherwise no timeout)
    local timeout_cmd=""
    if command -v gtimeout &> /dev/null; then
        timeout_cmd="gtimeout 1800"
    elif command -v timeout &> /dev/null; then
        timeout_cmd="timeout 1800"
    fi

    if [[ -n "$timeout_cmd" ]]; then
        if $timeout_cmd "${cursor_cmd[@]}" 2>&1 | tee -a "$LOG_FILE"; then
            success=true
        else
            success=false
        fi
    else
        # No timeout available, run without it
        if "${cursor_cmd[@]}" 2>&1 | tee -a "$LOG_FILE"; then
            success=true
        else
            success=false
        fi
    fi

    if $success; then
        log "${GREEN}✅ Cursor Agent completed work for issue #$number${NC}"

        # Check if there are changes to commit
        if git diff --quiet && git diff --cached --quiet; then
            log "${YELLOW}⚠️  No changes detected for issue #$number${NC}"
            git checkout - 2>/dev/null && git branch -D "$branch_name" 2>/dev/null
            return 1
        fi

        # Commit changes if any
        git add .
        if git commit -m "Fix #$number: $title

Automated fix by Cursor Agent CLI

- Analyzed issue requirements
- Implemented necessary changes
- Maintained code quality standards

Closes #$number"; then

            # Push branch
            if git push origin "$branch_name"; then
                # Create pull request
                local pr_body="This PR addresses issue #$number

## Changes
- Automated fix implemented by Cursor Agent CLI
- Code changes follow project standards
- Ready for review and testing

## Testing
- [ ] Manual testing required
- [ ] Code review needed
- [ ] Automated tests pass

Closes #$number"

                if gh pr create \
                    --title "Fix #$number: $title" \
                    --body "$pr_body" \
                    --head "$branch_name" \
                    --label "automated,cursor-agent" \
                    --assignee "@me" 2>/dev/null; then

                    log "${GREEN}🎉 Successfully created PR for issue #$number${NC}"

                    # Add comment to original issue
                    local pr_url=$(gh pr view "$branch_name" --json url --jq '.url' 2>/dev/null || echo "")
                    if [[ -n "$pr_url" ]]; then
                        gh issue comment "$number" --body "🤖 Cursor Agent has created a PR to address this issue: $pr_url" 2>/dev/null || true
                    fi

                    return 0
                else
                    log "${RED}❌ Failed to create PR for issue #$number${NC}"
                fi
            else
                log "${RED}❌ Failed to push branch for issue #$number${NC}"
            fi
        else
            log "${RED}❌ Failed to commit changes for issue #$number${NC}"
        fi
    else
        log "${RED}❌ Cursor Agent failed or timed out for issue #$number${NC}"
    fi

    # Cleanup on failure
    git checkout - 2>/dev/null && git branch -D "$branch_name" 2>/dev/null || true
    return 1
}

# Monitor and process issues
monitor_issues() {
    log "${BLUE}🔍 Starting Cursor Agent issue monitoring for $REPO_OWNER/$REPO_NAME${NC}"

    while true; do
        local active_jobs=$(jobs -p | wc -l)
        log "${BLUE}📋 Checking for new issues (Active jobs: $active_jobs)${NC}"

        # Clean up completed background jobs
        wait 2>/dev/null || true

        # Get suitable issues if we have capacity
        if [[ $active_jobs -lt $MAX_CONCURRENT_AGENTS ]]; then
            local issues
            if issues=$(get_filtered_issues); then
                echo "$issues" | while IFS= read -r issue; do
                    if [[ -z "$issue" ]] || [[ "$issue" == "null" ]]; then continue; fi

                    if is_issue_suitable "$issue"; then
                        # Check capacity again
                        local current_jobs=$(jobs -p | wc -l)
                        if [[ $current_jobs -lt $MAX_CONCURRENT_AGENTS ]]; then
                            # Process in background
                            (
                                process_issue "$issue"
                            ) &
                            log "${GREEN}▶️  Started agent for issue (Active: $((current_jobs + 1)))${NC}"
                        else
                            log "${YELLOW}⏸️  Max concurrent agents reached, waiting...${NC}"
                            break
                        fi
                    fi
                done
            else
                log "${YELLOW}⚠️  Could not fetch issues${NC}"
            fi
        else
            log "${YELLOW}⏸️  Max concurrent agents active, waiting...${NC}"
        fi

        log "${BLUE}💤 Sleeping for $POLL_INTERVAL seconds${NC}"
        sleep "$POLL_INTERVAL"
    done
}

# Handle cleanup on exit
cleanup() {
    log "${YELLOW}🛑 Shutting down Cursor Agent monitor${NC}"
    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null || true
    # Remove any remaining lock files
    rm -f /tmp/cursor-agent-*.lock
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# One-time run mode
run_once() {
    log "${BLUE}🔄 Running one-time issue check${NC}"

    local issues
    if ! issues=$(get_filtered_issues); then
        log "${RED}❌ Failed to fetch issues${NC}"
        return 1
    fi

    local processed=0
    echo "$issues" | while IFS= read -r issue; do
        if [[ -z "$issue" ]] || [[ "$issue" == "null" ]]; then continue; fi

        if is_issue_suitable "$issue"; then
            if process_issue "$issue"; then
                ((processed++))
            fi

            # Only process one issue in once mode
            break
        fi
    done

    log "${GREEN}✅ One-time run completed (processed: $processed)${NC}"
}

# Main execution
main() {
    case "${1:-}" in
        "--help"|"-h")
            cat << 'EOF'
Cursor Agent Monitor - Automated Issue Processing

Usage: cursor-agent-monitor.sh [OPTIONS]

Options:
  --help, -h      Show this help message
  --once          Run once and exit
  --check-deps    Check dependencies only

Environment Variables:
  REPO_OWNER              Repository owner (auto-detected from git remote)
  REPO_NAME               Repository name (auto-detected from git remote)
  POLL_INTERVAL           Polling interval in seconds (default: 300)
  MAX_CONCURRENT_AGENTS   Maximum concurrent agents (default: 3)
  LOG_FILE               Log file path (default: ~/.cursor-agent-monitor.log)
  CURSOR_CLI             Cursor CLI command (default: cursor-agent)

Examples:
  # Start monitoring with defaults
  ./cursor-agent-monitor.sh

  # Custom configuration
  POLL_INTERVAL=120 MAX_CONCURRENT_AGENTS=5 ./cursor-agent-monitor.sh

  # One-time processing
  ./cursor-agent-monitor.sh --once

EOF
            exit 0
            ;;
        "--check-deps")
            check_dependencies
            exit $?
            ;;
        "--once")
            if ! check_dependencies; then
                exit 1
            fi
            run_once
            exit 0
            ;;
    esac

    # Ensure we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi

    # Set default repo values if empty
    if [[ -z "$REPO_OWNER" ]] || [[ -z "$REPO_NAME" ]]; then
        log "${RED}❌ Could not determine repository details${NC}"
        log "${BLUE}💡 Please set REPO_OWNER and REPO_NAME environment variables${NC}"
        exit 1
    fi

    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi

    # Ensure GitHub CLI is authenticated
    if ! gh auth status > /dev/null 2>&1; then
        log "${RED}❌ GitHub CLI not authenticated. Run: gh auth login${NC}"
        exit 1
    fi

    log "${GREEN}🚀 Cursor Agent Monitor starting...${NC}"
    log "${BLUE}📊 Config: Poll=${POLL_INTERVAL}s, Max Agents=${MAX_CONCURRENT_AGENTS}, Repo=${REPO_OWNER}/${REPO_NAME}${NC}"

    # Start monitoring
    monitor_issues
}

# Run main function
main "$@"