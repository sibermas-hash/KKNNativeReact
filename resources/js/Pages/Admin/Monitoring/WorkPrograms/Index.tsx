import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge, Pagination, Button } from '@/Components/ui';
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
    Clock,
    Target,
    ChevronRight,
    SearchCheck,
    Archive,
    History,
    Briefcase,
    LayoutGrid,
    Cpu,
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function AdminWorkProgramsIndex({ workPrograms, sdg_distribution, filters }: Props) {
    const handleFilterChange = (value: string) => {
        router.get(
            '/admin/laporan/program-kerja',
            { status: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout title="Strategic Impact Board">
            <Head title="Program Kerja | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Intelligence Hub / Strategic Impact Monitoring</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Tactical <span>Strategy.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Inventarisasi program kerja kelompok. <br />
                            <span className="text-slate-900 not-italic">Audit terpusat terhadap keselarasan inisiatif operasional dengan target strategis SDGs.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                         <div className="h-24 px-8 bg-slate-900 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                   <Target size={60} strokeWidth={1} />
                              </div>
                              <div className="flex flex-col justify-center">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Missions Logs</span>
                                   <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white tracking-tighter">{(workPrograms.meta?.total || 0).toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
                                   </div>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- SDG ANALYTICS MATRIX --- */}
                {sdg_distribution && (
                    <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm group">
                        <div className="px-12 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <Globe size={20} className="text-emerald-500 animate-spin-slow" />
                                <div className="space-y-0.5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Matriks Penyelarasan Global</h3>
                                    <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Distribusi Dampak Strategis (SDGs)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <LayoutGrid size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{sdg_distribution.length} Targets Tracked</span>
                            </div>
                        </div>
                        <div className="p-12 overflow-x-auto">
                            <div className="flex gap-6 min-w-max pb-4">
                                {sdg_distribution.map((sdg) => (
                                    <motion.div 
                                        key={sdg.id}
                                        whileHover={{ y: -5 }}
                                        className="h-44 w-40 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-between hover:border-emerald-200 hover:bg-white hover:shadow-2xl hover:shadow-emerald-50 transition-all cursor-default"
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-emerald-100"
                                            style={{ backgroundColor: SDG_COLORS[(sdg.id - 1) % SDG_COLORS.length] }}
                                        >
                                            {sdg.id}
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic">{sdg.count}</p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tight truncate max-w-[100px] italic">
                                                {SDG_NAMES[sdg.id]}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* --- COMMAND FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Filter className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        <select 
                            value={filters.status ?? ''}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="w-full h-16 pl-20 pr-12 bg-transparent border-none focus:ring-0 outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-[0.3em] group-hover:text-emerald-600 transition-colors"
                        >
                            <option value="">ALL MISSION STATUS</option>
                            <option value="draf">DRAFT</option>
                            <option value="submitted">UNDER REVIEW</option>
                            <option value="disetujui">VERIFIED / APPROVED</option>
                            <option value="revisi">REVISION REQUIRED</option>
                            <option value="ditolak">DENIED</option>
                            <option value="completed">MISSION COMPLETE</option>
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                </motion.div>

                {/* --- TACTICAL MISSION GRID --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-white">
                                <tr>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Matrix</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Program & Mission Identification</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-center">Operational Unit</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Deployment Zone</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-right">Audit Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {workPrograms.data.length > 0 ? (
                                    workPrograms.data.map((program, idx) => (
                                        <tr key={program.id} className="hover:bg-emerald-50/20 transition-all group">
                                            <td className="px-12 py-10">
                                                <span className="text-[10px] font-black text-slate-200 font-mono italic group-hover:text-emerald-500 transition-colors">
                                                    #{idx + 1 + (workPrograms.meta.current_page - 1) * workPrograms.meta.per_page}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-white border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm">
                                                        <ClipboardList size={22} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{program.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono italic">PROGRAM NODE: #{program.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="inline-flex h-12 items-center justify-center px-6 bg-slate-900 text-white rounded-[1.25rem] border border-white/10 group-hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">
                                                        {program.kelompok?.nama_kelompok || 'INVALID'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-black text-slate-800 uppercase italic leading-none">
                                                            {program.kelompok?.lokasi?.full_name || program.kelompok?.lokasi?.village_name || 'UNDEFINED'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none pt-1">Active Sector</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center justify-end gap-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <StatusBadge status={program.status} className="scale-110 !rounded-xl !font-black !py-2.5 !px-5 !text-[9px] !uppercase !tracking-widest" />
                                                    <Link 
                                                        href={`/admin/laporan/program-kerja/${program.id}`}
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl hover:shadow-emerald-50 transition-all"
                                                    >
                                                        <ChevronRight size={18} strokeWidth={2.5} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Archive size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Strategic Vault Empty</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO MISSION PARAMETERS REGISTERED IN DATABASE.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hal. {workPrograms.meta?.current_page || 1} / {workPrograms.meta?.last_page || 1} Misi Terarsip</span>
                        </div>
                        {workPrograms.meta && <Pagination meta={workPrograms.meta} />}
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-emerald-600 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-10 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Briefcase className="text-white" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-100">Audit Protocol</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Strategic Alignment Checklist</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-emerald-50 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Audit program kerja memastikan transparansi rencana operasional di lapangan. Setiap inisiatif harus diverifikasi untuk menjamin kualitas output akademik dan dampak sosial.
                             </p>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="px-10 py-6 bg-white text-emerald-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl">
                                  SDG Validated
                             </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
