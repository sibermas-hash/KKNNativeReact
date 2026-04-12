const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  const link = page.getByRole('link', { name: /login portal/i }).first();
  console.log('href=', await link.getAttribute('href'));
  console.log('visible=', await link.isVisible());
  console.log('enabled=', await link.isEnabled());
  console.log('box=', await link.boundingBox());
  await link.click({ timeout: 10000 });
  await page.waitForURL('**/login', { timeout: 10000 });
  console.log('url_after=', page.url());
  await browser.close();
})();
