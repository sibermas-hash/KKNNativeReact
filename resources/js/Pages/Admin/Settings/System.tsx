import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import {
    Cog6ToothIcon,
    KeyIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    ArrowPathIcon
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
        if (key.includes('url')) return <GlobeAltIcon className="w-5 h-5" />;
        if (key.includes('id')) return <InformationCircleIcon className="w-5 h-5" />;
        if (key.includes('secret') || key.includes('token')) return <KeyIcon className="w-5 h-5" />;
        return <Cog6ToothIcon className="w-5 h-5" />;
    };

    return (
        <AppLayout title={title}>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-slate-500 font-medium mt-1">Kelola kredensial API dan konfigurasi inti aplikasi.</p>
                </div>

                <form onSubmit={submit} className="space-y-12">
                    {Object.entries(settings).map(([group, items]) => (
                        <div key={group} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 bg-primary rounded-full" />
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">
                                    {group.replace('_', ' ')} Settings
                                </h2>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
                                {items.map((setting) => {
                                    const formItem = data.settings.find(s => s.id === setting.id);

                                    return (
                                        <div key={setting.id} className="space-y-3">
                                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                {getIcon(setting.config_key)}
                                                {setting.label}
                                            </label>

                                            <div className="relative group">
                                                <input
                                                    type={setting.type === 'password' && !showPassword[setting.id] ? 'password' : 'text'}
                                                    value={formItem?.value || ''}
                                                    onChange={(e) => updateValue(setting.id, e.target.value)}
                                                    className="w-full h-14 pl-6 pr-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all font-semibold text-slate-700 shadow-inner"
                                                    placeholder={`Masukkan ${setting.label}...`}
                                                />

                                                {setting.type === 'password' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePassword(setting.id)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        {showPassword[setting.id] ? (
                                                            <ShieldCheckIcon className="w-5 h-5" />
                                                        ) : (
                                                            <KeyIcon className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {errors[`settings.${data.settings.indexOf(formItem!)}.value`] && (
                                                <p className="text-xs font-bold text-red-500 ml-1">
                                                    {errors[`settings.${data.settings.indexOf(formItem!)}.value`]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between p-8 bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-4 text-white/60">
                            <InformationCircleIcon className="w-6 h-6" />
                            <p className="text-sm font-medium max-w-xs leading-tight">
                                Pengaturan ini akan langsung mempengaruhi fungsionalitas sinkronisasi data API.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            disabled={processing}
                            className="h-16 px-10 rounded-2xl flex items-center gap-3 font-black text-lg shadow-lg shadow-primary/20"
                        >
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <ShieldCheckIcon className="w-6 h-6" />
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
