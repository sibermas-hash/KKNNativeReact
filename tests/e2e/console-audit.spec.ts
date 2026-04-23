import { test, expect } from '@playwright/test';

interface ConsoleMessage {
  type: 'error' | 'warning' | 'log' | 'info';
  text: string;
  location: string;
}

test.describe('Console Audit - All Pages', () => {
  const pagesToTest = [
    { url: '/', name: 'Landing Page' },
    { url: '/login', name: 'Login Page' },
    { url: '/berita', name: 'Announcements Page' },
    { url: '/unduhan', name: 'Downloads Page' },
  ];

  for (const pageInfo of pagesToTest) {
    test(`Check console on ${pageInfo.name}`, async ({ page }) => {
      const consoleMessages: ConsoleMessage[] = [];
      const failedRequests: string[] = [];

      page.on('console', (msg) => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          consoleMessages.push({
            type: type as 'error' | 'warning',
            text: msg.text(),
            location: msg.location().url || 'unknown',
          });
        }
      });

      page.on('pageerror', (error) => {
        consoleMessages.push({
          type: 'error',
          text: error.message,
          location: 'pageerror',
        });
      });

      page.on('response', (response) => {
        if (response.status() >= 400) {
          failedRequests.push(`${response.status()} - ${response.url()}`);
        }
      });

      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');

      if (consoleMessages.length > 0 || failedRequests.length > 0) {
        console.log(`\n=== Issues on ${pageInfo.name} ===`);
        if (failedRequests.length > 0) {
          console.log('Failed Requests:');
          for (const req of failedRequests) {
            console.log(`  - ${req}`);
          }
        }
        for (const msg of consoleMessages) {
          console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
        }
      }
    });
  }

  test('Check console on authenticated pages (as student)', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        consoleMessages.push({
          type: type as 'error' | 'warning',
          text: msg.text(),
          location: msg.location().url || 'unknown',
        });
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    // Use X-Test-Login header for student (bypasses captcha)
    await page.setExtraHTTPHeaders({ 'X-Test-Login': 'student' });
    await page.goto('/mahasiswa');
    await page.waitForLoadState('networkidle').catch(() => {});

    const currentUrl = page.url();
    console.log(`\n=== Student Dashboard Console (${currentUrl}) ===`);
    console.log(`Failed Requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log('Details:');
      for (const req of failedRequests) {
        console.log(`  - ${req}`);
      }
    }
    console.log(`Console errors/warnings: ${consoleMessages.length}`);
    if (consoleMessages.length > 0) {
      console.log('Console details:');
      for (const msg of consoleMessages) {
        console.log(`  - [${msg.type}] ${msg.text}`);
      }
    }

    // Try to capture the actual error from the page content
    const pageContent = await page.content();
    if (
      pageContent.includes('500') ||
      pageContent.includes('Exception') ||
      pageContent.includes('Error')
    ) {
      console.log('Page contains error content - checking for Inertia error...');
      const errorText = await page
        .locator('.text-red-500, .text-rose-500, .error, #error')
        .first()
        .textContent()
        .catch(() => '');
      if (errorText) {
        console.log(`Error message found: ${errorText}`);
      }
    }
  });

  test('Check console on admin pages (as admin)', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        consoleMessages.push({
          type: type as 'error' | 'warning',
          text: msg.text(),
          location: msg.location().url || 'unknown',
        });
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    // Use X-Test-Login header for admin (bypasses captcha)
    await page.setExtraHTTPHeaders({ 'X-Test-Login': 'admin' });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle').catch(() => {});

    console.log(`\n=== Admin Dashboard Console ===`);
    console.log(`Failed Requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      for (const req of failedRequests) {
        console.log(`  - ${req}`);
      }
    }
    console.log(`Console errors/warnings: ${consoleMessages.length}`);
  });
});
