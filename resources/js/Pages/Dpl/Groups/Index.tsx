import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface GroupRow {
 id: number;
 code: string;
 name: string;
 status: string;
 member_count: number;
 daily_report_count: number;
 work_program_count: number;
 period_name: string;
 village_name: string;
}

interface Props {
 groups: GroupRow[];
}

export default function DplGroupsIndex({ groups }: Props) {
 return (
 <AppLayout title="Kelompok Saya">
 <Head title="Kelompok Saya" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Kelompok Bimbingan</h1>
 <p className="mt-2 text-sm text-slate-500">
 Daftar kelompok yang ditugaskan kepada Anda sebagai DPL.
 </p>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kode</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Lokasi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Anggota</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Laporan</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Proker</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {groups.length > 0 ? (
 groups.map((group) => (
 <tr key={group.id}>
 <td className="px-6 py-4 text-sm font-semibold text-slate-900">{group.code}</td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-800">{group.name}</p>
 <p className="text-xs text-slate-500">{group.period_name}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">{group.village_name}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{group.member_count}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{group.daily_report_count}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{group.work_program_count}</td>
 <td className="px-6 py-4">
 <StatusBadge status={group.status} />
 </td>
 <td className="px-6 py-4 text-right">
 <Link href={`/dpl/groups/${group.id}`} className="text-sm font-medium text-primary hover:underline">
 Detail
 </Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada kelompok yang ditugaskan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </section>
 </div>
 </AppLayout>
 );
}
