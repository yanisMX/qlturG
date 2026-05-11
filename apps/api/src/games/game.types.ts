export interface ScoreResult {
  points: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  score: number;
  socketId: string | null;
}

export interface RoundReveal {
  answerIndex: number;
  explanation: string;
  scores: Array<{ playerId: string; nickname: string; score: number; deltaThisRound: number }>;
}
