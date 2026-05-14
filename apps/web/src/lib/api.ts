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

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  pseudo: string;
  avatarUrl: string | null;
  points: number;
  quizzesPlayed: number;
  tier: Tier;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface MyPosition extends LeaderboardEntry {
  connectionStreak: number;
}

export interface WeeklyBadge {
  id: string;
  weekStart: string;
  tier: Tier;
  points: number;
  rank: number | null;
}

export const api = {
  uploadAvatar: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${BASE}/upload/avatar`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body?.message ?? 'Upload failed');
    }
    const data = await res.json() as { url: string };
    return data.url;
  },

  createGame: (payload: CreateGamePayload) =>
    request<GameData>('/games', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGame: (code: string) => request<GameData>(`/games/${code}`),

  getLeaderboard: (page = 1, limit = 20) =>
    request<LeaderboardPage>(`/leaderboard?page=${page}&limit=${limit}`),

  getMyPosition: (token: string) =>
    request<MyPosition>('/leaderboard/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyBadges: (token: string) =>
    request<WeeklyBadge[]>('/leaderboard/badges', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getNextReset: () =>
    request<{ nextReset: string }>('/leaderboard/next-reset'),
};
