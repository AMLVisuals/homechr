import { test, expect } from '@playwright/test';

test.describe('Patron Dashboard', () => {
  test('unauthenticated access redirects to role selection', async ({ page }) => {
    await page.goto('/patron/tableau-de-bord');
    await page.waitForLoadState('networkidle');

    // Should redirect to role selection (Demandeur / Prestataire)
    await expect(
      page.getByText('Demandeur')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('role selection page loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Demandeur')).toBeVisible();
    await expect(page.getByText('Prestataire')).toBeVisible();
  });
});
