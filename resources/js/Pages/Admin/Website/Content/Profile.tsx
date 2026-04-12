import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    BookOpenText, 
    Save, 
    PenTool,
    Zap,
    Cpu,
    Fingerprint,
    Target,
    Activity,
    Globe,
    ShieldCheck,
    RefreshCw,
    Binary,
    Lock,
    Unlock,
    ChevronRight,
    ArrowRight,
    Layout,
    Box,
    FileText,
    Dna
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    content: {
        about: string;
        visi: string;
        misi: string;
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

export default function ProfileContentPage({ content }: Props) {
    const form = useForm({
        about: content.about,
        visi: content.visi,
        misi: content.misi,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/konten-publik/profil');
    };

    return (
        <AppLayout title="Institutional Narrative Protocol">
            <Head title="Kelola Profil LPPM | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Institutional Narrative Protocol</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Identity <span>Matrix.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Konfigurasi profil institusi. <br />
                            <span className="text-slate-900 not-italic">Otorisasi narasi profil resmi, penetapan visi strategis, dan misi operasional LPPM pada portal publik.</span>
                        </p>
                    </div>

                    <div className="hidden xl:flex items-center gap-6">
                         <div className="h-24 px-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center gap-8 shadow-sm relative overflow-hidden group">
                              <Dna size={30} className="text-emerald-500" />
                              <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Brand DNA</span>
                                   <span className="text-lg font-black text-slate-900 uppercase tracking-widest italic">UIN_SAIZU_LPPM</span>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BENTO BOARD --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <MetricCard label="Narrative State" value="VALIDATED" icon={FileText} color="emerald" desc="Institutional profile verified" />
                    <MetricCard label="Vision Reach" value="STRATEGIC" icon={Target} color="emerald" desc="Long-term goal alignment" />
                    <MetricCard label="Mission Flow" value="OPERATIONAL" icon={Activity} color="emerald" desc="Actionable mission stream Nominal" />
                    <MetricCard label="Sync Level" value="SYNCHRONIZED" icon={RefreshCw} color="emerald" desc="Public interface mirrored" />
                </motion.div>

                <form onSubmit={submit} className="space-y-16">
                    <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/section">
                        {/* Section Header */}
                        <div className="px-12 py-12 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-10">
                             <div className="flex items-center gap-8">
                                  <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                       <PenTool size={28} />
                                  </div>
                                  <div className="space-y-2">
                                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Official Scripting</h3>
                                       <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Institutional Repository</p>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                  <ShieldCheck size={20} className="text-emerald-500" />
                                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Integrity Secure</span>
                             </div>
                        </div>

                        <div className="p-12 space-y-12 bg-white">
                            {/* Tentang */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Institute_Description_Node</label>
                                <textarea
                                    rows={10}
                                    value={form.data.about}
                                    onChange={(event) => form.setData('about', event.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[2rem] px-10 py-10 text-[14px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed italic shadow-inner"
                                    placeholder="Deskripsikan profil LPPM..."
                                />
                                {form.errors.about && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors.about}</p>}
                            </div>

                            <div className="grid gap-12 lg:grid-cols-2">
                                {/* Visi */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Vision_Identifier_Vector</label>
                                    <textarea
                                        rows={8}
                                        value={form.data.visi}
                                        onChange={(event) => form.setData('visi', event.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-[1.5rem] px-10 py-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed italic shadow-inner"
                                        placeholder="Visi lembaga..."
                                    />
                                    {form.errors.visi && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors.visi}</p>}
                                </div>

                                {/* Misi */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Mission_Operational_Nodes</label>
                                    <textarea
                                        rows={8}
                                        value={form.data.misi}
                                        onChange={(event) => form.setData('misi', event.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-[1.5rem] px-10 py-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed italic shadow-inner"
                                        placeholder="Misi lembaga..."
                                    />
                                    {form.errors.misi && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors.misi}</p>}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* --- DEPLOYMENT CONTROL BAR --- */}
                    <motion.div 
                        variants={itemVariants}
                        className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-12 flex flex-col md:flex-row items-center justify-between gap-12 sticky bottom-10 z-50 backdrop-blur-3xl bg-white/95 border-emerald-500/20"
                    >
                        <div className="flex items-center gap-10">
                            <div className="h-20 w-20 rounded-[2rem] bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                <Save size={36} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <h4 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-900">
                                    Commit Identity Configuration
                                </h4>
                                <div className="flex items-center gap-3">
                                     <Fingerprint size={12} className="text-slate-300" />
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none italic">
                                         Authorized programmatic injection for <span className="text-emerald-600 font-black">BP_DN_UIN_SAIZU</span>
                                     </p>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={form.processing} 
                            className="bg-slate-900 text-white hover:bg-emerald-600 px-16 h-20 rounded-[2.5rem] font-black text-[11px] transition-all shadow-2xl shadow-slate-950/20 flex items-center gap-6 active:scale-95 disabled:opacity-20 group duration-500 uppercase tracking-[0.3em]"
                        >
                            <AnimatePresence mode="wait">
                                {form.processing ? (
                                    <motion.div key="loading" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={24} /></motion.div>
                                ) : (
                                    <motion.div key="default"><Save size={24} strokeWidth={3} className="group-hover:animate-pulse" /></motion.div>
                                )}
                            </AnimatePresence>
                            {form.processing ? 'MENERAPKAN_NARASI...' : 'TERAPKAN_NARASI'}
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
                                  <Lock className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Identity Governance</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Protocol Standard</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Narasi profil adalah representasi digital lembaga. Setiap perubahan pada Identity Matrix ini akan berdampak pada branding institusional UIN Saizu di seluruh platform publik dan indexasi mesin pencari global.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Governance Loop Active</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm border border-slate-50",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none tabular-nums">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
