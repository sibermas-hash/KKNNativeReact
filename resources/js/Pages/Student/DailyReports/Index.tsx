import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    reports: { data: { id: number; date: string; title: string; status: string; review_notes?: string }[] };
}

export default function StudentDailyReportsIndex({ reports }: Props) {
    return (
        <AppLayout title="Laporan Harian Saya">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{reports?.data?.length ?? 0} laporan</p>
                <a href="/student/daily-reports/create">
                    <Button>+ Buat Laporan</Button>
                </a>
            </div>

            <div className="space-y-3">
                {(reports?.data ?? []).map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500">{r.date}</p>
                                <h3 className="mt-1 font-medium text-slate-800">{r.title}</h3>
                            </div>
                            <StatusBadge status={r.status} />
                        </div>
                        {r.review_notes && (
                            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                <strong>Revisi:</strong> {r.review_notes}
                            </div>
                        )}
                        <div className="mt-3 flex gap-2">
                            {r.status === 'revision' && (
                                <a href={`/student/daily-reports/${r.id}/edit`} className="text-sm text-primary hover:underline">Edit & Kirim Ulang</a>
                            )}
                        </div>
                    </div>
                ))}
                {(reports?.data ?? []).length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Belum ada laporan. Mulai buat laporan harian pertama Anda!
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
