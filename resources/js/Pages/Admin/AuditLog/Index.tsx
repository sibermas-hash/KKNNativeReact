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
    Fingerprint
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
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                SYSTEM_AUDIT_LEDGER_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Jejak <span className="text-emerald-300 text-glow-emerald italic">Audit</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Pantauan riwayat mutasi data, aktivitas autentikasi, dan protokol administratif sistem untuk menjamin transparansi operasional KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <History className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Arsip</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{stats.total.toLocaleString()} Event</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:mx-2">
                    <StatCard label="Total Aktivitas" value={stats.total} icon={History} color="primary" />
                    <StatCard label="Aksi Berisiko" value={stats.high_risk} icon={ShieldAlert} color="rose" />
                    <StatCard label="User Administratif" value={stats.unique_users} icon={User} color="indigo" />
                    <StatCard label="Input Hari Ini" value={stats.today_logs} icon={Activity} color="emerald" />
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col lg:flex-row gap-8 lg:mx-2">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                        <input
                            placeholder="Cari berdasarkan nama, IP, atau keterangan tindakan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className="w-full h-18 pl-16 pr-8 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 outline-none focus:border-primary/50 transition-all italic uppercase placeholder:opacity-30"
                        />
                    </div>
                    <div className="lg:w-72 relative group">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-primary transition-all z-10" />
                        <select
                            value={filters.action ?? ''}
                            onChange={(e) => applyFilters({ action: e.target.value })}
                            className="w-full h-18 pl-14 pr-10 bg-white border border-slate-100rounded-lg text-[11px] font-black uppercase  text-slate-600 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer italic
                        >
                            <option value="">SEMUA TINDAKAN</option>
                            <option value="LOGIN">AUTENTIKASI_MASUK</option>
                            <option value="CREATE">PENULISAN_RECORD</option>
                            <option value="UPDATE">MODIFIKASI_RECORD</option>
                            <option value="DELETE">DESTRUKSI_RECORD</option>
                            <option value="FINALISASI">FINALISASI_OPERASI</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => applyFilters()} 
                        className="px-12 h-18 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase  hover:bg-primary-dark hover:-translate-y-1 transition-all active:scale-95 italic shrink-0"
                    >
                        Terapkan Protokol
                    </button>
                </div>

                {/* Audit Ledger */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden group lg:mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Identitas_Aktor</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Kategori_Protokol</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Rincian_Operasi</th>
                                    <th className="px-10 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic whitespace-nowrap">Waktu_Kejadian</th>
                                    <th className="px-10 py-7 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-14">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {logs.data.length > 0 ? logs.data.map((log: any) => {
                                    const cfg = getActionCfg(log.action)
                                    return (
                                        <tr key={log.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                            <td className="px-10 py-9">
                                                <div className="flex items-center gap-6">
                                                    <div className={clsx(
                                                        "h-14 w-14 rounded-lg flex items-center justify-center border transition-all italic group-hover/row:scale-110 group-hover/row:rotate-3",
                                                        cfg.bg, cfg.color, cfg.border
                                                    )}>
                                                        {cfg.icon}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 min-w-0">
                                                        <span className="text-[15px] font-black text-slate-900 group-hover/row:text-primary transition-colors italic uppercase leading-none truncate">{log.user?.name ?? 'SISTEM_AUTO'}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-5 w-5 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                                                <Globe className="h-3 w-3 text-slate-300" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 font-mono  italic leading-none opacity-60 group-hover/row:text-primary transition-colors">IP: {log.ip_address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-9">
                                                <div className={clsx(
                                                    "inline-flex px-5 py-2 rounded-lg text-[10px] font-black uppercase  italic border-none group-hover/row:scale-105 transition-transform",
                                                    cfg.bg, cfg.color
                                                )}>
                                                    {cfg.label}
                                                </div>
                                            </td>
                                            <td className="px-10 py-9">
                                                <p className="text-[14px] font-bold text-slate-500 italic line-clamp-1 max-w-[350px] uppercase opacity-70 group-hover/row:opacity-100 transition-opacity pr-4">{log.description}</p>
                                            </td>
                                            <td className="px-10 py-9 text-center">
                                                <div className="flex flex-col gap-1 whitespace-nowrap">
                                                    <span className="text-[12px] font-black text-slate-900 italic uppercase">
                                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase  italic opacity-50">STAMP_ID: {log.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-9 text-right pr-14">
                                                <Link 
                                                    href={route('admin.audit-log.show', log.id)}
                                                    className="h-12 w-12 inline-flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/40 transition-all group/btn active:scale-95"
                                                >
                                                    <Eye className="w-6 h-6 stroke-[2.5px] group-hover/btn:scale-110 transition-transform" />
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-10 opacity-30">
                                                <div className="p-10 bg-slate-50 rounded-full border border-slate-100 italic
                                                     <Terminal className="h-20 w-20 text-slate-200" />
                                                </div>
                                                <p className="text-[12px] font-black uppercase  text-slate-400 italic">SYSTEM_INFO: NO_AUDIT_LOGS_RECORDED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-10 py-9 bg-slate-50/30 border-t border-slate-100">
                        <Pagination meta={logs.meta} />
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-2">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <Lock className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">SECURITY_GOVERNANCE_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: ENCRYPTED_LEDGER_SYNC_OK</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Petunjuk Keamanan: Seluruh aktivitas administratif terekam secara otomatis dalam basis data log terenkripsi. 
                                Audit log digunakan sebagai basis validasi tindakan dan penegakan akuntabilitas akses sistem akademik UIN SAIZU.
                                Akses <span className="text-primary font-black uppercase italic">"Bypass Mode"</span> akan memicu alert prioritas pada panel kontrol utama.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">REALTIME_SECURITY_LOCK</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        Security Ledger System • Audit Core Ver. 3.2.0 • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10 ring-primary/20
        rose: 'text-rose-600 bg-rose-50 border-rose-100 ring-rose-500/20
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 ring-indigo-500/20
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-500/20
    };

    return (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-between group hover:border-primary/30 hover:-translate-y-2 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
                <Icon className="h-24 w-24" />
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className={clsx("p-5 rounded-lg border-2 transition-all group-hover:scale-110 ring-4", colors[color])}>
                    <Icon className="w-7 h-7 stroke-[2.5px]" />
                </div>
                <div className="h-3 w-3 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-primary transition-all />
            </div>
            
            <div className="space-y-2 relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase  mb-1.5 italic opacity-60 leading-none">{label}</p>
                <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-slate-900 tabular-nums italic  leading-none">{value.toLocaleString()}</p>
                    <span className="text-[10px] font-black text-slate-300 uppercase italic opacity-60">Payload_Rec</span>
                </div>
            </div>
        </div>
    )
}
