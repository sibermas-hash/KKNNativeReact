import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, ArrowRight, Menu, X, Landmark, GraduationCap, Users, ShieldCheck, Activity, Zap, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

interface Props {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const page = usePage<PageProps>();
    const { auth } = page.props;
    const currentUrl = page.url;
    const portalHref = auth.user ? route('dashboard') : route('login');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Profil', href: route('public.about') },
        { name: 'Skema', href: route('public.schemes') },
        { name: 'Warta', href: route('public.announcements') },
        { name: 'Repository', href: route('public.downloads') },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            {/* --- COMMAND NAVBAR --- */}
            <nav 
                className={clsx(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 h-24 flex items-center border-b",
                    isScrolled 
                    ? "bg-slate-950/90 backdrop-blur-xl border-white/5 py-4" 
                    : "bg-transparent border-transparent py-6"
                )}
            >
                <div className="container mx-auto px-8 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-6 group">
                        <Link href="/" className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 p-2">
                                <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className={clsx(
                                    "text-2xl font-black tracking-tighter transition-colors uppercase",
                                    isScrolled ? "text-white" : "text-white"
                                )}>
                                    KKN<span className="text-emerald-500">UIN.</span>
                                </h1>
                                <span className="block text-[8px] font-black text-slate-500 tracking-[0.4em] uppercase opacity-70">Official Portal</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav Matrix */}
                    <div className="hidden lg:flex items-center gap-12">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className={clsx(
                                    "text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-emerald-400",
                                    currentUrl === link.href ? "text-emerald-500" : (isScrolled ? "text-slate-400" : "text-slate-300")
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href={route('public.locations')} className="hidden xl:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 hover:text-emerald-400">
                            <MapPin size={14} /> Local Proxy
                        </Link>
                        <Link
                            href={portalHref}
                            className="h-14 px-8 bg-emerald-600 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-400 shadow-2xl shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-4"
                        >
                            <Zap size={14} strokeWidth={3} />
                            {auth.user ? 'Dashboard' : 'Login'}
                        </Link>
                        
                        <button 
                            className="lg:hidden h-12 w-12 flex items-center justify-center bg-white/5 rounded-xl text-white"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Command Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 top-24 bg-slate-950 z-[90] p-12 flex flex-col gap-10 lg:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                onClick={() => setIsMenuOpen(false)}
                                className="text-3xl font-black text-white uppercase tracking-tighter hover:text-emerald-500"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-px w-24 bg-white/10" />
                        <Link
                            href={portalHref}
                            className="w-full py-8 bg-emerald-600 text-slate-950 rounded-[2.5rem] text-center font-black tracking-[0.3em] text-sm uppercase"
                        >
                            {auth.user ? 'Enter Console' : 'Initialize Login'}
                        </Link>
                    </div>
                )}
            </nav>

            <main className="min-h-screen">
                {children}
            </main>

            {/* --- INDUSTRIAL FOOTER --- */}
            <footer className="bg-slate-950 pt-48 pb-20 border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-40 opacity-[0.02] text-white pointer-events-none">
                    <ShieldCheck size={400} />
                </div>
                
                <div className="container mx-auto px-8 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-20 lg:gap-32 pb-32">
                        <div className="space-y-12">
                            <Link href="/" className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-2">
                                    <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">
                                        KKN<span className="text-emerald-500">UIN.</span>
                                    </h2>
                                    <span className="block text-[8px] font-black text-slate-500 tracking-[0.4em] uppercase">Saizu Academy</span>
                                </div>
                            </Link>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-tight leading-relaxed opacity-60">
                                Sistem Informasi Manajemen Pengabdian Masyarakat <br /> UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
                            </p>
                        </div>
                        
                        <div className="space-y-10">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Protocol Nav</h4>
                            <div className="flex flex-col gap-6 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                <Link href={route('public.about')} className="hover:text-white transition-colors">Profil LPPM</Link>
                                <Link href={route('public.schemes')} className="hover:text-white transition-colors">Schema Matrix</Link>
                                <Link href={route('public.announcements')} className="hover:text-white transition-colors">Warta Dispatch</Link>
                                <Link href={route('public.downloads')} className="hover:text-white transition-colors">Asset Repository</Link>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Core Ops</h4>
                            <div className="flex flex-col gap-6 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                <Link href={route('login')} className="hover:text-white transition-colors">Check Eligibility</Link>
                                <Link href={route('login')} className="hover:text-white transition-colors">Enrollment</Link>
                                <Link href={route('login')} className="hover:text-white transition-colors">System Protocols</Link>
                            </div>
                        </div>

                        <div className="space-y-10">
                             <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Support Dispatch</h4>
                             <div className="space-y-8">
                                <div className="flex gap-6 items-start group">
                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                                        <Landmark size={20} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Jl. Jend. A. Yani No.40-A, <br /> Purwokerto Utara, Central Java.</p>
                                </div>
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Ingress</p>
                                    <p className="text-xs font-black text-white uppercase tracking-tight">lppm@uinsaizu.ac.id</p>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                         <div className="flex items-center gap-6">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                &copy; 2026 UIN SAIZU PURWOKERTO
                            </p>
                            <div className="h-4 w-px bg-white/5 hidden md:block" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-40">Operational Ready ver 4.2.0</span>
                         </div>
                         <div className="flex gap-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                             <span className="flex items-center gap-3 hover:text-emerald-500 transition-colors cursor-pointer">
                                 <ShieldCheck size={16} /> Encryption: Active
                             </span>
                             <span className="flex items-center gap-3">
                                 <Activity size={16} /> Status: Online
                             </span>
                         </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
