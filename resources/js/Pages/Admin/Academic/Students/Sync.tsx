import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';
import {
    RefreshCw,
    Users,
    Database,
    Link2,
    Clock3,
    Info,
    ListFilter,
    ArrowRight,
    Zap,
    Cpu,
    Fingerprint,
    Target,
    Layers,
    Globe,
    ShieldCheck,
    Battery,
    Server,
    Activity,
    ChevronRight,
    Lock
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Props extends PageProps {
    title: string;
    summary: {
        local_students: number;
        with_master_link: number;
        last_synced_at: string | null;
    };
}

function formatSyncTime(value: string | null): string {
    if (!value) return 'NEVER_SYNCED';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date).toUpperCase();
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function StudentSync({ title, summary }: Props) {
    const bulkForm = useForm({});
    const targetedForm = useForm({ nim_list: '' });

    function submitBulk() {
        bulkForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
    }

    function submitTargeted(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        targetedForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
    }

    return (
        <AppLayout title="Data Synchronization Terminal">
            <Head title={title} />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Personnel Data Sync Terminal</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Data <span>Sinkron.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pusat penyelarasan data induk. <br />
                            <span className="text-slate-900 not-italic">Integrasi dataset mahasiswa dari kernel pusat kampus ke database operasional KKN secara real-time.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                         <div className="h-24 px-10 bg-slate-900 rounded-[2.5rem] flex items-center gap-10 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                   <Server size={80} strokeWidth={1} />
                              </div>
                              <div className="flex flex-col justify-center border-r border-white/10 pr-10">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-2">Sync Status</span>
                                   <div className="flex items-baseline gap-3">
                                        <span className="text-xs font-black text-emerald-400 tracking-widest uppercase italic">ACTIVE_LINK</span>
                                   </div>
                              </div>
                              <div className="flex flex-col justify-center">
                                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-2 italic">Last Protocol</span>
                                   <span className="text-[11px] font-black text-white uppercase tracking-widest">{formatSyncTime(summary.last_synced_at)}</span>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Local Load" value={summary.local_students.toLocaleString()} icon={Users} color="emerald" desc="Total personnel record in vault" />
                    <MetricCard label="Master Integrity" value={summary.with_master_link.toLocaleString()} icon={Link2} color="emerald" desc="Linked identification headers" />
                    <MetricCard label="System Coverage" value="GLOBAL" icon={ShieldCheck} color="emerald" desc="Inter-institutional sync active" />
                </motion.div>

                {/* --- SYNC CONTROL GRID --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-stretch">
                    {/* Bulk Processor */}
                    <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col group/bulk">
                        <div className="px-12 py-12 bg-slate-950 flex items-center justify-between">
                             <div className="flex items-center gap-8">
                                  <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                       <Database size={28} />
                                  </div>
                                  <div className="space-y-1">
                                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Hardware Loop</h3>
                                       <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Massive Sync Protocol</p>
                                  </div>
                             </div>
                             <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-2xl group-hover/bulk:rotate-12 transition-transform">
                                  <Activity size={20} />
                             </div>
                        </div>
                        
                        <div className="p-12 space-y-12 flex-1 flex flex-col">
                            <div className="bg-emerald-50 border-2 border-emerald-100/50 rounded-[2.5rem] p-10 space-y-8 flex-1">
                                <div className="space-y-4">
                                     <div className="flex items-center gap-4 text-emerald-600">
                                          <Zap size={18} />
                                          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Recommended for Init</span>
                                     </div>
                                     <p className="text-base font-bold text-emerald-900 leading-relaxed uppercase tracking-tight italic opacity-80">
                                         Proses ini akan memindai seluruh direktori mahasiswa di master kampus dan menyelaraskannya dengan kernel POS-KKN.
                                     </p>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Otomatis menginisialisasi kredensial akses baru',
                                        'Penyelarasan identitas (Fakultas/Prodi) dari master',
                                        'Kalibrasi IPK & SKS kumulatif untuk verifikasi syarat'
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-5 group">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full group-hover:scale-150 transition-transform" />
                                            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest italic">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                onClick={submitBulk}
                                disabled={bulkForm.processing || targetedForm.processing}
                                className="h-24 w-full bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 disabled:opacity-20"
                            >
                                <AnimatePresence mode="wait">
                                     {bulkForm.processing ? (
                                         <RefreshCw size={24} className="animate-spin" />
                                     ) : (
                                         <RefreshCw size={24} />
                                     )}
                                </AnimatePresence>
                                {bulkForm.processing ? 'SYNCHRONIZING GLOBAL_INVENTORY...' : 'INITIATE MASS SYNC'}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Targeted Processor */}
                    <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col">
                        <div className="px-12 py-12 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-8">
                                  <div className="h-16 w-16 bg-slate-900 text-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl">
                                       <ListFilter size={28} />
                                  </div>
                                  <div className="space-y-1">
                                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Diagnostic Loop</h3>
                                       <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Targeted Vector Sync</p>
                                  </div>
                             </div>
                             <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                                  <Target size={20} />
                             </div>
                        </div>

                        <form onSubmit={submitTargeted} className="p-12 space-y-10 flex-1 flex flex-col">
                            <div className="space-y-4 flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Vector ID Input (NIM_LIST)</label>
                                <div className="relative group/text">
                                     <textarea
                                        rows={8}
                                        value={targetedForm.data.nim_list}
                                        onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
                                        placeholder={'24010001\n24010002\n24010003'}
                                        className="w-full bg-slate-50 border-none rounded-[1.75rem] px-10 py-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-200 font-mono tracking-widest min-h-[280px]"
                                    />
                                    <div className="absolute top-8 right-8 text-[10px] font-black text-slate-200 pointer-events-none group-focus-within/text:text-emerald-500 opacity-20">INPUT_BUFFER</div>
                                </div>
                                {targetedForm.errors.nim_list && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mt-2 ml-4 italic">{targetedForm.errors.nim_list}</p>
                                )}
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex items-center gap-6">
                                 <Info size={20} className="text-slate-300 shrink-0" />
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                     Gunakan mode terarah untuk perbaikan data individu tanpa membebani IO server secara masif. Pisahkan NIM dengan baris baru.
                                 </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
                                className="h-24 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 disabled:opacity-20"
                            >
                                <AnimatePresence mode="wait">
                                     {targetedForm.processing ? (
                                         <RefreshCw size={24} className="animate-spin" />
                                     ) : (
                                         <ArrowRight size={24} />
                                     )}
                                </AnimatePresence>
                                {targetedForm.processing ? 'PROCESSING VECTOR_IDS...' : 'EXECUTE TARGETED SYNC'}
                            </Button>
                        </form>
                    </motion.div>
                </div>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Binary className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Registry Integrity</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Massive Dataset Synchronization</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Sinkronisasi data adalah jembatan integritas antara database KKN dan sistem informasi akademik universitas. Pastikan koneksi pipeline stabil sebelum melakukan injeksi data massal.
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
                <p className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
