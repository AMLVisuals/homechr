import { test, expect } from '@playwright/test';

test.describe('Patron Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to patron dashboard
    // The page component sets userRole to PATRON on mount
    await page.goto('/patron/tableau-de-bord');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard loads with "Bienvenue sur Home CHR" text', async ({ page }) => {
    await expect(
      page.getByText('Bienvenue sur Home CHR')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('navigation tabs are visible', async ({ page }) => {
    // Wait for the dashboard to fully load
    await expect(
      page.getByText('Mon tableau de bord')
    ).toBeVisible({ timeout: 15_000 });

    // Check that at least the main content and some nav elements are present
    // Sidebar is only visible on desktop, so check for elements that appear on all viewports
    await expect(page.getByText('Missions').first()).toBeVisible();
    await expect(page.getByText('Planning').first()).toBeVisible();
  });
});
