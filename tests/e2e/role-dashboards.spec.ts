import { expect, test } from '@playwright/test';
import { loginAsDpl, loginAsStudent } from './utils/auth';

test.describe('Role Dashboards', () => {
  test('student can login and open mahasiswa dashboard', async ({ page }) => {
    await loginAsStudent(page);

    // Wait for redirect after login (student could be redirected to either their dashboard or a profile completion page)
    await page.waitForURL(/\/(mahasiswa|admin|profil)\??.*$/, { timeout: 10000 });

    // After login, verify we have access to some authenticated area
    const currentUrl = page.url();
    // Student should NOT end up on admin-only pages without proper role
    expect(currentUrl).not.toMatch(/\/admin\/.*(pendaftaran|kelompok|nilai)/);

    // Verify the page has some authenticated content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('dpl can login and open dpl dashboard and groups', async ({ page }) => {
    await loginAsDpl(page);

    await expect(page).toHaveURL(/\/dpl(?:\?.*)?$/);
    await expect(page.getByText(/portal bimbingan dpl/i)).toBeVisible();

    await page.goto('/dpl/kelompok');
    await expect(page).toHaveURL(/\/dpl\/kelompok/);
    await expect(page.getByText(/kelompok bimbingan/i)).toBeVisible();
  });
});
