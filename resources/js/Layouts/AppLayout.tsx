import { useState, useEffect, createContext, useContext } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, Power } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import AiAssistant from '@/Components/AiAssistant';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { motion } from 'framer-motion';
import axios from 'axios';

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
  const { auth } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState(title || '');

  // Memeriksa apakah komponen ini dirender di dalam AppLayout lain
  const parentLayout = useLayout();

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
  // Ini mencegah double padding (lg:pl-72) dan double sidebar
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
      <div className="min-h-screen bg-white relative font-sans">
        {/* PREMIUM AMBIENT GLOWS */}
        <div className="fixed top-0 left-0 w-[50vw] h-[50vw] bg-emerald-100/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-emerald-200/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <Head>
          <title>{displayTitle ? `${displayTitle} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
        </Head>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300 relative z-10 w-full overflow-x-hidden">
          {/* GLASSMORPHISM HEADER */}
          <header className="sticky top-0 z-40 h-20 bg-white/70 backdrop-blur-2xl border-b border-emerald-100/50 px-6 sm:px-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl lg:hidden transition-all bg-white shadow-sm border border-emerald-100/50"
                aria-label="Buka Menu"
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                 <h2 className="text-xl font-extrabold text-emerald-950 tracking-tight">{displayTitle}</h2>
              </motion.div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-bold text-emerald-950 tracking-tight">{auth?.user?.name}</span>
                <span className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mt-0.5">Administrator</span>
              </div>

              <div className="h-10 w-px bg-emerald-100 hidden sm:block mx-1" />

              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm bg-white border border-rose-100/50 shadow-sm"
              >
                <Power className="h-4 w-4" strokeWidth={3} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-6 sm:p-10 relative">
            <ErrorBoundary>
              <div className="relative z-10">
                {children}
              </div>
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
