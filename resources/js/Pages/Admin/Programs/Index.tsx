import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Badge } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { Faculty, PageProps, Program } from '@/types';
import { GraduationCap, Search, Building2, LayoutGrid, ArrowRight, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface ProgramWithFaculty extends Omit<Program, 'fakultas'> {
    faculty?: Faculty | null;
}

interface PaginationPayload<T> {
    data: T[];
    meta?: PaginationMeta;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
    links?: PaginationMeta['links'];
}

interface Props extends PageProps {
    programs: PaginationPayload<ProgramWithFaculty>;
    faculties: Faculty[];
    filters: {
        search?: string;
    };
    syncInfo: {
        mode: 'sync-only';
        source: string;
        last_synced_at?: string | null;
    };
}

function resolvePaginationMeta(payload: PaginationPayload<unknown>): PaginationMeta | null {
    if (payload.meta) return payload.meta;
    if (typeof payload.last_page === 'number' && Array.isArray(payload.links)) {
        return {
            current_page: payload.current_page ?? 1,
            last_page: payload.last_page,
            per_page: payload.per_page ?? payload.data.length,
            total: payload.total ?? payload.data.length,
            from: payload.from ?? null,
            to: payload.to ?? null,
            links: payload.links,
        };
    }
    return null;
}

export default function ProgramsIndex({ programs, filters, syncInfo }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/prodi',
                    { search: search || undefined },
                    { preserveState: true, preserveScroll: true, replace: true },
                );
            }
        }, 300);
        return () => window.clearTimeout(timer);
    }, [filters.search, search]);

    const paginationMeta = resolvePaginationMeta(programs);

    return (
        <AppLayout title="Direktori Program Studi">
            <Head title="Referensi Program Studi" />
            
            <div className="space-y-8 pb-24">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <GraduationCap className="w-8 h-8 text-emerald-600" />
                            DIREKTORI <span className="text-emerald-600">PROGRAM STUDI</span>
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
                                <p className="text-xl font-bold text-slate-900 tabular-nums">{paginationMeta?.total || 0}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full xl:max-w-2xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            placeholder="Cari program studi atau fakultas induk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10 font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                         <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 text-emerald-500" />
                            Update: {syncInfo.last_synced_at || 'Malam Ini'}
                        </div>
                    </div>
                </div>

                {/* Master Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">KODE PRODI</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">IDENTITAS AKADEMIK</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">UNIT FAKULTAS</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {programs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-slate-100" />
                                            <p className="text-sm font-bold text-slate-400 italic">Data prodi mengikuti sinkronisasi pusat.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    programs.data.map((program) => (
                                        <tr key={program.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 font-mono text-xs font-bold text-slate-400 tracking-wider">
                                                <span className="px-2.5 py-1.5 bg-slate-100 rounded-lg group-hover:bg-white group-hover:text-emerald-600 border border-transparent group-hover:border-emerald-100 transition-all italic">
                                                    #{program.code || '-'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                        <GraduationCap className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-emerald-600 transition-colors tracking-tight">
                                                            {program.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Academic Division</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="w-4 h-4 text-slate-300" />
                                                    <span className="text-xs font-bold text-slate-600 italic uppercase tracking-wider">
                                                        {program.faculty?.name || 'BELUM TERHUBUNG'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Badge variant="berhasil" className="italic px-3 py-1 font-bold">Sinkron</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paginationMeta && (
                        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100">
                             <Pagination meta={paginationMeta} />
                        </div>
                    )}
                </div>

                {/* Tactical Protocol Note */}
                <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest italic">Protocol Integrity Check</h4>
                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                    Modul ini <span className="text-emerald-500">Read-Only</span>. Konsistensi data diproteksi oleh sinkronisasi master akademik.
                                </p>
                            </div>
                        </div>
                         <ArrowRight className="w-5 h-5 text-slate-700 hidden md:block" />
                    </div>
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
