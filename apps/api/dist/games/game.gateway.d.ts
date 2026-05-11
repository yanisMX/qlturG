import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { QuestionsService } from '../questions/questions.service';
export declare class GameGateway implements OnGatewayDisconnect {
    private readonly gameService;
    private readonly questionsService;
    server: Server;
    private sessions;
    private roundTimers;
    private activeRounds;
    constructor(gameService: GameService, questionsService: QuestionsService);
    handleDisconnect(client: Socket): Promise<void>;
    handleJoin(client: Socket, data: {
        code: string;
        nickname: string;
    }): Promise<void>;
    handleLeave(client: Socket): Promise<void>;
    handleStart(client: Socket): Promise<void>;
    handleAnswer(client: Socket, data: {
        choiceIndex: number;
    }): Promise<void>;
    handleNext(client: Socket): Promise<void>;
    private sendQuestion;
    private triggerReveal;
    private handleAfterReveal;
}
