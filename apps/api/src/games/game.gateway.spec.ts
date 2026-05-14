import { GameGateway } from './game.gateway';

// Minimal socket mock
function makeSocket(id = 'socket1') {
  const emitted: { event: string; data: unknown }[] = [];
  return {
    id,
    handshake: { auth: {} },
    emit: jest.fn((event: string, data: unknown) => emitted.push({ event, data })),
    join: jest.fn(),
    _emitted: emitted,
  };
}

function makeGateway() {
  const gameService = {
    getGameWithPlayers: jest.fn(),
    recordAnswer: jest.fn(),
    decrementLife: jest.fn(),
    updatePlayerSocket: jest.fn(),
    getFinalRanking: jest.fn(),
    getActivePlayers: jest.fn(),
    getRoundReveal: jest.fn(),
    advanceQuestion: jest.fn(),
  };
  const questionsService = {};
  const jwtService = { verify: jest.fn() };
  const leaderboardService = {
    creditGamePoints: jest.fn(),
    applyAnswerStreakBonus: jest.fn(),
    answerStreakThreshold: 5,
  };

  const gw = new GameGateway(
    gameService as any,
    questionsService as any,
    jwtService as any,
    leaderboardService as any,
  );

  // Inject a mock server
  (gw as any).server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };

  return { gw, gameService, jwtService };
}

describe('GameGateway security', () => {
  describe('game:start — host-only enforcement', () => {
    it('rejects a non-host who emits game:start', async () => {
      const { gw } = makeGateway();
      const socket = makeSocket();

      // No session registered → not a host
      await (gw as any).handleStart(socket);

      expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({ message: expect.any(String) }));
    });

    it('rejects a player with isHost=false who emits game:start', async () => {
      const { gw } = makeGateway();
      const socket = makeSocket();

      (gw as any).sessions.set(socket.id, {
        playerId: 'p1',
        gameId: 'g1',
        isHost: false,
      });

      await (gw as any).handleStart(socket);

      expect(socket.emit).toHaveBeenCalledWith(
        'game:error',
        expect.objectContaining({ message: 'Only the host can start the game' }),
      );
    });
  });

  describe('game:answer — duplicate prevention', () => {
    it('silently ignores a second answer from the same player in the same round', async () => {
      const { gw, gameService } = makeGateway();
      const socket = makeSocket();

      (gw as any).sessions.set(socket.id, { playerId: 'p1', gameId: 'g1', isHost: false });

      const round = { id: 'r1' };
      const question = { choices: ['A', 'B', 'C', 'D'], answerIndex: 0 };
      const startedAt = new Date(Date.now() - 1000);

      (gw as any).activeRounds.set('g1', { round, question, startedAt, allRounds: [], allQuestions: [], isDoublePoints: false });
      (gw as any).answeredPlayers.set('r1', new Set(['p1'])); // already answered

      gameService.getGameWithPlayers.mockResolvedValue({ id: 'g1', speedBonus: true, questionDuration: 10, gameMode: 'STANDARD', players: [] });
      gameService.recordAnswer.mockResolvedValue({ isCorrect: true });

      await (gw as any).handleAnswer(socket, { choiceIndex: 0 });

      // recordAnswer must NOT be called again
      expect(gameService.recordAnswer).not.toHaveBeenCalled();
    });

    it('accepts the first answer and adds the player to answered set', async () => {
      const { gw, gameService } = makeGateway();
      const socket = makeSocket();

      (gw as any).sessions.set(socket.id, { playerId: 'p2', gameId: 'g1', isHost: false });

      const round = { id: 'r2' };
      const question = { choices: ['A', 'B', 'C', 'D'], answerIndex: 1 };
      const startedAt = new Date(Date.now() - 1000);

      (gw as any).activeRounds.set('g1', { round, question, startedAt, allRounds: [], allQuestions: [], isDoublePoints: false });
      (gw as any).answeredPlayers.set('r2', new Set());

      const game = { id: 'g1', speedBonus: true, questionDuration: 10, gameMode: 'STANDARD', players: [] };
      gameService.getGameWithPlayers.mockResolvedValue(game);
      gameService.recordAnswer.mockResolvedValue({ isCorrect: false });

      await (gw as any).handleAnswer(socket, { choiceIndex: 1 });

      expect(gameService.recordAnswer).toHaveBeenCalledTimes(1);
      expect((gw as any).answeredPlayers.get('r2').has('p2')).toBe(true);
    });
  });

  describe('game:answer — out-of-range choiceIndex', () => {
    it('rejects a negative choiceIndex', async () => {
      const { gw } = makeGateway();
      const socket = makeSocket();

      (gw as any).sessions.set(socket.id, { playerId: 'p1', gameId: 'g1', isHost: false });
      (gw as any).activeRounds.set('g1', {
        round: { id: 'r1' },
        question: { choices: ['A', 'B'], answerIndex: 0 },
        startedAt: new Date(),
        allRounds: [],
        allQuestions: [],
        isDoublePoints: false,
      });
      (gw as any).answeredPlayers.set('r1', new Set());

      await (gw as any).handleAnswer(socket, { choiceIndex: -1 });

      expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({ message: 'Index de réponse invalide' }));
    });

    it('rejects a choiceIndex beyond available choices', async () => {
      const { gw } = makeGateway();
      const socket = makeSocket();

      (gw as any).sessions.set(socket.id, { playerId: 'p1', gameId: 'g1', isHost: false });
      (gw as any).activeRounds.set('g1', {
        round: { id: 'r1' },
        question: { choices: ['A', 'B', 'C', 'D'], answerIndex: 0 },
        startedAt: new Date(),
        allRounds: [],
        allQuestions: [],
        isDoublePoints: false,
      });
      (gw as any).answeredPlayers.set('r1', new Set());

      await (gw as any).handleAnswer(socket, { choiceIndex: 99 });

      expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({ message: 'Index de réponse invalide' }));
    });
  });

  describe('game:question payload — answerIndex never sent to clients', () => {
    it('sendQuestion emits game:question without answerIndex', async () => {
      const { gw, gameService } = makeGateway();

      const game = { id: 'g1', questionDuration: 10, totalQuestions: 10, doublePointsBonus: false, gameMode: 'STANDARD' };
      const round = { id: 'r1', questionId: 'q1' };
      const question = { id: 'q1', text: 'Question?', choices: ['A', 'B', 'C', 'D'], answerIndex: 2, explanation: 'exp' };

      // Stub prisma.round.update used inside sendQuestion
      (gw as any).gameService['prisma'] = {
        round: { update: jest.fn().mockResolvedValue(round) },
      };

      const toMock = { emit: jest.fn() };
      (gw as any).server.to = jest.fn().mockReturnValue(toMock);

      await (gw as any).sendQuestion(game, [round], [question], 0);

      const call = toMock.emit.mock.calls.find(([evt]: string[]) => evt === 'game:question');
      expect(call).toBeDefined();
      const payload = call[1];
      expect(payload).not.toHaveProperty('answerIndex');
      expect(payload).toHaveProperty('text', 'Question?');
      expect(payload).toHaveProperty('choices');
    });
  });
});
