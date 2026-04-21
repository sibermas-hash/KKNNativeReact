import { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, Power, BadgeCheck, Lock, AlertTriangle, X, ShieldCheck, GraduationCap } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import AiAssistant from '@/Components/AiAssistant';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import axios from 'axios';

import { useToast } from '@/Hooks/useToast';

// Context untuk mendeteksi apakah kita sudah berada di dalam AppLayout
const LayoutContext = createContext<{
  insideLayout: boolean;
  setTitle: (title: string) => void;
}>({
  insideLayout: false,
  setTitle: () => {},
});

export const useLayout = () => useContext(LayoutContext);

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { props } = usePage<any>();
  const { auth, flash } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState(title || '');
  const toast = useToast();
  const shownMessagesRef = useRef(new Set<string>());

  // Memeriksa apakah komponen ini dirender di dalam AppLayout lain
  const parentLayout = useLayout();

  // Handle flash messages globally - hanya tampilkan sekali per unique message
  useEffect(() => {
    if (parentLayout.insideLayout) return; // Hanya jalankan di layout terluar

    // Buat unique key untuk tracking messages yang sudah ditampilkan
    const showFlashMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string | undefined) => {
      if (!message) return;
      
      // Gunakan message + timestamp untuk membuat unique key
      const messageKey = `${type}:${message}`;
      
      // Hanya tampilkan jika belum pernah ditampilkan sebelumnya
      if (!shownMessagesRef.current.has(messageKey)) {
        shownMessagesRef.current.add(messageKey);
        toast[type](message);
      }
    };

    showFlashMessage('success', flash?.success);
    showFlashMessage('error', flash?.error);
    showFlashMessage('warning', flash?.warning);
    showFlashMessage('info', flash?.info);
  }, [flash?.success, flash?.error, flash?.warning, flash?.info, parentLayout.insideLayout, toast]);

  // Clear shown messages ketika semua flash messages kosong (page baru/navigasi)
  useEffect(() => {
    if (!flash?.success && !flash?.error && !flash?.warning && !flash?.info) {
      shownMessagesRef.current.clear();
    }
  }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

  // Sinkronisasi judul jika title prop berubah
  useEffect(() => {
    if (title) {
      setDynamicTitle(title);
      if (parentLayout.insideLayout) {
        parentLayout.setTitle(title);
      }
    }
  }, [title, parentLayout]);

  const layoutContextValue = useMemo(() => ({ insideLayout: true, setTitle: setDynamicTitle }), []);

  // JIKA SUDAH DI DALAM LAYOUT: Hanya render isinya (Fragment)
  // Ini mencegah double padding (lg:pl-60) dan double sidebar
  if (parentLayout.insideLayout) {
    return <>{children}</>;
  }

  const displayTitle = dynamicTitle || '';

  const logout = () => {
    axios.post(route('logout')).then(() => {
      window.location.href = '/';
    });
  };

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="min-h-screen bg-white font-sans">
        <Head>
          <title>{displayTitle ? `${displayTitle} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
        </Head>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-60 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">


          {/* TOP HEADER BAR */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-emerald-50 px-6 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-emerald-800 hover:bg-gray-50 rounded-lg lg:hidden transition-colors"
                aria-label="Buka Menu"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>

              <h2 className="text-lg font-bold text-emerald-950">{displayTitle}</h2>
            </div>

            <div className="flex items-center gap-4">
              {auth?.user?.roles?.some((r: any) => r.name === 'student') && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const reg = props.registration;
                      const status = reg?.status?.toLowerCase();
                      if (['approved', 'disetujui', 'completed'].includes(status)) {
                        return (
                          <>
                            <BadgeCheck size={12} className="text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-950 uppercase">Peserta Aktif</span>
                          </>
                        );
                      }
                      if (['pending', 'menunggu'].includes(status)) {
                        return (
                          <>
                            <Lock size={12} className="text-amber-600" />
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-tighter">Verifikasi</span>
                          </>
                        );
                      }
                      if (['rejected', 'ditolak'].includes(status)) {
                        return (
                          <>
                            <AlertTriangle size={12} className="text-rose-600" />
                            <span className="text-[10px] font-black text-rose-800 uppercase tracking-tighter">Perbaikan</span>
                          </>
                        );
                      }
                      return (
                        <>
                          <X size={12} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Belum Terdaftar</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {auth?.user?.roles?.some((r: any) => r.name === 'dpl') && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                   <ShieldCheck size={12} className="text-emerald-600" />
                   <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">Dosen Pembimbing</span>
                </div>
              )}

              {auth?.user?.roles?.some((r: any) => r.name === 'dosen') && !auth?.user?.roles?.some((r: any) => r.name === 'dpl') && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                   <GraduationCap size={12} className="text-emerald-600" />
                   <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">Dosen</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Power className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>

        <AiAssistant />
      </div>
    </LayoutContext.Provider>
  );
}

// Helper static layout property
AppLayout.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
