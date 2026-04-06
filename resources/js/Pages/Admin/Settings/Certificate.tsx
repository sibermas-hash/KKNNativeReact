import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import { 
    Award, 
    FileText, 
    Image as ImageIcon, 
    Save, 
    Zap, 
    ShieldCheck, 
    Database, 
    Fingerprint, 
    Binary, 
    Activity, 
    Layers, 
    SearchCheck,
    ScrollText,
    Palette,
    Settings,
    PenTool,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ConfigItem {
    id: number;
    config_key: string;
    label: string;
    value: string | null;
    type: 'text' | 'longtext' | 'gambar';
}

interface Props {
    configs: ConfigItem[];
}

export default function CertificateSettings({ configs }: Props) {
    const form = useForm({
        configs: configs.map((config) => ({
            id: config.id,
            value: config.value ?? '',
        })),
    });

    const updateValue = (id: number, value: string) => {
        form.setData(
            'configs',
            form.data.configs.map((item) => (item.id === id ? { ...item, value } : item)),
        );
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/pengaturan/sertifikat');
    };

    const getValue = (id: number) => form.data.configs.find((item) => item.id === id)?.value ?? '';

    return (
        <AppLayout title="Credential Engine Config">
            <Head title="Pengaturan Sertifikat" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">CERT_ENGINE_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Award className="w-10 h-10 text-emerald-600" />
                            DESAIN <span className="text-emerald-600">SERTIFIKAT</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Konfigurasi visual, narasi, dan aset otoritas untuk penerbitan sertifikat KKN.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-emerald-600 border border-emerald-500 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1.5">Active Template</span>
                                <div className="flex items-center gap-3">
                                    <ScrollText className="w-5 h-5 text-white" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">V4_ULTRIUM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-12 items-start">
                    {/* Content Section */}
                    <motion.section 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 space-y-10"
                    >
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative group/section">
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-emerald-600 text-white rounded-[1.8rem] shadow-xl group-hover/section:scale-110 transition-transform">
                                        <PenTool className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">NARASI_SERTIFIKAT</h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">Definisikan teks otoritas dan placeholder dinamis</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 space-y-10">
                                <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 group/info">
                                    <h3 className="text-[10px] font-black italic text-emerald-900 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
                                        Placeholder_System_Active
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['[StudentName]', '[NIM]', '[LOKASI]', '[PERIODE]'].map((tag) => (
                                            <span key={tag} className="px-4 py-2 bg-white text-[10px] font-black text-emerald-600 rounded-xl border border-emerald-200 shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-8">
                                    {configs
                                        .filter((config) => config.type !== 'gambar')
                                        .map((config, idx) => (
                                            <div key={config.id} className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[10px] font-black text-slate-950 uppercase italic tracking-[0.2em]">
                                                        {config.label}
                                                    </label>
                                                    <span className="text-[9px] font-black text-slate-300 italic tracking-widest">DESC_ID: {config.config_key.toUpperCase()}</span>
                                                </div>
                                                
                                                {config.type === 'longtext' ? (
                                                    <textarea
                                                        rows={8}
                                                        value={getValue(config.id)}
                                                        onChange={(event) => updateValue(config.id, event.target.value)}
                                                        className="w-full text-sm font-bold italic text-slate-950 bg-white border border-slate-200 rounded-[1.5rem] px-8 py-6 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm leading-relaxed"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={getValue(config.id)}
                                                        onChange={(event) => updateValue(config.id, event.target.value)}
                                                        className="w-full h-18 bg-white border border-slate-200 rounded-[1.2rem] px-8 text-sm font-black italic tracking-tight text-slate-950 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Visual & Save Section */}
                    <motion.section 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 space-y-10"
                    >
                        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm relative group/visual">
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] italic text-slate-950">VISUAL_ASSETS</h2>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-8">
                                {configs
                                    .filter((config) => config.type === 'gambar')
                                    .map((config) => (
                                        <div key={config.id} className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-950 uppercase italic tracking-[0.2em] block">
                                                {config.label}
                                            </label>
                                            <div className="relative group/field">
                                                <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/field:text-emerald-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={getValue(config.id)}
                                                    onChange={(event) => updateValue(config.id, event.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full h-15 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 italic tracking-tight focus:bg-white focus:border-emerald-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Operational Guard Footer */}
                        <div className="bg-emerald-600 rounded-[3rem] border border-emerald-500 p-10 shadow-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                            <div className="relative z-10 space-y-8">
                                 <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2rem] rotate-3 group-hover:rotate-0 transition-transform">
                                        <ShieldCheck className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white italic tracking-[0.3em] uppercase leading-none">COMMIT_CONFIG</h4>
                                        <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mt-2 italic leading-relaxed">Sinkronisasi parameter visual sertifikat ke basis data publik.</p>
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full h-20 bg-white text-emerald-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] italic hover:bg-emerald-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    {form.processing ? 'SAVING_STATE...' : 'SYNC_TEMPLATE'}
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                             <div className="inline-flex items-center justify-center gap-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <Fingerprint className="w-4 h-4 text-emerald-600" />
                                 CERT_ENGINE_ALPHA • {new Date().getFullYear()}
                             </div>
                        </div>
                    </motion.section>
                </form>
            </div>
        </AppLayout>
    );
}
