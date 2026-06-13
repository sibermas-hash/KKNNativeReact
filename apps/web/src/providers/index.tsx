'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Toaster } from 'sonner';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { PopupAnnouncement } from '@/components/public/home-popup-announcement';
import { resetAuthState, useAuthStore, usePeriodStore } from '@/stores';
import { initAuthToken } from '@/stores';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* UI fallback only; keep console clean. */ }
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
const POPUP_PATHS = ['/', '/berita', '/lokasi', '/unduhan', '/pengumuman', '/support'];

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
  const initialized = useRef(false);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: 600_000, retry: 1, refetchOnWindowFocus: false } },
  }));

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initAuthToken();

    const uiVersion = 'sidebar-profile-v3';
    if (window.localStorage.getItem('sibermas_ui_version') !== uiVersion) {
      window.localStorage.setItem('sibermas_ui_version', uiVersion);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => void reg.unregister())).catch(() => undefined);
      }
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => undefined);
      }
      window.setTimeout(() => window.location.reload(), 250);
      return;
    }

    // Selalu probe `/auth/user` di awal load. HttpOnly cookies otomatis
    // terkirim — server reply 200 + user payload untuk authenticated, atau
    // 401 + null untuk anonymous. Token tidak pernah dipegang JS; middleware
    // server-side yang authorize route protected.
    //
    // Penting: JANGAN `resetAuthState()` di public route. Itu yang bikin
    // user complain "kok login lagi padahal tidak log out" — padahal
    // cookie HttpOnly masih ada, tapi store di-clear paksa setiap kali
    // navigasi ke `/`, `/berita`, dll. Navbar jadi tidak tahu user sudah
    // login, dan tetap tampilkan tombol "Login".
    void useAuthStore.getState().fetchUser().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        usePeriodStore.getState().fetchPeriodContext();
      } else {
        usePeriodStore.setState({ isLoading: false, hasFetched: true });
      }
    });

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
