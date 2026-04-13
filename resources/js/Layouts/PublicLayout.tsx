import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, ArrowRight, Menu, X, Landmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';
import type { PageProps } from '@/types';

interface Props {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const page = usePage<PageProps>();
    const { auth } = page.props;
    const portalHref = auth.user ? route('dashboard') : route('login');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Profil', href: route('public.about') },
        { name: 'Skema', href: route('public.schemes') },
        { name: 'Warta', href: route('public.announcements') },
        { name: 'Unduhan', href: route('public.downloads') },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-10 w-10" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">SIM-KKN UIN Saizu</h1>
                            <span className="text-xs text-gray-500">
                                Sistem Informasi Manajemen
                            </span>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href={portalHref}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            {auth.user ? 'Dashboard' : 'Masuk'}
                        </Link>

                        <button
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-200 p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-3 text-base font-medium text-gray-700 hover:text-emerald-600 border-b border-gray-100 last:border-0"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            <main className="min-h-screen">{children}</main>

            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/logo_kkn.png"
                                    alt="Logo KKN"
                                    className="h-10 w-10"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">SIM-KKN UIN Saizu</h3>
                                    <span className="text-xs text-gray-500">
                                        LPPM UIN Prof. K.H. Saifuddin Zuhri
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Sistem Informasi Manajemen Pengabdian Masyarakat UIN Prof. K.H.
                                Saifuddin Zuhri Purwokerto.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Navigasi</h4>
                            <div className="flex flex-col gap-2 text-sm text-gray-600">
                                <Link
                                    href={route('public.about')}
                                    className="hover:text-emerald-600"
                                >
                                    Profil LPPM
                                </Link>
                                <Link
                                    href={route('public.schemes')}
                                    className="hover:text-emerald-600"
                                >
                                    Skema KKN
                                </Link>
                                <Link
                                    href={route('public.announcements')}
                                    className="hover:text-emerald-600"
                                >
                                    Warta
                                </Link>
                                <Link
                                    href={route('public.downloads')}
                                    className="hover:text-emerald-600"
                                >
                                    Unduhan
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Kontak</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-start gap-2">
                                    <Landmark className="h-4 w-4 mt-0.5 shrink-0" />
                                    Jl. Jend. A. Yani No.40-A, Purwokerto Utara, Jawa Tengah.
                                </p>
                                <p>lppm@uinsaizu.ac.id</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} UIN SAIZU PURWOKERTO</p>
                        <p>Versi 4.2.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
