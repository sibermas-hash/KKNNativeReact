import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, StatusBadge, FormSelect } from '@/Components/UI';
import type { PageProps } from '@/types';

interface RegData {
    id: number;
    status: string;
    registration_date: string;
    student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string } };
    period: { name: string };
    group: { name: string } | null;
}

interface PaginatedData {
    data: RegData[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    links?: { prev: string | null; next: string | null };
}

interface Props extends PageProps {
    registrations: PaginatedData;
    filters: { status?: string };
}

export default function RegistrationsIndex({ registrations, filters }: Props) {
    const statusFilter = useForm({ status: filters.status ?? '' });
    const statuses = [
        { value: '', label: 'Semua Status' },
        { value: 'pending', label: 'Menunggu' },
        { value: 'document_submitted', label: 'Dokumen Diajukan' },
        { value: 'approved', label: 'Disetujui' },
        { value: 'rejected', label: 'Ditolak' },
    ];

    function handleFilter(status: string) {
        statusFilter.setData('status', status);
        statusFilter.get('/admin/registrations', { preserveState: true });
    }

    return (
        <AppLayout title="Pendaftaran">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{registrations.data?.length ?? 0} pendaftaran</p>
                <FormSelect
                    options={statuses}
                    value={filters.status ?? ''}
                    onChange={(e) => handleFilter(e.target.value)}
                    className="w-48"
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">NIM</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Prodi</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Periode</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(registrations.data ?? []).map((reg) => (
                                <tr key={reg.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-mono">{reg.student.nim}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{reg.student.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{reg.student.program?.name ?? '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{reg.period.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{reg.group?.name ?? '—'}</td>
                                    <td className="px-4 py-3"><StatusBadge status={reg.status} /></td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/registrations/${reg.id}`} className="text-sm font-medium text-primary hover:text-primary-dark">
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(registrations.data ?? []).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
