import { create } from 'zustand';
import type { User, Period } from '@sibermas/shared-types';
import { api } from '@/lib/api';

export function setAuthToken(token: string | null) {
  if (token) {
    // Web uses Sanctum cookie auth (withCredentials). Bearer token only for mobile fallback.
    // Do NOT store in localStorage — XSS risk.
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    document.cookie = 'sibermas_token=; path=/; max-age=0';
    delete api.defaults.headers.common['Authorization'];
  }
}

export function initAuthToken() {
  if (typeof window === 'undefined') return;
  // Read token from cookie only (set by server as HttpOnly or by mobile flow)
  const token = document.cookie.match(/sibermas_token=([^;]+)/)?.[1] ?? null;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasFetched: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, hasFetched: true }),

  clearUser: () => {
    setAuthToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: false });
  },

  fetchUser: async () => {
    if (get().hasFetched) return;
    try {
      const res = await api.get('/auth/user') as unknown as { success: boolean; data: User };
      if (res.success && res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false, hasFetched: true });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      // hasFetched stays false — allows retry on next navigation
    }
  },
}));

interface PeriodState {
  activePeriod: Period | null;
  availablePeriods: Period[];
  currentPhase: string;
  isLoading: boolean;
  hasFetched: boolean;
  fetchPeriodContext: () => Promise<void>;
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  activePeriod: null,
  availablePeriods: [],
  currentPhase: 'upcoming',
  isLoading: true,
  hasFetched: false,

  fetchPeriodContext: async () => {
    if (get().hasFetched) return;
    try {
      const res = await api.get('/period-context') as unknown as {
        success: boolean;
        data: {
          active_period: Period | null;
          available_periods: Period[];
          current_phase: string;
        };
      };
      if (res.success) {
        set({
          activePeriod: res.data.active_period,
          availablePeriods: res.data.available_periods,
          currentPhase: res.data.current_phase,
          isLoading: false,
          hasFetched: true,
        });
      } else {
        set({ isLoading: false, hasFetched: true });
      }
    } catch {
      set({ isLoading: false });
      // hasFetched stays false — allows retry
    }
  },
}));
