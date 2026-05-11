import { Period, Difficulty } from '@prisma/client';
export declare class CreateQuestionDto {
    text: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
    period: Period;
    difficulty: Difficulty;
}
export declare class UpdateQuestionDto {
    text?: string;
    choices?: string[];
    answerIndex?: number;
    explanation?: string;
    period?: Period;
    difficulty?: Difficulty;
}
