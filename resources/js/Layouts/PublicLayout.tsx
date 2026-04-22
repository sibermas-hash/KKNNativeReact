import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Safe route helper to avoid ReferenceErrors during hydration */
const safeRoute = (name: string, params?: any) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { auth } = usePage<PageProps>().props;

    const navItems = [
        { label: 'Beranda', href: '/' },
        { label: 'Profil', href: safeRoute('public.about') },
        { label: 'Skema', href: safeRoute('public.schemes') },
        { label: 'Warta', href: safeRoute('public.announcements') },
        { label: 'Unduhan', href: safeRoute('public.downloads') },
        { label: 'Lokasi', href: safeRoute('public.locations') },
        { label: 'Sertifikat', href: '/#verifikasi-sertifikat', native: true },
    ];

    // Logic to determine dashboard route based on user role
    const getDashboardRoute = () => {
        if (!auth.user) return safeRoute('login');
        
        const roles = (auth.user.roles as any[])?.map(r => typeof r === 'string' ? r : r.name) || [];
        if (roles.includes('superadmin') || roles.includes('faculty_admin') || roles.includes('admin')) {
            return safeRoute('admin.dashboard');
        }
        if (roles.includes('dpl') || roles.includes('dosen')) {
            return safeRoute('dosen.dashboard');
        }
        return safeRoute('student.dashboard');
    };

    const dashboardHref = getDashboardRoute();

    return (
        <div className="min-h-screen bg-white text-emerald-950 font-sans selection:bg-emerald-100">
            {/* NAVIGATION SIMPLE */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-50 h-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 no-underline group">
                        <div className="flex items-center gap-2">
                            <img src="/images/logo_uin_saizu.png" alt="Logo UIN" className="h-7 w-7 object-contain" />
                            <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-6 w-6 object-contain opacity-90" />
                        </div>
                        <span className="text-sm font-bold text-emerald-950 uppercase tracking-tight">SIBERDAYA</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navItems.map((item) =>
                            item.native ? (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="text-xs font-bold text-emerald-950 hover:text-emerald-600 uppercase no-underline transition-colors"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="text-xs font-bold text-emerald-950 hover:text-emerald-600 uppercase no-underline transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ),
                        )}
                        <Link 
                            href={dashboardHref} 
                            className="px-5 py-2 bg-emerald-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider no-underline hover:bg-emerald-800 transition-all shadow-md"
                        >
                            {auth.user ? 'Dashboard' : 'Login Portal'}
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="lg:hidden text-emerald-950 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-emerald-950/20 lg:hidden" 
                                onClick={() => setIsMenuOpen(false)} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-16 left-0 w-full bg-white border-b border-emerald-50 p-6 flex flex-col gap-4 lg:hidden shadow-xl z-50"
                            >
                                {navItems.map((item) =>
                                    item.native ? (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            className="text-sm font-bold text-emerald-950 uppercase no-underline"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="text-sm font-bold text-emerald-950 uppercase no-underline"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ),
                                )}
                                <Link 
                                    href={dashboardHref} 
                                    className="px-5 py-3 bg-emerald-950 text-white rounded-lg text-sm font-bold text-center no-underline"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {auth.user ? 'Ke Portal' : 'Login Portal'}
                                </Link>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </nav>

            {/* MAIN CONTENT */}
            <main className="min-h-[calc(100vh-4rem-20rem)] animate-in fade-in duration-500">
                {children}
            </main>

            {/* FOOTER SIMPLE */}
            <footer className="bg-emerald-950 text-emerald-100 py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center p-1.5">
                                    <img src="/images/logo_uin_saizu.png" alt="Logo UIN" className="h-full w-full object-contain" />
                                </div>
                                <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center p-1">
                                    <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                                </div>
                            </div>
                            <span className="font-bold text-white text-lg uppercase tracking-tight">SIBERDAYA</span>
                        </div>
                        <p className="text-xs text-emerald-400 leading-relaxed uppercase tracking-wider">
                            Inovasi pengabdian masyarakat untuk akselerasi kesejahteraan umat dan pembangunan bangsa berkelanjutan.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-white font-semibold uppercase text-xs">Informasi Kontak</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 text-xs text-emerald-400">
                                <MapPin size={18} className="shrink-0 text-[#1a7a4a]" />
                                <span>Jl. Jend. A. Yani No. 40, Purwokerto, Jawa Tengah</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-emerald-400">
                                <Phone size={18} className="shrink-0 text-[#1a7a4a]" />
                                <span>(0281) 635624</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-emerald-400">
                                <Mail size={18} className="shrink-0 text-[#1a7a4a]" />
                                <span>lppm@uinsaizu.ac.id</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-white font-semibold uppercase text-xs">Tautan Institusi</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="https://uinsaizu.ac.id" className="text-xs text-emerald-400 hover:text-white transition-colors no-underline uppercase font-bold tracking-tight">&rarr; UIN SAIZU</a>
                            <a href="https://lppm.uinsaizu.ac.id" className="text-xs text-emerald-400 hover:text-white transition-colors no-underline uppercase font-bold tracking-tight">&rarr; LPPM Pusat</a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 mt-12 border-t border-emerald-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-emerald-600">
                    <span>&copy; {new Date().getFullYear()} LPPM UIN SAIZU PURWOKERTO</span>
                    <span>SISTEM INFORMASI MANAJEMEN KKN V4.0.2</span>
                </div>
            </footer>
        </div>
    );
}
