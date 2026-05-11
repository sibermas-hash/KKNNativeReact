'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Toaster } from 'sonner';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { resetAuthState, useAuthStore, usePeriodStore } from '@/stores';
import { initAuthToken } from '@/stores';

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

const PUBLIC_PATHS = ['/', '/login', '/lupa-kata-sandi', '/atur-ulang-kata-sandi', '/ganti-password', '/berita', '/lokasi', '/unduhan', '/verify-certificate', '/phase-blocked'];
const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/dosen', '/profil', '/ganti-password'];

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
  const initialized = useRef(false);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: 600_000, retry: 1, refetchOnWindowFocus: false } },
  }));

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initAuthToken();

    const path = window.location.pathname;
    const isProtected = PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

    // Always attempt to fetch user on protected routes. The HttpOnly
    // sibermas_token cookie is sent automatically via credentials — we
    // cannot read it client-side, so we just try the API call.
    if (isProtected) {
      useAuthStore.getState().fetchUser().then(() => {
        if (useAuthStore.getState().isAuthenticated) {
          usePeriodStore.getState().fetchPeriodContext();
        } else {
          usePeriodStore.setState({ isLoading: false, hasFetched: true });
        }
      });
    } else {
      resetAuthState();
    }

    const handleLogout = () => {
      resetAuthState();
      initialized.current = false;
      const path = window.location.pathname;
      const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
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
        <ThemeProvider>
          <TooltipPrimitive.Provider delayDuration={200}>
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </TooltipPrimitive.Provider>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} theme="light" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
