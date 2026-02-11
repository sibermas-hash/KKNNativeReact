import { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, StatusBadge, ConfirmDialog } from '@/Components/ui';
import type { PageProps } from '@/types';

interface GroupData {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    period: { id: number; name: string };
    location: { id: number; village_name: string };
    lecturer: { id: number; name: string } | null;
}

interface Props extends PageProps {
    groups: GroupData[];
    periods: { id: number; name: string }[];
    locations: { id: number; village_name: string }[];
    lecturers: { id: number; name: string }[];
}

export default function GroupsIndex({ groups, periods, locations, lecturers }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<GroupData | null>(null);
    const [deleting, setDeleting] = useState<GroupData | null>(null);

    const form = useForm({
        period_id: '',
        location_id: '',
        lecturer_id: '',
        name: '',
        capacity: '20',
        status: 'draft',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/groups/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); form.reset(); },
            });
        } else {
            form.post('/admin/groups', {
                onSuccess: () => { setShowForm(false); form.reset(); },
            });
        }
    }

    function startEdit(g: GroupData) {
        setEditing(g);
        setShowForm(true);
        form.setData({
            period_id: String(g.period.id),
            location_id: String(g.location.id),
            lecturer_id: g.lecturer ? String(g.lecturer.id) : '',
            name: g.name,
            capacity: String(g.capacity),
            status: g.status,
        });
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Kelompok KKN">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{groups.length} kelompok</p>
                {!showForm && <Button onClick={() => setShowForm(true)}>+ Tambah Kelompok</Button>}
            </div>

            {showForm && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 font-semibold text-slate-800">{editing ? 'Edit Kelompok' : 'Tambah Kelompok'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="name" label="Nama Kelompok" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                        <FormInput id="capacity" label="Kapasitas" type="number" value={form.data.capacity} onChange={(e) => form.setData('capacity', e.target.value)} error={form.errors.capacity} required />
                        <FormSelect id="period_id" label="Periode" options={periods.map(p => ({ value: p.id, label: p.name }))} placeholder="Pilih..." value={form.data.period_id} onChange={(e) => form.setData('period_id', e.target.value)} error={form.errors.period_id} required />
                        <FormSelect id="location_id" label="Lokasi" options={locations.map(l => ({ value: l.id, label: l.village_name }))} placeholder="Pilih..." value={form.data.location_id} onChange={(e) => form.setData('location_id', e.target.value)} error={form.errors.location_id} required />
                        <FormSelect id="lecturer_id" label="DPL (Opsional)" options={lecturers.map(l => ({ value: l.id, label: l.name }))} placeholder="Belum ditugaskan" value={form.data.lecturer_id} onChange={(e) => form.setData('lecturer_id', e.target.value)} error={form.errors.lecturer_id} />
                        <FormSelect id="status" label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Aktif' }, { value: 'closed', label: 'Ditutup' }]} value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} error={form.errors.status} required />
                        <div className="col-span-full flex gap-2">
                            <Button type="submit" loading={form.processing}>{editing ? 'Simpan' : 'Tambah'}</Button>
                            <Button variant="secondary" onClick={() => { setEditing(null); setShowForm(false); form.reset(); }}>Batal</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kode</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Lokasi</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">DPL</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Anggota</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groups.map((g) => (
                                <tr key={g.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{g.code}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{g.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{g.location.village_name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{g.lecturer?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{g.registrations_count}/{g.capacity}</td>
                                    <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/groups/${g.id}`} className="text-sm text-primary hover:text-primary-dark">Detail</Link>
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(g)}>Edit</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(g)} className="text-red-600">Hapus</Button>
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
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/groups/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Kelompok"
                message={`Hapus kelompok "${deleting?.name}"?`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
