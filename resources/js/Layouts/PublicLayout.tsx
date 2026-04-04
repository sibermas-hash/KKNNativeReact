import { Link, usePage } from '@inertiajs/react';
import { Globe, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Props {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const page = usePage<PageProps>();
    const { auth } = page.props;
    const currentUrl = page.url;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Profil', href: route('public.about') },
        { name: 'Skema KKN', href: route('public.schemes') },
        { name: 'Warta Utama', href: route('public.announcements') },
        { name: 'Repositori', href: route('public.downloads') },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-950 selection:bg-emerald-500/20 selection:text-emerald-900">
            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] h-24 bg-white/95 backdrop-blur-md border-b-4 border-emerald-500 px-6 lg:px-12 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div>
                        <Link href="/">
                            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none group">
                                UIN <span className="text-emerald-500 group-hover:text-amber-500 transition-colors uppercase text-sm lg:text-xl">Prof. K.H. Saifuddin Zuhri</span>
                            </h1>
                        </Link>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span>PORTAL OPERASIONAL</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>VERSI 3.5 VIBRANT</span>
                        </p>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            href={link.href} 
                            className={`text-[13px] font-black transition-colors uppercase tracking-widest ${
                                currentUrl === link.href ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {auth.user ? (
                        <Link 
                            href={route('dashboard')}
                            className="bg-slate-950 text-white px-8 py-3 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-3 group shadow-xl"
                        >
                            <span>PANEL DASHBOARD</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <Link 
                            href={route('login')}
                            className="bg-slate-950 text-white px-8 py-3 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-xl uppercase tracking-[0.2em]"
                        >MASUK</Link>
                    )}
                    
                    {/* Mobile Menu Toggle */}
                    <button 
                        className="lg:hidden p-2 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="absolute top-24 left-0 right-0 bg-white border-b-4 border-emerald-500 p-6 flex flex-col gap-6 lg:hidden shadow-2xl animate-in slide-in-from-top duration-300">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm font-black text-slate-600 hover:text-emerald-500 uppercase tracking-widest"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            <main className="pt-24 min-h-[calc(100vh-400px)]">
                {children}
            </main>

            {/* FOOTER */}
            <footer className="py-24 bg-white border-t-8 border-emerald-500">
                <div className="container mx-auto px-6 lg:px-12 text-center space-y-12">
                    <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">
                        UIN <span className="text-emerald-500">Prof. K.H. Saifuddin Zuhri</span>
                    </h1>
                    <p className="text-slate-400 font-bold max-w-2xl mx-auto italic">
                        Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM). <br /> Purwokerto, Jawa Tengah, Indonesia.
                    </p>
                    <div className="pt-12 flex justify-center gap-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">
                        <span>&copy; 2026 ARSITEKTUR PENGABDIAN</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
