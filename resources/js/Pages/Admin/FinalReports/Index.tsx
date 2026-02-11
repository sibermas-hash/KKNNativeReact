import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';

interface FinalReportData {
    id: number;
    title: string;
    status: string;
    score: string | number | null;
    submitted_at: string | null;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: FinalReportData[] };
    filters: { status?: string };
}

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/final?status=${value}` : '/admin/reports/final';
        window.location.href = next;
    };

    return (
        <AppLayout title="Laporan Akhir">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{reports.data?.length ?? 0} laporan</p>
                <form>
                    <FormSelect
                        options={[
                            { value: '', label: 'Semua' },
                            { value: 'submitted', label: 'Diajukan' },
                            { value: 'reviewed', label: 'Direview' },
                            { value: 'approved', label: 'Disetujui' },
                            { value: 'revision', label: 'Revisi' },
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
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Judul</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mahasiswa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Diajukan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nilai</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(reports.data ?? []).map((r) => (
                            <tr key={r.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.title}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.student?.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.group?.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.submitted_at ?? '-'}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.score ?? '-'}</td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            </tr>
                        ))}
                        {(reports.data ?? []).length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Tidak ada laporan akhir.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
