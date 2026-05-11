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
}

export interface GameData {
  id: string;
  code: string;
  hostId: string;
  status: string;
  difficulty: string;
  speedBonus: boolean;
  totalQuestions: number;
  players: Array<{ id: string; nickname: string; score: number }>;
}

export const api = {
  createGame: (payload: CreateGamePayload) =>
    request<GameData>('/games', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGame: (code: string) => request<GameData>(`/games/${code}`),
};
