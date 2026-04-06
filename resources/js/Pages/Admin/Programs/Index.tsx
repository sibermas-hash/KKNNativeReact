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
    Info,
    GraduationCap
} from 'lucide-react';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Program {
    id: number;
    name: string;
    code: string;
    faculty?: { name: string };
    students_count?: number;
}

interface Props {
    programs: {
        data: Program[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function ProgramsIndex({ programs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/tahun-akademik/program-studi', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = (id: number) => {
        if (confirm('Hapus program studi ini? Seluruh data mahasiswa di dalamnya juga akan terhapus.')) {
            router.delete(`/admin/tahun-akademik/program-studi/${id}`);
        }
    };

    return (
        <AppLayout title="Direktori Program Studi">
            <Head title="Program Studi | POS-KKN" />

            <div className="space-y-8 font-sans antialiased">
                {/* SYSTEM HEADER */}
                <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">MANAJEMEN PROGRAM STUDI</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            DATABASE MASTER BIDANG KEILMUAN
                        </p>
                    </div>
                    <Link
                        href="/admin/tahun-akademik/program-studi/create"
                        className="h-10 px-6 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                    >
                        <Plus size={14} />
                        TAMBAH UNIT PRODI
                    </Link>
                </div>

                {/* SEARCH STRIP */}
                <div className="bg-white border border-slate-200 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="CARI PRODI ATAU KODE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded px-10 text-xs font-bold text-slate-700 uppercase tracking-wider focus:bg-white focus:ring-0 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* DATA GRID */}
                <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">KODE PRODI</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NAMA PROGRAM STUDI</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">FAKULTAS / INDUK</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">MAHASISWA</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">INSTRUMEN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {programs.data.length > 0 ? programs.data.map((program) => (
                                    <tr key={program.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400">
                                                    <Binary size={14} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                                    {program.code || `P-${program.id}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{program.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {program.faculty?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                                                {program.students_count || 0} REKAP
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/tahun-akademik/program-studi/${program.id}/edit`}
                                                    className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center rounded shadow-sm transition-all"
                                                    title="Edit Prodi"
                                                >
                                                    <Edit2 size={12} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(program.id)}
                                                    className="h-8 w-8 bg-rose-600 text-white flex items-center justify-center rounded hover:bg-rose-700 shadow-sm transition-all"
                                                    title="Hapus Prodi"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center text-slate-300">
                                            <Database size={48} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">TIDAK ADA DATA</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {programs.meta && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                TOTAL PRODI: {programs.meta.total}
                            </span>
                            <Pagination meta={programs.meta} />
                        </div>
                    )}
                </div>

                <div className="p-6 bg-emerald-50 border border-dashed border-emerald-200 rounded flex items-center gap-4">
                    <Info size={16} className="text-emerald-600" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-relaxed">
                        Perubahan pada Program Studi akan berdampak pada Filter Dashboard Mahasiswa dan Pelaporan Evaluasi Akhir periode KKN.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
