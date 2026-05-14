import { QuestionsService } from './questions.service';
import { Difficulty, Topic } from '@prisma/client';

type MinimalQuestion = { id: string; topic: Topic };

function makeQuestions(topic: Topic, count: number): MinimalQuestion[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${topic}-${i}`, topic }));
}

function makePrisma(questionsByTopic: Record<string, MinimalQuestion[]>) {
  return {
    question: {
      findMany: jest.fn().mockImplementation(
        ({ where }: { where?: { topic?: Topic; id?: { notIn: string[] } } }) => {
          const allForTopic: MinimalQuestion[] = where?.topic
            ? (questionsByTopic[where.topic] ?? [])
            : Object.values(questionsByTopic).flat();
          const notIn = where?.id?.notIn ?? [];
          return Promise.resolve(allForTopic.filter((q) => !notIn.includes(q.id)));
        },
      ),
    },
  };
}

describe('QuestionsService.getRandomByDifficulty', () => {
  const D = 'MOYEN' as Difficulty;

  it('returns exactly count questions when no topic is selected', async () => {
    const prisma = makePrisma({ HISTOIRE: makeQuestions('HISTOIRE' as Topic, 20) });
    const service = new QuestionsService(prisma as any);
    const result = await service.getRandomByDifficulty(D, 10);
    expect(result).toHaveLength(10);
  });

  it('returns exactly count questions for a single topic', async () => {
    const prisma = makePrisma({ CINEMA: makeQuestions('CINEMA' as Topic, 20) });
    const service = new QuestionsService(prisma as any);
    const result = await service.getRandomByDifficulty(D, 10, ['CINEMA' as Topic]);
    expect(result).toHaveLength(10);
    expect(result.every((q) => q.topic === 'CINEMA')).toBe(true);
  });

  it('distributes equitably across 2 topics — each gets at least floor(count/N)', async () => {
    const topics = ['CINEMA', 'GEOGRAPHIE'] as Topic[];
    const prisma = makePrisma(Object.fromEntries(topics.map((t) => [t, makeQuestions(t, 20)])));
    const service = new QuestionsService(prisma as any);

    const result = await service.getRandomByDifficulty(D, 10, topics);

    expect(result).toHaveLength(10);
    const min = Math.floor(10 / topics.length);
    for (const topic of topics) {
      expect(result.filter((q) => q.topic === topic).length).toBeGreaterThanOrEqual(min);
    }
  });

  it('distributes equitably across 4 topics with 10 questions — each gets at least 2', async () => {
    const topics = ['CINEMA', 'GEOGRAPHIE', 'HISTOIRE', 'PHILOSOPHIE'] as Topic[];
    const prisma = makePrisma(Object.fromEntries(topics.map((t) => [t, makeQuestions(t, 20)])));
    const service = new QuestionsService(prisma as any);

    const result = await service.getRandomByDifficulty(D, 10, topics);

    expect(result).toHaveLength(10);
    for (const topic of topics) {
      expect(result.filter((q) => q.topic === topic).length).toBeGreaterThanOrEqual(
        Math.floor(10 / topics.length),
      );
    }
  });

  it('no selected topic is ignored when questions are available', async () => {
    const topics = ['CINEMA', 'GEOGRAPHIE', 'HISTOIRE'] as Topic[];
    const prisma = makePrisma(Object.fromEntries(topics.map((t) => [t, makeQuestions(t, 20)])));
    const service = new QuestionsService(prisma as any);

    const result = await service.getRandomByDifficulty(D, 9, topics);

    for (const topic of topics) {
      expect(result.filter((q) => q.topic === topic).length).toBeGreaterThan(0);
    }
  });

  it('does not include questions from unselected topics', async () => {
    const selected = ['CINEMA', 'GEOGRAPHIE'] as Topic[];
    const prisma = makePrisma(
      Object.fromEntries(selected.map((t) => [t, makeQuestions(t, 20)])),
    );
    const service = new QuestionsService(prisma as any);

    const result = await service.getRandomByDifficulty(D, 10, selected);

    expect(result.every((q) => selected.includes(q.topic))).toBe(true);
  });
});

describe('QuestionsService.getAllByDifficulty', () => {
  const D = 'MOYEN' as Difficulty;

  it('returns all questions from a single topic', async () => {
    const prisma = makePrisma({ CINEMA: makeQuestions('CINEMA' as Topic, 5) });
    const service = new QuestionsService(prisma as any);

    const result = await service.getAllByDifficulty(D, [], ['CINEMA' as Topic]);

    expect(result).toHaveLength(5);
    expect(result.every((q) => q.topic === 'CINEMA')).toBe(true);
  });

  it('interleaves questions from 2 topics of equal size', async () => {
    const topics = ['CINEMA', 'GEOGRAPHIE'] as Topic[];
    const prisma = makePrisma(Object.fromEntries(topics.map((t) => [t, makeQuestions(t, 3)])));
    const service = new QuestionsService(prisma as any);

    const result = await service.getAllByDifficulty(D, [], topics);

    expect(result).toHaveLength(6);
    // Each topic should appear exactly 3 times
    for (const topic of topics) {
      expect(result.filter((q) => q.topic === topic)).toHaveLength(3);
    }
    // No two consecutive questions should have the same topic (round-robin interleave)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].topic).not.toBe(result[i + 1].topic);
    }
  });

  it('respects excludeIds', async () => {
    const questions = makeQuestions('CINEMA' as Topic, 10);
    const excludeIds = [questions[0].id, questions[1].id];
    const prisma = makePrisma({ CINEMA: questions });
    const service = new QuestionsService(prisma as any);

    const result = await service.getAllByDifficulty(D, excludeIds, ['CINEMA' as Topic]);

    expect(result.every((q) => !excludeIds.includes(q.id))).toBe(true);
  });

  it('does not include questions from unselected topics', async () => {
    const selected = ['CINEMA'] as Topic[];
    const prisma = makePrisma({ CINEMA: makeQuestions('CINEMA' as Topic, 5) });
    const service = new QuestionsService(prisma as any);

    const result = await service.getAllByDifficulty(D, [], selected);

    expect(result.every((q) => q.topic === 'CINEMA')).toBe(true);
  });
});
