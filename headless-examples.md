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
