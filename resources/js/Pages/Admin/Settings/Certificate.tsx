import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, Badge } from '@/Components/ui';
import {
    CloudArrowUpIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    AdjustmentsHorizontalIcon,
    CheckCircleIcon
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
        <AppLayout title="Konfigurasi Sertifikat">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sertifikat Dinamis</h1>
                        <p className="text-slate-500 font-medium mt-1">Sesuaikan narasi, pejabat penandatangan, dan visual sertifikat mahasiswa.</p>
                    </div>
                    {recentlySuccessful && (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-right-4">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-bold">Perubahan Disimpan</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
                            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                                Konten & Narasi
                            </h3>

                            <div className="space-y-6">
                                {configs.filter(c => c.type !== 'image').map((config) => (
                                    <div key={config.id} className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                            {config.label}
                                        </label>
                                        {config.type === 'longtext' ? (
                                            <div className="group relative">
                                                <textarea
                                                    className="w-full min-h-[160px] rounded-3xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all p-5 text-slate-700 leading-relaxed font-medium"
                                                    value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                    onChange={e => handleValueChange(config.id, e.target.value)}
                                                    placeholder={`Masukkan ${config.label}...`}
                                                />
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Badge variant="default" className="text-[10px] uppercase font-black tracking-tighter">Support HTML</Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <FormInput
                                                className="rounded-2xl border-slate-200 h-14 px-5 font-bold text-slate-800 focus:ring-indigo-500/10 transition-all"
                                                value={data.configs.find(c => c.id === config.id)?.value || ''}
                                                onChange={e => handleValueChange(config.id, e.target.value)}
                                            />
                                        )}
                                        {config.config_key === 'cert_body' && (
                                            <p className="text-[10px] text-slate-400 font-bold ml-1 italic">
                                                Gunakan placeholder: <span className="text-indigo-500">[StudentName]</span>, <span className="text-indigo-500">[NIM]</span>, <span className="text-indigo-500">[LOKASI]</span>, <span className="text-indigo-500">[PERIODE]</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        {/* Visual Preview Card */}
                        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-lg font-black flex items-center gap-3">
                                    <CloudArrowUpIcon className="w-6 h-6 text-sky-400" />
                                    Background & Visual
                                </h3>

                                {configs.filter(c => c.type === 'image').map((config) => (
                                    <div key={config.id} className="space-y-4">
                                        <div className="aspect-[1.414/1] bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:bg-white/10 transition-all">
                                            <ArrowPathIcon className="w-8 h-8 text-slate-500 mb-2 group-hover:rotate-180 transition-transform duration-700" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{config.label}</p>
                                        </div>
                                        <FormInput
                                            className="bg-white/5 border-white/10 text-white placeholder-slate-600 rounded-2xl h-12 focus:ring-sky-500/30"
                                            value={data.configs.find(c => c.id === config.id)?.value || ''}
                                            onChange={e => handleValueChange(config.id, e.target.value)}
                                            placeholder="URL Gambar..."
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Abstract Decor */}
                            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-sky-500/10 blur-[80px]" />
                        </section>

                        {/* Tips & Actions */}
                        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                            <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest flex items-center gap-2">
                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                    Tips Konfigurasi
                                </p>
                                <ul className="text-xs text-slate-600 space-y-2 font-medium leading-relaxed">
                                    <li>• Pastikan background memiliki aspek rasio <span className="font-bold">A4 Landscape</span>.</li>
                                    <li>• Gunakan narasi yang formal dan tidak terlalu panjang.</li>
                                    <li>• Perubahan akan langsung berdampak pada sertifikat yang digenerate setelah ini.</li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                loading={processing}
                                className="w-full h-16 rounded-3xl shadow-xl shadow-indigo-500/20 text-lg font-black tracking-tight"
                            >
                                Simpan Perubahan
                            </Button>
                        </section>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
