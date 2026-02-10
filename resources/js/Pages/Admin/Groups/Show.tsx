import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/UI';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    group: {
        id: number;
        code: string;
        name: string;
        token: string;
        capacity: number;
        status: string;
        period: { name: string };
        location: { village_name: string; address?: string };
        lecturer: { name: string; nip: string } | null;
        registrations: { id: number; status: string; student: { nim: string; name: string } }[];
        work_programs: { id: number; title: string; status: string }[];
    };
}

export default function GroupShow({ group }: Props) {
    return (
        <AppLayout title={`Kelompok: ${group.name}`}>
            {/* Info */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Informasi Kelompok</h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Kode</dt><dd className="font-mono text-slate-800">{group.code}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Token</dt><dd className="font-mono text-slate-800">{group.token}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Periode</dt><dd className="text-slate-800">{group.period.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Kapasitas</dt><dd className="text-slate-800">{group.registrations.length}/{group.capacity}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={group.status} /></dd></div>
                    </dl>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 font-semibold text-slate-800">Lokasi</h3>
                        <p className="text-sm font-medium text-slate-800">{group.location.village_name}</p>
                        {group.location.address && <p className="mt-1 text-sm text-slate-500">{group.location.address}</p>}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 font-semibold text-slate-800">DPL</h3>
                        {group.lecturer ? (
                            <div>
                                <p className="text-sm font-medium text-slate-800">{group.lecturer.name}</p>
                                <p className="text-xs text-slate-500">NIP: {group.lecturer.nip}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Belum ditugaskan</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Members */}
            <h3 className="mb-3 font-semibold text-slate-800">Anggota ({group.registrations.length})</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">NIM</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {group.registrations.map((reg, i) => (
                            <tr key={reg.id}>
                                <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{reg.student.nim}</td>
                                <td className="px-4 py-3 text-sm text-slate-800">{reg.student.name}</td>
                                <td className="px-4 py-3"><StatusBadge status={reg.status} /></td>
                            </tr>
                        ))}
                        {group.registrations.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Belum ada anggota.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
