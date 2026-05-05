'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, usePeriodStore } from '@/stores';
import { initAuthToken } from '@/stores';

// Module-level flag — survives component remounts within the same page session
let _appInitialized = false;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (_appInitialized) return;
    _appInitialized = true;

    const publicPaths = ['/', '/login', '/lupa-kata-sandi', '/ganti-password', '/berita', '/lokasi', '/unduhan', '/verify-certificate'];
    const isPublicPath = publicPaths.some(path => 
      window.location.pathname === path || window.location.pathname.startsWith(path + '/')
    );

    if (!isPublicPath) {
      initAuthToken();
      useAuthStore.getState().fetchUser();
      usePeriodStore.getState().fetchPeriodContext();
    }

    const handleLogout = () => {
      useAuthStore.getState().clearUser();
      _appInitialized = false; // reset so re-login in same session re-fetches auth
      if (!window.location.pathname.startsWith('/login') &&
          !publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'))) {
        window.location.href = '/login';
      }
    };
    
    const handlePasswordChangeRequired = () => {
      if (!window.location.pathname.startsWith('/ganti-password')) {
        window.location.href = '/ganti-password';
      }
    };

    const handleProfileIncomplete = () => {
      if (!window.location.pathname.startsWith('/profil')) {
        window.location.href = '/profil';
      }
    };
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:require_password_change', handlePasswordChangeRequired);
    window.addEventListener('auth:profile_incomplete', handleProfileIncomplete);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:require_password_change', handlePasswordChangeRequired);
      window.removeEventListener('auth:profile_incomplete', handleProfileIncomplete);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
        }}
      />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
