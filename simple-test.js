// Simple test for PR workflow
const { Stagehand } = require('@browserbasehq/stagehand');

console.log('🧪 Testing Stagehand initialization...');

const stagehandConfig = {
  env: 'BROWSERBASE',
  verbose: 1,
  modelName: 'google/gemini-2.5-flash-preview-05-20',
  disablePino: true,
  modelClientOptions: {
    apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyCFEF930o5y5GgARew1_3BU7hoKLQqqJWE',
  },
};

async function testStagehand() {
  let stagehand = null;

  try {
    console.log('🚀 Creating Stagehand instance...');
    stagehand = new Stagehand(stagehandConfig);

    console.log('⚡ Initializing Stagehand...');
    await stagehand.init();

    console.log('🌐 Navigating to ChatGPT...');
    await stagehand.page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded' });

    console.log('📸 Taking screenshot...');
    await stagehand.page.screenshot({ path: 'chatgpt-test.png' });

    console.log('✅ Basic test successful!');
    console.log('📋 Next: Manual login required for full workflow');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;

  } finally {
    if (stagehand) {
      console.log('🧹 Cleaning up...');
      try {
        await stagehand.close();
      } catch (err) {
        console.warn('⚠️ Cleanup error:', err.message);
      }
    }
  }
}

// Load environment
require('dotenv').config({ path: '.env.local' });

testStagehand().then(success => {
  console.log(success ? '\n🎉 Test completed successfully!' : '\n💥 Test failed!');
  process.exit(success ? 0 : 1);
});