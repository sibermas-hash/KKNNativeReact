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
    ArrowRightIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

interface Props {
    student: any;
    registration: any;
    dailyReportCount: number;
    finalReport: any;
}

export default function StudentDashboard({ student, registration, dailyReportCount, finalReport }: Props) {
    const isGroupPinned = registration?.group;

    return (
        <AppLayout title="Personal Command Center">
            <div className="space-y-10 pb-16 animate-in fade-in duration-700">
                {/* Modern Hero Section */}
                <div className="bg-white rounded-[2rem] border border-slate-200/60 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <SparklesIcon className="h-40 w-40 text-primary" />
                    </div>

                    <div className="relative z-10">
                        <div className="h-24 w-24 rounded-[1.5rem] bg-primary text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
                            {student?.name?.charAt(0)}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">Student Node</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student?.nim}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            Welcome back, <span className="text-primary italic">{student?.name?.split(' ')[0]}</span>!
                        </h1>
                        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Academic Batch {student?.batch_year}</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
                        <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${registration?.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                            STATUS: {registration?.status ?? 'UNREGISTERED'}
                        </div>
                        {registration?.status === 'approved' && (
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Session Active</p>
                        )}
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Group & Location Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {isGroupPinned ? (
                            <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 text-primary mb-6">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <MapPinIcon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Location</span>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter mb-2 italic">{registration.group.location?.name ?? 'Assigned Location'}</h2>
                                    <p className="text-slate-400 text-lg font-bold uppercase tracking-widest mb-10 opacity-80">{registration.group.name}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <UserIcon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Supervisor (DPL)</p>
                                                <p className="font-black text-lg tracking-tight leading-none">{registration.group.lecturer?.name ?? 'TBA'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <CalendarIcon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Cycle</p>
                                                <p className="font-black text-lg tracking-tight leading-none">{registration.period?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-primary/10 rounded-full blur-[100px]" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-16 text-center group transition-all hover:border-primary/40 hover:bg-primary/5">
                                <MapPinIcon className="h-16 w-16 text-slate-200 mx-auto mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all" />
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Penempatan Pending</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Data kelompok belum tersedia atau masih diproses.</p>
                                <Link
                                    href="/student/register"
                                    className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:-translate-y-1"
                                >
                                    Selesaikan Pendaftaran <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {/* Recent Progress / Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Logs Submitted"
                                value={dailyReportCount}
                                unit="Reports"
                                icon={DocumentTextIcon}
                                color="teal"
                            />
                            <StatCard
                                title="Final Status"
                                value={finalReport ? 'SUBMITTED' : 'PENDING'}
                                icon={ShieldCheckIcon}
                                color="teal"
                            />
                            <StatCard
                                title="Academic Workshop"
                                value="2 / 3"
                                icon={AcademicCapIcon}
                                color="slate"
                            />
                        </div>
                    </div>

                    {/* Right Column: Quick Actions & Notifications */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3 mb-8">
                                <SparklesIcon className="h-6 w-6 text-primary" />
                                Quick Operations
                            </h3>
                            <div className="space-y-4">
                                <QuickActionButton
                                    href="/student/daily-reports"
                                    icon={DocumentTextIcon}
                                    label="Logbook Submission"
                                    desc="Record daily field activities"
                                />
                                <QuickActionButton
                                    href="/student/final-report"
                                    icon={CloudArrowUpIcon}
                                    label="Upload Documentation"
                                    desc="Submit final outcome files"
                                />
                                <QuickActionButton
                                    href="/student/workshops"
                                    icon={CalendarIcon}
                                    label="Workshop Agenda"
                                    desc="View mandatory schedules"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tighter">
                                <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                                Critical Briefing
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Grading Deadline</p>
                                    <p className="text-sm font-bold text-slate-200 leading-tight">Pastikan seluruh logbook telah di-approve sebelum 15 Maret 2026.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Video Outcome</p>
                                    <p className="text-sm font-bold text-slate-200 leading-tight">Video dokumentasi durasi minimal 3 menit dengan format HD 1080p.</p>
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
    return (
        <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-8 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all group">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 border transition-all group-hover:scale-110 shadow-sm ${color === 'teal' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                <Icon className="h-7 w-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{title}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
                {unit && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
            </div>
        </div>
    );
}

function QuickActionButton({ href, icon: Icon, label, desc }: any) {
    return (
        <Link
            href={href}
            className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:border-primary/30 hover:shadow-md group"
        >
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/20 transition-all">
                <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
                <p className="font-black text-sm text-slate-900 leading-none group-hover:text-primary transition-colors uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest truncate">{desc}</p>
            </div>
        </Link>
    );
}
