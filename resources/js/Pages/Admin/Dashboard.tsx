import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Users2, FileText, CheckCircle2, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';

interface Registration {
    id: number;
    status: string;
    mahasiswa?: { nim: string; user?: { name: string; }; };
    periode?: { name: string; };
}

interface SdgDistributionItem {
    id: number;
    count: number;
}

interface DashboardStats {
    total_students: number;
    total_groups: number;
    total_reports: number;
    total_final_reports: number;
    active_period: string;
}

interface Props {
    stats?: DashboardStats;
    sdg_distribution?: SdgDistributionItem[];
    recentRegistrations?: Registration[];
}

export default function AdminDashboard({ stats, recentRegistrations }: Props & { auth: any }) {
    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6">
                <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Total Mahasiswa</p>
                        <p className="text-2xl font-bold text-slate-900">{(stats?.total_students || 0).toLocaleString()}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Kelompok Aktif</p>
                        <p className="text-2xl font-bold text-slate-900">{(stats?.total_groups || 0).toLocaleString()}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Laporan Masuk</p>
                        <p className="text-2xl font-bold text-slate-900">{(stats?.total_reports || 0).toLocaleString()}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Laporan Akhir</p>
                        <p className="text-2xl font-bold text-slate-900">{(stats?.total_final_reports || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">Pendaftaran Terbaru</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Nama</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">NIM</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Periode</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {recentRegistrations && recentRegistrations.length > 0 ? (
                                    recentRegistrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2">{reg.mahasiswa?.user?.name || '-'}</td>
                                            <td className="px-4 py-2 text-slate-500">{reg.mahasiswa?.nim || '-'}</td>
                                            <td className="px-4 py-2 text-slate-500">{reg.periode?.name || '-'}</td>
                                            <td className="px-4 py-2">
                                                <span className={clsx(
                                                    "text-xs px-2 py-1 rounded",
                                                    reg.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-rose-100 text-rose-700'
                                                )}>
                                                    {reg.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Belum ada data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
