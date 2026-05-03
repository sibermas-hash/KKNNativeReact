import { create } from 'zustand';
import type { User, Period } from '@sibermas/shared-types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/user');
      const data = res.data as { success: boolean; data: User };
      if (data.success && data.data) {
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
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
  fetchPeriodContext: () => Promise<void>;
}

export const usePeriodStore = create<PeriodState>((set) => ({
  activePeriod: null,
  availablePeriods: [],
  currentPhase: 'upcoming',
  isLoading: true,

  fetchPeriodContext: async () => {
    try {
      const res = await api.get('/period-context');
      const data = res.data as {
        success: boolean;
        data: {
          active_period: Period | null;
          available_periods: Period[];
          current_phase: string;
        };
      };
      if (data.success) {
        set({
          activePeriod: data.data.active_period,
          availablePeriods: data.data.available_periods,
          currentPhase: data.data.current_phase,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
