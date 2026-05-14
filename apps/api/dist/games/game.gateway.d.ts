import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';
import { QuestionsService } from '../questions/questions.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
export declare class GameGateway implements OnGatewayDisconnect {
    private readonly gameService;
    private readonly questionsService;
    private readonly jwtService;
    private readonly leaderboardService;
    server: Server;
    private sessions;
    private roundTimers;
    private activeRounds;
    private answerStreaks;
    constructor(gameService: GameService, questionsService: QuestionsService, jwtService: JwtService, leaderboardService: LeaderboardService);
    handleDisconnect(client: Socket): Promise<void>;
    handleJoin(client: Socket, data: {
        code: string;
        nickname: string;
    }): Promise<void>;
    handleLeave(client: Socket): Promise<void>;
    handleKick(client: Socket, data: {
        playerId: string;
    }): Promise<void>;
    handleStart(client: Socket): Promise<void>;
    handleRematch(client: Socket): Promise<void>;
    handleAnswer(client: Socket, data: {
        choiceIndex: number;
    }): Promise<void>;
    handleNext(client: Socket): Promise<void>;
    private creditWeeklyScores;
    private finishGame;
    private sendQuestion;
    private triggerReveal;
    private handleAfterReveal;
}
