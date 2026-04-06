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
            <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
                <Head>
                    <title>{title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                </Head>

                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="lg:pl-72 flex flex-col min-h-screen transition-all">
                    {/* SYSTEM HEADER (CLEAN WHITE) */}
                    <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg lg:hidden"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-8 bg-emerald-600 rounded-full shadow-sm" />
                                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 hidden sm:block">
                                    {title || 'Dashboard'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pr-4 border-r border-slate-100 hidden md:flex">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-800 leading-none uppercase tracking-tighter">{auth?.user?.name}</p>
                                    <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-widest">
                                        {auth?.user?.roles?.[0] || 'Member'}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                                    <UserIcon size={16} />
                                </div>
                            </div>
                            
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
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
                    <footer className="h-10 bg-white border-t border-slate-100 px-6 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <span>SIM-KKN UIN SAIZU</span>
                            <span className="hidden sm:inline">&copy; 2026 LPPM</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span>OPERATIONAL</span>
                            </div>
                            <span className="text-slate-300">V3.1.0</span>
                        </div>
                    </footer>
                </div>
            </div>
        </ErrorBoundary>
    );
}
