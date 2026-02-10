import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, Badge, ConfirmDialog } from '@/Components/UI';
import type { PageProps, AcademicYear } from '@/types';

interface PeriodData {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    registration_start: string;
    registration_end: string;
    is_active: boolean;
    academic_year: AcademicYear;
}

interface Props extends PageProps {
    periods: PeriodData[];
    academicYears: AcademicYear[];
}

export default function PeriodsIndex({ periods, academicYears }: Props) {
    const [editing, setEditing] = useState<PeriodData | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<PeriodData | null>(null);

    const form = useForm({
        academic_year_id: '',
        name: '',
        start_date: '',
        end_date: '',
        registration_start: '',
        registration_end: '',
        is_active: false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/periods/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); form.reset(); },
            });
        } else {
            form.post('/admin/periods', {
                onSuccess: () => { setShowForm(false); form.reset(); },
            });
        }
    }

    function startEdit(p: PeriodData) {
        setEditing(p);
        setShowForm(true);
        form.setData({
            academic_year_id: String(p.academic_year.id),
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            registration_start: p.registration_start,
            registration_end: p.registration_end,
            is_active: p.is_active,
        });
    }

    function cancelForm() {
        setEditing(null);
        setShowForm(false);
        form.reset();
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Periode KKN">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{periods.length} periode</p>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>+ Tambah Periode</Button>
                )}
            </div>

            {showForm && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 font-semibold text-slate-800">
                        {editing ? 'Edit Periode' : 'Tambah Periode Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormSelect
                            id="academic_year_id"
                            label="Tahun Akademik"
                            options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                            placeholder="Pilih tahun..."
                            value={form.data.academic_year_id}
                            onChange={(e) => form.setData('academic_year_id', e.target.value)}
                            error={form.errors.academic_year_id}
                            required
                        />
                        <FormInput
                            id="name"
                            label="Nama Periode"
                            placeholder="KKN Reguler 2024"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            error={form.errors.name}
                            required
                        />
                        <FormInput id="start_date" label="Tanggal Mulai" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} error={form.errors.start_date} required />
                        <FormInput id="end_date" label="Tanggal Selesai" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} error={form.errors.end_date} required />
                        <FormInput id="registration_start" label="Pendaftaran Dibuka" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} error={form.errors.registration_start} required />
                        <FormInput id="registration_end" label="Pendaftaran Ditutup" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} error={form.errors.registration_end} required />
                        <div className="col-span-full">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm text-slate-700">Periode Aktif</span>
                            </label>
                        </div>
                        <div className="col-span-full flex gap-2">
                            <Button type="submit" loading={form.processing}>{editing ? 'Simpan' : 'Tambah'}</Button>
                            <Button variant="secondary" onClick={cancelForm}>Batal</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tahun Akademik</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tanggal</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pendaftaran</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {periods.map((p) => (
                                <tr key={p.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{p.academic_year.year}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{p.start_date} – {p.end_date}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{p.registration_start} – {p.registration_end}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={p.is_active ? 'success' : 'default'}>{p.is_active ? 'Aktif' : 'Tidak Aktif'}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Edit</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="text-red-600">Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Periode"
                message={`Hapus periode "${deleting?.name}"?`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
