import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Search,
 Plus,
 Edit2,
 Trash2,
 Building2,
 Filter,
 Users,
 GraduationCap,
 Cpu,
 Target,
 Activity,
 Database,
 Binary,
 ShieldCheck,
 Zap,
 Flag,
 Fingerprint,
 ArrowRight,
 Layers,
 Globe,
 ChevronRight,
 ArrowLeft,
} from 'lucide-react';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Faculty {
 id: number;
 name: string;
}
interface Program {
 id: number;
 name: string;
 code: string;
 faculty_id: number;
 faculty?: Faculty;
 students_count?: number;
}
interface Props {
 programs: { data: Program[]; meta: PaginationMeta };
 faculties: Faculty[];
 filters: { search?: string; faculty_id?: string };
}

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function ProgramsIndex({ programs = { data: [], meta: { total: 0, current_page: 1 } }, faculties = [], filters = {} }: Props) {
 const [search, setSearch] = useState(filters?.search || '');
 const [facultyId, setFacultyId] = useState(filters?.faculty_id || '');

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '') || facultyId !== (filters.faculty_id || '')) {
 router.get(
 '/admin/prodi',
 {
 search: search || undefined,
 faculty_id: facultyId || undefined,
 },
 { preserveState: true, replace: true },
 );
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search, facultyId]);

 const handleDelete = (id: number) => {
 if (confirm('Lanjutkan untuk menghapus program studi ini? Seluruh data terkait kemahasiswaan mungkin akan terpengaruh.')) {
 router.delete(`/admin/tahun-akademik/prodi/${id}`);
 }
 };

 return (
 <AppLayout title="Direktori Manajemen Program">
 <Head title="Direktori Manajemen Program - Panel Kontrol" />

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
 {/* --- MODERN HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Akademis &middot; Pusat Data Terintegrasi</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-4">
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight pt-2">
 Matriks <span>Program.</span>
 </h1>
 <p className="text-lg font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-2xl mt-4">
 Matriks pemetaan akademis and basis distribusi peserta KKN institusional.
 </p>
 </div>
 <div className="flex items-center gap-6 shrink-0">
 <div className="h-10 px-6 bg-white border border-gray-200 rounded-xl flex items-center gap-6 shadow-sm">
 <Activity size={24} className="text-emerald-500" strokeWidth={2.5} />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-700/40 font-semibold text-xs leading-none mb-2">Total Program</span>
 <span className="text-xl font-bold text-black tabular-nums leading-none tracking-tight">{(programs?.meta?.total ?? 0).toLocaleString()} DATA PRODI</span>
 </div>
 </div>
 <button 
 onClick={() => router.get('/admin/prodi/create')} 
 className="h-10 px-6 bg-emerald-600 text-white rounded-xl font-bold shadow-2xl flex items-center gap-6 text-sm transition-all active:scale-95 tracking-wider text-xs font-semibold hover:bg-emerald-600 border-none"
 >
 <Plus size={24} strokeWidth={3} /> REGISTRASI DATA PRODI
 </button>
 </div>
 </div>
 </div>

 {/* --- NAVIGATION CONTROL PANEL --- */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row items-center gap-6">
 <div className="flex-1 w-full relative group">
 <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" strokeWidth={3} />
 <input
 type="text"
 placeholder="CARI DATA PRODI / KODE..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full h-18 pl-20 pr-8 bg-emerald-50/20 border border-gray-200 rounded-xl text-sm font-bold text-black focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-50/50 "
 />
 </div>
 <div className="h-12 w-px bg-emerald-50 hidden lg:block" />
 <div className="relative w-full lg:w-[450px] group">
 <Filter size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500" strokeWidth={3} />
 <select
 value={facultyId}
 onChange={(e) => setFacultyId(e.target.value)}
 className="w-full h-18 pl-20 pr-12 bg-emerald-50/20 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-bold text-black appearance-none tracking-wider text-xs font-semibold cursor-pointer"
 >
 <option value="">SELURUH BASIS FAKULTAS</option>
 {(faculties || []).map((f) => (
 <option key={f.id} value={f.id}>
 {f.name?.toUpperCase() || 'UNTITLED'}
 </option>
 ))}
 </select>
 <ChevronRight size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-300 rotate-90 pointer-events-none" strokeWidth={3} />
 </div>
 </div>

 {/* --- MAIN INDEX PANEL --- */}
 <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm font-sans">
 <div className="px-6 py-6 bg-gray-50/50 border-b border-emerald-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-white border border-gray-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
 <Binary size={28} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="text-xl font-bold text-black font-bold text-center">Indeks Antrean Prodi</span>
 <span className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold mt-1">Parameter Distribusi Akademis</span>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[500px]">
 <table className="w-full text-left">
 <thead className="bg-white text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/40 border-b border-emerald-50/50">
 <tr>
 <th className="px-6 py-8">Identitas Unit</th>
 <th className="px-6 py-8">Nomenklatur Program</th>
 <th className="px-6 py-8 text-center">Manajemen Fakultas Terkait</th>
 <th className="px-6 py-8 text-center">Beban Unit Terdistribusi</th>
 <th className="px-6 py-8 text-right">Manajemen Kendali</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-50/50">
 {(programs?.data?.length ?? 0) > 0 ? (
 programs?.data?.map((program) => (
 <tr key={program.id} className="hover:bg-emerald-50/30 transition-all duration-300 group">
 <td className="px-6 py-6">
 <div className="w-16 h-16 bg-emerald-600 text-white border border-emerald-800 rounded-xl flex items-center justify-center font-bold text-xs group-hover:bg-emerald-900 transition-all shadow-xl tabular-nums">
 {program.code || 'NULL'}
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="flex flex-col">
 <span className="text-lg font-bold text-black leading-none tracking-tight truncate max-w-[400px] group-hover:text-emerald-700 transition-colors">
 {program.name}
 </span>
 <span className="text-sm font-bold text-emerald-700/20 mt-3 font-semibold text-xs leading-none">
 Identitas Sistem &middot; #{program.id}
 </span>
 </div>
 </td>
 <td className="px-6 py-6 text-center">
 <div className="inline-flex items-center gap-4 px-6 py-2 bg-emerald-50 text-emerald-700 border border-gray-200 rounded-xl text-sm font-bold tracking-wider text-xs font-semibold shadow-sm leading-none tabular-nums">
 <Building2 size={12} strokeWidth={3} className="opacity-40" />
 {program.faculty?.name || 'BELUM TEROKUPASI'}
 </div>
 </td>
 <td className="px-6 py-6 text-center">
 <div className="flex flex-col items-center gap-2">
 <span className="text-base font-bold text-black tabular-nums group-hover:text-emerald-600 transition-colors">
 {(program.students_count || 0).toLocaleString()} UNIT
 </span>
 </div>
 </td>
 <td className="px-6 py-6 text-right">
 <div className="flex justify-end gap-4 opacity-10 group-hover:opacity-100 transition-all duration-300 font-sans">
 <Link
 href={`/admin/prodi/${program.id}/edit`}
 className="h-12 px-8 bg-white border border-emerald-100 text-emerald-200 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center gap-3 text-sm font-bold tracking-wider text-xs font-semibold shadow-sm active:scale-95 no-underline"
 >
 <Edit2 size={16} strokeWidth={2.5} className="opacity-60" />
 KOREKSI
 </Link>
 <button
 onClick={() => handleDelete(program.id)}
 className="h-12 w-12 bg-white border border-emerald-100 text-emerald-100/50 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 border-none"
 >
 <Trash2 size={24} strokeWidth={2.5} />
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td
 colSpan={5}
 className="px-6 py-64 text-center"
 >
 <div className="flex flex-col items-center gap-6 text-emerald-50">
 <Layers size={100} strokeWidth={0.5} className="opacity-40" />
 <p className="text-xs font-bold tracking-[0.6em] leading-none opacity-30">Database Prodi Kosong</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="px-6 py-6 border-t border-gray-200 bg-emerald-50/5 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
 <span className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none">
 Data Sistem &middot; {programs?.meta?.total ?? 0} DATA PROGRAM
 </span>
 {programs?.meta && <Pagination meta={programs.meta} />}
 </div>
 </section>

 {/* --- STRATEGIC INFO --- */}
 <section className="bg-emerald-600 rounded-xl p-12 text-white relative overflow-hidden shadow-sm border-none">
 <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16"><Database size={450} strokeWidth={0.5} /></div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-12 w-24 bg-emerald-600 text-black rounded-xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
 <Flag size={48} strokeWidth={2.5} />
 </div>
 <div className="space-y-4">
 <h4 className="text-3xl font-bold font-bold text-center leading-none">Aturan Skema Program.</h4>
 <p className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold leading-relaxed max-w-2xl opacity-60">
 Parameter program menentukan validitas penugasan dan kriteria mahasiswa di lapangan. Pastikan konfigurasi skema sesuai dengan pedoman akademik LPPM untuk menjamin validitas pendaftaran.
 </p>
 </div>
 </div>
 </div>
 </section>
 </div>
 </AppLayout>
 );
}

function MetricStrip({
 label,
 value,
 icon: Icon,
}: {
 label: string;
 value: string | number;
 icon: any;
}) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center gap-6 shadow-sm hover:shadow-emerald-950/10 transition-all group overflow-hidden relative font-sans">
 <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm border-none">
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col z-10">
 <span className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none mb-2">
 {label}
 </span>
 <span className="text-3xl font-bold text-black font-bold text-center tabular-nums leading-none group-hover:text-emerald-600 transition-colors ">
 {value}
 </span>
 </div>
 </div>
 );
}
