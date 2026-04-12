const { test, expect } = require('@playwright/test');

test('login portal link works', async ({ page }) => {
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  const link = page.getByRole('link', { name: /login portal/i }).first();
  console.log('href=', await link.getAttribute('href'));
  console.log('visible=', await link.isVisible());
  console.log('enabled=', await link.isEnabled());
  console.log('box=', await link.boundingBox());
  await link.click();
  await page.waitForURL('**/login');
  console.log('url_after=', page.url());
  await expect(page).toHaveURL(/\/login$/);
});
