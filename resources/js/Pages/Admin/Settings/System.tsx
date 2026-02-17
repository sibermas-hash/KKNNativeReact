import { useForm, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import {
    Cog6ToothIcon,
    KeyIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    CpuChipIcon,
    BoltIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Setting {
    id: number;
    config_key: string;
    label: string;
    value: string | null;
    type: string;
    group: string;
}

interface Props {
    settings: Record<string, Setting[]>;
    title: string;
}

export default function SystemSettings({ settings, title }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        settings: Object.values(settings).flat().map(s => ({
            id: s.id,
            value: s.value || ''
        }))
    });

    const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.system.update'));
    };

    const updateValue = (id: number, value: string) => {
        const newSettings = data.settings.map(s =>
            s.id === id ? { ...s, value } : s
        );
        setData('settings', newSettings);
    };

    const togglePassword = (id: number) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getIcon = (key: string) => {
        if (key.includes('url')) return <GlobeAltIcon className="w-5 h-5 shadow-glow-sm" />;
        if (key.includes('id')) return <InformationCircleIcon className="w-5 h-5" />;
        if (key.includes('secret') || key.includes('token')) return <KeyIcon className="w-5 h-5 text-accent-gold shadow-glow-sm" />;
        return <Cog6ToothIcon className="w-5 h-5" />;
    };

    return (
        <AppLayout title="Core Config Nexus">
            <Head title="System Configuration Nexus" />
            <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">

                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative text-center md:text-left">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em] font-outfit">CORE ARCHITECTURE</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Config <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Strategic management of API credentials and core scholarship parameters.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-16">
                    {Object.entries(settings).map(([group, items]) => (
                        <div key={group} className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center gap-4 border-l-4 border-accent-gold pl-6">
                                <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] italic">
                                    {group.replace('_', ' ')} <span className="text-accent-gold/50">Modules</span>
                                </h2>
                            </div>

                            <div className="glass rounded-[3.5rem] p-10 shadow-2xl border-white/5 space-y-10 backdrop-blur-xxl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white group-hover:rotate-12 transition-transform duration-1000">
                                    <CpuChipIcon className="h-48 w-48" />
                                </div>

                                {items.map((setting) => {
                                    const formItem = data.settings.find(s => s.id === setting.id);

                                    return (
                                        <div key={setting.id} className="space-y-4 group/item relative z-10">
                                            <label className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-1 group-hover/item:text-accent-gold transition-colors italic">
                                                {getIcon(setting.config_key)}
                                                {setting.label}
                                            </label>

                                            <div className="relative group/input">
                                                <input
                                                    type={setting.type === 'password' && !showPassword[setting.id] ? 'password' : 'text'}
                                                    value={formItem?.value || ''}
                                                    onChange={(e) => updateValue(setting.id, e.target.value)}
                                                    className="w-full h-16 pl-8 pr-16 rounded-2xl bg-black/40 border border-white/5 focus:bg-black/60 focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all font-mono font-black text-[13px] text-white tracking-widest shadow-2xl"
                                                    placeholder={`INGEST ${setting.label}...`}
                                                />

                                                {setting.type === 'password' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePassword(setting.id)}
                                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-accent-gold transition-all active:scale-90"
                                                    >
                                                        {showPassword[setting.id] ? (
                                                            <EyeSlashIcon className="w-6 h-6" />
                                                        ) : (
                                                            <EyeIcon className="w-6 h-6" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {errors[`settings.${data.settings.indexOf(formItem!)}.value`] && (
                                                <p className="text-[10px] font-black text-rose-500 ml-1 uppercase tracking-widest italic animate-pulse">
                                                    {errors[`settings.${data.settings.indexOf(formItem!)}.value`]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Elite Control Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-10 glass rounded-[3.5rem] shadow-2xl border-white/10 gap-8 relative overflow-hidden backdrop-blur-xxl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent" />

                        <div className="flex items-center gap-6 relative z-10">
                            <div className="p-4 bg-accent-gold/10 rounded-2xl border border-accent-gold/20 shadow-glow-sm">
                                <InformationCircleIcon className="h-8 w-8 text-accent-gold" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Security Advisory</h4>
                                <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] max-w-xs leading-relaxed italic">
                                    CONFIGURATION UPDATES IMPACT LIVE API STREAMS AND SYNCHRONIZATION ENGINES.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative h-20 px-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2.5rem] flex items-center justify-center gap-5 font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 border border-white/10 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 italic overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="h-6 w-6 animate-spin text-accent-gold" />
                                    SYNCING NEXUS...
                                </>
                            ) : (
                                <>
                                    <ShieldCheckIcon className="h-6 w-6 text-accent-gold" />
                                    AUTHORIZE CONFIG
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="flex items-center justify-center gap-4 text-white/10 opacity-50">
                    <LockClosedIcon className="h-4 w-4" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Encrypted Connection // 256-bit AES</p>
                </div>
            </div>
        </AppLayout>
    );
}
