import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, Location } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

interface Props extends PageProps {
    locations: {
        data: Location[];
        links: any[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function LocationsIndex({ locations, filters }: Props) {
    const [editing, setEditing] = useState<Location | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<Location | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({
        village_name: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '20',
    });

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/locations', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

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

    function cancelForm() {
        setEditing(null);
        setShowForm(false);
        form.reset();
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Lokasi KKN">
            {/* Header with Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                    <FormInput
                        placeholder="Cari desa atau alamat..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">{locations.meta?.total || 0} lokasi</p>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            + Tambah Lokasi
                        </Button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="mb-6 text-xl font-black text-slate-800 tracking-tight">{editing ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormInput id="village_name" label="Nama Desa/Kelurahan" value={form.data.village_name} onChange={(e) => form.setData('village_name', e.target.value)} error={form.errors.village_name} required />
                        <FormInput id="capacity" label="Kapasitas" type="number" value={form.data.capacity} onChange={(e) => form.setData('capacity', e.target.value)} error={form.errors.capacity} required />
                        <div className="col-span-full">
                            <FormTextarea id="address" label="Alamat Lengkap" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} error={form.errors.address} rows={2} />
                        </div>
                        <FormInput id="latitude" label="Latitude" type="number" step="any" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} error={form.errors.latitude} />
                        <FormInput id="longitude" label="Longitude" type="number" step="any" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} error={form.errors.longitude} />
                        <div className="col-span-full flex gap-3 pt-2">
                            <Button type="submit" loading={form.processing} className="px-8">{editing ? 'Simpan' : 'Tambah'}</Button>
                            <Button variant="secondary" onClick={cancelForm}>Batal</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Desa/Kelurahan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Alamat</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Koordinat</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Kapasitas</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {locations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                locations.data.map((l) => (
                                    <tr key={l.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-6 py-4 text-sm font-black text-slate-800 tracking-tight uppercase">{l.village_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium max-w-xs truncate">{l.address || '-'}</td>
                                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">
                                            {l.latitude && l.longitude ? `${l.latitude}, ${l.longitude}` : 'No GPS'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-black text-slate-700">{l.capacity}</span> <span className="text-[10px] opacity-50 uppercase tracking-widest font-black">Peserta</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(l)} className="font-bold">Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeleting(l)} className="text-red-600 font-bold hover:bg-red-50">Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {locations.meta && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                        <Pagination meta={locations.meta} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/locations/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Lokasi"
                message={`Hapus lokasi "${deleting?.village_name}"?`}
                processing={deleteForm.processing}
                confirmLabel="Hapus Permanen"
            />
        </AppLayout>
    );
}
