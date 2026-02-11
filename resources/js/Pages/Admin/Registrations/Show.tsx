import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { useState } from 'react';

interface Props extends PageProps {
    registration: {
        id: number;
        status: string;
        registration_date: string;
        notes?: string;
        student: {
            nim: string;
            name: string;
            gender: string;
            batch_year: number;
            faculty?: { name: string };
            program?: { name: string };
        };
        period: { name: string };
        group: { name: string; code: string } | null;
        documents: { id: number; document_type: string; file_name: string; file_path: string; status: string }[];
    };
}

export default function RegistrationShow({ registration }: Props) {
    const [showReject, setShowReject] = useState(false);
    const approveForm = useForm({});
    const rejectForm = useForm({ notes: '' });

    const isPending = registration.status === 'pending' || registration.status === 'document_submitted';

    return (
        <AppLayout title="Detail Pendaftaran">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Student info */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Data Mahasiswa</h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">NIM</dt><dd className="font-mono">{registration.student.nim}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Nama</dt><dd>{registration.student.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Fakultas</dt><dd>{registration.student.faculty?.name ?? '-'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Prodi</dt><dd>{registration.student.program?.name ?? '-'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Angkatan</dt><dd>{registration.student.batch_year}</dd></div>
                    </dl>
                </div>

                {/* Registration info */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Info Pendaftaran</h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Periode</dt><dd>{registration.period.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Tanggal Daftar</dt><dd>{registration.registration_date}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={registration.status} /></dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Kelompok</dt><dd>{registration.group?.name ?? '—'}</dd></div>
                    </dl>
                </div>
            </div>

            {/* Documents */}
            {registration.documents.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold text-slate-800">Dokumen</h3>
                    <div className="space-y-2">
                        {registration.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{doc.document_type}</p>
                                    <p className="text-xs text-slate-500">{doc.file_name}</p>
                                </div>
                                <StatusBadge status={doc.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            {isPending && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 font-semibold text-slate-800">Aksi</h3>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => approveForm.patch(`/admin/registrations/${registration.id}/approve`)}
                            loading={approveForm.processing}
                        >
                            Setujui
                        </Button>
                        <Button variant="danger" onClick={() => setShowReject(true)}>Tolak</Button>
                    </div>

                    {showReject && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                            <FormTextarea
                                label="Alasan Penolakan"
                                value={rejectForm.data.notes}
                                onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                error={rejectForm.errors.notes}
                                required
                            />
                            <div className="mt-3 flex gap-2">
                                <Button
                                    variant="danger"
                                    onClick={() => rejectForm.patch(`/admin/registrations/${registration.id}/reject`)}
                                    loading={rejectForm.processing}
                                >
                                    Konfirmasi Tolak
                                </Button>
                                <Button variant="secondary" onClick={() => setShowReject(false)}>Batal</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
