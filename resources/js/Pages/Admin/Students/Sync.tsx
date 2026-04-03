import { useForm, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    RefreshCw,
    ShieldCheck,
    Cpu,
    ChevronLeft,
    Database,
    Lock,
    Server,
    Activity,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';

interface Props {
    title: string;
}

export default function StudentSync(_props: Props) {
    const { post, processing } = useForm({});

    const handleSync = () => {
        if (confirm('Konfirmasi Sinkronisasi: Anda akan memperbarui data mahasiswa dari sistem informasi pusat. Proses ini dapat memakan waktu beberapa menit tergantung jumlah data. Lanjutkan?')) {
            post(route('admin.mahasiswa.sync.store'));
        }
    };

    return (
        <AppLayout title="Sinkronisasi Data Mahasiswa">
            <Head title="Pusat Integrasi Data" />
            
            <div className="max-w-5xl mx-auto space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-6 mb-2">
                             <Link href="/admin/mahasiswa" className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 hover:bg-white hover:text-primary transition-all group-hover:scale-105">
                                <ChevronLeft className="w-6 h-6 stroke-[3px]" />
                            </Link>
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Database className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                MASTER_STUDENT_DATA_SYNC_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Integrasi <span className="text-emerald-300 text-glow-emerald italic">Master Data</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Proses penarikan dan sinkronisasi basis data identitas mahasiswa dari sistem informasi akademik terpusat untuk orkestrasi pendaftaran KKN.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6 transition-all">
                                <Server className="h-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Status Gateway</span>
                                <span className="text-xl font-black text-white uppercase  italic leading-none">Cluster_Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Sync Interface */}
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform">
                        <Database className="h-96 w-96" />
                    </div>

                    <div className="p-12 md:p-24 flex flex-col items-center text-center space-y-16 relative z-10">
                        <div className="space-y-6 max-w-2xl">
                            <div className="inline-flex p-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 relative group-hover:text-primary transition-colors">
                                <Cpu className="w-14 h-14" />
                                <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full border-4 border-white animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900  uppercase italic leading-none">Otorisasi Pembaruan Data</h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed italic opacity-70">
                                Sistem akan memanggil data terbaru dari server akademik untuk melakukan verifikasi NIM, 
                                memperbarui profil mahasiswa, dan menginisialisasi kredensial login secara otomatis.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-10 w-full max-w-md">
                            <button
                                onClick={handleSync}
                                disabled={processing}
                                className={clsx(
                                    "w-full h-24rounded-lg text-[13px] font-black uppercase  flex items-center justify-center gap-6 transition-all italic active:scale-95 group/sync",
                                    processing 
                                        ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100" 
                                        : "bg-white from-primary-dark to-[#043d23] text-white border border-primary/20 hover:scale-[1.02]
                                )}
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="w-8 h-8 animate-spin text-emerald-300" />
                                        COMMITTING_SYNC_STREAM...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-8 h-8 text-emerald-300 group-hover/sync:rotate-180 transition-transform" />
                                        Mulai Sinkronisasi Data
                                    </>
                                )}
                            </button>

                            <div className="flex flex-wrap justify-center items-center gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase  italic leading-none">Protokol Keamanan SSL Aktif</span>
                                </div>
                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase  italic leading-none">Saluran API Terverifikasi</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Footer */}
                    <div className="px-12 py-10 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white from-transparent via-primary/30 to-transparent" />
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-primary/10 transition-colors">
                                <Activity className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black text-slate-500 uppercase  italic leading-none">IDENTITAS_GERBANG_DATA</span>
                                <span className="text-[12px] font-black text-slate-100 uppercase  italic leading-none">Source: Pangkalan Data Akademik (SIAKAD)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-l border-slate-800 pl-8 h-12 hidden md:flex">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-emerald-400 uppercase  italic">CHANNEL_SECURE</span>
                        </div>
                    </div>
                </div>

                {/* Intelligence Modules */}
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="p-10 bg-white rounded-lg border border-slate-100 space-y-6 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-primary/10 rounded-lg text-primary border border-primary/20">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="font-black text-xs uppercase  italic text-slate-900 leading-none">Integritas Data</h3>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic">Aman & Terkendali</p>
                            </div>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed italic opacity-80 decoration-slate-100">
                            Proses ini dirancang khusus untuk memperbarui informasi tanpa merusak data pendaftaran yang sudah ada. Setiap record mahasiswa dipetakan secara akurat menggunakan NIM sebagai identitas unik.
                        </p>
                    </div>

                    <div className="p-10 bg-white rounded-lg border border-slate-100 space-y-8 hover:shadow-2xl hover:border-primary/20 transition-all group/module overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover/module:rotate-12 transition-transform">
                                <Lock className="h-32 w-32" />
                            </div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="p-4 bg-primary/5 rounded-lg text-primary border border-primary/10 group-hover/module:bg-primary group-hover/module:text-white transition-all">
                                <Lock className="w-8 h-8 stroke-[2.5px]" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase  italic text-slate-900 leading-none">OTORISASI_ENKRIPSI</h3>
                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase  italic opacity-60">KEAMANAN AKSES</p>
                            </div>
                        </div>
                        <p className="text-[14px] text-slate-500 font-bold leading-relaxed italic opacity-80 relative z-10 border-l-2 border-slate-100 pl-6">
                            Setiap personel akan mendapatkan kredensial otorisasi standar berdasarkan data otentik universitas. Administrator wajib mengarahkan personel untuk melakukan pembaruan kata sandi segera setelah inisialisasi login.
                        </p>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        Digital Integration Hub • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
