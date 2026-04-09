import { Head, Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { route } from 'ziggy-js';

interface GuestLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function GuestLayout({ children, title }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-white font-sans">
            <Head title={title ? `${title} | KKN UIN SAIZU` : 'Login | KKN UIN SAIZU'} />

            <div className="w-full max-w-md space-y-8">
                {/* Branding Sederhana */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <Link href={route('home')} className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20">
                        <ShieldCheck size={32} className="text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">KKN UIN SAIZU</h1>
                        <p className="text-sm text-slate-500 font-medium italic">Portal Pengabdian Masyarakat</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-slate-200/60 border border-white relative overflow-hidden">
                    {children}
                </div>

                {/* Footer Sederhana */}
                <div className="text-center space-y-4">
                    <Link 
                        href={route('home')} 
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-2"
                    >
                        &larr; Kembali ke Beranda
                    </Link>
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        &copy; {new Date().getFullYear()} LPPM UIN Saizu Purwokerto
                    </p>
                </div>
            </div>
        </div>
    );
}
