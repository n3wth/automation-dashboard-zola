#!/bin/bash
# cursor-headless-test.sh - Test headless mode functionality

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

test_headless_mode() {
    log "${BLUE}🤖 Testing Cursor CLI headless mode...${NC}"

    # Simple test prompt
    local test_prompt="Create a simple hello world function in JavaScript and save it to hello.js"

    # Test different output formats
    local formats=("text" "json")

    for format in "${formats[@]}"; do
        log "${BLUE}📝 Testing output format: $format${NC}"

        # Create temporary directory for test
        local test_dir="/tmp/cursor-headless-test-$$"
        mkdir -p "$test_dir"
        cd "$test_dir"

        # Run cursor-agent in headless mode
        local cmd=(cursor-agent chat "$test_prompt" --headless --output-format "$format")

        if timeout 60 "${cmd[@]}" > "output-$format.log" 2>&1; then
            log "${GREEN}✅ Headless mode with $format output working${NC}"

            # Check if files were created
            if [[ -f "hello.js" ]]; then
                log "${GREEN}✅ File creation working${NC}"
                cat hello.js
            else
                log "${YELLOW}⚠️  No file created, but command succeeded${NC}"
            fi

            # Show output
            log "${BLUE}📄 Output preview:${NC}"
            head -10 "output-$format.log"
        else
            log "${RED}❌ Headless mode with $format failed${NC}"
            if [[ -f "output-$format.log" ]]; then
                log "${RED}Error output:${NC}"
                cat "output-$format.log"
            fi
        fi

        # Clean up
        cd - > /dev/null
        rm -rf "$test_dir"
        echo
    done
}

test_automation_flags() {
    log "${BLUE}⚙️  Testing automation-friendly flags...${NC}"

    # Test available flags
    local flags_to_test=(
        "--help"
        "--version"
    )

    for flag in "${flags_to_test[@]}"; do
        if cursor-agent $flag > /dev/null 2>&1; then
            log "${GREEN}✅ Flag $flag supported${NC}"
        else
            log "${YELLOW}⚠️  Flag $flag not supported or failed${NC}"
        fi
    done
}

test_environment_variables() {
    log "${BLUE}🔧 Testing environment variable configuration...${NC}"

    # Test with environment variables
    export CURSOR_HEADLESS=true
    export CURSOR_OUTPUT_FORMAT=text
    export CURSOR_AUTO_APPROVE=false

    log "${GREEN}✅ Environment variables set:${NC}"
    log "  CURSOR_HEADLESS=$CURSOR_HEADLESS"
    log "  CURSOR_OUTPUT_FORMAT=$CURSOR_OUTPUT_FORMAT"
    log "  CURSOR_AUTO_APPROVE=$CURSOR_AUTO_APPROVE"
}

test_security_considerations() {
    log "${BLUE}🛡️  Security considerations for headless mode...${NC}"

    log "${YELLOW}⚠️  Important security notes:${NC}"
    log "  1. Headless mode can execute commands without user interaction"
    log "  2. Only run in trusted environments and repositories"
    log "  3. Review prompts carefully before automation"
    log "  4. Consider using --force flag only in controlled environments"
    log "  5. Monitor logs for unexpected behavior"
    log "  6. Set appropriate file permissions on logs and config"

    # Check current permissions
    local config_files=(
        "$HOME/.cursor-agent-config.json"
        "$HOME/.cursor-agent-config.yaml"
        "$HOME/.cursor-agent-monitor.log"
    )

    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            local perms=$(ls -la "$file" | cut -d' ' -f1)
            log "${BLUE}📁 $file: $perms${NC}"
        fi
    done
}

create_headless_examples() {
    log "${BLUE}📚 Creating headless usage examples...${NC}"

    cat > "headless-examples.md" << 'EOF'
# Cursor CLI Headless Mode Examples

## Basic Headless Usage

```bash
# Simple headless command
cursor-agent chat "fix typo in README.md" --headless --output-format text

# With timeout and logging
timeout 300 cursor-agent chat "add unit tests" --headless --output-format json > agent.log 2>&1

# Environment variable approach
export CURSOR_HEADLESS=true
export CURSOR_OUTPUT_FORMAT=text
cursor-agent chat "refactor function for better readability"
```

## Automation Integration

```bash
# GitHub Actions workflow step
- name: Fix Issues with Cursor Agent
  run: |
    cursor-agent chat "Fix issue #${{ github.event.issue.number }}" \
      --headless \
      --output-format json \
      --timeout 1800

# Cron job example
0 */6 * * * cd /path/to/repo && cursor-agent chat "check for code improvements" --headless --output-format text >> ~/.cursor-cron.log 2>&1
```

## Safety Configuration

```bash
# Conservative mode (requires manual approval for commands)
cursor-agent chat "update dependencies" --headless --output-format text --no-auto-approve

# Fully automated mode (use with extreme caution)
cursor-agent chat "fix linting errors" --headless --output-format text --force
```

## Output Formats

1. **text**: Human-readable output, good for logging
2. **json**: Structured output, good for parsing
3. **stream-json**: Streaming JSON for real-time processing

## Best Practices

1. Always use timeouts in automation
2. Log all output for debugging
3. Test prompts manually before automating
4. Use version control for safety
5. Monitor resource usage
6. Set up alerts for failures
EOF

    log "${GREEN}✅ Created headless-examples.md${NC}"
}

main() {
    log "${BLUE}🚀 Cursor CLI Headless Mode Test Suite${NC}"

    # Check if cursor-agent is available
    if ! command -v cursor-agent &> /dev/null; then
        log "${RED}❌ cursor-agent not found. Please install Cursor CLI first.${NC}"
        log "${BLUE}💡 Install with: curl https://cursor.com/install -fsS | bash${NC}"
        exit 1
    fi

    # Run tests
    test_automation_flags
    test_environment_variables
    test_security_considerations
    create_headless_examples

    # Only run full headless test if explicitly requested
    if [[ "${1:-}" == "--full-test" ]]; then
        log "${YELLOW}⚠️  Running full headless test (will execute cursor-agent)${NC}"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            test_headless_mode
        fi
    else
        log "${BLUE}💡 Run with --full-test to execute actual cursor-agent commands${NC}"
    fi

    log "${GREEN}🎉 Headless mode test complete!${NC}"
    log "${BLUE}📋 Key points:${NC}"
    log "  - Use --headless flag for non-interactive mode"
    log "  - Use --output-format text|json for structured output"
    log "  - Set CURSOR_HEADLESS=true environment variable"
    log "  - Always use timeouts in automation"
    log "  - Monitor logs for security and debugging"
}

main "$@"