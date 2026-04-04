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
 Activity,
 Zap,
 ChevronLeft,
} from 'lucide-react';
import { route } from 'ziggy-js';
import VisualDiff from '@/Components/VisualDiff';
import { clsx } from 'clsx';

export default function AuditLogShow({ log }: { log: any }) {
 const severityMap: any = {
 high: 'bg-rose-50 text-rose-600 border-rose-100',
 critical: 'bg-rose-100 text-rose-700 border-rose-200',
 default: 'bg-emerald-50 text-emerald-600 border-emerald-100'
 };

 const currentSeverity = log.severity === 'high' || log.action === 'DELETE' || log.action === 'GATE_BYPASS' ? 'high' : 'default';

 return (
 <AppLayout title="Detail Log Aktivitas">
 <Head title={`Detail Aktivitas #${log.id}`} />

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 AUDIT_INSPECTION_CORE_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <Link href={route('admin.audit-log.index')} className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all ">
 <ChevronLeft className="h-4 w-4" />
 </Link>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Detail <span className="text-primary">Aktivitas</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Clock className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Recorded_Stamp</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Main Hero Summary Card */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="absolute top-0 right-0 p-16 text-slate-900 opacity-[0.02] pointer-events-none ">
 <Activity className="h-[30rem] w-[30rem]" />
 </div>
 
 <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
 <div className="flex items-center gap-8">
 <div className="h-20 w-20 rounded-lg bg-slate-900 border border-slate-800 text-primary text-3xl font-semibold flex items-center justify-center">
 {log.action === 'DELETE' ? '🗑️' : log.action === 'LOGIN' ? '🔐' : '📝'}
 </div>
 <div className="space-y-4">
 <div className="flex items-center gap-6">
 <h2 className="text-4xl font-semibold text-slate-900 leading-none">{log.action || 'ACTIVITY'}</h2>
 <span className={clsx("px-4 py-1.5 rounded-lg text-[10px] font-semibold border", severityMap[currentSeverity])}>
 {currentSeverity === 'high' ? 'CRITICAL_ALERT' : 'STABLE_PROTOCOL'}
 </span>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 opacity-50">
 <span>STAMP_ID: #{log.id}</span>
 <div className="h-1 w-1 rounded-full bg-slate-200" />
 <span>STATUS: AUDIT_LOCKED</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-lg border border-slate-100">
 <History className="w-5 h-5 text-primary" />
 <div className="text-left min-w-[150px]">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-1.5">Registry_Reference</span>
 <span className="text-[11px] font-semibold text-slate-700 leading-none block">
 {log.model_type?.split('\\').pop() || 'SYSTEM'} :: {log.model_id || 'LOCAL'}
 </span>
 </div>
 </div>
 </div>

 <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 bg-slate-50/20">
 <AttributeItem 
 label="ACTOR_IDENTITY" 
 title={log.user?.name ?? 'SYSTEM_KERNEL'} 
 subtitle={log.user?.email ?? 'INTERNAL_SYSCALL_PROCESS'} 
 icon={User} 
 />
 <AttributeItem 
 label="CHRONO_STAMP" 
 title={format(new Date(log.created_at), 'dd MMM yyyy', { locale: id }).toUpperCase()} 
 subtitle={format(new Date(log.created_at), 'HH:mm:ss')} 
 icon={Clock} 
 />
 <AttributeItem 
 label="ORIGIN_VECTOR" 
 title={log.ip_address} 
 subtitle={log.user_agent?.split(' ')[0] || 'UNDEFINED_PROTOCOL'} 
 icon={Globe} 
 />
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Technical Specification */}
 <div className="lg:col-span-1 space-y-8">
 <section className="bg-white rounded-lg p-8 border border-slate-100 relative overflow-hidden group/spec">
 <div className="absolute -bottom-6 -left-6 text-slate-900 opacity-[0.02] pointer-events-none transition-transform">
 <Terminal className="h-48 w-48" />
 </div>
 
 <div className="flex items-center gap-4 mb-8">
 <div className="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
 <Terminal className="w-5 h-5" />
 </div>
 <h3 className="text-[11px] font-semibold text-slate-900">TECHNICAL_MANIFEST</h3>
 </div>
 <div className="space-y-8 relative z-10">
 <div className="space-y-3">
 <span className="text-[9px] font-semibold text-slate-400 ml-1">AUTHORIZATION_ABILITY</span>
 <code className="block px-5 py-4 rounded-lg bg-slate-900 text-primary font-mono text-[11px] font-semibold border border-slate-800">
 {log.ability ?? 'SYSCALL_LEVEL_0'}
 </code>
 </div>
 <div className="h-px bg-slate-50" />
 <div className="space-y-3">
 <span className="text-[9px] font-semibold text-slate-400 ml-1">OPERATION_DESCRIPTION</span>
 <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pl-2 border-l-2 border-primary/20">
 {log.description || 'NO_ADDITIONAL_MANIFEST_PROVIDED'}
 </p>
 </div>
 <div className="pt-4 border-t border-slate-50">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
 <Fingerprint className="h-3.5 w-3.5 text-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">INTEGRITY_VERIFIED</span>
 </div>
 </div>
 </div>
 </section>

 <div className="bg-slate-900 rounded-lg p-8 text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 opacity-10 text-primary ">
 <ShieldCheck className="w-64 h-64" />
 </div>
 <div className="relative z-10 flex flex-col items-center text-center space-y-6">
 <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white mb-2">SECURITY_ENFORCEMENT</h4>
 <p className="text-[10px] text-slate-500 font-semibold leading-relaxed opacity-75">
 Seluruh perubahan mutasi data dicatat secara mutlak dalam lapisan enkripsi demi menjamin transparansi kedaulatan informasi akademik KKN UIN SAIZU.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Mutation Inspector */}
 <div className="lg:col-span-2 bg-white rounded-lg p-8 border border-slate-100 group relative overflow-hidden">
 <div className="absolute -top-10 -right-10 text-slate-900 opacity-[0.02] pointer-events-none transition-transform group-hover:-rotate-12">
 <Cpu className="h-96 w-96" />
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
 <FileText className="w-6 h-6" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-[11px] font-semibold text-slate-900 leading-none mb-1.5">Mutation_Inspector</h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 leading-none">DATA_VARIANCE_DIFF_ENGINE</span>
 </div>
 </div>
 </div>

 <div className="bg-slate-50 rounded-lg border border-slate-100 p-8 relative z-10">
 <div className="max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
 <VisualDiff oldValues={log.old_values} newValues={log.new_values} />
 </div>
 </div>
 
 <div className="mt-8 p-8 bg-slate-50/50 rounded-lg border border-slate-100 relative z-10">
 <div className="flex flex-col md:flex-row md:items-center gap-6">
 <div className="p-3 bg-white rounded-lg border border-slate-100 text-primary ">
 <Scale className="h-5 w-5" />
 </div>
 <div className="space-y-1">
 <h4 className="text-[11px] font-semibold text-slate-900 leading-none">ANALYTIC_INSIGHT</h4>
 <p className="text-[9px] font-semibold text-slate-400 leading-relaxed opacity-75 max-w-2xl">
 Perbandingan diferensial di atas menunjukkan perbedaan antara kondisi record sebelum (MANIFEST_OLD) dan sesudah (MANIFEST_NEW) tindakan dieksekusi.
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
 <div className="flex items-center gap-3">
 <Icon className="w-3.5 h-3.5 text-primary " />
 <span className="text-[9px] font-semibold text-slate-400 leading-none">{label}</span>
 </div>
 <div className="pl-6 border-l-2 border-slate-100 group-hover/attr:border-primary transition-all">
 <p className="text-slate-900 font-semibold text-xl mb-1 truncate">{title}</p>
 <p className="text-[10px] font-semibold text-slate-400 opacity-50 leading-none">{subtitle}</p>
 </div>
 </div>
 );
}
