import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Layers3,
 Plus,
 Save,
 Trash2,
 Palette,
 Zap,
 Activity,
 ShieldCheck,
 RefreshCw,
 Binary,
 Target,
 Box,
 Globe,
 Settings,
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from '@/types';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';
interface SchemeItem { title: string; description: string; color: SchemeColor; }
interface Props { content: { title: string; intro: string; items: SchemeItem[]; }; }

const colorOptions: Array<{ value: SchemeColor; label: string; dot: string }> = [
 { value: 'emerald', label: 'Hijau (Emerald)', dot: 'bg-emerald-500' },
 { value: 'blue', label: 'Biru (Blue)', dot: 'bg-blue-500' },
 { value: 'amber', label: 'Kuning (Amber)', dot: 'bg-amber-500' },
 { value: 'slate', label: 'Abu-abu (Slate)', dot: 'bg-emerald-50/300' },
];

export default function SchemeContentPage({ content = { title: '', intro: '', items: [] } }: Props) {
 const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
 title: content?.title || '',
 intro: content?.intro || '',
 schemes: content?.items || [],
 });

 const updateScheme = <K extends keyof SchemeItem>(index: number, field: K, value: SchemeItem[K]) => {
 const nextSchemes = [...data.schemes];
 nextSchemes[index] = { ...nextSchemes[index], [field]: value };
 setData('schemes', nextSchemes);
 };

 const addScheme = () => setData('schemes', [...data.schemes, { title: '', description: '', color: 'emerald' }]);
 const removeScheme = (index: number) => setData('schemes', data.schemes.filter((_, i) => i !== index));
 const submit = (e: React.FormEvent) => { e.preventDefault(); patch('/admin/konten-publik/skema'); };

 return (
 <AppLayout title="Manajemen Skema KKN">
 <Head title="Skema KKN" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-black font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <Layers3 size={18} />
 <span className="text-xs font-bold tracking-[0.25em] opacity-80">Konten Publik & Operasional</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-2xl font-semibold text-black tracking-tight">
 Skema <span className="text-emerald-500">KKN.</span>
 </h1>
 <p className="text-sm font-semibold text-emerald-950 font-semibold text-xs mt-2 leading-relaxed max-w-2xl">
 Manajemen Parameter Operasional dan Klastering Skema Kuliah Kerja Nyata Terpadu
 </p>
 </div>
 <div className="flex items-center gap-4">
 <button 
 type="button" 
 onClick={addScheme} 
 disabled={data.schemes.length >= 8} 
 className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center gap-3 text-sm transition-all active:scale-95 disabled:opacity-20 tracking-wider"
 >
 <Plus size={20} className="text-white" /> TAMBAH SKEMA
 </button>
 </div>
 </div>
 </div>

 {/* --- METRIC STRIP --- */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <SchemeMetric label="Active Clusters" value={data.schemes.length} icon={Box} />
 <SchemeMetric label="Visual State" value="ENFORCED" icon={Palette} />
 <SchemeMetric label="Structure" value="ARRAY_STG" icon={Binary} />
 <SchemeMetric label="Broadcast" value="PUBLIC" icon={Globe} />
 </div>

 <form onSubmit={submit} className="space-y-4">
 {/* GLOBAL SETTINGS */}
 <section className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden shadow-sm">
 <div className="p-3 bg-emerald-50/30/20 border-b border-slate-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Layers3 size={14} className="text-emerald-500" />
 <span className="text-sm font-bold text-black font-semibold text-xs">Interface Global Parameters</span>
 </div>
 </div>
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-emerald-950 font-semibold text-xs ml-1">Interface_Title_Node</label>
 <input value={data.title} onChange={e => setData('title', e.target.value)} className="w-full h-12 bg-emerald-50/30 border border-emerald-100/60 rounded-lg px-6 text-[14px] font-bold text-black focus:bg-white focus:border-emerald-500 transition-all outline-none" required />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-emerald-950 font-semibold text-xs ml-1">Narrative_Intro_Vector</label>
 <textarea rows={3} value={data.intro} onChange={e => setData('intro', e.target.value)} className="w-full bg-emerald-50/30 border border-emerald-100/60 rounded-lg px-6 py-4 text-sm font-bold text-black focus:bg-white focus:border-emerald-500 transition-all leading-relaxed outline-none" required />
 </div>
 </div>
 </section>

 {/* SCHEME CLUSTERS */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <AnimatePresence>
 {(data.schemes || []).map((s, idx) => (
 <motion.div key={`scheme-${idx}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden shadow-sm group">
 <div className="px-4 py-3 bg-emerald-50/30/50 border-b border-slate-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">{String(idx+1).padStart(2,'0')}</div>
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs">Cluster_Node #{idx+1}</span>
 </div>
 {data.schemes.length > 1 && (
 <button type="button" onClick={() => removeScheme(idx)} className="h-7 w-7 bg-white border border-emerald-100/60 text-rose-300 hover:text-rose-600 rounded flex items-center justify-center transition-all"><Trash2 size={12} /></button>
 )}
 </div>
 <div className="p-4 space-y-4">
 <div className="space-y-1">
 <label className="text-sm font-bold text-slate-300 font-semibold text-xs ml-1">Identifier</label>
 <input value={s.title} onChange={e => updateScheme(idx, 'title', e.target.value)} className="w-full h-10 bg-emerald-50/30 border border-emerald-100/60 rounded-lg px-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all " required />
 </div>
 <div className="space-y-1">
 <label className="text-sm font-bold text-slate-300 font-semibold text-xs ml-1">Description</label>
 <textarea rows={3} value={s.description} onChange={e => updateScheme(idx, 'description', e.target.value)} className="w-full bg-emerald-50/30 border border-emerald-100/60 rounded-lg px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all" required />
 </div>
 <div className="flex items-center justify-between gap-4 pt-2">
 <div className="flex-1 space-y-1">
 <label className="text-sm font-bold text-slate-300 font-semibold text-xs ml-1">Proxy_Color</label>
 <select value={s.color} onChange={e => updateScheme(idx, 'color', e.target.value as SchemeColor)} className="w-full h-9 bg-emerald-50/30 border border-emerald-100/60 rounded-lg px-3 text-sm font-bold outline-none">
 {colorOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
 </select>
 </div>
 <div className={clsx('h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-all shrink-0', s.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : s.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' : s.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50/30 border-emerald-100/60 text-emerald-950')}>
 <Box size={24} strokeWidth={1.5} />
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* DEPLOYMENT CONTROL */}
 <div className="bg-emerald-600 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-100">
 <div className="flex items-center gap-4 ml-2">
 <div className="h-10 w-10 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md"><Save size={20} /></div>
 <div className="space-y-0.5">
 <h4 className="text-sm font-bold text-white leading-none">Scheme Commitment Protocol</h4>
 <span className="text-sm font-bold text-emerald-100 tracking-wider text-xs font-semibold">Deploying {data.schemes.length} ACTIVE_DOMAINS to public interface</span>
 </div>
 </div>
 <Button type="submit" disabled={processing} className="bg-white text-emerald-600 hover:bg-emerald-50 px-6 h-10 rounded-lg font-bold text-sm tracking-normal flex items-center gap-3 active:scale-95 disabled:opacity-20 transition-all ">
 {processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
 {processing ? 'DEPLOΥING_SCHEMA' : 'COMMIT_SCHEMA'}
 </Button>
 </div>
 </form>

 <div className="flex justify-center pt-8 opacity-20">
 <div className="flex items-center gap-3 text-slate-300 font-bold text-sm tracking-wider text-xs font-semibold leading-none">
 <Zap size={12} className="text-emerald-500 animate-pulse" />
 Validation Stream Nominal • Global Metadata Standard
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function SchemeMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
 return (
 <div className="bg-white border border-emerald-100/60 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
 <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
 <div className="flex flex-col z-10">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none mb-1">{label}</span>
 <span className="text-xl font-bold text-black tracking-tight tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
 </div>
 </div>
 );
}
