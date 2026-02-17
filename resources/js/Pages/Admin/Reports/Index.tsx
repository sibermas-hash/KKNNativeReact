import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import {
    DocumentIcon,
    VideoCameraIcon,
    PhotoIcon,
    MapIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArchiveBoxIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Report {
    id: number;
    title: string;
    type: string;
    status: string;
    file_name: string;
    submitted_at: string;
    user: { name: string };
    group: { name: string; village: string };
}

interface Props {
    reports: { data: Report[] };
    summary: { total_reports: number; pending_review: number };
}

export default function ReportsIndex({ reports, summary }: Props) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'video_documentation': return <VideoCameraIcon className="h-6 w-6" />;
            case 'photo_documentation': return <PhotoIcon className="h-6 w-6" />;
            case 'village_map': return <MapIcon className="h-6 w-6" />;
            default: return <DocumentIcon className="h-6 w-6" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'revision_required': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'submitted': return 'text-primary-light bg-primary/10 border-primary/20';
            default: return 'text-white/20 bg-white/5 border-white/10';
        }
    };

    return (
        <AppLayout title="Global Archive Nexus">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">CENTRAL REPOSITORY</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Global <span className="text-accent-gold text-glow-gold">Archive</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Secure persistence hub for scholastic field documentation and artifacts.</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6">
                        <ArchiveBoxIcon className="h-6 w-6 text-accent-gold" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">NEXUS DATA SYNC</span>
                            <span className="text-[9px] font-bold text-primary-light mt-1 tracking-widest uppercase">ENCRYPTED & PERSISTED</span>
                        </div>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">INGESTED ARTIFACTS</p>
                            <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{summary.total_reports}</p>
                            <div className="h-1 w-24 bg-primary-light mt-6 rounded-full shadow-lg shadow-primary/40" />
                        </div>
                    </div>
                    <div className="glass p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">PENDING VALIDATION</p>
                            <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{summary.pending_review}</p>
                            <div className="h-1 w-24 bg-accent-gold mt-6 rounded-full shadow-lg shadow-accent-gold/40" />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between p-4 glass rounded-[2.5rem]">
                    <div className="relative group max-w-lg flex-1">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN ARCHIVE FOR IDENTIFIERS (TITLE, SCHOLAR, BRIGADE)..."
                            className="w-full pl-14 pr-8 py-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/50 transition-all"
                        />
                    </div>
                </div>

                {/* Registry Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Artifact Identity</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Instigator</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Brigade HUB</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {reports.data.map((report) => (
                                    <tr key={report.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-accent-gold shadow-2xl group-hover:bg-accent-gold/10 transition-colors">
                                                    {getIcon(report.type)}
                                                </div>
                                                <div className="flex flex-col max-w-xs">
                                                    <span className="text-base font-black text-white tracking-tight uppercase italic group-hover:text-accent-gold transition-colors leading-none">{report.title}</span>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">{report.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <span className="text-[11px] font-bold text-white/60 tracking-wider uppercase">{report.user.name}</span>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">{report.group.name}</span>
                                                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">{report.group.village}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className={`inline-flex px-4 py-1.5 rounded-xl border text-[8px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md ${getStatusColor(report.status)}`}>
                                                {report.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-right">
                                            <button className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/20 hover:text-accent-gold hover:bg-white/10 transition-all active:scale-90 shadow-2xl">
                                                <ArrowDownTrayIcon className="h-6 w-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer UI */}
                <div className="flex items-center justify-between px-8 text-white/5 font-black uppercase tracking-[0.5em] text-[9px]">
                    <div className="flex items-center gap-4">
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>GLOBAL DATA PERSISTENCE ENABLED</span>
                    </div>
                    <p>SYSTEM VOL: ARCHIVE-NEX-01</p>
                </div>
            </div>
        </AppLayout>
    );
}
