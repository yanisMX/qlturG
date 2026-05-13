import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';
import { Difficulty, GameMode, GameStatus, Topic } from '@prisma/client';
import { ScoreResult } from './game.types';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionsService: QuestionsService,
  ) {}

  calculateScore(
    isCorrect: boolean,
    speedBonus: boolean,
    responseTimeMs: number,
    questionDuration: number = 10,
    isDoublePoints: boolean = false,
  ): ScoreResult {
    if (!isCorrect) {
      return { points: 0, isCorrect: false, responseTimeMs };
    }

    let points: number;
    if (!speedBonus) {
      points = 1000;
    } else {
      const durationMs = questionDuration * 1000;
      const remainingMs = Math.max(0, durationMs - responseTimeMs);
      const remainingSec = remainingMs / 1000;
      points = Math.floor(500 + 500 * (remainingSec / questionDuration));
    }

    if (isDoublePoints) points *= 2;

    return { points, isCorrect: true, responseTimeMs };
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }

  private async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    let existing = await this.prisma.game.findUnique({ where: { code } });
    while (existing) {
      code = this.generateCode();
      existing = await this.prisma.game.findUnique({ where: { code } });
    }
    return code;
  }

  async createGame(params: {
    difficulty: Difficulty;
    totalQuestions: number;
    speedBonus: boolean;
    gameMode: GameMode;
    questionDuration: number;
    doublePointsBonus: boolean;
    topics?: Topic[];
  }) {
    if (params.totalQuestions < 10 || params.totalQuestions > 30) {
      throw new BadRequestException('totalQuestions must be between 10 and 30');
    }
    if (params.questionDuration < 5 || params.questionDuration > 30) {
      throw new BadRequestException('questionDuration must be between 5 and 30');
    }

    const code = await this.generateUniqueCode();

    return this.prisma.game.create({
      data: {
        code,
        hostId: 'pending',
        difficulty: params.difficulty,
        topics: params.topics ?? [],
        totalQuestions: params.totalQuestions,
        speedBonus: params.speedBonus,
        gameMode: params.gameMode,
        questionDuration: params.questionDuration,
        doublePointsBonus: params.doublePointsBonus,
      },
    });
  }

  async setHost(gameId: string, playerId: string) {
    return this.prisma.game.update({
      where: { id: gameId },
      data: { hostId: playerId },
    });
  }

  async joinGame(params: { code: string; nickname: string }) {
    const game = await this.prisma.game.findUnique({
      where: { code: params.code.toUpperCase() },
      include: { players: true },
    });

    if (!game) throw new NotFoundException('Game not found');
    if (game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game already started');
    }
    if (game.gameMode === GameMode.SURVIVAL_SOLO && game.players.length >= 1) {
      throw new BadRequestException('Survival solo — partie solo uniquement');
    }
    if (game.players.length >= 12) {
      throw new BadRequestException('Game is full (max 12 players)');
    }

    const player = await this.prisma.player.create({
      data: { nickname: params.nickname, gameId: game.id },
    });

    return { game: await this.getGameWithPlayers(game.id), player };
  }

  async kickPlayer(gameId: string, playerId: string) {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, gameId },
    });
    if (!player) throw new NotFoundException('Player not found');
    await this.prisma.player.delete({ where: { id: playerId } });
    return player;
  }

  async startGame(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException();
    if (game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game is not in LOBBY state');
    }

    const isSurvival =
      game.gameMode === GameMode.SURVIVAL_SOLO || game.gameMode === GameMode.SURVIVAL_MULTI;

    const { topics } = game;

    let questions;
    if (isSurvival) {
      questions = await this.questionsService.getAllByDifficulty(game.difficulty, [], topics);
      if (questions.length === 0) {
        throw new BadRequestException('No questions available for this difficulty');
      }
    } else {
      questions = await this.questionsService.getRandomByDifficulty(
        game.difficulty,
        game.totalQuestions,
        topics,
      );
      if (questions.length < game.totalQuestions) {
        throw new BadRequestException('Not enough questions available for this difficulty');
      }
    }

    const rounds = await Promise.all(
      questions.map((q, i) =>
        this.prisma.round.create({ data: { gameId, questionId: q.id, orderIndex: i } }),
      ),
    );

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: GameStatus.IN_PROGRESS, currentQuestionIndex: 0 },
    });

    return { rounds, questions };
  }

  async extendSurvivalRounds(
    gameId: string,
    usedQuestionIds: string[],
    difficulty: Difficulty,
    startOrderIndex: number,
  ) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: { topics: true } });
    const topics = game?.topics ?? [];

    let newQuestions = await this.questionsService.getAllByDifficulty(difficulty, usedQuestionIds, topics);
    if (newQuestions.length === 0) {
      // All questions exhausted — loop the full pool reshuffled
      newQuestions = await this.questionsService.getAllByDifficulty(difficulty, [], topics);
    }
    const rounds = await Promise.all(
      newQuestions.map((q, i) =>
        this.prisma.round.create({ data: { gameId, questionId: q.id, orderIndex: startOrderIndex + i } }),
      ),
    );
    return { rounds, questions: newQuestions };
  }

  async recordAnswer(params: {
    playerId: string;
    roundId: string;
    choiceIndex: number;
    answeredAt: Date;
    roundStartedAt: Date;
    correctAnswerIndex: number;
    speedBonus: boolean;
    questionDuration: number;
    isDoublePoints: boolean;
  }) {
    const responseTimeMs = params.answeredAt.getTime() - params.roundStartedAt.getTime();
    const isCorrect = params.choiceIndex === params.correctAnswerIndex;
    const { points } = this.calculateScore(
      isCorrect,
      params.speedBonus,
      responseTimeMs,
      params.questionDuration,
      params.isDoublePoints,
    );

    const answer = await this.prisma.answer.create({
      data: {
        playerId: params.playerId,
        roundId: params.roundId,
        choiceIndex: params.choiceIndex,
        isCorrect,
        pointsEarned: points,
        answeredAt: params.answeredAt,
        responseTimeMs,
      },
    });

    await this.prisma.player.update({
      where: { id: params.playerId },
      data: { score: { increment: points } },
    });

    return answer;
  }

  async decrementLife(playerId: string): Promise<{ lives: number; eliminated: boolean }> {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException();

    const newLives = Math.max(0, player.lives - 1);
    const eliminated = newLives === 0;

    await this.prisma.player.update({
      where: { id: playerId },
      data: { lives: newLives, eliminated },
    });

    return { lives: newLives, eliminated };
  }

  async getActivePlayers(gameId: string) {
    return this.prisma.player.findMany({
      where: { gameId, eliminated: false },
    });
  }

  async getRoundReveal(roundId: string, gameId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { answers: true },
    });
    if (!round) throw new NotFoundException();

    const question = await this.prisma.question.findUnique({ where: { id: round.questionId } });
    if (!question) throw new NotFoundException();

    const players = await this.prisma.player.findMany({ where: { gameId } });
    const scoreMap = new Map(round.answers.map((a) => [a.playerId, a.pointsEarned]));

    return {
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      scores: players.map((p) => ({
        playerId: p.id,
        nickname: p.nickname,
        score: p.score,
        deltaThisRound: scoreMap.get(p.id) ?? 0,
        lives: p.lives,
        eliminated: p.eliminated,
      })),
    };
  }

  async advanceQuestion(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException();

    const nextIndex = game.currentQuestionIndex + 1;
    const isSurvival =
      game.gameMode === GameMode.SURVIVAL_SOLO || game.gameMode === GameMode.SURVIVAL_MULTI;

    // Standard: finish when totalQuestions reached
    if (!isSurvival && nextIndex >= game.totalQuestions) {
      await this.prisma.game.update({
        where: { id: gameId },
        data: { status: GameStatus.FINISHED },
      });
      return { finished: true };
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { currentQuestionIndex: nextIndex },
    });

    return { finished: false, nextIndex };
  }

  async getFinalRanking(gameId: string) {
    const players = await this.prisma.player.findMany({
      where: { gameId },
      orderBy: [{ eliminated: 'asc' }, { score: 'desc' }],
    });
    return players.map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      lives: p.lives,
      eliminated: p.eliminated,
    }));
  }

  getGameWithPlayers(gameId: string) {
    return this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true, rounds: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  getGameByCode(code: string) {
    return this.prisma.game.findUnique({
      where: { code: code.toUpperCase() },
      include: { players: true },
    });
  }

  async updatePlayerSocket(playerId: string, socketId: string | null) {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { socketId },
    });
  }
}
