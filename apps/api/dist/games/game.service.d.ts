import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';
import { Difficulty, GameMode, Topic } from '@prisma/client';
import { ScoreResult } from './game.types';
export declare class GameService {
    private readonly prisma;
    private readonly questionsService;
    constructor(prisma: PrismaService, questionsService: QuestionsService);
    calculateScore(isCorrect: boolean, speedBonus: boolean, responseTimeMs: number, questionDuration?: number, isDoublePoints?: boolean): ScoreResult;
    private generateCode;
    private generateUniqueCode;
    createGame(params: {
        difficulty: Difficulty;
        totalQuestions: number;
        speedBonus: boolean;
        gameMode: GameMode;
        questionDuration: number;
        doublePointsBonus: boolean;
        topics?: Topic[];
    }): Promise<{
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        topics: import("@prisma/client").$Enums.Topic[];
        gameMode: import("@prisma/client").$Enums.GameMode;
        speedBonus: boolean;
        doublePointsBonus: boolean;
        totalQuestions: number;
        questionDuration: number;
        currentQuestionIndex: number;
    }>;
    setHost(gameId: string, playerId: string): Promise<{
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        topics: import("@prisma/client").$Enums.Topic[];
        gameMode: import("@prisma/client").$Enums.GameMode;
        speedBonus: boolean;
        doublePointsBonus: boolean;
        totalQuestions: number;
        questionDuration: number;
        currentQuestionIndex: number;
    }>;
    joinGame(params: {
        code: string;
        nickname: string;
        userId?: string;
    }): Promise<{
        game: ({
            players: {
                id: string;
                nickname: string;
                score: number;
                socketId: string | null;
                lives: number;
                eliminated: boolean;
                gameId: string;
                userId: string | null;
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
            topics: import("@prisma/client").$Enums.Topic[];
            gameMode: import("@prisma/client").$Enums.GameMode;
            speedBonus: boolean;
            doublePointsBonus: boolean;
            totalQuestions: number;
            questionDuration: number;
            currentQuestionIndex: number;
        }) | null;
        player: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            lives: number;
            eliminated: boolean;
            gameId: string;
            userId: string | null;
        };
    }>;
    getPlayersWithUser(gameId: string): Promise<{
        id: string;
        score: number;
        socketId: string | null;
        userId: string | null;
    }[]>;
    createPlayerForRematch(params: {
        nickname: string;
        gameId: string;
        userId?: string;
    }): Promise<{
        id: string;
        nickname: string;
        score: number;
        socketId: string | null;
        lives: number;
        eliminated: boolean;
        gameId: string;
        userId: string | null;
    }>;
    kickPlayer(gameId: string, playerId: string): Promise<{
        id: string;
        nickname: string;
        score: number;
        socketId: string | null;
        lives: number;
        eliminated: boolean;
        gameId: string;
        userId: string | null;
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
            topic: import("@prisma/client").$Enums.Topic;
            createdAt: Date;
        }[];
    }>;
    extendSurvivalRounds(gameId: string, usedQuestionIds: string[], difficulty: Difficulty, startOrderIndex: number): Promise<{
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
            topic: import("@prisma/client").$Enums.Topic;
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
        questionDuration: number;
        isDoublePoints: boolean;
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
    decrementLife(playerId: string): Promise<{
        lives: number;
        eliminated: boolean;
    }>;
    getActivePlayers(gameId: string): Promise<{
        id: string;
        nickname: string;
        score: number;
        socketId: string | null;
        lives: number;
        eliminated: boolean;
        gameId: string;
        userId: string | null;
    }[]>;
    getRoundReveal(roundId: string, gameId: string): Promise<{
        answerIndex: number;
        explanation: string;
        scores: {
            playerId: string;
            nickname: string;
            score: number;
            deltaThisRound: number;
            lives: number;
            eliminated: boolean;
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
        lives: number;
        eliminated: boolean;
    }[]>;
    getGameWithPlayers(gameId: string): import("@prisma/client").Prisma.Prisma__GameClient<({
        players: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            lives: number;
            eliminated: boolean;
            gameId: string;
            userId: string | null;
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
        topics: import("@prisma/client").$Enums.Topic[];
        gameMode: import("@prisma/client").$Enums.GameMode;
        speedBonus: boolean;
        doublePointsBonus: boolean;
        totalQuestions: number;
        questionDuration: number;
        currentQuestionIndex: number;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    getGameByCode(code: string): import("@prisma/client").Prisma.Prisma__GameClient<({
        players: {
            id: string;
            nickname: string;
            score: number;
            socketId: string | null;
            lives: number;
            eliminated: boolean;
            gameId: string;
            userId: string | null;
        }[];
    } & {
        difficulty: import("@prisma/client").$Enums.Difficulty;
        id: string;
        createdAt: Date;
        code: string;
        hostId: string;
        status: import("@prisma/client").$Enums.GameStatus;
        topics: import("@prisma/client").$Enums.Topic[];
        gameMode: import("@prisma/client").$Enums.GameMode;
        speedBonus: boolean;
        doublePointsBonus: boolean;
        totalQuestions: number;
        questionDuration: number;
        currentQuestionIndex: number;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    updatePlayerSocket(playerId: string, socketId: string | null): Promise<{
        id: string;
        nickname: string;
        score: number;
        socketId: string | null;
        lives: number;
        eliminated: boolean;
        gameId: string;
        userId: string | null;
    }>;
}
