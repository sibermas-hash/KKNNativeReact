import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface GroupSummary {
 id: number;
 code: string;
 name: string;
 period_name: string;
 village_name: string;
 member_count: number;
 daily_report_count: number;
}

interface RiskStudent {
 id: number;
 name: string;
 nim: string;
 group_code: string;
}

interface ActivityTrendItem {
 date: string;
 count: number;
}

interface Props {
 groups: GroupSummary[];
 pendingReports: number;
 gradingProgress: string;
 atRiskStudents: RiskStudent[];
 activityTrend: ActivityTrendItem[];
}

function DashboardCard({
 title,
 value,
 description,
}: {
 title: string;
 value: string | number;
 description: string;
}) {
 return (
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm font-medium text-slate-500">{title}</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
 <p className="mt-2 text-sm text-slate-500">{description}</p>
 </div>
 );
}

export default function DplDashboard({
 groups,
 pendingReports,
 gradingProgress,
 atRiskStudents,
 activityTrend,
}: Props) {
 return (
 <AppLayout title="Dasbor DPL">
 <Head title="Dasbor DPL" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Dasbor DPL</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Ringkasan kelompok bimbingan, laporan yang menunggu review, dan mahasiswa yang
 perlu perhatian khusus.
 </p>
 </section>

 <section className="grid gap-6 md:grid-cols-3">
 <DashboardCard
 title="Kelompok Bimbingan"
 value={groups.length}
 description="Jumlah kelompok yang saat ini berada di bawah koordinasi Anda."
 />
 <DashboardCard
 title="Laporan Menunggu"
 value={pendingReports}
 description="Jumlah laporan harian yang masih menunggu review DPL."
 />
 <DashboardCard
 title="Progres Penilaian"
 value={gradingProgress}
 description="Persentase mahasiswa yang sudah memiliki penilaian DPL."
 />
 </section>

 <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
 <div className="rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Kelompok Saya</h2>
 <p className="mt-1 text-sm text-slate-500">
 Buka detail kelompok untuk melihat anggota, program kerja, dan data posko.
 </p>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kode</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Lokasi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Anggota</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Laporan</th>
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
 <td className="px-6 py-4 text-right">
 <Link
 href={`/dpl/groups/${group.id}`}
 className="text-sm font-medium text-primary hover:underline"
 >
 Detail
 </Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada kelompok yang ditugaskan ke DPL ini.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <div className="space-y-6">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Mahasiswa Berisiko</h2>
 <p className="mt-1 text-sm text-slate-500">
 Mahasiswa yang belum mencatat aktivitas dalam 3 hari terakhir.
 </p>
 <div className="mt-4 space-y-3">
 {atRiskStudents.length > 0 ? (
 atRiskStudents.map((student) => (
 <div key={student.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
 <p className="text-sm font-semibold text-slate-900">{student.name}</p>
 <p className="text-xs text-slate-600">{student.nim}</p>
 <p className="mt-1 text-xs text-amber-700">Kelompok: {student.group_code}</p>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-500">Tidak ada mahasiswa yang terdeteksi berisiko saat ini.</p>
 )}
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Tren Aktivitas 14 Hari</h2>
 <div className="mt-4 space-y-2">
 {activityTrend.length > 0 ? (
 activityTrend.map((item) => (
 <div key={item.date} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
 <span className="text-sm text-slate-600">{item.date}</span>
 <span className="text-sm font-semibold text-slate-900">{item.count} laporan</span>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-500">Belum ada tren aktivitas yang tercatat.</p>
 )}
 </div>
 </div>
 </div>
 </section>
 </div>
 </AppLayout>
 );
}
