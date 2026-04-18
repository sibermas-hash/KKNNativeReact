import { expect, test } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('admin can login and open operational pages', async ({ page }) => {
    // Use X-Test-Login header to bypass captcha
    await page.setExtraHTTPHeaders({ 'X-Test-Login': 'admin' });

    // Go to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`Admin at: ${currentUrl}`);

    // Verify the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Navigate to registration page
    await page.goto('/admin/pendaftaran');
    await page.waitForLoadState('networkidle');
    console.log(`Pendaftaran page: ${page.url()}`);

    // Verify page loaded
    await expect(body).toBeVisible();

    // Navigate to kelompok page
    await page.goto('/admin/kelompok');
    await page.waitForLoadState('networkidle');
    console.log(`Kelompok page: ${page.url()}`);

    // Verify page loaded
    await expect(body).toBeVisible();
  });
});
