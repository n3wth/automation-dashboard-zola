#!/bin/bash
# cursor-agent-setup.sh - Setup script for Cursor Agent automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CURSOR_INSTALL_URL="https://cursor.com/install"

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

install_cursor_cli() {
    log "${BLUE}📦 Installing Cursor CLI...${NC}"

    if command -v cursor-agent &> /dev/null; then
        log "${GREEN}✅ Cursor CLI already installed$(cursor-agent --version 2>/dev/null | head -1 || '')${NC}"
        return 0
    fi

    log "${BLUE}⬇️  Downloading and installing Cursor CLI...${NC}"
    if curl -fsSL "$CURSOR_INSTALL_URL" | bash; then
        log "${GREEN}✅ Cursor CLI installed successfully${NC}"

        # Add to PATH if needed
        if ! command -v cursor-agent &> /dev/null; then
            local cursor_path="$HOME/.cursor/bin"
            if [[ -d "$cursor_path" ]]; then
                echo "export PATH=\"$cursor_path:\$PATH\"" >> ~/.bashrc
                echo "export PATH=\"$cursor_path:\$PATH\"" >> ~/.zshrc
                export PATH="$cursor_path:$PATH"
                log "${GREEN}✅ Added Cursor CLI to PATH${NC}"
            fi
        fi
    else
        log "${RED}❌ Failed to install Cursor CLI${NC}"
        return 1
    fi
}

setup_github_cli() {
    log "${BLUE}📦 Checking GitHub CLI...${NC}"

    if ! command -v gh &> /dev/null; then
        log "${YELLOW}⚠️  GitHub CLI not found. Installing...${NC}"

        # Install based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install gh
            else
                log "${RED}❌ Homebrew not found. Please install GitHub CLI manually: https://cli.github.com/${NC}"
                return 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Try different package managers
            if command -v apt &> /dev/null; then
                curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                sudo apt update && sudo apt install gh
            elif command -v yum &> /dev/null; then
                sudo yum install -y gh
            else
                log "${RED}❌ No supported package manager found. Please install GitHub CLI manually${NC}"
                return 1
            fi
        else
            log "${RED}❌ Unsupported OS. Please install GitHub CLI manually: https://cli.github.com/${NC}"
            return 1
        fi
    fi

    # Check if authenticated
    if ! gh auth status > /dev/null 2>&1; then
        log "${YELLOW}🔑 GitHub CLI not authenticated${NC}"
        log "${BLUE}💡 Please authenticate with GitHub:${NC}"
        log "   ${GREEN}gh auth login${NC}"
        log ""
        log "${BLUE}Select the following options:${NC}"
        log "   - GitHub.com"
        log "   - HTTPS"
        log "   - Yes (authenticate Git with GitHub credentials)"
        log "   - Login with a web browser"
        log ""
        read -p "Press Enter to continue with authentication..."
        gh auth login
    fi

    log "${GREEN}✅ GitHub CLI configured and authenticated${NC}"
}

check_jq() {
    log "${BLUE}📦 Checking jq...${NC}"

    if ! command -v jq &> /dev/null; then
        log "${YELLOW}⚠️  jq not found. Installing...${NC}"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install jq
            else
                log "${RED}❌ Please install jq manually: https://jqlang.github.io/jq/download/${NC}"
                return 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt &> /dev/null; then
                sudo apt update && sudo apt install -y jq
            elif command -v yum &> /dev/null; then
                sudo yum install -y jq
            else
                log "${RED}❌ Please install jq manually: https://jqlang.github.io/jq/download/${NC}"
                return 1
            fi
        fi
    fi

    log "${GREEN}✅ jq is available${NC}"
}

create_launchd_service() {
    log "${BLUE}🔧 Setting up launchd service for background monitoring (macOS)...${NC}"

    local plist_file="$HOME/Library/LaunchAgents/com.cursor.agent.monitor.plist"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local monitor_script="$script_dir/cursor-agent-monitor.sh"

    # Ensure LaunchAgents directory exists
    mkdir -p "$HOME/Library/LaunchAgents"

    cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cursor.agent.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$monitor_script</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$HOME/.cursor/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>POLL_INTERVAL</key>
        <string>300</string>
        <key>MAX_CONCURRENT_AGENTS</key>
        <string>2</string>
        <key>LOG_FILE</key>
        <string>$HOME/.cursor-agent-monitor.log</string>
        <key>CURSOR_HEADLESS</key>
        <string>true</string>
        <key>CURSOR_OUTPUT_FORMAT</key>
        <string>text</string>
        <key>CURSOR_AUTO_APPROVE</key>
        <string>true</string>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.cursor-agent-monitor.out</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.cursor-agent-monitor.err</string>
</dict>
</plist>
EOF

    log "${GREEN}✅ Launchd service created at $plist_file${NC}"
}

create_systemd_service() {
    log "${BLUE}🔧 Setting up systemd service for background monitoring (Linux)...${NC}"

    local service_file="$HOME/.config/systemd/user/cursor-agent-monitor.service"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local monitor_script="$script_dir/cursor-agent-monitor.sh"

    # Create systemd user directory
    mkdir -p "$HOME/.config/systemd/user"

    cat > "$service_file" << EOF
[Unit]
Description=Cursor Agent Issue Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$monitor_script
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
WorkingDirectory=$(pwd)
Environment=PATH=$HOME/.cursor/bin:/usr/local/bin:/usr/bin:/bin
Environment=POLL_INTERVAL=300
Environment=MAX_CONCURRENT_AGENTS=2
Environment=LOG_FILE=$HOME/.cursor-agent-monitor.log
Environment=CURSOR_HEADLESS=true
Environment=CURSOR_OUTPUT_FORMAT=text
Environment=CURSOR_AUTO_APPROVE=true

[Install]
WantedBy=default.target
EOF

    # Reload systemd user daemon
    systemctl --user daemon-reload

    log "${GREEN}✅ Systemd service created at $service_file${NC}"
}

create_config_files() {
    log "${BLUE}📝 Creating configuration files...${NC}"

    # Create issue filter config
    cat > "$HOME/.cursor-agent-config.json" << 'EOF'
{
  "issue_filters": {
    "labels": [
      "good first issue",
      "bug",
      "enhancement",
      "documentation",
      "refactor",
      "help wanted"
    ],
    "exclude_labels": [
      "wontfix",
      "duplicate",
      "invalid",
      "question",
      "epic",
      "blocked",
      "dependencies"
    ],
    "max_age_days": 30,
    "min_complexity_score": 1,
    "max_complexity_score": 7
  },
  "agent_settings": {
    "max_concurrent": 2,
    "timeout_minutes": 30,
    "auto_assign": true,
    "create_draft_pr": false,
    "require_approval": true
  },
  "repository": {
    "default_branch": "main",
    "protected_files": [
      ".github/workflows/*",
      "package.json",
      "*.md"
    ]
  },
  "quality_gates": {
    "run_tests": true,
    "run_linting": true,
    "require_type_check": true
  }
}
EOF

    log "${GREEN}✅ Configuration file created at ~/.cursor-agent-config.json${NC}"
}

create_wrapper_scripts() {
    log "${BLUE}📜 Creating wrapper scripts...${NC}"

    # Ensure .local/bin exists
    mkdir -p "$HOME/.local/bin"

    # Main control script
    cat > "$HOME/.local/bin/cursor-agent-controller" << 'EOF'
#!/bin/bash
# Cursor Agent Controller - Main control script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$(find "$HOME" -name "cursor-agent-monitor.sh" 2>/dev/null | head -1)"

if [[ -z "$MONITOR_SCRIPT" ]]; then
    echo "❌ Monitor script not found. Please run setup first."
    exit 1
fi

case "${1:-}" in
    "start")
        echo "🚀 Starting Cursor Agent monitor..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            launchctl load ~/Library/LaunchAgents/com.cursor.agent.monitor.plist 2>/dev/null || echo "Service already loaded"
        else
            systemctl --user start cursor-agent-monitor
        fi
        echo "✅ Service started"
        ;;
    "stop")
        echo "🛑 Stopping Cursor Agent monitor..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            launchctl unload ~/Library/LaunchAgents/com.cursor.agent.monitor.plist 2>/dev/null || echo "Service not loaded"
        else
            systemctl --user stop cursor-agent-monitor
        fi
        echo "✅ Service stopped"
        ;;
    "status")
        echo "📊 Cursor Agent status:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if launchctl list | grep -q cursor.agent; then
                echo "✅ Service is running"
                launchctl list | grep cursor.agent
            else
                echo "❌ Service is not running"
            fi
        else
            systemctl --user status cursor-agent-monitor --no-pager
        fi
        ;;
    "logs")
        echo "📋 Recent logs:"
        if [[ -f "$HOME/.cursor-agent-monitor.log" ]]; then
            tail -50 "$HOME/.cursor-agent-monitor.log"
        else
            echo "No logs found"
        fi
        ;;
    "config")
        ${EDITOR:-nano} ~/.cursor-agent-config.json
        ;;
    "once")
        echo "🔄 Running one-time issue check..."
        if [[ -d "$HOME/GitHub/bob" ]]; then
            cd "$HOME/GitHub/bob" && "$MONITOR_SCRIPT" --once
        else
            echo "❌ Repository not found at ~/GitHub/bob"
            exit 1
        fi
        ;;
    "test")
        echo "🧪 Testing dependencies..."
        "$MONITOR_SCRIPT" --check-deps
        ;;
    *)
        echo "Cursor Agent Controller"
        echo ""
        echo "Usage: cursor-agent-controller [command]"
        echo ""
        echo "Commands:"
        echo "  start    Start background monitoring service"
        echo "  stop     Stop background monitoring service"
        echo "  status   Show service status"
        echo "  logs     Show recent logs"
        echo "  config   Edit configuration"
        echo "  once     Run one-time issue check"
        echo "  test     Test dependencies"
        echo ""
        echo "Examples:"
        echo "  cursor-agent-controller start"
        echo "  cursor-agent-controller logs | tail -20"
        echo "  cursor-agent-controller once"
        ;;
esac
EOF

    chmod +x "$HOME/.local/bin/cursor-agent-controller"

    # Create a shorter alias
    ln -sf "$HOME/.local/bin/cursor-agent-controller" "$HOME/.local/bin/cursor-agent" 2>/dev/null

    # Ensure .local/bin is in PATH
    local path_added=false
    for rc_file in ~/.bashrc ~/.zshrc; do
        if [[ -f "$rc_file" ]] && ! grep -q "\$HOME/.local/bin" "$rc_file"; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc_file"
            path_added=true
        fi
    done

    if $path_added; then
        export PATH="$HOME/.local/bin:$PATH"
        log "${GREEN}✅ Added ~/.local/bin to PATH${NC}"
    fi

    log "${GREEN}✅ Wrapper scripts created${NC}"
}

setup_git_hooks() {
    log "${BLUE}🔗 Setting up Git hooks for quality checks...${NC}"

    local hooks_dir=".git/hooks"

    if [[ ! -d "$hooks_dir" ]]; then
        log "${YELLOW}⚠️  Not in a git repository, skipping git hooks${NC}"
        return 0
    fi

    # Pre-commit hook for automated changes
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook for cursor-agent automation

# Check if this is an automated commit
if git log -1 --pretty=%B | grep -q "Automated fix by Cursor Agent"; then
    echo "🤖 Cursor Agent commit detected - running quality checks..."

    # Run type checking if available
    if [[ -f "package.json" ]] && grep -q '"type-check"' package.json; then
        echo "  🔍 Running type check..."
        if ! npm run type-check --silent; then
            echo "❌ Type check failed"
            exit 1
        fi
    fi

    # Run linting if available
    if [[ -f "package.json" ]] && grep -q '"lint"' package.json; then
        echo "  🧹 Running linter..."
        if ! npm run lint --silent; then
            echo "❌ Linting failed"
            exit 1
        fi
    fi

    # Run tests if available
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        echo "  🧪 Running tests..."
        if ! npm test -- --passWithNoTests --silent; then
            echo "❌ Tests failed"
            exit 1
        fi
    fi

    echo "✅ All quality checks passed"
fi
EOF

    chmod +x "$hooks_dir/pre-commit"
    log "${GREEN}✅ Git hooks configured${NC}"
}

test_setup() {
    log "${BLUE}🧪 Testing setup...${NC}"

    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local monitor_script="$script_dir/cursor-agent-monitor.sh"

    # Test dependencies
    if ! "$monitor_script" --check-deps; then
        log "${RED}❌ Dependency check failed${NC}"
        return 1
    fi

    # Test configuration
    if [[ ! -f "$HOME/.cursor-agent-config.json" ]]; then
        log "${RED}❌ Configuration file not found${NC}"
        return 1
    fi

    # Test wrapper script
    if ! command -v cursor-agent-controller &> /dev/null; then
        log "${RED}❌ Controller script not in PATH${NC}"
        return 1
    fi

    log "${GREEN}✅ Setup test passed${NC}"
    return 0
}

main() {
    case "${1:-}" in
        "--help"|"-h")
            cat << 'EOF'
Cursor Agent Setup - Automated Issue Processing Setup

Usage: cursor-agent-setup.sh [OPTIONS]

Options:
  --help, -h      Show this help message
  --test          Test the setup
  --uninstall     Remove all components

This script will:
1. Install Cursor CLI
2. Setup GitHub CLI authentication
3. Install jq for JSON processing
4. Create background monitoring service
5. Setup configuration files
6. Create wrapper scripts
7. Configure git hooks

EOF
            exit 0
            ;;
        "--test")
            test_setup
            exit $?
            ;;
        "--uninstall")
            log "${YELLOW}🗑️  Uninstalling Cursor Agent automation...${NC}"

            # Stop services
            if [[ "$OSTYPE" == "darwin"* ]]; then
                launchctl unload ~/Library/LaunchAgents/com.cursor.agent.monitor.plist 2>/dev/null || true
                rm -f ~/Library/LaunchAgents/com.cursor.agent.monitor.plist
            else
                systemctl --user stop cursor-agent-monitor 2>/dev/null || true
                rm -f ~/.config/systemd/user/cursor-agent-monitor.service
                systemctl --user daemon-reload 2>/dev/null || true
            fi

            # Remove files
            rm -f ~/.cursor-agent-config.json
            rm -f ~/.cursor-agent-monitor.log
            rm -f ~/.local/bin/cursor-agent-controller
            rm -f ~/.local/bin/cursor-agent
            rm -f /tmp/cursor-agent-*.lock

            log "${GREEN}✅ Uninstall complete${NC}"
            exit 0
            ;;
    esac

    log "${BLUE}🚀 Cursor Agent Automation Setup${NC}"

    # Check if we're in a git repository
    if [[ ! -d ".git" ]]; then
        log "${RED}❌ Please run this from the root of your git repository${NC}"
        exit 1
    fi

    # Install dependencies
    log "${BLUE}📦 Installing dependencies...${NC}"
    install_cursor_cli
    setup_github_cli
    check_jq

    # Create configuration
    create_config_files

    # Setup service based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        create_launchd_service
    else
        create_systemd_service
    fi

    # Setup additional components
    create_wrapper_scripts
    setup_git_hooks

    # Test the setup
    if test_setup; then
        log "${GREEN}🎉 Setup completed successfully!${NC}"
        log ""
        log "${BLUE}📋 Next steps:${NC}"
        log "  1. Start monitoring: ${GREEN}cursor-agent start${NC}"
        log "  2. Check status: ${GREEN}cursor-agent status${NC}"
        log "  3. View logs: ${GREEN}cursor-agent logs${NC}"
        log "  4. Edit config: ${GREEN}cursor-agent config${NC}"
        log "  5. Test once: ${GREEN}cursor-agent once${NC}"
        log ""
        log "${YELLOW}💡 The system will automatically:${NC}"
        log "  - Monitor GitHub issues every 5 minutes"
        log "  - Process suitable issues with Cursor Agent"
        log "  - Create PRs with automated fixes"
        log "  - Run quality checks before committing"
        log ""
        log "${BLUE}🔧 Configuration file: ${GREEN}~/.cursor-agent-config.json${NC}"
        log "${BLUE}📝 Log file: ${GREEN}~/.cursor-agent-monitor.log${NC}"
    else
        log "${RED}❌ Setup test failed. Please check the errors above.${NC}"
        exit 1
    fi
}

main "$@"