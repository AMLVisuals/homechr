import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the role selection screen to be visible
    await page.waitForLoadState('networkidle');
  });

  test('landing page shows role selection with 2 cards', async ({ page }) => {
    // The RoleSwitcher shows two RoleCards with subtitles "Demandeur" and "Prestataire"
    const demandeurCard = page.getByText('Demandeur');
    const prestataireCard = page.getByText('Prestataire');

    await expect(demandeurCard).toBeVisible();
    await expect(prestataireCard).toBeVisible();
  });

  test('clicking "Demandeur" shows auth form with login/register toggle', async ({ page }) => {
    await page.getByText('Demandeur').click();

    // Should show auth step with "Espace Demandeur" heading
    await expect(page.getByText('Espace Demandeur')).toBeVisible();

    // Should have login/register toggle buttons
    await expect(page.getByText('Se connecter', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Créer un compte')).toBeVisible();

    // Should have email and password fields in login mode
    await expect(page.getByPlaceholder('Adresse email')).toBeVisible();
    await expect(page.getByPlaceholder('Mot de passe')).toBeVisible();
  });

  test('clicking "Prestataire" shows auth form', async ({ page }) => {
    await page.getByText('Prestataire').click();

    // Should show auth step with "Espace Prestataire" heading
    await expect(page.getByText('Espace Prestataire')).toBeVisible();

    // Should have email and password inputs
    await expect(page.getByPlaceholder('Adresse email')).toBeVisible();
    await expect(page.getByPlaceholder('Mot de passe')).toBeVisible();
  });

  test('empty email/password shows error message', async ({ page }) => {
    await page.getByText('Demandeur').click();
    await expect(page.getByText('Espace Demandeur')).toBeVisible();

    // Click the submit button without filling fields
    // The main submit button in login mode says "Se connecter"
    await page.locator('button', { hasText: 'Se connecter' })
      .filter({ has: page.locator('svg') })
      .last()
      .click();

    // Should show validation error
    await expect(page.getByText('Veuillez remplir tous les champs')).toBeVisible();
  });

  test('register form shows name, email, phone, password, confirm password fields', async ({ page }) => {
    await page.getByText('Demandeur').click();
    await expect(page.getByText('Espace Demandeur')).toBeVisible();

    // Switch to register mode — click the toggle button (first one, not submit)
    await page.getByRole('button', { name: 'Créer un compte' }).first().click();

    // All register fields should be visible
    await expect(page.getByPlaceholder('Nom', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Prénom', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Adresse email')).toBeVisible();
    await expect(page.getByPlaceholder('Téléphone')).toBeVisible();
    await expect(page.getByPlaceholder('Mot de passe', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Confirmer le mot de passe')).toBeVisible();
  });

  test('"Dev Mode: Skip Auth" button exists', async ({ page }) => {
    await page.getByText('Demandeur').click();
    await expect(page.getByText('Espace Demandeur')).toBeVisible();

    const skipAuthButton = page.getByText('Dev Mode: Skip Auth');
    await expect(skipAuthButton).toBeVisible();
  });
});
