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
    CheckCircle2,
    Lock,
    ChevronRight
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
        <AppLayout title="Konfigurasi Penerbitan Sertifikat Digital">
            <Head title="Pengaturan Sertifikat | POS-KKN" />

            <div className="min-h-screen bg-white">
                {/* HEADER TACTICAL: OTORITAS TEMPLATE SERTIFIKAT */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Certificate Template Management Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none text-nowrap">
                            DESAIN <span className="text-emerald-500">SERTIFIKAT DIGITAL</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Award size={12} className="text-emerald-500" />
                             Konfigurasi visual, narasi, dan aset otoritas untuk penerbitan sertifikat KKN kolektif.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">AUDIT READY</span>
                               <div className="flex items-center gap-3">
                                   <ScrollText size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">MASTER TEMPLATE</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-12 py-12 grid gap-12 lg:grid-cols-12 items-start italic font-black">
                    {/* CONTENT MODULE: TEXT & NARRATIVE */}
                    <motion.section 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 space-y-12"
                    >
                        <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group/section hover:border-emerald-500 transition-all">
                            <div className="px-10 py-8 border-b border-emerald-50 flex flex-col md:flex-row md:items-center justify-between bg-emerald-50/10 gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-emerald-950 text-emerald-400 shadow-lg group-hover/section:scale-110 transition-transform">
                                        <PenTool size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-950 italic">Narasi Resmi Sertifikat</h2>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1.5">Atur teks otorisasi dan placeholder dinamis sistem.</p>
                                    </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-3 opacity-20 group-hover/section:opacity-100 transition-opacity">
                                     <span className="text-[9px] font-black text-emerald-400 italic uppercase tracking-widest">MODULE: NARRATIVE_ENGINE</span>
                                     <div className="h-px w-16 bg-emerald-100" />
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                {/* DYNAMIC PLACEHOLDERS STRIP */}
                                <div className="p-8 bg-emerald-950 shadow-2xl relative overflow-hidden group/info">
                                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-500/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
                                    <h3 className="text-[10px] font-black italic text-emerald-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4 relative z-10">
                                        <Zap className="w-4 h-4 animate-pulse" />
                                        TAG PLACEHOLDER TERPREDIKSI (SINKRON)
                                    </h3>
                                    <div className="flex flex-wrap gap-3 relative z-10">
                                        {['[StudentName]', '[NIM]', '[LOKASI]', '[PERIODE]'].map((tag) => (
                                            <span key={tag} className="px-5 py-2.5 bg-white/5 text-[11px] font-black text-white hover:text-emerald-400 hover:bg-white/10 transition-all border border-white/10 shadow-xl cursor-default tabular-nums">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-10">
                                    {configs
                                        .filter((config) => config.type !== 'gambar')
                                        .map((config) => (
                                            <div key={config.id} className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">
                                                        {config.label}
                                                    </label>
                                                    <span className="text-[9px] font-black text-emerald-200 italic tracking-widest">ID: {config.config_key.toUpperCase()}</span>
                                                </div>
                                                
                                                {config.type === 'longtext' ? (
                                                    <textarea
                                                        rows={10}
                                                        value={getValue(config.id)}
                                                        onChange={(event) => updateValue(config.id, event.target.value)}
                                                        className="w-full bg-emerald-50/10 border border-emerald-50 px-8 py-6 text-[13px] font-black italic tracking-tight text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase shadow-inner leading-relaxed min-h-[240px]"
                                                        placeholder="INPUT NARASI RESMI SERTIFIKAT..."
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={getValue(config.id)}
                                                        onChange={(event) => updateValue(config.id, event.target.value)}
                                                        className="w-full h-16 bg-emerald-50/10 border border-emerald-50 px-8 text-[12px] font-black italic tracking-tight text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase shadow-inner"
                                                        placeholder="INPUT TEKS SATU BARIS..."
                                                    />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* SIDEBAR MODULE: VISUAL ASSETS & SAVE */}
                    <motion.section 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 space-y-12"
                    >
                        <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group/visual hover:border-emerald-500 transition-all">
                            <div className="px-10 py-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-950 text-emerald-400 shadow-lg">
                                        <Palette size={20} />
                                    </div>
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-emerald-950">Aset Visual Terminal</h2>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10 bg-white">
                                {configs
                                    .filter((config) => config.type === 'gambar')
                                    .map((config) => (
                                        <div key={config.id} className="space-y-4">
                                            <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] block">
                                                {config.label}
                                            </label>
                                            <div className="relative group/field">
                                                <ImageIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-100 group-focus-within/field:text-emerald-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={getValue(config.id)}
                                                    onChange={(event) => updateValue(config.id, event.target.value)}
                                                    placeholder="URL IMAGE (https://...)"
                                                    className="w-full h-16 pl-16 pr-6 bg-emerald-50/10 border border-emerald-50 text-[11px] font-black italic tracking-tight focus:bg-white focus:border-emerald-500 transition-all outline-none shadow-inner text-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                
                                <div className="p-6 bg-emerald-50/50 border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center gap-4 group-hover/visual:border-emerald-200 transition-colors">
                                    <ImageIcon size={32} className="text-emerald-100" />
                                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest leading-loose">PREVIEW VISUAL TIDAK TERSEDIA PADA TERMINAL INI. PASTIKAN URL ASET VALID.</p>
                                </div>
                            </div>
                        </div>

                        {/* OPERATIONAL GUARD FOOTER */}
                        <div className="bg-emerald-950 p-10 text-white shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                           <div className="relative z-10 space-y-10">
                                 <div className="flex items-center gap-6">
                                    <div className="p-4 bg-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.2)] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                        <ShieldCheck size={32} className="text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white italic tracking-[0.4em] uppercase leading-none mb-2">SIMPAN TEMPLATE</h4>
                                        <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest italic leading-relaxed">Sistem akan segera memperbarui template sertifikat untuk seluruh antrean penerbitan aktif.</p>
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full h-20 bg-white text-emerald-950 text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-600 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 group disabled:opacity-50"
                                >
                                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                    {form.processing ? 'MENYIMPAN...' : 'SIMPAN TEMPLATE'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-6 gap-6 relative group italic">
                             <div className="flex items-center gap-4 opacity-20">
                                <ShieldCheck size={18} className="text-emerald-200" />
                                <div className="h-px w-16 bg-emerald-50" />
                                <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.4em] uppercase italic">VERIFIED ASSET</div>
                                <div className="h-px w-16 bg-emerald-50" />
                                <Lock size={18} className="text-emerald-200" />
                             </div>
                             <p className="text-[8px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
                                 AUDIT TEMPLATE SELESAI • POS-KKN {new Date().getFullYear()}
                             </p>
                        </div>
                    </motion.section>
                </form>
            </div>
        </AppLayout>
    );
}
