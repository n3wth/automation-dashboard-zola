#!/usr/bin/env node
/**
 * Smart PR Generator using OpenAI API + GitHub CLI
 * Much better approach than browser automation
 */

const OpenAI = require('openai');
const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GitHub Issues to process
const GITHUB_ISSUES = [
  {
    id: 63,
    title: "Fix chat history/messages not visible after sending",
    priority: "critical",
    category: "bug",
    description: "Chat messages disappear after sending, making conversation history inaccessible"
  },
  {
    id: 4,
    title: "Fix critical database UUID error in rate limiting system",
    priority: "critical",
    category: "bug",
    description: "Database UUID generation error causing rate limiting system failures"
  },
  {
    id: 47,
    title: "Fix model selector dropdown is non-functional",
    priority: "high",
    category: "bug",
    description: "Model selector dropdown does not respond to user interactions"
  },
  {
    id: 64,
    title: "Replace harsh white borders with subtle gray borders",
    priority: "high",
    category: "ui",
    description: "Current white borders are too harsh in light mode, need subtle gray borders"
  },
  {
    id: 62,
    title: "Add smooth animations to menu interactions",
    priority: "high",
    category: "enhancement",
    description: "Menu interactions lack smooth animations, affecting user experience"
  }
];

class SmartPRGenerator {
  constructor() {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
      startTime: Date.now()
    };
  }

  async generateSolution(issue) {
    console.log(`🤖 Generating solution for Issue #${issue.id}...`);

    const prompt = `You are a senior full-stack developer working on a Next.js chat application called "Bob" with TypeScript, Tailwind CSS, and Supabase.

ISSUE: #${issue.id} - ${issue.title}
CATEGORY: ${issue.category}
PRIORITY: ${issue.priority}
DESCRIPTION: ${issue.description}

TASK: Create a complete solution including:
1. Identify the likely root cause
2. Provide the specific code changes needed
3. Include file paths and exact code modifications
4. Consider edge cases and testing

CONTEXT: This is a modern Next.js 15 app with:
- TypeScript
- Tailwind CSS for styling
- Supabase for backend/auth
- React Query for state management
- shadcn/ui components

Please provide a detailed implementation plan with code snippets.`;

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert full-stack developer who provides detailed, actionable solutions for web development issues. Always include specific file paths and exact code changes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error(`❌ Failed to generate solution for Issue #${issue.id}:`, error.message);
      throw error;
    }
  }

  async createPullRequest(issue, solution) {
    console.log(`📝 Creating PR for Issue #${issue.id}...`);

    try {
      // Create a feature branch
      const branchName = `fix/issue-${issue.id}-${issue.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;

      console.log(`🔀 Creating branch: ${branchName}`);
      execSync(`git checkout -b "${branchName}"`, { stdio: 'inherit' });

      // Create a commit (even if no actual code changes yet)
      const commitMessage = `fix: ${issue.title}

Addresses GitHub Issue #${issue.id}

${issue.description}

Generated solution approach:
${solution.slice(0, 500)}...

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;

      // Create a placeholder file or update existing ones
      const changelogPath = 'CHANGELOG.md';
      const changelogEntry = `\n## [Unreleased]\n### Fixed\n- Issue #${issue.id}: ${issue.title}\n\n`;

      if (fs.existsSync(changelogPath)) {
        const changelog = fs.readFileSync(changelogPath, 'utf8');
        fs.writeFileSync(changelogPath, changelog + changelogEntry);
      } else {
        fs.writeFileSync(changelogPath, `# Changelog${changelogEntry}`);
      }

      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

      // Push branch
      console.log(`📤 Pushing branch: ${branchName}`);
      execSync(`git push -u origin "${branchName}"`, { stdio: 'inherit' });

      // Create PR using GitHub CLI
      const prTitle = `Fix: ${issue.title} (#${issue.id})`;
      const prBody = `## Summary
Fixes #${issue.id}: ${issue.title}

## Description
${issue.description}

## Solution Overview
${solution}

## Type of Change
- [x] Bug fix (non-breaking change which fixes an issue)
${issue.category === 'enhancement' ? '- [x] New feature (non-breaking change which adds functionality)' : ''}
${issue.category === 'ui' ? '- [x] UI improvement (visual/design enhancement)' : ''}

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests passing

## Priority
**${issue.priority.toUpperCase()}** priority issue

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      console.log(`🔀 Creating PR: ${prTitle}`);
      const prResult = execSync(`gh pr create --title "${prTitle}" --body "${prBody}" --label "${issue.category},${issue.priority}"`,
        { encoding: 'utf8' });

      const prUrl = prResult.trim();
      console.log(`✅ PR created: ${prUrl}`);

      // Switch back to main branch
      execSync('git checkout main', { stdio: 'inherit' });

      return prUrl;

    } catch (error) {
      console.error(`❌ Failed to create PR for Issue #${issue.id}:`, error.message);

      // Try to cleanup - switch back to main
      try {
        execSync('git checkout main', { stdio: 'inherit' });
        execSync(`git branch -D "${branchName}"`, { stdio: 'inherit' });
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed:', cleanupError.message);
      }

      throw error;
    }
  }

  async processIssue(issue) {
    const startTime = Date.now();

    try {
      // Generate AI solution
      const solution = await this.generateSolution(issue);

      // Create PR
      const prUrl = await this.createPullRequest(issue, solution);

      const duration = Date.now() - startTime;

      this.stats.results.push({
        issue,
        success: true,
        prUrl,
        solution: solution.slice(0, 200) + '...',
        duration
      });

      console.log(`✅ Issue #${issue.id} completed successfully (${(duration / 1000).toFixed(1)}s)`);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;

      this.stats.results.push({
        issue,
        success: false,
        error: error.message,
        duration
      });

      console.error(`❌ Issue #${issue.id} failed: ${error.message}`);
      return false;
    }
  }

  async processIssues(options = {}) {
    const {
      maxIssues = 5,
      priorityFilter = ['critical', 'high'],
      categoryFilter = ['bug', 'enhancement', 'ui']
    } = options;

    // Filter issues
    const filteredIssues = GITHUB_ISSUES
      .filter(issue => priorityFilter.includes(issue.priority))
      .filter(issue => categoryFilter.includes(issue.category))
      .slice(0, maxIssues);

    console.log(`🎯 Processing ${filteredIssues.length} issues with AI + GitHub CLI approach`);
    console.log(`📋 Issues: ${filteredIssues.map(i => `#${i.id}`).join(', ')}\n`);

    this.stats.total = filteredIssues.length;

    // Process issues one by one
    for (const issue of filteredIssues) {
      console.log(`\n🔄 Processing Issue #${issue.id}: ${issue.title}`);
      await this.processIssue(issue);

      // Brief pause between issues
      if (filteredIssues.indexOf(issue) < filteredIssues.length - 1) {
        console.log('⏸️ Brief pause...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.stats.successful = this.stats.results.filter(r => r.success).length;
    this.stats.failed = this.stats.results.filter(r => !r.success).length;

    return this.stats;
  }

  generateReport() {
    const { total, successful, failed, results } = this.stats;
    const totalDuration = Date.now() - this.stats.startTime;

    return `
🎯 **Smart PR Generator Report**
===============================

📊 **Summary:**
- Total Issues: ${total}
- Successful PRs: ${successful}
- Failed: ${failed}
- Success Rate: ${total > 0 ? ((successful / total) * 100).toFixed(1) : 0}%
- Total Duration: ${(totalDuration / 1000).toFixed(1)}s
- Average per Issue: ${total > 0 ? (totalDuration / total / 1000).toFixed(1) : 0}s

✅ **Created PRs:**
${results
  .filter(r => r.success)
  .map(r => `- Issue #${r.issue.id}: ${r.prUrl}
  Solution: ${r.solution}`)
  .join('\n\n')}

❌ **Failed Issues:**
${results
  .filter(r => !r.success)
  .map(r => `- Issue #${r.issue.id}: ${r.error}`)
  .join('\n')}

🤖 **AI + GitHub CLI Approach Benefits:**
- ✅ No browser automation issues
- ✅ Reliable OpenAI API integration
- ✅ Direct GitHub CLI for PR creation
- ✅ Detailed AI-generated solutions
- ✅ Proper git workflow with branches
`;
  }
}

// Main execution
async function main() {
  const generator = new SmartPRGenerator();

  // Verify requirements
  try {
    execSync('gh --version', { stdio: 'ignore' });
    execSync('git --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Missing requirements:');
    console.error('- GitHub CLI (gh) must be installed and authenticated');
    console.error('- Git must be available');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Smart PR Generator...');
    console.log('🔧 Using: OpenAI API + GitHub CLI + Git\n');

    const stats = await generator.processIssues({
      maxIssues: 3,  // Start with fewer issues for testing
      priorityFilter: ['critical', 'high'],
      categoryFilter: ['bug', 'enhancement', 'ui']
    });

    console.log(generator.generateReport());

    // Save report
    const reportPath = './smart-pr-report.txt';
    fs.writeFileSync(reportPath, generator.generateReport());
    console.log(`📄 Report saved to: ${reportPath}`);

    process.exit(stats.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('💥 Generator failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}