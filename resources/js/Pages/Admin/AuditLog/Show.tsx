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
    ArrowRight,
    Fingerprint,
    Shield,
    Binary,
    Cpu,
    Target,
    Layers,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

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

export default function AuditLogShow({ log }: Props) {
    return (
        <AppLayout title="Inspeksi Forensik Audit">
            <Head title={`Detail Audit #${log.id} | POS-KKN`} />

            <div className="min-h-screen bg-white italic font-black text-emerald-950 uppercase tracking-tight">
                {/* HEADER TACTICAL: INSPEKSI PROTOKOL */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="flex items-center gap-10 relative z-10">
                        <Link 
                            href={route('admin.audit-log.index')}
                            className="h-16 w-16 bg-white border border-emerald-50 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500 flex items-center justify-center transition-all shadow-sm active:scale-95 group"
                        >
                            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Audit Forensic Protocol</span>
                            </div>
                            <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                                DETEKTIF <span className="text-emerald-500">AUDIT ENTITY #{log.id.toString().padStart(6, '0')}</span>
                            </h1>
                            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                                 <Terminal size={12} className="text-emerald-500" />
                                 Analisis mendalam terhadap perubahan properti data dan kordinasi aktor sistem.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="px-6 py-2.5 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest border border-emerald-900 shadow-2xl">
                             MODUL: {log.subject_type?.split('\\').pop()?.toUpperCase() || 'CORE'}
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                        {/* MAIN INSPECTION PANEL */}
                        <div className="xl:col-span-8 space-y-12">
                            <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                                <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                                
                                <div className="p-12 border-b border-emerald-50 bg-emerald-50/10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="flex items-center gap-10">
                                        <div className="h-20 w-20 bg-emerald-950 text-emerald-400 flex items-center justify-center font-black border border-emerald-800 shadow-2xl group-hover:bg-emerald-600 transition-all duration-700">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white border border-emerald-100 px-3 py-1 italic">
                                                    PASSED: VERIFIED_LOG
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none group-hover:text-emerald-600 transition-colors">
                                                {log.description.toUpperCase()}
                                            </h2>
                                            <div className="flex items-center gap-3 text-emerald-300">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] tabular-nums italic">
                                                    STAMP: {log.created_at.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 space-y-12 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
                                        <ManifestBox 
                                            label="AKTOR SISTEM" 
                                            value={log.causer?.name || 'SISTEM INTI'} 
                                            icon={User} 
                                            id={`USR.${log.causer_id || 'SYS'}`}
                                        />
                                        <ManifestBox 
                                            label="SUMBER SUBJEK" 
                                            value={log.subject_type?.split('\\').pop() || 'AKTIVITAS INTI'} 
                                            icon={Layers} 
                                            id={`SUB.${log.subject_id || 'IDN'}`}
                                        />
                                    </div>

                                    {/* TERMINAL DATA VIEW */}
                                    <div className="bg-emerald-950 border border-emerald-900 shadow-[0_40px_100px_rgba(6,78,59,0.3)] relative overflow-hidden group/terminal">
                                        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <Terminal className="h-5 w-5 text-emerald-500" />
                                                <span className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.4em] italic">Property Data Trace</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-2.5 w-2.5 bg-rose-500/50" />
                                                <div className="h-2.5 w-2.5 bg-amber-500/50" />
                                                <div className="h-2.5 w-2.5 bg-emerald-500/50 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover/terminal:opacity-[0.05] transition-opacity">
                                                <Binary size={400} strokeWidth={0.5} />
                                            </div>
                                            <pre className="text-[13px] font-black text-emerald-400 leading-loose overflow-x-auto whitespace-pre-wrap selection:bg-emerald-500 selection:text-white relative z-10 tabular-nums">
                                                {JSON.stringify(log.properties, null, 4)}
                                            </pre>
                                        </div>
                                        <div className="px-8 py-4 border-t border-white/5 bg-white/5 flex items-center justify-between text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">
                                             <span>END_OF_MANIFEST</span>
                                             <div className="h-1 w-12 bg-emerald-500/20" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* SIDEBAR METADATA */}
                        <div className="xl:col-span-4 space-y-12">
                            <section className="bg-white border border-emerald-100 shadow-sm p-12 space-y-12 group/guard relative overflow-hidden hover:border-emerald-500 transition-all">
                                <div className="absolute -bottom-10 -right-10 text-emerald-50/50 pointer-events-none group-hover/guard:rotate-12 group-hover/guard:scale-110 transition-all duration-1000">
                                    <Database className="h-64 w-64" />
                                </div>
                                <div className="flex items-center gap-6 border-b border-emerald-50 pb-8 relative z-10">
                                    <div className="h-14 w-14 flex items-center justify-center bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-xl group-hover/guard:bg-emerald-600 transition-all">
                                        <Database className="w-8 h-8 font-black" />
                                    </div>
                                    <div className="space-y-1">
                                         <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.3em] italic leading-none">Metadata Registry</h3>
                                         <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-[0.3em] italic">IDENTITAS LOG SISTEM</p>
                                    </div>
                                </div>
                                <div className="space-y-10 relative z-10 italic">
                                    <MetadataBox label="ENTITY_SUBJECT_ID" value={`#${log.subject_id?.toString().padStart(4, '0') || 'CORE'}`} type="emerald" />
                                    <MetadataBox label="CAUSER_TYPE_CLASS" value={log.causer_type?.split('\\').pop() || 'INTERNAL_SYS'} type="dark" />
                                    <MetadataBox label="ACTION_IDENTIFIER" value={log.description.split(' ')[0].toUpperCase()} type="highlight" />
                                    <MetadataBox label="SECURITY_VERSION" value="AUDIT_V4.1" type="emerald" />
                                </div>
                            </section>

                            <section className="bg-emerald-950 p-12 text-white shadow-3xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-all duration-1000" />
                                <div className="relative z-10 flex flex-col items-center text-center gap-10">
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform duration-700">
                                        <ShieldCheck className="h-12 w-12 text-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="space-y-5 italic font-black">
                                        <h4 className="text-[12px] font-black text-white uppercase tracking-[0.5em] leading-none">Security Lockdown</h4>
                                        <p className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto">
                                            Log ini telah disegel dalam vault enkripsi sistem. Seluruh data mutasi bersifat permanen untuk menjamin akuntabilitas operasional POS-KKN.
                                        </p>
                                    </div>
                                     <div className="h-px w-20 bg-emerald-500/20" />
                                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.8em]">UNMODIFIABLE_LOG</span>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* STATUS FOOTER TACTICAL */}
                    <div className="flex flex-col items-center justify-center py-10 gap-8 relative group italic">
                         <div className="flex items-center gap-6 opacity-20">
                            <Binary size={24} className="text-emerald-200" />
                            <div className="h-px w-24 bg-emerald-50" />
                            <div className="p-3 bg-emerald-950 text-emerald-400 font-black text-[9px] tracking-[0.5em] uppercase italic">INSPECTION_COMPLETED</div>
                            <div className="h-px w-24 bg-emerald-50" />
                            <Fingerprint size={24} className="text-emerald-200" />
                         </div>
                         <p className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.8em] italic opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
                             PUSAT KOMANDO AUDIT KKN UIN SAIZU • {new Date().getFullYear()}
                         </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ManifestBox({ label, value, icon: Icon, id }: { label: string; value: string; icon: LucideIcon; id: string }) {
    return (
        <div className="p-10 bg-white border border-emerald-100 shadow-sm space-y-6 hover:border-emerald-500 hover:shadow-2xl transition-all group/manifest relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover/manifest:opacity-[0.05] transition-opacity">
                 <Icon size={100} strokeWidth={1} />
            </div>
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover/manifest:bg-emerald-950 group-hover/manifest:text-white group-hover/manifest:rotate-12 transition-all shadow-sm">
                        <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-black text-emerald-300 uppercase tracking-[0.3em]">{label}</span>
                </div>
                <span className="text-[9px] font-black text-emerald-100 tabular-nums uppercase italic">{id}</span>
            </div>
            <p className="text-xl font-black text-emerald-950 uppercase tracking-tighter italic border-l-4 border-emerald-500 pl-6 leading-tight relative z-10 group-hover/manifest:translate-x-2 transition-transform duration-500">
                {value}
            </p>
        </div>
    );
}

function MetadataBox({ label, value, type }: { label: string; value: string; type: 'emerald' | 'dark' | 'highlight' }) {
    return (
        <div className="flex items-center justify-between group/meta font-black border-b border-emerald-50/50 pb-4 last:border-0 hover:translate-x-2 transition-transform">
            <span className="text-[10px] text-emerald-300 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">{label}</span>
            <span className={clsx(
                "text-[11px] italic tracking-widest uppercase px-4 py-1.5 border shadow-xl tabular-nums shadow-emerald-500/5",
                type === 'emerald' && "text-emerald-600 bg-emerald-50 border-emerald-100",
                type === 'dark' && "text-emerald-950 bg-emerald-50 border-emerald-200",
                type === 'highlight' && "text-white bg-emerald-500 border-transparent"
            )}>
                {value}
            </span>
        </div>
    );
}
