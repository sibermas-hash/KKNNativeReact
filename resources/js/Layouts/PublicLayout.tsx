import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, ArrowRight, Menu, X, Landmark, GraduationCap, Users2, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 20);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Profil', href: route('public.about') },
        { name: 'Skema KKN', href: route('public.schemes') },
        { name: 'Warta', href: route('public.announcements') },
        { name: 'Repositori', href: route('public.downloads') },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-500/10 selection:text-emerald-700">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap" rel="stylesheet" />
            </Head>
            {/* NAVBAR - EDUCATEX INSPIRED (CLEAN & FLOATING) */}
            <nav 
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
                    isScrolled 
                    ? 'h-20 bg-white/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border-b border-slate-50' 
                    : 'h-24 bg-transparent'
                }`}
            >
                <div className="container mx-auto h-full px-6 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-4 group">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                                KKN<span className="font-normal text-slate-400">UIN Saizu</span>
                                <span className="block text-[8px] font-bold text-slate-400 tracking-[0.1em] mt-1 uppercase">Portal Resmi KKN</span>
                            </h1>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className={`text-[13px] font-bold uppercase tracking-widest transition-all hover:text-emerald-500 ${
                                    currentUrl === link.href ? 'text-emerald-500' : 'text-slate-600'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href={route('public.locations')} className="hidden xl:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                            Cari Lokasi
                        </Link>
                        <Link 
                            href="/login" 
                            className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3"
                        >
                            Login Portal <ArrowRight size={14} />
                        </Link>
                        
                        <button 
                            className="lg:hidden p-3 bg-slate-50 rounded-xl text-slate-600"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b-8 border-emerald-500 p-8 flex flex-col gap-8 lg:hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] hover:text-emerald-500"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link 
                            href={route('login')}
                            className="w-full py-5 bg-emerald-500 text-white rounded-2xl text-center font-black tracking-widest text-xs"
                        >
                            MASUK SEKARANG
                        </Link>
                    </div>
                )}
            </nav>

            <main className="min-h-screen">
                {children}
            </main>

            {/* FOOTER - EDUCATEX INSPIRED (BRIGHT & STRUCTURED) */}
            <footer className="bg-slate-50 pt-32 pb-20 border-t border-slate-100">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 lg:gap-24">
                        <div className="col-span-1 md:col-span-1 space-y-10">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500 rounded-2xl text-white">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tighter text-slate-950 capitalize">SIM<span className="text-emerald-500">KKN</span></h2>
                            </Link>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Sistem Informasi Manajemen Pengabdian Masyarakat UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
                            </p>
                            <div className="flex gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"><Globe size={18}/></div>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] relative inline-block">
                                Navigasi
                                <div className="absolute -bottom-2 left-0 w-8 h-1 bg-emerald-500 rounded-full" />
                            </h4>
                            <div className="flex flex-col gap-4 text-[13px] text-slate-500 font-bold">
                                <Link href={route('public.about')} className="hover:text-emerald-500 transition-colors">Profil LPPM</Link>
                                <Link href={route('public.schemes')} className="hover:text-emerald-600 transition-colors">Skema KKN</Link>
                                <Link href={route('public.announcements')} className="hover:text-emerald-600 transition-colors">Warta & Berita</Link>
                                <Link href={route('public.downloads')} className="hover:text-emerald-600 transition-colors">Pusat Unduhan</Link>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] relative inline-block">
                                Informasi
                                <div className="absolute -bottom-2 left-0 w-8 h-1 bg-emerald-500 rounded-full" />
                            </h4>
                            <div className="flex flex-col gap-4 text-[13px] text-slate-500 font-bold uppercase tracking-widest">
                                <Link href="/login" className="hover:text-emerald-500">Cek Kelayakan</Link>
                                <Link href="/login" className="hover:text-emerald-500">Pendaftaran</Link>
                                <Link href="/login" className="hover:text-emerald-500">Syarat & Ketentuan</Link>
                            </div>
                        </div>

                        <div className="space-y-8">
                             <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] relative inline-block">
                                Hubungi LPPM
                                <div className="absolute -bottom-2 left-0 w-8 h-1 bg-emerald-500 rounded-full" />
                            </h4>
                            <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 h-fit"><Landmark size={18}/></div>
                                    <p>Jl. Jend. A. Yani No.40-A, Karanganjing, Purwokerto Utara.</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Resmi</p>
                                    <p className="text-xs font-bold text-slate-900">lppm@uinsaizu.ac.id</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                             &copy; 2026 Universitas Islam Negeri Prof. K.H. Saifuddin Zuhri.
                         </p>
                         <div className="flex gap-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <span className="flex items-center gap-2 hover:text-emerald-500 cursor-pointer">
                                 <ShieldCheck size={14}/> Keamanan Data
                             </span>
                             <span>Versi 4.0.1</span>
                         </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
