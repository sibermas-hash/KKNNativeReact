import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Menu,
  X,
  UserCircle
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

/** Safe route helper to avoid ReferenceErrors during hydration */
const safeRoute = (name: string, params?: any) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch (e) {
        return '#';
    }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { auth } = usePage<PageProps>().props;

    const navItems = [
        { label: 'Beranda', href: '/' },
        { label: 'Skema KKN', href: safeRoute('public.schemes') },
        { label: 'Pengumuman', href: safeRoute('public.announcements') },
        { label: 'Unduhan', href: safeRoute('public.downloads') },
    ];

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-emerald-100">
            {/* NAVIGATION SIMPLE */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 h-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 no-underline group">
                        <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <img src="/images/logo_kkn.png" alt="Logo" className="h-6 w-6 object-contain" />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-tight">KKN UIN SAIZU</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link 
                                key={item.label} 
                                href={item.href} 
                                className="text-xs font-bold text-black hover:text-emerald-500 font-semibold uppercase text-xs no-underline transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link 
                            href={auth.user ? safeRoute('dashboard') : safeRoute('login')} 
                            className="px-5 py-2 bg-emerald-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider no-underline hover:bg-emerald-800 transition-all shadow-md"
                        >
                            {auth.user ? 'Dashboard' : 'Login Admin'}
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="lg:hidden text-black p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                                className="absolute top-16 left-0 w-full bg-white border-b border-emerald-100 p-6 flex flex-col gap-4 lg:hidden shadow-xl z-50"
                            >
                                {navItems.map((item) => (
                                    <Link 
                                        key={item.label} 
                                        href={item.href} 
                                        className="text-sm font-bold text-black font-semibold uppercase text-xs no-underline"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <Link 
                                    href={auth.user ? safeRoute('dashboard') : safeRoute('login')} 
                                    className="px-5 py-3 bg-emerald-950 text-white rounded-lg text-sm font-bold text-center no-underline"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {auth.user ? 'Ke Dashboard' : 'Login Admin'}
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
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
                                <img src="/images/logo_kkn.png" alt="Logo" className="h-7 w-7" />
                            </div>
                            <span className="font-bold text-white text-lg uppercase tracking-tight">KKN UIN SAIZU</span>
                        </div>
                        <p className="text-xs text-emerald-400 leading-relaxed uppercase tracking-wider">
                            Inovasi pengabdian masyarakat untuk akselerasi kesejahteraan umat dan pembangunan bangsa berkelanjutan.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-white font-semibold uppercase text-xs">Informasi Kontak</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 text-xs text-emerald-400">
                                <MapPin size={18} className="shrink-0 text-emerald-500" />
                                <span>Jl. Jend. A. Yani No. 40, Purwokerto, Jawa Tengah</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-emerald-400">
                                <Phone size={18} className="shrink-0 text-emerald-500" />
                                <span>(0281) 635624</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-emerald-400">
                                <Mail size={18} className="shrink-0 text-emerald-500" />
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
                <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 mt-12 border-t border-emerald-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-emerald-700 font-bold uppercase tracking-wider text-xs font-semibold">
                    <span>&copy; {new Date().getFullYear()} LPPM UIN SAIZU PURWOKERTO</span>
                    <span>SISTEM INFORMASI MANAJEMEN KKN V4.0.2</span>
                </div>
            </footer>
        </div>
    );
}
