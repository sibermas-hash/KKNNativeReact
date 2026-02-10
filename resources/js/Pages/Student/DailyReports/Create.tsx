import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea } from '@/Components/UI';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    group: { name: string; location?: { village_name: string } } | null;
}

export default function StudentDailyReportCreate({ group }: Props) {
    const form = useForm({
        date: new Date().toISOString().split('T')[0],
        title: '',
        activity: '',
        output: '',
        files: [] as File[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/student/daily-reports', {
            forceFormData: true,
        });
    }

    if (!group) {
        return (
            <AppLayout title="Buat Laporan Harian">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
                    Anda belum ditempatkan di kelompok. Silakan hubungi admin.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Buat Laporan Harian">
            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 rounded-lg bg-primary/5 p-3">
                    <p className="text-sm text-slate-600">Kelompok: <span className="font-medium">{group.name}</span></p>
                    {group.location && <p className="text-xs text-slate-500">Lokasi: {group.location.village_name}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="date" label="Tanggal" type="date" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} error={form.errors.date} required />
                        <FormInput id="title" label="Judul Kegiatan" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} error={form.errors.title} required />
                    </div>
                    <FormTextarea id="activity" label="Deskripsi Kegiatan" value={form.data.activity} onChange={(e) => form.setData('activity', e.target.value)} error={form.errors.activity} rows={4} required />
                    <FormTextarea id="output" label="Output / Hasil (Opsional)" value={form.data.output} onChange={(e) => form.setData('output', e.target.value)} rows={2} />

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Lampiran (Opsional)</label>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => form.setData('files', Array.from(e.target.files ?? []))}
                            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => window.history.back()}>Batal</Button>
                        <Button type="submit" loading={form.processing}>Kirim Laporan</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
