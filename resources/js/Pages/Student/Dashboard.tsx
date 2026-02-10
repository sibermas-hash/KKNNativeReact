import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    DocumentTextIcon,
    CloudArrowUpIcon,
    AcademicCapIcon,
    ShieldCheckIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Props {
    student: any;
    registration: any;
    dailyReportCount: number;
    finalReport: any;
}

export default function StudentDashboard({ student, registration, dailyReportCount, finalReport }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isGroupPinned = registration?.group;

    return (
        <AppLayout title="Dashboard Mahasiswa">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                    <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary text-3xl font-bold">
                        {student?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-slate-900">Selamat Datang, {student?.name}!</h1>
                        <p className="text-slate-500">NIM: {student?.nim} • {student?.batch_year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${registration?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            Status: {registration?.status ?? 'Belum Terdaftar'}
                        </span>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Group & Location Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {isGroupPinned ? (
                            <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-indigo-100 mb-4">
                                        <MapPinIcon className="h-5 w-5" />
                                        <span className="text-sm font-semibold uppercase tracking-wider">Lokasi KKN</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">{registration.group.location?.name ?? 'Lokasi Terdaftar'}</h2>
                                    <p className="text-indigo-100 text-lg mb-8">{registration.group.name}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-indigo-200">DPL</p>
                                                <p className="font-bold">{registration.group.lecturer?.name ?? 'Belum Ditentukan'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                <CalendarIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-indigo-200">Periode</p>
                                                <p className="font-bold">{registration.period?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
                                <div className="absolute -left-10 -top-10 h-32 w-32 bg-indigo-400/20 rounded-full blur-2xl" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                                <MapPinIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-600">Belum Ada Lokasi</h3>
                                <p className="text-slate-400 mt-2 mb-6">Silakan selesaikan pendaftaran dan tunggu penempatan kelompok.</p>
                                <Link
                                    href="/student/register"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition"
                                >
                                    Daftar Sekarang <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {/* Recent Progress / Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Laporan Harian"
                                value={dailyReportCount}
                                unit="Hari"
                                icon={DocumentTextIcon}
                                color="blue"
                            />
                            <StatCard
                                title="Laporan Akhir"
                                value={finalReport ? 'Selesai' : 'Belum'}
                                icon={ShieldCheckIcon}
                                color="emerald"
                            />
                            <StatCard
                                title="Kehadiran Workshop"
                                value="2/3" // Mock behavior for now
                                icon={AcademicCapIcon}
                                color="amber"
                            />
                        </div>
                    </div>

                    {/* Right Column: Quick Actions & Notifications */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Aksi Cepat</h3>
                            <div className="space-y-3">
                                <QuickActionButton
                                    href="/student/daily-reports"
                                    icon={DocumentTextIcon}
                                    label="Tulis Logbook"
                                    color="indigo"
                                />
                                <QuickActionButton
                                    href="/student/final-report"
                                    icon={CloudArrowUpIcon}
                                    label="Unggah Laporan"
                                    color="emerald"
                                />
                                <QuickActionButton
                                    href="/student/workshops"
                                    icon={CalendarIcon}
                                    label="Ikuti Workshop"
                                    color="amber"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                                Info Penting
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-sm font-semibold mb-1">Batas Penilaian DPL</p>
                                    <p className="text-xs text-slate-400">Pastikan seluruh logbook telah di-approve sebelum 15 Maret 2026.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-sm font-semibold mb-1">Dokumentasi Video</p>
                                    <p className="text-xs text-slate-400">Video dokumentasi desa berdurasi minimal 3 menit dengan format 1080p.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, unit, icon: Icon, color }: any) {
    const colorMap: any = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
            <div className={`h-12 w-12 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6" />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
            </div>
        </div>
    );
}

function QuickActionButton({ href, icon: Icon, label, color }: any) {
    const colorMap: any = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-primary hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white',
    };
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 font-bold text-sm ${colorMap[color]}`}
        >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    );
}
