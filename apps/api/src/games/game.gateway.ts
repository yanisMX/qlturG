import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { IsString, MinLength, MaxLength, Matches, IsInt, Min, Max, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';
import { QuestionsService } from '../questions/questions.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { Game, Question, Round, Topic } from '@prisma/client';

class JoinGameWsDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[\w\-\s àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+$/, {
    message: 'nickname contains invalid characters',
  })
  nickname!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

class AnswerWsDto {
  @IsInt()
  @Min(0)
  @Max(9)
  choiceIndex!: number;
}

class KickWsDto {
  @IsString()
  playerId!: string;
}

class RematchWsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(Topic, { each: true })
  topics?: Topic[];
}

interface SessionData {
  playerId: string;
  gameId: string;
  isHost: boolean;
  userId?: string;
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

@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
  },
})
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private sessions = new Map<string, SessionData>();
  private roundTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private activeRounds = new Map<string, ActiveRoundData>();
  private answerStreaks = new Map<string, number>(); // playerId → consecutive correct answers
  private answeredPlayers = new Map<string, Set<string>>(); // roundId → Set<playerId>

  constructor(
    private readonly gameService: GameService,
    private readonly questionsService: QuestionsService,
    private readonly jwtService: JwtService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    // Apply abandon malus for authenticated players who disconnect mid-game
    if (session.userId) {
      const game = await this.gameService.getGameWithPlayers(session.gameId);
      if (game?.status === 'IN_PROGRESS') {
        this.leaderboardService.creditGamePoints(session.userId, 0, true).catch(() => null);
      }
    }

    await this.gameService.updatePlayerSocket(session.playerId, null);
    this.sessions.delete(client.id);
    this.answerStreaks.delete(session.playerId);

    this.server.to(`game:${session.gameId}`).emit('game:player-left', {
      playerId: session.playerId,
    });
  }

  @SubscribeMessage('game:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinGameWsDto,
  ) {
    try {
      // Optionally identify the player via JWT from socket handshake
      let userId: string | undefined;
      const token = client.handshake.auth?.token as string | undefined;
      if (token) {
        try {
          const payload = this.jwtService.verify<{ sub: string }>(token);
          userId = payload.sub;
        } catch {
          // Invalid token — play as guest
        }
      }

      const { game, player } = await this.gameService.joinGame({
        code: data.code,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
        userId,
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
      this.sessions.set(client.id, { playerId: player.id, gameId: game.id, isHost, userId });
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
          avatarUrl: p.avatarUrl,
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
        avatarUrl: player.avatarUrl,
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
    @MessageBody() data: KickWsDto,
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

  @SubscribeMessage('game:rematch')
  async handleRematch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RematchWsDto,
  ) {
    const session = this.sessions.get(client.id);
    if (!session?.isHost) {
      client.emit('game:error', { message: 'Seul le QG peut lancer une revanche' });
      return;
    }

    const oldGame = await this.gameService.getGameWithPlayers(session.gameId);
    if (!oldGame || oldGame.status !== 'FINISHED') {
      client.emit('game:error', { message: 'La partie doit être terminée pour rejouer' });
      return;
    }

    // Host can override topics; fall back to the previous game's topics
    const topics = data?.topics ?? oldGame.topics;

    try {
      const newGame = await this.gameService.createGame({
        difficulty: oldGame.difficulty,
        totalQuestions: oldGame.totalQuestions,
        speedBonus: oldGame.speedBonus,
        gameMode: oldGame.gameMode,
        questionDuration: oldGame.questionDuration,
        doublePointsBonus: oldGame.doublePointsBonus,
        topics,
      });

      const oldRoomName = `game:${session.gameId}`;
      const newRoomName = `game:${newGame.id}`;
      const socketsInRoom = await this.server.in(oldRoomName).fetchSockets();

      let hostNewPlayerId: string | null = null;
      const socketPlayerMap = new Map<string, { newPlayerId: string; isHost: boolean; userId?: string }>();

      for (const sock of socketsInRoom) {
        const sockSession = this.sessions.get(sock.id);
        if (!sockSession) continue;

        const oldPlayer = oldGame.players.find((p) => p.id === sockSession.playerId);
        if (!oldPlayer) continue;

        const newPlayer = await this.gameService.createPlayerForRematch({
          nickname: oldPlayer.nickname,
          avatarUrl: oldPlayer.avatarUrl ?? undefined,
          gameId: newGame.id,
          userId: sockSession.userId,
        });

        if (sockSession.isHost) hostNewPlayerId = newPlayer.id;
        socketPlayerMap.set(sock.id, {
          newPlayerId: newPlayer.id,
          isHost: sockSession.isHost,
          userId: sockSession.userId,
        });
      }

      if (hostNewPlayerId) {
        await this.gameService.setHost(newGame.id, hostNewPlayerId);
      }

      const newGameFull = await this.gameService.getGameWithPlayers(newGame.id);
      if (!newGameFull) return;

      for (const sock of socketsInRoom) {
        const playerData = socketPlayerMap.get(sock.id);
        if (!playerData) continue;

        this.sessions.set(sock.id, {
          playerId: playerData.newPlayerId,
          gameId: newGame.id,
          isHost: playerData.isHost,
          userId: playerData.userId,
        });

        sock.leave(oldRoomName);
        sock.join(newRoomName);

        sock.emit('game:state', {
          gameId: newGameFull.id,
          code: newGameFull.code,
          status: newGameFull.status,
          difficulty: newGameFull.difficulty,
          topics: newGameFull.topics,
          gameMode: newGameFull.gameMode,
          speedBonus: newGameFull.speedBonus,
          doublePointsBonus: newGameFull.doublePointsBonus,
          totalQuestions: newGameFull.totalQuestions,
          questionDuration: newGameFull.questionDuration,
          hostId: hostNewPlayerId,
          players: newGameFull.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            avatarUrl: p.avatarUrl,
            score: p.score,
            lives: p.lives,
            eliminated: p.eliminated,
          })),
          yourPlayerId: playerData.newPlayerId,
          isHost: playerData.isHost,
        });
      }
    } catch (err: unknown) {
      client.emit('game:error', {
        message: err instanceof Error ? err.message : 'Impossible de créer la revanche',
      });
    }
  }

  @SubscribeMessage('game:answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AnswerWsDto,
  ) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const activeRound = this.activeRounds.get(session.gameId);
    if (!activeRound) return;

    // Hard cap: primary enforcement is triggerReveal clearing activeRounds;
    // this catches anomalous replays sent well after the round ended
    if (Date.now() > activeRound.startedAt.getTime() + 30_000) {
      client.emit('game:error', { message: 'Réponse trop tardive' });
      return;
    }

    // Reject out-of-range choiceIndex
    if (data.choiceIndex < 0 || data.choiceIndex >= activeRound.question.choices.length) {
      client.emit('game:error', { message: 'Index de réponse invalide' });
      return;
    }

    // Prevent duplicate answers (one answer per player per round)
    const answered = this.answeredPlayers.get(activeRound.round.id);
    if (answered?.has(session.playerId)) return;
    answered?.add(session.playerId);

    try {
      const game = await this.gameService.getGameWithPlayers(session.gameId);
      if (!game) return;

      const { answer, isFirstAnswer } = await this.gameService.recordAnswer({
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

      // Track answer streak for leaderboard bonus — only on first answer per round
      if (session.userId && isFirstAnswer) {
        if (answer.isCorrect) {
          const streak = (this.answerStreaks.get(session.playerId) ?? 0) + 1;
          this.answerStreaks.set(session.playerId, streak);
          if (streak > 0 && streak % this.leaderboardService.answerStreakThreshold === 0) {
            this.leaderboardService.applyAnswerStreakBonus(session.userId).catch(() => null);
          }
        } else {
          this.answerStreaks.set(session.playerId, 0);
        }
      }

      // Survival: decrement lives only on first wrong answer (answer changes don't cost lives)
      const isSurvival =
        game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
      if (isSurvival && !answer.isCorrect && isFirstAnswer) {
        const { lives, eliminated } = await this.gameService.decrementLife(session.playerId);
        client.emit('game:life-lost', { lives, eliminated });
      }

      // Solo: reveal quickly after first answer (no other players to wait for)
      if (game.gameMode === 'SURVIVAL_SOLO' && isFirstAnswer) {
        const existing = this.roundTimers.get(session.gameId);
        if (existing) clearTimeout(existing);
        const quick = setTimeout(() => this.triggerReveal(session.gameId), 900);
        this.roundTimers.set(session.gameId, quick);
      }
    } catch {
      // Round ended or answer rejected
    }
  }

  @SubscribeMessage('game:next')
  async handleNext(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session?.isHost) return;
    await this.triggerReveal(session.gameId);
  }

  private async creditWeeklyScores(gameId: string): Promise<void> {
    try {
      const players = await this.gameService.getPlayersWithUser(gameId);
      await Promise.all(
        players
          .filter((p) => p.userId)
          .map((p) => {
            this.answerStreaks.delete(p.id);
            return this.leaderboardService.creditGamePoints(p.userId!, p.score, false);
          }),
      );
    } catch {
      // Leaderboard crediting is non-blocking — do not crash the game
    }
  }

  private async finishGame(gameId: string): Promise<void> {
    const ranking = await this.gameService.getFinalRanking(gameId);
    this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
    this.creditWeeklyScores(gameId).catch(() => null);
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
    this.answeredPlayers.set(round.id, new Set());

    this.server.to(`game:${gameId}`).emit('game:question', {
      index,
      total: isSurvival ? null : allRounds.length,
      text: question.text,
      choices: question.choices,
      startsAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      isDoublePoints,
      topic: question.topic,
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
    this.answeredPlayers.delete(activeRound.round.id);

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
        await this.finishGame(gameId);
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
        await this.finishGame(gameId);
        return;
      }
    }

    const result = await this.gameService.advanceQuestion(gameId);

    if (result.finished) {
      await this.finishGame(gameId);
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
