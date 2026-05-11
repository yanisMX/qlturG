import { GameService } from './game.service';

describe('GameService.calculateScore', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService({} as any, {} as any);
  });

  it('returns 1000 points for instant correct answer without speed bonus', () => {
    const result = service.calculateScore(true, false, 100);
    expect(result.points).toBe(1000);
    expect(result.isCorrect).toBe(true);
  });

  it('returns 1000 points for instant correct answer with speed bonus', () => {
    const result = service.calculateScore(true, true, 0);
    expect(result.points).toBe(1000);
    expect(result.isCorrect).toBe(true);
  });

  it('returns ~750 points for correct answer at 5s remaining with speed bonus', () => {
    const result = service.calculateScore(true, true, 5000);
    expect(result.points).toBe(750);
    expect(result.isCorrect).toBe(true);
  });

  it('returns 500 points for correct answer at last second with speed bonus', () => {
    const result = service.calculateScore(true, true, 9999);
    expect(result.points).toBeGreaterThanOrEqual(500);
    expect(result.points).toBeLessThan(501);
    expect(result.isCorrect).toBe(true);
  });

  it('returns 0 points for wrong answer regardless of speed bonus', () => {
    const withBonus = service.calculateScore(false, true, 100);
    expect(withBonus.points).toBe(0);
    expect(withBonus.isCorrect).toBe(false);

    const withoutBonus = service.calculateScore(false, false, 100);
    expect(withoutBonus.points).toBe(0);
    expect(withoutBonus.isCorrect).toBe(false);
  });

  it('returns 0 points for wrong answer at 0ms', () => {
    const result = service.calculateScore(false, true, 0);
    expect(result.points).toBe(0);
  });

  it('clamps to 500 minimum for very late correct answer with speed bonus', () => {
    const result = service.calculateScore(true, true, 10500);
    expect(result.points).toBe(500);
  });
});
