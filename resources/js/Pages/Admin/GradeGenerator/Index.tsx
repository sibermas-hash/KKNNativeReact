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
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = () => {
        if (confirm('Apakah Anda yakin ingin mengeksekusi generator nilai? Proses ini akan mengalkulasi seluruh nilai mahasiswa.')) {
            post(route('admin.grade-generator.generate'));
        }
    };

    const progressPercentage = (stats.generated_count / stats.total_eligible) * 100 || 0;

    return (
        <AppLayout title="Generator Nilai">
            <Head title="Kalkulasi Nilai" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generator Nilai Otomatis</h1>
                        <p className="text-sm text-slate-500 mt-1">Kalkulasi agregat nilai akhir berdasarkan pembobotan komponen.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            Ekspor Ledger
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Execution Main Panel */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                           <div className="px-10 py-10 border-b border-slate-50 relative overflow-hidden bg-slate-50/10">
                                <div className="absolute top-0 right-0 p-12 text-primary opacity-[0.02] pointer-events-none  transition-transform">
                                    <Cpu className="h-64 w-64" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-slate-900 rounded-2xl text-emerald-400 shadow-lg italic">
                                        <Calculator className="h-8 w-8 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-900 ">Status Generator</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest italic ">Ready_Infection</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-10 relative z-10">
                                 <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="space-y-4 flex-1">
                                         <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            Pantauan_Progres_Eksekusi
                                        </div>
                                        <div className="flex items-baseline gap-4">
                                            <span className="text-4xl font-black italic tracking-tighter text-slate-900 ">{progressPercentage.toFixed(1)}%</span>
                                            <span className="text-sm font-bold text-slate-300 italic uppercase">Tersinkronisasi</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-white rounded-full border border-slate-200 overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,168,83,0.3)]" 
                                                style={{ width: `${progressPercentage}%` }} 
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center md:items-end justify-center px-10 border-l border-slate-200">
                                        <span className="text-2xl font-black italic text-slate-900">{stats.generated_count} / {stats.total_eligible}</span>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1.5 opacity-50 italic">PERSONEL_RECORDS</span>
                                    </div>
                                </div>

                                <button
                                    onClick={generate}
                                    disabled={processing || stats.pending_count === 0}
                                    className="w-full h-18 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {processing ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <><Zap className="w-5 h-5" /> Eksekusi Generator Nilai</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Recent logs */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <History className="w-4 h-4" />
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest ">History_Logs</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50 bg-slate-50/10 italic">
                                {recentLogs.length > 0 ? recentLogs.map((log) => (
                                    <div key={log.id} className="px-10 py-4 hover:bg-white transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold italic border",
                                                log.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                log.type === 'warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-slate-100 text-slate-400 border-slate-200"
                                            )}>
                                                {log.type === 'success' ? 'OK' : 'WRN'}
                                            </div>
                                            <p className="text-sm font-bold text-slate-500   transition-colors">{log.message}</p>
                                        </div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{log.created_at}</span>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center opacity-20 italic">
                                        <Activity className="h-10 w-10 mx-auto mb-4 text-slate-900" />
                                        <p className="text-xs font-bold uppercase tracking-widest">LOG_MANIFEST_PENDING</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Stats Sidebar Section */}
                    <div className="xl:col-span-4 space-y-6">
                        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 relative overflow-hidden group/summ">
                             <div className="absolute -bottom-6 -right-6 text-slate-100 opacity-20 pointer-events-none group-hover/summ:scale-110 transition-transform">
                                <Calculator className="h-32 w-32" />
                            </div>
                            
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">
                                    <Calculator className="w-5 h-5 shadow-sm" />
                                </div>
                                <h3 className="font-bold text-slate-900 tracking-tight">Ringkasan Siklus</h3>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <StatItem label="TOTAL_ELIGIBLE" value={stats.total_eligible} color="slate" />
                                <StatItem label="GENERATED_SUCCESS" value={stats.generated_count} color="emerald" />
                                <StatItem label="S" value={stats.pending_count} color="amber" />
                            </div>
                        </section>

                        <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-sm shadow-primary/20">
                                    <ShieldAlert className="h-10 w-10 text-primary shadow-sm" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase italic tracking-[0.2em] mb-3 ">Security_Governance</h4>
                                    <p className="text-xs text-slate-400 font-medium italic italic  opacity-75 uppercase">
                                        Sistem generator hanya dapat dieksekusi 1 kali per periode audit nilai. Pastikan bobot taktis telah sesuai.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover/item:text-primary transition-colors">{label}</span>
            <div className="flex items-center gap-3">
                <span className={clsx("text-lg font-black italic tracking-tighter", colors[color])}>{value.toLocaleString()}</span>
                <div className={clsx("h-1.5 w-1.5 rounded-full", color === 'emerald' ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-200")} />
            </div>
        </div>
    );
}
