import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import { ErrorBoundary } from '@/Components/ErrorBoundary';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage<{ auth: { user: User | null } }>().props;

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-slate-950 text-emerald-900 dark:text-slate-100 font-sans antialiased">
                <Head>
                    <title>{title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                </Head>

                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="lg:pl-72 flex flex-col min-h-screen transition-all">
                    {/* SYSTEM HEADER (CLEAN WHITE/DARK) */}
                    <header className="sticky top-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-emerald-50 dark:border-slate-800 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 text-emerald-400 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg lg:hidden"
                                aria-label="Buka menu navigasi"
                                aria-expanded={sidebarOpen}
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-8 bg-emerald-600 dark:bg-emerald-500 rounded-full shadow-sm shadow-emerald-600/20 dark:shadow-emerald-500/20" />
                                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-900 dark:text-slate-100 hidden sm:block">
                                    {title || 'Dasbor'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pr-4 border-r border-emerald-50 dark:border-slate-800 hidden md:flex">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-900 dark:text-slate-100 leading-none uppercase tracking-tighter">{auth?.user?.name}</p>
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">
                                        {(() => {
                                            const firstRole = auth?.user?.roles?.[0];
                                            return typeof firstRole === 'object' && firstRole !== null ? (firstRole as { name: string }).name : (firstRole || 'Pengguna');
                                        })()}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-slate-700 shadow-sm">
                                    <UserIcon size={16} />
                                </div>
                            </div>

                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-2 text-emerald-300 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-all"
                                aria-label="Keluar dari sistem"
                                title="Keluar"
                            >
                                <LogOut className="h-5 w-5" />
                            </Link>
                        </div>
                    </header>

                    {/* MAIN WORKSPACE */}
                    <main className="p-8 flex-1">
                        <div className="max-w-[1400px] mx-auto">
                            {children}
                        </div>
                    </main>

                    {/* STATUS STRIP (CLEAN) */}
                    <footer className="h-10 bg-white border-t border-emerald-50 px-6 flex items-center justify-between text-[9px] font-black text-emerald-600/40 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <span>SIM-KKN UIN SAIZU</span>
                            <span className="hidden sm:inline">&copy; 2026 LPPM</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span>Sistem Aktif</span>
                            </div>
                            <span className="text-emerald-200">V3.1.0</span>
                        </div>
                    </footer>
                </div>
            </div>
        </ErrorBoundary>
    );
}
