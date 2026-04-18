import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, SearchX, ServerCrash, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    status: number;
    message?: string;
}

export default function ErrorPage({ status, message }: Props) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
    }[status] || `Error ${status}`;

    const description = {
        503: 'Maaf, sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.',
        500: 'Terjadi kesalahan sistem internal. Tim teknis kami sedang memperbaikinya.',
        404: 'Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.',
        403: message || 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.',
    }[status] || 'Maaf, terjadi kesalahan yang tidak terduga.';

    const Icon = {
        503: ServerCrash,
        500: ServerCrash,
        404: SearchX,
        403: ShieldAlert,
    }[status] || ShieldAlert;

    return (
        <div className="flex min-h-screen items-center justify-center bg-emerald-50/30 p-6">
            <Head title={title} />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg text-center"
            >
                {/* Status Icon Appearance */}
                <div className="mb-10 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white border border-emerald-50 shadow-xl shadow-emerald-500/10 ring-8 ring-emerald-50/50">
                    <Icon className="h-12 w-12 text-emerald-600" />
                </div>

                <div className="rounded-2xl bg-white border border-emerald-50 p-8 shadow-sm">
                    <p className="text-lg font-bold text-bg-emerald-50 mb-2">
                        {status === 403 ? 'Akses Terbatas' : (status === 404 ? 'Halaman Tidak Tersedia' : 'Terjadi Gangguan')}
                    </p>
                    <p className="text-emerald-950 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-2 rounded-xl border border-emerald-50/60 bg-white px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50/30 transition-all duration-200"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Kembali
                    </button>
                    
                    <Link
                        href="/"
                        className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all duration-200"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard Utama
                    </Link>
                </div>

                {/* Footer Decor */}
                <div className="mt-16 flex items-center justify-center gap-2 opacity-50">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-bg-emerald-100">
                        SIM-KKN UIN SAIZU
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </div>
            </motion.div>
        </div>
    );
}
