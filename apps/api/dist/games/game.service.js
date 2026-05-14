"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const questions_service_1 = require("../questions/questions.service");
const client_1 = require("@prisma/client");
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let GameService = class GameService {
    constructor(prisma, questionsService) {
        this.prisma = prisma;
        this.questionsService = questionsService;
    }
    calculateScore(isCorrect, speedBonus, responseTimeMs, questionDuration = 10, isDoublePoints = false) {
        if (!isCorrect) {
            return { points: 0, isCorrect: false, responseTimeMs };
        }
        let points;
        if (!speedBonus) {
            points = 1000;
        }
        else {
            const durationMs = questionDuration * 1000;
            const remainingMs = Math.max(0, durationMs - responseTimeMs);
            const remainingSec = remainingMs / 1000;
            points = Math.floor(500 + 500 * (remainingSec / questionDuration));
        }
        if (isDoublePoints)
            points *= 2;
        return { points, isCorrect: true, responseTimeMs };
    }
    generateCode() {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        }
        return code;
    }
    async generateUniqueCode() {
        let code = this.generateCode();
        let existing = await this.prisma.game.findUnique({ where: { code } });
        while (existing) {
            code = this.generateCode();
            existing = await this.prisma.game.findUnique({ where: { code } });
        }
        return code;
    }
    async createGame(params) {
        if (params.totalQuestions < 10 || params.totalQuestions > 30) {
            throw new common_1.BadRequestException('totalQuestions must be between 10 and 30');
        }
        if (params.questionDuration < 5 || params.questionDuration > 30) {
            throw new common_1.BadRequestException('questionDuration must be between 5 and 30');
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
    async setHost(gameId, playerId) {
        return this.prisma.game.update({
            where: { id: gameId },
            data: { hostId: playerId },
        });
    }
    async joinGame(params) {
        const game = await this.prisma.game.findUnique({
            where: { code: params.code.toUpperCase() },
            include: { players: true },
        });
        if (!game)
            throw new common_1.NotFoundException('Game not found');
        if (game.status !== client_1.GameStatus.LOBBY) {
            throw new common_1.BadRequestException('Game already started');
        }
        if (game.gameMode === client_1.GameMode.SURVIVAL_SOLO && game.players.length >= 1) {
            throw new common_1.BadRequestException('Survival solo — partie solo uniquement');
        }
        if (game.players.length >= 12) {
            throw new common_1.BadRequestException('Game is full (max 12 players)');
        }
        const player = await this.prisma.player.create({
            data: {
                nickname: params.nickname,
                gameId: game.id,
                ...(params.userId ? { userId: params.userId } : {}),
            },
        });
        return { game: await this.getGameWithPlayers(game.id), player };
    }
    async getPlayersWithUser(gameId) {
        return this.prisma.player.findMany({
            where: { gameId },
            select: { id: true, score: true, userId: true, socketId: true },
        });
    }
    async createPlayerForRematch(params) {
        return this.prisma.player.create({
            data: {
                nickname: params.nickname,
                gameId: params.gameId,
                ...(params.userId ? { userId: params.userId } : {}),
            },
        });
    }
    async kickPlayer(gameId, playerId) {
        const player = await this.prisma.player.findFirst({
            where: { id: playerId, gameId },
        });
        if (!player)
            throw new common_1.NotFoundException('Player not found');
        await this.prisma.player.delete({ where: { id: playerId } });
        return player;
    }
    async startGame(gameId) {
        const game = await this.prisma.game.findUnique({ where: { id: gameId } });
        if (!game)
            throw new common_1.NotFoundException();
        if (game.status !== client_1.GameStatus.LOBBY) {
            throw new common_1.BadRequestException('Game is not in LOBBY state');
        }
        const isSurvival = game.gameMode === client_1.GameMode.SURVIVAL_SOLO || game.gameMode === client_1.GameMode.SURVIVAL_MULTI;
        const { topics } = game;
        let questions;
        if (isSurvival) {
            questions = await this.questionsService.getAllByDifficulty(game.difficulty, [], topics);
            if (questions.length === 0) {
                throw new common_1.BadRequestException('No questions available for this difficulty');
            }
        }
        else {
            questions = await this.questionsService.getRandomByDifficulty(game.difficulty, game.totalQuestions, topics);
            if (questions.length < game.totalQuestions) {
                throw new common_1.BadRequestException('Not enough questions available for this difficulty');
            }
        }
        const rounds = await Promise.all(questions.map((q, i) => this.prisma.round.create({ data: { gameId, questionId: q.id, orderIndex: i } })));
        await this.prisma.game.update({
            where: { id: gameId },
            data: { status: client_1.GameStatus.IN_PROGRESS, currentQuestionIndex: 0 },
        });
        return { rounds, questions };
    }
    async extendSurvivalRounds(gameId, usedQuestionIds, difficulty, startOrderIndex) {
        const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: { topics: true } });
        const topics = game?.topics ?? [];
        let newQuestions = await this.questionsService.getAllByDifficulty(difficulty, usedQuestionIds, topics);
        if (newQuestions.length === 0) {
            newQuestions = await this.questionsService.getAllByDifficulty(difficulty, [], topics);
        }
        const rounds = await Promise.all(newQuestions.map((q, i) => this.prisma.round.create({ data: { gameId, questionId: q.id, orderIndex: startOrderIndex + i } })));
        return { rounds, questions: newQuestions };
    }
    async recordAnswer(params) {
        const responseTimeMs = params.answeredAt.getTime() - params.roundStartedAt.getTime();
        const isCorrect = params.choiceIndex === params.correctAnswerIndex;
        const { points } = this.calculateScore(isCorrect, params.speedBonus, responseTimeMs, params.questionDuration, params.isDoublePoints);
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
    async decrementLife(playerId) {
        const player = await this.prisma.player.findUnique({ where: { id: playerId } });
        if (!player)
            throw new common_1.NotFoundException();
        const newLives = Math.max(0, player.lives - 1);
        const eliminated = newLives === 0;
        await this.prisma.player.update({
            where: { id: playerId },
            data: { lives: newLives, eliminated },
        });
        return { lives: newLives, eliminated };
    }
    async getActivePlayers(gameId) {
        return this.prisma.player.findMany({
            where: { gameId, eliminated: false },
        });
    }
    async getRoundReveal(roundId, gameId) {
        const round = await this.prisma.round.findUnique({
            where: { id: roundId },
            include: { answers: true },
        });
        if (!round)
            throw new common_1.NotFoundException();
        const question = await this.prisma.question.findUnique({ where: { id: round.questionId } });
        if (!question)
            throw new common_1.NotFoundException();
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
    async advanceQuestion(gameId) {
        const game = await this.prisma.game.findUnique({ where: { id: gameId } });
        if (!game)
            throw new common_1.NotFoundException();
        const nextIndex = game.currentQuestionIndex + 1;
        const isSurvival = game.gameMode === client_1.GameMode.SURVIVAL_SOLO || game.gameMode === client_1.GameMode.SURVIVAL_MULTI;
        if (!isSurvival && nextIndex >= game.totalQuestions) {
            await this.prisma.game.update({
                where: { id: gameId },
                data: { status: client_1.GameStatus.FINISHED },
            });
            return { finished: true };
        }
        await this.prisma.game.update({
            where: { id: gameId },
            data: { currentQuestionIndex: nextIndex },
        });
        return { finished: false, nextIndex };
    }
    async getFinalRanking(gameId) {
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
    getGameWithPlayers(gameId) {
        return this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true, rounds: { orderBy: { orderIndex: 'asc' } } },
        });
    }
    getGameByCode(code) {
        return this.prisma.game.findUnique({
            where: { code: code.toUpperCase() },
            include: { players: true },
        });
    }
    async updatePlayerSocket(playerId, socketId) {
        return this.prisma.player.update({
            where: { id: playerId },
            data: { socketId },
        });
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        questions_service_1.QuestionsService])
], GameService);
//# sourceMappingURL=game.service.js.map