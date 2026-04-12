import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Save, 
    RefreshCw, 
    Info, 
    BarChart3, 
    CheckCircle2, 
    LayoutGrid, 
    AlertTriangle,
    Sliders,
    Binary,
    Activity,
    Lock,
    Cpu,
    Zap,
    Fingerprint,
    Target,
    Database,
    ShieldCheck,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';

interface GradingItem { id: number; config_key: string; label: string; percentage: number; description: string; }
interface Section { group: string; title: string; description: string; enforce_total: boolean; total: number; items: GradingItem[]; }
interface Props { sections: Section[]; programOptions: Array<{ value: string; label: string }>; filters: { kkn_type: string; }; }

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function GradingSettings({ sections, programOptions, filters }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        configs: sections.flatMap(s => s.items).map(item => ({ id: item.id, percentage: item.percentage }))
    });

    const handleTypeChange = (type: string) => {
        router.get(route('admin.konfigurasi-penilaian.index'), { kkn_type: type }, { preserveState: true, preserveScroll: true });
    };

    const updatePercentage = (id: number, value: string) => {
        const numValue = parseFloat(value) || 0;
        setData('configs', data.configs.map(c => c.id === id ? { ...c, percentage: numValue } : c));
    };

    const getGroupTotal = (group: string) => {
        const groupItems = sections.find(s => s.group === group)?.items || [];
        const itemIds = groupItems.map(i => i.id);
        return data.configs.filter(c => itemIds.includes(c.id)).reduce((sum, c) => sum + c.percentage, 0);
    };

    const isGroupValid = (group: string) => {
        const section = sections.find(s => s.group === group);
        if (!section || !section.enforce_total) return true;
        return Math.abs(getGroupTotal(group) - 100) < 0.01;
    };

    const allGroupsValid = sections.every(s => isGroupValid(s.group));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!allGroupsValid) { return; }
        post(route('admin.konfigurasi-penilaian.update'));
    };

    return (
        <AppLayout title="Grading Protocol Control">
            <Head title="Konfigurasi Bobot Nilai | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Grading Matrix Protocol</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Weighting <span>Parameters.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Kalibrasi ambang batas akademik. <br />
                            <span className="text-slate-900 not-italic">Konfigurasi variabel distribusi bobot nilai per skema KKN pada kernel evaluasi pusat.</span>
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-2xl relative overflow-hidden min-w-[320px] group">
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform">
                              <Sliders size={120} strokeWidth={1} />
                         </div>
                         <div className="space-y-4 relative z-10">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none mb-2 block italic">Protocol Target</span>
                              <div className="relative">
                                    <select 
                                        value={filters.kkn_type} 
                                        onChange={(e) => handleTypeChange(e.target.value)} 
                                        className="w-full h-16 px-8 bg-white/5 border-2 border-white/10 rounded-2xl text-[11px] font-black text-white hover:border-emerald-500 transition-all appearance-none uppercase tracking-[0.2em] outline-none cursor-pointer"
                                    >
                                        {programOptions.map(opt => <option key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 rotate-90 pointer-events-none" />
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- ANALYTICS BENTO BOARD --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <MetricCard label="System Integrity" value="VERIFIED" icon={ShieldCheck} color="emerald" desc="Grading logic authenticated" />
                    <MetricCard label="Kernel Status" value="RE-CALIBRATING" icon={Cpu} color="emerald" desc="Ready for weight injection" />
                    <MetricCard label="Lingkar Operasional" value="GLOBAL" icon={Database} color="emerald" desc="Menyinkronkan metrik lintas-sesi" />
                    <MetricCard label="Governance" value="ENFORCED" icon={Lock} color="emerald" desc="100% total calculation required" />
                </motion.div>

                {/* --- CONFIGURATION MATRIX --- */}
                <form onSubmit={handleSubmit} className="space-y-16">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {sections.map((section) => {
                            const groupTotal = getGroupTotal(section.group);
                            const isValid = isGroupValid(section.group);
                            return (
                                <motion.div 
                                    key={section.group} 
                                    variants={itemVariants}
                                    className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden group/section"
                                >
                                    <div className="px-12 py-12 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                         <div className="flex items-center gap-8">
                                              <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                                   <Binary size={28} />
                                              </div>
                                              <div className="space-y-2">
                                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Sub-Registry: {section.group}</h3>
                                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{section.title}</p>
                                              </div>
                                         </div>
                                         
                                         <div className="flex flex-col items-end gap-3">
                                              <div className="flex items-center gap-4">
                                                   <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                                       <motion.div 
                                                          initial={{ width: 0 }}
                                                          animate={{ width: `${Math.min(100, groupTotal)}%` }}
                                                          className={clsx("h-full transition-all duration-1000", isValid ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} 
                                                       />
                                                   </div>
                                                   <span className={clsx("text-2xl font-black tabular-nums font-mono italic", isValid ? "text-emerald-500" : "text-rose-500")}>
                                                       {groupTotal}%
                                                   </span>
                                              </div>
                                              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">Sync Target: 100%</p>
                                         </div>
                                    </div>

                                    <div className="p-4">
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-slate-50">
                                                {section.items
                                                    .filter(item => item.config_key !== 'weight_admin_workshop')
                                                    .map((item) => (
                                                        <tr key={item.id} className="group hover:bg-emerald-50/20 transition-all duration-300">
                                                            <td className="px-10 py-10">
                                                                <div className="flex items-start gap-8">
                                                                     <div className="w-12 h-12 rounded-[1rem] bg-slate-50 border border-slate-100 text-slate-200 flex items-center justify-center font-black text-[9px] group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-800 transition-all shadow-sm italic leading-none shrink-0">
                                                                        VAL
                                                                     </div>
                                                                     <div className="space-y-2">
                                                                        <span className="text-xl font-black text-slate-900 italic tracking-tighter group-hover:text-emerald-700 transition-colors leading-none uppercase">{item.label}</span>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight opacity-80 max-w-sm italic">{item.description}</p>
                                                                     </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-10 w-48">
                                                                <div className="relative group/input">
                                                                    <input 
                                                                        type="number" 
                                                                        step="0.01" 
                                                                        value={data.configs.find(c => c.id === item.id)?.percentage || 0} 
                                                                        onChange={e => updatePercentage(item.id, e.target.value)} 
                                                                        className="w-full h-18 border-none bg-slate-50 rounded-[1.5rem] px-10 text-center font-black text-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all tabular-nums text-slate-900 italic group-hover/section:bg-white border-2 border-transparent group-focus-within/input:border-emerald-500/20"
                                                                    />
                                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 pointer-events-none">%</div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* --- DEPLOYMENT CONTROL BAR --- */}
                    <motion.div 
                        variants={itemVariants}
                        className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-12 flex flex-col md:flex-row items-center justify-between gap-12 sticky bottom-10 z-50 backdrop-blur-3xl bg-white/95 border-emerald-500/20"
                    >
                        <div className="flex items-center gap-10">
                            <div className={clsx(
                                "h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl",
                                allGroupsValid ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-rose-500 text-white shadow-rose-500/30 animate-pulse"
                            )}>
                                {allGroupsValid ? <ShieldCheck size={36} strokeWidth={2.5} /> : <AlertTriangle size={36} strokeWidth={2.5} />}
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <h4 className={clsx("text-2xl font-black uppercase tracking-tighter italic", allGroupsValid ? "text-emerald-900" : "text-rose-900")}>
                                    {allGroupsValid ? 'Operational Status: Nominal' : 'Configuration Conflict Detected'}
                                </h4>
                                <div className="flex items-center gap-3">
                                     <Fingerprint size={12} className="text-slate-300" />
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none italic">
                                         Validation hash successful for target skema <span className="text-emerald-600 font-black">{filters.kkn_type}</span>
                                     </p>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={processing || !allGroupsValid} 
                            className="bg-slate-900 text-white hover:bg-emerald-600 px-16 h-20 rounded-[2.5rem] font-black text-[11px] transition-all shadow-2xl shadow-slate-950/20 flex items-center gap-6 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed group duration-500 uppercase tracking-[0.3em]"
                        >
                            <AnimatePresence mode="wait">
                                {processing ? (
                                    <motion.div key="loading" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={24} /></motion.div>
                                ) : recentlySuccessful ? (
                                    <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={24} /></motion.div>
                                ) : (
                                    <motion.div key="default"><Zap size={24} strokeWidth={3} className="group-hover:animate-pulse" /></motion.div>
                                )}
                            </AnimatePresence>
                            {recentlySuccessful ? 'PARAMETERS_SECURED' : 'DEPLOY_PARAMETERS'}
                        </Button>
                    </motion.div>
                </form>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <Target size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Sliders className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Grading Integrity</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Weighting Logic</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Konfigurasi bobot nilai adalah instruksi logika dasar bagi DPL dan sistem. Setiap perubahan parameter akan berdampak langsung pada kalkulasi IPK KKN ribuan mahasiswa secara simultan.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Evaluation Stream Active</span>
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
