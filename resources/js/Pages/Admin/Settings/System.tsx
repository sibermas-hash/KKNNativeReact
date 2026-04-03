import { useForm, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import {
    Settings,
    Key,
    Globe,
    ShieldCheck,
    Info,
    RefreshCw,
    Eye,
    EyeOff,
    Server,
    Wrench,
    Save,
} from 'lucide-react';
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

export default function SystemSettings({ settings }: Props) {
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
        if (key.includes('url')) return <Globe className="w-4 h-4" />;
        if (key.includes('id')) return <Info className="w-4 h-4" />;
        if (key.includes('secret') || key.includes('token')) return <Key className="w-4 h-4 text-primary" />;
        return <Settings className="w-4 h-4" />;
    };

    return (
        <AppLayout title="Pengaturan Sistem Global">
            <Head title="Pengaturan Sistem" />
            
            <div className="max-w-5xl mx-auto space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Settings className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                CORE_SYSTEM_GOVERNANCE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Arsitektur <span className="text-emerald-300 text-glow-emerald italic">Sistem</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Konfigurasi parameter operasional utama, orkestrasi kredensial API, dan manajemen integritas infrastruktur digital fungsional KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6 transition-all">
                                <Server className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Status Gateway</span>
                                <span className="text-xl font-black text-white uppercase  italic leading-none">Cluster_Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-12">
                    {Object.entries(settings).map(([group, items]) => (
                        <div key={group} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group/card">
                            <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white rounded-xl text-slate-400 border border-slate-100 group-hover/card:text-primary transition-all
                                        <Wrench className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase  italic">
                                        Modul {group.replace('_', ' ')}
                                    </h2>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-slate-200 group-hover/card:bg-primary transition-colors" />
                            </div>

                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {items.map((setting) => {
                                    const formItem = data.settings.find(s => s.id === setting.id);

                                    return (
                                        <div key={setting.id} className="space-y-4 group/item">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase  group-hover/item:text-primary transition-colors italic">
                                                    {getIcon(setting.config_key)}
                                                    {setting.label}
                                                </label>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase italic opacity-50  {setting.config_key}</span>
                                            </div>

                                            <div className="relative group/input">
                                                <input
                                                    type={setting.type === 'password' && !showPassword[setting.id] ? 'password' : 'text'}
                                                    value={formItem?.value || ''}
                                                    onChange={(e) => updateValue(setting.id, e.target.value)}
                                                    className="w-full h-14 pl-6 pr-12 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-xs font-bold text-slate-800  placeholder:font-medium placeholder:text-slate-300 italic
                                                    placeholder={`Masukkan nilai ${setting.label.toLowerCase()}...`}
                                                />

                                                {setting.type === 'password' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePassword(setting.id)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-all active:scale-95"
                                                    >
                                                        {showPassword[setting.id] ? (
                                                            <EyeOff className="w-4.5 h-4.5" />
                                                        ) : (
                                                            <Eye className="w-4.5 h-4.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {errors[`settings.${data.settings.indexOf(formItem!)}.value`] && (
                                                <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase  italic">{errors[`settings.${data.settings.indexOf(formItem!)}.value`]}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Operational Footer Bar */}
                    {/* 
                        Emerald Tactical Footer Monitor 
                    */}
                    <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group">
                         {/* Decorative Elements */}
                         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                         
                         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <ShieldCheck className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">SECURITY_GOVERNANCE_PROTOCOL_V3</h4>
                                        <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: SYSTEM_INTEGRITY_VERIFIED</p>
                                    </div>
                                </div>
                                <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-2xl italic opacity-80">
                                    Pesan Keamanan: Setiap perubahan pada parameter global akan berdampak langsung pada siklus operasional KKN. 
                                    Pastikan orkestrasi data telah divalidasi melalui prosedur audit internal sebelum melakukan penyimpanan permanen.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="group h-18 px-14 bg-white text-primary rounded-[1.25rem] flex items-center justify-center gap-6 font-black text-[13px] uppercase  hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 italic shrink-0"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="h-5.5 w-5.5 animate-spin" />
                                        COMMITTING_CHANGES...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5.5 w-5.5 group-hover:scale-110 transition-transform" />
                                        EKSEKUSI_PEMBARUAN
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="text-center pt-8">
                    <p className="text-[9px] font-bold text-slate-300 uppercase  italic opacity-30">
                        Pusat Kendali Sistem Global • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
