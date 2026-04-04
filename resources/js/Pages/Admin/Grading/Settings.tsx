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
            <Head title="Konfigurasi Bobot Nilai" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Konfigurasi Pembobotan</h1>
                        <p className="text-sm text-slate-500 mt-1">Kalibrasi algoritma penilaian untuk evaluasi performa akademik KKN.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Weight Adjustment Panel - Main Column */}
                    <div className="xl:col-span-8">
                        <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden group">
                            <div className="px-10 py-12 border-b border-slate-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 text-primary opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                    <Scale className="h-64 w-64" />
                                </div>
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-slate-900 rounded-3xl text-primary shadow-2xl shadow-slate-900/40 italic">
                                        <Calculator className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Matrix Calculation</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">ALGORITHM_VERSION: 3.2.0</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">CALIBRATION_ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={submit} className="p-10 space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {components.map((component) => (
                                        <div key={component.key} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 hover:border-emerald-200 transition-all group/item">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 group-hover/item:text-emerald-600 transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest">{component.name}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono italic">KEY: {component.key}</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.weights[component.key]}
                                                    onChange={(e) => setData('weights', { ...data.weights, [component.key]: Number(e.target.value) })}
                                                    className="w-full h-16 pl-6 pr-16 bg-white border border-slate-100 rounded-2xl text-xl font-black italic tracking-tighter focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 italic">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={clsx(
                                    "p-10 rounded-lg border-2 border-dashed transition-all mt-10 flex flex-col md:flex-row md:items-center justify-between gap-8",
                                    isWeightValid ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"
                                )}>
                                    <div className="flex items-center gap-6">
                                        <div className={clsx(
                                            "h-16 w-16 rounded-lg flex items-center justify-center border shadow-xl transition-all",
                                            isWeightValid ? "bg-white border-emerald-100 text-emerald-600" : "bg-white border-rose-100 text-rose-500 animate-pulse"
                                        )}>
                                            <BarChartIcon percent={totalWeight} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest leading-none">TOTAL_ACCUMULATED_WEIGHT</h4>
                                            <p className={clsx(
                                                "text-4xl font-black italic italic tracking-tighter leading-none",
                                                isWeightValid ? "text-emerald-600" : "text-rose-500"
                                            )}>{totalWeight}%</p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || !isWeightValid}
                                        className="h-16 px-12 bg-slate-900 text-white rounded-lg font-black uppercase italic tracking-[0.25em] text-[11px] shadow-2xl shadow-slate-900/40 relative active:scale-95 group/submit disabled:opacity-20 transition-all hover:bg-emerald-600"
                                    >
                                        <span className="relative z-10 flex items-center gap-4">
                                            <ShieldCheck className="w-5 h-5 text-primary group-hover/submit:text-white" />
                                            SAVE_CALIBRATION
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Meta Info - Side Column */}
                    <div className="xl:col-span-4 space-y-8">
                        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 relative overflow-hidden group/notice">
                            <div className="absolute -bottom-6 -right-6 text-slate-900 opacity-[0.02] pointer-events-none group-hover/notice:rotate-12 transition-transform">
                                <History className="h-32 w-32" />
                            </div>
                            
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-sm">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest">Protocol Notice</h3>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Verification_Requirement</span>
                                    <p className="text-[11px] text-slate-600 font-bold uppercase italic leading-relaxed">
                                        Akumulasi seluruh bobot komponen penilaian harus mencapai angka presisi 100%. Ketidakseimbangan bobot akan mengunci tombol penyimpanan.
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Impact_Level</span>
                                    <p className="text-[11px] text-slate-600 font-bold uppercase italic leading-relaxed">
                                        Perubahan pembobotan akan berdampak langsung pada seluruh kalkulasi nilai agregat mahasiswa secara real-time.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 relative overflow-hidden group shadow-xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20">
                                    <Cpu className="w-10 h-10 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-none mb-3">SYSTEM_CORE_SYNC</h4>
                                    <div className="flex items-center gap-3 justify-center px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[9px] font-black text-slate-100 uppercase italic tracking-widest">ALGORITHM_SECURED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function BarChartIcon({ percent }: { percent: number }) {
    return (
        <div className="flex items-end gap-1 h-6">
            <div className={clsx("w-1.5 rounded-full transition-all", percent > 0 ? "bg-emerald-500" : "bg-slate-100")} style={{ height: '30%' }} />
            <div className={clsx("w-1.5 rounded-full transition-all", percent > 50 ? "bg-emerald-500" : "bg-slate-100")} style={{ height: '60%' }} />
            <div className={clsx("w-1.5 rounded-full transition-all", percent === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,168,83,0.5)]" : "bg-slate-100")} style={{ height: '100%' }} />
        </div>
    )
}
