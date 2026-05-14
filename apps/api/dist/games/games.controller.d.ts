import { GameService } from './game.service';
import { Difficulty, GameMode, Topic } from '@prisma/client';
declare class CreateGameDto {
    difficulty: Difficulty;
    totalQuestions: number;
    speedBonus: boolean;
    gameMode: GameMode;
    questionDuration: number;
    doublePointsBonus: boolean;
    topics?: Topic[];
}
declare class JoinGameDto {
    code: string;
    nickname: string;
}
export declare class GamesController {
    private readonly gameService;
    constructor(gameService: GameService);
    create(dto: CreateGameDto): Promise<{
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
    join(dto: JoinGameDto): Promise<{
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
    getByCode(code: string): import("@prisma/client").Prisma.Prisma__GameClient<({
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
}
export {};
