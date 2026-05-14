import { test, expect, Page } from '@playwright/test';

function collectTopicsFromWs(page: Page): () => string[] {
  const topics: string[] = [];
  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      const data = String(frame.payload);
      // Socket.IO v4 event on namespace /game: "42/game,["event",payload]"
      let json: string | undefined;
      if (data.startsWith('42/game,')) json = data.slice('42/game,'.length);
      else if (data.startsWith('42[')) json = data.slice(2);
      if (!json) return;
      try {
        const [event, payload] = JSON.parse(json);
        if (event === 'game:question' && payload?.topic) topics.push(payload.topic);
      } catch { /* non-JSON frame */ }
    });
  });
  return () => topics;
}

async function setRangeToMin(page: Page) {
  await page.locator('input[type="range"]').first().evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, '5');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function playToResults(page: Page) {
  const deadline = Date.now() + 2.5 * 60_000;
  while (Date.now() < deadline) {
    if (page.url().includes('/results/')) break;
    const btn = page.getByTestId('choice-btn').first();
    if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {});
    await page.waitForTimeout(1_500);
  }
  await expect(page).toHaveURL(/\/results\//, { timeout: 30_000 });
}

test.describe('Multi-topic distribution', () => {
  test.setTimeout(3 * 60_000);

  test('questions are distributed equitably across 2 selected topics', async ({ page }) => {
    const getTopics = collectTopicsFromWs(page);

    await page.goto('/create');
    await page.getByPlaceholder('Ex: Marie Curie').fill('DistribPlayer');
    await setRangeToMin(page);

    // Select Cinéma + Géographie
    await page.getByTestId('topic-trigger').click();
    await page.getByTestId('topic-option-Cinéma').click();
    await page.getByTestId('topic-option-Géographie').click();
    await page.getByTestId('topic-trigger').click(); // close dropdown

    await page.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(page).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(page).toHaveURL(/\/play\//, { timeout: 15_000 });

    await playToResults(page);

    const topics = getTopics();
    expect(topics).toHaveLength(10);

    const selected = ['CINEMA', 'GEOGRAPHIE'];
    // Each topic must appear at least floor(10/2) = 5 times
    for (const topic of selected) {
      expect(topics.filter((t) => t === topic).length).toBeGreaterThanOrEqual(
        Math.floor(10 / selected.length),
      );
    }
    // No unselected topic should appear
    expect(topics.every((t) => selected.includes(t))).toBe(true);
  });

  test('only selected topic appears when one topic is chosen', async ({ page }) => {
    const getTopics = collectTopicsFromWs(page);

    await page.goto('/create');
    await page.getByPlaceholder('Ex: Marie Curie').fill('SingleTopicPlayer');
    await setRangeToMin(page);

    // Select Cinéma only
    await page.getByTestId('topic-trigger').click();
    await page.getByTestId('topic-option-Cinéma').click();
    await page.getByTestId('topic-trigger').click(); // close dropdown

    await page.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(page).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(page).toHaveURL(/\/play\//, { timeout: 15_000 });

    await playToResults(page);

    const topics = getTopics();
    expect(topics).toHaveLength(10);
    expect(topics.every((t) => t === 'CINEMA')).toBe(true);
  });

  test('total question count matches the configured number', async ({ page }) => {
    const getTopics = collectTopicsFromWs(page);

    await page.goto('/create');
    await page.getByPlaceholder('Ex: Marie Curie').fill('CountVerifier');
    await setRangeToMin(page);
    // Leave topics as Mixte (all), 10 questions (default)

    await page.getByRole('button', { name: 'Créer la partie' }).click();
    await expect(page).toHaveURL(/\/lobby\//, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(page).toHaveURL(/\/play\//, { timeout: 15_000 });

    await playToResults(page);

    expect(getTopics()).toHaveLength(10);
  });
});
