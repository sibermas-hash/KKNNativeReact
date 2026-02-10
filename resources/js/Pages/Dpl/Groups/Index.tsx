import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/UI';
import { Link } from '@inertiajs/react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { PageProps } from '@/types';

interface GroupData {
    id: number;
    code: string;
    name: string;
    status: string;
    registrations_count: number;
    daily_reports_count: number;
    work_programs_count: number;
    period: { name: string };
    location: { village_name: string };
}

interface Props extends PageProps {
    groups: GroupData[];
}

export default function DplGroupsIndex({ groups }: Props) {
    return (
        <AppLayout title="Kelompok Bimbingan">
            {groups.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Anda belum ditugaskan ke kelompok manapun.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {groups.map((g) => (
                        <Link key={g.id} href={`/dpl/groups/${g.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-primary/30">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800">{g.name}</h3>
                                <StatusBadge status={g.status} />
                            </div>
                            <p className="mb-1 text-sm text-slate-500">Kode: {g.code}</p>
                            <p className="mb-1 flex items-center gap-1 text-sm text-slate-500">
                                <MapPinIcon className="h-4 w-4" /> {g.location.village_name}
                            </p>
                            <p className="mb-3 text-sm text-slate-500">{g.period.name}</p>
                            <div className="flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>{g.registrations_count} anggota</span>
                                <span>{g.daily_reports_count} laporan</span>
                                <span>{g.work_programs_count} proker</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
