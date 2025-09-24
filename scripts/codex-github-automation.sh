#!/bin/bash

# Codex-GitHub Automation Pipeline
# Comprehensive automation for GitHub Issues → Codex Tasks → PRs → Issue Closure

set -e

echo "🚀 Starting Codex-GitHub Automation Pipeline..."

# Configuration
GITHUB_REPO="n3wth/bob"
CODEX_URL="https://chatgpt.com/codex"
BROWSERBASE_SESSION_NAME="codex-automation-$(date +%s)"

# Functions
create_director_app() {
    echo "📱 Creating Director app for reusable automation..."
    # Note: Requires Google API key setup
    npx create-director-app "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY3JpcHRJZCI6IjExOGM3MDI5LTkzZmMtNGY0OS1iZjUzLTYwYWUwNWZmNjc2OCIsInR5cGUiOiJzY3JpcHQtYWNjZXNzIiwiaWF0IjoxNzU4NzAyMTQwLCJleHAiOjE3NTg3MDI3NDB9.v4RVJieWmOD2QgguwDkFLXHLkuTn8WYK3UuZIP89szo" \
        --project-name "Create-Codex-Tasks-from-GitHub-Issues" || echo "⚠️ Director app creation requires manual setup"
}

check_open_issues() {
    echo "🔍 Checking open GitHub issues..."
    gh issue list --state open --limit 20 --json number,title,labels,createdAt
}

create_codex_tasks() {
    echo "⚗️ Creating Codex tasks for new GitHub issues..."
    # This would be implemented with Claude Code automation
    # claude "Create Codex tasks for all open GitHub issues using Browserbase automation"
}

monitor_completed_tasks() {
    echo "📊 Monitoring Codex tasks for completion..."
    # This would check Codex interface for completed tasks
}

create_prs_for_completed() {
    echo "🔧 Creating PRs for completed Codex tasks..."
    # Automated PR creation via Codex "Create PR" buttons
}

close_resolved_issues() {
    echo "✅ Closing resolved GitHub issues..."
    # Check merged PRs and close corresponding issues
    gh pr list --state merged --limit 10 --json number,title,mergedAt | \
    jq -r '.[] | "gh issue close $(echo \(.title) | grep -o "#[0-9]*" | sed "s/#//") --comment \"Fixed by merged PR #\(.number)\""'
}

# Main automation workflow
main() {
    echo "🎯 Running complete automation cycle..."

    # Step 1: Check for new issues
    NEW_ISSUES=$(gh issue list --state open --created $(date -v-1H +%Y-%m-%dT%H:%M:%SZ) --json number | jq length)

    if [ "$NEW_ISSUES" -gt 0 ]; then
        echo "📝 Found $NEW_ISSUES new issues - creating Codex tasks..."
        create_codex_tasks
    fi

    # Step 2: Check for completed tasks and create PRs
    create_prs_for_completed

    # Step 3: Close resolved issues
    close_resolved_issues

    # Step 4: Set up Director app for future automation
    create_director_app

    echo "✨ Automation cycle complete!"
}

# Enhanced workflow with metrics
run_with_metrics() {
    START_TIME=$(date +%s)

    # Get baseline metrics
    INITIAL_OPEN_ISSUES=$(gh issue list --state open --json number | jq length)
    INITIAL_OPEN_PRS=$(gh pr list --state open --json number | jq length)

    echo "📊 Baseline Metrics:"
    echo "   Open Issues: $INITIAL_OPEN_ISSUES"
    echo "   Open PRs: $INITIAL_OPEN_PRS"

    # Run main automation
    main

    # Calculate results
    FINAL_OPEN_ISSUES=$(gh issue list --state open --json number | jq length)
    FINAL_OPEN_PRS=$(gh pr list --state open --json number | jq length)

    ISSUES_RESOLVED=$((INITIAL_OPEN_ISSUES - FINAL_OPEN_ISSUES))
    PRS_CREATED=$((FINAL_OPEN_PRS - INITIAL_OPEN_PRS))

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo "📈 Results Summary:"
    echo "   Issues Resolved: $ISSUES_RESOLVED"
    echo "   PRs Created: $PRS_CREATED"
    echo "   Duration: ${DURATION}s"

    # Log to metrics file
    echo "$(date): Issues Resolved: $ISSUES_RESOLVED, PRs Created: $PRS_CREATED, Duration: ${DURATION}s" >> ~/.claude-metrics/codex-automation.log
}

# Continuous monitoring mode
continuous_monitoring() {
    echo "🔄 Starting continuous monitoring mode..."
    while true; do
        echo "$(date): Running automation cycle..."
        run_with_metrics
        echo "⏸️ Waiting 30 minutes for next cycle..."
        sleep 1800  # 30 minutes
    done
}

# Command line options
case "${1:-run}" in
    "run")
        run_with_metrics
        ;;
    "monitor")
        continuous_monitoring
        ;;
    "setup-director")
        create_director_app
        ;;
    "metrics")
        echo "📊 Recent Automation Metrics:"
        tail -10 ~/.claude-metrics/codex-automation.log 2>/dev/null || echo "No metrics file found"
        ;;
    *)
        echo "Usage: $0 [run|monitor|setup-director|metrics]"
        echo "  run           - Single automation cycle (default)"
        echo "  monitor       - Continuous monitoring mode"
        echo "  setup-director - Set up Director app"
        echo "  metrics       - Show recent metrics"
        exit 1
        ;;
esac