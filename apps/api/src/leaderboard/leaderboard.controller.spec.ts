import { LeaderboardController } from './leaderboard.controller';

const makeService = () => ({
  getWeeklyLeaderboard: jest.fn(),
  getMyWeeklyPosition: jest.fn(),
  getUserBadges: jest.fn(),
  getNextWeekStart: jest.fn(),
});

const payload = { sub: 'user-1', pseudo: 'Alice', email: 'alice@test.com' };

describe('LeaderboardController.getLeaderboard', () => {
  it('calls service with default page=1 and limit=20', async () => {
    const service = makeService();
    service.getWeeklyLeaderboard.mockResolvedValue({ entries: [], total: 0, page: 1, limit: 20 });
    const ctrl = new LeaderboardController(service as any);

    await ctrl.getLeaderboard(1, 20);

    expect(service.getWeeklyLeaderboard).toHaveBeenCalledWith(1, 20);
  });

  it('clamps limit to a maximum of 100', async () => {
    const service = makeService();
    service.getWeeklyLeaderboard.mockResolvedValue({ entries: [], total: 0, page: 1, limit: 100 });
    const ctrl = new LeaderboardController(service as any);

    await ctrl.getLeaderboard(1, 500);

    expect(service.getWeeklyLeaderboard).toHaveBeenCalledWith(1, 100);
  });

  it('clamps page to a minimum of 1', async () => {
    const service = makeService();
    service.getWeeklyLeaderboard.mockResolvedValue({ entries: [], total: 0, page: 1, limit: 20 });
    const ctrl = new LeaderboardController(service as any);

    await ctrl.getLeaderboard(0, 20);

    expect(service.getWeeklyLeaderboard).toHaveBeenCalledWith(1, 20);
  });
});

describe('LeaderboardController.getMyPosition', () => {
  it('calls getMyWeeklyPosition with the current user id', async () => {
    const service = makeService();
    service.getMyWeeklyPosition.mockResolvedValue({ rank: 5, points: 3000 });
    const ctrl = new LeaderboardController(service as any);

    const result = await ctrl.getMyPosition(payload as any);

    expect(service.getMyWeeklyPosition).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ rank: 5, points: 3000 });
  });
});

describe('LeaderboardController.getMyBadges', () => {
  it('calls getUserBadges with the current user id', async () => {
    const service = makeService();
    const badges = [{ id: 'b1', tier: 'GOLD', points: 5000, weekStart: new Date() }];
    service.getUserBadges.mockResolvedValue(badges);
    const ctrl = new LeaderboardController(service as any);

    const result = await ctrl.getMyBadges(payload as any);

    expect(service.getUserBadges).toHaveBeenCalledWith('user-1');
    expect(result).toBe(badges);
  });
});

describe('LeaderboardController.getNextReset', () => {
  it('returns the next reset as an ISO string', () => {
    const next = new Date('2026-05-18T00:00:00.000Z');
    const service = makeService();
    service.getNextWeekStart.mockReturnValue(next);
    const ctrl = new LeaderboardController(service as any);

    const result = ctrl.getNextReset();

    expect(result).toEqual({ nextReset: '2026-05-18T00:00:00.000Z' });
  });
});
