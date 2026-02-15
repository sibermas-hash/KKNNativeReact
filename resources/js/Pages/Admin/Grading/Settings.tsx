import React from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    AdjustmentsVerticalIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Config {
    id: number;
    config_key: string;
    label: string;
    percentage: number;
    group: string;
    description: string;
}

interface Props {
    configs: Record<string, Config[]>;
}

export default function GradingSettings({ configs }: Props) {
    const { data, setData, post, processing } = useForm({
        configs: [...(configs?.main || []), ...(configs?.dpl || []), ...(configs?.village || []), ...(configs?.lppm || [])].map(c => ({
            id: c.id,
            percentage: c.percentage
        }))
    });

    const updatePercentage = (id: number, value: number) => {
        const newConfigs = data.configs.map(c =>
            c.id === id ? { ...c, percentage: value } : c
        );
        setData('configs', newConfigs);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.grading-settings.update'), {
            preserveScroll: true
        });
    };

    const findVal = (id: number) => data.configs.find(c => c.id === id)?.percentage || 0;

    const calculateTotal = (groupConfigs: Config[]) => {
        return groupConfigs.reduce((acc, curr) => acc + Number(findVal(curr.id)), 0);
    };

    const mainTotal = calculateTotal(configs.main || []);
    const dplTotal = calculateTotal(configs.dpl || []);
    const villageTotal = calculateTotal(configs.village || []);
    const lppmTotal = calculateTotal(configs.lppm || []);

    const ConfigSection = ({ title, items, total, required = 100 }: any) => (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500">Atur bobot persentase untuk komponen ini.</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${Math.abs(total - required) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    Total: {total}% / {required}%
                </div>
            </div>
            <div className="p-8 space-y-6">
                {items.map((item: Config) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-700">{item.label}</label>
                            <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3 w-40">
                            <input
                                type="number"
                                value={findVal(item.id)}
                                onChange={(e) => updatePercentage(item.id, Number(e.target.value))}
                                className="w-full rounded-xl border-slate-200 text-right font-bold text-primary focus:ring-primary focus:border-primary"
                                step="0.1"
                                min="0"
                                max="100"
                            />
                            <span className="text-slate-400 font-bold">%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <AppLayout title="Pengaturan Penilaian">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <AdjustmentsVerticalIcon className="h-7 w-7 text-primary" />
                            Konfigurasi Pembobotan Nilai
                        </h1>
                        <p className="text-sm text-slate-500">Sesuaikan persentase penilaian sesuai dengan kebijakan kampus.</p>
                    </div>

                    <button
                        onClick={submit}
                        disabled={processing || mainTotal !== 100}
                        className="px-8 py-4 bg-primary text-white font-extrabold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {processing ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
                    </button>
                </div>

                {mainTotal !== 100 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-sm animate-pulse">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        <p><strong>Peringatan:</strong> Total bobot komponen utama harus berjumlah tepat 100%.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {/* Main Components */}
                    <ConfigSection
                        title="Komponen Penilaian Utama"
                        items={configs.main || []}
                        total={mainTotal}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {/* DPL Sub */}
                            <ConfigSection
                                title="Sub-Komponen DPL"
                                items={configs.dpl || []}
                                total={dplTotal}
                            />

                            {/* Village Sub */}
                            <ConfigSection
                                title="Sub-Komponen Mitra/Desa"
                                items={configs.village || []}
                                total={villageTotal}
                            />
                        </div>

                        <div className="space-y-8">
                            {/* LPPM Sub */}
                            <ConfigSection
                                title="Sub-Komponen LPPM"
                                items={configs.lppm || []}
                                total={lppmTotal}
                            />

                            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
                                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <InformationCircleIcon className="h-5 w-5" />
                                    Panduan Penilaian
                                </h4>
                                <ul className="space-y-3 text-sm text-blue-800/80 list-disc pl-5">
                                    <li>Perubahan bobot akan langsung berdampak pada perhitungan nilai akhir mahasiswa saat proses sinkronisasi dilakukan.</li>
                                    <li>Pastikan setiap grup (DPL, Desa, LPPM) memiliki total sub-bobot 100% agar perhitungan konsisten.</li>
                                    <li>Gunakan angka desimal jika diperlukan (e.g., 33.3).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

declare function route(name: string, params?: any): string;
