import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    group: { name: string } | null;
    existingReport: { id: number; title: string; status: string; file_name?: string } | null;
}

export default function StudentFinalReportCreate({ group, existingReport }: Props) {
    const form = useForm({
        title: existingReport?.title ?? '',
        abstract: '',
        file: null as File | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/student/final-report', { forceFormData: true });
    }

    if (!group) {
        return (
            <AppLayout title="Laporan Akhir">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
                    Anda belum ditempatkan di kelompok.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Laporan Akhir">
            <div className="mx-auto max-w-2xl space-y-6">
                {existingReport && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-800">Laporan Sebelumnya</h3>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-slate-600">{existingReport.title}</span>
                            <StatusBadge status={existingReport.status} />
                        </div>
                        {existingReport.file_name && <p className="mt-1 text-xs text-slate-500">File: {existingReport.file_name}</p>}
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-slate-800">{existingReport ? 'Perbarui Laporan Akhir' : 'Upload Laporan Akhir'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormInput id="title" label="Judul Laporan" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} error={form.errors.title} required />
                        <FormTextarea id="abstract" label="Abstrak (Opsional)" value={form.data.abstract} onChange={(e) => form.setData('abstract', e.target.value)} rows={4} />
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">File Laporan <span className="text-red-500">*</span></label>
                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20" />
                            {form.errors.file && <p className="mt-1 text-xs text-red-500">{form.errors.file}</p>}
                            <p className="mt-1 text-xs text-slate-500">Format: PDF, DOC, DOCX. Maks: 20MB</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={() => window.history.back()}>Batal</Button>
                            <Button type="submit" loading={form.processing}>{existingReport ? 'Perbarui' : 'Upload'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
