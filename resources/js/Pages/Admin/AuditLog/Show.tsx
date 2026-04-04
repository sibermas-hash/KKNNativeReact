import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    History,
    ChevronLeft,
    Clock,
    User,
    Activity,
    ShieldCheck,
    Database,
    Zap,
    Cpu,
    ArrowRight,
    Terminal,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer_type: string | null;
    causer_id: number | null;
    causer?: { name: string; };
    properties: any;
    created_at: string;
}

interface Props {
    log: AuditLog;
}

export default function AuditLogShow({ log }: Props) {
    return (
        <AppLayout title="Detail Inspeksi Audit">
            <Head title="Inspeksi Jejak Keamanan" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href={route('admin.audit-logs.index')}
                            className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit_Inspection: #{log.id.toString().padStart(6, '0')}</h1>
                            <p className="text-sm text-slate-500 mt-1 uppercase italic tracking-widest font-black opacity-50">Log_Manifest_Surveillance_Protocol</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Primary Manifest - Main Column */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-2xl shadow-slate-200/5 overflow-hidden group">
                            <div className="p-10 border-b border-slate-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 text-slate-900 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                    <History className="h-48 w-48" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-slate-900 rounded-3xl text-primary shadow-2xl shadow-slate-900/40 italic">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{log.description}</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-widest italic leading-none">INTEGRITY_OK</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">{log.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50/50 space-y-10 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ManifestItem label="CAUSER_ENTITY" value={log.causer?.name || 'SYSTEM_INTERNAL'} icon={User} color="primary" />
                                    <ManifestItem label="SUBJECT_RESOURCE" value={log.subject_type?.split('\\').pop() || 'UNDEFINED_RESOURCE'} icon={Activity} color="emerald" />
                                </div>

                                <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-2xl shadow-slate-900/40 space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                        <Terminal className="h-5 w-5 text-emerald-400" />
                                        <h3 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-none">Payload_Properties_Matrix</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <pre className="text-[11px] font-mono text-emerald-500 leading-relaxed font-bold p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 shadow-inner">
                                            {JSON.stringify(log.properties, null, 4)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Guard - Side Column */}
                    <div className="xl:col-span-4 space-y-8">
                        <section className="bg-white p-8 rounded-lg border border-slate-200 shadow-xl shadow-slate-200/5 space-y-8 group/guard relative overflow-hidden">
                            <div className="absolute -bottom-6 -right-6 text-slate-900 opacity-[0.02] pointer-events-none group-hover/guard:rotate-12 transition-transform duration-1000">
                                <ShieldCheck className="h-32 w-32" />
                            </div>
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shadow-sm">
                                    <Database className="w-5 h-5 shadow-sm" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest">Metadata_Trace</h3>
                            </div>
                            <div className="space-y-6">
                                <MetadataItem label="SUBJECT_ID" value={`#${log.subject_id?.toString().padStart(4, '0') || 'N/A'}`} color="emerald" />
                                <MetadataItem label="CAUSER_TYPE" value={log.causer_type?.split('\\').pop() || 'SYSTEM'} color="slate" />
                                <MetadataItem label="LOG_EVENT" value={log.description.split(' ')[0].toUpperCase()} color="primary" />
                            </div>
                        </section>

                        <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group/notice shadow-2xl shadow-slate-900/40">
                             <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                             <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20">
                                    <Zap className="h-10 w-10 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)] animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-none mb-3">Protocol_Integrity</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed opacity-75">
                                        Seluruh rekaman audit bersifat permanen dan terenkripsi dalam ledger kedaulatan data. Rekaman ini tidak dapat dimanipulasi atau dihapus secara operasional.
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

function ManifestItem({ label, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10',
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10'
    };
    return (
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-primary/20 transition-all group/manifest">
            <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-xl border flex items-center justify-center transition-all group-hover/manifest:rotate-12", colors[color])}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter truncate">{value}</p>
        </div>
    );
}

function MetadataItem({ label, value, color }: { label: string, value: string, color: 'emerald' | 'primary' | 'slate' }) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500',
        primary: 'text-primary',
        slate: 'text-slate-400'
    };
    return (
        <div className="flex items-center justify-between group/meta">
            <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest group-hover/meta:text-primary transition-colors">{label}:</span>
            <span className={clsx("text-[10px] font-black italic tracking-tighter uppercase", colors[color])}>{value}</span>
        </div>
    );
}
