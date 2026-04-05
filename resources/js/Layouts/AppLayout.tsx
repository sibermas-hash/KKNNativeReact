import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, LogOut, LayoutGrid, Search, Bell, Grid3X3, ArrowRight } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { clsx } from 'clsx';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage<{ auth: { user: User | null } }>().props;

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50/30 text-slate-700 selection:bg-emerald-100 selection:text-emerald-900">
                <Head title={title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

                {/* --- SIDEBAR --- */}
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className="lg:pl-80 flex flex-col min-h-screen">
                    {/* --- PREMIUM HEADER --- */}
                    <header className="sticky top-0 z-40 h-24 flex items-center bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 lg:px-12 transition-all" role="banner">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-3 text-slate-600 hover:bg-slate-50 rounded-2xl lg:hidden transform active:scale-90 transition-all border border-slate-100 shadow-sm"
                            aria-label="Open sidebar navigation"
                        >
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex flex-col">
                             <div className="flex items-center gap-3">
                                 <LayoutGrid size={16} className="text-emerald-600 animate-pulse" />
                                 <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{title}</h1>
                             </div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic leading-none">Terminal Operasional &bull; v2.0</p>
                        </div>

                        {/* Search & Actions Area */}
                        <div className="ml-auto flex items-center gap-6">
                            <div className="hidden xl:flex items-center gap-3 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl group focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-500/20 transition-all">
                                <Search size={16} className="text-slate-300 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Global Search..."
                                    className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-900 placeholder:text-slate-400 p-0 w-48 uppercase tracking-widest italic"
                                    aria-label="Search across the application"
                                />
                            </div>

                            <button
                                className="relative p-3 text-slate-400 hover:text-emerald-600 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all group active:scale-95"
                                aria-label="View notifications"
                            >
                                 <Bell size={20} aria-hidden="true" />
                                 <span className="absolute top-3 right-3 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-bounce" aria-hidden="true" />
                            </button>

                            <div className="h-10 w-[1px] bg-slate-100 mx-2 hidden sm:block" />

                            {/* User Profile Summary */}
                            <div className="hidden sm:flex items-center gap-5">
                                <div className="text-right flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{auth?.user?.name}</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-[0.2em] opacity-80">{auth?.user?.roles?.[0] || 'PERSONEL'}</span>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-slate-900 shadow-xl overflow-hidden border-2 border-white ring-4 ring-slate-50 group cursor-pointer hover:rotate-3 transition-transform">
                                     <div className="h-full w-full flex items-center justify-center text-white font-black text-xl italic uppercase">
                                         {auth?.user?.name?.charAt(0)}
                                     </div>
                                </div>
                            </div>
                            
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-3 text-slate-400 hover:text-rose-600 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all active:scale-95"
                                aria-label="Log out of your account"
                                title="Safe Logout"
                            >
                                <LogOut className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        </div>
                    </header>

                    {/* --- MAIN ENGINE --- */}
                    <main className="flex-1 px-8 lg:px-12 py-12 w-full">
                        <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {children}
                        </div>
                    </main>

                    {/* --- FOOTER TERMINAL --- */}
                    <footer className="px-12 py-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                 <Grid3X3 size={18} />
                             </div>
                             <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] italic">SIM-KKN UIN SAIZU</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Informasi Manajemen Terintegrasi &copy; 2026</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-8">
                             <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server_Status: Operational</span>
                             </div>
                             <span className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic shadow-xl shadow-slate-900/10">v3.1.2</span>
                        </div>
                    </footer>
                </div>
            </div>
        </ErrorBoundary>
    );
}
