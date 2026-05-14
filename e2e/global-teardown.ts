const API_URL = 'http://localhost:3001';

async function globalTeardown() {
  // Fetch all games and delete those created during the test run
  const startTime = process.env.E2E_START_TIME;
  if (!startTime) return;

  try {
    const res = await fetch(`${API_URL}/games`).catch(() => null);
    if (!res || !res.ok) return;

    // The games endpoint doesn't support bulk listing with filter, so we
    // track codes via the shared env var set by individual tests
    const codes = (process.env.E2E_GAME_CODES ?? '').split(',').filter(Boolean);
    await Promise.all(
      codes.map((code) =>
        fetch(`${API_URL}/games/${code}/cleanup`, { method: 'DELETE' }).catch(() => {}),
      ),
    );
  } catch {
    // teardown is best-effort — never fail the suite here
  }
}

export default globalTeardown;
