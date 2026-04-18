import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 RefreshCw,
 Users,
 Link2,
 ShieldCheck,
 Database,
 Zap,
 CheckCircle2,
 Activity,
 Target,
 ArrowRight,
 ListFilter,
 Info,
 Loader2,
 ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
 title: string;
 summary: {
 local_lecturers: number;
 with_master_link: number;
 with_user_account: number;
 last_synced_at: string | null;
 };
}

function formatSyncTime(value: string | null): string {
 if (!value) return 'BELUM TERDETEKSI';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return new Intl.DateTimeFormat('id-ID', {
 dateStyle: 'medium',
 timeStyle: 'short',
 }).format(date);
}

export default function DplSync({ summary }: Props) {
 const bulkForm = useForm({});
 const targetedForm = useForm({
 nip_list: '',
 });

 function submitBulk() {
 bulkForm.post('/admin/dosen/sinkron', {
 preserveScroll: true,
 });
 }

 function submitTargeted(event: FormEvent<HTMLFormElement>) {
 event.preventDefault();
 targetedForm.post('/admin/dosen/sinkron', {
 preserveScroll: true,
 });
 }

 return (
 <AppLayout title="Sinkronisasi Dosen">
 <Head title="Pusat Sinkronisasi Dosen"/>

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-[#1a7a4a]">
 <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"/>
 <span className="text-xs font-semibold leading-none">
 Integritas Data Master DPL
 </span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
 <div className="space-y-2">
 <h1 className="text-4xl font-semibold text-emerald-950 er leading-none">
 Jalur <span className="text-[#1a7a4a]">Sinkronisasi.</span>
 </h1>
 <p className="text-sm font-semibold text-emerald-800 leading-relaxed max-w-2xl mt-4">
 Otomasi transmisi data Dosen Pembimbing Lapangan melalui basis data pusat sistem informasi akademik universitas secara real-time.
 </p>
 </div>
 <div className="shrink-0">
 <div className="bg-gray-50 border border-emerald-50 rounded-xl p-6 flex items-center gap-10 shadow-sm relative overflow-hidden group/last">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/last:rotate-12 transition-transform"><RefreshCw size={80} /></div>
 <div className="flex flex-col relative z-10">
 <span className="text-xs font-semibold text-emerald-800 leading-none mb-2">Sinkronisasi Terakhir</span>
 <span className="text-lg font-semibold text-emerald-950 tabular-nums leading-none">
 {formatSyncTime(summary.last_synced_at)}
 </span>
 </div>
 <div className="h-12 w-12 rounded-xl bg-white border border-emerald-50 flex items-center justify-center text-[#1a7a4a] relative z-10 shadow-sm">
 <Activity size={24} strokeWidth={2.5} className="animate-pulse"/>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS GRID --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <SyncMetric 
 label="Total Data Lokal"
 value={summary.local_lecturers} 
 icon={Users} 
 desc="Dosen Terintegrasi"
 />
 <SyncMetric 
 label="Koneksi Master"
 value={summary.with_master_link} 
 icon={Link2} 
 desc="Link ID Valid"
 />
 <SyncMetric 
 label="Akun Sistem"
 value={summary.with_user_account} 
 icon={ShieldCheck} 
 desc="Akses Login Aktif"
 />
 <SyncMetric 
 label="Status Arus"
 value="STABIL"
 icon={Zap} 
 desc="Pipeline Online"
 isText 
 />
 </div>

 {/* --- SYNC METHODS --- */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Sinkronisasi Massal */}
 <section className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm flex flex-col group/massal transition-all hover:border-emerald-50 font-sans">
 <div className="px-10 py-8 border-b-2 border-emerald-50 flex items-center gap-8 bg-gray-50">
 <div className="h-16 w-16 bg-[#16a34a] text-white rounded-xl flex items-center justify-center shadow-sm shadow-none group-hover/massal:rotate-12 transition-transform duration-500">
 <Database size={32} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-xs font-semibold text-emerald-800 leading-none mb-2">Transmisi Kolektif</h3>
 <p className="text-xl font-semibold text-emerald-950">Sinkronisasi Massal</p>
 </div>
 </div>

 <div className="p-10 space-y-10 flex-1 flex flex-col">
 <div className="bg-gray-50 border border-emerald-50 rounded-xl p-8 space-y-6 flex-1 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10"><RefreshCw size={150} /></div>
 <p className="text-sm font-bold text-emerald-950 leading-relaxed relative z-10">
 Prosedur ini memindai direktori dosen di sistem induk universitas untuk diperbarui ke dalam basis data KKN secara otomatis dan menyeluruh.
 </p>
 <div className="space-y-4 relative z-10">
 {[
 'Perbaruan Identitas & NIP Kolektif',
 'Sinkronisasi Afiliasi Akademik',
 'Optimalisasi Akun Pengguna DPL',
 ].map((item, idx) => (
 <div key={idx} className="flex items-center gap-4">
 <div className="h-2 w-2 rounded-full bg-gray-500 shadow-sm shadow-none"/>
 <span className="text-xs font-semibold text-emerald-800">{item}</span>
 </div>
 ))}
 </div>
 </div>

 <button
 onClick={submitBulk}
 disabled={bulkForm.processing || targetedForm.processing}
 className="h-16 w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl shadow-sm shadow-none transition-all flex items-center justify-center gap-4 text-xs disabled:opacity-50 active:scale-95 group/btn"
 >
 {bulkForm.processing ? (
 <Loader2 size={24} className="animate-spin"/>
 ) : (
 <RefreshCw size={24} strokeWidth={2.5} className="group-hover/btn:rotate-180 transition-transform duration-700"/>
 )}
 {bulkForm.processing ? 'Sedang Mentransmisi...' : 'EKSEKUSI SINKRONISASI TOTAL'}
 </button>
 </div>
 </section>

 {/* Sinkronisasi Terapan */}
 <section className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm flex flex-col group/target transition-all hover:border-emerald-50 font-sans">
 <div className="px-10 py-8 border-b-2 border-emerald-50 flex items-center gap-8 bg-gray-50">
 <div className="h-16 w-16 bg-white text-white rounded-xl flex items-center justify-center shadow-sm shadow-emerald-950/10 group-hover/target:-rotate-12 transition-transform duration-500">
 <Target size={32} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-xs font-semibold text-emerald-800 leading-none mb-2">Intervensi Spesifik</h3>
 <p className="text-xl font-semibold text-emerald-950">Sinkronisasi Target</p>
 </div>
 </div>

 <form onSubmit={submitTargeted} className="p-10 space-y-8 flex-1 flex flex-col">
 <div className="space-y-4 flex-1">
 <label className="text-xs font-semibold text-emerald-800 pl-1 leading-none flex items-center gap-3">
 <ListFilter size={14} strokeWidth={3} className="text-[#1a7a4a]"/> DAFTAR NIP TARGET (PEMISAH BARIS)
 </label>
 <textarea
 value={targetedForm.data.nip_list}
 onChange={(e) => targetedForm.setData('nip_list', e.target.value)}
 className="w-full flex-1 px-8 py-8 rounded-xl bg-gray-50 border border-emerald-50 text-sm font-bold text-emerald-950 focus:bg-white focus:border-[#1a7a4a] outline-none transition-all placeholder:text-black font-mono scrollbar-hide"
 placeholder={'19900101XXXXXXXX\n19900101XXXXXXXX'}
 rows={5}
 />
 </div>

 <div className="bg-white rounded-xl p-8 flex items-start gap-6 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 -mr-8 -mt-8"><Info size={100} /></div>
 <Info size={24} className="text-emerald-800 shrink-0 mt-1"strokeWidth={2.5} />
 <p className="text-xs font-bold text-emerald-700 leading-relaxed relative z-10">
 Mode ini memfasilitasi perbaikan data administratif dosen secara instan untuk entri yang cacat atau belum terdaftar pada fase deployment.
 </p>
 </div>

 <button
 type="submit"
 disabled={
 targetedForm.processing ||
 bulkForm.processing ||
 targetedForm.data.nip_list.trim() === ''
 }
 className="h-16 w-full bg-white hover:bg-black text-white font-semibold rounded-xl shadow-sm shadow-emerald-950/20 transition-all flex items-center justify-center gap-4 text-xs disabled:opacity-50 active:scale-95"
 >
 {targetedForm.processing ? (
 <Loader2 size={24} className="animate-spin"/>
 ) : (
 <ArrowRight size={24} strokeWidth={2.5} />
 )}
 {targetedForm.processing ? 'Sedang Memperbarui...' : 'PERBARUI NIP SPESIFIK'}
 </button>
 </form>
 </section>
 </div>

 {/* --- GOVERNANCE FOOTER --- */}
 <div className="bg-white rounded-xl p-12 text-white relative overflow-hidden shadow-sm border border-emerald-800 group/governance">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
 <ShieldCheck size={500} strokeWidth={0.5} />
 </div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
 <div className="space-y-6 flex-1">
 <div className="flex items-center gap-6">
 <div className="h-20 w-20 bg-gray-100/50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
 <RefreshCw size={40} className="text-emerald-800"strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-2xl font-semibold leading-none mb-1">Kedaulatan Data Master DPL</h3>
 <span className="text-xs font-semibold text-emerald-800 opacity-80">Protokol Pemeliharaan Sistem</span>
 </div>
 </div>
 <p className="text-sm font-bold text-emerald-800 leading-relaxed max-w-4xl">
 Sinkronisasi berkala menjamin data Dosen Pembimbing Lapangan tetap relevan dengan direktori kepegawaian universitas. Pastikan stabilitas koneksi backend dan endpoint API Master sebelum melakukan transmisi data kolektif dalam skala besar guna mencegah degradasi performa database.
 </p>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function SyncMetric({
 label,
 value,
 icon: Icon,
 desc,
 isText = false,
}: {
 label: string;
 value: string | number;
 icon: any;
 isText?: boolean;
 desc: string;
}) {
 return (
 <div className="bg-white border border-emerald-50 p-8 rounded-xl shadow-sm hover:border-emerald-50 transition-all group relative overflow-hidden font-sans">
 <div className="flex items-center justify-between relative z-10">
 <div className="h-14 w-14 rounded-xl flex items-center justify-center border border-emerald-50 bg-gray-50 text-[#1a7a4a] transition-all duration-500 group-hover:scale-110 shadow-sm">
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-emerald-700 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
 <ChevronRight size={18} strokeWidth={3} />
 </div>
 </div>
 <div className="mt-8 space-y-3 relative z-10">
 <p className="text-xs font-semibold text-emerald-800 leading-none">
 {label}
 </p>
 <p
 className={clsx(
 'font-semibold text-emerald-950 er leading-none group-hover:text-emerald-800 transition-colors ',
 isText ? 'text-xl' : 'text-3xl',
 )}
 >
 {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
 </p>
 <p className="text-xs font-semibold text-emerald-800 pt-3 leading-none">{desc}</p>
 </div>
 </div>
 );
}
