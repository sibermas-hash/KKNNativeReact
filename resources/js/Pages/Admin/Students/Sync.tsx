import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { route } from 'ziggy-js';
import {
    CloudArrowDownIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Props {
    title: string;
}

export default function StudentSync({ title }: Props) {
    const { post, processing } = useForm({});

    const handleSync = () => {
        if (confirm('Apakah Anda yakin ingin melakukan sinkronisasi massal dari API Kampus? Proses ini mungkin memakan waktu beberapa menit.')) {
            post(route('admin.mahasiswa.sync.store'));
        }
    };

    return (
        <AppLayout title={title}>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary mb-2">
                        <CloudArrowDownIcon className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto">
                        Sinkronisasi otomatis data mahasiswa dari database pusat kampus SAIZU ke dalam sistem KKN.
                    </p>
                </div>

                {/* Sync Card */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Mulai Sinkronisasi</h2>
                        <p className="text-slate-500 font-medium">Sistem akan memeriksa kelayakan mahasiswa dan membuat akun otomatis.</p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSync}
                            disabled={processing}
                            className="h-20 px-12 rounded-[2rem] text-xl font-black flex items-center gap-4 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                        >
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                    Sedang Memproses...
                                </>
                            ) : (
                                <>
                                    <ArrowPathIcon className="w-6 h-6" />
                                    Sinkronkan Sekarang
                                </>
                            )}
                        </Button>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Aman & Terenkripsi</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Update Real-time</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 space-y-4">
                        <div className="flex items-center gap-3 text-amber-600">
                            <ExclamationTriangleIcon className="w-6 h-6" />
                            <h3 className="font-black uppercase tracking-widest text-sm">Peringatan Crash</h3>
                        </div>
                        <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                            Sistem memiliki validasi proteksi NIM ganda. Jika data di API Kampus sudah ada di database lokal, sistem akan melakukan update data terbaru tanpa menghapus data transaksi yang sudah ada.
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-primary">
                            <ShieldCheckIcon className="w-6 h-6" />
                            <h3 className="font-black uppercase tracking-widest text-sm">Otomatisasi Akun</h3>
                        </div>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            Setiap mahasiswa yang berhasil diimpor akan memiliki akun dengan username <span className="text-white font-bold">NIM</span> dan password default <span className="text-white font-bold">password123</span>.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
