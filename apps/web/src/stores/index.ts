import { create } from 'zustand';
import type { User, Period } from '@sibermas/shared-types';
import { api, apiUrl, periodContextApi } from '@/lib/api';

export function setAuthToken(token: string | null) {
  if (token) {
    // Token cookie is set as HttpOnly by the backend — only manage axios header here
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Clear axios header; backend clears HttpOnly cookie on logout
    delete api.defaults.headers.common['Authorization'];
  }
}

export function resetAuthState() {
  setAuthToken(null);
  _fetchUserPromise = null;
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, hasFetched: false });
  usePeriodStore.setState({ activePeriod: null, availablePeriods: [], currentPhase: 'upcoming', isLoading: false, hasFetched: false });
}

function clearLegacyRoleCookie() {
  // R13-FE-008: middleware now trusts only the HttpOnly `sibermas_token`, so
  // the client-readable `sibermas_role` cookie that previously existed adds no
  // security value and leaks the role to any script on the page. The legacy
  // cookie is no longer written — this function kept as no-op for call sites.
}

export function setProfileCompleteCookie(_isComplete: boolean) {
  // R13-FE-009: Deprecated. Middleware now trusts only the HttpOnly
  // `sibermas_token` cookie. Profile completeness is enforced by the backend
  // via API response code PROFILE_INCOMPLETE. This is a no-op kept for
  // backward-compat call sites.
}

export function initAuthToken() {
  if (typeof window === 'undefined') return;
  // Read token from cookie (set as HttpOnly by backend; readable only via server-side)
  // For client-side axios, we read the non-HttpOnly fallback or rely on cookie being sent automatically.
  // Since sibermas_token is HttpOnly, we cannot read it here — axios will send it automatically via credentials.
  // We only need to ensure axios is configured to send cookies.
  api.defaults.withCredentials = true;
}

// Module-level in-flight promise to deduplicate concurrent fetchUser calls (FE-H1)
// Safe: this module is only evaluated client-side (stores are not used in SSR paths)
let _fetchUserPromise: Promise<AuthFetchOutcome> | null = null;

type AuthFetchOutcome = 'authenticated' | 'anonymous' | 'error';

type CurrentUserProbeResult =
  | { kind: 'authenticated'; user: User }
  | { kind: 'anonymous' }
  | { kind: 'error' };

async function fetchCurrentUserSilently(): Promise<CurrentUserProbeResult> {
  try {
    const response = await fetch(apiUrl('/auth/user'), {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      return { kind: 'anonymous' };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return { kind: 'error' };
    }

    const payload = await response.json() as { data?: unknown } | User | null;
    const maybeUser =
      payload && typeof payload === 'object' && 'data' in payload
        ? payload.data
        : payload;

    if (maybeUser && typeof maybeUser === 'object' && 'id' in maybeUser) {
      return { kind: 'authenticated', user: maybeUser as User };
    }

    return { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchUser: (force?: boolean) => Promise<AuthFetchOutcome>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasFetched: false,

  setUser: (user) => {
    clearLegacyRoleCookie();
    set({ user, isAuthenticated: !!user, isLoading: false, hasFetched: true });
  },

  clearUser: () => {
    resetAuthState();
    window.dispatchEvent(new Event('auth:logout'));
  },

  fetchUser: (force = false) => {
    if (get().hasFetched && !force) {
      return Promise.resolve(get().isAuthenticated ? 'authenticated' : 'anonymous');
    }
    // Deduplicate concurrent calls (FE-H1)
    if (_fetchUserPromise) return _fetchUserPromise;
    set({ isLoading: true });
    _fetchUserPromise = (async () => {
      try {
        const result = await fetchCurrentUserSilently();

        if (result.kind === 'authenticated') {
          const user = result.user;
          clearLegacyRoleCookie();
          set({ user, isAuthenticated: true, isLoading: false, hasFetched: true });
          const u = user as User & { password_changed_at?: string | null; must_change_password?: boolean; profile_complete?: boolean };
          const isSuperadmin = user.roles?.includes('superadmin');
          setProfileCompleteCookie(isSuperadmin || !!u.profile_complete);
          if (!isSuperadmin && (u.must_change_password || !u.password_changed_at)) {
            window.dispatchEvent(new Event('auth:require_password_change'));
          } else if (!isSuperadmin && (!u.profile_complete || u.must_change_password)) {
            window.dispatchEvent(new Event('auth:profile_incomplete'));
          }
          return 'authenticated' as const;
        }

        if (result.kind === 'anonymous') {
          set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: true });
          return 'anonymous' as const;
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: true });
          return 'error' as const;
        }
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false, hasFetched: true });
        return 'error' as const;
      } finally {
        _fetchUserPromise = null;
      }
    })();
    return _fetchUserPromise;
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
      set({ isLoading: false, hasFetched: true });
    }
  },
}));
