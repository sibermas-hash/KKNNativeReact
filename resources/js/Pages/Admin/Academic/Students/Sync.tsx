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
 ListFilter,
 ArrowRight,
 Zap,
 CheckCircle2,
 Loader2,
 FileJson,
 UserCheck,
 AlertTriangle,
 ShieldCheck,
 Activity,
 Search,
 ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

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

export default function StudentSync({ summary }: Props) {
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
 <Head title="Sinkronisasi Mahasiswa KKN" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <RefreshCw size={18} />
 <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Integrasi Data Master</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
 Sinkronisasi <span className="text-emerald-500">Mahasiswa.</span>
 </h1>
 <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
 Pusat integrasi data untuk menyelaraskan identitas dan riwayat studi mahasiswa antara sistem KKN dan database induk universitas.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 <div className="px-5 py-3 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-100">
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest leading-none mb-1.5">Update Terakhir</span>
 <span className="text-xs font-bold text-white tracking-wide">{formatSyncTime(summary.last_synced_at)}</span>
 </div>
 <div className="w-px h-8 bg-white/20" />
 <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS GRID --- */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <MetricCard 
 label="Data KKN Lokal" 
 value={summary.local_students.toLocaleString('id-ID')} 
 icon={Users} 
 desc="Total Mahasiswa Terdaftar" 
 />
 <MetricCard 
 label="Terhubung Master" 
 value={summary.with_master_link.toLocaleString('id-ID')} 
 icon={Link2} 
 desc="Identitas Terverifikasi" 
 />
 <MetricCard 
 label="Status Jembatan" 
 value="AKTIF" 
 icon={RefreshCw} 
 desc="Koneksi Master Sistem" 
 />
 </div>

 {/* --- SYNC METHODS --- */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Sinkronisasi Menyeluruh */}
 <div className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm flex flex-col group">
 <div className="px-6 py-6 border-b-2 border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
 <Database size={24} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-tight leading-none mb-1">Sinkronisasi Masif</h3>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Pembaruan Menyeluruh</p>
 </div>
 </div>
 </div>
 
 <div className="p-8 space-y-8 flex-1 flex flex-col">
 <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6 space-y-6 flex-1">
 <p className="text-[12px] font-semibold text-emerald-900 leading-relaxed uppercase tracking-wide">
 Proses ini akan menarik seluruh data mahasiswa aktif dari server pusat universitas untuk menyelaraskan database operasional KKN.
 </p>
 <ul className="space-y-4">
 {[
 'Pembaruan Identitas & Biodata',
 'Validasi Program Studi & Fakultas',
 'Sinkronisasi Status Akademik',
 'Kalibrasi Riwayat Kelompok'
 ].map((item, idx) => (
 <li key={idx} className="flex items-center gap-3">
 <CheckCircle2 size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
 <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">{item}</span>
 </li>
 ))}
 </ul>
 </div>

 <button
 onClick={submitBulk}
 disabled={bulkForm.processing || targetedForm.processing}
 className="h-14 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-4 text-sm tracking-widest uppercase disabled:opacity-50 active:scale-95"
 >
 {bulkForm.processing ? (
 <Loader2 size={20} className="animate-spin" />
 ) : (
 <RefreshCw size={20} strokeWidth={2.5} />
 )}
 {bulkForm.processing ? 'Sedang Sinkronisasi...' : 'Mulai Sinkronisasi Masal'}
 </button>
 </div>
 </div>

 {/* Sinkronisasi Terarah */}
 <div className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm flex flex-col group">
 <div className="px-6 py-6 border-b-2 border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-all">
 <ListFilter size={24} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-tight leading-none mb-1">Sinkronisasi Spesifik</h3>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Berdasarkan NIM</p>
 </div>
 </div>
 </div>

 <form onSubmit={submitTargeted} className="p-8 space-y-8 flex-1 flex flex-col">
 <div className="space-y-3 flex-1">
 <label htmlFor="sync-nim-list" className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
 <Search size={14} /> Daftar Identitas (NIM)
 </label>
 <textarea
 id="sync-nim-list"
 rows={5}
 value={targetedForm.data.nim_list}
 onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
 placeholder={'Masukkan NIM Mahasiswa\nGunakan baris baru (Enter) sebagai pemisah'}
 className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl px-6 py-5 text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 font-mono shadow-inner min-h-[160px]"
 />
 {targetedForm.errors.nim_list && (
 <p className="text-xs font-bold text-rose-500 mt-2">{targetedForm.errors.nim_list}</p>
 )}
 </div>

 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-4">
 <AlertTriangle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
 <p className="text-[10px] font-semibold text-emerald-700 leading-relaxed uppercase tracking-widest">
 Gunakan mode ini untuk perbaikan data individu secara presisi tanpa membebani server pusat universitas.
 </p>
 </div>

 <button
 type="submit"
 disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
 className="h-14 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-4 text-sm tracking-widest uppercase disabled:opacity-50 active:scale-95"
 >
 {targetedForm.processing ? (
 <Loader2 size={20} className="animate-spin" />
 ) : (
 <ArrowRight size={20} strokeWidth={2.5} />
 )}
 {targetedForm.processing ? 'Memproses Antrian...' : 'Sinkronkan Data Terpilih'}
 </button>
 </form>
 </div>
 </div>

 {/* --- FOOTER GUIDE --- */}
 <div className="bg-emerald-950 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32"><RefreshCw size={400} /></div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
 <div className="flex items-center gap-10 flex-1">
 <div className="h-24 w-24 bg-emerald-900 border-2 border-emerald-800 text-emerald-400 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-all">
 <ShieldCheck size={48} strokeWidth={2} />
 </div>
 <div className="space-y-3">
 <h3 className="text-2xl font-bold tracking-tight uppercase leading-none">Integritas Sinkronisasi Data Mahasiswa</h3>
 <p className="text-[13px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
 Sinkronisasi data adalah jembatan vital antara sistem operasional KKN dan database induk universitas. Pastikan jalur koneksi server dalam kondisi prima sebelum menjalankan sinkronisasi massal demi akurasi data yang presisi.
 </p>
 </div>
 </div>
 <div className="px-6 py-4 bg-emerald-900 border border-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0">
 <div className="flex items-center gap-3">
 <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Jalur Data Aktif</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string, value: string, icon: LucideIcon, desc: string }) {
 return (
 <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-8 flex items-center gap-6 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
 <div className="h-14 w-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col relative z-20">
 <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase leading-none mb-3">{label}</span>
 <span className="text-2xl font-black text-emerald-950 tracking-tight tabular-nums leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value}</span>
 <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
 </div>
 </div>
 );
}
