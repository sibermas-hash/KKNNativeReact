'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryPersist } from '@/components/providers/query-persist';
import { useState, useEffect, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { PopupAnnouncement } from '@/components/public/home-popup-announcement';
import { resetAuthState, useAuthStore, usePeriodStore } from '@/stores';
import { initAuthToken } from '@/stores';
import { buildLoginHref } from '@/lib/auth-routing';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-red-600 mb-2">Terjadi kesalahan</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="text-xs text-slate-500 underline">Muat ulang halaman</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

const PUBLIC_PATHS = ['/', '/login', '/lupa-kata-sandi', '/atur-ulang-kata-sandi', '/ganti-password', '/berita', '/lokasi', '/unduhan', '/verify-certificate', '/phase-blocked', '/pengumuman', '/support'];
const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/dosen', '/profil', '/ganti-password'];
const POPUP_PATHS = ['/', '/berita', '/lokasi', '/unduhan', '/pengumuman', '/support'];
const STALE_AUTH_CLEAR_GUARD_PREFIX = 'sibermas:stale-auth-clear';

function matchesPath(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}

async function hasServerAuthCookie(): Promise<boolean> {
  try {
    const response = await fetch('/session-status', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) return false;

    const payload = await response.json() as { has_auth_cookie?: boolean };
    return payload.has_auth_cookie === true;
  } catch {
    return false;
  }
}

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
  const pathname = usePathname();

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: 600_000, retry: 1, refetchOnWindowFocus: false } },
  }));

  useEffect(() => {
    initAuthToken();
  }, []);

  useEffect(() => {
    const path = pathname || window.location.pathname;
    const isProtected = matchesPath(path, PROTECTED_PREFIXES);
    const staleCookieGuardKey = `${STALE_AUTH_CLEAR_GUARD_PREFIX}:${path}`;
    let cancelled = false;

    void (async () => {
      const authResult = await useAuthStore.getState().fetchUser();
      if (cancelled) return;

      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        try {
          window.sessionStorage.removeItem(staleCookieGuardKey);
        } catch { /* private browsing / blocked storage */ }
        if (isProtected && !usePeriodStore.getState().hasFetched) {
          void usePeriodStore.getState().fetchPeriodContext();
        }
        return;
      }

      if (isProtected) {
        usePeriodStore.setState({ activePeriod: null, availablePeriods: [], currentPhase: 'upcoming', isLoading: false, hasFetched: false });
        return;
      }

      const hasStaleAuthCookie = authResult === 'anonymous' && await hasServerAuthCookie();

      if (!hasStaleAuthCookie) {
        try {
          window.sessionStorage.removeItem(staleCookieGuardKey);
        } catch { /* private browsing / blocked storage */ }
        return;
      }

      let alreadyAttempted = false;
      try {
        alreadyAttempted = window.sessionStorage.getItem(staleCookieGuardKey) === '1';
        if (!alreadyAttempted) {
          window.sessionStorage.setItem(staleCookieGuardKey, '1');
        }
      } catch {
        alreadyAttempted = false;
      }

      if (!alreadyAttempted && !cancelled) {
        window.location.replace(`/clear-session?redirect=${encodeURIComponent(buildLoginHref(path))}`);
      }
    })();
 
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handleLogout = () => {
      resetAuthState();
      const path = window.location.pathname;
      const isPublic = matchesPath(path, PUBLIC_PATHS);
      if (!path.startsWith('/login') && !isPublic) window.location.href = '/';
    };
    const handlePasswordChange = () => {
      if (!window.location.pathname.startsWith('/ganti-password')) window.location.href = '/ganti-password';
    };
    const handleProfileIncomplete = () => {
      if (!window.location.pathname.startsWith('/profil')) window.location.href = '/profil';
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:require_password_change', handlePasswordChange);
    window.addEventListener('auth:profile_incomplete', handleProfileIncomplete);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:require_password_change', handlePasswordChange);
      window.removeEventListener('auth:profile_incomplete', handleProfileIncomplete);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <QueryPersist queryClient={queryClient} />
        <ThemeProvider>
          <TooltipPrimitive.Provider delayDuration={200}>
            <SmoothScrollProvider>
              {children}
              <PublicPopupWrapper />
            </SmoothScrollProvider>
          </TooltipPrimitive.Provider>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} theme="light" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function PublicPopupWrapper(): React.JSX.Element | null {
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const isPopupRoute = POPUP_PATHS.some((p) => path === p || path.startsWith(p + '/'));
    setIsPublicRoute(isPopupRoute);
  }, []);

  if (!isPublicRoute) return null;
  return <PopupAnnouncement />;
}
