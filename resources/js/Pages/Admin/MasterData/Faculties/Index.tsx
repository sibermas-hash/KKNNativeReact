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
    <AppLayout title="Direktori Fakultas">
      <Head title="Direktori Fakultas" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Building2 size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Struktur Organisasi Institusi</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Direktori <span className="text-emerald-500">Fakultas.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Manajemen Struktur Organisasi dan Pemetaan Beban Akademik Institusi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Activity size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entitas</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{faculties?.meta?.total ?? 0} FAKULTAS</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.get('/admin/fakultas/create')} 
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} /> TAMBAH FAKULTAS
                    </button>
                </div>
            </div>
        </div>

        {/* --- GRID DATA --- */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                 <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                           <Layers size={24} />
                      </div>
                      <div className="space-y-1">
                          <h3 className="text-base font-bold text-black uppercase tracking-tight">Direktori Unit Kerja</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Pemetaan Fakultas dan Beban Mahasiswa</p>
                      </div>
                 </div>
                 <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="text" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-emerald-500 transition-all outline-none" 
                        placeholder="Cari Fakultas..." 
                      />
                 </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-50">
                        <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-10 py-6">Kode Unit</th>
                            <th className="px-10 py-6">Identitas Fakultas</th>
                            <th className="px-10 py-6 text-center">Beban Akademik</th>
                            <th className="px-10 py-6 text-right">Pengelolaan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(faculties?.data?.length ?? 0) > 0 ? (
                            faculties?.data?.map((faculty) => (
                                <tr key={faculty.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-10 py-8">
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl tabular-nums uppercase">
                                            {faculty?.code || '----'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-tight">{faculty?.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 tabular-nums">ID System_{faculty?.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                         <div className="flex flex-col items-center">
                                             <span className="text-base font-bold text-slate-900 tabular-nums italic group-hover:text-emerald-600 transition-colors">{(faculty?.students_count || 0).toLocaleString()} UNIT</span>
                                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{faculty?.programs_count || 0} PRODI</span>
                                         </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                         <div className="flex justify-end gap-3 outline-none">
                                            <Link 
                                                href={`/admin/fakultas/${faculty?.id}/edit`} 
                                                className="h-11 px-6 bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-100 transition-all rounded-2xl flex items-center text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95"
                                            >
                                                <Edit2 size={14} className="mr-2" /> Update
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(faculty?.id)} 
                                                className="h-11 w-11 bg-white border border-slate-200 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all rounded-2xl flex items-center justify-center shadow-sm active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                         </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="py-32 text-center">
                                <div className="flex flex-col items-center gap-4 text-slate-200">
                                    <Building2 size={60} strokeWidth={1} />
                                    <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database Fakultas Kosong</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Halaman {faculties?.meta?.current_page ?? 1} — {faculties?.meta?.last_page ?? 1} unit terdaftar</span>
                {faculties?.meta && <Pagination meta={faculties.meta} />}
            </div>
        </div>

        {/* --- INFO CARD --- */}
        <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100/50">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 -mr-10 -mt-10"><Building2 size={300} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 text-emerald-300 border border-white/10 backdrop-blur-md">
                        <ShieldCheck size={40} />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">Integritas Struktur Unit</h4>
                        <p className="text-xs font-medium text-emerald-100/60 uppercase tracking-widest leading-relaxed max-w-2xl">
                            Direktori fakultas merupakan pilar utama segmentasi akademik. Perubahan pada struktur unit berdampak langsung pada validitas data kemahasiswaan dan alokasi program studi di seluruh sistem KKN.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

function FacultyMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={20} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</span>
                <span className="text-2xl font-extrabold text-slate-900 uppercase tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
