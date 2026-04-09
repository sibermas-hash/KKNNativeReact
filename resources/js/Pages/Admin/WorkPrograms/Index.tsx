import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge, Badge, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    ClipboardList,
    Filter,
    Search,
    Zap,
    Layers,
    MapPin,
    Calendar,
    Activity,
    ArrowRight,
    Database,
    Globe,
    Binary,
    Fingerprint,
    ShieldCheck,
    Navigation,
    LayoutDashboard,
    Clock,
    Target,
    ChevronRight,
    SearchCheck,
    Archive,
    Lock
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    kelompok?: {
        nama_kelompok?: string | null;
        lokasi?: {
            full_name?: string | null;
            village_name?: string | null;
        } | null;
    } | null;
}

interface PaginationMeta {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
}

interface Props extends PageProps {
    workPrograms: {
        data: WorkProgramData[];
        meta: PaginationMeta;
    };
    sdg_distribution?: Array<{ id: number; count: number }>;
    filters: {
        status?: string;
    };
}

const SDG_COLORS = [
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981',
    '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5', '#d1fae5',
    '#111827', '#374151'
];

const SDG_NAMES: Record<number, string> = {
    1: 'Tanpa Kemiskinan',
    2: 'Tanpa Kelaparan',
    3: 'Kehidupan Sehat',
    4: 'Pendidikan Berkualitas',
    5: 'Kesetaraan Gender',
    6: 'Air Bersih & Sanitasi',
    7: 'Energi Bersih',
    8: 'Pekerjaan Layak',
    9: 'Industri & Infrastruktur',
    10: 'Berkurangnya Kesenjangan',
    11: 'Kota Berkelanjutan',
    12: 'Konsumsi Bertanggung Jawab',
    13: 'Penanganan Perubahan Iklim',
    14: 'Ekosistem Lautan',
    15: 'Ekosistem Daratan',
    16: 'Perdamaian & Keadilan',
    17: 'Kemitraan'
};

export default function AdminWorkProgramsIndex({ workPrograms, sdg_distribution, filters }: Props) {
    const handleFilterChange = (value: string) => {
        router.get(
            '/admin/laporan/program-kerja',
            { status: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const rows = workPrograms.data ?? [];

    return (
        <AppLayout title="Otoritas Pemantauan Program Kerja">
            <Head title="Program Kerja | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL: OTORITAS PEMANTAUAN PROGRAM */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Central Work Program Audit System</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            PROGRAM <span className="text-emerald-500">KERJA KELOMPOK</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <ClipboardList size={12} className="text-emerald-500" />
                             Audit strategis rencana kerja, evaluasi dampak misi, dan sinkronisasi laporan unit operasional.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">DATA KOLEKTIF</span>
                               <div className="flex items-center gap-3">
                                   <Database size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{rows.length} PROGRAM DATA</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                     {/* TOOLBAR TACTICAL */}
                     <div className="bg-white border border-emerald-100 p-8 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all flex flex-col md:flex-row items-center gap-12">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        <div className="relative group flex-1 w-full relative z-10 flex items-center bg-emerald-50/30 border border-emerald-50 hover:border-emerald-500 transition-all shadow-inner px-8 py-5">
                            <Filter className="w-5 h-5 text-emerald-200 mr-6" />
                            <div className="flex-1 flex flex-col mt-1">
                                <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest mb-1 italic leading-none">Filter Status Audit Program</span>
                                <select 
                                    value={filters.status ?? ''}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-black italic text-emerald-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                >
                                    <option value="">SEMUA STATUS PROGRAM</option>
                                    <option value="draf">STATUS: DRAF REKAMAN</option>
                                    <option value="submitted">STATUS: DIAJUKAN / REVIEW</option>
                                    <option value="disetujui">STATUS: DISETUJUI / VALID</option>
                                    <option value="revisi">STATUS: PERLU REVISI</option>
                                    <option value="ditolak">STATUS: DITOLAK / INVALID</option>
                                    <option value="completed">STATUS: SELESAI / DATA ARSIP</option>
                                </select>
                            </div>
                            <Zap className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity relative z-10">
                            <Activity size={18} className="text-emerald-500 animate-pulse" />
                            REAL-TIME DATA SYNCHRONIZED
                        </div>
                    </div>

                    {/* SDG IMPACT ANALYTICS TACTICAL */}
                    {sdg_distribution && (
                        <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                            <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                            <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-950 text-emerald-400">
                                        <Globe size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Dampak Strategis (SDGs)</h2>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Metrik Dampak Operasional Pembangunan Berkelanjutan</p>
                                    </div>
                                </div>
                                <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                    IMPACT ANALYTICS ENGINE
                                </div>
                            </div>

                            <div className="p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-6 relative z-10">
                                {sdg_distribution.map((sdg) => (
                                    <div 
                                        key={sdg.id}
                                        className="flex flex-col items-center gap-4 p-8 bg-emerald-50/20 border border-emerald-50 hover:border-emerald-500 hover:bg-white transition-all group/item cursor-default relative overflow-hidden"
                                    >
                                        <div 
                                            className="w-12 h-12 flex items-center justify-center text-white font-black text-sm italic shadow-xl z-10 group-hover/item:scale-110 transition-transform"
                                            style={{ backgroundColor: SDG_COLORS[(sdg.id - 1) % SDG_COLORS.length] }}
                                        >
                                            {sdg.id}
                                        </div>
                                        <div className="flex flex-col items-center z-10">
                                            <span className="text-2xl font-black text-emerald-950 italic group-hover/item:text-emerald-600 transition-colors tabular-nums leading-none">{sdg.count}</span>
                                            <span className="text-[7.5px] font-black text-emerald-300 uppercase tracking-tight text-center leading-tight mt-2 max-w-[90px] group-hover/item:text-emerald-950 transition-colors">
                                                {SDG_NAMES[sdg.id] || `SDGs ${sdg.id}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Archive size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Ledger Program Kerja Kelompok</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Audit Rekaman Rencana Kerja Kolektif</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                LIVE REGISTRY FEED
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">JUDUL PROGRAM / IDENTIFIER</th>
                                        <th className="px-10 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">KELOMPOK OP.</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">LOKASI PENUGASAN</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">TIMESTAMP AJUAN</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">STATUS AUDIT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50">
                                    {rows.length > 0 ? (
                                        rows.map((program, idx) => (
                                            <tr key={program.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                                <td className="px-12 py-8">
                                                     <div className="flex flex-col gap-1.5 group-hover/row:translate-x-2 transition-transform">
                                                        <span className="text-[13px] font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">{program.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint size={10} className="text-emerald-100" />
                                                            <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest italic leading-none">PROG_ID: #{program.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center uppercase">
                                                    <div className="inline-flex h-12 flex-col items-center justify-center px-6 bg-white border border-emerald-50 text-[10px] font-black text-emerald-950 uppercase tracking-widest tabular-nums group-hover/row:border-emerald-500 transition-all shadow-sm">
                                                        <Layers size={12} className="text-emerald-300 mb-1" />
                                                        {program.kelompok?.nama_kelompok || 'INVALID'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-300 group-hover/row:bg-emerald-950 group-hover/row:text-emerald-400 group-hover/row:border-emerald-900 transition-all shadow-sm">
                                                            <Navigation size={16} />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-black text-emerald-900 uppercase italic tracking-tight uppercase leading-none truncate max-w-[200px]">
                                                                {program.kelompok?.lokasi?.full_name || program.kelompok?.lokasi?.village_name || 'UNDEFINED'}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest mt-1 uppercase leading-none italic">ASSIGNED_GEOCODE</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-center text-[10px] font-black text-emerald-950 tabular-nums uppercase">
                                                     <div className="flex flex-col items-center gap-1 group-hover/row:scale-110 transition-transform">
                                                        <Clock size={12} className="text-emerald-200" />
                                                        {program.submitted_at || 'NOT_SUBMITTED'}
                                                     </div>
                                                </td>
                                                <td className="px-12 py-8 text-right pr-12">
                                                    <div className="flex items-center justify-end group-hover/row:translate-x-2 transition-transform">
                                                        <StatusBadge status={program.status} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-12 py-56 text-center opacity-20">
                                                <div className="flex flex-col items-center gap-8">
                                                    <Binary className="h-24 w-24 text-emerald-950" strokeWidth={1} />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-emerald-950">ARSIP PROGRAM KERJA NIHIL</p>
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
                                    <SearchCheck size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Operational Program Registry Feed</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Entitas Terdeteksi: {workPrograms.meta.total} Program</p>
                                </div>
                            </div>
                            <Pagination meta={workPrograms.meta} />
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
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Integritas Audit Program</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Pemantauan program kerja memastikan keselarasan antara misi akademik universitas dengan implementasi di lapangan. 
                                            Dataset ini disinkronkan langsung dengan pangkalan data SDGs universitas untuk pelaporan dampak sosial nasional.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">PROGRAM_AUDIT_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL MISSION CONTROL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
