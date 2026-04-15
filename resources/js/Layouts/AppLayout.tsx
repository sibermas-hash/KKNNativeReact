import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, Power } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import AiAssistant from '@/Components/AiAssistant';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { motion } from 'framer-motion';
import axios from 'axios';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { auth } = usePage<{ auth: { user: User | null } }>().props;

  useEffect(() => {
    const heartbeat = setInterval(
      () => {
        axios.get('/up', { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(heartbeat);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAFAFA] text-black font-sans antialiased relative overflow-hidden">
        {/* PREMIUM AMBIENT GLOWS (Hanya memantulkan warna emerald super pudar) */}
        <div className="fixed top-0 left-0 w-[50vw] h-[50vw] bg-emerald-100/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-emerald-200/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <Head>
          <title>{title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
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

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
                 <h2 className="text-xl font-extrabold text-black tracking-tight">{title || 'Beranda Utama'}</h2>
              </motion.div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-bold text-black tracking-tight">{auth?.user?.name}</span>
                <span className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mt-0.5">Administrator</span>
              </div>

              <div className="h-10 w-px bg-emerald-100 hidden sm:block mx-1" />

              <Link
                href="/logout"
                method="post"
                as="button"
                className="p-3 rounded-xl bg-white border border-emerald-100/50 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 shadow-sm transition-all duration-300 flex items-center justify-center group"
                title="Selesaikan Sesi (Logout)"
              >
                <Power className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
              </Link>
            </div>
          </header>

          {/* MAIN CANVAS */}
          <main className="p-4 sm:p-8 lg:p-10 flex-1 w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        <AiAssistant />
      </div>
    </ErrorBoundary>
  );
}
