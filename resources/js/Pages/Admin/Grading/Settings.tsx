import { useState, useEffect } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Settings,
    Save,
    Calculator,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Cpu,
    Zap,
    Scale,
    FileText,
    History,
} from 'lucide-react';
import { clsx } from 'clsx';

interface GradeComponent {
    id: number;
    name: string;
    weight: number;
    key: string;
}

interface Props {
    components: GradeComponent[];
}

export default function GradingSettings({ components }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        weights: components.reduce((acc, c) => ({ ...acc, [c.key]: c.weight }), {} as Record<string, number>),
    });

    const totalWeight = Object.values(data.weights).reduce((sum, w) => sum + Number(w), 0);
    const isWeightValid = totalWeight === 100;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isWeightValid) {
            alert('TOTAL_WEIGHT_ERROR: Total pembobotan harus tepat 100%');
            return;
        }
        post(route('admin.grading.settings.update'));
    };

    return (
        <AppLayout title="Setelan Penilaian">
            <Head title="Bobot Penilaian" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Setelan Penilaian</h1>
                        <p className="text-sm text-slate-500 mt-1">Sesuaikan pembobotan komponen nilai akhir untuk evaluasi akademik.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Weight Adjustment Section */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="px-10 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-slate-900 rounded-2xl text-emerald-400 shadow-lg italic">
                                        <Scale className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-900 ">Matriks Pembobotan</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest italic ">Status: Ready_Calibration</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-2 italic">
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest ">Algorithm_V3.2</span>
                                </div>
                            </div>

                            <form onSubmit={submit} className="p-10 space-y-10 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {components.map((component) => (
                                        <div key={component.key} className="p-6 bg-slate-50 rounded-xl border border-slate-100 group/item hover:border-emerald-200 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 group-hover/item:text-emerald-600 shadow-sm transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">{component.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-300 italic uppercase">Key: {component.key}</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.weights[component.key]}
                                                    onChange={(e) => setData('weights', { ...data.weights, [component.key]: Number(e.target.value) })}
                                                    className="w-full h-15 pl-6 pr-16 bg-white border border-slate-100 rounded-xl text-xl font-bold italic tracking-tighter focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-300 italic">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={clsx(
                                    "p-8 rounded-xl border border-dashed transition-all flex flex-col md:flex-row md:items-center justify-between gap-8",
                                    isWeightValid ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
                                )}>
                                    <div className="flex items-center gap-6">
                                        <div className={clsx(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all",
                                            isWeightValid ? "bg-white border-emerald-100 text-emerald-600" : "bg-white border-rose-100 text-rose-500 animate-pulse"
                                        )}>
                                            <Calculator className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ">Akumulasi Bobot Total</h4>
                                            <p className={clsx(
                                                "text-3xl font-black italic",
                                                isWeightValid ? "text-emerald-600" : "text-rose-500"
                                            )}>{totalWeight}%</p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || !isWeightValid}
                                        className="h-15 px-10 bg-emerald-600 text-white rounded-xl font-bold uppercase italic tracking-widest text-sm shadow-lg shadow-emerald-500/20 relative active:scale-95 disabled:opacity-20 transition-all hover:bg-emerald-700 flex items-center justify-center gap-3"
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                     {/* Info Sidebar Section */}
                     <div className="xl:col-span-4 space-y-6">
                        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden group/notice">
                            <div className="absolute -bottom-6 -right-6 text-slate-100 pointer-events-none group-hover/notice:rotate-12 transition-transform">
                                <Zap className="h-32 w-32" />
                            </div>
                            
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">
                                    <AlertCircle className="w-5 h-5 shadow-sm shadow-emerald-500/20" />
                                </div>
                                <h3 className="font-bold text-slate-900 tracking-tight">Ketik Bobot</h3>
                            </div>

                            <div className="space-y-5 relative z-10">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Aturan Total Bobot</p>
                                    <p className="text-sm text-slate-600 font-medium italic ">
                                        Seluruh bobot komponen harus berjumlah tepat 100%. Jika tidak memenuhi syarat, perubahan tidak dapat disimpan.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Efek Perubahan</p>
                                    <p className="text-sm text-slate-600 font-medium italic ">
                                        Nilai agregat mahasiswa akan diperbarui secara otomatis menggunakan bobot terbaru pada proses sinkronisasi berikutnya.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm shadow-primary/20">
                                     <Cpu className="h-8 w-8 text-primary shadow-sm" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase italic tracking-[0.2em] mb-2 ">Infrastruktur_Audit</h4>
                                    <p className="text-xs text-slate-500 font-medium italic truncate uppercase">ENCRYPTED_ALGO_GOVERNANCE_SECURED</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
