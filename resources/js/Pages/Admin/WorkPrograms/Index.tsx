import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    group: { name: string; location?: { name: string } };
}

interface Props extends PageProps {
    workPrograms: { data: WorkProgramData[] };
    filters: { status?: string };
}

export default function AdminWorkProgramsIndex({ workPrograms, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/work-programs?status=${value}` : '/admin/reports/work-programs';
        window.location.href = next;
    };

    return (
        <AppLayout title="Program Kerja">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{workPrograms.data?.length ?? 0} program</p>
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
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Judul</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Lokasi</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Diajukan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(workPrograms.data ?? []).map((p) => (
                            <tr key={p.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.title}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.group?.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.group?.location?.name ?? '-'}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.submitted_at ?? '-'}</td>
                                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            </tr>
                        ))}
                        {(workPrograms.data ?? []).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Tidak ada program kerja.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
