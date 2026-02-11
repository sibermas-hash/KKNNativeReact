import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    report: { id: number; date: string; title: string; activity: string; output?: string };
}

export default function StudentDailyReportEdit({ report }: Props) {
    const form = useForm({
        date: report.date,
        title: report.title,
        activity: report.activity,
        output: report.output ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/student/daily-reports/${report.id}`);
    }

    return (
        <AppLayout title="Edit Laporan Harian">
            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="date" label="Tanggal" type="date" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} error={form.errors.date} required />
                        <FormInput id="title" label="Judul Kegiatan" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} error={form.errors.title} required />
                    </div>
                    <FormTextarea id="activity" label="Deskripsi Kegiatan" value={form.data.activity} onChange={(e) => form.setData('activity', e.target.value)} error={form.errors.activity} rows={4} required />
                    <FormTextarea id="output" label="Output / Hasil (Opsional)" value={form.data.output} onChange={(e) => form.setData('output', e.target.value)} rows={2} />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => window.history.back()}>Batal</Button>
                        <Button type="submit" loading={form.processing}>Kirim Ulang</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
