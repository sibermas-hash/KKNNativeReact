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
    ExclamationCircleIcon
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
            case 'video_documentation': return <VideoCameraIcon className="h-5 w-5" />;
            case 'photo_documentation': return <PhotoIcon className="h-5 w-5" />;
            case 'village_map': return <MapIcon className="h-5 w-5" />;
            default: return <DocumentIcon className="h-5 w-5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-emerald-600 bg-emerald-50';
            case 'revision_required': return 'text-amber-600 bg-amber-50';
            case 'submitted': return 'text-primary bg-primary-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    return (
        <AppLayout title="Arsip Laporan Global">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Arsip Laporan Global</h1>
                        <p className="text-sm text-slate-500">Kumpulan seluruh dokumen mahasiswa dari berbagai desa.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-2xl bg-primary p-6 text-white shadow-lg shadow-primary/20">
                        <p className="text-sm font-medium opacity-80">Total Dokumen Masuk</p>
                        <p className="text-4xl font-bold">{summary.total_reports}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Menunggu Review DPL</p>
                        <p className="text-4xl font-bold text-slate-900">{summary.pending_review}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Judul Dokumen</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Pengunggah</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Kelompok</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reports.data.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                                                {getIcon(report.type)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{report.title}</div>
                                                <div className="text-xs text-slate-500">{report.type.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600">{report.user.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-900">{report.group.name}</div>
                                        <div className="text-[10px] text-slate-500">{report.group.village}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${getStatusColor(report.status)}`}>
                                            {report.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-primary transition">
                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
