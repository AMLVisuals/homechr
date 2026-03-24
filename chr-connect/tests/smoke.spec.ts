import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('app starts and returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
  });

  test('page title contains "Home CHR"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Home CHR/);
  });

  test('no console errors on initial load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (e.g. favicon, external resources)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('manifest') &&
        !err.includes('service-worker') &&
        !err.includes('net::ERR')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
