import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './questions.dto';
import { Difficulty, Period } from '@prisma/client';
export declare class QuestionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(filters: {
        difficulty?: Difficulty;
        period?: Period;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__QuestionClient<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(dto: CreateQuestionDto): import("@prisma/client").Prisma.Prisma__QuestionClient<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: UpdateQuestionDto): import("@prisma/client").Prisma.Prisma__QuestionClient<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__QuestionClient<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    getRandomByDifficulty(difficulty: Difficulty, count: number): Promise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }[]>;
}
