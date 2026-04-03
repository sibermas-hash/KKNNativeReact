import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeft,
    Terminal,
    Cpu,
    Globe,
    User,
    Clock,
    ShieldCheck,
    Fingerprint,
    Scale,
    FileText,
    History,
    Activity
} from 'lucide-react';
import { route } from 'ziggy-js';
import VisualDiff from '@/Components/VisualDiff';
import { clsx } from 'clsx';

export default function AuditLogShow({ log }: { log: any }) {
    const severityMap: any = {
        high: 'bg-rose-50 text-rose-600 border-rose-100',
        critical: 'bg-rose-100 text-rose-700 border-rose-200',
        default: 'bg-slate-50 text-slate-600 border-slate-200'
    };

    const currentSeverity = log.severity === 'high' || log.action === 'DELETE' || log.action === 'GATE_BYPASS' ? 'high' : 'default';

    return (
        <AppLayout title="Detail Log Aktivitas">
            <Head title={`Detail Aktivitas #${log.id}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-24">
                
                {/* Header Section */}
                <div className="flex items-center gap-6">
                    <Link
                        href={route('admin.audit-log.index')}
                        className="p-4 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primarygroup hover:-translate-x-1"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 text-sm">
                             <History className="w-3.5 h-3.5 text-primary" />
                             <p className="text-[10px] text-slate-400 ">Riwayat Sistem</p>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 ">Detail <span className="text-primary">Aktivitas</span></h1>
                    </div>
                </div>

                {/* Main Hero Summary Card */}
                <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none transition-transform group-hover:rotate-12 group-hover:scale-110">
                        <Activity className="h-64 w-64" />
                    </div>
                    
                    <div className="p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-lg bg-slate-50 flex items-center justify-center text-4xl border border-slate-200">
                                {log.action === 'DELETE' ? '🗑️' : log.action === 'LOGIN' ? '🔐' : '📝'}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-semibold text-slate-900 ">{log.action || 'AKTIVITAS'}</h2>
                                    <div className={clsx("px-4 py-1.5 rounded-xl text-xs text-sm  border", severityMap[currentSeverity])}>
                                        {currentSeverity === 'high' ? 'PENTING' : 'REGULER'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 text-sm text-xs 
                                    <span>ID LOG: #{log.id}</span>
                                    <span className="h-1 w-1 rounded-lg bg-slate-200" />
                                    <span>STATUS: TERCATAT</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-4 px-6 py-4 bg-primary/5 rounded-lg border border-primary/10">
                                <Clock className="w-5 h-5 text-primary" />
                                <div className="text-left">
                                    <p className="text-[9px] text-sm text-slate-400  mb-1">Durasi Terakhir</p>
                                    <p className="text-sm text-sm text-slate-700">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 bg-slate-50/30">
                        <AttributeItem 
                            label="Pelaku Aktivitas" 
                            title={log.user?.name ?? 'SISTEM OTOMATIS'} 
                            subtitle={log.user?.email ?? 'INTERNAL_SYSTEM_PROCESS'} 
                            icon={User} 
                        />
                        <AttributeItem 
                            label="Waktu Kejadian" 
                            title={format(new Date(log.created_at), 'dd MMMM yyyy', { locale: id })} 
                            subtitle={format(new Date(log.created_at), 'HH:mm:ss')} 
                            icon={Clock} 
                        />
                        <AttributeItem 
                            label="Asal Perangkat" 
                            title={log.ip_address} 
                            subtitle={log.user_agent?.split(' ')[0] || 'UNDEFINED'} 
                            icon={Globe} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Technical Specification */}
                    <div className="lg:col-span-1 space-y-8">
                        <section className="bg-white rounded-lg p-10 border border-slate-200 relative overflow-hidden group/spec">
                             <div className="absolute -bottom-6 -left-6 text-slate-900 pointer-events-none group-hover/spec:scale-110 transition-transform">
                                <Terminal className="h-32 w-32" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-200">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm text-sm text-slate-900  Teknis</h3>
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div>
                                    <p className="text-[10px] text-sm text-slate-400  mb-3">Otorisasi / Kemampuan</p>
                                    <code className="block px-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-mono text-xs text-sm border border-slate-200">
                                        {log.ability ?? 'SISTEM_GLOBAL'}
                                    </code>
                                </div>
                                <div className="h-px bg-slate-50" />
                                <div>
                                    <p className="text-[10px] text-sm text-slate-400  mb-3">Deskripsi Operasi</p>
                                    <p className="text-xs text-slate-600 leading-normal font-medium">
                                        {log.description || 'Tidak ada deskripsi tambahan yang disediakan.'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                     <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <Fingerprint className="h-3.5 w-3.5 text-emerald-500" />
                                        <p className="text-[9px] text-emerald-600 text-sm  Data Terverifikasi</p>
                                     </div>
                                </div>
                            </div>
                        </section>

                        <div className="bg-slate-900 rounded-lg p-10 text-white relative overflow-hidden group/policy">
                            <div className="absolute inset-0 bg-white from-primary/20 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <ShieldCheck className="w-12 h-12 text-primary mb-4 opacity-75" />
                                <h4 className="text-lg text-sm  mb-2">Keamanan Sistem</h4>
                                <p className="text-[10px] text-slate-400 font-medium  leading-normal">
                                    Seluruh perubahan data dicatat secara otomatis untuk transparansi sistem.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mutation Inspector */}
                    <div className="lg:col-span-2 bg-white rounded-lg p-10 border border-slate-200 group/mut relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 text-slate-900 pointer-events-none transition-transform group-hover/mut:-rotate-12">
                            <Cpu className="h-64 w-64" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 ">Perbandingan Perubahan</h3>
                            </div>
                            
                            {log.model_type && (
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] text-sm text-slate-400  Referensi:</span>
                                    <span className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs text-sm 
                                         {log.model_type.split('\\').pop()} :: {log.model_id}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50/50rounded-lg border border-slate-200 p-8
                            <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                                <VisualDiff oldValues={log.old_values} newValues={log.new_values} />
                            </div>
                        </div>
                        
                        <div className="mt-10 p-8 bg-slate-50rounded-lg border border-slate-200">
                             <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-primary">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] text-sm text-slate-400 ">Insight Analitik</h4>
                                    <p className="text-[10px] text-slate-500 font-medium leading-normal">
                                        Perbandingan di atas menunjukkan perbedaan antara kondisi data sebelum (Lama) dan sesudah (Baru) aksi dilakukan.
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

function AttributeItem({ label, title, subtitle, icon: Icon }: any) {
    return (
        <div className="space-y-4 group/attr">
            <div className="flex items-center gap-2">
                 <Icon className="w-3.5 h-3.5 text-primary" />
                 <p className="text-[10px] text-slate-400 text-sm 
                    {label}
                 </p>
            </div>
            <div className="pl-5 border-l-2 border-slate-200 group-hover/attr:border-primary transition-colors">
                <p className="text-slate-900 font-extrabold text-xl  mb-1">{title}</p>
                <p className="text-slate-400 text-xs text-sm 
            </div>
        </div>
    );
}

