import { Link, usePage } from '@inertiajs/react';
import { Globe, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
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
            {/* NAVBAR - MINIMALIST UNIVERSITY PORTAL */}
            <nav className="fixed top-0 left-0 right-0 z-[100] h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div>
                        <Link href="/" className="flex items-center gap-4">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 group whitespace-nowrap">
                                SIM-KKN <span className="text-emerald-600 font-medium">UIN SAIZU</span>
                            </h1>
                        </Link>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            href={link.href} 
                            className={`text-sm font-semibold transition-colors ${
                                currentUrl === link.href ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    
                    <Link 
                        href="/login" 
                        className="ml-6 px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                    >
                        Masuk
                    </Link>
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

            {/* FOOTER - PROFESSIONAL CLEAN */}
            <footer className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-20">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Lembaga Penelitian dan <br /> Pengabdian Masyarakat (LPPM)
                            </h1>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                                Pusat koordinasi pengabdian masyarakat UIN Prof. K.H. Saifuddin Zuhri Purwokerto. Menyelenggarakan KKN yang akuntabel, berdampak, dan moderat.
                            </p>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>Jl. Jend. A. Yani No.40-A, Karanganjing, Purwanegara</p>
                                <p>Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Tautan Cepat</h4>
                            <div className="flex flex-col gap-3 text-sm text-slate-600">
                                <Link href={route('public.about')} className="hover:text-emerald-600">Profil KKN</Link>
                                <Link href={route('public.schemes')} className="hover:text-emerald-600">Skema Pengabdian</Link>
                                <Link href={route('public.announcements')} className="hover:text-emerald-600">Warta Utama</Link>
                                <Link href={route('public.downloads')} className="hover:text-emerald-600">Repositori Dokumen</Link>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Akses Pengguna</h4>
                            <div className="flex flex-col gap-3 text-sm text-slate-600">
                                <Link href="/login" className="hover:text-emerald-600">Portal Mahasiswa</Link>
                                <Link href="/login" className="hover:text-emerald-600">Portal DPL</Link>
                                <Link href="/login" className="hover:text-emerald-600">Portal Admin</Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400">
                         <p>&copy; 2026 UIN Prof. K.H. Saifuddin Zuhri. All rights reserved.</p>
                         <div className="flex gap-6 uppercase tracking-widest">
                             <a href="#" className="hover:text-slate-600">Sitemap</a>
                             <a href="#" className="hover:text-slate-600">Internal Unit</a>
                         </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
