import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge, Badge } from '@/Components/ui';
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
    Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

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
    group?: {
        name: string;
        location?: {
            name?: string;
        } | null;
    };
}

interface Props extends PageProps {
    workPrograms: {
        data: WorkProgramData[];
    };
    sdg_distribution?: Array<{ id: number; count: number }>;
    filters: {
        status?: string;
    };
}

const SDG_COLORS = [
    '#E5243B', '#DDA63A', '#4C9F38', '#C42130', '#FF3A21',
    '#28BCE1', '#FCC30B', '#A21942', '#FD6925', '#DD1367',
    '#FD9D24', '#BF8B2E', '#497D00', '#0A97D9', '#56C02B',
    '#00689D', '#1F907D'
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
        <AppLayout title="Mission Control Ledger">
            <Head title="Arsip Program Kerja" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">MISSION_CONTROL_LEDGER_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <ClipboardList className="w-10 h-10 text-emerald-600" />
                            PROGRAM <span className="text-emerald-600">KERJA</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Audit strategis rencana kerja, evaluasi dampak misi, dan sinkronisasi laporan unit operasional.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Missions Logged</span>
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{rows.length} STRATEGIES</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="relative group w-full lg:max-w-2xl px-6 py-4 bg-white border border-slate-200 rounded-3xl flex items-center gap-6 shadow-sm focus-within:border-emerald-500 focus-within:ring-8 focus-within:ring-emerald-500/5 transition-all">
                        <Filter className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1 flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Filter_Operational_State</span>
                            <select 
                                value={filters.status ?? ''}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-black italic text-slate-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                            >
                                <option value="">ALL_MISSIONS_SEQUENTIAL</option>
                                <option value="draf">DRAFT_MODE</option>
                                <option value="submitted">SUBMITTED_OPS</option>
                                <option value="disetujui">AUTHORIZED_STATE</option>
                                <option value="revisi">REVISION_REQUIRED</option>
                                <option value="ditolak">DENIED_STATE</option>
                                <option value="completed">MISSION_COMPLETE</option>
                            </select>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <Zap className="w-5 h-5 text-slate-200" />
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] italic opacity-50">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        REAL-TIME_LEDGER_SYNC_ACTIVE
                    </div>
                </div>

                {/* SDG Strategic Distribution Grid */}
                {sdg_distribution && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                             <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                 <Globe className="w-7 h-7" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">STRATEGIC_SDG_IMPACT_METRICS</h2>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Dampak misi operasional terhadap pembangunan berkelanjutan global.</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4">
                            {sdg_distribution.map((sdg) => (
                                <div 
                                    key={sdg.id}
                                    className="flex flex-col items-center gap-3 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all group cursor-default"
                                >
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-inner"
                                        style={{ backgroundColor: SDG_COLORS[sdg.id - 1] || '#666' }}
                                    >
                                        {sdg.id}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-black text-slate-950 italic group-hover:text-emerald-600 transition-colors">{sdg.count}</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight text-center leading-tight">
                                            {SDG_NAMES[sdg.id] || `SDG_${sdg.id}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tactical Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">STRATEGY_TITLE_HASH</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL_UNIT</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">GEO_LOC_TARGET</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SUBMISSION_STAMP</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">EXECUTION_STATE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.length > 0 ? (
                                    rows.map((program, idx) => (
                                        <motion.tr 
                                            key={program.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                        >
                                            <td className="px-12 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors">{program.title}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">MISSION_ID: #{program.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all shadow-inner">
                                                        <Layers className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{program.group?.name || program.kelompok?.nama_kelompok || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-500/50" />
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase italic tracking-tight truncate max-w-[180px]">
                                                        {program.group?.location?.name ||
                                                         program.kelompok?.lokasi?.full_name ||
                                                         program.kelompok?.lokasi?.village_name ||
                                                         'LOC_UNMAPPED'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-[11px] font-black text-slate-400 tabular-nums italic">{program.submitted_at || 'NOT_SUBMITTED'}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <StatusBadge status={program.status} />
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <Binary className="w-16 h-16 text-slate-300" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">NO_MISSION_PROGRAMS_FOUND_IN_BUFFER</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Footer Stamp */}
                <div className="p-12 bg-slate-900 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-500 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                                    <ShieldCheck className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] italic">MISSION_LEDGER_SECURITY_PASS</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed">Seluruh data program kerja telah terenkripsi dan diverifikasi oleh sistem pusat. <br/>Akses modifikasi terbatas pada otorisasi administrator level tinggi.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             CORE_MISSION_PROTOCOL_V4 • {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
