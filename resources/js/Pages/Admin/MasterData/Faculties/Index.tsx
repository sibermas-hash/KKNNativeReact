import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Search, 
    Plus, 
    Edit2,
    Trash2,
    Database,
    Activity,
    ChevronRight,
    Building2,
    Fingerprint,
    Zap,
    ShieldCheck,
    GraduationCap,
    School,
    ArrowRight,
    Layers,
    Cpu,
    Target,
    Binary,
    Globe
} from 'lucide-react';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

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
        if (confirm('Yakin ingin menghapus fakultasi ini? Seluruh data program studi di dalamnya juga akan terhapus.')) {
            router.delete(`/admin/tahun-akademik/fakultas/${id}`);
        }
    };

    return (
        <AppLayout title="Structural Unit Inventory">
            <Head title="Direktori Fakultas | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Institutional Core Registry</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Faculty <span>Inventory.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Inventarisasi unit fakultas terpadu. <br />
                            <span className="text-slate-900 not-italic">Pemetaan struktur organisasi akademik sebagai basis pengelompokan peserta KKN lintas disiplin.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-5 shrink-0">
                         <Button
                            onClick={() => router.get('/admin/tahun-akademik/fakultas/create')}
                            className="h-20 px-10 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group"
                        >
                            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                            Register New Unit
                        </Button>
                    </div>
                </motion.div>

                {/* --- ANALYTICS BENTO BOARD --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Unit Capacity" value={`${faculties.meta.total} CORE`} icon={Building2} color="emerald" desc="Registered faculty units verified" />
                    <MetricCard label="System Coverage" value="GLOBAL" icon={Globe} color="emerald" desc="Inter-faculty synchronization active" />
                    <MetricCard label="Registry Status" value="SYNCED" icon={ShieldCheck} color="emerald" desc="Database indexing validated" />
                </motion.div>

                {/* --- COMMAND FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH UNIT NAME / FACULTY CODE / REGISTRY ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-20 pr-8 bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200 uppercase tracking-tight"
                        />
                    </div>
                </motion.div>

                {/* --- STRUCTURAL LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Layers size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Inventory stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Registered Structural Nodes</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Meta</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {faculties.meta.total}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Structural Code</th>
                                    <th className="px-12 py-8">Institutional Identification</th>
                                    <th className="px-12 py-8 text-center">Sub-Units</th>
                                    <th className="px-12 py-8 text-center">Personnel Load</th>
                                    <th className="px-12 py-8 text-right">Kernel Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {faculties.data.length > 0 ? (
                                    faculties.data.map((faculty) => (
                                        <tr key={faculty.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-12 py-10 font-mono">
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 transition-all italic">
                                                    {faculty.code || 'NULL_VECTOR'}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 text-slate-200 flex items-center justify-center font-black text-[10px] group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm italic">
                                                        #{faculty.id}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-xl font-black text-slate-900 italic tracking-tighter group-hover:text-emerald-700 transition-colors leading-none uppercase">{faculty.name}</span>
                                                        <div className="flex items-center gap-3">
                                                             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full group-hover:animate-ping" />
                                                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">Validated Component</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-2xl text-[9px] font-black tracking-[0.25em] border border-slate-100 group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-800 transition-all italic shadow-sm">
                                                    <School size={12} strokeWidth={3} />
                                                    {(faculty.programs_count || 0)} SECTORS
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors font-mono tracking-tighter italic">{(faculty.students_count || 0).toLocaleString()}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic group-hover:text-emerald-500 transition-colors">Total Op_Force</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <Link
                                                        href={`/admin/tahun-akademik/fakultas/${faculty.id}/edit`}
                                                        className="h-12 px-6 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 gap-3"
                                                        title="Edit Vector"
                                                    >
                                                        <Edit2 size={14} strokeWidth={2.5} />
                                                        Update
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(faculty.id)}
                                                        className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center active:scale-95"
                                                        title="Purge Vector"
                                                    >
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Building2 size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Infrastructure Empty</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO FACULTY VECTORS DETECTED IN STRUCTURAL DATABASE.</p>
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
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hall HAL. {faculties.meta.current_page} / {faculties.meta.last_page} Transmitted</span>
                        </div>
                        <Pagination meta={faculties.meta} />
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <GraduationCap className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Academic Hierarchy</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Structural Integrity</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Direktori fakultas merupakan pilar utama struktur data akademik. Perubahan pada segmentasi ini akan berdampak kaskade pada seluruh program studi dan validitas pendaftaran mahasiswa.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Cpu size={28} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Processing Grid Active</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-4xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
