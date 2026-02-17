import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, Badge } from '@/Components/ui';
import {
    CloudArrowUpIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    AdjustmentsHorizontalIcon,
    CheckCircleIcon,
    SparklesIcon,
    CpuChipIcon,
    ShieldCheckIcon,
    BoltIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
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
        <AppLayout title="Credential Engine Nexus">
            <Head title="Academic Credential Engine" />
            <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">

                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em] font-outfit">GENETIC CREDENTIALS</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Credential <span className="text-accent-gold text-glow-gold">Engine</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrating the precision narrative and aesthetic parameters of academic certification.</p>
                    </div>

                    {recentlySuccessful && (
                        <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 px-6 py-4 rounded-[1.5rem] border border-emerald-500/20 shadow-glow-sm animate-in zoom-in-95 duration-500">
                            <CheckCircleIcon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">PARAMETERS SYNCED</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Calibration Area */}
                    <div className="lg:col-span-2 space-y-10">
                        <section className="glass rounded-[3.5rem] p-12 shadow-2xl border-white/5 relative overflow-hidden backdrop-blur-xxl">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                                <DocumentTextIcon className="h-48 w-48 rotate-12" />
                            </div>

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                                    <div className="p-4 bg-primary/10 text-primary-light rounded-2xl border border-primary/20 shadow-xl">
                                        <SparklesIcon className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Narrative Matrix</h3>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Semantic Configuration Protocols</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {configs.filter(c => c.type !== 'image').map((config) => (
                                        <div key={config.id} className="space-y-4 group/item">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1 group-hover/item:text-accent-gold transition-colors italic">
                                                {config.label}
                                            </label>
                                            {config.type === 'longtext' ? (
                                                <div className="relative group/input">
                                                    <textarea
                                                        className="w-full min-h-[220px] rounded-[2.5rem] bg-black/40 border border-white/5 focus:bg-black/60 focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all p-8 text-white/80 leading-relaxed font-black text-[11px] tracking-widest outline-none custom-scrollbar"
                                                        value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                        onChange={e => handleValueChange(config.id, e.target.value)}
                                                        placeholder={`INGEST ${config.label.toUpperCase()} PROTOCOL...`}
                                                    />
                                                    <div className="absolute top-6 right-6">
                                                        <Badge variant="default" className="bg-white/5 border-white/10 text-[9px] uppercase font-black tracking-widest italic py-1.5 px-4 rounded-xl">HTML-SUPPORTED</Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    className="w-full h-16 rounded-2xl bg-black/40 border border-white/5 focus:bg-black/60 focus:border-accent-gold/50 transition-all px-8 font-black text-white/80 text-[11px] tracking-widest outline-none shadow-xl"
                                                    value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                    onChange={e => handleValueChange(config.id, e.target.value)}
                                                    placeholder={`INGEST ${config.label.toUpperCase()} DATA...`}
                                                />
                                            )}
                                            {config.config_key === 'cert_body' && (
                                                <div className="flex flex-wrap gap-3 mt-4 px-2">
                                                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">Variables:</span>
                                                    {['[StudentName]', '[NIM]', '[LOKASI]', '[PERIODE]'].map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[9px] font-black rounded-lg cursor-default hover:bg-accent-gold hover:text-black transition-colors">{tag}</span>
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
                        {/* Visual Mapping Card */}
                        <section className="glass rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group backdrop-blur-xxl border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:rotate-[360deg] transition-transform duration-1000">
                                        <CloudArrowUpIcon className="h-6 w-6 text-primary-light" />
                                    </div>
                                    <h3 className="text-base font-black uppercase tracking-widest italic">Visual Mapping</h3>
                                </div>

                                {configs.filter(c => c.type === 'image').map((config) => (
                                    <div key={config.id} className="space-y-6">
                                        <div className="aspect-[1.414/1] bg-black/60 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center group/preview cursor-pointer hover:border-accent-gold/30 transition-all shadow-inner relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/[0.02] group-hover/preview:opacity-10 transition-opacity" />
                                            <ArrowPathIcon className="w-10 h-10 text-white/5 mb-4 group-hover/preview:rotate-180 group-hover/preview:text-accent-gold transition-all duration-1000" />
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover/preview:text-white transition-colors">{config.label}</p>
                                        </div>
                                        <input
                                            className="w-full bg-black/40 border border-white/5 text-white/60 placeholder-white/10 rounded-2xl h-14 px-6 text-[10px] font-black tracking-widest focus:border-primary-light/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xl"
                                            value={data.configs.find(c => c.id === config.id)?.value || ''}
                                            onChange={e => handleValueChange(config.id, e.target.value)}
                                            placeholder="RESOURCE LINK (URL)..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tactical Guidelines */}
                        <section className="glass rounded-[3.5rem] p-10 border-white/5 space-y-8 backdrop-blur-xxl">
                            <div className="p-6 bg-accent-gold/5 rounded-[2rem] border border-accent-gold/20 shadow-glow-sm">
                                <p className="text-[10px] font-black text-accent-gold uppercase mb-4 tracking-[0.3em] flex items-center gap-3 italic">
                                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                    Tactical Advice
                                </p>
                                <ul className="text-[10px] text-white/30 space-y-4 font-black uppercase tracking-[0.2em] italic leading-relaxed">
                                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1 flex-shrink-0" /> Target aspect ratio: <span className="text-white/60">A4 Landscape</span>.</li>
                                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1 flex-shrink-0" /> Narrations impact <span className="text-white/60">Legacy Reputation</span>.</li>
                                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1 flex-shrink-0" /> Live updates sync to the <span className="text-white/60">Archive Nexus</span>.</li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative w-full h-20 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2.5rem] flex items-center justify-center gap-5 font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 border border-white/10 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 italic overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {processing ? (
                                    <>
                                        <ArrowPathIcon className="h-6 w-6 animate-spin text-accent-gold" />
                                        SYNCING ENGINE...
                                    </>
                                ) : (
                                    <>
                                        <BoltIcon className="h-6 w-6 text-accent-gold shadow-glow-sm" />
                                        COMMENCE SYNC
                                    </>
                                )}
                            </button>
                        </section>

                        <div className="flex items-center justify-center gap-4 text-white/5">
                            <IdentificationIcon className="h-4 w-4" />
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] italic leading-none">UIN-SAIZU-CREDENTIAL-CORE-V4</p>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
