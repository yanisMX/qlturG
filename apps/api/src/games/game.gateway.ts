import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { QuestionsService } from '../questions/questions.service';
import { Question, Round } from '@prisma/client';

interface SessionData {
  playerId: string;
  gameId: string;
  isHost: boolean;
}

interface ActiveRoundData {
  round: Round;
  question: Question;
  startedAt: Date;
  allRounds: Round[];
  allQuestions: Question[];
}

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private sessions = new Map<string, SessionData>();
  private roundTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private activeRounds = new Map<string, ActiveRoundData>();

  constructor(
    private readonly gameService: GameService,
    private readonly questionsService: QuestionsService,
  ) {}

  async handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    await this.gameService.updatePlayerSocket(session.playerId, null);
    this.sessions.delete(client.id);

    this.server.to(`game:${session.gameId}`).emit('game:player-left', {
      playerId: session.playerId,
    });
  }

  @SubscribeMessage('game:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; nickname: string },
  ) {
    try {
      const { game, player } = await this.gameService.joinGame({
        code: data.code,
        nickname: data.nickname,
      });

      if (!game) {
        client.emit('game:error', { message: 'Game not found' });
        return;
      }

      await this.gameService.updatePlayerSocket(player.id, client.id);

      // First player to join becomes host
      let isHost = game.hostId === player.id;
      if (game.hostId === 'pending') {
        await this.gameService.setHost(game.id, player.id);
        isHost = true;
      }
      this.sessions.set(client.id, { playerId: player.id, gameId: game.id, isHost });

      await client.join(`game:${game.id}`);

      const hostId = isHost ? player.id : game.hostId;
      client.emit('game:state', {
        gameId: game.id,
        code: game.code,
        status: game.status,
        difficulty: game.difficulty,
        speedBonus: game.speedBonus,
        totalQuestions: game.totalQuestions,
        hostId,
        players: game.players.map((p) => ({ id: p.id, nickname: p.nickname, score: p.score })),
        yourPlayerId: player.id,
        isHost,
      });

      this.server.to(`game:${game.id}`).emit('game:player-joined', {
        playerId: player.id,
        nickname: player.nickname,
        score: 0,
      });
    } catch (err: unknown) {
      client.emit('game:error', { message: err instanceof Error ? err.message : 'Failed to join game' });
    }
  }

  @SubscribeMessage('game:leave')
  async handleLeave(@ConnectedSocket() client: Socket) {
    await this.handleDisconnect(client);
    client.emit('game:state', { left: true });
  }

  @SubscribeMessage('game:start')
  async handleStart(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session?.isHost) {
      client.emit('game:error', { message: 'Only the host can start the game' });
      return;
    }

    try {
      const { rounds, questions } = await this.gameService.startGame(session.gameId);
      await this.sendQuestion(session.gameId, rounds, questions, 0);
    } catch (err: unknown) {
      client.emit('game:error', { message: err instanceof Error ? err.message : 'Failed to start game' });
    }
  }

  @SubscribeMessage('game:answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { choiceIndex: number },
  ) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const activeRound = this.activeRounds.get(session.gameId);
    if (!activeRound) return;

    try {
      const game = await this.gameService.getGameWithPlayers(session.gameId);
      if (!game) return;

      await this.gameService.recordAnswer({
        playerId: session.playerId,
        roundId: activeRound.round.id,
        choiceIndex: data.choiceIndex,
        answeredAt: new Date(),
        roundStartedAt: activeRound.startedAt,
        correctAnswerIndex: activeRound.question.answerIndex,
        speedBonus: game.speedBonus,
      });
    } catch {
      // Answer already recorded or round ended
    }
  }

  @SubscribeMessage('game:next')
  async handleNext(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session?.isHost) return;
    await this.triggerReveal(session.gameId);
  }

  private async sendQuestion(
    gameId: string,
    allRounds: Round[],
    allQuestions: Question[],
    index: number,
  ) {
    const round = allRounds[index];
    const question = allQuestions[index];

    const startedAt = new Date();
    await this.gameService['prisma'].round.update({
      where: { id: round.id },
      data: { startedAt },
    });

    const endsAt = new Date(startedAt.getTime() + 10_000);

    this.activeRounds.set(gameId, {
      round,
      question,
      startedAt,
      allRounds,
      allQuestions,
    });

    this.server.to(`game:${gameId}`).emit('game:question', {
      index,
      total: allRounds.length,
      text: question.text,
      choices: question.choices,
      startsAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });

    const timer = setTimeout(() => this.triggerReveal(gameId), 10_000);
    this.roundTimers.set(gameId, timer);
  }

  private async triggerReveal(gameId: string) {
    const existingTimer = this.roundTimers.get(gameId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.roundTimers.delete(gameId);
    }

    const activeRound = this.activeRounds.get(gameId);
    if (!activeRound) return;
    this.activeRounds.delete(gameId);

    const reveal = await this.gameService.getRoundReveal(activeRound.round.id, gameId);
    this.server.to(`game:${gameId}`).emit('game:reveal', reveal);

    setTimeout(() => this.handleAfterReveal(gameId, activeRound), 4_000);
  }

  private async handleAfterReveal(gameId: string, previousRound: ActiveRoundData) {
    const result = await this.gameService.advanceQuestion(gameId);

    if (result.finished) {
      const ranking = await this.gameService.getFinalRanking(gameId);
      this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
      return;
    }

    const nextIndex = result.nextIndex!;
    await this.sendQuestion(
      gameId,
      previousRound.allRounds,
      previousRound.allQuestions,
      nextIndex,
    );
  }
}
