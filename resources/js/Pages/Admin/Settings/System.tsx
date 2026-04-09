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
    HardDrive,
    ChevronRight,
    Search
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
    general: 'Pengaturan Umum Sistem',
    ai_settings: 'Layanan Kecerdasan Buatan',
    storage_settings: 'Pusat Penyimpanan Berkas',
    registration_rules: 'Regulasi Operasional Mahasiswa',
    content_settings: 'Manajemen Konten Publik',
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
    master_api: 'Konfigurasi konektivitas dan otorisasi sumber data utama universitas.',
    general: 'Parameter global yang mengontrol perilaku inti platform secara menyeluruh.',
    ai_settings: 'Manajemen integrasi model AI dan kredensial layanan pendukung.',
    storage_settings: 'Opsi penyimpanan data aset digital (Lokal / Object Storage).',
    registration_rules: 'Aturan validasi GPS, rebutan slot, dan regulasi pendaftaran.',
    content_settings: 'Modifikasi teks statis dan informasi publik pada portal utama.',
};

const SETTING_HELPERS: Record<string, string> = {
    daily_report_geo_radius_meters:
        'Radius operasional (meter) dari titik koordinat posko untuk pengiriman laporan.',
    daily_report_geo_max_accuracy_meters:
        'Tingkat presisi GPS minimum yang diterima sistem (semakin kecil semakin ketat).',
    registration_lock_ttl_seconds:
        'Durasi retensi kunci slot pendaftaran saat proses pemilihan kelompok berlangsung.',
    registration_lock_wait_seconds:
        'Waktu tunggu maksimal antrean kunci sebelum sistem memberikan respons timeout.',
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
        <AppLayout title="Pusat Konfigurasi Sistem Utama">
            <Head title="Pengaturan Sistem | POS-KKN" />

            <div className="min-h-screen bg-white">
                {/* HEADER TACTICAL: OTORITAS KONFIGURASI PUSAT */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Central Core Configuration Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none text-nowrap">
                            PENGATURAN <span className="text-emerald-500">SISTEM UTAMA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Lock size={12} className="text-emerald-500" />
                             Otorisasi parameter operasional, integrasi API, dan protokol manajemen data strategis.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">CONFIGURATION REGISTRY</span>
                               <div className="flex items-center gap-3">
                                   <Database size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums">{flattened.length} PARAMETERS</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-12 py-12 space-y-12">
                    {Object.entries(settings).map(([group, items], groupIdx) => {
                        const GroupIcon = GROUP_ICONS[group] || Layers;
                        return (
                            <motion.section 
                                key={group}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIdx * 0.05 }}
                                className="bg-white border border-emerald-100 shadow-sm overflow-hidden group/section hover:border-emerald-500 transition-all italic"
                            >
                                <div className="px-10 py-8 border-b border-emerald-50 flex flex-col md:flex-row md:items-center justify-between bg-emerald-50/10 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-emerald-950 text-emerald-400 shadow-lg group-hover/section:scale-110 transition-transform">
                                            <GroupIcon style={{ width: 24, height: 24 }} />
                                        </div>
                                        <div>
                                            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-950 italic">{GROUP_TITLES[group] ?? group.toUpperCase()}</h2>
                                            <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1.5">{GROUP_DESCRIPTIONS[group]}</p>
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-3 opacity-20 group-hover/section:opacity-100 transition-opacity">
                                         <span className="text-[9px] font-black text-emerald-400 italic uppercase tracking-widest">MODULE: {group.toUpperCase()}</span>
                                         <div className="h-px w-16 bg-emerald-100" />
                                    </div>
                                </div>

                                <div className="grid gap-12 p-12 md:grid-cols-2 bg-white">
                                    {items.map((setting) => {
                                        const isSecret = setting.type === 'password';
                                        const isLongText = setting.type === 'textarea';

                                        return (
                                            <div key={setting.id} className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label
                                                        htmlFor={`setting-${setting.id}`}
                                                        className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]"
                                                    >
                                                        {setting.label}
                                                    </label>
                                                    <span className="px-3 py-1 bg-emerald-50 text-[8px] font-black text-emerald-400 uppercase italic tracking-widest border border-emerald-100">
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
                                                            className="w-full min-h-[160px] bg-emerald-50/10 border border-emerald-50 px-8 py-6 text-[12px] font-black italic tracking-tight text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase shadow-inner"
                                                            placeholder="MASUKKAN KONFIGURASI TEKS..."
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
                                                                        "w-full h-16 bg-emerald-50/10 border border-emerald-50 px-8 text-[12px] font-black italic tracking-tight text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase shadow-inner tabular-nums",
                                                                        getError(setting.id) && "border-rose-500 focus:border-rose-500"
                                                                    )}
                                                                    placeholder="INPUT CONFIGURATION VALUE..."
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
                                                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-emerald-200 hover:text-emerald-600 transition-all"
                                                                    >
                                                                        {visiblePasswords[setting.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {SETTING_HELPERS[setting.config_key] && (
                                                    <div className="flex gap-4 px-2">
                                                        <div className="w-1 h-10 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                        <p className="text-[9px] font-bold text-emerald-300 italic uppercase leading-relaxed tracking-wider">
                                                            HELP: {SETTING_HELPERS[setting.config_key]}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {getError(setting.id) && (
                                                    <motion.p 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="text-[9px] font-black text-rose-600 uppercase tracking-widest italic ml-5"
                                                    >
                                                        AUDIT ERROR: {getError(setting.id)}
                                                    </motion.p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )
                    })}

                    {/* OPERATIONAL GUARD BANNER */}
                    <div className="bg-emerald-950 p-16 text-white shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="flex items-center gap-10 relative z-10 w-full xl:w-auto">
                            <div className="h-24 w-24 bg-emerald-600 text-white flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:rotate-12 transition-transform duration-700">
                                <Fingerprint size={48} className="animate-pulse" strokeWidth={1} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 italic">Otoritas Sinkronisasi Data</h4>
                                </div>
                                <p className="text-2xl font-black uppercase tracking-tighter italic">SIMPAN PERUBAHAN CONFIGURASI SISTEM</p>
                                <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest italic leading-relaxed max-w-xl">
                                    PERUBAHAN PADA PARAMETER SISTEM MEMERLUKAN OTORISASI TINGKAT TINGGI. PASTIKAN SELURUH INPUT TELAH DIVALIDASI SEBELUM SINKRONISASI PERMANEN KE DATABASE.
                                </p>
                            </div>
                        </div>
                        
                        <div className="relative z-10 w-full xl:w-auto">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full xl:w-auto h-20 px-16 bg-white text-emerald-950 text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-600 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 group disabled:opacity-50"
                            >
                                <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                {form.processing ? 'SINKRONISASI...' : 'SIMPAN PERUBAHAN'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-12 gap-6 relative group italic">
                         <div className="flex items-center gap-4 opacity-20">
                            <ShieldCheck size={20} className="text-emerald-200" />
                            <div className="h-px w-20 bg-emerald-50" />
                            <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.4em] uppercase italic">ENCRYPTED BRIDGE</div>
                            <div className="h-px w-20 bg-emerald-50" />
                            <Binary size={20} className="text-emerald-200" />
                         </div>
                         <p className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
                             KONFIGURASI SISTEM AMAN • POS-KKN {new Date().getFullYear()}
                         </p>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
