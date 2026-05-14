import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows main CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Quiz/i);
    await expect(page.getByRole('link', { name: /créer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /rejoindre/i })).toBeVisible();
  });

  test('navigate to create page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /créer/i }).click();
    await expect(page).toHaveURL('/create');
  });

  test('navigate to join page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /rejoindre/i }).click();
    await expect(page).toHaveURL('/join');
  });
});
