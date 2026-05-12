import { create } from 'zustand';

export interface AuthUser {
  id: string;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  oauthProvider: string | null;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;

  setToken: (token: string) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  init: () => Promise<void>;
}

const TOKEN_KEY = 'hf_token';
const BASE = import.meta.env.VITE_API_URL as string;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const token = get().token ?? localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('unauthorized');
      const user: AuthUser = await res.json();
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, isLoading: false });
    }
  },

  init: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false });
      return;
    }
    set({ token });
    await get().fetchMe();
  },
}));
