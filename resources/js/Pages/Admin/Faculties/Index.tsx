import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Search, 
    Plus, 
    Edit2,
    Trash2,
    Database,
    Binary,
    Activity,
    ChevronRight,
    Building2,
    Fingerprint,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion } from 'framer-motion';

interface Faculty {
    id: number;
    name: string;
    code: string;
    students_count?: number;
    programs_count?: number;
}

interface Props {
    faculties: {
        data: Faculty[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function FacultiesIndex({ faculties, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/tahun-akademik/fakultas', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = (id: number) => {
        if (confirm('KONFIRMASI TERMINASI: Hapus permanen fakultas ini? Seluruh data program studi di dalamnya juga akan terdampak.')) {
            router.delete(`/admin/tahun-akademik/fakultas/${id}`);
        }
    };

    return (
        <AppLayout title="Otoritas Direktori Fakultas">
            <Head title="Direktori Fakultas | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS UNIT AKADEMIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Faculty Registry Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            DIREKTORI <span className="text-emerald-500">FAKULTAS</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Building2 size={12} className="text-emerald-500" />
                             Manajemen data master unit fakultas, integrasi program studi, dan audit entitas akademik.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <Link
                            href="/admin/tahun-akademik/fakultas/create"
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group rounded-none"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            REGISTRASI FAKULTAS BARU
                        </Link>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* SEARCH STRIP TACTICAL */}
                    <div className="bg-white border border-emerald-100 p-8 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all flex flex-col md:flex-row items-center gap-8">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        <div className="relative group flex-1 w-full relative z-10">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
                            <input
                                type="search"
                                placeholder="CARI BERDASARKAN NAMA FAKULTAS ATAU KODE UNIT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 bg-emerald-50/10 border border-emerald-50 text-[12px] font-black uppercase tracking-[0.2em] italic text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 transition-all outline-none shadow-inner"
                            />
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity relative z-10">
                            <Zap size={18} className="text-emerald-500 animate-pulse" />
                            REGISTRY ENGINE ACTIVE
                        </div>
                    </div>

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Database size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Indeks Unit Fakultas</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Data Master Fakultas Terpublikasi</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                MASTER DATA FEED
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">KODE UNIT</th>
                                        <th className="px-10 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">IDENTITAS FAKULTAS</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">STATISTIK PRODI</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">ENTITAS MHS</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">OPERATIONAL COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50">
                                    {faculties.data.length > 0 ? faculties.data.map((faculty) => (
                                        <tr key={faculty.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                            <td className="px-12 py-8">
                                                <div className="h-14 w-14 bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900 shadow-xl font-black text-[13px] italic group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 uppercase">
                                                    {faculty.code || 'NA'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1.5 group-hover/row:translate-x-2 transition-transform">
                                                    <span className="text-[14px] font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">{faculty.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <Fingerprint size={10} className="text-emerald-100" />
                                                        <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest italic leading-none">FACULTY_ID: #{faculty.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center uppercase">
                                                <div className="inline-flex h-12 items-center px-6 bg-white border border-emerald-50 text-[10px] font-black text-emerald-950 uppercase tracking-widest tabular-nums group-hover/row:border-emerald-500 transition-all shadow-sm">
                                                    {faculty.programs_count || 0} PRODI
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex flex-col gap-1 group-hover/row:scale-110 transition-transform">
                                                    <span className="text-[14px] font-black text-emerald-950 tabular-nums italic leading-none">{faculty.students_count || 0}</span>
                                                    <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest italic leading-none mt-1">PESERTA</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0 duration-300">
                                                    <Link
                                                        href={`/admin/tahun-akademik/fakultas/${faculty.id}/edit`}
                                                        className="h-12 w-12 bg-white border border-emerald-50 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500 flex items-center justify-center shadow-sm transition-all active:scale-95"
                                                        title="MODIFIKASI UNIT"
                                                    >
                                                        <Edit2 style={{ width: 18, height: 18 }} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(faculty.id)}
                                                        className="h-12 w-12 bg-rose-50 text-rose-300 border border-rose-50 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 shadow-sm"
                                                        title="TERMINASI UNIT"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button className="h-12 w-12 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-12 py-56 text-center opacity-20">
                                                <div className="flex flex-col items-center gap-8">
                                                    <Database size={64} className="text-emerald-950" strokeWidth={1} />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-emerald-950">DATABASE FAKULTAS NIHIL</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {faculties.meta && (
                             <div className="px-12 py-10 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between bg-emerald-50/10 gap-8 italic relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-3 bg-emerald-950 shadow-lg">
                                        <Activity size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Operational Unit Feed</span>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Entitas Terdaftar: {faculties.meta.total} Fakultas</p>
                                    </div>
                                </div>
                                <Pagination meta={faculties.meta} />
                            </div>
                        )}
                    </div>

                    {/* SECURITY FOOTER MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                             <div className="space-y-8 flex-1">
                                 <div className="flex items-center gap-8">
                                    <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
                                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Integritas Master Data</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Direktori fakultas merupakan pilar utama struktur data akademik sistem POS-KKN. Setiap perubahan pada entitas ini akan berdampak langsung pada pemetaan program studi, distribusi mahasiswa, dan laporan statistik universitas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">UNIT_MASTER_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">CENTRAL REGISTRY CONTROL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Edit2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
