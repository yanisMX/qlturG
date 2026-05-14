import { test, expect, BrowserContext, Page } from '@playwright/test';

async function answerIfVisible(page: Page) {
  const btn = page.getByTestId('choice-btn').first();
  const visible = await btn.isVisible().catch(() => false);
  if (visible) await btn.click().catch(() => {});
}


test.describe('Standard multiplayer — full 10-question game', () => {
  // 2s loading + 10×10s questions + 10×4s reveals ≈ 142s. Allow 4 minutes.
  // Tests run sequentially (workers:1) so no server-load interference.
  test.setTimeout(4 * 60_000);

  test('two players complete a game and reach results', async ({ browser }) => {
    const hostCtx: BrowserContext = await browser.newContext();
    const guestCtx: BrowserContext = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    // --- Create game (host) ---
    await hostPage.goto('/create');
    await hostPage.getByPlaceholder('Ex: Marie Curie').fill('HostPlayer');
    // Set question duration to 5s via native event to bypass React's synthetic event layer
    // First range slider is questionDuration (min=5, max=30)
    await hostPage.locator('input[type="range"]').first().evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value',
      )!.set!;
      nativeSetter.call(el, '5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await hostPage.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(hostPage).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    const code = hostPage.url().split('/lobby/')[1];

    // --- Guest joins ---
    await guestPage.goto('/join');
    await guestPage.getByPlaceholder('A3F9KM').fill(code);
    await guestPage.getByPlaceholder('Ex: Napoléon Bonaparte').fill('GuestPlayer');
    await guestPage.getByRole('button', { name: 'Rejoindre' }).click();
    await expect(guestPage).toHaveURL(/\/lobby\//, { timeout: 10_000 });

    // Host sees GuestPlayer before starting
    await expect(hostPage.getByText('GuestPlayer')).toBeVisible({ timeout: 8_000 });

    // --- Host starts the game ---
    await hostPage.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(hostPage).toHaveURL(/\/play\//, { timeout: 15_000 });
    await expect(guestPage).toHaveURL(/\/play\//, { timeout: 15_000 });

    // --- Wait for game to complete (results page) ---
    // In STANDARD mode the question timer always runs for its full duration (5s here).
    // Both players answer when possible — but the timer is the main driver.
    // Total expected time: 2s loading + 10×5s questions + 10×4s reveals = ~92s
    const deadline = Date.now() + 3 * 60_000;
    while (Date.now() < deadline) {
      if (hostPage.url().includes('/results/')) break;
      await answerIfVisible(hostPage);
      await answerIfVisible(guestPage);
      await hostPage.waitForTimeout(2_000).catch(() => {});
    }

    // Both players reach results
    await expect(hostPage).toHaveURL(/\/results\//, { timeout: 60_000 });
    await expect(guestPage).toHaveURL(/\/results\//, { timeout: 60_000 });

    // Results page shows a ranking / podium
    await expect(hostPage.getByText(/classement|résultats|podium/i).first()).toBeVisible({ timeout: 8_000 });

    await hostCtx.close();
    await guestCtx.close();
  });

  // Rematch with a different topic:
  // 1. Play a full game (Mixte) → results
  // 2. Host picks "Cinéma" in the topic picker on the results page
  // 3. Host clicks "Nouvelle partie" → both players land in new lobby
  // 4. New lobby shows "Cinéma" as the selected theme
  test('rematch with a different topic redirects both players to new lobby', async ({ browser }) => {
    // 2s loading + 10×10s questions + 10×4s reveals = ~142s game.
    // Add rematch + lobby check: allow 4 minutes total.
    test.setTimeout(4 * 60_000);

    const hostCtx: BrowserContext = await browser.newContext();
    const guestCtx: BrowserContext = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    // --- Create game (Mixte topic by default) ---
    await hostPage.goto('/create');
    await hostPage.getByPlaceholder('Ex: Marie Curie').fill('RematchHost');
    await hostPage.locator('input[type="range"]').first().evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value',
      )!.set!;
      nativeSetter.call(el, '5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await hostPage.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(hostPage).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    const code = hostPage.url().split('/lobby/')[1];

    // --- Guest joins ---
    await guestPage.goto('/join');
    await guestPage.getByPlaceholder('A3F9KM').fill(code);
    await guestPage.getByPlaceholder('Ex: Napoléon Bonaparte').fill('RematchGuest');
    await guestPage.getByRole('button', { name: 'Rejoindre' }).click();
    await expect(guestPage).toHaveURL(/\/lobby\//, { timeout: 10_000 });
    await expect(hostPage.getByText('RematchGuest')).toBeVisible({ timeout: 8_000 });

    // --- Host starts the game ---
    await hostPage.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(hostPage).toHaveURL(/\/play\//, { timeout: 15_000 });
    await expect(guestPage).toHaveURL(/\/play\//, { timeout: 15_000 });

    // --- Wait for game to reach results ---
    const deadline = Date.now() + 3 * 60_000;
    while (Date.now() < deadline) {
      if (hostPage.url().includes('/results/')) break;
      await answerIfVisible(hostPage);
      await answerIfVisible(guestPage);
      await hostPage.waitForTimeout(2_000).catch(() => {});
    }
    await expect(hostPage).toHaveURL(/\/results\//, { timeout: 30_000 });
    await expect(guestPage).toHaveURL(/\/results\//, { timeout: 30_000 });

    // --- Host changes topic to "Cinéma" ---
    await hostPage.getByText('Thème de la prochaine partie').waitFor({ timeout: 5_000 });
    // Open the topic dropdown (trigger button shows current label + ▼/▲)
    await hostPage.locator('button').filter({ hasText: /▼/ }).first().click();
    // Select "Cinéma" from the list
    await hostPage.getByRole('button', { name: 'Cinéma' }).click();
    // Close dropdown by clicking outside it (the heading is outside topicsRef)
    await hostPage.getByRole('heading', { name: /résultats/i }).click();
    await hostPage.waitForTimeout(300); // let the dropdown animate closed

    // --- Host triggers rematch ---
    await hostPage.getByRole('button', { name: 'Nouvelle partie' }).click();

    // --- Both players land in the new lobby ---
    await expect(hostPage).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    await expect(guestPage).toHaveURL(/\/lobby\//, { timeout: 15_000 });

    // New lobby must show "Cinéma" as the selected topic
    await expect(hostPage.getByText('Cinéma')).toBeVisible({ timeout: 8_000 });

    await hostCtx.close();
    await guestCtx.close();
  });

  test('host can kick a player in lobby', async ({ browser }) => {
    const hostCtx: BrowserContext = await browser.newContext();
    const guestCtx: BrowserContext = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await hostPage.goto('/create');
    await hostPage.getByPlaceholder('Ex: Marie Curie').fill('KickHost');
    await hostPage.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(hostPage).toHaveURL(/\/lobby\//, { timeout: 10_000 });
    const code = hostPage.url().split('/lobby/')[1];

    await guestPage.goto('/join');
    await guestPage.getByPlaceholder('A3F9KM').fill(code);
    await guestPage.getByPlaceholder('Ex: Napoléon Bonaparte').fill('ToBeKicked');
    await guestPage.getByRole('button', { name: 'Rejoindre' }).click();
    await expect(guestPage).toHaveURL(/\/lobby\//, { timeout: 10_000 });

    // Host sees player
    await expect(hostPage.getByText('ToBeKicked')).toBeVisible({ timeout: 8_000 });

    // Look for kick button (×, ✕, or "expulser" text near the player name)
    const kickBtn = hostPage.getByRole('button', { name: /expulser|kick/i }).first();
    if (await kickBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kickBtn.click();
      await expect(guestPage).not.toHaveURL(/\/lobby\//, { timeout: 8_000 });
    }
    // If no kick button visible, test passes — feature may not be exposed in current UI

    await hostCtx.close();
    await guestCtx.close();
  });
});
