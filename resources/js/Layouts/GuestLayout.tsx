import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface GuestLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function GuestLayout({ children, title }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-100 selection:text-emerald-900">
            <Head title={title ? `${title} | KKN UIN SAIZU` : 'Login | KKN UIN SAIZU'} />

            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-emerald-600 relative flex-col justify-between p-12 overflow-hidden">
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10">
                    <Link href={route('home')} className="inline-flex items-center gap-3 text-white/90 hover:text-white transition-colors">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-md shadow-emerald-900/10 overflow-hidden">
                            <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">KKN UIN Saizu</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
                        Portal<br />Pengabdian<br />Masyarakat.
                    </h2>
                    <p className="text-emerald-100 text-base leading-relaxed max-w-sm">
                        Sistem manajemen Kuliah Kerja Nyata Universitas Islam Negeri Prof. K.H. Saifuddin Zuhri Purwokerto.
                    </p>
                </div>

                <p className="relative z-10 text-sm text-emerald-200">
                    &copy; {new Date().getFullYear()} LPPM UIN Saizu
                </p>
            </div>

            {/* Right — Form Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile-only logo */}
                <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
                    <Link href={route('home')} className="inline-flex items-center gap-2.5 text-emerald-600">
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg shadow-emerald-600/10 overflow-hidden">
                            <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">KKN UIN Saizu</span>
                    </Link>
                    <p className="text-sm text-slate-400">Portal Pengabdian Masyarakat</p>
                </div>

                <div className="w-full max-w-sm">
                    {children}
                </div>

                {/* Footer link */}
                <div className="mt-10 text-center">
                    <Link
                        href={route('home')}
                        className="text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        &larr; Kembali ke Beranda
                    </Link>
                    <p className="lg:hidden mt-4 text-xs text-slate-300">
                        &copy; {new Date().getFullYear()} LPPM UIN Saizu
                    </p>
                </div>
            </div>
        </div>
    );
}
