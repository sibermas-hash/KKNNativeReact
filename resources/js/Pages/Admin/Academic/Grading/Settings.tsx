import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Save, 
    RefreshCw, 
    Info, 
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
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';
import type { LucideIcon } from '@/types';

interface GradingItem { id: number; config_key: string; label: string; percentage: number; description: string; }
interface Section { group: string; title: string; description: string; enforce_total: boolean; total: number; items: GradingItem[]; }
interface Props { sections: Section[]; programOptions: Array<{ value: string; label: string }>; filters: { kkn_type: string; }; }

export default function GradingSettings({ sections = [], programOptions = [], filters }: Props) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        configs: (sections || []).flatMap(s => s.items || []).map(item => ({ id: item.id, percentage: item.percentage }))
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
        patch(route('admin.konfigurasi-penilaian.update'));
    };

    return (
        <AppLayout title="Grading Parameters">
            <Head title="Grading Configuration | SIKKKN" />

            <div className="space-y-4 font-sans text-slate-900">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-base font-black tracking-tight uppercase italic leading-none">Grading Weight Matrix</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Logic Hub / Academic Boundary Calibration</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="relative group">
                             <Sliders size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                             <select value={filters.kkn_type} onChange={(e) => handleTypeChange(e.target.value)} className="h-10 pl-8 pr-10 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black uppercase italic outline-none focus:bg-white transition-all appearance-none cursor-pointer">
                                 {programOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
                             </select>
                             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                         </div>
                         <Button onClick={handleSubmit} disabled={processing || !allGroupsValid} className={clsx("h-10 px-6 rounded-lg flex items-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 group transition-all", allGroupsValid ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-500 text-white animate-pulse")}>
                            {processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} className="text-white" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{recentlySuccessful ? 'PARAMETERS_SECURED' : 'COMMIT_LOGIC'}</span>
                         </Button>
                    </div>
                </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <GradingMetric label="Kernel Status" value="ACTIVE_CALIB" icon={Cpu} />
                    <GradingMetric label="IOPS Status" value="LATENCY_LOW" icon={Activity} />
                    <GradingMetric label="Validation" value={allGroupsValid ? "NOMINAL" : "ERROR_DIV"} icon={ShieldCheck} />
                    <GradingMetric label="Data Integrity" value="vGRAD 4.0" icon={Fingerprint} />
                </div>

                {/* --- CONFIGURATION PANELS --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {(sections || []).map((section) => {
                        const groupTotal = getGroupTotal(section.group);
                        const isValid = isGroupValid(section.group);
                        return (
                            <section key={section.group} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="p-3 bg-emerald-600 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <Binary size={14} className="text-white" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{section.title}</span>
                                     </div>
                                     <div className="flex items-center gap-3 bg-white/10 px-3 py-1 rounded-md">
                                         <div className="h-1.5 w-16 bg-white/20 rounded-full overflow-hidden">
                                             <div className={clsx("h-full transition-all duration-700", isValid ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} style={{ width: `${Math.min(100, groupTotal)}%` }} />
                                         </div>
                                         <span className={clsx("text-[10px] font-black tabular-nums font-mono italic", isValid ? "text-emerald-500" : "text-rose-500")}>{groupTotal}%</span>
                                     </div>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-slate-50">
                                            {(section.items || []).filter(item => item.config_key !== 'weight_admin_workshop').map((item) => (
                                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[12px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors italic uppercase leading-tight font-sans">{item.label}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60 truncate max-w-[250px]">{item.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 w-40">
                                                        <div className="relative group/input">
                                                            <input type="number" step="1" value={data.configs?.find(c => c.id === item.id)?.percentage ?? 0} onChange={e => updatePercentage(item.id, e.target.value)} className="w-full h-8 bg-slate-50 border border-slate-100 rounded-lg px-8 text-center text-sm font-black italic focus:bg-white focus:border-emerald-500 outline-none transition-all tabular-nums text-slate-900" />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-200 pointer-events-none">%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><Target size={350} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md text-white"><Zap size={48} strokeWidth={1.5} /></div>
                            <div className="space-y-3">
                                <h4 className="text-2xl font-black uppercase tracking-tight leading-none italic text-white">Institutional Weighting Logic</h4>
                                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl italic opacity-80">Konfigurasi bobot nilai adalah instruksi logika dasar bagi DPL dan sistem. Setiap perubahan parameter akan berdampak langsung pada kalkulasi IPK KKN ribuan mahasiswa secara simultan. Total kalkulasi setiap segmen wajib mencapai ambang batas 100%.</p>
                            </div>
                        </div>
                        {!allGroupsValid && (
                            <div className="flex items-center gap-3 bg-white/20 border border-white/40 px-6 py-3 rounded-2xl text-white animate-pulse backdrop-blur-md">
                                <AlertTriangle size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Configuration Drift Detected</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function GradingMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
