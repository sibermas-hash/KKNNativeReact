import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    RefreshCw,
    FileText,
    CheckCircle2,
    ImageIcon,
    Code2,
    Save,
    Layout,
    Type,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { route } from 'ziggy-js';

interface ConfigItem {
    id: number;
    config_key: string;
    label: string;
    value: string | null;
    type: 'text' | 'longtext' | 'image';
}

interface Props {
    configs: ConfigItem[];
}

export default function CertificateSettings({ configs }: Props) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        configs: configs.map(c => ({ id: c.id, value: c.value || '' }))
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.certificate.update'));
    };

    const handleValueChange = (id: number, newValue: string) => {
        setData('configs', data.configs.map(c => c.id === id ? { ...c, value: newValue } : c));
    };

    return (
        <AppLayout title="Protokol Sertifikasi Digital">
            <Head title="Konfigurasi Sertifikat" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <FileText className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                CREDENTIAL_ENGINE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Arsitektur <span className="text-emerald-300 text-glow-emerald italic">Sertifikat</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Konfigurasi narasi akademik, tata letak visual, dan parameter otentikasi sertifikat kelulusan KKN UIN SAIZU untuk seluruh peserta.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        {recentlySuccessful && (
                            <div className="flex items-center gap-4 bg-white/20 text-white px-8 py-5.5 rounded-lg border border-white/20 zoom-in-95 italic">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400 stroke-[3px]" />
                                <span className="text-[11px] font-black uppercase  leading-none">CONFIG_SYNC_SUCCESS</span>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:mx-2">
                    {/* Main Settings Area */}
                    <div className="lg:col-span-2 space-y-10">
                        <section className="bg-white rounded-lg p-12 border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform">
                                <Layout className="h-48 w-48" />
                            </div>

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                    <div className="p-3.5 bg-primary rounded-lg text-white
                                        <Type className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic  leading-[0.8]">Narasi_Akademik</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase  mt-2 italic opacity-70">KONTEN TEKS DINAMIS SERTIFIKAT</p>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {configs.filter(c => c.type !== 'image').map((config) => (
                                        <div key={config.id} className="space-y-5 group/item">
                                            <label className="text-[11px] font-black uppercase  text-slate-400 group-hover/item:text-primary transition-colors italic ml-2 leading-none block">
                                                {config.label}
                                            </label>
                                            {config.type === 'longtext' ? (
                                                <div className="space-y-5">
                                                    <textarea
                                                        className="w-full min-h-[250px] rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary/50 transition-all p-10 text-slate-700 text-sm font-bold leading-relaxed italic outline-none
                                                        value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                        onChange={e => handleValueChange(config.id, e.target.value)}
                                                        placeholder={`Masukkan konten record untuk ${config.label.toLowerCase()}...`}
                                                    />
                                                    <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 w-fit">
                                                        <Code2 className="w-4 h-4 text-primary" />
                                                        <span className="text-[10px] font-black text-primary uppercase  italic leading-none opacity-80">SCRIPT_ENGINE: HTML_SUPPORT_ENABLED</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    className="w-full h-18 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary/50 transition-all px-8 text-slate-800 text-sm font-black italic outline-none uppercase"
                                                    value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                    onChange={e => handleValueChange(config.id, e.target.value)}
                                                    placeholder={`Masukkan ${config.label.toLowerCase()}...`}
                                                />
                                            )}
                                            {config.config_key === 'cert_body' && (
                                                <div className="flex flex-wrap gap-3 mt-4 px-2">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase  italic mr-3 pt-1.5 opacity-60">Sistem_Variabel:</span>
                                                    {['[StudentName]', '[NIM]', '[LOKASI]', '[PERIODE]'].map(tag => (
                                                        <button 
                                                            key={tag} 
                                                            type="button"
                                                            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-500 text-[11px] font-black rounded-xl group-hover/item:border-primary/40 group-hover/item:text-primary transition-all lowercase italic hover:-translate-y-1"
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Aesthetic Control Sidebar */}
                    <div className="space-y-10">
                        {/* Visual Assets Card */}
                        <section className="bg-white rounded-lg p-10 border border-slate-100 group">
                            <div className="flex items-center gap-5 border-b border-slate-50 pb-8 mb-10">
                                <div className="p-4 bg-slate-50 rounded-lg text-slate-300 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all
                                    <ImageIcon className="h-6 w-6 stroke-[2px]" />
                                </div>
                                <h3 className="text-lg font-black uppercase  italic text-slate-900 leading-none">Aset_Visual</h3>
                            </div>

                            <div className="space-y-12">
                                {configs.filter(c => c.type === 'image').map((config) => (
                                    <div key={config.id} className="space-y-5">
                                        <div className="aspect-[1.6/1] bg-slate-50 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center p-10 text-center hover:bg-emerald-50/10 hover:border-primary/20 transition-all group/preview relative overflow-hidden cursor-help">
                                            <ImageIcon className="w-12 h-12 text-slate-200 mb-5 group-hover/preview:scale-110 group-hover/preview:text-primary/30 transition-all" />
                                            <p className="text-[11px] font-black text-slate-300 uppercase  italic leading-tight group-hover/preview:text-primary transition-colors">{config.label}</p>
                                        </div>
                                        <div className="space-y-3 px-1 group/field">
                                            <span className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Endpoint_URL_Record</span>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-300 rounded-lg h-14 px-6 text-[11px] font-black  focus:bg-white focus:border-primary/50 outline-none transition-all
                                                value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                onChange={e => handleValueChange(config.id, e.target.value)}
                                                placeholder="https://storage.uinsaizu.ac.id/..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tactical Guidelines Emerald */}
                        <section className="bg-slate-900 rounded-lg p-12 border border-slate-800 space-y-12 relative overflow-hidden">
                             {/* Decorative Elements */}
                             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-white uppercase  italic leading-none">Petunjuk_Otoritas</p>
                                </div>
                                <ul className="space-y-8">
                                    <li className="flex gap-5">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                                        <p className="text-[12px] text-slate-400 font-bold leading-relaxed italic uppercase  rasio aset sertifikat <span className="text-emerald-400 font-black">A4_LANDSCAPE</span> untuk resolusi pracetak optimal.</p>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 opacity-40" />
                                        <p className="text-[12px] text-slate-400 font-bold leading-relaxed italic uppercase  akan mengeksekusi render narasi secara dinamis ke dalam <span className="text-emerald-400 font-black">FILE_PDF_Mahasiswa</span>.</p>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 opacity-40" />
                                        <p className="text-[12px] text-slate-400 font-bold leading-relaxed italic uppercase  variabel terenkapsulasi <span className="text-emerald-400 font-black">[tag]</span> dengan akurat untuk injeksi data otomatis.</p>
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative w-full h-20 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center gap-5 font-black text-xs uppercase  hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 overflow-hidden italic relative z-10"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="h-6 w-6 animate-spin" />
                                        SYNCING_CONFIG...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-6 w-6 group-hover:scale-110 group-hover:rotate-6 transition-all stroke-[2.5px]" />
                                        Implementasikan_Perubahan
                                    </>
                                )}
                            </button>
                        </section>

                        <div className="flex items-center justify-center gap-4 text-slate-300 opacity-20 pt-6">
                            <Zap className="h-5 w-5 text-emerald-500 fill-emerald-500" />
                            <p className="text-[10px] font-black uppercase  italic">Credential_Registry_System • v.3.2.0</p>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
