import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Activity,
    Cpu,
    RefreshCw,
    ShieldCheck,
    History,
    Zap,
    Download,
    Calculator,
    ShieldAlert,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Stats {
    total_eligible: number;
    generated_count: number;
    pending_count: number;
}

interface Log {
    id: number;
    message: string;
    type: 'success' | 'info' | 'warning';
    created_at: string;
}

interface Props {
    stats: Stats;
    recentLogs: Log[];
}

export default function GradeGeneratorIndex({ stats, recentLogs }: Props) {
    const { post, processing } = useForm({});
    const [progress, setProgress] = useState(0);

    const generate = () => {
        if (confirm('Apakah Anda yakin ingin mengeksekusi generator nilai periode ini? Seluruh data yang belum ter-generate akan dikalkulasi sesuai bobot algoritma terkini.')) {
            post(route('admin.grade-generator.generate'));
        }
    };

    const progressPercentage = (stats.generated_count / stats.total_eligible) * 100 || 0;

    return (
        <AppLayout title="Generator Nilai">
            <Head title="Kalkulasi Nilai Otomatis" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-emerald-600">Generator Nilai Otomatis</h1>
                        <p className="text-sm text-slate-500 mt-1">Eksekusi kalkulasi agregat nilai akhir berbasis pembobotan matriks komponen.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Execution Panel - Main Column */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden group/gen">
                            <div className="px-10 py-12 border-b border-slate-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 text-primary opacity-[0.02] pointer-events-none group-hover/gen:rotate-12 transition-transform duration-1000">
                                    <Cpu className="h-64 w-64" />
                                </div>
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-slate-900 rounded-3xl text-emerald-400 shadow-2xl shadow-slate-900/40 italic">
                                        <Zap className="h-8 w-8 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Grade Ingestion Core</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">ENGINE_BUILD: 3.2.0</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">READY_TO_RUN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-10 relative z-10">
                                <div className="p-10 bg-slate-50 rounded-lg border border-slate-100 space-y-10 relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
                                                <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">REALTIME_PROGRESS_MONITOR</span>
                                            </div>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-5xl font-black italic italic tracking-tighter leading-none text-slate-900">{progressPercentage.toFixed(1)}%</span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">TOTAL_INGESTED</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[11px] font-black text-slate-900 italic tracking-widest mb-1.5">{stats.generated_count} / {stats.total_eligible}</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase italic tracking-widest opacity-50">ACADEMIC_RECORDS</span>
                                        </div>
                                    </div>
                                    
                                    <div className="h-4 w-full bg-white rounded-full border border-slate-200 p-1 relative overflow-hidden group/bar">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,168,83,0.4)]" 
                                            style={{ width: `${progressPercentage}%` }} 
                                        />
                                        <div className="absolute top-0 right-0 h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <button
                                        onClick={generate}
                                        disabled={processing || stats.pending_count === 0}
                                        className="flex-1 h-20 bg-slate-900 text-white rounded-lg font-black uppercase italic tracking-[0.25em] text-[11px] shadow-2xl shadow-slate-900/40 relative active:scale-95 group/btn transition-all hover:bg-emerald-600 disabled:opacity-20 flex items-center justify-center gap-4"
                                    >
                                        <RefreshCw className={clsx("w-5 h-5 text-primary group-hover/btn:text-white", processing && "animate-spin")} />
                                        EXECUTE_INGESTION_CORE
                                    </button>
                                    <button 
                                        className="h-20 px-10 bg-white border border-slate-100 text-slate-900 rounded-lg font-black uppercase italic tracking-widest text-[10px] shadow-sm active:scale-95 transition-all hover:bg-slate-50 flex items-center justify-center gap-4"
                                    >
                                        <Download className="w-5 h-5 text-emerald-600" />
                                        EXPORT_RAW_LEDGER
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Execution Logs */}
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <History className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest leading-none mb-1">Execution_Logs</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentLogs.length > 0 ? recentLogs.map((log) => (
                                    <div key={log.id} className="px-10 py-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={clsx(
                                                "h-8 w-8 rounded-xl flex items-center justify-center italic text-[10px] font-black italic border",
                                                log.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                log.type === 'warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {log.type === 'success' ? 'OK' : log.type === 'warning' ? 'WRN' : 'INF'}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase italic tracking-tighter truncate max-w-[400px] group-hover:text-slate-900 transition-colors">{log.message}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic whitespace-nowrap">{log.created_at}</span>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center opacity-20 italic">
                                        <Activity className="h-10 w-10 mx-auto mb-4" />
                                        <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-[0.4em]">NO_LOGS_ON_CURRENT_CYCLE</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary - Side Column */}
                    <div className="xl:col-span-4 space-y-8">
                        <section className="bg-white p-10 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/5 space-y-10 relative overflow-hidden group/summ">
                            <div className="absolute -bottom-6 -right-6 text-slate-900 opacity-[0.02] pointer-events-none group-hover/summ:scale-110 transition-transform">
                                <Calculator className="h-32 w-32" />
                            </div>
                            
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-sm">
                                    <Calculator className="w-5 h-5" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest">Cycle_Summary</h3>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <StatItem label="ELIGIBLE_RECORDS" value={stats.total_eligible} color="slate" />
                                <StatItem label="INGESTED_RECORDS" value={stats.generated_count} color="emerald" />
                                <StatItem label="PENDING_CYCLES" value={stats.pending_count} color="amber" />
                            </div>
                        </section>

                        <div className="bg-slate-900 p-10 rounded-lg border border-slate-800 relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                            <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20">
                                    <ShieldAlert className="w-10 h-10 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-none mb-4">CRITICAL_GOVERNANCE</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed opacity-75">
                                        Pastikan konfigurasi bobot pembobotan telah dikalibrasi secara presisi sebelum melakukan eksekusi pada ingestion core.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </AppLayout>
    );
}

function StatItem({ label, value, color }: { label: string, value: number, color: 'emerald' | 'amber' | 'slate' }) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500',
        amber: 'text-amber-500',
        slate: 'text-slate-400'
    };

    return (
        <div className="flex items-center justify-between group/item">
            <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest group-hover/item:text-primary transition-colors">{label}</span>
            <div className="flex items-center gap-3">
                <span className={clsx("text-lg font-black italic italic tracking-tighter", colors[color])}>{value.toLocaleString()}</span>
                <div className={clsx("h-1.5 w-1.5 rounded-full", color === 'emerald' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,168,83,0.5)]" : "bg-slate-200")} />
            </div>
        </div>
    );
}
