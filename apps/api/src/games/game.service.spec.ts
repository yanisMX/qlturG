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
  const makeGame = (topic: string | null) => ({
    id: 'g1',
    status: GameStatus.LOBBY,
    gameMode: GameMode.STANDARD,
    difficulty: 'MOYEN',
    totalQuestions: 10,
    topic,
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

  it('passes topic to getRandomByDifficulty when topic is defined', async () => {
    const questions = makeQuestions(10);
    const { prisma, questionsService } = makeDeps(makeGame('CINEMA'), questions);
    const service = new GameService(prisma as any, questionsService as any);

    await service.startGame('g1');

    expect(questionsService.getRandomByDifficulty).toHaveBeenCalledWith('MOYEN', 10, 'CINEMA');
  });

  it('passes undefined topic to getRandomByDifficulty when topic is null', async () => {
    const questions = makeQuestions(10);
    const { prisma, questionsService } = makeDeps(makeGame(null), questions);
    const service = new GameService(prisma as any, questionsService as any);

    await service.startGame('g1');

    expect(questionsService.getRandomByDifficulty).toHaveBeenCalledWith('MOYEN', 10, undefined);
  });
});
