const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/admin/vendors', { waitUntil: 'networkidle2' });
  
  // Wait for the register button and click it
  await page.waitForSelector('.btn-primary');
  const registerButtons = await page.$$('.btn-primary');
  
  // Click the "Register New Vendor" button
  if (registerButtons.length > 0) {
    await registerButtons[0].click();
    await page.waitForSelector('[style*="fixed"]');
    await page.screenshot({ path: 'modal-screenshot.png', fullPage: true });
    console.log('Screenshot saved: modal-screenshot.png');
  }
  
  await browser.close();
})();
