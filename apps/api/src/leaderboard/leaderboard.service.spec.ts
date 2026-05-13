import { LeaderboardService } from './leaderboard.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEK_START = new Date('2026-05-11T00:00:00.000Z'); // Monday
const USER_ID = 'user-1';

const makePrisma = () => ({
  weeklyScore: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  weeklyBadge: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
});

const makeService = (prisma = makePrisma()) =>
  new LeaderboardService(prisma as any);

const makeWeeklyScore = (overrides = {}) => ({
  id: 'ws-1',
  userId: USER_ID,
  weekStart: WEEK_START,
  points: 1000,
  quizzesPlayed: 2,
  answerStreak: 0,
  connectionStreak: 3,
  lastConnectedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── getWeekStart ─────────────────────────────────────────────────────────────

describe('LeaderboardService.getWeekStart', () => {
  let service: LeaderboardService;
  beforeEach(() => { service = makeService(); });

  it('returns Monday UTC midnight for a Wednesday in Paris', () => {
    // 2026-05-13 = Wednesday. Paris UTC+2 in May → 10:00Z = 12:00 Paris
    const result = service.getWeekStart(new Date('2026-05-13T10:00:00.000Z'));
    expect(result.toISOString()).toBe('2026-05-11T00:00:00.000Z');
  });

  it('returns the same Monday for a Monday input', () => {
    // 2026-05-11 = Monday
    const result = service.getWeekStart(new Date('2026-05-11T06:00:00.000Z'));
    expect(result.toISOString()).toBe('2026-05-11T00:00:00.000Z');
  });

  it('returns the previous Monday for a Sunday', () => {
    // 2026-05-10 = Sunday — belongs to the week starting 2026-05-04
    const result = service.getWeekStart(new Date('2026-05-10T10:00:00.000Z'));
    expect(result.toISOString()).toBe('2026-05-04T00:00:00.000Z');
  });

  it('returns correct Monday for a Saturday', () => {
    // 2026-05-16 = Saturday — belongs to the week starting 2026-05-11
    const result = service.getWeekStart(new Date('2026-05-16T10:00:00.000Z'));
    expect(result.toISOString()).toBe('2026-05-11T00:00:00.000Z');
  });

  it('getNextWeekStart returns exactly 7 days after getWeekStart', () => {
    const now = new Date('2026-05-13T10:00:00.000Z');
    const ws = service.getWeekStart(now);
    const next = service.getNextWeekStart(now);
    expect(next.getTime() - ws.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

// ─── computeTier (via private access) ────────────────────────────────────────

describe('LeaderboardService.computeTier', () => {
  let service: LeaderboardService;
  beforeEach(() => { service = makeService(); });

  const tier = (points: number, rank: number, total: number) =>
    (service as any).computeTier(points, rank, total);

  describe('percentile mode (≥100 active players)', () => {
    it('top 1% → PLATINUM', () => {
      expect(tier(99999, 1, 100)).toBe('PLATINUM');
    });

    it('rank 2 of 100 (2%) → GOLD', () => {
      expect(tier(8000, 2, 100)).toBe('GOLD');
    });

    it('rank 15 of 100 (15%) → SILVER', () => {
      expect(tier(3000, 15, 100)).toBe('SILVER');
    });

    it('rank 50 of 100 (50%) → BRONZE', () => {
      expect(tier(500, 50, 100)).toBe('BRONZE');
    });

    it('rank 10 of 100 (exactly 10%) → GOLD (inclusive boundary)', () => {
      expect(tier(5000, 10, 100)).toBe('GOLD');
    });

    it('rank 30 of 100 (exactly 30%) → SILVER (inclusive boundary)', () => {
      expect(tier(2000, 30, 100)).toBe('SILVER');
    });
  });

  describe('fixed-threshold fallback (<100 active players)', () => {
    it('≥10 000 pts → PLATINUM', () => {
      expect(tier(10000, 1, 10)).toBe('PLATINUM');
    });

    it('≥5 000 pts → GOLD', () => {
      expect(tier(5000, 2, 10)).toBe('GOLD');
    });

    it('≥2 000 pts → SILVER', () => {
      expect(tier(2000, 3, 10)).toBe('SILVER');
    });

    it('<2 000 pts → BRONZE', () => {
      expect(tier(1999, 4, 10)).toBe('BRONZE');
    });

    it('0 pts → BRONZE', () => {
      expect(tier(0, 10, 10)).toBe('BRONZE');
    });
  });
});

// ─── creditGamePoints ─────────────────────────────────────────────────────────

describe('LeaderboardService.creditGamePoints', () => {
  it('credits game points without malus when not abandoned', async () => {
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore());
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.creditGamePoints(USER_ID, 800, false);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quizzesPlayed: { increment: 1 } } }),
    );
    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { points: { increment: 800 } } }),
    );
  });

  it('applies 100pt malus and keeps points above 0 when abandoned', async () => {
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore());
    prisma.weeklyScore.update.mockResolvedValue({});
    // Current points = 1000, game points = 200, malus = 100 → net = 1000 + 200 - 100 = 1100
    prisma.weeklyScore.findUnique.mockResolvedValue(makeWeeklyScore({ points: 1000 }));

    const service = makeService(prisma);
    await service.creditGamePoints(USER_ID, 200, true);

    expect(prisma.weeklyScore.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { points: 1100 } }),
    );
  });

  it('floors weekly score at 0 when malus exceeds game points + current score', async () => {
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore({ points: 0 }));
    prisma.weeklyScore.update.mockResolvedValue({});
    // Current = 0, game points = 50, malus = 100 → 0 + 50 - 100 = -50 → clamp to 0
    prisma.weeklyScore.findUnique.mockResolvedValue(makeWeeklyScore({ points: 0 }));

    const service = makeService(prisma);
    await service.creditGamePoints(USER_ID, 50, true);

    expect(prisma.weeklyScore.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { points: 0 } }),
    );
  });

  it('always increments quizzesPlayed', async () => {
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore());
    prisma.weeklyScore.update.mockResolvedValue({});
    prisma.weeklyScore.findUnique.mockResolvedValue(makeWeeklyScore({ points: 500 }));

    const service = makeService(prisma);
    await service.creditGamePoints(USER_ID, 0, true);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quizzesPlayed: { increment: 1 } } }),
    );
  });
});

// ─── applyAnswerStreakBonus ────────────────────────────────────────────────────

describe('LeaderboardService.applyAnswerStreakBonus', () => {
  it('adds 200 points to weekly score', async () => {
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore());
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.applyAnswerStreakBonus(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { points: { increment: 200 } } }),
    );
  });
});

// ─── recordDailyLogin ─────────────────────────────────────────────────────────

describe('LeaderboardService.recordDailyLogin', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sets streak to 1 on first login (no lastConnectedAt)', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z'));
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(makeWeeklyScore({ lastConnectedAt: null }));
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ connectionStreak: 1 }) }),
    );
  });

  it('is a no-op when called twice the same Paris day', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z')); // Paris: Wed 12:00
    const prisma = makePrisma();
    // lastConnectedAt = same Paris day (09:00 UTC = 11:00 Paris)
    prisma.weeklyScore.upsert.mockResolvedValue(
      makeWeeklyScore({ lastConnectedAt: new Date('2026-05-13T09:00:00.000Z') }),
    );

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).not.toHaveBeenCalled();
  });

  it('increments streak when called on a consecutive day', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z')); // Wednesday
    const prisma = makePrisma();
    // lastConnectedAt = Tuesday (exactly 1 day ago)
    prisma.weeklyScore.upsert.mockResolvedValue(
      makeWeeklyScore({
        connectionStreak: 3,
        lastConnectedAt: new Date('2026-05-12T10:00:00.000Z'),
      }),
    );
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ connectionStreak: 4 }),
      }),
    );
  });

  it('resets streak to 1 after a missed day', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z')); // Wednesday
    const prisma = makePrisma();
    // lastConnectedAt = Monday (2 days ago → gap)
    prisma.weeklyScore.upsert.mockResolvedValue(
      makeWeeklyScore({
        connectionStreak: 5,
        lastConnectedAt: new Date('2026-05-11T10:00:00.000Z'),
      }),
    );
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ connectionStreak: 1 }),
      }),
    );
  });

  it('awards +500 bonus on the 7th consecutive day', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z'));
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(
      makeWeeklyScore({
        connectionStreak: 6, // 6 → 7 = threshold
        lastConnectedAt: new Date('2026-05-12T10:00:00.000Z'),
      }),
    );
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ connectionStreak: 7, points: { increment: 500 } }),
      }),
    );
  });

  it('does not award bonus below the 7-day threshold', async () => {
    jest.setSystemTime(new Date('2026-05-13T10:00:00.000Z'));
    const prisma = makePrisma();
    prisma.weeklyScore.upsert.mockResolvedValue(
      makeWeeklyScore({
        connectionStreak: 4,
        lastConnectedAt: new Date('2026-05-12T10:00:00.000Z'),
      }),
    );
    prisma.weeklyScore.update.mockResolvedValue({});

    const service = makeService(prisma);
    await service.recordDailyLogin(USER_ID);

    expect(prisma.weeklyScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ connectionStreak: 5 }),
      }),
    );
    // Ensure no points increment was included
    const callArg = prisma.weeklyScore.update.mock.calls[0][0];
    expect(callArg.data.points).toBeUndefined();
  });
});

// ─── runWeeklyReset ───────────────────────────────────────────────────────────

describe('LeaderboardService.runWeeklyReset', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('creates a badge for each player in the previous week', async () => {
    // Simulate a Monday reset — "now" is Monday 2026-05-18
    jest.setSystemTime(new Date('2026-05-18T00:01:00.000Z'));
    const prisma = makePrisma();
    const lastWeekScores = [
      { userId: 'u1', points: 12000 }, // PLATINUM (fallback, <100 players)
      { userId: 'u2', points: 6000 },  // GOLD
      { userId: 'u3', points: 500 },   // BRONZE
    ];
    prisma.weeklyScore.findMany.mockResolvedValue(lastWeekScores);
    prisma.weeklyBadge.upsert.mockResolvedValue({});

    const service = makeService(prisma);
    await service.runWeeklyReset();

    expect(prisma.weeklyBadge.upsert).toHaveBeenCalledTimes(3);
    expect(prisma.weeklyBadge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'u1', tier: 'PLATINUM' }) }),
    );
    expect(prisma.weeklyBadge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'u2', tier: 'GOLD' }) }),
    );
    expect(prisma.weeklyBadge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'u3', tier: 'BRONZE' }) }),
    );
  });

  it('does nothing when no players were active last week', async () => {
    jest.setSystemTime(new Date('2026-05-18T00:01:00.000Z'));
    const prisma = makePrisma();
    prisma.weeklyScore.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    await service.runWeeklyReset();

    expect(prisma.weeklyBadge.upsert).not.toHaveBeenCalled();
  });
});

// ─── answerStreakThreshold ─────────────────────────────────────────────────────

describe('LeaderboardService.answerStreakThreshold', () => {
  it('exposes the threshold value of 5', () => {
    const service = makeService();
    expect(service.answerStreakThreshold).toBe(5);
  });
});
