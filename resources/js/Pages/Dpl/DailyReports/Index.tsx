import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { route } from 'ziggy-js';
import type { PageProps } from '@/types';

interface ReportData {
    id: number;
    date: string;
    title: string;
    student: { name: string; nim: string };
    group: { name: string };
    status: string;
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
    filters: { status?: string };
}

export default function DplDailyReportsIndex({ reports, filters }: Props) {
    const handleApproveAll = () => {
        if (confirm('Setujui semua laporan harian yang diajukan?')) {
            router.post(route('dpl.daily-reports.batch-approve'))
        }
    }

    return (
        <AppLayout title="Laporan Harian">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">{reports.data?.length ?? 0} laporan ditemukan</p>
                    <button
                        onClick={handleApproveAll}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all
                    >
                        <CheckBadgeIcon className="w-4 h-4" />
                        Setujui Semua
                    </button>
                </div>
                <form>
                    <FormSelect
                        options={[{ value: '', label: 'Semua' }, { value: 'submitted', label: 'Diajukan' }, { value: 'approved', label: 'Disetujui' }, { value: 'revision', label: 'Revisi' }]}
                        value={filters.status ?? ''}
                        onChange={(e) => { window.location.href = `/dpl/daily-reports?status=${e.target.value}`; }}
                        className="w-40"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tanggal</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Judul</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mahasiswa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(reports.data ?? []).map((r) => (
                            <tr key={r.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.title}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.student.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.group.name}</td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/dpl/daily-reports/${r.id}`} className="text-sm font-medium text-primary hover:text-primary-dark">
                                        Review
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {(reports.data ?? []).length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada laporan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
