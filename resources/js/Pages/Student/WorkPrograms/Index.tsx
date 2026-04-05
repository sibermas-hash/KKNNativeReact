import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface WorkProgram {
 id: number;
 title: string;
 description?: string | null;
 objectives?: string | null;
 budget: number;
 status: string;
}

interface Props {
 workPrograms: WorkProgram[];
 canCreate: boolean;
}

export default function StudentWorkProgramsIndex({ workPrograms, canCreate }: Props) {
 return (
 <AppLayout title="Program Kerja">
 <Head title="Program Kerja" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Program Kerja Kelompok</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau dan kelola program kerja kelompok yang telah diajukan.
 </p>
 </div>
 {canCreate && (
 <Link
 href="/mahasiswa/work-programs/create"
 className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
 >
 Ajukan program kerja
 </Link>
 )}
 </div>
 </section>

 {workPrograms.length > 0 ? (
 <div className="grid gap-6 lg:grid-cols-2">
 {workPrograms.map((program) => (
 <section key={program.id} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{program.title}</h2>
 <p className="mt-2 text-sm text-slate-500">{program.description || 'Tidak ada deskripsi.'}</p>
 </div>
 <StatusBadge status={program.status} />
 </div>
 <div className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tujuan</p>
 <p className="mt-1 text-sm text-slate-700">{program.objectives || '-'}</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Anggaran</p>
 <p className="mt-1 text-sm text-slate-700">
 Rp {Number(program.budget || 0).toLocaleString('id-ID')}
 </p>
 </div>
 </div>
 </section>
 ))}
 </div>
 ) : (
 <section className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
 Belum ada program kerja yang diajukan.
 </section>
 )}
 </div>
 </AppLayout>
 );
}
