import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import {
    Activity,
    Sliders,
    Beaker,
    CheckCircle2,
    Cpu,
    AlertTriangle,
    Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

interface ConfigItem {
    id: number;
    config_key: string;
    label: string;
    percentage: number;
    description: string | null;
}

interface Section {
    group: string;
    title: string;
    description: string;
    enforce_total: boolean;
    total: number;
    items: ConfigItem[];
}

interface Props {
    sections: Section[];
}

export default function GradingSettings({ sections }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        configs: sections.flatMap((section) =>
            section.items.map((item) => ({
                id: item.id,
                percentage: item.percentage,
            })),
        ),
    });

    const percentageById = new Map(data.configs.map((item) => [item.id, Number(item.percentage)]));

    const sectionsWithTotals = sections.map((section) => {
        const total = section.items.reduce(
            (sum, item) => sum + (percentageById.get(item.id) ?? Number(item.percentage)),
            0,
        );

        return {
            ...section,
            currentTotal: Number(total.toFixed(2)),
        };
    });

    const invalidSections = sectionsWithTotals.filter(
        (section) => section.enforce_total && section.currentTotal !== 100,
    );

    const handlePercentageChange = (id: number, value: string) => {
        const numericValue = value === '' ? 0 : Number(value);

        setData(
            'configs',
            data.configs.map((config) =>
                config.id === id ? { ...config, percentage: numericValue } : config,
            ),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.grading-settings.update'));
    };

    return (
        <AppLayout title="Kalibrasi Algoritma Assessment">
            <Head title="Konfigurasi Algoritma Penilaian" />

            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Cpu className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                ASSESSMENT_CALIBRATION_ENGINE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Algoritma <span className="text-emerald-300 text-glow-emerald italic">Assessment</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Konfigurasi metrik pembobotan sistematis dan orkestrasi parameter penilaian akhir mahasiswa secara real-time berdasarkan protokol akademik LPPM.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div
                            className={clsx(
                                'bg-white/10 p-6 rounded-lg border flex items-center gap-6 min-w-[240px] group/stat transition-all',
                                invalidSections.length === 0 ? 'border-white/20' : 'border-rose-400/30 bg-rose-500/10',
                            )}
                        >
                            <div className={clsx(
                                "p-3 rounded-lg transition-all",
                                invalidSections.length === 0 ? "bg-white text-primary" : "bg-rose-500 text-white
                            )}>
                                <Activity className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className={clsx(
                                    "text-[9px] font-black uppercase  leading-none mb-1.5 italic",
                                    invalidSections.length === 0 ? "text-emerald-200/60" : "text-rose-200"
                                )}>
                                    STATUS VALIDASI
                                </span>
                                <span
                                    className={clsx(
                                        'text-xl font-black uppercase italic  leading-none',
                                        invalidSections.length === 0 ? 'text-white' : 'text-rose-100',
                                    )}
                                >
                                    {invalidSections.length === 0 ? 'LOGIKA_BERSIH' : 'KESALAHAN_INTI'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        <div className="xl:col-span-2 space-y-8">
                            {sectionsWithTotals.map((section) => {
                                const isValid = !section.enforce_total || section.currentTotal === 100;

                                return (
                                    <section
                                        key={section.group}
                                        className="bg-white p-10 rounded-lg border border-slate-200 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
                                            <Sliders className="h-32 w-32" />
                                        </div>

                                        <div className="relative z-10 space-y-8">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-slate-50 pb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20
                                                        <Beaker className="w-6 h-6 shrink-0" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-extrabold text-slate-900 uppercase italic 
                                                            {section.title}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase  mt-1">
                                                            {section.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className={clsx(
                                                        'px-5 py-4 rounded-lg border min-w-[11rem]',
                                                        isValid ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/60',
                                                    )}
                                                >
                                                    <div className="text-[10px] font-bold uppercase  text-slate-400">
                                                        {section.enforce_total ? 'Total Bobot' : 'Nilai Default'}
                                                    </div>
                                                    <div
                                                        className={clsx(
                                                            'text-2xl font-extrabold mt-1 tabular-nums',
                                                            isValid ? 'text-slate-900' : 'text-rose-600',
                                                        )}
                                                    >
                                                        {section.currentTotal}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {section.items.map((item) => {
                                                    const currentValue = percentageById.get(item.id) ?? item.percentage;

                                                    return (
                                                        <div key={item.id} className="space-y-3">
                                                            <label
                                                                htmlFor={`config-${item.id}`}
                                                                className="text-[11px] font-bold text-slate-500 uppercase  ml-1 block"
                                                            >
                                                                {item.label}
                                                            </label>
                                                            <input
                                                                id={`config-${item.id}`}
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                step="0.01"
                                                                value={currentValue}
                                                                onChange={(e) => handlePercentageChange(item.id, e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg font-extrabold h-16 rounded-lg px-6 focus:bg-white focus:border-primary/50 outline-none transition-all"
                                                            />
                                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                                {item.description || 'Konfigurasi penilaian.'}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {!isValid && (
                                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-4">
                                                    <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                                                    <p className="text-[10px] font-bold text-rose-600 uppercase  leading-relaxed italic">
                                                        Total untuk {section.title} harus tepat 100% sebelum bisa disimpan.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}

                            {typeof errors.configs === 'string' && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-4">
                                    <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-rose-600 uppercase  leading-relaxed italic">
                                        {errors.configs}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-50 p-10 rounded-lg border border-slate-100 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 p-10 opacity-[0.05] text-primary group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-32 h-32" />
                                </div>

                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900  uppercase italic mb-3">
                                            Logika Penilaian
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Halaman ini sekarang mengatur bobot asli yang dipakai mesin kalkulasi nilai, termasuk
                                            komponen utama, rincian DPL, desa, dan LPPM.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <InfoRow title="Bobot Nilai Akhir" value="Harus total 100%" />
                                        <InfoRow title="Komponen DPL" value="Harus total 100%" />
                                        <InfoRow title="Komponen Desa / Mitra" value="Harus total 100%" />
                                        <InfoRow title="Komponen LPPM" value="Harus total 100%" />
                                        <InfoRow title="Nilai Workshop" value="Bisa diatur mandiri" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-whiterounded-lg border border-slate-200 relative overflow-hidden flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    <h4 className="text-[10px] font-extrabold text-slate-900 uppercase  italic">
                                        Peringatan Sistem
                                    </h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase  leading-relaxed italic border-l-2 border-primary/30 pl-4">
                                    Perubahan bobot akan langsung memengaruhi perhitungan nilai yang belum difinalisasi.
                                </p>

                                {recentlySuccessful && (
                                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase 
                                        Konfigurasi berhasil diperbarui.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || invalidSections.length > 0}
                                    className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-xl font-extrabold text-[11px] uppercase  hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {processing ? 'Menyimpan...' : 'Perbarui Algoritma'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function InfoRow({ title, value }: { title: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
            <div>
                <div className="text-[10px] font-bold uppercase  text-slate-400">{title}</div>
                <div className="text-sm font-semibold text-slate-700 mt-1">{value}</div>
            </div>
        </div>
    );
}
