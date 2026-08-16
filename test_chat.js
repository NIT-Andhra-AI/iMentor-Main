const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3005/');
  
  // Wait for chat input
  await page.waitForSelector('textarea[placeholder*="Type a message"]');
  await page.fill('textarea[placeholder*="Type a message"]', 'explain the difference between online learning and this active learning in machine learning');
  await page.keyboard.press('Enter');
  
  // Wait for response to start streaming
  try {
      await page.waitForSelector('.prose', { timeout: 30000 });
      console.log('Success: Received response!');
      
      // Print the first few characters of the response
      const text = await page.textContent('.prose');
      console.log('Response excerpt:', text.substring(0, 100));
  } catch(e) {
      console.log('Error: No response received', e.message);
  }
  
  await browser.close();
})();
