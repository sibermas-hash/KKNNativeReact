import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, StatusBadge, ConfirmDialog } from '@/Components/ui';
import type { PageProps } from '@/types';

interface DplInput {
    id: string; // Form uses strings for select values
    role: 'Ketua' | 'Anggota';
}

interface GroupData {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    period: { id: number; name: string };
    location: { id: number; village_name: string };
    main_lecturer: { id: number; name: string } | null;
    lecturers: { id: number; name: string; role: string }[];
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

    const { data, setData, post, put, reset, errors, processing } = useForm({
        period_id: '',
        location_id: '',
        name: '',
        capacity: '20',
        status: 'draft',
        lecturers: [] as DplInput[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/admin/groups/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); reset(); },
            });
        } else {
            post('/admin/groups', {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    }

    function startEdit(g: GroupData) {
        setEditing(g);
        setShowForm(true);
        setData({
            period_id: String(g.period.id),
            location_id: String(g.location.id),
            name: g.name,
            capacity: String(g.capacity),
            status: g.status,
            lecturers: g.lecturers.map(l => ({ id: String(l.id), role: l.role as 'Ketua' | 'Anggota' })),
        });
    }

    const addLecturer = () => {
        setData('lecturers', [...data.lecturers, { id: '', role: 'Anggota' }]);
    };

    const removeLecturer = (index: number) => {
        const newLecturers = [...data.lecturers];
        newLecturers.splice(index, 1);
        setData('lecturers', newLecturers);
    };

    const updateLecturer = (index: number, field: keyof DplInput, value: string) => {
        const newLecturers = [...data.lecturers];
        // @ts-ignore
        newLecturers[index][field] = value;
        setData('lecturers', newLecturers);
    };

    const deleteForm = useForm({});

    return (
        <AppLayout title="Kelompok KKN">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Daftar Kelompok</h2>
                    <p className="text-sm text-slate-500">{groups.length} kelompok terdaftar</p>
                </div>
                {!showForm && <Button onClick={() => { setEditing(null); reset(); setShowForm(true); }}>+ Tambah Kelompok</Button>}
            </div>

            {showForm && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit Kelompok' : 'Tambah Kelompok Baru'}</h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Informasi Dasar</h3>
                                <FormInput id="name" label="Nama Kelompok" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required placeholder="Contoh: Kelompok 01 Desa Sukamaju" />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput id="capacity" label="Kapasitas" type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} error={errors.capacity} required />
                                    <FormSelect id="status" label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Aktif' }, { value: 'closed', label: 'Ditutup' }]} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} required />
                                </div>
                                <FormSelect id="period_id" label="Periode" options={periods.map(p => ({ value: p.id, label: p.name }))} placeholder="Pilih Periode..." value={data.period_id} onChange={(e) => setData('period_id', e.target.value)} error={errors.period_id} required />
                                <FormSelect id="location_id" label="Lokasi Desa" options={locations.map(l => ({ value: l.id, label: l.village_name }))} placeholder="Pilih Lokasi..." value={data.location_id} onChange={(e) => setData('location_id', e.target.value)} error={errors.location_id} required />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tim DPL</h3>
                                    <button type="button" onClick={addLecturer} className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                        </svg>
                                        Tambah Dosen
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {data.lecturers.length === 0 && (
                                        <p className="text-sm text-slate-400 italic text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            Belum ada DPL yang ditugaskan.
                                        </p>
                                    )}
                                    {data.lecturers.map((l, index) => (
                                        <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={l.id}
                                                    onChange={(e) => updateLecturer(index, 'id', e.target.value)}
                                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm"
                                                    required
                                                >
                                                    <option value="">Pilih Dosen...</option>
                                                    {lecturers.map((lec) => (
                                                        <option key={lec.id} value={lec.id}>{lec.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-4">
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            name={`role-${index}`}
                                                            checked={l.role === 'Ketua'}
                                                            onChange={() => updateLecturer(index, 'role', 'Ketua')}
                                                            className="text-primary focus:ring-primary"
                                                        />
                                                        <span className="ml-2 text-sm text-slate-700">Ketua (Admin)</span>
                                                    </label>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            name={`role-${index}`}
                                                            checked={l.role === 'Anggota'}
                                                            onChange={() => updateLecturer(index, 'role', 'Anggota')}
                                                            className="text-primary focus:ring-primary"
                                                        />
                                                        <span className="ml-2 text-sm text-slate-700">Anggota</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeLecturer(index)} className="text-slate-400 hover:text-red-500 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {errors.lecturers && <p className="text-xs text-red-500 font-medium">{errors.lecturers}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => { setEditing(null); setShowForm(false); reset(); }}>Batal</Button>
                            <Button type="submit" loading={processing}>{editing ? 'Simpan Perubahan' : 'Buat Kelompok'}</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {groups.map((g) => (
                    <div key={g.id} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className={`absolute top-0 inset-x-0 h-1 ${g.status === 'active' ? 'bg-emerald-500' : (g.status === 'closed' ? 'bg-slate-300' : 'bg-amber-400')}`} />

                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 mb-2">
                                        {g.code}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{g.name}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        {g.location?.village_name ?? 'Lokasi belum diset'}
                                    </p>
                                </div>
                                <StatusBadge status={g.status} />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Anggota</span>
                                    <span className="font-semibold text-slate-700">{g.registrations_count} / {g.capacity}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((g.registrations_count / g.capacity) * 100, 100)}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tim DPL</p>
                                {g.lecturers.length > 0 ? (
                                    <ul className="space-y-1">
                                        {g.lecturers.map(l => (
                                            <li key={l.id} className="flex items-center text-sm gap-2">
                                                {l.role === 'Ketua' && (
                                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">KETUA</span>
                                                )}
                                                <span className={l.role === 'Ketua' ? 'text-slate-900 font-medium' : 'text-slate-600'}>
                                                    {l.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Belum ada DPL</p>
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-400">
                                Angkatan {g.period?.name ?? '-'}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => startEdit(g)}>Edit</Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleting(g)} className="text-red-600 hover:bg-red-50">Hapus</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                // @ts-ignore
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/groups/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Kelompok"
                message={`Hapus kelompok "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
