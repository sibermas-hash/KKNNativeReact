import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    UsersIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    SparklesIcon,
    ChartPieIcon,
    ArrowUpRightIcon,
    RectangleGroupIcon,
    UserPlusIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { Deferred } from '@inertiajs/react';

const SDG_DETAILS: Record<number, { name: string; color: string }> = {
    1: { name: 'Tanpa Kemiskinan', color: 'bg-[#E5243B]' },
    2: { name: 'Tanpa Kelaparan', color: 'bg-[#DDA63A]' },
    3: { name: 'Kehidupan Sehat & Sejahtera', color: 'bg-[#4C9F38]' },
    4: { name: 'Pendidikan Berkualitas', color: 'bg-[#C5192D]' },
    5: { name: 'Kesetaraan Gender', color: 'bg-[#FF3A21]' },
    6: { name: 'Air Bersih & Sanitasi', color: 'bg-[#26BDE2]' },
    7: { name: 'Energi Bersih & Terjangkau', color: 'bg-[#FCC30B]' },
    8: { name: 'Pekerjaan Layak & Pertumbuhan Ekonomi', color: 'bg-[#A21942]' },
    9: { name: 'Industri, Inovasi & Infrastruktur', color: 'bg-[#FD6925]' },
    10: { name: 'Berkurangnya Kesenjangan', color: 'bg-[#DD1367]' },
    11: { name: 'Kota & Pemukiman Berkelanjutan', color: 'bg-[#FD9D24]' },
    12: { name: 'Konsumsi & Produksi Bertanggung Jawab', color: 'bg-[#BF8B2E]' },
    13: { name: 'Penanganan Perubahan Iklim', color: 'bg-[#3F7E44]' },
    14: { name: 'Ekosistem Lautan', color: 'bg-[#0A97D9]' },
    15: { name: 'Ekosistem Daratan', color: 'bg-[#56C02B]' },
    16: { name: 'Perdamaian, Keadilan & Kelembagaan Kuat', color: 'bg-[#00689D]' },
    17: { name: 'Kemitraan untuk Mencapai Tujuan', color: 'bg-[#19486A]' },
};

interface Props {
    stats?: {
        total_students: number;
        total_groups: number;
        total_reports: number;
        pending_registrations: number;
        active_period: string;
        total_work_programs: number;
        total_final_reports: number;
    };
    sdg_distribution?: { id: number; count: number }[];
    recentRegistrations?: any[];
}

export default function AdminDashboard({ stats, sdg_distribution, recentRegistrations }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <AppLayout title="Academic Intelligence Dashboard">
            <div className="space-y-16 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">MODIFIED 2026 PROXIMITY</div>
                            <div className="w-2 h-2 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                            Management <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3 font-medium uppercase tracking-widest">Orchestrating academic impact across the regional ecosystem.</p>
                    </div>

                    <Link href="/admin/validate" className="group flex items-center gap-3 px-10 py-6 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] hover:-rotate-1 transition-all active:scale-95 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <CheckBadgeIcon className="w-6 h-6 text-accent-gold" />
                        <span className="text-xs font-black uppercase tracking-ultrawide">VALIDATE CANDIDATES</span>
                    </Link>
                </div>

                {/* Prestige Stats - Inspired by youware.app */}
                <Deferred data="stats" fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-8">{[1, 2, 3, 4].map(i => <div key={i} className="h-44 glass animate-pulse rounded-[2.5rem]" />)}</div>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <PrestigeStat
                            label="TOTAL SCHOLARS"
                            value={stats?.total_students}
                            delay={0}
                            mounted={mounted}
                        />
                        <PrestigeStat
                            label="ACTIVE BRIGADES"
                            value={stats?.total_groups}
                            delay={100}
                            mounted={mounted}
                        />
                        <PrestigeStat
                            label="UPLINKED REPORTS"
                            value={(stats?.total_reports || 0) + (stats?.total_final_reports || 0)}
                            delay={200}
                            mounted={mounted}
                        />
                        <PrestigeStat
                            label="CERTIFIED IMPACT"
                            value={stats?.total_final_reports}
                            delay={300}
                            mounted={mounted}
                        />
                    </div>
                </Deferred>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Feed Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* SDG Impact Analysis Card */}
                        <div className="glass rounded-[3rem] shadow-2xl p-12 group overflow-hidden relative">
                            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-accent-gold/10 text-accent-gold rounded-[1.5rem] border border-accent-gold/20 shadow-lg shadow-accent-gold/5">
                                            <ChartPieIcon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Sustainability Metrics</h3>
                                            <p className="text-[10px] font-black text-accent-gold/40 mt-3 tracking-ultrawide uppercase">Global Alignment Tracker</p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-ultrawide">REAL-TIME ANALYTICS</span>
                                    </div>
                                </div>

                                <Deferred data="sdg_distribution" fallback={<div className="h-80 bg-white/5 animate-pulse rounded-3xl" />}>
                                    {sdg_distribution && sdg_distribution.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-20 gap-y-12">
                                            {sdg_distribution.slice(0, 10).map((item: any) => {
                                                const sdg = SDG_DETAILS[item.id] || { name: 'Unknown', color: 'bg-white/20' };
                                                const total = sdg_distribution.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                                const percentage = Math.round((item.count / total) * 100);

                                                return (
                                                    <div key={item.id} className="space-y-5 group/item cursor-default">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-4 h-4 rounded-full ${sdg.color} shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover/item:scale-150 transition-all duration-700`} />
                                                                <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover/item:text-accent-gold transition-all truncate max-w-[200px]">
                                                                    {sdg.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-white/20 tabular-nums bg-white/[0.02] px-3 py-1 rounded-lg border border-white/5">
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                                            <div
                                                                className={`h-full ${sdg.color} transition-all duration-[2s] ease-out rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] opacity-60 group-hover/item:opacity-100`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                                            <SparklesIcon className="h-16 w-16 text-white/5 mx-auto mb-6" />
                                            <p className="text-white/20 font-black text-[10px] uppercase tracking-ultrawide">Inert Impact Analysis Detected</p>
                                        </div>
                                    )}
                                </Deferred>
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="glass rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="p-12 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary/20 text-primary-light rounded-2xl border border-primary/20 leading-none">
                                        <UserPlusIcon className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Interaction Log</h3>
                                </div>
                                <Link href="/admin/registrations" className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-ultrawide text-accent-gold transition-all">AUDIT LEDGER →</Link>
                            </div>
                            <div className="divide-y divide-white/[0.03]">
                                <Deferred data="recentRegistrations" fallback={<div className="p-12 space-y-8">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)}</div>}>
                                    {recentRegistrations && recentRegistrations.length > 0 ? (
                                        recentRegistrations.map((reg) => (
                                            <div key={reg.id} className="p-10 hover:bg-white/[0.04] transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center text-xl font-black text-white group-hover:from-primary group-hover:to-primary-dark transition-all shadow-xl group-hover:shadow-primary/30 relative">
                                                        {reg.student?.user?.name?.charAt(0)}
                                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent-gold border-[3px] border-[#080808] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-widest text-base text-white/90 group-hover:text-accent-gold transition-colors">{reg.student?.user?.name}</p>
                                                        <div className="flex items-center gap-4 mt-2.5">
                                                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg italic border border-white/5">{reg.student?.nim}</span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                            <span className="text-[10px] text-primary-light font-black uppercase tracking-ultrawide">{reg.period?.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-ultrawide border shadow-2xl backdrop-blur-md transition-all group-hover:scale-110 overflow-hidden relative ${reg.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5' :
                                                    reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' :
                                                        'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
                                                    }`}>
                                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <span className="relative z-10">{reg.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-24 text-center text-white/10 font-black uppercase tracking-ultrawide italic">No registration protocols detected.</div>
                                    )}
                                </Deferred>
                            </div>
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="space-y-12">
                        {/* Security Ledger Card */}
                        <div className="bg-gradient-to-br from-surface-panel to-black rounded-[3rem] p-12 text-white relative overflow-hidden group border border-white/10 shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-gold/5 blur-[100px] rounded-full" />

                            <div className="relative z-10">
                                <div className="w-20 h-20 glass rounded-[1.5rem] mb-10 flex items-center justify-center transition-all duration-700 group-hover:rotate-[360deg] group-hover:border-accent-gold/40">
                                    <ShieldCheckIcon className="h-10 w-10 text-accent-gold text-glow-gold" />
                                </div>
                                <h4 className="text-4xl font-black tracking-tighter mb-5 uppercase italic">Integrity <span className="text-accent-gold italic">Sentinel</span></h4>
                                <p className="text-white/30 text-sm font-medium leading-relaxed mb-12 uppercase tracking-widest text-[11px]">
                                    All administrative protocols are monitored and logged within the immutable audit trail.
                                </p>
                                <Link href="/admin/audit-log" className="flex items-center justify-center gap-4 w-full py-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-ultrawide transition-all group-hover:border-accent-gold/30 group-hover:text-accent-gold active:scale-95 shadow-lg">
                                    SECURITY LEDGER
                                    <ArrowUpRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Critical Metrics - Progress Circle Vibe */}
                        <div className="glass rounded-[3rem] shadow-2xl p-12 text-white">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="p-4 bg-accent-gold/10 text-accent-gold rounded-[1.5rem] border border-accent-gold/20 shadow-lg">
                                    <ChartPieIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Telemetry</h4>
                                    <p className="text-[10px] font-black text-white/20 mt-3 uppercase tracking-ultrawide">DOCUMENT FLOW STATUS</p>
                                </div>
                            </div>
                            <Deferred data="stats" fallback={<div className="space-y-10 animate-pulse"><div className="h-16 bg-white/5 rounded-2xl" /><div className="h-16 bg-white/5 rounded-2xl" /></div>}>
                                <div className="space-y-12">
                                    <ProgressItem label="Operation Daily Logs" value={stats?.total_reports || 0} max={100} />
                                    <ProgressItem label="Strategic Blueprints" value={stats?.total_work_programs || 0} max={50} />
                                    <ProgressItem label="Impact Assessments" value={stats?.total_final_reports || 0} max={20} />
                                </div>
                            </Deferred>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PrestigeStat({ label, value, delay, mounted }: any) {
    return (
        <div
            className={`group glass rounded-[2.5rem] p-10 transition-all duration-1000 hover:shadow-primary/10 hover:-translate-y-3 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <h4 className="text-6xl font-black text-white mb-4 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-700">
                {typeof value === 'number' ? value.toLocaleString() : (value || 0)}
            </h4>
            <p className="text-[11px] font-black text-accent-gold tracking-ultrawide uppercase opacity-60 group-hover:opacity-100 transition-all">{label}</p>

            <div className="mt-8 pt-8 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-gold w-1/4 animate-shimmer" />
                </div>
            </div>
        </div>
    );
}

function ProgressItem({ label, value, max }: any) {
    const percentage = Math.min((value / (max || 1)) * 100, 100);
    return (
        <div className="space-y-5 group/prog">
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-white/40 tracking-ultrawide uppercase italic group-hover/prog:text-accent-gold transition-colors">{label}</span>
                <span className="text-[11px] font-black text-white/20 tabular-nums bg-white/[0.02] px-3 py-1 rounded-lg border border-white/5">
                    {value} <span className="opacity-10">/</span> {max}
                </span>
            </div>
            <div className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px] shadow-2xl">
                <div
                    className="h-full bg-gradient-to-r from-primary via-primary-light to-accent-gold rounded-full transition-all duration-[2.5s] ease-out shadow-[0_0_20px_rgba(0,135,90,0.3)]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
