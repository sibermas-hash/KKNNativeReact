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
    ShieldCheck,
    RefreshCw,
    Binary,
    Lock,
    FileText,
    Dna,
    Settings,
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from '@/types';

interface Props {
    content: { about: string; visi: string; misi: string; };
}

export default function ProfileContentPage({ content }: Props) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        about: content.about,
        visi: content.visi,
        misi: content.misi,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch('/admin/konten-publik/profil');
    };

    return (
    <AppLayout title="Manajemen Profil Lembaga">
      <Head title="Profil Lembaga" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <BookOpenText size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Konten Publik & Identitas</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Profil <span className="text-emerald-500">Lembaga.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Manajemen Narasi Institusional, Visi, dan Misi Strategis LPPM UIN SAIZU
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Dna size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Identitas</span>
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">UIN SAIZU LPPM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ContentMetric label="Narrative State" value="VALIDATED" icon={FileText} />
                    <ContentMetric label="Vision Vector" value="STRATEGIC" icon={Target} />
                    <ContentMetric label="Mission Flow" value="NOMINAL" icon={Activity} />
                    <ContentMetric label="Sync Status" value="LOCKED" icon={ShieldCheck} />
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <PenTool size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Official Branding Repository</span>
                             </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Institute_Description_Node</label>
                                <textarea
                                    rows={8}
                                    value={data.about}
                                    onChange={(e) => setData('about', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-6 py-6 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all leading-relaxed italic"
                                    placeholder="Describe the LPPM mission..."
                                />
                                {errors.about && <p className="text-[9px] font-black text-rose-500 uppercase italic ml-1">{errors.about}</p>}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vision_Vector</label>
                                    <textarea
                                        rows={6}
                                        value={data.visi}
                                        onChange={(e) => setData('visi', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-6 py-6 text-[12px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all leading-relaxed italic"
                                        placeholder="Vision statement..."
                                    />
                                    {errors.visi && <p className="text-[9px] font-black text-rose-500 uppercase italic ml-1">{errors.visi}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mission_Node</label>
                                    <textarea
                                        rows={6}
                                        value={data.misi}
                                        onChange={(e) => setData('misi', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-6 py-6 text-[12px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all leading-relaxed italic"
                                        placeholder="Mission operational points..."
                                    />
                                    {errors.misi && <p className="text-[9px] font-black text-rose-500 uppercase italic ml-1">{errors.misi}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- DEPLOYMENT CONTROL --- */}
                    <div className="bg-emerald-600 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-100">
                        <div className="flex items-center gap-4 ml-2">
                            <div className="h-10 w-10 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md"><Save size={20} /></div>
                            <div className="space-y-0.5">
                                <h4 className="text-[12px] font-black uppercase text-white italic leading-none">Identity Persistence Mode</h4>
                                <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-[0.2em] italic">Authorized narrative injection for UIN_SAIZU_DAEMON</span>
                            </div>
                        </div>
                        <Button type="submit" disabled={processing} className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 h-10 rounded-lg font-black text-[10px] tracking-widest flex items-center gap-3 active:scale-95 disabled:opacity-20 transition-all uppercase">
                            {processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {processing ? 'DEPLOΥING_NARRAΤIVE' : 'COMMIT_NARRAΤIVE'}
                        </Button>
                    </div>
                </form>

                <div className="flex justify-center pt-8 opacity-20">
                    <div className="flex items-center gap-3 text-slate-300 font-bold text-[9px] uppercase tracking-[0.4em] italic leading-none">
                        <Zap size={12} className="text-emerald-500 animate-pulse" />
                        Governance Loop Active • Identity Control Matrix
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ContentMetric({ label, value, icon: Icon }: { label: string, value: string, icon: LucideIcon }) {
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
