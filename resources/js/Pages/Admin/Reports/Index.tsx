import AppLayout from '@/Layouts/AppLayout';
import { Link, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    FileText,
    Video,
    Image as ImageIcon,
    Map,
    Download,
    Archive,
    Search,
    ShieldCheck,
    Clock,
    Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { StatusBadge } from '@/Components/ui';

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
    const [search, setSearch] = useState('');

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video_documentation':
                return 'Dokumentasi Video';
            case 'photo_documentation':
                return 'Dokumentasi Foto';
            case 'village_map':
                return 'Peta Desa';
            case 'attendance_sheet':
                return 'Daftar Hadir';
            case 'evaluation_report':
                return 'Laporan Evaluasi';
            case 'final_report':
                return 'Laporan Akhir';
            default:
                return type.replace(/_/g, ' ');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'video_documentation': return <Video className="h-5 w-5" />;
            case 'photo_documentation': return <ImageIcon className="h-5 w-5" />;
            case 'village_map': return <Map className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    const filteredReports = reports.data.filter((report) => {
        const haystack = [
            report.title,
            report.type,
            report.user.name,
            report.group.name,
            report.group.village,
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(search.toLowerCase());
    });

    return (
        <AppLayout title="Laporan Kegiatan KKN">
            <Head title="Manajemen Laporan" />
            
            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <Archive className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                DIGITAL_ASSET_REPOSITORY_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Repositori <span className="text-emerald-300">Dokumentasi</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Manajemen arsip digital, validasi dokumentasi visual, dan pengawasan luaran kegiatan mahasiswa berdasarkan parameter audit operasional KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Status Gateway</span>
                                <span className="text-xl font-semibold text-white ">Sinkron_Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard 
                        icon={Archive} 
                        label="Total Laporan" 
                        value={summary.total_reports} 
                        color="primary"
                    />
                    <SummaryCard 
                        icon={Clock} 
                        label="Menunggu Review" 
                        value={summary.pending_review} 
                        color="amber"
                    />
                    <div className="bg-white from-primary-dark p-7rounded-lg border border-primary flex flex-col justify-between group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-300 pointer-events-none group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[11px] font-semibold text-emerald-300 ">Audit Integritas Data</p>
                                <span className="flex h-2 w-2 rounded-lg bg-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-sm text-emerald-100/60 ">Status Verifikasi Luaran</span>
                                    <span className="text-[10px] font-semibold text-white ">100% SECURE</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-lg overflow-hidden">
                                    <div className="w-full h-full bg-emerald-400 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="relative group max-w-lg">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari laporan, mahasiswa, atau desa..."
                        className="w-full pl-14 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-sm text-slate-900 outline-none focus:border-primary/50
                    />
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Judul Dokumentasi</th>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Identitas Pengirim</th>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Lokasi Penempatan</th>
                                    <th className="px-6 py-6 text-center text-xs text-sm  text-slate-400">Status</th>
                                    <th className="px-6 py-6 text-right text-xs text-sm  text-slate-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.length > 0 ? filteredReports.map((report) => (
                                    <tr key={report.id} className="group/row hover:bg-slate-50/10">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/row:bg-primary group-hover/row:text-white
                                                    {getIcon(report.type)}
                                                </div>
                                                <div className="flex flex-col gap-1.5 max-w-sm">
                                                    <span className="text-[14px] font-semibold text-slate-900  group-hover/row:text-primary transition-colors line-clamp-1">{report.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-sm text-slate-400 ">{getTypeLabel(report.type)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-4">
                                                <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400 group-hover/row:bg-primary/10 group-hover/row:text-primary">
                                                    {report.user.name.charAt(0)}
                                                </div>
                                                <span className="text-[11px] text-sm text-slate-700 ">{report.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-semibold text-slate-900  flex items-center gap-2">
                                                    <div className="h-2 w-1 bg-primary rounded-lg" />
                                                    {report.group.name}
                                                </span>
                                                <span className="text-[9px] text-sm text-slate-400  ml-3 opacity-50 truncate max-w-[150px]">{report.group.village}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <StatusBadge status={report.status} className="px-4 py-1.5 rounded-xl text-[9px] text-sm  border-none />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex justify-end gap-2x-4 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0">
                                                <Link
                                                    href={`/reports/${report.id}/download`}
                                                    className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/50 rounded-xlactive:scale-95 group/btn"
                                                >
                                                    <Download className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-50">
                                                <div className="p-8 bg-slate-50 rounded-lg border border-slate-200
                                                    <FileText className="h-12 w-12 text-slate-200" />
                                                </div>
                                                <p className="text-[11px] text-sm text-slate-400 ">
                                                    {reports.data.length > 0 ? 'Tidak ada laporan yang cocok dengan pencarian' : 'Arsip laporan tidak ditemukan'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-center pt-8 opacity-20">
                    <p className="text-[9px] font-semibold  text-slate-300">
                        Sistem Dokumentasi Terenkripsi • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className="bg-white p-7rounded-lg border border-slate-200 relative overflow-hidden group hover:shadow-md">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className={clsx(
                        "p-4 rounded-[1.25rem] border",
                        color === 'primary' ? "bg-slate-50 text-slate-400 border-slate-200 group-hover:bg-primary/10 group-hover:text-primary" : "bg-amber-50 text-amber-500 border-amber-100"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <span className="h-2 w-2 rounded-lg bg-slate-100 group-hover:bg-primary transition-colors" />
                </div>
                <p className="text-[11px] text-sm text-slate-400  mb-2 text-sm">{label}</p>
                <div className="flex items-end gap-2">
                    <p className="text-4xl font-semibold text-slate-900 ">{value}</p>
                    <span className="text-[10px] text-sm text-slate-300  pb-1">Unit</span>
                </div>
            </div>
        </div>
    );
}
