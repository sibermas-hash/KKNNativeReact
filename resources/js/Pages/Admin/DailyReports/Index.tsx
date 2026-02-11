import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/UI';
import type { PageProps } from '@/types';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
    filters: { status?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/daily?status=${value}` : '/admin/reports/daily';
        window.location.href = next;
    };

    return (
        <AppLayout title="Laporan Harian">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{reports.data?.length ?? 0} laporan</p>
                <form>
                    <FormSelect
                        options={[
                            { value: '', label: 'Semua' },
                            { value: 'submitted', label: 'Diajukan' },
                            { value: 'approved', label: 'Disetujui' },
                            { value: 'revision', label: 'Revisi' },
                            { value: 'draft', label: 'Draf' },
                        ]}
                        value={filters.status ?? ''}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="w-44"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tanggal</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Judul</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mahasiswa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(reports.data ?? []).map((r) => (
                            <tr key={r.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.title}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.student?.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.group?.name}</td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            </tr>
                        ))}
                        {(reports.data ?? []).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Tidak ada laporan harian.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
