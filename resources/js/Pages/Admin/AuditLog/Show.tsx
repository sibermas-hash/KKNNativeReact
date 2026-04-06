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
    Terminal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer_type: string | null;
    causer_id: number | null;
    causer?: { name: string; };
    properties: Record<string, unknown>;
    created_at: string;
}

interface Props {
    log: AuditLog;
}

interface ManifestItemProps {
    label: string;
    value: string;
    icon: LucideIcon;
    color: 'primary' | 'emerald';
}

export default function AuditLogShow({ log }: Props) {
    return (
        <AppLayout title="Detail Inspeksi Audit">
            <Head title="Inspeksi Jejak Audit" />

            <div className="space-y-8 pb-20 font-bold italic uppercase tracking-tighter">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 uppercase italic">
                    <div className="flex items-center gap-6">
                        <Link 
                            href={route('admin.audit-log.index')}
                            className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inspeksi Audit: #{log.id.toString().padStart(6, '0')}</h1>
                            <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-black">Protokol Manifest Surveilans Log</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Primary Manifest - Main Column */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                           <div className="p-10 border-b border-slate-50 relative overflow-hidden bg-emerald-50/10">
                                <div className="absolute top-0 right-0 p-12 text-emerald-950/5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                    <History className="h-48 w-48" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-xl italic font-black">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-bold text-slate-900 tracking-tight  mb-3">{log.description}</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest ">INTEGRITAS OKE</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-black italic text-slate-400 uppercase tracking-widest">{log.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-emerald-50/10 space-y-10 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ManifestItem label="ENTITAS PENYEBAB" value={log.causer?.name || 'SISTEM INTERNAL'} icon={User} color="primary" />
                                    <ManifestItem label="SUMBER SUBJEK" value={log.subject_type?.split('\\').pop() || 'SUMBER TIDAK TERDEFINISI'} icon={Activity} color="emerald" />
                                </div>

                                <div className="p-8 bg-emerald-950 rounded-xl border border-emerald-900 shadow-xl space-y-6">
                                    <div className="flex items-center gap-4 border-b border-emerald-900 pb-4">
                                        <Terminal className="h-5 w-5 text-emerald-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest ">Matriks Properti Data</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <pre className="text-sm text-emerald-400 font-bold p-6 bg-emerald-950/30 rounded-xl border border-emerald-900 shadow-inner ">
                                            {JSON.stringify(log.properties, null, 4)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="xl:col-span-4 space-y-6">
                          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 group/guard relative overflow-hidden">
                             <div className="absolute -bottom-6 -right-6 text-emerald-50/50 pointer-events-none group-hover/guard:rotate-12 transition-transform duration-1000">
                                 <ShieldCheck className="h-32 w-32" />
                             </div>
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shadow-sm">
                                    <Database className="w-5 h-5 shadow-sm shadow-emerald-500/20" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Pelacakan Metadata</h3>
                            </div>
                            <div className="space-y-6">
                                <MetadataItem label="SUBJECT_ID" value={`#${log.subject_id?.toString().padStart(4, '0') || 'N/A'}`} color="emerald" />
                                <MetadataItem label="CAUSER_TYPE" value={log.causer_type?.split('\\').pop() || 'SISTEM'} color="slate" />
                                <MetadataItem label="LOG_EVENT" value={log.description.split(' ')[0].toUpperCase()} color="primary" />
                            </div>
                        </section>

                        <div className="p-8 bg-emerald-950 rounded-xl border border-emerald-900 text-white relative overflow-hidden group shadow-xl">
                             <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.05),transparent_50%)]" />
                             <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-sm shadow-primary/20">
                                    <Zap className="h-10 w-10 text-primary shadow-sm animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-3 ">Tata Kelola Keamanan</h4>
                                    <p className="text-sm text-slate-500 font-medium italic italic uppercase">
                                        Seluruh rekaman audit bersifat permanen dan tidak dapat dimanipulasi secara operasional.
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

function ManifestItem({ label, value, icon: Icon, color }: ManifestItemProps) {
    const colors: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10',
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100'
    };
    return (
        <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-all group/manifest">
            <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-lg border flex items-center justify-center transition-all group-hover/manifest:rotate-12 shadow-sm shadow-slate-100", colors[color])}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter truncate italic">{value}</p>
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
        <div className="flex items-center justify-between group/meta font-bold">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover/meta:text-primary transition-colors">{label}:</span>
            <span className={clsx("text-xs font-black italic tracking-tighter uppercase", colors[color])}>{value}</span>
        </div>
    );
}
