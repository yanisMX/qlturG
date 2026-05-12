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
import { Game, Question, Round } from '@prisma/client';

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
  isDoublePoints: boolean;
}

const REVEAL_DURATION_MS = 4_000;
const LOADING_DURATION_MS = 2_000;

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
        gameMode: game.gameMode,
        speedBonus: game.speedBonus,
        doublePointsBonus: game.doublePointsBonus,
        totalQuestions: game.totalQuestions,
        questionDuration: game.questionDuration,
        hostId,
        players: game.players.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          score: p.score,
          lives: p.lives,
          eliminated: p.eliminated,
        })),
        yourPlayerId: player.id,
        isHost,
      });

      this.server.to(`game:${game.id}`).emit('game:player-joined', {
        playerId: player.id,
        nickname: player.nickname,
        score: 0,
        lives: player.lives,
        eliminated: false,
      });
    } catch (err: unknown) {
      client.emit('game:error', {
        message: err instanceof Error ? err.message : 'Failed to join game',
      });
    }
  }

  @SubscribeMessage('game:leave')
  async handleLeave(@ConnectedSocket() client: Socket) {
    await this.handleDisconnect(client);
    client.emit('game:state', { left: true });
  }

  @SubscribeMessage('game:kick')
  async handleKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ) {
    const session = this.sessions.get(client.id);
    if (!session?.isHost) {
      client.emit('game:error', { message: 'Seul le QG peut exclure des joueurs' });
      return;
    }
    if (data.playerId === session.playerId) {
      client.emit('game:error', { message: 'Impossible de s\'exclure soi-même' });
      return;
    }

    try {
      const kickedPlayer = await this.gameService.kickPlayer(session.gameId, data.playerId);

      // Notify and remove the kicked socket from the room
      const kickedSocketId = kickedPlayer.socketId;
      if (kickedSocketId) {
        this.server.to(kickedSocketId).emit('game:kicked', {
          message: 'Tu as été exclu de la partie par le QG.',
        });
        this.server.in(kickedSocketId).socketsLeave(`game:${session.gameId}`);
        this.sessions.delete(kickedSocketId);
      }

      this.server.to(`game:${session.gameId}`).emit('game:player-left', {
        playerId: data.playerId,
      });
    } catch (err: unknown) {
      client.emit('game:error', {
        message: err instanceof Error ? err.message : 'Impossible d\'exclure ce joueur',
      });
    }
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
      const game = await this.gameService.getGameWithPlayers(session.gameId);
      if (!game) return;

      // Loading bar before first question
      this.server.to(`game:${session.gameId}`).emit('game:loading', {
        duration: LOADING_DURATION_MS,
      });

      setTimeout(() => {
        this.sendQuestion(game, rounds, questions, 0).catch(console.error);
      }, LOADING_DURATION_MS);
    } catch (err: unknown) {
      client.emit('game:error', {
        message: err instanceof Error ? err.message : 'Failed to start game',
      });
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

      const answer = await this.gameService.recordAnswer({
        playerId: session.playerId,
        roundId: activeRound.round.id,
        choiceIndex: data.choiceIndex,
        answeredAt: new Date(),
        roundStartedAt: activeRound.startedAt,
        correctAnswerIndex: activeRound.question.answerIndex,
        speedBonus: game.speedBonus,
        questionDuration: game.questionDuration,
        isDoublePoints: activeRound.isDoublePoints,
      });

      // Survival: decrement lives on wrong answer
      const isSurvival =
        game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
      if (isSurvival && !answer.isCorrect) {
        const { lives, eliminated } = await this.gameService.decrementLife(session.playerId);
        client.emit('game:life-lost', { lives, eliminated });
      }

      // Solo: reveal quickly after answering (no other players to wait for)
      if (game.gameMode === 'SURVIVAL_SOLO') {
        const existing = this.roundTimers.get(session.gameId);
        if (existing) clearTimeout(existing);
        const quick = setTimeout(() => this.triggerReveal(session.gameId), 900);
        this.roundTimers.set(session.gameId, quick);
      }
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
    game: Awaited<ReturnType<GameService['getGameWithPlayers']>> & object,
    allRounds: Round[],
    allQuestions: Question[],
    index: number,
  ) {
    const round = allRounds[index];
    const question = allQuestions[index];
    const durationMs = (game as { questionDuration: number }).questionDuration * 1000;
    const gameId = (game as { id: string }).id;
    const totalQuestions = (game as { totalQuestions: number }).totalQuestions;
    const doublePointsBonus = (game as { doublePointsBonus: boolean }).doublePointsBonus;
    const gameMode = (game as { gameMode: string }).gameMode;
    const isSurvival = gameMode === 'SURVIVAL_SOLO' || gameMode === 'SURVIVAL_MULTI';

    // Last 20% questions worth double (standard only — survival has no fixed total)
    const doubleThreshold = Math.floor(totalQuestions * 0.8);
    const isDoublePoints = !isSurvival && doublePointsBonus && index >= doubleThreshold;

    const startedAt = new Date();
    await this.gameService['prisma'].round.update({
      where: { id: round.id },
      data: { startedAt },
    });

    const endsAt = new Date(startedAt.getTime() + durationMs);

    this.activeRounds.set(gameId, {
      round,
      question,
      startedAt,
      allRounds,
      allQuestions,
      isDoublePoints,
    });

    this.server.to(`game:${gameId}`).emit('game:question', {
      index,
      total: isSurvival ? null : allRounds.length,
      text: question.text,
      choices: question.choices,
      startsAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      isDoublePoints,
    });

    const timer = setTimeout(() => this.triggerReveal(gameId), durationMs);
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

    // Survival: decrement lives for players who didn't answer
    const game = await this.gameService.getGameWithPlayers(gameId);
    if (!game) return;

    const isSurvival = game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
    if (isSurvival) {
      const answeredPlayerIds = new Set(
        activeRound.round
          ? (await this.gameService['prisma'].answer.findMany({
              where: { roundId: activeRound.round.id },
              select: { playerId: true },
            })).map((a) => a.playerId)
          : [],
      );

      const activePlayers = await this.gameService.getActivePlayers(gameId);
      for (const player of activePlayers) {
        if (!answeredPlayerIds.has(player.id)) {
          const { lives, eliminated } = await this.gameService.decrementLife(player.id);
          // Notify the player if their socket is connected
          if (player.socketId) {
            this.server.to(player.socketId).emit('game:life-lost', { lives, eliminated });
          }
        }
      }
    }

    const reveal = await this.gameService.getRoundReveal(activeRound.round.id, gameId);
    this.server.to(`game:${gameId}`).emit('game:reveal', reveal);

    setTimeout(() => this.handleAfterReveal(gameId, activeRound), REVEAL_DURATION_MS);
  }

  private async handleAfterReveal(gameId: string, previousRound: ActiveRoundData) {
    const game = await this.gameService.getGameWithPlayers(gameId);
    if (!game) return;

    // Survival multi: check if game should end (≤1 player with lives)
    if (game.gameMode === 'SURVIVAL_MULTI') {
      const activePlayers = await this.gameService.getActivePlayers(gameId);
      if (activePlayers.length <= 1) {
        await this.gameService['prisma'].game.update({
          where: { id: gameId },
          data: { status: 'FINISHED' },
        });
        const ranking = await this.gameService.getFinalRanking(gameId);
        this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
        return;
      }
    }

    // Survival solo: check if the player is eliminated
    if (game.gameMode === 'SURVIVAL_SOLO') {
      const activePlayers = await this.gameService.getActivePlayers(gameId);
      if (activePlayers.length === 0) {
        await this.gameService['prisma'].game.update({
          where: { id: gameId },
          data: { status: 'FINISHED' },
        });
        const ranking = await this.gameService.getFinalRanking(gameId);
        this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
        return;
      }
    }

    const result = await this.gameService.advanceQuestion(gameId);

    if (result.finished) {
      const ranking = await this.gameService.getFinalRanking(gameId);
      this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
      return;
    }

    const nextIndex = result.nextIndex!;
    let allRounds = previousRound.allRounds;
    let allQuestions = previousRound.allQuestions;

    // Survival: extend the question pool when exhausted
    const isSurvival = game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
    if (isSurvival && nextIndex >= allRounds.length) {
      const usedIds = allRounds.map((r) => r.questionId);
      const { rounds: newRounds, questions: newQs } =
        await this.gameService.extendSurvivalRounds(
          gameId,
          usedIds,
          (game as { difficulty: string }).difficulty as Parameters<typeof this.gameService.extendSurvivalRounds>[2],
          allRounds.length,
        );
      allRounds = [...allRounds, ...newRounds];
      allQuestions = [...allQuestions, ...newQs];
    }

    const updatedGame = await this.gameService.getGameWithPlayers(gameId);
    if (!updatedGame) return;

    await this.sendQuestion(
      updatedGame,
      allRounds,
      allQuestions,
      nextIndex,
    );
  }
}
