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
}

export default function DplDashboard({ groups, pendingReports }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <AppLayout title="Dashboard DPL">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard Pembimbing</h1>
                        <p className="text-slate-500 mt-1">Kelola bimbingan dan penilaian mahasiswa KKN Anda.</p>
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
                        title="Logbook Belum Direview"
                        value={pendingReports}
                        icon={BookOpenIcon}
                        color="amber"
                        delay={100}
                        mounted={mounted}
                    />
                    <AnalyticsCard
                        title="Progres Penilaian"
                        value="65%" // Mock
                        icon={ChartBarIcon}
                        color="emerald"
                        delay={200}
                        mounted={mounted}
                    />
                </div>

                {/* My Groups List */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">Daftar Kelompok Bimbingan</h3>
                    </div>
                    {groups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {groups.map((group, idx) => (
                                <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                                            <UserGroupIcon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-slate-200 text-slate-500">
                                            {group.period?.name}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition">{group.name}</h4>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1 mb-6">
                                        <MapPinIcon className="h-4 w-4" />
                                        {group.location?.name ?? 'Lokasi Belum Ditentukan'}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Mahasiswa</p>
                                            <p className="text-xl font-bold text-slate-800">{group.registrations_count}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Logbook</p>
                                            <p className="text-xl font-bold text-slate-800">{group.daily_reports_count}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/dpl/groups/${group.id}`}
                                        className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2"
                                    >
                                        Detail Kelompok <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <UserGroupIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Belum Ada Kelompok Bimbingan</h3>
                            <p className="text-slate-400 mt-2">Silakan hubungi admin LPPM jika merasa ini adalah kesalahan.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function AnalyticsCard({ title, value, icon: Icon, color, delay, mounted }: any) {
    const colorClasses: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    };

    return (
        <div
            className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`p-4 rounded-2xl inline-block mb-4 border ${colorClasses[color]}`}>
                <Icon className="h-7 w-7" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h4 className="text-4xl font-extrabold text-slate-900 mt-1">{value}</h4>
        </div>
    );
}
