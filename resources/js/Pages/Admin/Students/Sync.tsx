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
 Zap,
 ChevronRight,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';

interface Props {
 title: string;
}

export default function StudentSync(_props: Props) {
 const { post, processing } = useForm({});

 const handleSync = () => {
 if (confirm('Konfirmasi Sinkronisasi: Anda akan memperbarui data mahasiswa dari sistem informasi akademik pusat. Proses ini dapat memakan waktu beberapa menit. Lanjutkan?')) {
 post(route('admin.mahasiswa.sync.store'));
 }
 };

 return (
 <AppLayout title="Sinkronisasi Data Mahasiswa">
 <Head title="Pusat Integrasi Data" />
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 MASTER_STUDENT_SYNC_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <Link href="/admin/users/mahasiswa" className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all ">
 <ChevronLeft className="h-4 w-4" />
 </Link>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Integrasi <span className="text-primary">Master Data</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Server className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Gateway_Status</span>
 <span className="text-xs font-semibold text-emerald-600 leading-none">
 ACTIVE_CLUSTER
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Main Sync Interface */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group min-h-[500px] flex items-center justify-center">
 <div className="absolute top-0 right-0 p-16 text-slate-900 opacity-[0.03] pointer-events-none ">
 <Database className="h-[40rem] w-[40rem]" />
 </div>

 <div className="p-12 flex flex-col items-center text-center space-y-12 relative z-10 max-w-2xl">
 <div className="space-y-6">
 <div className="inline-flex p-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-300 relative group-hover:text-primary transition-colors">
 <Cpu className="w-16 h-16" />
 <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full border-4 border-white" />
 </div>
 <h2 className="text-xl font-semibold text-slate-900">OTORISASI_PEMBARUAN_INTI</h2>
 <p className="text-slate-400 text-[12px] font-semibold leading-relaxed opacity-75">
 Sistem akan memanggil data terbaru dari server akademik untuk melakukan verifikasi NIM, memperbarui profil mahasiswa, dan menginisialisasi kredensial login secara otomatis.
 </p>
 </div>

 <div className="flex flex-col items-center gap-6 w-full max-w-sm">
 <button
 onClick={handleSync}
 disabled={processing}
 className={clsx(
 "w-full py-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-4 transition-all",
 processing 
 ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed" 
 : "bg-slate-900 text-white hover:-translate-y-2 group/sync"
 )}
 >
 <RefreshCw className={clsx("w-6 h-6 text-primary transition-all", processing ? "animate-spin" : "")} />
 {processing ? 'COMMITTING_SYNC_STREAM...' : 'EXECUTE_MASTER_SYNC'}
 </button>

 <div className="flex flex-wrap justify-center items-center gap-6">
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-slate-300">TLS_ENCRYPTION_ACTIVE</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
 <span className="text-[9px] font-semibold text-slate-300">API_VECTOR_VERIFIED</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Intelligence Modules */}
 <div className="grid md:grid-cols-2 gap-8">
 <div className="p-8 bg-white rounded-lg border border-slate-100 space-y-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-emerald-500 opacity-[0.03] pointer-events-none transition-transform">
 <ShieldCheck className="h-32 w-32" />
 </div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-emerald-500/5 rounded-lg text-emerald-600 border border-emerald-500/10">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-slate-900">DATA_INTEGRITY_SAFE</h3>
 <span className="text-[9px] font-semibold text-emerald-500 mt-1.5 leading-none">VERIFIED_SOURCE</span>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 font-semibold leading-relaxed opacity-75 relative z-10 border-l-2 border-emerald-500/20 pl-6">
 Proses ini dirancang untuk memperbarui informasi tanpa merusak data pendaftaran yang sudah ada. Setiap record mahasiswa dipetakan akurat menggunakan NIM sebagai identitas unik.
 </p>
 </div>

 <div className="p-8 bg-white rounded-lg border border-slate-100 space-y-8 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-primary opacity-[0.03] pointer-events-none transition-transform">
 <Lock className="h-32 w-32" />
 </div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-primary/5 rounded-lg text-primary border border-primary/10">
 <Lock className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-slate-900">AUTH_ENCRYPTION_LAYER</h3>
 <span className="text-[9px] font-semibold text-primary mt-1.5 leading-none">SECURE_CREDENTIALS</span>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 font-semibold leading-relaxed opacity-75 relative z-10 border-l-2 border-primary/20 pl-6">
 Setiap personel akan mendapatkan kredensial otorisasi standar berdasarkan data otentik universitas. Wajib mengarahkan personel untuk pembaruan kata sandi segera.
 </p>
 </div>
 </div>

 {/* Operations Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Activity className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">CORE_SYNC_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: GATEWAY_SECURE</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Sumber: Pangkalan Data Akademik (SIAKAD). Sinkronisasi ini memastikan data NIM dan Fakultas selalu akurat dalam ekosistem KKN UIN SAIZU.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">TLS_CHANNEL_SECURE</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
