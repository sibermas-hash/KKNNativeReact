import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
import { 
    Plus, 
    FolderKanban, 
    Info, 
    Target, 
    Wallet, 
    ArrowRight, 
    Layers, 
    Zap,
    Briefcase
} from 'lucide-react';
import { clsx } from 'clsx';

interface WorkProgram {
    id: number;
    title: string;
    description?: string | null;
    objectives?: string | null;
    budget: number;
    status: string;
}

interface Props {
    workPrograms: WorkProgram[];
    canCreate: boolean;
}

export default function StudentWorkProgramsIndex({ workPrograms, canCreate }: Props) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 20 }
        }
    };

    return (
        <AppLayout title="Program Kerja">
            <Head title="Program Kerja" />

            <div className="mx-auto max-w-6xl space-y-12 pb-20">
                {/* --- STRATEGIC HEADER --- */}
                <motion.section 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 lg:p-16 text-white shadow-2xl shadow-slate-950/20"
                >
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-emerald-500 opacity-5 -skew-x-12 translate-x-1/2" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px]" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/20">
                                    <Briefcase size={24} strokeWidth={3} />
                                </div>
                                <div className="h-px w-12 bg-emerald-500/30" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Operation Pipeline</span>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">
                                    Program <span className="text-emerald-500">Kerja Unit.</span>
                                </h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-md opacity-80">
                                    Matriks strategi pengabdian dan pemberdayaan masyarakat oleh kelompok Anda.
                                </p>
                            </div>
                        </div>

                        {canCreate && (
                            <Link
                                href={route('student.program-kerja.create')}
                                className="h-20 px-10 rounded-[2rem] bg-emerald-500 text-slate-900 hover:bg-white transition-all flex items-center justify-center gap-4 group/btn shadow-2xl shadow-emerald-500/20 active:scale-95"
                            >
                                <Plus size={24} strokeWidth={4} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                                <span className="text-sm font-black uppercase tracking-widest">Inisiasi Program</span>
                            </Link>
                        )}
                    </div>
                </motion.section>

                {/* --- PROGRAM MATRIX --- */}
                {workPrograms.length > 0 ? (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-10 md:grid-cols-2"
                    >
                        {workPrograms.map((program) => (
                            <motion.section 
                                key={program.id} 
                                variants={cardVariants}
                                className="group relative rounded-[2.5rem] bg-white border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden"
                            >
                                {/* Active Indicator */}
                                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500 opacity-0 group-hover:opacity-[0.03] -rotate-45 translate-x-12 -translate-y-12 transition-all duration-700" />
                                
                                <div className="flex items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 mb-2">
                                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Module-PK26-{program.id}</p>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-emerald-600 transition-colors leading-none">
                                            {program.title}
                                        </h2>
                                    </div>
                                    <StatusBadge status={program.status} className="rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-2" />
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100/50 min-h-[120px] relative overflow-hidden">
                                        <Layers className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-200 opacity-20" />
                                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight relative z-10">
                                            {program.description || 'Deskripsi operasional belum dikonfigurasi untuk modul ini.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <Target size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Objektif Utama</p>
                                                <p className="text-xs font-black text-slate-900 uppercase truncate">{program.objectives || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                                            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                <Wallet size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Asset Allocation</p>
                                                <p className="text-xs font-black text-slate-900 uppercase tabular-nums">
                                                    Rp {Number(program.budget || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link 
                                        href={route('student.program-kerja.show', program.id)}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between px-8 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group/link"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">Detail & Manifes</span>
                                        <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.section>
                        ))}
                    </motion.div>
                ) : (
                    <motion.section 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[4rem] border-4 border-dashed border-slate-100 bg-white py-32 text-center group hover:bg-slate-50 transition-all duration-700"
                    >
                        <div className="mx-auto h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-10 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all duration-500">
                            <FolderKanban size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Database Entry Kosong</h3>
                        <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed opacity-60">
                            Belum ada manifes program kerja yang terdaftar dalam unit kelompok Anda.
                        </p>
                    </motion.section>
                )}

                {/* --- INTELLIGENCE FOOTER --- */}
                <div className="bg-emerald-600 rounded-[3rem] p-12 lg:p-16 relative overflow-hidden group shadow-2xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-white/10 -skew-x-12 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-2xl">
                            <Zap size={36} strokeWidth={3} className="animate-pulse" />
                        </div>
                        <div className="space-y-4 text-center md:text-left flex-1">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">Kriteria Validitas Program</h4>
                            <p className="text-[11px] font-bold text-white/70 leading-relaxed uppercase tracking-widest leading-loose max-w-2xl">
                                Setiap program wajib melewati verifikasi DPL sebelum implementasi lapangan. 
                                Pastikan alokasi aset mematuhi metodologi <span className="text-white underline underline-offset-4 decoration-2">Asset Based Community Development (ABCD)</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
