#!/bin/bash
# cursor-agent-summary.sh - Show complete automation setup status

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "$1"
}

show_system_status() {
    log "${BLUE}🤖 Cursor Agent Automation System Status${NC}"
    log "================================================="
    echo

    # Check if setup was run
    if command -v cursor-agent-controller &> /dev/null; then
        log "${GREEN}✅ Setup Complete: Controller installed${NC}"
    else
        log "${YELLOW}⚠️  Setup Needed: Run ./scripts/cursor-agent-setup.sh${NC}"
    fi

    # Check service status
    log "${BLUE}📊 Service Status:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if launchctl list | grep -q cursor.agent; then
            log "${GREEN}✅ Background service is running${NC}"
        else
            log "${YELLOW}⚠️  Background service not running${NC}"
            log "   Start with: cursor-agent start"
        fi
    else
        if systemctl --user is-active cursor-agent-monitor &> /dev/null; then
            log "${GREEN}✅ Background service is running${NC}"
        else
            log "${YELLOW}⚠️  Background service not running${NC}"
            log "   Start with: cursor-agent start"
        fi
    fi
    echo
}

show_configuration() {
    log "${BLUE}⚙️  Configuration Summary:${NC}"
    log "  • Mode: ${GREEN}Headless + Auto-approve${NC}"
    log "  • Poll Interval: ${GREEN}5 minutes${NC}"
    log "  • Max Concurrent Agents: ${GREEN}2${NC}"
    log "  • Output Format: ${GREEN}Text${NC}"
    log "  • Quality Gates: ${GREEN}Enabled (lint, typecheck)${NC}"
    echo

    log "${BLUE}🎯 Target Issues:${NC}"
    log "  • ${GREEN}good first issue${NC} (Priority: 10)"
    log "  • ${GREEN}bug${NC} (Priority: 8)"
    log "  • ${GREEN}typo${NC} (Priority: 9)"
    log "  • ${GREEN}documentation${NC} (Priority: 6)"
    log "  • ${GREEN}enhancement${NC} (Priority: 5)"
    echo

    log "${BLUE}🚫 Excluded Issues:${NC}"
    log "  • ${RED}wontfix, duplicate, blocked${NC}"
    log "  • ${RED}security, architecture${NC}"
    log "  • ${RED}Already assigned issues${NC}"
    echo
}

show_workflow() {
    log "${BLUE}🔄 Automated Workflow:${NC}"
    log "  1. ${BLUE}Monitor${NC} GitHub issues every 5 minutes"
    log "  2. ${BLUE}Filter${NC} issues by labels and complexity"
    log "  3. ${BLUE}Prioritize${NC} using scoring algorithm"
    log "  4. ${BLUE}Spawn${NC} Cursor Agent in headless mode"
    log "  5. ${BLUE}Analyze${NC} issue and implement fix"
    log "  6. ${BLUE}Create${NC} branch with descriptive name"
    log "  7. ${BLUE}Commit${NC} changes with proper message"
    log "  8. ${BLUE}Run${NC} quality checks (lint, typecheck)"
    log "  9. ${BLUE}Push${NC} branch to GitHub"
    log "  10. ${BLUE}Create${NC} pull request with details"
    log "  11. ${BLUE}Comment${NC} on original issue with PR link"
    echo
}

show_commands() {
    log "${BLUE}💻 Available Commands:${NC}"
    log "  ${GREEN}cursor-agent start${NC}   - Start background monitoring"
    log "  ${GREEN}cursor-agent stop${NC}    - Stop background monitoring"
    log "  ${GREEN}cursor-agent status${NC}  - Show service status"
    log "  ${GREEN}cursor-agent logs${NC}    - View recent logs"
    log "  ${GREEN}cursor-agent once${NC}    - Process one issue manually"
    log "  ${GREEN}cursor-agent config${NC}  - Edit configuration"
    log "  ${GREEN}cursor-agent test${NC}    - Test dependencies"
    echo
}

show_safety_features() {
    log "${BLUE}🛡️  Safety Features:${NC}"
    log "  • ${GREEN}Protected Files${NC}: Won't modify package.json, workflows, etc."
    log "  • ${GREEN}Quality Gates${NC}: Runs lint/typecheck before committing"
    log "  • ${GREEN}Branch Isolation${NC}: Each fix in separate branch"
    log "  • ${GREEN}Timeout Protection${NC}: Commands timeout after 30 minutes"
    log "  • ${GREEN}Complexity Filtering${NC}: Skips complex architectural changes"
    log "  • ${GREEN}Comprehensive Logging${NC}: Full audit trail of all actions"
    echo
}

show_next_steps() {
    log "${BLUE}🚀 Quick Start:${NC}"

    # Check if setup is needed
    if ! command -v cursor-agent-controller &> /dev/null; then
        log "  1. ${YELLOW}Run setup:${NC} ./scripts/cursor-agent-setup.sh"
        log "  2. ${YELLOW}Start service:${NC} cursor-agent start"
        log "  3. ${YELLOW}Monitor logs:${NC} cursor-agent logs"
    else
        log "  1. ${GREEN}Start monitoring:${NC} cursor-agent start"
        log "  2. ${GREEN}Check status:${NC} cursor-agent status"
        log "  3. ${GREEN}View activity:${NC} cursor-agent logs"
        log "  4. ${GREEN}Test once:${NC} cursor-agent once"
    fi
    echo

    log "${BLUE}📊 Monitoring:${NC}"
    log "  • Log file: ${GREEN}~/.cursor-agent-monitor.log${NC}"
    log "  • Config file: ${GREEN}~/.cursor-agent-config.json${NC}"
    log "  • Service status: ${GREEN}cursor-agent status${NC}"
    echo
}

show_advanced_usage() {
    log "${BLUE}⚡ Advanced Usage:${NC}"
    log "  # Custom repository"
    log "  REPO_OWNER=myorg REPO_NAME=myproject cursor-agent once"
    echo
    log "  # Adjust concurrency"
    log "  MAX_CONCURRENT_AGENTS=5 cursor-agent start"
    echo
    log "  # Different poll interval"
    log "  POLL_INTERVAL=180 cursor-agent start  # 3 minutes"
    echo
    log "  # Debug mode"
    log "  CURSOR_OUTPUT_FORMAT=json cursor-agent once"
    echo
}

main() {
    case "${1:-}" in
        "--help"|"-h")
            echo "Cursor Agent Summary - Show automation system status"
            echo ""
            echo "Usage: cursor-agent-summary.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --help, -h      Show this help"
            echo "  --status        Show status only"
            echo "  --config        Show configuration only"
            echo "  --commands      Show commands only"
            echo ""
            exit 0
            ;;
        "--status")
            show_system_status
            exit 0
            ;;
        "--config")
            show_configuration
            exit 0
            ;;
        "--commands")
            show_commands
            exit 0
            ;;
    esac

    # Show full summary
    show_system_status
    show_configuration
    show_workflow
    show_commands
    show_safety_features
    show_next_steps
    show_advanced_usage

    log "${GREEN}🎉 Cursor Agent automation is ready for GitHub issue processing!${NC}"
}

main "$@"