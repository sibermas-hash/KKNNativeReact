import { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { School, Search, Building2, LayoutGrid, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { clsx } from 'clsx';

interface FacultyWithCount {
    id: number;
    code: string;
    name: string;
    programs_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props extends PageProps {
    faculties: {
        data: FacultyWithCount[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
    syncInfo: {
        mode: 'sync-only';
        source: string;
        last_synced_at?: string | null;
    };
}

export default function FacultiesIndex({ faculties, filters, syncInfo }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/fakultas', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search]);

    return (
        <AppLayout title="Direktori Fakultas">
            <Head title="Manajemen Fakultas" />
            
            <div className="space-y-8 pb-24">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <School className="w-8 h-8 text-emerald-600" />
                            DIREKTORI <span className="text-emerald-600">FAKULTAS</span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Sumber Otoritas: {syncInfo.source}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all cursor-default">
                             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <Layers className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entitas</p>
                                <p className="text-xl font-bold text-slate-900 tabular-nums">{faculties.meta?.total || 0}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full xl:max-w-2xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            placeholder="Cari nama fakultas atau kode otoritas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10 font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                         <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 text-emerald-500" />
                            Sync: {syncInfo.last_synced_at || 'Malam Ini'}
                        </div>
                    </div>
                </div>

                {/* Master Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">KODE UNIT</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">IDENTITAS FAKULTAS</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">KAPASITAS PRODI</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {faculties.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-100" />
                                            <p className="text-sm font-bold text-slate-400 italic">Basis data kosong atau tidak ditemukan hasil pencarian.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    faculties.data.map((faculty, idx) => (
                                        <tr key={faculty.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 font-mono text-xs font-bold text-slate-400 tracking-wider">
                                                <span className="px-2.5 py-1.5 bg-slate-100 rounded-lg group-hover:bg-white group-hover:text-emerald-600 border border-transparent group-hover:border-emerald-100 transition-all italic">
                                                    #{faculty.code}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                        {faculty.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-emerald-600 transition-colors tracking-tight">
                                                            {faculty.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">UIN SAIZU Internal Entity</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ring-1 ring-emerald-100 shadow-sm shadow-emerald-100/50">
                                                    <LayoutGrid className="w-3.5 h-3.5" />
                                                    {faculty.programs_count} Program Studi
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Badge variant="berhasil" className="italic px-3 py-1 font-bold">Terintegrasi</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {faculties.meta && (
                        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100">
                             <Pagination meta={faculties.meta} />
                        </div>
                    )}
                </div>

                {/* Tactical Footer Note */}
                <div className="flex items-center justify-center gap-3 text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em] italic opacity-50 pt-8">
                     <ArrowRight className="w-3 h-3" />
                     Sistem Manajemen Master Data • Versi Otoritas 2.4.1
                </div>
            </div>
        </AppLayout>
    );
}
