#!/usr/bin/env node
/**
 * Production PR Workflow Runner
 * Converts GitHub issues to pull requests via ChatGPT Codex
 */

const { Stagehand } = require('@browserbasehq/stagehand');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  stagehand: {
    env: 'BROWSERBASE',
    verbose: 1,
    modelName: 'google/gemini-2.5-flash-preview-05-20',
    disablePino: true,
    modelClientOptions: {
      apiKey: process.env.GOOGLE_API_KEY,
    },
  },
  workflow: {
    maxIssues: 5,
    priorityFilter: ['critical', 'high'],
    categoryFilter: ['bug', 'enhancement'],
    batchSize: 2,
    delayBetweenTasks: 2000,
    delayBetweenBatches: 3000,
  }
};

// GitHub Issues (from your project)
const GITHUB_ISSUES = [
  { id: 63, title: "Fix chat history/messages not visible after sending", priority: "critical", category: "bug" },
  { id: 4, title: "Fix critical database UUID error in rate limiting system", priority: "critical", category: "bug" },
  { id: 47, title: "Fix model selector dropdown is non-functional", priority: "high", category: "bug" },
  { id: 46, title: "Fix chat input auto-populates with predefined prompts", priority: "high", category: "bug" },
  { id: 45, title: "Fix keyboard navigation causes unexpected redirect", priority: "high", category: "bug" },
  { id: 64, title: "Replace harsh white borders with subtle gray borders", priority: "high", category: "enhancement" },
  { id: 62, title: "Add smooth animations to menu interactions", priority: "high", category: "enhancement" },
  { id: 61, title: "Default to dark mode and move theme toggle to settings", priority: "high", category: "enhancement" },
];

class ProductionPRWorkflow {
  constructor() {
    this.stagehand = null;
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
      startTime: Date.now()
    };
  }

  async initialize() {
    console.log('🚀 Initializing production PR workflow...');

    this.stagehand = new Stagehand(CONFIG.stagehand);
    await this.stagehand.init();

    console.log('🌐 Navigating to ChatGPT/Codex...');
    await this.stagehand.page.goto('https://chatgpt.com/codex', {
      waitUntil: 'domcontentloaded'
    });

    // Check if login is needed
    const needsLogin = await this.checkLoginRequired();

    if (needsLogin) {
      console.log('🔐 Please complete login manually in the browser');
      console.log('📋 After logging in, press Enter to continue...');

      // Wait for manual login confirmation
      await this.waitForUserInput();
    }

    console.log('✅ Initialization complete!');
  }

  async checkLoginRequired() {
    try {
      const isLoggedIn = await this.stagehand.page.evaluate(() => {
        // Look for Codex interface elements
        return !!(
          document.querySelector('input[placeholder*="task"]') ||
          document.querySelector('textarea[placeholder*="task"]') ||
          document.querySelector('.task-input') ||
          document.querySelector('button:contains("Submit")')
        );
      });

      return !isLoggedIn;
    } catch {
      return true;
    }
  }

  async waitForUserInput() {
    // Simple polling approach - check every 5 seconds for Codex interface
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes

    while (attempts < maxAttempts) {
      await this.stagehand.page.waitForTimeout(5000);

      const isReady = await this.checkLoginRequired();
      if (!isReady) {
        console.log('✅ Login detected, continuing...');
        return;
      }

      attempts++;
      console.log(`⏳ Waiting for login... (${attempts}/${maxAttempts})`);
    }

    throw new Error('Login timeout - please ensure you are logged in');
  }

  async processIssues() {
    const { maxIssues, priorityFilter, categoryFilter, batchSize } = CONFIG.workflow;

    // Filter issues
    const filteredIssues = GITHUB_ISSUES
      .filter(issue => priorityFilter.includes(issue.priority))
      .filter(issue => categoryFilter.includes(issue.category))
      .slice(0, maxIssues);

    console.log(`🎯 Processing ${filteredIssues.length} issues in batches of ${batchSize}`);

    this.stats.total = filteredIssues.length;

    // Process in batches
    for (let i = 0; i < filteredIssues.length; i += batchSize) {
      const batch = filteredIssues.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      console.log(`\n📦 Batch ${batchNum}: Processing issues ${batch.map(b => '#' + b.id).join(', ')}`);

      for (const issue of batch) {
        await this.processIssue(issue);

        // Delay between tasks
        if (CONFIG.workflow.delayBetweenTasks) {
          await this.stagehand.page.waitForTimeout(CONFIG.workflow.delayBetweenTasks);
        }
      }

      // Delay between batches
      if (i + batchSize < filteredIssues.length && CONFIG.workflow.delayBetweenBatches) {
        console.log('⏸️ Pausing between batches...');
        await this.stagehand.page.waitForTimeout(CONFIG.workflow.delayBetweenBatches);
      }
    }

    this.stats.successful = this.stats.results.filter(r => r.success).length;
    this.stats.failed = this.stats.results.filter(r => !r.success).length;

    return this.stats;
  }

  async processIssue(issue) {
    const startTime = Date.now();

    try {
      console.log(`📤 Processing Issue #${issue.id}: ${issue.title}`);

      // Submit task
      const taskDescription = `GitHub Issue #${issue.id}: ${issue.title}`;

      await this.stagehand.page.act('click the task input field or describe a task field');
      await this.stagehand.page.act(`type "${taskDescription}" into the input field`);
      await this.stagehand.page.act('click the submit button or arrow button');

      // Wait for processing
      await this.stagehand.page.waitForTimeout(3000);

      // Try to create PR
      await this.stagehand.page.act(`click the task containing "Issue #${issue.id}" or the latest task`);
      await this.stagehand.page.act('click the Create PR button');

      // Wait for PR creation
      await this.stagehand.page.waitForTimeout(5000);

      // Go back to task list
      await this.stagehand.page.act('click the back button or return to tasks');

      const duration = Date.now() - startTime;

      this.stats.results.push({
        issue,
        success: true,
        duration
      });

      console.log(`✅ Issue #${issue.id} processed successfully (${(duration / 1000).toFixed(1)}s)`);

    } catch (error) {
      const duration = Date.now() - startTime;

      this.stats.results.push({
        issue,
        success: false,
        error: error.message,
        duration
      });

      console.error(`❌ Issue #${issue.id} failed: ${error.message}`);
    }
  }

  generateReport() {
    const { total, successful, failed, results } = this.stats;
    const totalDuration = Date.now() - this.stats.startTime;

    return `
🎯 **Production PR Workflow Report**
===================================

📊 **Summary:**
- Total Issues: ${total}
- Successful: ${successful}
- Failed: ${failed}
- Success Rate: ${total > 0 ? ((successful / total) * 100).toFixed(1) : 0}%
- Total Duration: ${(totalDuration / 1000).toFixed(1)}s
- Average per Issue: ${total > 0 ? (totalDuration / total / 1000).toFixed(1) : 0}s

✅ **Successful Issues:**
${results
  .filter(r => r.success)
  .map(r => `- Issue #${r.issue.id}: ${r.issue.title} (${(r.duration / 1000).toFixed(1)}s)`)
  .join('\n')}

❌ **Failed Issues:**
${results
  .filter(r => !r.success)
  .map(r => `- Issue #${r.issue.id}: ${r.error}`)
  .join('\n')}
`;
  }

  async cleanup() {
    if (this.stagehand) {
      console.log('🧹 Cleaning up...');
      try {
        await this.stagehand.close();
      } catch (error) {
        console.warn('⚠️ Cleanup warning:', error.message);
      }
    }
  }
}

// Main execution
async function main() {
  const workflow = new ProductionPRWorkflow();

  try {
    await workflow.initialize();
    const stats = await workflow.processIssues();

    console.log(workflow.generateReport());

    // Save report
    const reportPath = path.join(__dirname, 'pr-workflow-report.txt');
    fs.writeFileSync(reportPath, workflow.generateReport());
    console.log(`📄 Report saved to: ${reportPath}`);

    process.exit(stats.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('💥 Workflow failed:', error.message);
    process.exit(1);

  } finally {
    await workflow.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  console.log('🎬 Starting Production PR Workflow...');
  main();
}