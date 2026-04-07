import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('after selecting PATRON role via skip auth, redirects to /patron/tableau-de-bord', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select "Demandeur" role
    await page.getByText('Demandeur').click();
    await expect(page.getByText('Espace Demandeur')).toBeVisible();

    // Click "Dev Mode: Skip Auth" to bypass authentication
    await page.getByText('Dev Mode: Skip Auth').click();

    // Should redirect to patron dashboard
    await page.waitForURL('**/patron/tableau-de-bord', { timeout: 10_000 });
    expect(page.url()).toContain('/patron/tableau-de-bord');
  });

  test('after selecting WORKER role via skip auth, shows worker category selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select "Prestataire" role
    await page.getByText('Prestataire').click();
    await expect(page.getByText('Espace Prestataire')).toBeVisible();

    // Click "Dev Mode: Skip Auth" to bypass authentication
    await page.getByText('Dev Mode: Skip Auth').click();

    // For WORKER, skip auth goes to category selection step
    await expect(page.getByText('Choisissez votre domaine')).toBeVisible({ timeout: 10_000 });
  });

  test('patron dashboard redirects to role selection when not authenticated', async ({ page }) => {
    await page.goto('/patron/tableau-de-bord');
    await page.waitForLoadState('networkidle');

    // Should redirect to role selection
    await expect(page.getByText('Demandeur')).toBeVisible({ timeout: 10_000 });
  });

  test('/auth page shows admin login form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Should show "Home CHR" heading and "Espace Administration" subtitle
    await expect(page.getByText('Espace Administration')).toBeVisible({ timeout: 10_000 });

    // Should have email and password fields
    await expect(page.getByPlaceholder('admin@home-chr.fr')).toBeVisible();

    // Should have submit button
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });
});
