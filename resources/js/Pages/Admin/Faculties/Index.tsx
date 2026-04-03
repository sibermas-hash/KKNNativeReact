import { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    School,
    Search,
    ShieldCheck,
    Database,
    Fingerprint,
    Building2,
    Zap,
    Cpu
} from 'lucide-react';

interface FacultyWithCount {
    id: number;
    code: string;
    name: string;
    programs_count: number;
}

interface Props extends PageProps {
    faculties: {
        data: FacultyWithCount[];
        links: any[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
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
                router.get('/admin/faculties', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search]);

    return (
        <AppLayout title="Arsip Sektor Fakultas">
            <Head title="Manajemen Fakultas" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <School className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                INSTITUTIONAL_FACULTY_REGISTRY_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Direktori <span className="text-emerald-300 text-glow-emerald italic">Fakultas</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Manajemen basis data fakultas dan unit orkestrasi akademik pada lingkungan universitas UIN SAIZU untuk sinkronisasi orisinalitas data.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Sektor</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{faculties.meta?.total || 0} Record</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:mx-2">
                    {/* Form Section / Info Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 sticky top-12 group overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-6 transition-transform">
                                <School className="h-64 w-64" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                    <div className="p-3.5 bg-primary rounded-lg text-white
                                        <Database className="h-6 w-6 stroke-[2.5px]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase italic  leading-[0.8]">Master_Registry</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase  mt-2 italic opacity-70">SUMBER DATA TERMALIDASI</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10
                                        <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic opacity-80">
                                            Data fakultas tetap digunakan secara operasional oleh sistem KKN, namun sumber kebenarannya mengikuti sinkronisasi absolut dari basis data master universitas.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 group/card hover:bg-white hover:border-primary/20 transition-all">
                                            <span className="block text-[9px] font-black uppercase  text-slate-400 mb-2 italic">Source_Gateway_ID</span>
                                            <span className="block text-[15px] font-black text-slate-900 uppercase  italic leading-none">{syncInfo.source}</span>
                                        </div>

                                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 group/card hover:bg-white hover:border-primary/20 transition-all">
                                            <span className="block text-[9px] font-black uppercase  text-slate-400 mb-2 italic">Last_Sync_Timestamp</span>
                                            <span className="block text-[15px] font-black text-slate-900 uppercase  italic leading-none">{syncInfo.last_synced_at || 'PENDING_INITIAL_SYNC'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-5 pt-4">
                                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 italic">
                                            <div className="p-2 bg-white rounded-xl
                                                <Zap className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed opacity-70">
                                                Intervensi manual dinonaktifkan untuk menjaga integritas relasi antar record fakultas dan program studi.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 italic">
                                            <div className="p-2 bg-white rounded-xl
                                                <Fingerprint className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed opacity-70">
                                                Mendukung pemetaan otomatis untuk orkestrasi kelompok, monitoring pelaporan, dan audit akademik.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table Section */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="relative group max-w-2xl mx-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                            <input
                                placeholder="Cari nama atau kode identitas fakultas..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-18 pl-16 pr-8 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 outline-none focus:border-primary/50 transition-all italic uppercase placeholder:opacity-30"
                            />
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden group mx-1">
                            <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                                <table className="min-w-full divide-y divide-slate-50 italic">
                                    <thead className="bg-slate-50/50 text-slate-400">
                                        <tr>
                                            <th className="px-10 py-7 text-left text-[11px] font-black uppercase  italic">Code_ID</th>
                                            <th className="px-10 py-7 text-left text-[11px] font-black uppercase  italic">Nomenklatur_Fakultas</th>
                                            <th className="px-10 py-7 text-center text-[11px] font-black uppercase  italic">Unit_Program</th>
                                            <th className="px-10 py-7 text-right text-[11px] font-black uppercase  italic pr-14">Operasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {faculties.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-10 py-40 text-center">
                                                    <div className="flex flex-col items-center gap-10 opacity-30">
                                                        <div className="p-10 bg-slate-50 rounded-full border border-slate-100
                                                             <Building2 className="h-20 w-20 text-slate-200" />
                                                        </div>
                                                        <p className="text-[12px] font-black uppercase  text-slate-400 italic">SYSTEM_INFO: NO_FACULTY_RECORDS_DETECTED</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            faculties.data.map((f) => (
                                                <tr key={f.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                                    <td className="px-10 py-9">
                                                        <div className="px-5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-primary inline-flex font-black text-[12px]  italic uppercase group-hover/row:scale-110 transition-transform">
                                                            {f.code}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-9">
                                                        <span className="text-[15px] font-black text-slate-900 group-hover/row:text-primary transition-colors uppercase leading-tight italic 
                                                    </td>
                                                    <td className="px-10 py-9 text-center">
                                                        <div className="inline-flex items-baseline gap-2 px-6 py-3 bg-slate-50 rounded-lg border border-slate-100 group-hover/row:bg-white group-hover/row:border-primary/30 group-hover/row:scale-105 group-hover/row:shadow-xl group-hover/row:shadow-primary/5 transition-all">
                                                            <span className="text-xl font-black text-slate-900 italic tabular-nums leading-none">{f.programs_count}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase  italic opacity-60">PRODI_UNIT</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-9 text-right pr-14">
                                                        <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-black uppercase  text-slate-400 italic group-hover/row:bg-white transition-all">
                                                            READ_ONLY_SYNC
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {faculties.meta && (
                                <div className="px-10 py-9 bg-slate-50/30 border-t border-slate-100">
                                    <Pagination meta={faculties.meta} />
                                </div>
                            )}
                        </div>

                        {/* Tactical Emerald Footer Monitor */}
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-1">
                             {/* Decorative Elements */}
                             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                             <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                            <ShieldCheck className="h-7 w-7 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">STRUCTURAL_GOVERNANCE_PROTOCOL_V3</h4>
                                            <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: HIERARCHY_INTEGRITY_VERIFIED</p>
                                        </div>
                                    </div>
                                    <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                        Petunjuk Hirarki: Data fakultas merupakan pondasi absolut pemetaan program studi dan klasifikasi personel akademik KKN UIN SAIZU. 
                                        Sinkronisasi dilakukan secara herarkis untuk menjamin tidak adanya drift data antara <span className="text-primary font-black uppercase italic">"Academic Master"</span> dengan registry operasional KKN. 
                                        Gunakan audit log untuk memantau aktivitas sinkronisasi temporal.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                                     <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[11px] font-black text-slate-100 uppercase  italic">HIERARCHY_OK</span>
                                     </div>
                                     <div className="flex gap-5">
                                        <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                            <Cpu className="h-7 w-7" />
                                        </div>
                                        <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                            <Zap className="h-7 w-7" />
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
