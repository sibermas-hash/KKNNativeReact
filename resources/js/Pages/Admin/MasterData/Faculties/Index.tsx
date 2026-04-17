import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Search,
 Plus,
 Edit2,
 Trash2,
 Database,
 Activity,
 ChevronRight,
 Building2,
 Fingerprint,
 Zap,
 ShieldCheck,
 Globe,
 Layers,
 Cpu,
} from 'lucide-react';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from '@/types';

interface Faculty { id: number; name: string; code: string; students_count?: number; programs_count?: number; }
interface Props { faculties: { data: Faculty[]; meta: PaginationMeta; }; filters: { search?: string; }; }

export default function FacultiesIndex({ faculties = { data: [], meta: { total: 0, current_page: 1, last_page: 1 } }, filters = {} }: Props) {
 const [search, setSearch] = useState(filters?.search || '');

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/fakultas', { search }, { preserveState: true, replace: true });
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search]);

 const handleDelete = (id: number) => {
 if (confirm('Lanjutkan untuk menghapus data fakultas ini? Tindakan ini akan menghapus seluruh data program studi yang terkait.')) {
 router.delete(`/admin/fakultas/${id}`);
 }
 };

 return (
 <AppLayout title="Direktori Manajemen Fakultas">
 <Head title="Direktori Manajemen Fakultas - Panel Kontrol"/>

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
 {/* --- MODERN HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-[#1a7a4a]">
 <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"/>
 <span className="text-sm font-bold text-xs font-semibold leading-none">Institusional &middot; Arsitektur Fakultas</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-4">
 <h1 className="text-2xl font-bold text-black leading-tight pt-2">
 Basis <span>Struktural.</span>
 </h1>
 <p className="text-lg font-bold text-gray-700/40 leading-relaxed max-w-2xl mt-4">
 Manajemen arsitektur fakultas dan protokol pemetaan akademis institusional.
 </p>
 </div>
 <div className="flex items-center gap-6 shrink-0">
 <div className="h-10 px-6 bg-white border border-gray-200 rounded-xl flex items-center gap-6 shadow-sm">
 <Activity size={24} className="text-[#1a7a4a]"strokeWidth={2.5} />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-gray-700/40 font-semibold text-xs leading-none mb-2">Total Fakultas</span>
 <span className="text-xl font-bold text-black tabular-nums leading-none">{(faculties?.meta?.total ?? 0).toLocaleString()} DATA UNIT</span>
 </div>
 </div>
 <button 
 onClick={() => router.get('/admin/fakultas/create')} 
 className="h-10 px-6 bg-[#16a34a] text-white rounded-xl font-bold shadow-sm flex items-center gap-6 text-sm transition-all active:scale-95 text-xs font-semibold hover:bg-[#16a34a] border-none"
 >
 <Plus size={24} strokeWidth={3} /> REGISTRASI DATA UNIT
 </button>
 </div>
 </div>
 </div>

 {/* --- MAIN INDEX PANEL --- */}
 <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm font-sans">
 <div className="px-6 py-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/50">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-white border border-gray-200 text-[#1a7a4a] rounded-xl flex items-center justify-center shadow-sm">
 <Layers size={28} strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-xl font-bold text-black font-bold text-center">Direktori Basis Unit</h3>
 <p className="text-sm font-bold text-gray-700/40 text-xs font-semibold">Matriks Distribusi Mahasiswa &middot; {faculties?.meta?.total ?? 0} Unit</p>
 </div>
 </div>
 <div className="relative w-full lg:w-[400px] group">
 <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1a7a4a] transition-colors"strokeWidth={3} />
 <input 
 type="text"
 value={search} 
 onChange={(e) => setSearch(e.target.value)} 
 className="w-full h-16 pl-20 pr-8 bg-white border border-gray-200 rounded-xl text-sm font-bold text-black focus:border-[#1a7a4a] outline-none transition-all placeholder:text-emerald-50/50"
 placeholder="CARI FAKULTAS..."
 />
 </div>
 </div>

 <div className="overflow-x-auto min-h-[500px]">
 <table className="w-full text-left">
 <thead className="bg-white text-sm font-bold text-xs font-semibold text-gray-700/40 border-b border-gray-200/50">
 <tr>
 <th className="px-6 py-8">Identitas Unit</th>
 <th className="px-6 py-8">Nomenklatur Fakultas</th>
 <th className="px-6 py-8 text-center">Beban Akademis Terintegrasi</th>
 <th className="px-6 py-8 text-right">Manajemen Kendali</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]/50">
 {(faculties?.data?.length ?? 0) > 0 ? (
 faculties?.data?.map((faculty) => (
 <tr key={faculty.id} className="hover:bg-gray-50 transition-all duration-300 group">
 <td className="px-6 py-6">
 <span className="text-sm font-bold text-[#1a7a4a] bg-gray-50 border border-gray-200 px-6 py-2 rounded-xl tabular-nums shadow-sm">
 {faculty?.code || 'SYST_NONE'}
 </span>
 </td>
 <td className="px-6 py-6">
 <div className="flex flex-col">
 <span className="text-lg font-bold text-black group-hover:text-gray-700 transition-colors leading-none truncate max-w-[400px]">{faculty?.name}</span>
 <span className="text-sm font-bold text-gray-700/20 mt-3 font-semibold text-xs">Identitas Sistem &middot; #{faculty?.id}</span>
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="flex flex-col items-center gap-2">
 <span className="text-base font-bold text-black tabular-nums group-hover:text-[#1a7a4a] transition-colors">{(faculty?.students_count || 0).toLocaleString()} UNIT</span>
 <span className="text-sm font-bold text-gray-700/30 text-xs font-semibold leading-none">{faculty?.programs_count || 0} PRODI TERKAIT</span>
 </div>
 </td>
 <td className="px-6 py-6 text-right">
 <div className="flex justify-end gap-4 opacity-10 group-hover:opacity-100 transition-all duration-300 font-sans">
 <Link 
 href={`/admin/fakultas/${faculty?.id}/edit`} 
 className="h-12 px-8 bg-white border border-gray-200 text-gray-500 hover:text-[#1a7a4a] hover:border-gray-300 transition-all rounded-xl flex items-center text-sm font-bold text-xs font-semibold shadow-sm active:scale-95 no-underline"
 >
 <Edit2 size={16} strokeWidth={2.5} className="mr-3"/> KOREKSI
 </Link>
 <button 
 onClick={() => handleDelete(faculty?.id)} 
 className="h-12 w-12 bg-white border border-gray-200 text-gray-700/50 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all rounded-xl flex items-center justify-center shadow-sm active:scale-95 border-none"
 >
 <Trash2 size={24} strokeWidth={2.5} />
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr><td colSpan={4} className="px-6 py-64 text-center">
 <div className="flex flex-col items-center gap-6 text-emerald-50">
 <Building2 size={100} strokeWidth={0.5} className="opacity-40"/>
 <p className="text-xs font-bold leading-none opacity-30">Database Fakultas Kosong</p>
 </div>
 </td></tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
 <span className="text-sm font-bold text-gray-700/20 text-xs font-semibold leading-none">Data Sistem &middot; {faculties?.meta?.total ?? 0} DATA TERDAFTAR</span>
 {faculties?.meta && <Pagination meta={faculties.meta} />}
 </div>
 </section>

 {/* --- STRATEGIC INFO --- */}
 <section className="bg-[#16a34a] rounded-xl p-12 text-white relative overflow-hidden shadow-sm border-none">
 <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-12 -mt-12"><Building2 size={400} strokeWidth={0.5} /></div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-12 w-24 bg-[#16a34a] text-black rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
 <ShieldCheck size={48} strokeWidth={2.5} />
 </div>
 <div className="space-y-4">
 <h4 className="text-3xl font-bold font-bold text-center leading-none">Aturan Integritas Struktural.</h4>
 <p className="text-sm font-bold text-[#1a7a4a] text-xs font-semibold leading-relaxed max-w-2xl opacity-60">
 Fondasi segmentasi akademis merupakan pilar validitas data. Akurasi basis mahasiswa dan alokasi program studi bergantung pada stabilitas arsitektur fakultas yang terdaftar.
 </p>
 </div>
 </div>
 </div>
 </section>
 </div>
 </AppLayout>
 );
}

function FacultyMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center gap-6 shadow-sm hover:shadow-emerald-950/10 transition-all group overflow-hidden relative font-sans">
 <div className="h-14 w-14 bg-gray-50 text-[#1a7a4a] rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-sm border-none"><Icon size={24} strokeWidth={2.5} /></div>
 <div className="flex flex-col z-10">
 <span className="text-sm font-bold text-gray-700/40 text-xs font-semibold leading-none mb-2">{label}</span>
 <span className="text-3xl font-bold text-black font-bold text-center tabular-nums leading-none group-hover:text-[#1a7a4a] transition-colors">{value}</span>
 </div>
 </div>
 );
}
