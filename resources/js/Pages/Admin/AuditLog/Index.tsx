import { useState } from 'react'
import { router, Link, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
 Eye,
 Search,
 ShieldCheck,
 History,
 Activity,
 User,
 Filter,
 ShieldAlert,
 Trash2,
 CheckCircle2,
 RotateCw,
 PlusCircle,
 LogIn,
 Lock,
 Globe,
 Terminal,
 Cpu,
 Fingerprint,
 Zap,
 ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'
import { Pagination } from '@/Components/ui'

const riskConfig: any = {
 GATE_BYPASS: { color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: <ShieldAlert className="w-5 h-5" />, label: 'BYPASS_ACCESS' },
 GATE_BYPASS_GOD_MODE: { color: 'text-rose-600', bg: 'bg-rose-100/50', border: 'border-rose-200', icon: <ShieldAlert className="w-5 h-5" />, label: 'SUPER_INTERVENTION' },
 DELETE: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <Trash2 className="w-5 h-5" />, label: 'DATA_DELETION' },
 FINALISASI: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <CheckCircle2 className="w-5 h-5" />, label: 'FINALIZATION' },
 UPDATE: { color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', icon: <RotateCw className="w-5 h-5" />, label: 'SYSTEM_UPDATE' },
 CREATE: { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <PlusCircle className="w-5 h-5" />, label: 'NEW_RECORD' },
 LOGIN: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <LogIn className="w-5 h-5" />, label: 'AUTH_LOGIN' },
}

const getActionCfg = (action: string) =>
 riskConfig[action] ??
 { color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200', icon: <Activity className="w-5 h-5" />, label: action }

export default function AuditLogIndex({ logs, stats, filters }: { logs: any; stats: any; filters: any; }) {
 const [search, setSearch] = useState(filters.search ?? '')

 const applyFilters = (extra = {}) => router.get(
 route('admin.audit-log.index'),
 { ...filters, search, ...extra },
 { preserveState: true, replace: true }
 )

 return (
 <AppLayout title="Protokol Audit Keamanan">
 <Head title="Arsip Aktivitas Sistem" />
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 SYSTEM_AUDIT_LEDGER_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <ShieldCheck className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Jejak <span className="text-primary">Audit</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <History className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Total_Record_Entry</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {stats.total.toLocaleString()} EVENTS
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Metrics Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <StatCard label="AGGREGATED_LOGS" value={stats.total} icon={History} color="primary" />
 <StatCard label="CRITICAL_ALERTS" value={stats.high_risk} icon={ShieldAlert} color="rose" />
 <StatCard label="OPERATIONAL_USERS" value={stats.unique_users} icon={User} color="indigo" />
 <StatCard label="DAILY_THROUGHPUT" value={stats.today_logs} icon={Activity} color="emerald" />
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
 <div className="flex-1 w-full xl:max-w-2xl relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_AUDIT_TRAIL (ACTOR / IP / ACTION)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>

 <div className="flex flex-wrap gap-4 w-full xl:w-auto">
 <div className="relative flex-1 xl:w-56 group">
 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors pointer-events-none" />
 <select
 value={filters.action ?? ''}
 onChange={(e) => applyFilters({ action: e.target.value })}
 className="w-full bg-white border border-slate-100 rounded-lg pl-12 pr-4 py-3 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 >
 <option value="">ALL_PROTOCOLS</option>
 <option value="LOGIN">AUTH_LOGIN</option>
 <option value="CREATE">DATA_INGESTION</option>
 <option value="UPDATE">RECORD_MUTATION</option>
 <option value="DELETE">DESTRUCTIVE_ACTION</option>
 <option value="FINALISASI">GOVERNANCE_LOCK</option>
 </select>
 </div>

 <button 
 onClick={() => applyFilters()} 
 className="px-8 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 shrink-0"
 >
 <Zap className="w-3.5 h-3.5 text-primary" />
 SYNC_LEDGER
 </button>
 </div>
 </div>

 {/* Audit Registry Ledger */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">ACTOR_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">PROTOCOL_LAYER</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">OPERATION_DETAILS</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">TIMESTAMP_ID</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">INSPECT</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {logs.data.length > 0 ? logs.data.map((log: any) => {
 const cfg = getActionCfg(log.action)
 return (
 <tr key={log.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className={clsx(
 "h-10 w-10 rounded-lg flex items-center justify-center border group-hover/row:scale-110 transition-transform",
 cfg.bg, cfg.color, cfg.border
 )}>
 {cfg.icon}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {log.user?.name ?? 'SYSTEM_KERNEL'}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Globe className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 IP: {log.ip_address}
 </span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={clsx(
 "inline-flex px-4 py-1.5 rounded-lg text-[9px] font-semibold ",
 cfg.bg, cfg.color
 )}>
 {cfg.label}
 </span>
 </td>
 <td className="px-8 py-6">
 <p className="text-[11px] font-semibold text-slate-400 line-clamp-1 max-w-[300px] opacity-40 group-hover/row:opacity-100 transition-opacity">
 {log.description}
 </p>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-col gap-1 items-center">
 <span className="text-[10px] font-semibold text-slate-900 leading-none">
 {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
 </span>
 <span className="text-[8px] font-semibold text-slate-300 opacity-50 font-mono">#{log.id}</span>
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <Link 
 href={route('admin.audit-log.show', log.id)}
 className="h-9 w-9 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 rounded-lg transition-all flex items-center justify-center group/btn"
 >
 <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
 </Link>
 </td>
 </tr>
 )
 }) : (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <Terminal className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">NO_SECURITY_EVENTS_DETECTED</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50">
 <Pagination meta={logs.meta} />
 </div>
 </div>

 {/* Operational Governance Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Lock className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">SECURITY_GOVERNANCE_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: ENCRYPTED_LEDGER_SYNC_OK</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Seluruh aktivitas administratif terekam secara otomatis dalam basis data log terenkripsi sebagai basis validasi tindakan dan penegakan akuntabilitas akses sistem KKN UIN SAIZU.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">REALTIME_SECURITY_LOCK</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Fingerprint className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 )
}

function StatCard({ label, value, icon: Icon, color }: any) {
 const colors: Record<string, string> = {
 primary: 'text-primary bg-primary/5 border-primary/10',
 rose: 'text-rose-600 bg-rose-50 border-rose-100',
 indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
 emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
 }

 return (
 <div className="bg-white p-8 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all overflow-hidden relative">
 <div className="absolute top-0 right-0 p-8 text-slate-900 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform">
 <Icon className="h-32 w-32" />
 </div>
 <div className="relative z-10">
 <p className="text-[9px] font-semibold text-slate-400 mb-1 group-hover:text-primary transition-colors">{label}</p>
 <div className="flex items-baseline gap-2">
 <p className="text-3xl font-semibold leading-none text-slate-900 transition-transform group-hover:translate-x-1">{value.toLocaleString()}</p>
 <span className="text-[8px] font-semibold text-slate-300">PAYLOAD_REC</span>
 </div>
 </div>
 <div className={clsx('p-4 rounded-lg border transition-all group-hover:rotate-12 ', colors[color])}>
 <Icon className="w-6 h-6" />
 </div>
 </div>
 )
}
