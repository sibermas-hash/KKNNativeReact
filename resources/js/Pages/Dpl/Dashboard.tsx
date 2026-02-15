import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    UserGroupIcon,
    BookOpenIcon,
    StarIcon,
    BellIcon,
    MapPinIcon,
    ArrowRightIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface Props {
    groups: any[];
    pendingReports: number;
    gradingProgress: string;
    atRiskStudents: any[];
    activityTrend: any[];
}

export default function DplDashboard({ groups, pendingReports, gradingProgress, atRiskStudents, activityTrend }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Simple heatmap data: fill in missing days for last 14 days
    const heatmap = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayData = activityTrend.find(a => String(a.date).split(' ')[0] === dateStr);
        return {
            date: dateStr,
            count: dayData ? dayData.count : 0,
            label: d.toLocaleDateString('id-ID', { weekday: 'short' })
        };
    });

    return (
        <AppLayout title="Dashboard DPL">
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pembimbing</h1>
                        <p className="text-slate-500 font-medium">Monitoring aktivitas dan evaluasi bimbingan KKN.</p>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnalyticsCard
                        title="Kelompok Dibimbing"
                        value={groups.length}
                        icon={UserGroupIcon}
                        color="blue"
                        delay={0}
                        mounted={mounted}
                    />
                    <AnalyticsCard
                        title="Logbook Menunggu"
                        value={pendingReports}
                        icon={BookOpenIcon}
                        color="amber"
                        delay={100}
                        mounted={mounted}
                    />
                    <AnalyticsCard
                        title="Progres Penilaian"
                        value={gradingProgress}
                        icon={ChartBarIcon}
                        color="emerald"
                        delay={200}
                        mounted={mounted}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Center: Groups and Heatmap */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Heatmap Section */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                                Aktivitas Logbook (14 Hari Terakhir)
                            </h3>
                            <div className="flex items-end justify-between gap-2 h-32 px-2">
                                {heatmap.map((day, i) => {
                                    const height = Math.min(100, (day.count / 10) * 100); // Scale 10 logs = 100%
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            <div
                                                className={`w-full rounded-t-lg transition-all duration-700 ${day.count > 0 ? 'bg-indigo-500' : 'bg-slate-100'}`}
                                                style={{ height: mounted ? `${height || 5}%` : '0%' }}
                                            >
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {day.count} Laporan ({day.date})
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{day.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* My Groups List */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900">Kelompok Bimbingan</h3>
                            </div>
                            {groups.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                                    {groups.map((group) => (
                                        <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                                                    <UserGroupIcon className="h-5 w-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-slate-200 text-slate-400">
                                                    {group.periode?.angkatan}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 group-hover:text-primary transition">{group.code}</h4>
                                            <div className="flex items-center gap-2 text-slate-500 text-xs mt-1 mb-6 font-medium">
                                                <MapPinIcon className="h-3.5 w-3.5" />
                                                {group.lokasi?.village_name}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <p className="text-[9px] text-slate-400 uppercase font-black">Mahasiswa</p>
                                                    <p className="text-xl font-black text-slate-800">{group.peserta_count}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                    <p className="text-[9px] text-slate-400 uppercase font-black">Logbook</p>
                                                    <p className="text-xl font-black text-slate-800">{group.kegiatan_count}</p>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/dpl/groups/${group.id}`}
                                                className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2"
                                            >
                                                Monitor Detail <ArrowRightIcon className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <UserGroupIcon className="h-16 w-16 text-slate-100 mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-slate-400">Belum Ada Kelompok</h3>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Smart Flagging / At Risk */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl min-h-[400px]">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                <BellIcon className="w-5 h-5 text-rose-500" />
                                Perlu Perhatian
                            </h3>

                            <div className="space-y-4">
                                {atRiskStudents.length > 0 ? (
                                    <>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-4">Mahasiswa Inaktif (&gt;3 Hari)</p>
                                        {atRiskStudents.slice(0, 5).map((s) => (
                                            <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-black text-white">{s.user?.name}</p>
                                                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">PASIF</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">{s.nim} · Kelp {s.peserta?.[0]?.kelompok?.code}</p>
                                            </div>
                                        ))}
                                        {atRiskStudents.length > 5 && (
                                            <p className="text-xs text-center text-slate-500 font-bold pt-2">
                                                + {atRiskStudents.length - 5} mahasiswa lainnya
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <StarIcon className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-black text-emerald-400">Semua Terpantau Aktif!</p>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">Bagus, tidak ada mahasiswa inaktif.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 p-6 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-xs font-black text-indigo-400 uppercase mb-2">💡 Tips Pembimbing</p>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    Gunakan fitur <span className="text-white italic">"Setujui Semua"</span> di menu Laporan Harian untuk mempercepat validasi logbook kelompok yang aktif.
                                </p>
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
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    };

    return (
        <div
            className={`bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`p-4 rounded-2xl inline-block mb-6 border ${colorClasses[color]}`}>
                <Icon className="h-8 w-8" />
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</p>
            <h4 className="text-5xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
        </div>
    );
}

