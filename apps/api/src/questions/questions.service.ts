import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './questions.dto';
import { Difficulty, Period, Topic } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: { difficulty?: Difficulty; period?: Period }) {
    return this.prisma.question.findMany({
      where: {
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.period && { period: filters.period }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.question.findUnique({ where: { id } });
  }

  create(dto: CreateQuestionDto) {
    return this.prisma.question.create({ data: dto });
  }

  update(id: string, dto: UpdateQuestionDto) {
    return this.prisma.question.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  async getRandomByDifficulty(difficulty: Difficulty, count: number, topics: Topic[] = []) {
    if (topics.length <= 1) {
      const all = await this.prisma.question.findMany({
        where: {
          ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
          ...(topics.length === 1 && { topic: topics[0] }),
        },
      });
      return all.sort(() => Math.random() - 0.5).slice(0, count);
    }

    // Multiple topics: fetch proportionally from each to guarantee an even mix
    const perTopic = Math.ceil(count / topics.length);
    const buckets = await Promise.all(
      topics.map(async (topic) => {
        const all = await this.prisma.question.findMany({
          where: {
            ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
            topic,
          },
        });
        return all.sort(() => Math.random() - 0.5).slice(0, perTopic);
      }),
    );

    return buckets.flat().sort(() => Math.random() - 0.5).slice(0, count);
  }

  async getAllByDifficulty(difficulty: Difficulty, excludeIds: string[] = [], topics: Topic[] = []) {
    if (topics.length <= 1) {
      const all = await this.prisma.question.findMany({
        where: {
          ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
          ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
          ...(topics.length === 1 && { topic: topics[0] }),
        },
      });
      return all.sort(() => Math.random() - 0.5);
    }

    // Multiple topics: fetch each separately and interleave to guarantee a balanced mix
    const buckets = await Promise.all(
      topics.map(async (topic) => {
        const all = await this.prisma.question.findMany({
          where: {
            ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
            ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
            topic,
          },
        });
        return all.sort(() => Math.random() - 0.5);
      }),
    );

    // Round-robin interleave so topics alternate rather than block together
    const result: typeof buckets[0] = [];
    const maxLen = Math.max(...buckets.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        if (i < bucket.length) result.push(bucket[i]);
      }
    }
    return result;
  }
}
