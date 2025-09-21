const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    devtools: true
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Browser error:', error.message));

  const chatId = '6acac358-0e13-42c5-817c-cb3130fe659e';
  const url = `http://localhost:3000/c/${chatId}`;

  console.log(`Opening automation chat: ${url}`);

  // Navigate to the chat
  const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  console.log(`Response status: ${response.status()}`);

  // Wait a bit for any redirects
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log(`Current URL after navigation: ${currentUrl}`);

  if (currentUrl !== url) {
    console.log('❌ Redirected away from chat URL!');
    console.log(`Redirected to: ${currentUrl}`);
  } else {
    console.log('✅ Still on chat URL');
  }

  // Check for any loading indicators
  const isLoading = await page.evaluate(() => {
    const loadingText = document.body.innerText.includes('Loading');
    const spinner = document.querySelector('[class*="animate-spin"]');
    return loadingText || spinner !== null;
  });

  if (isLoading) {
    console.log('⏳ Page shows loading state');
  }

  // Check for chat input
  const hasChatInput = await page.evaluate(() => {
    return document.querySelector('textarea') !== null;
  });

  if (hasChatInput) {
    console.log('✅ Chat input found - page loaded successfully!');
  } else {
    console.log('❌ No chat input found - page may not have loaded correctly');
  }

  // Get page content for debugging
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\nPage content preview:');
  console.log(pageText.substring(0, 500));

  // Keep browser open for inspection (comment out to close automatically)
  // await browser.close();
})();