import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './questions.dto';
import { Difficulty, Period } from '@prisma/client';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    private checkAdmin;
    findAll(difficulty?: Difficulty, period?: Period): import("@prisma/client").Prisma.PrismaPromise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }>;
    create(key: string, dto: CreateQuestionDto): import("@prisma/client").Prisma.Prisma__QuestionClient<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(key: string, id: string, dto: UpdateQuestionDto): Promise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }>;
    remove(key: string, id: string): Promise<{
        text: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
        period: import("@prisma/client").$Enums.Period;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
    }>;
}
