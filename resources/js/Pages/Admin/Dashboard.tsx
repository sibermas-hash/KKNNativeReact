import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    UsersIcon,
    ClipboardDocumentListIcon,
    ForwardIcon,
    AcademicCapIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    GlobeAltIcon
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
        <AppLayout title="Dashboard Admin">
            <div className="space-y-8 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600/20 to-blue-600/20 p-8 border border-white/10 backdrop-blur-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">
                                Dashboard <span className="text-emerald-400">LPPM</span> 👋
                            </h1>
                            <p className="text-slate-400 mt-2 text-lg">
                                Selamat datang kembali di Pusat Komando KKN.
                                <Deferred data="stats" fallback={<span className="ml-2 h-6 w-20 bg-white/10 animate-pulse rounded" />}>
                                    <span className="ml-2 text-white font-bold px-2 py-0.5 bg-white/10 rounded-lg">{stats?.active_period}</span>
                                </Deferred>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/admin/registrations"
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                            >
                                <UsersIcon className="h-5 w-5" />
                                Validasi Pendaftar
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <Deferred data="stats" fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)}</div>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnalyticsCard
                            title="Total Mahasiswa"
                            value={stats?.total_students}
                            icon={UsersIcon}
                            color="emerald"
                            delay={0}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Total Kelompok"
                            value={stats?.total_groups}
                            icon={AcademicCapIcon}
                            color="blue"
                            delay={100}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Dokumen Masuk"
                            value={(stats?.total_reports || 0) + (stats?.total_final_reports || 0)}
                            icon={ClipboardDocumentListIcon}
                            color="purple"
                            delay={200}
                            mounted={mounted}
                        />
                        <AnalyticsCard
                            title="Antrean Daftar"
                            value={stats?.pending_registrations}
                            icon={ForwardIcon}
                            color="orange"
                            delay={300}
                            mounted={mounted}
                        />
                    </div>
                </Deferred>

                {/* Secondary Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recently Registered Students - Glass Card */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* SDG IMPACT SECTION */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <GlobeAltIcon className="h-8 w-8 text-emerald-400" />
                                    Global Impact (SDG)
                                </h3>
                                <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Distribution Analysis
                                </div>
                            </div>

                            <Deferred data="sdg_distribution" fallback={
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/10 rounded-2xl" />)}
                                </div>
                            }>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                    {sdg_distribution && sdg_distribution.length > 0 ? (
                                        sdg_distribution.slice(0, 10).map((item: any) => {
                                            const sdg = SDG_DETAILS[item.id] || { name: 'Unknown', color: 'bg-slate-500' };
                                            const total = sdg_distribution.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                            const percentage = Math.round((item.count / total) * 100);

                                            return (
                                                <div key={item.id} className="space-y-2 group">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${sdg.color} shadow-lg shadow-current/50`} />
                                                            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate max-w-[150px]">
                                                                {sdg.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-emerald-400 transition-colors">
                                                            {item.count} PROKER
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${sdg.color} transition-all duration-1000`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <p className="text-slate-500 font-bold italic">Belum ada data dampak SDG terhitung.</p>
                                        </div>
                                    )}
                                </div>
                            </Deferred>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5 text-emerald-400" />
                                    Pendaftaran Terbaru
                                </h3>
                                <Link href="/admin/registrations" className="text-sm text-emerald-400 font-bold hover:text-emerald-300 transition">
                                    Lihat Semua →
                                </Link>
                            </div>
                            <div className="divide-y divide-white/5">
                                <Deferred data="recentRegistrations" fallback={<div className="p-12 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 animate-pulse rounded-lg" />)}</div>}>
                                    {recentRegistrations && recentRegistrations.length > 0 ? (
                                        recentRegistrations.map((reg) => (
                                            <div key={reg.id} className="p-5 hover:bg-white/5 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                                                        {reg.student?.user?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{reg.student?.user?.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{reg.student?.nim} • {reg.period?.name}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${reg.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                    reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    }`}>
                                                    {reg.status}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-500 font-medium">
                                            Belum ada pendaftaran terbaru.
                                        </div>
                                    )}
                                </Deferred>
                            </div>
                        </div>
                    </div>

                    {/* Right Rail Info */}
                    <div className="space-y-6">
                        {/* Audit Log Promo */}
                        <div className="relative overflow-hidden group rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white border border-white/10 shadow-xl">
                            <div className="absolute -top-12 -right-12 h-40 w-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
                            <ShieldCheckIcon className="h-12 w-12 text-emerald-400 mb-4" />
                            <h4 className="font-black text-2xl mb-2 tracking-tight">Kepatuhan Audit</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                                Seluruh aktivitas admin dicatat secara otomatis dalam log audit untuk memenuhi standar keamanan informasi nasional.
                            </p>
                            <Link href="/admin/audit-log" className="block text-center py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold transition border border-white/5">
                                Lihat Log Aktivitas
                            </Link>
                        </div>

                        {/* Progress Stats */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-xl">
                            <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                                Ringkasan Berkas
                            </h4>
                            <Deferred data="stats" fallback={<div className="space-y-4 animate-pulse"><div className="h-12 bg-white/5 rounded-xl" /><div className="h-12 bg-white/5 rounded-xl" /></div>}>
                                <div className="space-y-6">
                                    <ProgressItem label="Laporan Harian" value={stats?.total_reports || 0} max={100} color="from-blue-500 to-cyan-500" />
                                    <ProgressItem label="Program Kerja" value={stats?.total_work_programs || 0} max={50} color="from-indigo-500 to-purple-500" />
                                    <ProgressItem label="Laporan Akhir" value={stats?.total_final_reports || 0} max={20} color="from-emerald-500 to-teal-500" />
                                </div>
                            </Deferred>
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database Health</div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-bold text-emerald-400">OPTIMIZED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AnalyticsCard({ title, value, icon: Icon, color, delay, mounted }: any) {
    const colorClasses: any = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-orange-500/10',
    };

    return (
        <div
            className={`group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-700 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`p-4 rounded-2xl inline-block mb-4 border transition-transform duration-500 group-hover:scale-110 ${colorClasses[color]}`}>
                <Icon className="h-7 w-7" />
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{title}</p>
            <h4 className="text-4xl font-black text-white mt-2 tracking-tight group-hover:text-emerald-400 transition-colors">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </h4>
        </div>
    );
}

function ProgressItem({ label, value, max, color }: any) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2.5">
            <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-300 tracking-tight">{label}</span>
                <span className="text-xs font-black text-slate-500">{value} <span className="opacity-40">/ {max}</span></span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

