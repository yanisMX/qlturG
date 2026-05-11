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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
const questions_service_1 = require("../questions/questions.service");
let GameGateway = class GameGateway {
    constructor(gameService, questionsService) {
        this.gameService = gameService;
        this.questionsService = questionsService;
        this.sessions = new Map();
        this.roundTimers = new Map();
        this.activeRounds = new Map();
    }
    async handleDisconnect(client) {
        const session = this.sessions.get(client.id);
        if (!session)
            return;
        await this.gameService.updatePlayerSocket(session.playerId, null);
        this.sessions.delete(client.id);
        this.server.to(`game:${session.gameId}`).emit('game:player-left', {
            playerId: session.playerId,
        });
    }
    async handleJoin(client, data) {
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
        }
        catch (err) {
            client.emit('game:error', { message: err instanceof Error ? err.message : 'Failed to join game' });
        }
    }
    async handleLeave(client) {
        await this.handleDisconnect(client);
        client.emit('game:state', { left: true });
    }
    async handleStart(client) {
        const session = this.sessions.get(client.id);
        if (!session?.isHost) {
            client.emit('game:error', { message: 'Only the host can start the game' });
            return;
        }
        try {
            const { rounds, questions } = await this.gameService.startGame(session.gameId);
            await this.sendQuestion(session.gameId, rounds, questions, 0);
        }
        catch (err) {
            client.emit('game:error', { message: err instanceof Error ? err.message : 'Failed to start game' });
        }
    }
    async handleAnswer(client, data) {
        const session = this.sessions.get(client.id);
        if (!session)
            return;
        const activeRound = this.activeRounds.get(session.gameId);
        if (!activeRound)
            return;
        try {
            const game = await this.gameService.getGameWithPlayers(session.gameId);
            if (!game)
                return;
            await this.gameService.recordAnswer({
                playerId: session.playerId,
                roundId: activeRound.round.id,
                choiceIndex: data.choiceIndex,
                answeredAt: new Date(),
                roundStartedAt: activeRound.startedAt,
                correctAnswerIndex: activeRound.question.answerIndex,
                speedBonus: game.speedBonus,
            });
        }
        catch {
        }
    }
    async handleNext(client) {
        const session = this.sessions.get(client.id);
        if (!session?.isHost)
            return;
        await this.triggerReveal(session.gameId);
    }
    async sendQuestion(gameId, allRounds, allQuestions, index) {
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
    async triggerReveal(gameId) {
        const existingTimer = this.roundTimers.get(gameId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.roundTimers.delete(gameId);
        }
        const activeRound = this.activeRounds.get(gameId);
        if (!activeRound)
            return;
        this.activeRounds.delete(gameId);
        const reveal = await this.gameService.getRoundReveal(activeRound.round.id, gameId);
        this.server.to(`game:${gameId}`).emit('game:reveal', reveal);
        setTimeout(() => this.handleAfterReveal(gameId, activeRound), 4_000);
    }
    async handleAfterReveal(gameId, previousRound) {
        const result = await this.gameService.advanceQuestion(gameId);
        if (result.finished) {
            const ranking = await this.gameService.getFinalRanking(gameId);
            this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
            return;
        }
        const nextIndex = result.nextIndex;
        await this.sendQuestion(gameId, previousRound.allRounds, previousRound.allQuestions, nextIndex);
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:next'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleNext", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/game', cors: { origin: '*' } }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        questions_service_1.QuestionsService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map