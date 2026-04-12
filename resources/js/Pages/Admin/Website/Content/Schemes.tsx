import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Layers3,
    Plus,
    Save,
    Trash2,
    Palette,
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
    Box
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';

interface SchemeItem {
    title: string;
    description: string;
    color: SchemeColor;
}

interface Props {
    content: {
        title: string;
        intro: string;
        items: SchemeItem[];
    };
}

const colorOptions: Array<{ value: SchemeColor; label: string; dot: string }> = [
    { value: 'emerald', label: 'Hijau (Emerald)', dot: 'bg-emerald-500' },
    { value: 'blue', label: 'Biru (Blue)', dot: 'bg-blue-500' },
    { value: 'amber', label: 'Kuning (Amber)', dot: 'bg-amber-500' },
    { value: 'slate', label: 'Abu-abu (Slate)', dot: 'bg-slate-500' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function SchemeContentPage({ content }: Props) {
    const form = useForm({
        title: content.title,
        intro: content.intro,
        schemes: content.items,
    });

    const updateScheme = <K extends keyof SchemeItem>(index: number, field: K, value: SchemeItem[K]) => {
        const nextSchemes = [...form.data.schemes];
        nextSchemes[index] = { ...nextSchemes[index], [field]: value };
        form.setData('schemes', nextSchemes);
    };

    const addScheme = () => {
        form.setData('schemes', [
            ...form.data.schemes,
            { title: '', description: '', color: 'emerald' },
        ]);
    };

    const removeScheme = (index: number) => {
        form.setData('schemes', form.data.schemes.filter((_, i) => i !== index));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/konten-publik/skema');
    };

    return (
        <AppLayout title="Programmatic Schema Configuration">
            <Head title="Kelola Skema KKN | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Programmatic Schema Configuration</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Scheme <span>Logic.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Konfigurasi skema KKN. <br />
                            <span className="text-slate-900 not-italic">Penetapan parameter visual, deskripsi teknis, dan alokasi identitas warna untuk seluruh kategori pengabdian masyarakat.</span>
                        </p>
                    </div>

                    <Button 
                        type="button"
                        onClick={addScheme}
                        disabled={form.data.schemes.length >= 8}
                        className="h-24 px-12 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500 disabled:opacity-20"
                    >
                        <Plus size={24} className="text-emerald-500 group-hover:rotate-90 transition-transform" />
                        INJECT_SCHEME_NODE
                    </Button>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <MetricCard label="Active Nodes" value={form.data.schemes.length} icon={Box} color="emerald" desc="Total active scheme configurations" />
                    <MetricCard label="Visual Identity" value="ENFORCED" icon={Palette} color="emerald" desc="Color grouping systems nominal" />
                    <MetricCard label="Data Structure" value="ARRAY_STG" icon={Binary} color="emerald" desc="Object schema integrity verified" />
                    <MetricCard label="Level Siaran" value="PUBLIK" icon={Globe} color="emerald" desc="Visibilitas antarmuka global aktif" />
                </motion.div>

                <form onSubmit={submit} className="space-y-16">
                    {/* Page Settings */}
                    <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/section">
                        <div className="px-12 py-12 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-10">
                             <div className="flex items-center gap-8">
                                  <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                       <Layers3 size={28} />
                                  </div>
                                  <div className="space-y-2">
                                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Parameter Global</h3>
                                       <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Interface Core Settings</p>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                  <ShieldCheck size={20} className="text-emerald-500" />
                                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Integrity Secure</span>
                             </div>
                        </div>
                        
                        <div className="p-12 space-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Interface_Title_Node</label>
                                <input
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    className="w-full bg-slate-50 border-none h-20 rounded-[1.5rem] px-10 text-[15px] font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all uppercase tracking-widest italic shadow-inner"
                                    placeholder="Enter Title..."
                                />
                                {form.errors.title && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors.title}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Narrative_Intro_Vector</label>
                                <textarea
                                    rows={4}
                                    value={form.data.intro}
                                    onChange={(event) => form.setData('intro', event.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[2rem] px-10 py-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed italic shadow-inner"
                                    placeholder="Enter Intro Narrative..."
                                />
                                {form.errors.intro && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors.intro}</p>}
                            </div>
                        </div>
                    </motion.div>

                    {/* Scheme Items */}
                    <AnimatePresence>
                        {form.data.schemes.map((scheme, index) => (
                            <motion.div 
                                key={`scheme-${index}`} 
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                                className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/item"
                            >
                                <div className="px-12 py-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-8">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-900 text-emerald-500 flex items-center justify-center font-black text-lg shadow-2xl italic group-hover/item:rotate-6 transition-transform">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Node Cluster #{index + 1}</h3>
                                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{scheme.title || 'NULL_IDENTIFIER'}</p>
                                        </div>
                                    </div>
                                    {form.data.schemes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeScheme(index)}
                                            className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white text-rose-400 hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-slate-100 shadow-sm"
                                        >
                                            <Trash2 size={20} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>

                                <div className="p-12 grid gap-12 lg:grid-cols-12 bg-white flex items-stretch">
                                    <div className="lg:col-span-8 space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Scheme_Identifier_Node</label>
                                            <input
                                                value={scheme.title}
                                                onChange={(event) => updateScheme(index, 'title', event.target.value)}
                                                className="w-full bg-slate-50 border-none h-18 rounded-[1.5rem] px-10 text-[14px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all italic shadow-inner"
                                                placeholder="Enter Scheme Title..."
                                            />
                                            {form.errors[`schemes.${index}.title`] && (
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors[`schemes.${index}.title`]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Technical_Description_Stream</label>
                                            <textarea
                                                rows={5}
                                                value={scheme.description}
                                                onChange={(event) => updateScheme(index, 'description', event.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-[2rem] px-10 py-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed italic shadow-inner"
                                                placeholder="Jelaskan detail skema ini..."
                                            />
                                            {form.errors[`schemes.${index}.description`] && (
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">PROTOCOL_ERROR: {form.errors[`schemes.${index}.description`]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4 space-y-10 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Visual_Proxy_Color</label>
                                            <div className="relative group/select">
                                                 <Palette size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within/select:text-emerald-500 transition-colors" />
                                                 <select
                                                    value={scheme.color}
                                                    onChange={(event) => updateScheme(index, 'color', event.target.value as SchemeColor)}
                                                    className="w-full bg-slate-50 border-none h-18 rounded-[1.5rem] pl-16 pr-10 text-[11px] font-black text-slate-900 appearance-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all italic uppercase tracking-widest shadow-inner cursor-pointer"
                                                 >
                                                    {colorOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                 </select>
                                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                      <ChevronRight size={18} strokeWidth={3} className="rotate-90" />
                                                 </div>
                                            </div>
                                        </div>

                                        <div className={clsx(
                                            "flex-1 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-6 transition-all duration-700 shadow-inner",
                                            scheme.color === 'emerald' && "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100/50",
                                            scheme.color === 'blue' && "bg-blue-50 border-blue-100 text-blue-600 shadow-blue-100/50",
                                            scheme.color === 'amber' && "bg-amber-50 border-amber-100 text-amber-600 shadow-amber-100/50",
                                            scheme.color === 'slate' && "bg-slate-100 border-slate-200 text-slate-500 shadow-slate-100/50"
                                        )}>
                                            <div className="h-20 w-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-500">
                                                 <Box size={40} strokeWidth={1} />
                                            </div>
                                            <div className="space-y-1 text-center">
                                                 <span className="text-[10px] font-black uppercase tracking-[0.4em] italic mb-1 block">Preview Mode</span>
                                                 <p className="text-[11px] font-black uppercase tracking-widest opacity-60">IDENT_COLOR: {scheme.color}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

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
                                    Commit Schema Configuration
                                </h4>
                                <div className="flex items-center gap-3">
                                     <Fingerprint size={12} className="text-slate-300" />
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none italic">
                                         Authorized protocol deployment for <span className="text-emerald-600 font-black">{form.data.schemes.length} LOGIC_NODES</span>
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
                            {form.processing ? 'MENERAPKAN_SKEMA...' : 'TERAPKAN_SKEMA'}
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
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Schema Governance</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Standar Programatik Global</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Skema KKN mendefinisikan batas-batas penelitian dan pengabdian. Perubahan pada struktur skema ini akan mempengaruhi parameter pendaftaran mahasiswa di level sistem dan narasi visual pada portal publik.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Validation Stream Nominal</span>
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
