import { expect, test } from '@playwright/test';

test.describe('Public Portal', () => {
  test('home page opens and login portal routes to login form', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /login portal/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /logo.*kkn uin saizu/i })).toBeVisible();

    await page.getByRole('link', { name: /login portal/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-identifier')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-captcha-answer')).toBeVisible();
  });
});
