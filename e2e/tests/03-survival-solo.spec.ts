import { test, expect } from '@playwright/test';

test.describe('Survival Solo — full game', () => {
  // Allow up to 3 minutes: worst case 3 correct answers before 3 wrong = ~6 questions × 9s each
  test.setTimeout(3 * 60_000);

  test('reaches results after losing all lives', async ({ page }) => {
    await page.goto('/create');
    await page.getByPlaceholder('Ex: Marie Curie').fill('SoloPlayer');
    await page.getByRole('button', { name: 'Survival Solo' }).click();
    // Set question duration to 5s (minimum) via the range slider
    await page.locator('input[type="range"]').first().fill('5');
    await page.dispatchEvent('input[type="range"]', 'input');
    await page.getByRole('button', { name: 'Créer la partie' }).click();

    // SURVIVAL_SOLO skips lobby — should land directly on /play/:code
    await expect(page).toHaveURL(/\/play\//, { timeout: 15_000 });

    // Keep clicking the first available choice until the game ends
    // Server eliminates the player after 3 wrong answers → game:finished → /results/
    const deadline = Date.now() + 2.5 * 60_000;
    while (Date.now() < deadline) {
      if (page.url().includes('/results/')) break;

      const btn = page.getByTestId('choice-btn').first();
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        await btn.click().catch(() => {});
      }
      await page.waitForTimeout(1_500);
    }

    await expect(page).toHaveURL(/\/results\//, { timeout: 10_000 });
  });

  test('quit button works during gameplay', async ({ page }) => {
    await page.goto('/create');
    await page.getByPlaceholder('Ex: Marie Curie').fill('QuitSolo');
    await page.getByRole('button', { name: 'Survival Solo' }).click();
    await page.getByRole('button', { name: 'Créer la partie' }).click();

    await expect(page).toHaveURL(/\/play\//, { timeout: 15_000 });
    await expect(page.getByText('✕ Quitter')).toBeVisible({ timeout: 10_000 });

    // Click quit → confirmation modal appears
    await page.getByText('✕ Quitter').click();
    await expect(page.getByText('Quitter la partie')).toBeVisible();

    // Cancel → modal closes, stay in game
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/play\//);

    // Confirm quit → back to home
    await page.getByText('✕ Quitter').click();
    await page.getByRole('button', { name: /^Quitter$/ }).click();
    await expect(page).toHaveURL('/', { timeout: 8_000 });
  });
});
