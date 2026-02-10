import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/UI';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    group: {
        id: number;
        code: string;
        name: string;
        status: string;
        capacity: number;
        period: { name: string };
        location: { village_name: string; address?: string };
        registrations: { id: number; status: string; student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string } } }[];
        work_programs: { id: number; title: string; status: string }[];
    };
}

export default function DplGroupShow({ group }: Props) {
    return (
        <AppLayout title={group.name}>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Info Kelompok</h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Kode</dt><dd className="font-mono">{group.code}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Periode</dt><dd>{group.period.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Lokasi</dt><dd>{group.location.village_name}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={group.status} /></dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Anggota</dt><dd>{group.registrations.length}/{group.capacity}</dd></div>
                    </dl>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Program Kerja ({group.work_programs.length})</h3>
                    {group.work_programs.length === 0 ? (
                        <p className="text-sm text-slate-500">Belum ada program kerja.</p>
                    ) : (
                        <ul className="space-y-2">
                            {group.work_programs.map((wp) => (
                                <li key={wp.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="text-sm text-slate-700">{wp.title}</span>
                                    <StatusBadge status={wp.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <h3 className="mb-3 font-semibold text-slate-800">Anggota Kelompok</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">NIM</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Prodi</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {group.registrations.map((r, i) => (
                            <tr key={r.id}>
                                <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                                <td className="px-4 py-3 text-sm font-mono">{r.student.nim}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.student.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.student.program?.name ?? '-'}</td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
