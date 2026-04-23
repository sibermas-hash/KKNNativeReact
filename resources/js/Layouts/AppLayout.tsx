import { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Menu, Power, BadgeCheck, ShieldCheck } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50 font-sans">
        <Head>
          <title>{displayTitle ? `${displayTitle} | SIBERDAYA` : 'SIBERDAYA'}</title>
        </Head>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">

          {/* Header */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-[1.1rem] font-black text-emerald-950 uppercase tracking-tighter font-display leading-none">{displayTitle}</h2>
            </div>

            <div className="flex items-center gap-3">
              {auth?.user?.roles?.some((r: any) => ['admin', 'superadmin', 'faculty_admin'].includes(r.name)) && (
                <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                  <ShieldCheck size={12} />
                  Admin
                </span>
              )}

              {auth?.user?.roles?.some((r: any) => r.name === 'student') && (
                <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                  <BadgeCheck size={12} />
                  Mahasiswa
                </span>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Power className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 lg:p-8">

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
