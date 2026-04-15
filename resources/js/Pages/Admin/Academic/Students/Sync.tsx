import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, LucideIcon } from '@/types';
import {
 RefreshCw,
 Users,
 Database,
 Link2,
 Clock3,
 Info,
 ListFilter,
 ArrowRight,
 Zap,
 CheckCircle2,
 Search,
 ChevronRight,
 Loader2,
 FileJson,
 UserCheck,
 AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props extends PageProps {
 title: string;
 summary: {
 local_students: number;
 with_master_link: number;
 last_synced_at: string | null;
 };
}

function formatSyncTime(value: string | null): string {
 if (!value) return 'BELUM PERNAH';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return new Intl.DateTimeFormat('id-ID', {
 dateStyle: 'medium',
 timeStyle: 'short',
 }).format(date);
}

export default function StudentSync({ title, summary }: Props) {
 const bulkForm = useForm({});
 const targetedForm = useForm({ nim_list: '' });

 function submitBulk() {
 bulkForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
 }

 function submitTargeted(event: FormEvent<HTMLFormElement>) {
 event.preventDefault();
 targetedForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
 }

 return (
 <AppLayout title="Sinkronisasi Mahasiswa">
 <Head title="Sinkronisasi Data Mahasiswa - Panel Kontrol" />

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
 {/* --- MODERN HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Manajemen Akademik &middot; Sinkronisasi</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-4">
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight pt-2">
 Sinkronisasi <span>Mahasiswa.</span>
 </h1>
 <p className="text-lg font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-2xl mt-4">
 Pusat integrasi data akademis untuk sinkronisasi identitas dan riwayat studi mahasiswa KKN UIN SAIZU secara real-time.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-6 shrink-0">
 <div className="px-6 py-6 bg-emerald-600 border border-emerald-900 rounded-xl flex items-center gap-6 shadow-sm group">
 <div className="flex flex-col items-end">
 <span className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold leading-none mb-1.5">Sinkronisasi Terakhir</span>
 <span className="text-xs font-bold text-white tracking-wider">{formatSyncTime(summary.last_synced_at)}</span>
 </div>
 <div className="h-10 w-px bg-white/10" />
 <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS GRID --- */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <MetricCard 
 label="Data Lokal" 
 value={summary.local_students.toLocaleString('id-ID')} 
 icon={Users} 
 color="emerald" 
 desc="Database Inti KKN" 
 />
 <MetricCard 
 label="Koneksi Sistem Akademik" 
 value={summary.with_master_link.toLocaleString('id-ID')} 
 icon={Link2} 
 color="emerald" 
 desc="Data Terverifikasi" 
 />
 <MetricCard 
 label="Jembatan Data" 
 value="AKTIF" 
 icon={RefreshCw} 
 color="emerald" 
 desc="Koneksi Aktif" 
 />
 </div>

 {/* --- SYNC METHODS --- */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
 {/* Sinkronisasi Menyeluruh */}
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
 <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-600 text-black rounded-xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform">
 <Database size={28} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none mb-2">Sinkronisasi Menyeluruh</h3>
 <p className="text-2xl font-bold text-black tracking-tight leading-none">Pembaruan Masif</p>
 </div>
 </div>
 </div>
 
 <div className="p-12 space-y-10 flex-1 flex flex-col">
 <div className="bg-emerald-50/30 border border-gray-200 rounded-[2.5rem] p-8 space-y-8 flex-1">
 <p className="text-sm font-bold text-black leading-relaxed tracking-wider">
 Proses ini akan mengambil seluruh data mahasiswa aktif dari sistem pusat universitas untuk diperbarui ke database KKN secara masif.
 </p>
 <ul className="space-y-4">
 {[
 'Pembaruan Identitas & Bioaktif',
 'Validasi Program Studi & Fakultas',
 'Kalibrasi Parameter Akademik',
 'Sinkronisasi Capaian SKS & IPK'
 ].map((item, idx) => (
 <li key={idx} className="flex items-center gap-4">
 <CheckCircle2 size={16} className="text-emerald-500 shrink-0" strokeWidth={3} />
 <span className="text-sm font-bold text-black font-semibold text-xs leading-none mt-0.5">{item}</span>
 </li>
 ))}
 </ul>
 </div>

 <button
 onClick={submitBulk}
 disabled={bulkForm.processing || targetedForm.processing}
 className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-black font-bold rounded-xl shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-6 text-sm tracking-wider text-xs font-semibold leading-none disabled:opacity-50 active:scale-95 border-none"
 >
 {bulkForm.processing ? (
 <Loader2 size={24} className="animate-spin" />
 ) : (
 <RefreshCw size={24} strokeWidth={3} />
 )}
 {bulkForm.processing ? 'SINKRONISASI SEDANG BERJALAN...' : 'MULAI SINKRONISASI MASAL'}
 </button>
 </div>
 </div>

 {/* Sinkronisasi Terarah */}
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
 <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-600 text-emerald-600 rounded-xl flex items-center justify-center shadow-2xl group-hover:-rotate-12 transition-transform">
 <ListFilter size={28} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none mb-2">Sinkronisasi Terarah</h3>
 <p className="text-2xl font-bold text-black tracking-tight leading-none">Pembaruan Spesifik</p>
 </div>
 </div>
 </div>

 <form onSubmit={submitTargeted} className="p-12 space-y-10 flex-1 flex flex-col">
 <div className="space-y-4 flex-1">
 <label htmlFor="sync-nim-list" className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold flex items-center gap-3">
 Daftar NIM Mahasiswa
 </label>
 <textarea
 id="sync-nim-list"
 rows={5}
 value={targetedForm.data.nim_list}
 onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
 placeholder={'MASUKKAN NIM\nPISAHKAN DENGAN ENTER\nCONTOH:\n22411001\n22411002'}
 className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-8 py-8 text-sm font-bold text-black focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-100 font-mono "
 />
 {targetedForm.errors.nim_list && (
 <p className="text-xs font-bold text-rose-500 mt-2">{targetedForm.errors.nim_list}</p>
 )}
 </div>

 <div className="bg-emerald-50/50 border border-gray-200 rounded-xl p-6 flex items-start gap-6">
 <AlertTriangle size={24} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
 <p className="text-sm font-bold text-emerald-700 leading-relaxed font-semibold text-xs">
 Gunakan mode ini untuk memperbaiki data individu secara presisi. Masukkan daftar identitas Mahasiswa dipisahkan dengan enter.
 </p>
 </div>

 <button
 type="submit"
 disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
 className="h-12 w-full bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-6 text-sm tracking-wider text-xs font-semibold leading-none disabled:opacity-50 active:scale-95 border-none"
 >
 {targetedForm.processing ? (
 <Loader2 size={24} className="animate-spin" />
 ) : (
 <ArrowRight size={24} strokeWidth={3} />
 )}
 {targetedForm.processing ? 'MEMPROSES ANTRIAN...' : 'SINKRONKAN DATA TERPILIH'}
 </button>
 </form>
 </div>
 </div>

 {/* --- FOOTER GUIDE --- */}
 <div className="bg-emerald-600 rounded-xl p-16 text-white relative overflow-hidden shadow-sm group">
 <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 -mr-32 -mt-32 transition-transform group-hover:rotate-45 duration-1000">
 <FileJson size={500} strokeWidth={0.5} />
 </div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
 <div className="space-y-6 flex-1">
 <div className="flex items-center gap-8">
 <div className="h-10 w-20 bg-emerald-600 rounded-xl flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
 <UserCheck size={40} className="text-black" strokeWidth={2.5} />
 </div>
 <h3 className="text-3xl font-bold font-bold text-center leading-none">Kedaulatan Data Mahasiswa.</h3>
 </div>
 <p className="text-sm font-bold text-emerald-50/40 leading-relaxed max-w-4xl group-hover:text-emerald-50/60 transition-colors">
 Sinkronisasi data adalah jembatan penghubung antara sistem KKN dan database induk universitas. Pastikan jalur koneksi nominal sebelum menjalankan sinkronisasi massal untuk hasil yang presisi.
 </p>
 </div>
 <div className="px-6 py-6 bg-emerald-900/30 border border-emerald-800/50 rounded-xl flex flex-col items-center justify-center gap-2 shrink-0">
 <div className="flex items-center gap-3">
 <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold text-white">Koneksi Aktif</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: LucideIcon, color: 'emerald', desc: string }) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-10 space-y-8 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group relative overflow-hidden">
 <div className="flex items-center justify-between relative z-10">
 <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 shadow-sm border border-gray-200">
 <Icon size={28} strokeWidth={2.5} />
 </div>
 <div className="h-10 w-10 bg-emerald-50/50 rounded-full flex items-center justify-center text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">
 <ChevronRight size={20} strokeWidth={3} />
 </div>
 </div>
 <div className="space-y-2 relative z-10">
 <p className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none">{label}</p>
 <p className="text-2xl font-bold text-black tracking-tight tabular-nums ">{value}</p>
 <p className="text-sm font-bold text-black/20 tracking-wider text-xs font-semibold pt-4 leading-none">{desc}</p>
 </div>
 </div>
 );
}
