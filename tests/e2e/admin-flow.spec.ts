import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

test.describe('Admin Flow', () => {
  test('admin can login and open operational pages', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/admin(?:\?.*)?$/);
    await expect(page.getByText(/pust kendali operasional|pusat kendali operasional/i)).toBeVisible();

    await page.goto('/admin/pendaftaran');
    await expect(page).toHaveURL(/\/admin\/pendaftaran/);
    await expect(page.getByRole('heading', { name: /validasi pendaftaran/i }).first()).toBeVisible();

    await page.goto('/admin/kelompok');
    await expect(page).toHaveURL(/\/admin\/kelompok/);
    await expect(page.getByText(/manajemen kelompok/i)).toBeVisible();
  });
});
