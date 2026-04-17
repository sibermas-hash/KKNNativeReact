import { expect, test } from '@playwright/test';
import { loginAsDpl, loginAsStudent } from './utils/auth';

test.describe('Role Dashboards', () => {
  test('student can login and open mahasiswa dashboard', async ({ page }) => {
    await loginAsStudent(page);

    await expect(page).toHaveURL(/\/mahasiswa(?:\?.*)?$/);
    await expect(page.getByText(/portal mahasiswa/i)).toBeVisible();
    await expect(page.getByText(/progres pengabdian/i)).toBeVisible();
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
