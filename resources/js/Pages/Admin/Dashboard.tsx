import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    UsersIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    SparklesIcon,
    ChartPieIcon,
    ArrowUpRightIcon,
    RectangleGroupIcon,
    UserPlusIcon
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
        <AppLayout title="Dashboard Analysis">
            <div className="space-y-10 pb-16 animate-in fade-in duration-700">
                {/* Modern Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">Admin Control</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400">Update Real-time 2026</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            Overview <span className="text-primary italic">Intelligence</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/admin/registrations"
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                            Validasi Mahasiswa
                        </Link>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <Deferred data="stats" fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white animate-pulse rounded-xl border border-slate-100" />)}</div>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnalyticsCard
                            title="Total Mahasiswa"
                            value={stats?.total_students}
                            icon={UsersIcon}
                            color="teal"
                            delay={0}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Total Kelompok"
                            value={stats?.total_groups}
                            icon={RectangleGroupIcon}
                            color="slate"
                            delay={100}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Laporan Masuk"
                            value={(stats?.total_reports || 0) + (stats?.total_final_reports || 0)}
                            icon={DocumentTextIcon}
                            color="teal"
                            delay={200}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Penerbitan Sertifikat"
                            value={stats?.total_final_reports}
                            icon={ShieldCheckIcon}
                            color="slate"
                            delay={300}
                            mounted={mounted}
                        />
                    </div>
                </Deferred>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
                    {/* Main Feed Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* SDG Impact Analysis Card */}
                        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <GlobeAltIcon className="h-40 w-40 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/5 text-primary rounded-xl">
                                            <ChartPieIcon className="h-6 w-6" />
                                        </div>
                                        SDG Alignment Distribution
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Analytics Data</span>
                                </div>

                                <Deferred data="sdg_distribution" fallback={<div className="h-64 bg-slate-50 animate-pulse rounded-xl" />}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                                        {sdg_distribution && sdg_distribution.length > 0 ? (
                                            sdg_distribution.slice(0, 10).map((item: any) => {
                                                const sdg = SDG_DETAILS[item.id] || { name: 'Unknown', color: 'bg-slate-500' };
                                                const total = sdg_distribution.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                                const percentage = Math.round((item.count / total) * 100);

                                                return (
                                                    <div key={item.id} className="space-y-3 group/item">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex items-center gap-3 text-slate-900">
                                                                <div className={`w-3 h-3 rounded-md ${sdg.color} shadow-sm group-hover/item:scale-125 transition-transform`} />
                                                                <span className="text-xs font-black uppercase tracking-tight group-hover/item:text-primary transition-colors truncate max-w-[150px]">
                                                                    {sdg.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 tabular-nums">
                                                                {item.count} PROKER
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/60">
                                                            <div
                                                                className={`h-full ${sdg.color} transition-all duration-[1s] ease-out rounded-full shadow-lg opacity-80 group-hover/item:opacity-100`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                                <SparklesIcon className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initial impact analysis pending</p>
                                            </div>
                                        )}
                                    </div>
                                </Deferred>
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden text-slate-900">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-3 italic">
                                    <UserPlusIcon className="h-6 w-6 text-primary" />
                                    Latest Interactions
                                </h3>
                                <Link href="/admin/registrations" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View Ledger →</Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                <Deferred data="recentRegistrations" fallback={<div className="p-12 space-y-6">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-xl" />)}</div>}>
                                    {recentRegistrations && recentRegistrations.length > 0 ? (
                                        recentRegistrations.map((reg) => (
                                            <div key={reg.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-5 text-slate-900">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-black group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                        {reg.student?.user?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-tight text-sm leading-none transition-colors group-hover:text-primary">{reg.student?.user?.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{reg.student?.nim} • {reg.period?.name}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${reg.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    reg.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {reg.status}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-16 text-center text-slate-400 italic">No recent registrations detected in the system.</div>
                                    )}
                                </Deferred>
                            </div>
                        </div>
                    </div>

                    {/* Meta/Rail Content */}
                    <div className="space-y-8">
                        {/* Audit Summary Card */}
                        <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <ShieldCheckIcon className="h-12 w-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
                                <h4 className="text-2xl font-black tracking-tighter mb-4 leading-none uppercase">Security Oversight</h4>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 opacity-80">
                                    Full traceability of all administrative actions. Compliance with data integrity protocols verified.
                                </p>
                                <Link href="/admin/audit-log" className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Enter Security Log
                                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Document Progress Summary */}
                        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 text-slate-900">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-primary/5 text-primary rounded-xl">
                                    <DocumentTextIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black tracking-tight leading-none italic uppercase">Metrics</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Documents Progress</p>
                                </div>
                            </div>
                            <Deferred data="stats" fallback={<div className="space-y-6 animate-pulse"><div className="h-10 bg-slate-50 rounded-lg" /><div className="h-10 bg-slate-50 rounded-lg" /></div>}>
                                <div className="space-y-6">
                                    <ProgressItem label="Daily Activity" value={stats?.total_reports || 0} max={100} />
                                    <ProgressItem label="Operational Plans" value={stats?.total_work_programs || 0} max={50} />
                                    <ProgressItem label="Final Assessment" value={stats?.total_final_reports || 0} max={20} />
                                </div>
                            </Deferred>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AnalyticsCard({ title, value, icon: Icon, color, delay, mounted }: any) {
    return (
        <div
            className={`group bg-white rounded-xl border border-slate-200/60 p-6 transition-all duration-700 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`p-3.5 rounded-xl inline-block mb-4 border transition-all duration-500 group-hover:scale-110 group-hover:shadow-md ${color === 'teal' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                <Icon className="h-7 w-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{title}</p>
            <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : (value || 0)}
            </h4>
        </div>
    );
}

function ProgressItem({ label, value, max }: any) {
    const percentage = Math.min((value / (max || 1)) * 100, 100);
    return (
        <div className="space-y-2 group/prog">
            <div className="flex justify-between items-end px-1">
                <span className="text-xs font-black text-slate-800 tracking-tight group-hover/prog:text-primary transition-colors">{label}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums">
                    {value} / {max}
                </span>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-[1.2s] ease-out shadow-sm"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
