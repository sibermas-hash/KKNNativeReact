import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface GuestLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function GuestLayout({ children, title }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 selection:bg-green-100 selection:text-green-900">
            <Head title={title ? `${title} | KKN UIN SAIZU` : 'Login | KKN UIN SAIZU'} />

            <div className="w-full max-w-sm">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10">
                    {children}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href={route('home')}
                        className="text-sm font-medium text-slate-400 hover:text-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        &larr; Kembali ke Beranda
                    </Link>
                    <p className="mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} LPPM UIN Saizu
                    </p>
                </div>
            </div>
        </div>
    );
}
