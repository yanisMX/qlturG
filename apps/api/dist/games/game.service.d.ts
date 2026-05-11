import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';
import { Difficulty } from '@prisma/client';
import { ScoreResult } from './game.types';
export declare class GameService {
    private readonly prisma;
    private readonly questionsService;
    constructor(prisma: PrismaService, questionsService: QuestionsService);
    calculateScore(isCorrect: boolean, speedBonus: boolean, responseTimeMs: number): ScoreResult;
    private generateCode;
    private generateUniqueCode;
    createGame(params: {
        difficulty: Difficulty;
        totalQuestions: number;
        speedBonus: boolean;
    }): Promise<{
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        speedBonus: boolean;
        totalQuestions: number;
        currentQuestionIndex: number;
    }>;
    setHost(gameId: string, playerId: string): Promise<{
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        speedBonus: boolean;
        totalQuestions: number;
        currentQuestionIndex: number;
    }>;
    joinGame(params: {
        code: string;
        nickname: string;
    }): Promise<{
        game: ({
            players: {
                id: string;
                nickname: string;
                score: number;
                socketId: string | null;
                gameId: string;
            }[];
            rounds: {
                id: string;
                gameId: string;
                orderIndex: number;
                questionId: string;
                startedAt: Date | null;
            }[];
        } & {
            difficulty: import("@prisma/client").$Enums.Difficulty;
            id: string;
            createdAt: Date;
            code: string;
            hostId: string;
            status: import("@prisma/client").$Enums.GameStatus;
            speedBonus: boolean;
            totalQuestions: number;
            currentQuestionIndex: number;
        }) | null;
        player: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            gameId: string;
        };
    }>;
    startGame(gameId: string): Promise<{
        rounds: {
            id: string;
            gameId: string;
            orderIndex: number;
            questionId: string;
            startedAt: Date | null;
        }[];
        questions: {
            text: string;
            choices: string[];
            answerIndex: number;
            explanation: string;
            period: import("@prisma/client").$Enums.Period;
            difficulty: import("@prisma/client").$Enums.Difficulty;
            id: string;
            createdAt: Date;
        }[];
    }>;
    recordAnswer(params: {
        playerId: string;
        roundId: string;
        choiceIndex: number;
        answeredAt: Date;
        roundStartedAt: Date;
        correctAnswerIndex: number;
        speedBonus: boolean;
    }): Promise<{
        id: string;
        choiceIndex: number;
        isCorrect: boolean;
        pointsEarned: number;
        answeredAt: Date;
        responseTimeMs: number;
        playerId: string;
        roundId: string;
    }>;
    getRoundReveal(roundId: string, gameId: string): Promise<{
        answerIndex: number;
        explanation: string;
        scores: {
            playerId: string;
            nickname: string;
            score: number;
            deltaThisRound: number;
        }[];
    }>;
    advanceQuestion(gameId: string): Promise<{
        finished: boolean;
        nextIndex?: undefined;
    } | {
        finished: boolean;
        nextIndex: number;
    }>;
    getFinalRanking(gameId: string): Promise<{
        rank: number;
        playerId: string;
        nickname: string;
        score: number;
    }[]>;
    getGameWithPlayers(gameId: string): import("@prisma/client").Prisma.Prisma__GameClient<({
        players: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            gameId: string;
        }[];
        rounds: {
            id: string;
            gameId: string;
            orderIndex: number;
            questionId: string;
            startedAt: Date | null;
        }[];
    } & {
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        speedBonus: boolean;
        totalQuestions: number;
        currentQuestionIndex: number;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    getGameByCode(code: string): import("@prisma/client").Prisma.Prisma__GameClient<({
        players: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            gameId: string;
        }[];
    } & {
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        speedBonus: boolean;
        totalQuestions: number;
        currentQuestionIndex: number;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    updatePlayerSocket(playerId: string, socketId: string | null): Promise<{
        id: string;
        nickname: string;
        score: number;
        socketId: string | null;
        gameId: string;
    }>;
}
