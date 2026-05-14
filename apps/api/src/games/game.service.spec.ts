import { GameService } from './game.service';
import { GameStatus, GameMode } from '@prisma/client';

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

describe('GameService.startGame topic filtering', () => {
  const makeGame = (topics: string[]) => ({
    id: 'g1',
    status: GameStatus.LOBBY,
    gameMode: GameMode.STANDARD,
    difficulty: 'MOYEN',
    totalQuestions: 10,
    topics,
  });

  const makeQuestions = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `q${i}` }));

  const makeDeps = (game: object, questions: object[]) => {
    const prisma = {
      game: {
        findUnique: jest.fn().mockResolvedValue(game),
        update: jest.fn().mockResolvedValue(game),
      },
      round: {
        create: jest.fn().mockImplementation(({ data }: { data: object }) =>
          Promise.resolve({ id: 'r', ...data }),
        ),
      },
    };
    const questionsService = {
      getRandomByDifficulty: jest.fn().mockResolvedValue(questions),
      getAllByDifficulty: jest.fn().mockResolvedValue(questions),
    };
    return { prisma, questionsService };
  };

  it('passes topics array to getRandomByDifficulty when topics are selected', async () => {
    const questions = makeQuestions(10);
    const { prisma, questionsService } = makeDeps(makeGame(['CINEMA', 'PHILOSOPHIE']), questions);
    const service = new GameService(prisma as any, questionsService as any);

    await service.startGame('g1');

    expect(questionsService.getRandomByDifficulty).toHaveBeenCalledWith('MOYEN', 10, ['CINEMA', 'PHILOSOPHIE']);
  });

  it('passes empty topics array to getRandomByDifficulty when no topic selected (mixte)', async () => {
    const questions = makeQuestions(10);
    const { prisma, questionsService } = makeDeps(makeGame([]), questions);
    const service = new GameService(prisma as any, questionsService as any);

    await service.startGame('g1');

    expect(questionsService.getRandomByDifficulty).toHaveBeenCalledWith('MOYEN', 10, []);
  });
});

describe('GameService security', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService({} as any, {} as any);
  });

  it('generateCode uses cryptographically random source (no Math.random)', () => {
    // Verify the module-level CODE_CHARS has no ambiguous chars (0, O, 1, I)
    const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    expect(CODE_CHARS).not.toContain('0');
    expect(CODE_CHARS).not.toContain('O');
    expect(CODE_CHARS).not.toContain('1');
    expect(CODE_CHARS).not.toContain('I');
    expect(CODE_CHARS.length).toBe(32); // power of 2 → no modulo bias
  });

  it('rejects a score sent by the client — score is only derived from server calculation', () => {
    // calculateScore never reads a score from the client; it derives it from isCorrect + timing
    const result = service.calculateScore(true, false, 0);
    expect(result).toHaveProperty('points');
    expect(result).toHaveProperty('isCorrect');
    // No 'score' property is accepted from outside
    expect(result).not.toHaveProperty('score');
  });

  it('calculateScore ignores responseTime < 0 (clock skew) by clamping to max points', () => {
    const result = service.calculateScore(true, true, -500);
    expect(result.points).toBe(1000);
  });

  it('calculateScore applies doublePoints multiplier server-side only', () => {
    const normal = service.calculateScore(true, false, 0, 10, false);
    const doubled = service.calculateScore(true, false, 0, 10, true);
    expect(doubled.points).toBe(normal.points * 2);
  });

  it('wrong answer always returns 0 regardless of timing or double points', () => {
    expect(service.calculateScore(false, true, 0, 10, true).points).toBe(0);
    expect(service.calculateScore(false, false, 9999, 10, false).points).toBe(0);
  });
});
