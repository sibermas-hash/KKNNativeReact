import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    workPrograms: { id: number; title: string; description?: string; budget: number; status: string }[];
    canCreate: boolean;
}

export default function StudentWorkProgramsIndex({ workPrograms, canCreate }: Props) {
    return (
        <AppLayout title="Program Kerja">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{workPrograms.length} program kerja</p>
                {canCreate && (
                    <Link href="/student/work-programs/create"><Button>+ Ajukan Proker</Button></Link>
                )}
            </div>

            {workPrograms.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Belum ada program kerja untuk kelompok Anda.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {workPrograms.map((wp) => (
                        <div key={wp.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-2 flex items-start justify-between">
                                <h3 className="font-semibold text-slate-800">{wp.title}</h3>
                                <StatusBadge status={wp.status} />
                            </div>
                            {wp.description && <p className="mb-2 text-sm text-slate-500 line-clamp-2">{wp.description}</p>}
                            <p className="text-sm text-slate-600">Anggaran: <span className="font-medium">Rp {wp.budget.toLocaleString('id-ID')}</span></p>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
