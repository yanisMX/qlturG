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
const jwt_1 = require("@nestjs/jwt");
const game_service_1 = require("./game.service");
const questions_service_1 = require("../questions/questions.service");
const leaderboard_service_1 = require("../leaderboard/leaderboard.service");
const REVEAL_DURATION_MS = 4_000;
const LOADING_DURATION_MS = 2_000;
let GameGateway = class GameGateway {
    constructor(gameService, questionsService, jwtService, leaderboardService) {
        this.gameService = gameService;
        this.questionsService = questionsService;
        this.jwtService = jwtService;
        this.leaderboardService = leaderboardService;
        this.sessions = new Map();
        this.roundTimers = new Map();
        this.activeRounds = new Map();
        this.answerStreaks = new Map();
    }
    async handleDisconnect(client) {
        const session = this.sessions.get(client.id);
        if (!session)
            return;
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
    async handleJoin(client, data) {
        try {
            let userId;
            const token = client.handshake.auth?.token;
            if (token) {
                try {
                    const payload = this.jwtService.verify(token);
                    userId = payload.sub;
                }
                catch {
                }
            }
            const { game, player } = await this.gameService.joinGame({
                code: data.code,
                nickname: data.nickname,
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
        }
        catch (err) {
            client.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to join game',
            });
        }
    }
    async handleLeave(client) {
        await this.handleDisconnect(client);
        client.emit('game:state', { left: true });
    }
    async handleKick(client, data) {
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
        }
        catch (err) {
            client.emit('game:error', {
                message: err instanceof Error ? err.message : 'Impossible d\'exclure ce joueur',
            });
        }
    }
    async handleStart(client) {
        const session = this.sessions.get(client.id);
        if (!session?.isHost) {
            client.emit('game:error', { message: 'Only the host can start the game' });
            return;
        }
        try {
            const { rounds, questions } = await this.gameService.startGame(session.gameId);
            const game = await this.gameService.getGameWithPlayers(session.gameId);
            if (!game)
                return;
            this.server.to(`game:${session.gameId}`).emit('game:loading', {
                duration: LOADING_DURATION_MS,
            });
            setTimeout(() => {
                this.sendQuestion(game, rounds, questions, 0).catch(console.error);
            }, LOADING_DURATION_MS);
        }
        catch (err) {
            client.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to start game',
            });
        }
    }
    async handleRematch(client) {
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
        try {
            const newGame = await this.gameService.createGame({
                difficulty: oldGame.difficulty,
                totalQuestions: oldGame.totalQuestions,
                speedBonus: oldGame.speedBonus,
                gameMode: oldGame.gameMode,
                questionDuration: oldGame.questionDuration,
                doublePointsBonus: oldGame.doublePointsBonus,
                topics: oldGame.topics,
            });
            const oldRoomName = `game:${session.gameId}`;
            const newRoomName = `game:${newGame.id}`;
            const socketsInRoom = await this.server.in(oldRoomName).fetchSockets();
            let hostNewPlayerId = null;
            const socketPlayerMap = new Map();
            for (const sock of socketsInRoom) {
                const sockSession = this.sessions.get(sock.id);
                if (!sockSession)
                    continue;
                const oldPlayer = oldGame.players.find((p) => p.id === sockSession.playerId);
                if (!oldPlayer)
                    continue;
                const newPlayer = await this.gameService.createPlayerForRematch({
                    nickname: oldPlayer.nickname,
                    gameId: newGame.id,
                    userId: sockSession.userId,
                });
                if (sockSession.isHost)
                    hostNewPlayerId = newPlayer.id;
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
            if (!newGameFull)
                return;
            for (const sock of socketsInRoom) {
                const playerData = socketPlayerMap.get(sock.id);
                if (!playerData)
                    continue;
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
                    gameMode: newGameFull.gameMode,
                    speedBonus: newGameFull.speedBonus,
                    doublePointsBonus: newGameFull.doublePointsBonus,
                    totalQuestions: newGameFull.totalQuestions,
                    questionDuration: newGameFull.questionDuration,
                    hostId: hostNewPlayerId,
                    players: newGameFull.players.map((p) => ({
                        id: p.id,
                        nickname: p.nickname,
                        score: p.score,
                        lives: p.lives,
                        eliminated: p.eliminated,
                    })),
                    yourPlayerId: playerData.newPlayerId,
                    isHost: playerData.isHost,
                });
            }
        }
        catch (err) {
            client.emit('game:error', {
                message: err instanceof Error ? err.message : 'Impossible de créer la revanche',
            });
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
            if (session.userId) {
                if (answer.isCorrect) {
                    const streak = (this.answerStreaks.get(session.playerId) ?? 0) + 1;
                    this.answerStreaks.set(session.playerId, streak);
                    if (streak > 0 && streak % this.leaderboardService.answerStreakThreshold === 0) {
                        this.leaderboardService.applyAnswerStreakBonus(session.userId).catch(() => null);
                    }
                }
                else {
                    this.answerStreaks.set(session.playerId, 0);
                }
            }
            const isSurvival = game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
            if (isSurvival && !answer.isCorrect) {
                const { lives, eliminated } = await this.gameService.decrementLife(session.playerId);
                client.emit('game:life-lost', { lives, eliminated });
            }
            if (game.gameMode === 'SURVIVAL_SOLO') {
                const existing = this.roundTimers.get(session.gameId);
                if (existing)
                    clearTimeout(existing);
                const quick = setTimeout(() => this.triggerReveal(session.gameId), 900);
                this.roundTimers.set(session.gameId, quick);
            }
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
    async creditWeeklyScores(gameId) {
        try {
            const players = await this.gameService.getPlayersWithUser(gameId);
            await Promise.all(players
                .filter((p) => p.userId)
                .map((p) => {
                this.answerStreaks.delete(p.id);
                return this.leaderboardService.creditGamePoints(p.userId, p.score, false);
            }));
        }
        catch {
        }
    }
    async finishGame(gameId) {
        const ranking = await this.gameService.getFinalRanking(gameId);
        this.server.to(`game:${gameId}`).emit('game:finished', { ranking });
        this.creditWeeklyScores(gameId).catch(() => null);
    }
    async sendQuestion(game, allRounds, allQuestions, index) {
        const round = allRounds[index];
        const question = allQuestions[index];
        const durationMs = game.questionDuration * 1000;
        const gameId = game.id;
        const totalQuestions = game.totalQuestions;
        const doublePointsBonus = game.doublePointsBonus;
        const gameMode = game.gameMode;
        const isSurvival = gameMode === 'SURVIVAL_SOLO' || gameMode === 'SURVIVAL_MULTI';
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
        const game = await this.gameService.getGameWithPlayers(gameId);
        if (!game)
            return;
        const isSurvival = game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
        if (isSurvival) {
            const answeredPlayerIds = new Set(activeRound.round
                ? (await this.gameService['prisma'].answer.findMany({
                    where: { roundId: activeRound.round.id },
                    select: { playerId: true },
                })).map((a) => a.playerId)
                : []);
            const activePlayers = await this.gameService.getActivePlayers(gameId);
            for (const player of activePlayers) {
                if (!answeredPlayerIds.has(player.id)) {
                    const { lives, eliminated } = await this.gameService.decrementLife(player.id);
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
    async handleAfterReveal(gameId, previousRound) {
        const game = await this.gameService.getGameWithPlayers(gameId);
        if (!game)
            return;
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
        const nextIndex = result.nextIndex;
        let allRounds = previousRound.allRounds;
        let allQuestions = previousRound.allQuestions;
        const isSurvival = game.gameMode === 'SURVIVAL_SOLO' || game.gameMode === 'SURVIVAL_MULTI';
        if (isSurvival && nextIndex >= allRounds.length) {
            const usedIds = allRounds.map((r) => r.questionId);
            const { rounds: newRounds, questions: newQs } = await this.gameService.extendSurvivalRounds(gameId, usedIds, game.difficulty, allRounds.length);
            allRounds = [...allRounds, ...newRounds];
            allQuestions = [...allQuestions, ...newQs];
        }
        const updatedGame = await this.gameService.getGameWithPlayers(gameId);
        if (!updatedGame)
            return;
        await this.sendQuestion(updatedGame, allRounds, allQuestions, nextIndex);
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
    (0, websockets_1.SubscribeMessage)('game:kick'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleKick", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:rematch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleRematch", null);
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
        questions_service_1.QuestionsService,
        jwt_1.JwtService,
        leaderboard_service_1.LeaderboardService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map