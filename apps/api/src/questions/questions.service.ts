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

  async getRandomByDifficulty(difficulty: Difficulty, count: number, topic?: Topic) {
    const all = await this.prisma.question.findMany({
      where: {
        ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
        ...(topic && { topic }),
      },
    });
    return all.sort(() => Math.random() - 0.5).slice(0, count);
  }

  async getAllByDifficulty(difficulty: Difficulty, excludeIds: string[] = [], topic?: Topic) {
    const all = await this.prisma.question.findMany({
      where: {
        ...(difficulty !== ('VARIE' as Difficulty) && { difficulty }),
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        ...(topic && { topic }),
      },
    });
    return all.sort(() => Math.random() - 0.5);
  }
}
