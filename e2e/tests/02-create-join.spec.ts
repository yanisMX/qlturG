import { test, expect, BrowserContext, Page } from '@playwright/test';

async function createGame(page: Page): Promise<string> {
  await page.goto('/create');
  await page.getByPlaceholder('Ex: Marie Curie').fill('HostPlayer');
  // Standard mode is selected by default
  await page.getByRole('button', { name: 'Créer la partie' }).click();
  // Should redirect to lobby
  await expect(page).toHaveURL(/\/lobby\//);
  const url = page.url();
  const code = url.split('/lobby/')[1];
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  return code;
}

test.describe('Create & Join flow', () => {
  test('host creates a game and lands in lobby', async ({ page }) => {
    await createGame(page);
    // Lobby shows the game code
    await expect(page.getByText(/joueurs/i)).toBeVisible();
  });

  test('second player joins by code', async ({ browser }) => {
    const hostCtx: BrowserContext = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const code = await createGame(hostPage);

    const guestCtx: BrowserContext = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.goto('/join');
    await guestPage.getByPlaceholder('A3F9KM').fill(code);
    await guestPage.getByPlaceholder('Ex: Napoléon Bonaparte').fill('GuestPlayer');
    await guestPage.getByRole('button', { name: 'Rejoindre' }).click();

    await expect(guestPage).toHaveURL(/\/lobby\//);
    // Both pages show 2 players
    await expect(hostPage.getByText('GuestPlayer')).toBeVisible({ timeout: 8_000 });

    await hostCtx.close();
    await guestCtx.close();
  });

  test('join with invalid code shows error', async ({ page }) => {
    await page.goto('/join');
    await page.getByPlaceholder('A3F9KM').fill('XXXXXX');
    await page.getByPlaceholder('Ex: Napoléon Bonaparte').fill('Player');
    await page.getByRole('button', { name: 'Rejoindre' }).click();
    // Should stay on /join and show an error message
    await expect(page).toHaveURL('/join');
    await expect(page.getByText(/game not found|introuvable|invalide|erreur|not found/i)).toBeVisible({ timeout: 8_000 });
  });
});
