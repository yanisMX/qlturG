import type { Difficulty, GameMode, GameStatus } from '../store/gameStore';

const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? 'Request failed');
  }
  return res.json();
}

export interface CreateGamePayload {
  difficulty: string;
  totalQuestions: number;
  speedBonus: boolean;
  gameMode: string;
  questionDuration: number;
  doublePointsBonus: boolean;
  topics?: string[];
}

export interface GameData {
  id: string;
  code: string;
  hostId: string;
  status: GameStatus;
  difficulty: Difficulty;
  speedBonus: boolean;
  doublePointsBonus: boolean;
  gameMode: GameMode;
  totalQuestions: number;
  questionDuration: number;
  topics?: string[];
  players: Array<{ id: string; nickname: string; score: number; lives?: number; eliminated?: boolean }>;
}

export const api = {
  createGame: (payload: CreateGamePayload) =>
    request<GameData>('/games', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGame: (code: string) => request<GameData>(`/games/${code}`),
};
