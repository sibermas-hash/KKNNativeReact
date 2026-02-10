import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea, ConfirmDialog } from '@/Components/UI';
import type { PageProps, Location } from '@/types';

interface Props extends PageProps {
    locations: Location[];
}

export default function LocationsIndex({ locations }: Props) {
    const [editing, setEditing] = useState<Location | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<Location | null>(null);

    const form = useForm({
        village_name: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '20',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/locations/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); form.reset(); },
            });
        } else {
            form.post('/admin/locations', {
                onSuccess: () => { setShowForm(false); form.reset(); },
            });
        }
    }

    function startEdit(l: Location) {
        setEditing(l);
        setShowForm(true);
        form.setData({
            village_name: l.village_name,
            address: l.address ?? '',
            latitude: l.latitude ? String(l.latitude) : '',
            longitude: l.longitude ? String(l.longitude) : '',
            capacity: String(l.capacity),
        });
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Lokasi KKN">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{locations.length} lokasi</p>
                {!showForm && <Button onClick={() => setShowForm(true)}>+ Tambah Lokasi</Button>}
            </div>

            {showForm && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 font-semibold text-slate-800">{editing ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="village_name" label="Nama Desa/Kelurahan" value={form.data.village_name} onChange={(e) => form.setData('village_name', e.target.value)} error={form.errors.village_name} required />
                        <FormInput id="capacity" label="Kapasitas" type="number" value={form.data.capacity} onChange={(e) => form.setData('capacity', e.target.value)} error={form.errors.capacity} required />
                        <div className="col-span-full">
                            <FormTextarea id="address" label="Alamat Lengkap" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} error={form.errors.address} rows={2} />
                        </div>
                        <FormInput id="latitude" label="Latitude" type="number" step="any" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} error={form.errors.latitude} />
                        <FormInput id="longitude" label="Longitude" type="number" step="any" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} error={form.errors.longitude} />
                        <div className="col-span-full flex gap-2">
                            <Button type="submit" loading={form.processing}>{editing ? 'Simpan' : 'Tambah'}</Button>
                            <Button variant="secondary" onClick={() => { setEditing(null); setShowForm(false); form.reset(); }}>Batal</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {locations.map((l) => (
                    <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                        <h3 className="font-semibold text-slate-800">{l.village_name}</h3>
                        {l.address && <p className="mt-1 text-sm text-slate-500">{l.address}</p>}
                        <p className="mt-2 text-sm text-slate-600">Kapasitas: <span className="font-medium">{l.capacity}</span></p>
                        <div className="mt-3 flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(l)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleting(l)} className="text-red-600">Hapus</Button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/locations/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Lokasi"
                message={`Hapus lokasi "${deleting?.village_name}"?`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
