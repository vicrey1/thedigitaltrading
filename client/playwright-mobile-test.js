const { chromium, devices } = require('playwright');

(async () => {
  const iPhone = devices['iPhone 12'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  try {
    // Dev server started on 3001 in this environment; try 3001 first and fallback to 3000
    const urls = ['http://localhost:3001/admin', 'http://localhost:3000/admin'];
    let navigated = false;
    for (const u of urls) {
      try {
        await page.goto(u, { waitUntil: 'networkidle', timeout: 5000 });
        console.log('Navigated to', u);
        navigated = true;
        break;
      } catch (e) {
        console.log('Failed to navigate to', u, e.message);
      }
    }
    if (!navigated) throw new Error('Could not reach dev server on 3001 or 3000');
    // wait for the mobile toggle button
    const toggle = await page.waitForSelector('button[aria-label="mobile-toggle"]', { timeout: 5000 }).catch(() => null);
    if (!toggle) {
      console.log('Mobile toggle button not found by aria-label; trying generic selector');
      // fallback: find the top-left button with chevrons
      const btn = await page.$('button');
      if (!btn) {
        console.log('No button found on page');
      } else {
        await btn.click();
        await page.waitForTimeout(500);
        const sidebar = await page.$('aside');
        const visible = !!sidebar && await sidebar.isVisible();
        console.log('Clicked generic button — sidebar visible:', visible);
      }
    } else {
      await toggle.click();
      await page.waitForTimeout(500);
      const sidebar = await page.$('aside');
      const visible = !!sidebar && await sidebar.isVisible();
      console.log('Clicked aria-labeled toggle — sidebar visible:', visible);
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();