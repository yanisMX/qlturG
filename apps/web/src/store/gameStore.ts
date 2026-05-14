import { create } from 'zustand';

export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
export type Difficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'VARIE';
export type GameMode = 'STANDARD' | 'SURVIVAL_SOLO' | 'SURVIVAL_MULTI';
export type Topic = 'HISTOIRE' | 'GEOGRAPHIE' | 'GEOPOLITIQUE' | 'CINEMA' | 'PHILOSOPHIE' | 'LITTERATURE' | 'ANIMAUX' | 'INFORMATIQUE';

export interface PlayerInfo {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  score: number;
  lives?: number;
  eliminated?: boolean;
}

export interface Question {
  index: number;
  total: number | null;
  text: string;
  choices: string[];
  startsAt: string;
  endsAt: string;
  isDoublePoints?: boolean;
  topic?: string;
}

export interface RevealData {
  answerIndex: number;
  explanation: string;
  scores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    deltaThisRound: number;
    lives?: number;
    eliminated?: boolean;
  }>;
}

export interface RankingEntry {
  rank: number;
  playerId: string;
  nickname: string;
  score: number;
  lives?: number;
  eliminated?: boolean;
}

interface GameState {
  gameId: string | null;
  code: string | null;
  status: GameStatus;
  difficulty: Difficulty | null;
  topics: Topic[];
  gameMode: GameMode;
  speedBonus: boolean;
  doublePointsBonus: boolean;
  totalQuestions: number;
  questionDuration: number;
  hostId: string | null;
  players: PlayerInfo[];
  myPlayerId: string | null;
  isHost: boolean;

  currentQuestion: Question | null;
  myAnswer: number | null;
  reveal: RevealData | null;
  myLives: number;

  ranking: RankingEntry[];
  error: string | null;

  setGameState: (state: Partial<GameState>) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  addPlayer: (player: PlayerInfo) => void;
  removePlayer: (playerId: string) => void;
  setQuestion: (q: Question) => void;
  setMyAnswer: (idx: number) => void;
  setReveal: (r: RevealData) => void;
  setRanking: (r: RankingEntry[]) => void;
  setError: (msg: string | null) => void;
  setMyLives: (lives: number) => void;
  reset: () => void;
}

const defaultState = {
  gameId: null,
  code: null,
  status: 'LOBBY' as GameStatus,
  difficulty: null,
  topics: [] as Topic[],
  gameMode: 'STANDARD' as GameMode,
  speedBonus: true,
  doublePointsBonus: false,
  totalQuestions: 10,
  questionDuration: 10,
  hostId: null,
  players: [],
  myPlayerId: null,
  isHost: false,
  currentQuestion: null,
  myAnswer: null,
  reveal: null,
  myLives: 3,
  ranking: [],
  error: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...defaultState,

  setGameState: (partial) => set((s) => ({ ...s, ...partial })),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((s) => {
      if (s.players.some((p) => p.id === player.id)) return s;
      return { players: [...s.players, player] };
    }),

  removePlayer: (playerId) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== playerId) })),

  setQuestion: (q) => set({ currentQuestion: q, myAnswer: null, reveal: null }),

  setMyAnswer: (idx) => set({ myAnswer: idx }),

  setReveal: (r) =>
    set((s) => ({
      reveal: r,
      players: s.players.map((p) => {
        const updated = r.scores.find((sc) => sc.playerId === p.id);
        return updated
          ? { ...p, score: updated.score, lives: updated.lives, eliminated: updated.eliminated }
          : p;
      }),
    })),

  setRanking: (ranking) => set({ ranking, status: 'FINISHED' }),

  setError: (error) => set({ error }),

  setMyLives: (myLives) => set({ myLives }),

  reset: () => set(defaultState),
}));
