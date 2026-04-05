import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Settings, 
    Save, 
    RefreshCw, 
    AlertCircle, 
    Info,
    BarChart3,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

interface GradingConfig {
    id: number;
    component_key: string;
    component_label: string;
    weight_percentage: number;
    description?: string;
}

interface Props {
    configs: GradingConfig[];
}

export default function GradingSettings({ configs }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        configs: configs.map(c => ({
            id: c.id,
            weight_percentage: c.weight_percentage
        }))
    });

    const totalWeight = data.configs.reduce((sum, item) => sum + Number(item.weight_percentage), 0);
    const isWeightValid = totalWeight === 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isWeightValid) {
            alert('Total bobot harus tepat 100%!');
            return;
        }
        post(route('admin.grading-settings.update'));
    };

    const updateWeight = (index: number, value: string) => {
        const newConfigs = [...data.configs];
        newConfigs[index].weight_percentage = Number(value);
        setData('configs', newConfigs);
    };

    return (
        <AppLayout title="Konfigurasi Penilaian">
            <Head title="Konfigurasi Penilaian" />

            <div className="space-y-8 pb-20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                                <BarChart3 size={20} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Bobot Penilaian KKN</h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Atur persentase bobot untuk setiap komponen penilaian mahasiswa.</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                        <Info size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-amber-900 uppercase italic">Aturan Kalkulasi</h3>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Pastikan akumulasi seluruh bobot komponen penilaian berjumlah <strong>tepat 100%</strong>. Perubahan bobot akan mempengaruhi perhitungan nilai akhir mahasiswa secara otomatis.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic">Komponen Penilaian</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic w-40 text-center">Bobot (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {configs.map((config, index) => (
                                    <tr key={config.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-900 uppercase italic">{config.component_label}</p>
                                                <p className="text-xs text-slate-400 font-medium">{config.description || 'Komponen penilaian standar operasional KKN.'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="100"
                                                    value={data.configs[index].weight_percentage}
                                                    onChange={e => updateWeight(index, e.target.value)}
                                                    className={clsx(
                                                        "w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-center font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none",
                                                        errors[`configs.${index}.weight_percentage`] && "border-rose-500 bg-rose-50"
                                                    )}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className={clsx(
                                    "transition-colors",
                                    isWeightValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                )}>
                                    <td className="px-8 py-6 text-right font-black uppercase italic tracking-widest text-xs">Total Akumulasi Bobot</td>
                                    <td className="px-8 py-6 text-center font-black text-lg italic">
                                        {totalWeight}%
                                        {!isWeightValid && (
                                            <div className="absolute right-0 top-full mt-2 bg-rose-600 text-white text-[8px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-10 animate-bounce">
                                                HARUS 100%
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-2xl text-slate-500">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sistem Audit Aktif</span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !isWeightValid}
                            className={clsx(
                                "h-16 px-12 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed",
                                recentlySuccessful ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-emerald-600"
                            )}
                        >
                            {processing ? <RefreshCw className="animate-spin" /> : recentlySuccessful ? <CheckCircle2 /> : <Save />}
                            {recentlySuccessful ? 'Berhasil Disimpan' : 'Simpan Konfigurasi'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
