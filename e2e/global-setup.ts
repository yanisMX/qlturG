import { chromium } from '@playwright/test';

const API_URL = 'http://localhost:3001';

async function globalSetup() {
  // Verify the API is reachable and has questions seeded
  const res = await fetch(`${API_URL}/questions`).catch(() => null);
  if (!res || !res.ok) {
    throw new Error('API not reachable at http://localhost:3001 — run `pnpm dev` first');
  }
  const questions: unknown[] = await res.json();
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions in DB — run `pnpm db:seed` first');
  }

  // Record start timestamp so teardown can clean up games created during tests
  process.env.E2E_START_TIME = new Date().toISOString();

  // Warm up browser to avoid cold-start skewing first test
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173').catch(() => {});
  await browser.close();
}

export default globalSetup;
