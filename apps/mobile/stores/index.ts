import { create } from 'zustand';
import type { User } from '@sibermas/shared-types';
import { api, storeToken, removeToken } from '@/lib/api';

export function isDplLikeUser(user: User | null): boolean {
  const roles = user?.roles || [];
  return roles.includes('dpl') || roles.includes('dosen') || roles.includes('superadmin');
}

export function isStudentLikeUser(user: User | null): boolean {
  const roles = user?.roles || [];
  return roles.includes('student');
}

export function getMobileHomeRoute(user: User | null): '/(tabs)' | '/(dpl-tabs)' | '/unsupported' {
  if (isDplLikeUser(user)) return '/(dpl-tabs)';
  if (isStudentLikeUser(user)) return '/(tabs)';
  return '/unsupported';
}

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
    const data = await api.post('/auth/login', {
      login,
      password,
      captcha_id: captchaId,
      captcha_answer: captchaAnswer,
    }, { headers: { 'X-App-Type': 'mobile' } });

    const result = data as unknown as { token: string; user: User };
    await storeToken(result.token);
    set({ user: result.user, isAuthenticated: true, isLoading: false });
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
      const data = await api.get('/auth/user');
      const user = data as unknown as User | null;
      // Only set state when the outcome actually changes from current.
      // Frequent identical setState emits from Zustand trigger cascading
      // re-renders in expo-router's ImperativeApiEmitter (known bug in
      // 5.1.11 where `useSyncExternalStore(events)` + useEffect loops).
      if (user) {
        const current = useAuthStore.getState();
        if (current.user?.id !== user.id || !current.isAuthenticated || current.isLoading) {
          set({ user, isAuthenticated: true, isLoading: false });
        }
      } else {
        const current = useAuthStore.getState();
        if (current.user !== null || current.isAuthenticated || current.isLoading) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (error) {
      const current = useAuthStore.getState();
      // Only log out on 401 Unauthorized errors.
      // Keep user logged in for transient network errors.
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          if (current.user !== null || current.isAuthenticated || current.isLoading) {
            console.warn('User session expired, logging out');
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else if (current.isLoading) {
          console.warn('Failed to fetch user data, keeping user logged in');
          set({ isLoading: false });
        }
      } else if (current.isLoading) {
        console.warn('Network error while fetching user data, keeping user logged in');
        set({ isLoading: false });
      }
    }
  },
}));

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useLoginAction = () => useAuthStore((state) => state.login);
export const useLogoutAction = () => useAuthStore((state) => state.logout);
export const useFetchUserAction = () => useAuthStore((state) => state.fetchUser);
