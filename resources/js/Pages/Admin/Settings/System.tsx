import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import {
    Settings,
    ShieldCheck,
    Database,
    Cpu,
    Zap,
    Eye,
    EyeOff,
    Save,
    Binary,
    Fingerprint,
    Activity,
    Layers,
    SearchCheck,
    Globe,
    Server,
    Lock,
    Key,
    Cloud,
    LayoutDashboard,
    HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

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

const GROUP_TITLES: Record<string, string> = {
    master_api: 'Integrasi Master Kampus',
    general: 'Pengaturan Umum',
    ai_settings: 'Layanan AI',
    storage_settings: 'Penyimpanan Berkas',
    registration_rules: 'Aturan Operasional Mahasiswa',
    content_settings: 'Konten Publik',
};

const GROUP_ICONS: Record<string, IconType> = {
    master_api: Server,
    general: Settings,
    ai_settings: Cpu,
    storage_settings: Cloud,
    registration_rules: ShieldCheck,
    content_settings: Globe,
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
    master_api: 'Kelola koneksi dan kredensial ke sumber data kampus.',
    general: 'Atur parameter umum yang memengaruhi perilaku sistem secara global.',
    ai_settings: 'Aktifkan atau nonaktifkan fitur berbasis AI dan kredensial pendukungnya.',
    storage_settings: 'Atur lokasi penyimpanan berkas lokal maupun cloud.',
    registration_rules: 'Atur aturan pendaftaran, perpindahan kelompok, serta validasi GPS laporan harian.',
    content_settings: 'Kelola teks konten publik yang tampil di halaman depan dan profil.',
};

const SETTING_HELPERS: Record<string, string> = {
    daily_report_geo_radius_meters:
        'Mahasiswa hanya dapat mengirim laporan jika titik GPS masih berada dalam radius ini dari posko atau lokasi KKN.',
    daily_report_geo_max_accuracy_meters:
        'Semakin kecil nilainya, semakin ketat sistem menerima GPS. Nilai terlalu besar akan membuat lokasi yang tidak presisi tetap lolos.',
    registration_lock_ttl_seconds:
        'Menentukan berapa lama lock pendaftaran kelompok dipertahankan saat rebutan slot berlangsung.',
    registration_lock_wait_seconds:
        'Menentukan berapa lama mahasiswa menunggu lock rebutan kelompok sebelum sistem memberi respons gagal.',
};

export default function SystemSettings({ settings }: Props) {
    const form = useForm({
        settings: Object.values(settings)
            .flat()
            .map((setting) => ({
                id: setting.id,
                value: setting.value ?? '',
            })),
    });

    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const flattened = useMemo(() => Object.values(settings).flat(), [settings]);

    const updateValue = (id: number, value: string) => {
        form.setData(
            'settings',
            form.data.settings.map((item) => (item.id === id ? { ...item, value } : item)),
        );
    };

    const getValue = (id: number) => form.data.settings.find((item) => item.id === id)?.value ?? '';

    const getError = (id: number) => {
        const index = form.data.settings.findIndex((item) => item.id === id);
        return index >= 0 ? form.errors[`settings.${index}.value`] : undefined;
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/pengaturan/sistem');
    };

    return (
        <AppLayout title="System Configuration">
            <Head title="Pengaturan Sistem" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">SYSTEM_CONFIG_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Settings className="w-10 h-10 text-emerald-600" />
                            PENGATURAN <span className="text-emerald-600">SISTEM</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Otorisasi parameter operasional, integrasi API, dan protokol manajemen data KKN.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-emerald-600 border border-emerald-500 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1.5">Parameters Active</span>
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-white" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{flattened.length} UNITS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {Object.entries(settings).map(([group, items], groupIdx) => {
                        const GroupIcon = GROUP_ICONS[group] || Layers;
                        return (
                            <motion.section 
                                key={group}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIdx * 0.1 }}
                                className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative group/section"
                            >
                                <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 bg-emerald-600 text-white rounded-[1.8rem] shadow-xl group-hover/section:scale-110 transition-transform">
                                            <GroupIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">{GROUP_TITLES[group] ?? group.replace(/_/g, ' ')}</h2>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">{GROUP_DESCRIPTIONS[group]}</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-3 opacity-20 group-hover/section:opacity-100 transition-opacity">
                                         <span className="text-[9px] font-black text-slate-400 italic uppercase">GROUP_ID: {group.toUpperCase()}</span>
                                         <div className="h-1 w-12 bg-emerald-100 rounded-full" />
                                    </div>
                                </div>

                                <div className="grid gap-12 px-12 py-12 md:grid-cols-2">
                                    {items.map((setting) => {
                                        const isSecret = setting.type === 'password';
                                        const isLongText = setting.type === 'textarea';

                                        return (
                                            <div key={setting.id} className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label
                                                        htmlFor={`setting-${setting.id}`}
                                                        className="text-[10px] font-black text-slate-950 uppercase italic tracking-[0.2em]"
                                                    >
                                                        {setting.label}
                                                    </label>
                                                    <span className="px-3 py-1 bg-slate-50 text-[8px] font-black text-slate-400 rounded-lg uppercase italic tracking-widest border border-slate-100">
                                                        {setting.config_key}
                                                    </span>
                                                </div>
                                                
                                                <div className="relative group/input">
                                                    {isLongText ? (
                                                        <textarea
                                                            id={`setting-${setting.id}`}
                                                            rows={5}
                                                            value={getValue(setting.id)}
                                                            onChange={(event) => updateValue(setting.id, event.target.value)}
                                                            className="w-full h-40 bg-white border border-slate-200 rounded-[1.5rem] px-8 py-6 text-sm font-black italic tracking-tight text-slate-950 placeholder:text-slate-200 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="flex gap-3">
                                                            <div className="relative flex-1">
                                                                <input
                                                                    id={`setting-${setting.id}`}
                                                                    type={isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'}
                                                                    value={getValue(setting.id)}
                                                                    onChange={(event) => updateValue(setting.id, event.target.value)}
                                                                    className={clsx(
                                                                        "w-full h-16 bg-white border border-slate-200 rounded-[1.2rem] px-8 text-sm font-black italic tracking-tight text-slate-950 placeholder:text-slate-200 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm",
                                                                        getError(setting.id) && "border-rose-500 focus:ring-rose-500/5 focus:border-rose-500"
                                                                    )}
                                                                />
                                                                {isSecret && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setVisiblePasswords((current) => ({
                                                                                ...current,
                                                                                [setting.id]: !current[setting.id],
                                                                            }))
                                                                        }
                                                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"
                                                                    >
                                                                        {visiblePasswords[setting.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {SETTING_HELPERS[setting.config_key] && (
                                                    <div className="flex gap-3 px-4">
                                                        <div className="w-1 h-8 bg-emerald-500/20 rounded-full" />
                                                        <p className="text-[10px] font-bold text-slate-400 italic uppercase leading-relaxed tracking-wider">
                                                            {SETTING_HELPERS[setting.config_key]}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {getError(setting.id) && (
                                                    <motion.p 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="text-[9px] font-black text-rose-600 uppercase tracking-widest italic ml-4"
                                                    >
                                                        CRITICAL_ERROR: {getError(setting.id)}
                                                    </motion.p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )
                    })}

                    {/* Operational Guard Footer */}
                    <div className="bg-emerald-600 rounded-[4rem] border border-emerald-500 p-12 shadow-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                            <div className="space-y-6 flex-1">
                                 <div className="flex items-center gap-6">
                                    <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                        <Fingerprint className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase">Security_Protocol: Save_Changes</h4>
                                        <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                            Perubahan pada parameter sistem memerlukan otorisasi tingkat tinggi. Pastikan seluruh input konfigurasi telah divalidasi kebenarannya sebelum melakukan sinkronisasi permanen ke database pusat.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-20 px-12 bg-white text-emerald-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] italic hover:bg-emerald-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                            >
                                <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                {form.processing ? 'SYNCHRONIZING...' : 'COMMIT_CHANGES_TO_CORE'}
                            </button>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                         <div className="inline-flex items-center justify-center gap-5 text-slate-400 font-black text-[11px] uppercase tracking-[0.6em] italic opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                             <Binary className="w-4 h-4 text-emerald-600" />
                             CORE_SYSTEM_CONFIG_UNIT • ENCRYPTED_STATE • {new Date().getFullYear()}
                         </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
