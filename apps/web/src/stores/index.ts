import { create } from 'zustand';
import type { User, Period } from '@sibermas/shared-types';
import { api, authApi, periodContextApi } from '@/lib/api';

export function setAuthToken(token: string | null) {
  if (token) {
    // Web: Set cookie for middleware auth check + Axios header
    // Note: Client-side cookies cannot be HttpOnly. Use Secure + SameSite for XSS protection.
    const isSecure = window.location.protocol === 'https:';
    const cookieOptions = [
      'path=/',
      `max-age=${60 * 60 * 24 * 7}`, // 7 days
      'samesite=strict',
      isSecure ? 'secure' : '',
    ].filter(Boolean).join('; ');

    document.cookie = `sibermas_token=${token}; ${cookieOptions}`;
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
      // handleResponse in client.ts already extracts response.data.data,
      // so the result is the User object directly.
      const user = await authApi.user() as unknown as User | null;
      if (user && typeof user === 'object' && 'id' in user) {
        set({ user, isAuthenticated: true, isLoading: false, hasFetched: true });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
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
      // handleResponse in client.ts already extracts response.data.data,
      // so the result is the period context object directly.
      const data = await periodContextApi.get() as unknown as {
        active_period: Period | null;
        available_periods: Period[];
        current_phase: string;
      } | null;
      if (data) {
        set({
          activePeriod: data.active_period,
          availablePeriods: data.available_periods,
          currentPhase: data.current_phase,
          isLoading: false,
          hasFetched: true,
        });
      } else {
        set({ isLoading: false, hasFetched: true });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
