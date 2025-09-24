# Efficient PR Workflow - Usage Examples

## Overview

The efficient PR workflow script automates the process of converting GitHub issues into pull requests using ChatGPT Codex. It's designed to be:

- ✅ **Efficient**: Processes issues in batches instead of one-by-one
- ✅ **Resilient**: Handles errors gracefully and continues processing
- ✅ **Trackable**: Provides detailed reporting on success/failure rates
- ✅ **Flexible**: Configurable filters and batch sizes

## Prerequisites

1. **Environment Setup**:
   ```bash
   export GOOGLE_API_KEY="your_gemini_api_key"
   export BROWSERBASE_API_KEY="your_browserbase_key" # optional
   ```

2. **ChatGPT Account**: You must be logged into ChatGPT/OpenAI in your browser
3. **Node.js Dependencies**: Ensure `@browserbasehq/stagehand` and `zod` are installed

## Basic Usage

### 1. Process Critical Issues Only
```typescript
import { runEfficientWorkflow } from './efficient-pr-workflow';

// Process only critical and high priority bugs
const stats = await runEfficientWorkflow({
  maxIssues: 5,
  priorityFilter: ['critical', 'high'],
  categoryFilter: ['bug'],
  batchSize: 2
});

console.log(`Success rate: ${(stats.successful / stats.total * 100).toFixed(1)}%`);
```

### 2. UI Enhancement Sprint
```typescript
// Focus on UI improvements for a design sprint
const stats = await runEfficientWorkflow({
  maxIssues: 8,
  priorityFilter: ['medium', 'low'],
  categoryFilter: ['ui'],
  batchSize: 3
});
```

### 3. Mixed Priority Processing
```typescript
// Process a balanced mix of issues
const stats = await runEfficientWorkflow({
  maxIssues: 12,
  priorityFilter: ['critical', 'high', 'medium'],
  categoryFilter: ['bug', 'enhancement', 'ui'],
  batchSize: 4
});
```

## Command Line Usage

### Quick Start
```bash
# Install dependencies
npm install @browserbasehq/stagehand zod

# Set API key
export GOOGLE_API_KEY="your_key_here"

# Run with TypeScript
npx ts-node scripts/efficient-pr-workflow.ts

# Or compile and run
npx tsc scripts/efficient-pr-workflow.ts
node scripts/efficient-pr-workflow.js
```

### Custom Configuration
```bash
# Create a custom runner script
cat > run-pr-workflow.js << 'EOF'
const { runEfficientWorkflow } = require('./efficient-pr-workflow');

runEfficientWorkflow({
  maxIssues: 6,
  priorityFilter: ['critical', 'high'],
  batchSize: 2
}).then(stats => {
  console.log('✅ Completed:', stats.successful, 'successful PRs');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
EOF

node run-pr-workflow.js
```

## Authentication Flow

The script handles ChatGPT authentication gracefully:

1. **Automatic Detection**: Checks if you're already logged in
2. **Manual Login Prompt**: If login needed, provides clear instructions
3. **Wait for Authentication**: Polls every 5 seconds until login complete
4. **Verification**: Confirms access to Codex interface before proceeding

### Expected Flow:
```
🔐 Navigating to ChatGPT/Codex...
🔑 Login required - please complete authentication manually
📋 Steps:
  1. The browser should be open to https://chatgpt.com/codex
  2. Click "Log in" and complete authentication
  3. Navigate back to the Codex interface
  4. Press Enter here to continue...
⏳ Waiting for authentication... (checking every 5 seconds)
✅ Authentication successful!
```

## Sample Output Report

```
🎯 **GitHub Issues to PR Workflow Report**
==========================================

📊 **Summary:**
- Total Issues: 8
- Successful PRs: 6
- Failed: 2
- Success Rate: 75.0%
- Total Duration: 145.3s
- Average per Issue: 18.2s

📈 **Results by Priority:**
- critical: 2/2
- high: 3/4
- medium: 1/2
- low: 0/0

🔗 **Created PRs:**
- Issue #63: https://github.com/user/repo/pull/123
- Issue #4: https://github.com/user/repo/pull/124
- Issue #47: https://github.com/user/repo/pull/125
- Issue #46: https://github.com/user/repo/pull/126
- Issue #45: https://github.com/user/repo/pull/127
- Issue #64: https://github.com/user/repo/pull/128

❌ **Failed Issues:**
- Issue #42: Task submission timeout
- Issue #62: PR creation failed
```

## Advanced Configuration

### Custom Issue List
```typescript
import { EfficientPRWorkflow, GitHubIssue } from './efficient-pr-workflow';

const customIssues: GitHubIssue[] = [
  { id: 100, title: "Custom feature request", labels: ["feature"], priority: "high", category: "enhancement" },
  { id: 101, title: "Security vulnerability", labels: ["security"], priority: "critical", category: "bug" }
];

// Override the default issue list
const workflow = new EfficientPRWorkflow();
// ... customize workflow.GITHUB_ISSUES = customIssues
```

### Error Handling
```typescript
try {
  const stats = await runEfficientWorkflow({
    maxIssues: 10,
    batchSize: 3
  });

  if (stats.failed > 0) {
    console.warn(`⚠️ ${stats.failed} issues failed to process`);
    // Handle partial failures
  }

} catch (error) {
  if (error.message.includes('Login timeout')) {
    console.error('🔐 Authentication required - please log into ChatGPT');
  } else if (error.message.includes('Stagehand')) {
    console.error('🌐 Browser automation failed - check network connection');
  } else {
    console.error('💥 Unexpected error:', error);
  }
}
```

## Performance Optimization

### Batch Size Guidelines
- **Small batches (2-3)**: More reliable, better error isolation
- **Medium batches (4-6)**: Good balance of speed and reliability
- **Large batches (7+)**: Faster but higher failure risk

### Rate Limiting
The script includes built-in delays:
- 2 seconds between task submissions
- 3 seconds between PR creation attempts
- 3 seconds between batches
- 1 second for UI navigation

### Monitoring Progress
```typescript
import { EfficientPRWorkflow } from './efficient-pr-workflow';

const workflow = new EfficientPRWorkflow();

// Add custom logging
workflow.onTaskComplete = (issue, success) => {
  console.log(`${success ? '✅' : '❌'} Issue #${issue.id}: ${issue.title}`);
};

// Or monitor via the stats object
const stats = await workflow.processIssues({ maxIssues: 5 });
console.log(`Progress: ${workflow.stats.results.length}/${workflow.stats.total}`);
```

## Troubleshooting

### Common Issues

1. **Login Loop**:
   - Clear ChatGPT cookies and re-authenticate
   - Check if ChatGPT Plus subscription is active

2. **Task Submission Fails**:
   - Verify Codex interface is accessible
   - Check for UI changes in ChatGPT

3. **PR Creation Fails**:
   - Ensure GitHub integration is set up in ChatGPT
   - Verify repository permissions

4. **Timeout Errors**:
   - Increase batch delays for slower connections
   - Reduce batch size for more reliability

### Debug Mode
```bash
# Enable verbose logging
STAGEHAND_VERBOSE=1 node scripts/efficient-pr-workflow.js

# Or modify the config
const stagehandConfig = {
  verbose: 2,  // Increase verbosity
  // ...other options
};
```

## Integration with Bob Project

This workflow is specifically designed for the Bob dashboard project issues. The predefined issue list includes:

- **Critical bugs**: Database errors, chat functionality failures
- **High priority**: UI/UX blocking issues, navigation problems
- **Medium priority**: Enhancement requests, visual improvements
- **Low priority**: Design polish, aesthetic improvements

You can customize the priority and category filters based on your current development sprint needs.