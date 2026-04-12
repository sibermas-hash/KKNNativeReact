import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { Menu, LogOut, User as UserIcon, Power, ShieldCheck, Cpu } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage<{ auth: { user: User | null } }>().props;

    useEffect(() => {
        const heartbeat = setInterval(() => {
            axios.get('/dashboard', { 
                headers: { 'X-Requested-With': 'XMLHttpRequest' } 
            }).catch(() => {});
        }, 5 * 60 * 1000);
        return () => clearInterval(heartbeat);
    }, []);

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
                <Head>
                    <title>{title ? `${title} | KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'}</title>
                </Head>

                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="lg:pl-72 flex flex-col min-h-screen">
                    {/* --- TACTICAL HEADER --- */}
                    <header className="sticky top-0 z-40 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl lg:hidden transition-all"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] hidden sm:block" />
                                <div className="space-y-0.5">
                                    <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Command Center</h1>
                                    <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                                        {title || 'Dashboard'}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* System Status Indicators */}
                            <div className="hidden xl:flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Online</span>
                                </div>
                                <div className="h-4 w-[1px] bg-slate-200" />
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Cpu size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node JS-20</span>
                                </div>
                            </div>

                            <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[11px] font-black text-slate-900 leading-none uppercase truncate max-w-[150px]">{auth?.user?.name}</p>
                                    <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-widest">
                                        Active Profile
                                    </p>
                                </div>
                                
                                <Link 
                                    href="/logout" 
                                    method="post" 
                                    as="button"
                                    className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10 group"
                                    title="Terminate Session"
                                >
                                    <Power className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* --- MAIN OPERATIONAL AREA --- */}
                    <main className="p-6 lg:p-12 lg:pt-10 flex-1 relative overflow-hidden">
                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="max-w-[1600px] mx-auto space-y-12 relative z-10"
                        >
                            {children}
                        </motion.div>
                    </main>

                    {/* --- TACTICAL FOOTER --- */}
                    <footer className="h-20 bg-white border-t border-slate-200/60 px-10 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-slate-900 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-white">SA</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-800 tracking-[0.2em] uppercase">SIM-KKN Engine</span>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-100 hidden sm:block" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
                                LPPM UIN SAIZU &bull; &copy; {new Date().getFullYear()}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                                <ShieldCheck size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Verified Infrastructure</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 tracking-tighter">
                                {import.meta.env.VITE_APP_VERSION || `BUILD_V4.0.2R`}
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        </ErrorBoundary>
    );
}
