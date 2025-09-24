"use strict";
// Efficient GitHub Issues to PR Workflow
// Optimized version with error handling, batching, and result tracking
Object.defineProperty(exports, "__esModule", { value: true });
exports.EfficientPRWorkflow = void 0;
exports.runEfficientWorkflow = runEfficientWorkflow;
const stagehand_1 = require("@browserbasehq/stagehand");
const zod_1 = require("zod");
// Prioritized issue list from the original script
const GITHUB_ISSUES = [
    { id: 63, title: "Fix chat history/messages not visible after sending", labels: ["bug"], priority: "critical", category: "bug" },
    { id: 4, title: "Fix critical database UUID error in rate limiting system", labels: ["bug"], priority: "critical", category: "bug" },
    { id: 47, title: "Fix model selector dropdown is non-functional", labels: ["bug"], priority: "high", category: "bug" },
    { id: 46, title: "Fix chat input auto-populates with predefined prompts", labels: ["bug"], priority: "high", category: "bug" },
    { id: 45, title: "Fix keyboard navigation causes unexpected redirect", labels: ["bug"], priority: "high", category: "bug" },
    { id: 42, title: "Fix input field duplicates text with long messages", labels: ["bug"], priority: "high", category: "bug" },
    { id: 64, title: "Replace harsh white borders with subtle gray borders", labels: ["ui"], priority: "medium", category: "ui" },
    { id: 62, title: "Add smooth animations to menu interactions", labels: ["enhancement"], priority: "medium", category: "enhancement" },
    { id: 61, title: "Default to dark mode and move theme toggle to settings", labels: ["enhancement"], priority: "medium", category: "enhancement" },
    { id: 50, title: "Improve model selector visual hierarchy and clarity", labels: ["enhancement"], priority: "medium", category: "ui" },
    { id: 49, title: "Add keyboard navigation support for topic buttons", labels: ["enhancement"], priority: "medium", category: "enhancement" },
    { id: 48, title: "Improve file upload UX with drag-and-drop feedback", labels: ["enhancement"], priority: "medium", category: "enhancement" },
    { id: 29, title: "UI: Redesign category selection with modern card-based interface", labels: ["ui"], priority: "low", category: "ui" },
    { id: 28, title: "UI: Enhance input field with modern chat interface design", labels: ["ui"], priority: "low", category: "ui" },
    { id: 27, title: "UI: Improve header navigation with better logo and menu design", labels: ["ui"], priority: "low", category: "ui" },
    { id: 26, title: "UI: Add gradient backdrop and improve dark theme aesthetics", labels: ["ui"], priority: "low", category: "ui" },
    { id: 25, title: "UI: Improve empty state design with centered content", labels: ["ui"], priority: "low", category: "ui" },
];
// Stagehand configuration with error handling
const createStagehandConfig = () => ({
    env: 'BROWSERBASE',
    verbose: 1,
    modelName: 'google/gemini-2.5-flash-preview-05-20',
    disablePino: true,
    modelClientOptions: {
        apiKey: process.env.GOOGLE_API_KEY,
    },
    // Add timeout and retry configurations
});
class EfficientPRWorkflow {
    constructor() {
        this.stagehand = null;
        this.stats = {
            total: 0,
            successful: 0,
            failed: 0,
            results: [],
            totalDuration: 0
        };
    }
    async initialize() {
        console.log('🚀 Initializing Stagehand...');
        this.stagehand = new stagehand_1.Stagehand(createStagehandConfig());
        await this.stagehand.init();
        // Navigate to Codex and handle initial login
        await this.navigateToCodex();
        console.log('✅ Stagehand initialized and logged in');
    }
    async navigateToCodex() {
        if (!this.stagehand?.page)
            throw new Error('Stagehand not initialized');
        const page = this.stagehand.page;
        try {
            console.log('🔐 Navigating to ChatGPT/Codex...');
            await page.goto('https://chatgpt.com/codex', { waitUntil: 'domcontentloaded' });
            // Check if we need to log in
            const needsLogin = await this.checkIfLoginRequired();
            if (needsLogin) {
                console.log('🔑 Attempting automated login...');
                await this.performAutomatedLogin();
            }
            // Verify we can access Codex interface
            await this.verifyCodexAccess();
        }
        catch (error) {
            throw new Error(`Failed to navigate to Codex: ${error}`);
        }
    }
    async performAutomatedLogin() {
        if (!this.stagehand?.page)
            throw new Error('Stagehand not initialized');
        const page = this.stagehand.page;
        const email = process.env.CHATGPT_EMAIL;
        const password = process.env.CHATGPT_PASSWORD;
        const totpSecret = process.env.CHATGPT_TOTP_SECRET;
        if (!email || !password) {
            console.log('⚠️ No credentials found, falling back to manual login');
            await this.waitForManualLogin();
            return;
        }
        try {
            // Navigate to login page
            await page.goto('https://chatgpt.com/auth/login', { waitUntil: 'domcontentloaded' });
            // Fill in email
            console.log('📧 Entering email...');
            await page.act('click the email input field');
            await page.act(`type "${email}" into the email field`);
            // Click continue or next
            await page.act('click the continue button or next button');
            await page.waitForTimeout(2000);
            // Fill in password
            console.log('🔒 Entering password...');
            await page.act('click the password input field');
            await page.act(`type "${password}" into the password field`);
            // Submit login
            await page.act('click the login button or submit button');
            await page.waitForTimeout(3000);
            // Handle 2FA if required
            if (totpSecret) {
                const needs2FA = await this.check2FARequired();
                if (needs2FA) {
                    console.log('🔐 Handling 2FA...');
                    await this.handle2FA(totpSecret);
                }
            }
            // Navigate back to Codex
            await page.goto('https://chatgpt.com/codex', { waitUntil: 'domcontentloaded' });
            console.log('✅ Automated login successful!');
        }
        catch (error) {
            console.log('⚠️ Automated login failed, falling back to manual login');
            console.log('📋 Please complete login manually in the browser');
            await this.waitForManualLogin();
        }
    }
    async check2FARequired() {
        if (!this.stagehand?.page)
            return false;
        try {
            const has2FA = await this.stagehand.page.evaluate(() => {
                return !!(document.querySelector('input[placeholder*="code"]') ||
                    document.querySelector('input[type="text"][maxlength="6"]') ||
                    document.querySelector('[data-testid="verification-code"]') ||
                    document.querySelector('.verification-code'));
            });
            return has2FA;
        }
        catch {
            return false;
        }
    }
    async handle2FA(totpSecret) {
        if (!this.stagehand?.page)
            return;
        try {
            // Generate TOTP code
            const totp = this.generateTOTP(totpSecret);
            console.log('🔢 Generated 2FA code');
            // Enter 2FA code
            await this.stagehand.page.act('click the verification code input field');
            await this.stagehand.page.act(`type "${totp}" into the verification code field`);
            // Submit 2FA
            await this.stagehand.page.act('click the verify button or submit button');
            await this.stagehand.page.waitForTimeout(3000);
        }
        catch (error) {
            console.warn('⚠️ 2FA handling failed:', error);
            throw error;
        }
    }
    generateTOTP(secret) {
        // Simple TOTP implementation
        const crypto = require('crypto');
        // Convert base32 secret to buffer
        const key = this.base32Decode(secret);
        // Get current time step (30 second intervals)
        const timeStep = Math.floor(Date.now() / 30000);
        // Create HMAC
        const hmac = crypto.createHmac('sha1', key);
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeUInt32BE(timeStep, 4);
        hmac.update(timeBuffer);
        const digest = hmac.digest();
        const offset = digest[digest.length - 1] & 0xf;
        const code = (((digest[offset] & 0x7f) << 24) |
            ((digest[offset + 1] & 0xff) << 16) |
            ((digest[offset + 2] & 0xff) << 8) |
            (digest[offset + 3] & 0xff)) % 1000000;
        return code.toString().padStart(6, '0');
    }
    base32Decode(encoded) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = [];
        for (let i = 0; i < encoded.length; i++) {
            const char = encoded[i];
            if (char === '=')
                break;
            value = (value << 5) | alphabet.indexOf(char);
            bits += 5;
            if (bits >= 8) {
                output.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        return Buffer.from(output);
    }
    async checkIfLoginRequired() {
        if (!this.stagehand?.page)
            return true;
        try {
            // Look for login button or already authenticated state
            const loginButton = await this.stagehand.page.evaluate(() => {
                return document.querySelector('[data-testid="login-button"], button:contains("Log in"), .login-button');
            });
            return !!loginButton;
        }
        catch {
            // If we can't determine, assume login is needed
            return true;
        }
    }
    async waitForManualLogin() {
        // In a real implementation, you might:
        // 1. Wait for specific elements to appear
        // 2. Use readline for user input
        // 3. Implement a timeout
        console.log('⏳ Waiting for authentication... (checking every 5 seconds)');
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes total
        while (attempts < maxAttempts) {
            await this.stagehand.page.waitForTimeout(5000);
            const isLoggedIn = await this.verifyCodexAccess();
            if (isLoggedIn) {
                console.log('✅ Authentication successful!');
                return;
            }
            attempts++;
            console.log(`⏳ Still waiting for login... (${attempts}/${maxAttempts})`);
        }
        throw new Error('Login timeout - please ensure you are authenticated with ChatGPT');
    }
    async verifyCodexAccess() {
        if (!this.stagehand?.page)
            return false;
        try {
            // Look for Codex-specific interface elements
            const codexInterface = await this.stagehand.page.evaluate(() => {
                // Look for task input field, submit button, or other Codex UI elements
                const taskInput = document.querySelector('input[placeholder*="task"], textarea[placeholder*="task"], .task-input');
                const submitButton = document.querySelector('button[type="submit"], .submit-button, button:contains("Submit")');
                return !!(taskInput || submitButton);
            });
            return codexInterface;
        }
        catch {
            return false;
        }
    }
    async submitTask(issue) {
        if (!this.stagehand?.page)
            throw new Error('Stagehand not initialized');
        const page = this.stagehand.page;
        const taskDescription = `GitHub Issue #${issue.id}: ${issue.title}`;
        // Click input field and submit task
        await page.act('click the task description input field');
        await page.act(`type "${taskDescription}" into the input field`);
        await page.act('click the submit button');
        // Wait for task to be processed
        await page.waitForTimeout(2000);
        return taskDescription;
    }
    async createPRForTask(issue) {
        if (!this.stagehand?.page)
            throw new Error('Stagehand not initialized');
        const page = this.stagehand.page;
        try {
            // Find and click the specific task
            await page.act(`click the task containing "Issue #${issue.id}"`);
            // Click Create PR button
            await page.act('click the Create PR button');
            // Wait for PR creation and try to capture URL
            await page.waitForTimeout(3000);
            // Extract PR URL if available
            const prData = await page.extract({
                instruction: 'extract the PR URL or creation confirmation',
                schema: zod_1.z.object({
                    prUrl: zod_1.z.string().optional(),
                    success: zod_1.z.boolean().optional()
                })
            });
            // Navigate back to task list
            await page.act('click the back button or return to tasks');
            await page.waitForTimeout(1000);
            return prData.prUrl;
        }
        catch (error) {
            console.warn(`⚠️ Could not create PR for issue #${issue.id}:`, error);
            return undefined;
        }
    }
    async processBatch(issues) {
        console.log(`📦 Processing batch of ${issues.length} issues...`);
        // Submit all tasks in batch
        for (const issue of issues) {
            const startTime = Date.now();
            try {
                console.log(`📤 Submitting: Issue #${issue.id}`);
                await this.submitTask(issue);
                const duration = Date.now() - startTime;
                this.stats.results.push({
                    issue,
                    success: true,
                    duration
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                console.error(`❌ Failed to submit Issue #${issue.id}:`, error);
                this.stats.results.push({
                    issue,
                    success: false,
                    error: String(error),
                    duration
                });
            }
        }
        // Wait for all tasks to be processed
        console.log('⏳ Waiting for tasks to be processed...');
        await this.stagehand.page.waitForTimeout(5000);
        // Create PRs for successfully submitted tasks
        for (const result of this.stats.results) {
            if (result.success && !result.prUrl) {
                const prStartTime = Date.now();
                try {
                    console.log(`🔀 Creating PR for Issue #${result.issue.id}`);
                    const prUrl = await this.createPRForTask(result.issue);
                    result.prUrl = prUrl;
                    result.duration = (result.duration || 0) + (Date.now() - prStartTime);
                    if (prUrl) {
                        console.log(`✅ PR created: ${prUrl}`);
                        this.stats.successful++;
                    }
                    else {
                        console.log(`⚠️ PR creation uncertain for Issue #${result.issue.id}`);
                    }
                }
                catch (error) {
                    result.error = String(error);
                    result.success = false;
                    this.stats.failed++;
                    console.error(`❌ Failed to create PR for Issue #${result.issue.id}:`, error);
                }
            }
        }
    }
    async processIssues(options = {}) {
        const { maxIssues = 10, priorityFilter = ['critical', 'high', 'medium'], categoryFilter = ['bug', 'enhancement', 'ui'], batchSize = 5 } = options;
        // Filter and prioritize issues
        let filteredIssues = GITHUB_ISSUES
            .filter(issue => priorityFilter.includes(issue.priority))
            .filter(issue => categoryFilter.includes(issue.category))
            .slice(0, maxIssues);
        console.log(`🎯 Processing ${filteredIssues.length} issues in batches of ${batchSize}`);
        const startTime = Date.now();
        this.stats.total = filteredIssues.length;
        // Process in batches
        for (let i = 0; i < filteredIssues.length; i += batchSize) {
            const batch = filteredIssues.slice(i, i + batchSize);
            console.log(`\n📊 Batch ${Math.floor(i / batchSize) + 1}: Issues ${batch.map(b => '#' + b.id).join(', ')}`);
            try {
                await this.processBatch(batch);
            }
            catch (error) {
                console.error(`❌ Batch failed:`, error);
                // Continue with next batch
            }
            // Pause between batches to avoid rate limiting
            if (i + batchSize < filteredIssues.length) {
                console.log('⏸️ Pausing between batches...');
                await this.stagehand.page.waitForTimeout(3000);
            }
        }
        this.stats.totalDuration = Date.now() - startTime;
        this.stats.successful = this.stats.results.filter(r => r.success && r.prUrl).length;
        this.stats.failed = this.stats.results.filter(r => !r.success || !r.prUrl).length;
        return this.stats;
    }
    generateReport() {
        const { total, successful, failed, results, totalDuration } = this.stats;
        const report = `
🎯 **GitHub Issues to PR Workflow Report**
==========================================

📊 **Summary:**
- Total Issues: ${total}
- Successful PRs: ${successful}
- Failed: ${failed}
- Success Rate: ${((successful / total) * 100).toFixed(1)}%
- Total Duration: ${(totalDuration / 1000).toFixed(1)}s
- Average per Issue: ${(totalDuration / total / 1000).toFixed(1)}s

📈 **Results by Priority:**
${this.generatePriorityBreakdown()}

🔗 **Created PRs:**
${results
            .filter(r => r.prUrl)
            .map(r => `- Issue #${r.issue.id}: ${r.prUrl}`)
            .join('\n')}

❌ **Failed Issues:**
${results
            .filter(r => !r.success || !r.prUrl)
            .map(r => `- Issue #${r.issue.id}: ${r.error || 'PR creation failed'}`)
            .join('\n')}
`;
        return report;
    }
    generatePriorityBreakdown() {
        const breakdown = ['critical', 'high', 'medium', 'low'].map(priority => {
            const priorityResults = this.stats.results.filter(r => r.issue.priority === priority);
            const successful = priorityResults.filter(r => r.success && r.prUrl).length;
            return `- ${priority}: ${successful}/${priorityResults.length}`;
        });
        return breakdown.join('\n');
    }
    async cleanup() {
        if (this.stagehand) {
            console.log('🧹 Cleaning up Stagehand connection...');
            try {
                await this.stagehand.close();
            }
            catch (error) {
                console.error('Error during cleanup:', error);
            }
        }
    }
}
exports.EfficientPRWorkflow = EfficientPRWorkflow;
// Main execution function
async function runEfficientWorkflow(options) {
    const workflow = new EfficientPRWorkflow();
    try {
        await workflow.initialize();
        const stats = await workflow.processIssues(options);
        console.log('\n' + workflow.generateReport());
        return stats;
    }
    catch (error) {
        console.error('❌ Workflow failed:', error);
        throw error;
    }
    finally {
        await workflow.cleanup();
    }
}
// Direct execution with default options
if (require.main === module) {
    runEfficientWorkflow({
        maxIssues: 10,
        priorityFilter: ['critical', 'high'],
        categoryFilter: ['bug', 'enhancement'],
        batchSize: 3
    }).then((stats) => {
        console.log(`\n🎉 Workflow completed: ${stats.successful}/${stats.total} successful`);
        process.exit(stats.failed === 0 ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Workflow crashed:', error);
        process.exit(1);
    });
}
