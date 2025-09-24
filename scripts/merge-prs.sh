#!/bin/bash

# merge-prs.sh - Auto-check and merge PRs with gh tool
# Usage: ./merge-prs.sh [PR_NUMBER] or ./merge-prs.sh (for interactive mode)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check PR status
check_pr() {
    local pr_number=$1

    print_status "Checking PR #$pr_number..."

    # Get PR details
    pr_info=$(gh pr view $pr_number --json title,state,mergeable,statusCheckRollup,reviewDecision,baseRefName,headRefName)

    title=$(echo "$pr_info" | jq -r '.title')
    state=$(echo "$pr_info" | jq -r '.state')
    mergeable=$(echo "$pr_info" | jq -r '.mergeable')
    status_checks=$(echo "$pr_info" | jq -r '.statusCheckRollup.state // "null"')
    review_decision=$(echo "$pr_info" | jq -r '.reviewDecision')
    base_branch=$(echo "$pr_info" | jq -r '.baseRefName')
    head_branch=$(echo "$pr_info" | jq -r '.headRefName')

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 PR #$pr_number: $title"
    echo "🌿 $head_branch → $base_branch"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check state
    if [[ "$state" != "OPEN" ]]; then
        print_error "PR is not open (state: $state)"
        return 1
    fi

    # Check if mergeable
    if [[ "$mergeable" == "CONFLICTING" ]]; then
        print_error "PR has merge conflicts"
        return 1
    fi

    # Check status checks
    case "$status_checks" in
        "SUCCESS")
            print_success "✅ All status checks passed"
            ;;
        "FAILURE")
            print_error "❌ Status checks failed"
            return 1
            ;;
        "PENDING")
            print_warning "⏳ Status checks pending"
            ;;
        "null")
            print_warning "⚪ No status checks configured"
            ;;
        *)
            print_warning "❓ Status checks: $status_checks"
            ;;
    esac

    # Check reviews
    case "$review_decision" in
        "APPROVED")
            print_success "✅ PR approved"
            ;;
        "CHANGES_REQUESTED")
            print_error "❌ Changes requested"
            return 1
            ;;
        "REVIEW_REQUIRED")
            print_warning "⏳ Review required"
            ;;
        "null")
            print_warning "⚪ No review required"
            ;;
        *)
            print_warning "❓ Review status: $review_decision"
            ;;
    esac

    # Show brief diff summary
    print_status "📊 Change summary:"
    gh pr diff $pr_number --name-only | head -10 | sed 's/^/  • /'

    changes_count=$(gh pr diff $pr_number --name-only | wc -l | tr -d ' ')
    if [[ $changes_count -gt 10 ]]; then
        echo "  ... and $((changes_count - 10)) more files"
    fi

    # Show recent commits
    print_status "📝 Recent commits:"
    gh pr view $pr_number --json commits --jq '.commits[-3:][].messageHeadline' | sed 's/^/  • /'

    return 0
}

# Function to merge PR
merge_pr() {
    local pr_number=$1
    local merge_method=${2:-squash}

    print_status "Merging PR #$pr_number using $merge_method method..."

    case "$merge_method" in
        "squash")
            gh pr merge $pr_number --squash --delete-branch
            ;;
        "merge")
            gh pr merge $pr_number --merge --delete-branch
            ;;
        "rebase")
            gh pr merge $pr_number --rebase --delete-branch
            ;;
        *)
            print_error "Unknown merge method: $merge_method"
            return 1
            ;;
    esac

    print_success "PR #$pr_number merged successfully!"
}

# Function to list open PRs
list_prs() {
    print_status "Open PRs:"
    gh pr list --json number,title,author,updatedAt --template '
    {{- range . -}}
    {{printf "#%-3v" .number}} {{.title}} (by @{{.author.login}})
    {{end}}'
}

# Interactive mode
interactive_mode() {
    while true; do
        echo ""
        echo "🔄 PR Merge Assistant"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        list_prs

        echo ""
        echo "Options:"
        echo "  [number] - Check and merge specific PR"
        echo "  'all'    - Check all open PRs (no merge)"
        echo "  'quit'   - Exit"
        echo ""

        read -p "Enter PR number or option: " choice

        case "$choice" in
            quit|q|exit)
                print_status "Goodbye!"
                exit 0
                ;;
            all)
                print_status "Checking all open PRs..."
                gh pr list --json number --jq '.[].number' | while read pr_num; do
                    echo ""
                    check_pr "$pr_num" || true
                done
                ;;
            [0-9]*)
                echo ""
                if check_pr "$choice"; then
                    echo ""
                    read -p "Merge this PR? [y/N]: " confirm
                    if [[ "$confirm" =~ ^[Yy]$ ]]; then
                        echo ""
                        echo "Merge methods:"
                        echo "  1) squash (recommended)"
                        echo "  2) merge"
                        echo "  3) rebase"
                        echo ""
                        read -p "Choose merge method [1-3, default 1]: " method_choice

                        case "$method_choice" in
                            2) method="merge" ;;
                            3) method="rebase" ;;
                            *) method="squash" ;;
                        esac

                        merge_pr "$choice" "$method"
                    else
                        print_status "Skipping merge"
                    fi
                fi
                ;;
            *)
                print_error "Invalid option: $choice"
                ;;
        esac
    done
}

# Main script
main() {
    # Check if gh is installed
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        print_status "Install with: brew install gh"
        exit 1
    fi

    # Check if logged in
    if ! gh auth status &> /dev/null; then
        print_error "Not logged into GitHub CLI"
        print_status "Login with: gh auth login"
        exit 1
    fi

    # Check if in git repo
    if ! git rev-parse --git-dir &> /dev/null; then
        print_error "Not in a git repository"
        exit 1
    fi

    if [[ $# -eq 0 ]]; then
        interactive_mode
    else
        pr_number=$1
        merge_method=${2:-squash}

        if check_pr "$pr_number"; then
            echo ""
            read -p "Merge PR #$pr_number? [y/N]: " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                merge_pr "$pr_number" "$merge_method"
            else
                print_status "Merge cancelled"
            fi
        fi
    fi
}

# Run main function
main "$@"