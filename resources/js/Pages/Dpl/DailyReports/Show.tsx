import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    report: {
        id: number;
        date: string;
        title: string;
        activity: string;
        output?: string;
        status: string;
        review_notes?: string;
        student: { name: string; nim: string };
        group: { name: string; location?: { village_name: string } };
        files: { id: number; file_name: string; file_path: string }[];
    };
}

export default function DplDailyReportShow({ report }: Props) {
    const [showRevision, setShowRevision] = useState(false);
    const approveForm = useForm({});
    const revisionForm = useForm({ review_notes: '' });

    const canReview = report.status === 'submitted';

    return (
        <AppLayout title="Review Laporan Harian">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">{report.title}</h2>
                        <StatusBadge status={report.status} />
                    </div>
                    <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-slate-500">Tanggal</dt><dd className="font-medium">{report.date}</dd></div>
                        <div><dt className="text-slate-500">Mahasiswa</dt><dd className="font-medium">{report.student.name} ({report.student.nim})</dd></div>
                        <div><dt className="text-slate-500">Kelompok</dt><dd className="font-medium">{report.group.name}</dd></div>
                        <div><dt className="text-slate-500">Lokasi</dt><dd className="font-medium">{report.group.location?.village_name ?? '-'}</dd></div>
                    </dl>

                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700">Kegiatan</h3>
                            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{report.activity}</p>
                        </div>
                        {report.output && (
                            <div>
                                <h3 className="mb-1 text-sm font-semibold text-slate-700">Output</h3>
                                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{report.output}</p>
                            </div>
                        )}
                    </div>

                    {report.files.length > 0 && (
                        <div className="mt-4">
                            <h3 className="mb-2 text-sm font-semibold text-slate-700">Lampiran</h3>
                            <div className="space-y-1">
                                {report.files.map((f) => (
                                    <a key={f.id} href={`/storage/${f.file_path}`} target="_blank" rel="noreferrer" className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-primary hover:underline">
                                        {f.file_name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {canReview && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-800">Aksi Review</h3>
                        <div className="flex gap-3">
                            <Button onClick={() => approveForm.patch(`/dpl/daily-reports/${report.id}/approve`)} loading={approveForm.processing}>Setujui</Button>
                            <Button variant="outline" onClick={() => setShowRevision(!showRevision)}>Minta Revisi</Button>
                        </div>
                        {showRevision && (
                            <div className="mt-4">
                                <FormTextarea
                                    label="Catatan Revisi"
                                    value={revisionForm.data.review_notes}
                                    onChange={(e) => revisionForm.setData('review_notes', e.target.value)}
                                    error={revisionForm.errors.review_notes}
                                    required
                                />
                                <Button variant="danger" className="mt-3" onClick={() => revisionForm.patch(`/dpl/daily-reports/${report.id}/revision`)} loading={revisionForm.processing}>Kirim Revisi</Button>
                            </div>
                        )}
                    </div>
                )}

                {report.review_notes && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <h4 className="text-sm font-semibold text-amber-800">Catatan Revisi:</h4>
                        <p className="mt-1 text-sm text-amber-700">{report.review_notes}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
