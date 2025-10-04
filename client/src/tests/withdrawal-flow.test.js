const { test, expect } = require('@playwright/test');

test('withdrawal flow with test user shows correct fee', async ({ page }) => {
  // Navigate to login
  await page.goto('http://localhost:3000/login');
  
  // Login as test user
  await page.fill('input[type="email"]', 'testuser@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load and navigate to withdraw page
  await page.waitForSelector('h1:has-text("Dashboard")');
  await page.click('a[href="/withdraw"]');
  
  // Wait for withdraw form and fill it out
  await page.waitForSelector('input[placeholder="Max $"]');
  await page.fill('input[placeholder="Max $"]', '50');
  await page.fill('input[placeholder="e.g. 0x..."]', '0x1234567890abcdef1234567890abcdef12345678');
  await page.fill('input[placeholder="Enter your 6-digit PIN"]', '1234');
  await page.click('button[type="submit"]');
  
  // Wait for fee modal to appear and verify fee amount
  await page.waitForSelector('h2:has-text("Network Processing Fee Required")');
  const feeAmount = await page.textContent('span.text-xl.font-bold.text-orange-600');
  expect(feeAmount.trim()).toBe('$10.00');
  
  // Verify wallet address is displayed
  const walletAddressElement = await page.locator('.bg-white.p-3.rounded-md.border.border-blue-200.my-2.break-all.font-mono.text-sm').first();
  const walletAddress = await walletAddressElement.textContent();
  expect(walletAddress).toContain('0x1234567890AbCdEf1234567890aBcDeF12345678');
  
  // Clean up - close modal
  await page.click('button:has-text("Cancel")');
});