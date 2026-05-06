import { create } from 'zustand';
import type { User } from '@sibermas/shared-types';
import { api, storeToken, removeToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  login: (login: string, password: string, captchaId: string, captchaAnswer: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  login: async (login, password, captchaId, captchaAnswer) => {
    const res = await api.post('/auth/login', {
      login,
      password,
      captcha_id: captchaId,
      captcha_answer: captchaAnswer,
    }, { headers: { 'X-App-Type': 'mobile' } });

    const data = res.data as { success: boolean; data: { token: string; user: User } };
    if (data.success) {
      await storeToken(data.data.token);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    await removeToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/user');
      const data = res.data as { success: boolean; data: User };
      if (data.success) {
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      // Only log out on 401 Unauthorized errors
      // Keep user logged in for transient network errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          console.warn('User session expired, logging out');
          set({ user: null, isAuthenticated: false, isLoading: false });
        } else {
          console.warn('Failed to fetch user data, keeping user logged in');
          set({ isLoading: false });
        }
      } else {
        console.warn('Network error while fetching user data, keeping user logged in');
        set({ isLoading: false });
      }
    }
  },
}));
