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
    MapPin,
    Fingerprint,
    Zap,
    ShieldCheck,
    Filter
} from 'lucide-react';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion } from 'framer-motion';

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
    programs: {
        data: Program[];
        meta: PaginationMeta;
    };
    faculties: Faculty[];
    filters: {
        search?: string;
        faculty_id?: string;
    };
}

export default function ProgramsIndex({ programs, faculties, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || facultyId !== (filters.faculty_id || '')) {
                router.get('/admin/tahun-akademik/prodi', { 
                    search: search || undefined,
                    faculty_id: facultyId || undefined
                }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, facultyId]);

    const handleDelete = (id: number) => {
        if (confirm('KONFIRMASI TERMINASI: Hapus permanen program studi ini? Seluruh data terkait akan terdampak.')) {
            router.delete(`/admin/tahun-akademik/prodi/${id}`);
        }
    };

    return (
        <AppLayout title="Otoritas Direktori Program Studi">
            <Head title="Direktori Prodi | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: SIERRA UNIT AKADEMIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Academic Program Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            DIREKTORI <span className="text-emerald-500">PROGRAM STUDI</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <MapPin size={12} className="text-emerald-500" />
                             Manajemen data master program studi, relasi fakultas, dan otomasi audit peserta KKN.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <Link
                            href="/admin/tahun-akademik/prodi/create"
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group rounded-none"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            REGISTRASI PRODI BARU
                        </Link>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* FILTER TOOLBAR TACTICAL */}
                    <div className="bg-white border border-emerald-100 p-8 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all flex flex-col xl:flex-row items-center gap-12">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        
                        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-8 relative z-10 flex-1">
                            <div className="relative group flex-1 bg-emerald-50/30 border border-emerald-100 hover:border-emerald-500 transition-all shadow-inner focus-within:border-emerald-500">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
                                <div className="pl-16 pr-8 py-5 flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest mb-1 italic leading-none">Pencarian Program Studi</span>
                                    <input
                                        type="search"
                                        placeholder="INPUT NAMA ATAU KODE PRODI..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm font-black italic text-emerald-950 focus:ring-0 placeholder:text-emerald-100 uppercase"
                                    />
                                </div>
                            </div>

                            <div className="relative group min-w-[320px] bg-emerald-50/30 border border-emerald-100 hover:border-emerald-500 transition-all shadow-inner focus-within:border-emerald-500">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
                                <div className="pl-16 pr-8 py-5 flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest mb-1 italic leading-none">Otoritas Fakultas</span>
                                    <select 
                                        value={facultyId}
                                        onChange={(e) => setFacultyId(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm font-black italic text-emerald-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                    >
                                        <option value="">SEMUA UNIT FAKULTAS</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-hover:animate-pulse" />
                            </div>
                        </div>

                        <div className="hidden xl:flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity relative z-10">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                            PROGRAM_REGISTRY ACTIVE
                        </div>
                    </div>

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Building2 size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Indeks Entitas Program Studi</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Data Master Program Studi Terverifikasi</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                MASTER PROGRAM FEED
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">KODE PRODI</th>
                                        <th className="px-10 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">IDENTITAS PROGRAM STUDI</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">OTORITAS FAKULTAS</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">KUOTA PESERTA</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">OPERATIONAL COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50">
                                    {programs.data.length > 0 ? programs.data.map((program) => (
                                        <tr key={program.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                            <td className="px-12 py-8">
                                                <div className="h-14 w-14 bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900 shadow-xl font-black text-[13px] italic group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 uppercase">
                                                    {program.code || 'NA'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1.5 group-hover/row:translate-x-2 transition-transform">
                                                    <span className="text-[14px] font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">{program.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <Fingerprint size={10} className="text-emerald-100" />
                                                        <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest italic leading-none">PROGRAM_ID: #{program.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center uppercase">
                                                <div className="inline-flex h-12 flex-col items-center justify-center px-6 bg-white border border-emerald-50 text-[10px] font-black text-emerald-950 uppercase tracking-widest tabular-nums group-hover/row:border-emerald-500 transition-all shadow-sm">
                                                    <Building2 size={12} className="text-emerald-300 mb-1" />
                                                    {program.faculty?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex flex-col gap-1 group-hover/row:scale-110 transition-transform">
                                                    <span className="text-[14px] font-black text-emerald-950 tabular-nums italic leading-none">{program.students_count || 0}</span>
                                                    <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest italic leading-none mt-1">MAHASISWA</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0 duration-300">
                                                    <Link
                                                        href={`/admin/tahun-akademik/prodi/${program.id}/edit`}
                                                        className="h-12 w-12 bg-white border border-emerald-50 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500 flex items-center justify-center shadow-sm transition-all active:scale-95"
                                                        title="MODIFIKASI PRODI"
                                                    >
                                                        <Edit2 style={{ width: 18, height: 18 }} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(program.id)}
                                                        className="h-12 w-12 bg-rose-50 text-rose-300 border border-rose-50 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 shadow-sm"
                                                        title="TERMINASI PRODI"
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
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-950">DATABASE PRODI NIHIL</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-12 py-10 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between bg-emerald-50/10 gap-8 italic mt-1 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-emerald-950 shadow-lg">
                                    <Activity size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Institutional Program Registry</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Entitas Terdaftar: {programs.meta.total} Program Studi</p>
                                </div>
                            </div>
                            <Pagination meta={programs.meta} />
                        </div>
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
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Arsitektur Akademik Terpusat</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Manajemen program studi menjamin akurasi data peserta KKN berdasarkan unit konsentrasi ilmu. Sinkronisasi data ini bersifat kritikal untuk penempatan lokasi (mapping) dan validasi kelayakan akademis bagi seluruh mahasiswa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">PROGRAM_MASTER_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL CORE DATA</span>
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
