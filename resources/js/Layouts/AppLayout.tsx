import { useState, useEffect, createContext, useContext } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, Power } from 'lucide-react';
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

  // Memeriksa apakah komponen ini dirender di dalam AppLayout lain
  const parentLayout = useLayout();

  // Handle flash messages globally
  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (flash?.warning) toast.warning(flash.warning);
    if (flash?.info) toast.info(flash.info);
  }, [flash, toast]);

  // Sinkronisasi judul jika title prop berubah
  useEffect(() => {
    if (title) {
      setDynamicTitle(title);
      if (parentLayout.insideLayout) {
        parentLayout.setTitle(title);
      }
    }
  }, [title, parentLayout]);

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
    <LayoutContext.Provider value={{ insideLayout: true, setTitle: setDynamicTitle }}>
      <div className="min-h-screen bg-white font-sans">
        <Head>
          <title>{displayTitle ? `${displayTitle} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
        </Head>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-60 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
          {/* TOP HEADER BAR */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg lg:hidden transition-colors"
                aria-label="Buka Menu"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>

              <h2 className="text-lg font-bold text-gray-900">{displayTitle}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-bold text-gray-900">{auth?.user?.name}</span>
                <span className="text-xs font-medium text-gray-700 uppercase">Administrator</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Power className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
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
