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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
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
    <AppLayout title="Direktori Program Studi">
      <Head title="Program Studi" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Layers size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Pusat Data Akademik</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Program <span className="text-emerald-500">Studi.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Direktori Pemetaan Akademik dan Distribusi Mahasiswa KKN Institusi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Activity size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entitas</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{programs?.meta?.total ?? 0} PRODI</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.get('/admin/prodi/create')} 
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} /> TAMBAH PRODI
                    </button>
                </div>
            </div>
        </div>

        {/* --- COMMAND FILTER BAR --- */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm shadow-slate-200/50 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="CARI PROGRAM STUDI / KODE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase placeholder:text-slate-300"
            />
          </div>
          <div className="h-10 w-px bg-slate-100 hidden md:block" />
          <div className="relative w-full md:w-80 group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
             <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full h-14 pl-14 pr-12 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-widest cursor-pointer"
            >
              <option value="">SEMUA FAKULTAS</option>
              {(faculties || []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name?.toUpperCase() || 'UNTITLED'}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* --- SECTOR LEDGER --- */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="px-10 py-8 bg-slate-50/20 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-white border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Binary size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">Daftar Program Studi</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pemetaan Akademik Mahasiswa KKN</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-10 py-6">Kode Prodi</th>
                  <th className="px-10 py-6">Identitas Akademik</th>
                  <th className="px-10 py-6 text-center">Afiliasi Fakultas</th>
                  <th className="px-10 py-6 text-center">Beban Unit Mahasiswa</th>
                  <th className="px-10 py-6 text-right">Kelola</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-slate-50">
                {(programs?.data?.length ?? 0) > 0 ? (
                  programs?.data?.map((program) => (
                    <tr key={program.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-8">
                        <div className="h-12 w-12 bg-white border-2 border-slate-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-[11px] group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all shadow-sm">
                          {program.code || '--'}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-black text-slate-900 uppercase leading-tight group-hover:text-emerald-700 transition-colors tracking-tight">
                            {program.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 tabular-nums opacity-60">
                            ID System_{program.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm leading-none">
                          <Building2 size={12} className="opacity-60" />
                          {program.faculty?.name || 'BELUM TERPETAKAN'}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[15px] font-extrabold text-slate-900 tabular-nums italic group-hover:text-emerald-600 transition-colors">
                            {(program.students_count || 0).toLocaleString()} UNIT
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3 outline-none">
                          <Link
                            href={`/admin/prodi/${program.id}/edit`}
                            className="h-11 px-6 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
                          >
                            <Edit2 size={14} className="opacity-60" />
                            Update
                          </Link>
                          <button
                            onClick={() => handleDelete(program.id)}
                            className="h-11 w-11 bg-white border border-slate-200 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-40 text-center"
                    >
                         <div className="flex flex-col items-center gap-6 text-slate-200">
                            <Layers size={64} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database Prodi Kosong</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
               Halaman {programs?.meta?.current_page ?? 1} &middot; Total {programs?.meta?.total ?? 0} Entitas Program
            </span>
            {programs?.meta && <Pagination meta={programs.meta} />}
          </div>
        </div>

        {/* --- INFO CARD --- */}
        <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><Database size={350} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex items-center gap-10">
                    <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                        <Flag size={48} className="text-white" />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight">Otoritas Skema Program</h4>
                        <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
                            Definisi program KKN menentukan jenis penugasan dan kriteria mahasiswa di lapangan. Pastikan konfigurasi skema sesuai dengan pedoman akademik LPPM untuk menjamin validitas data pendaftaran.
                        </p>
                    </div>
                </div>
            </div>
        </div>
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
  icon: LucideIcon;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
      <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm">
        <Icon size={20} />
      </div>
      <div className="flex flex-col z-10">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
          {label}
        </span>
        <span className="text-2xl font-extrabold text-slate-900 uppercase tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">
          {value}
        </span>
      </div>
    </div>
  );
}

