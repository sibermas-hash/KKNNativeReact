import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, Power, ShieldCheck, Monitor } from 'lucide-react';
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
        axios
          .get('/up', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          })
          .catch(() => {});
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(heartbeat);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-lime-100 selection:text-lime-900">
        <Head>
          <title>{title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
        </Head>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* --- NAVBAR UTAMA --- */}
          <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl lg:hidden transition-all"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-lime-500 rounded-full hidden sm:block" />
                <div className="space-y-0.5">
                  <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Sistem Informasi KKN
                  </h1>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    {title || 'Beranda'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Status Sistem */}
              <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                 <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-lime-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Sistem Aktif
                  </span>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block text-slate-900">
                  <p className="text-xs font-bold leading-none truncate max-w-[150px]">
                    {auth?.user?.name}
                  </p>
                  <p className="text-[10px] font-semibold text-lime-600 mt-1 uppercase tracking-wider">
                    Profil Pengguna
                  </p>
                </div>

                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="h-11 w-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all group"
                  title="Keluar dari Sistem"
                >
                  <Power className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </header>

          {/* --- AREA KONTEN UTAMA --- */}
          <main className="p-4 lg:p-6 flex-1 bg-white app-workspace">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-full mx-auto"
            >
              {children}
            </motion.div>
          </main>

          {/* --- FOOTER --- */}
          <footer className="h-16 bg-transparent px-10 flex items-center justify-between">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-widest">
                LPPM UIN SAIZU &bull; &copy; {new Date().getFullYear()}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <Monitor size={14} />
              <span className="text-[10px] font-bold">VERSI 4.0.2</span>
            </div>
          </footer>
        </div>
        <AiAssistant />
      </div>
    </ErrorBoundary>
  );
}
