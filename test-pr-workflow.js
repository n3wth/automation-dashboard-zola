// Simple test runner for PR workflow
require('dotenv').config({ path: '.env.local' });

const { runEfficientWorkflow } = require('./scripts/efficient-pr-workflow.ts');

console.log('🚀 Starting PR workflow test...');

// Test with just 2 critical issues
runEfficientWorkflow({
  maxIssues: 2,
  priorityFilter: ['critical'],
  categoryFilter: ['bug'],
  batchSize: 1
}).then((stats) => {
  console.log('\n🎉 Test completed!');
  console.log(`✅ Success: ${stats.successful}/${stats.total} PRs created`);
  console.log(`⏱️ Duration: ${(stats.totalDuration / 1000).toFixed(1)}s`);

  if (stats.failed > 0) {
    console.log(`❌ Failures: ${stats.failed}`);
    stats.results.filter(r => !r.success).forEach(r => {
      console.log(`  - Issue #${r.issue.id}: ${r.error}`);
    });
  }

  process.exit(stats.failed === 0 ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});