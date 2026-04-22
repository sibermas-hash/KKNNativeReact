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
        <div className="min-h-screen bg-[linear-gradient(180deg,#f9fffb_0%,#ffffff_30%,#f8fcfa_100%)] text-emerald-950 font-sans selection:bg-emerald-100">
            <nav className="sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/65 px-6 shadow-[0_18px_60px_rgba(6,78,59,0.10)] backdrop-blur-2xl">
                    <Link href="/" className="flex items-center gap-3 no-underline group">
                        <div className="flex items-center gap-2">
                            <img src="/images/logo_uin_saizu.png" alt="Logo UIN" className="h-7 w-7 object-contain" />
                            <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-6 w-6 object-contain opacity-90" />
                        </div>
                        <span className="text-sm font-bold text-emerald-950 uppercase tracking-tight">SIBERDAYA</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-xs font-bold text-emerald-950 hover:text-emerald-600 uppercase no-underline transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link 
                            href={dashboardHref} 
                            className="px-5 py-2 bg-emerald-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider no-underline hover:bg-emerald-800 transition-all shadow-md"
                        >
                            {auth.user ? 'Dashboard' : 'Login Portal'}
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="rounded-xl border border-emerald-100 bg-white/80 p-2 text-emerald-950 shadow-sm lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                                className="absolute left-4 right-4 top-[5.25rem] rounded-[1.75rem] border border-white/80 bg-white/88 p-6 shadow-[0_26px_70px_rgba(6,78,59,0.14)] backdrop-blur-2xl lg:hidden z-50"
                            >
                                <div className="flex flex-col gap-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="text-sm font-bold text-emerald-950 uppercase no-underline"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                                <Link 
                                    href={dashboardHref} 
                                    className="mt-5 px-5 py-3 bg-emerald-950 text-white rounded-xl text-sm font-bold text-center no-underline shadow-md"
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
