import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, Badge, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear, Period } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

interface PeriodData extends Omit<Period, 'academic_year'> {
    academic_year: AcademicYear;
}

interface Props extends PageProps {
    periods: {
        data: PeriodData[];
        links: any[];
        meta: PaginationMeta;
    };
    academicYears: AcademicYear[];
    filters: {
        search?: string;
    };
}

export default function PeriodsIndex({ periods, academicYears, filters }: Props) {
    const [editing, setEditing] = useState<PeriodData | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<PeriodData | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({
        academic_year_id: '',
        angkatan: '',
        jenis: '',
        name: '',
        start_date: '',
        end_date: '',
        registration_start: '',
        registration_end: '',
        kuota: '2000',
        is_active: false,
    });

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/periods', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Auto-generate name
    useEffect(() => {
        if (!editing) {
            const name = `[Angkatan ${form.data.angkatan}] ${form.data.jenis}`;
            if (form.data.angkatan && form.data.jenis && form.data.name !== name) {
                form.setData('name', name);
            }
        }
    }, [form.data.angkatan, form.data.jenis]);

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
            angkatan: String(p.angkatan),
            jenis: p.jenis,
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            registration_start: p.registration_start,
            registration_end: p.registration_end,
            kuota: String(p.kuota),
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
            {/* Header with Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                    <FormInput
                        placeholder="Cari angkatan, jenis, atau nama..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">{periods.meta?.total || 0} periode</p>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            + Tambah Periode
                        </Button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="mb-6 text-xl font-black text-slate-800 tracking-tight">
                        {editing ? 'Edit Periode' : 'Tambah Periode Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                            id="angkatan"
                            label="Angkatan"
                            type="number"
                            placeholder="57"
                            value={form.data.angkatan}
                            onChange={(e) => form.setData('angkatan', e.target.value)}
                            error={form.errors.angkatan}
                            required
                        />
                        <FormInput
                            id="jenis"
                            label="Jenis KKN"
                            placeholder="KKN Reguler"
                            value={form.data.jenis}
                            onChange={(e) => form.setData('jenis', e.target.value)}
                            error={form.errors.jenis}
                            required
                        />
                        <FormInput
                            id="name"
                            label="Nama Lengkap Periode"
                            placeholder="[Angkatan 57] KKN Reguler"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            error={form.errors.name}
                            required
                            className="bg-slate-50 italic"
                        />
                        <FormInput id="kuota" label="Kuota Pendaftaran" type="number" value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} error={form.errors.kuota} required />

                        <div className="col-span-1 flex items-end pb-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 transition"
                                />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition">Set as Active</span>
                            </label>
                        </div>

                        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100 mt-2">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Jadwal Pendaftaran</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput id="registration_start" label="Buka" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} error={form.errors.registration_start} required />
                                    <FormInput id="registration_end" label="Tutup" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} error={form.errors.registration_end} required />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Jadwal Pelaksanaan</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput id="start_date" label="Mulai" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} error={form.errors.start_date} required />
                                    <FormInput id="end_date" label="Selesai" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} error={form.errors.end_date} required />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-full flex gap-3 pt-6 border-t border-slate-100">
                            <Button type="submit" loading={form.processing} className="px-8">{editing ? 'Simpan Perubahan' : 'Tambah Periode'}</Button>
                            <Button variant="secondary" onClick={cancelForm}>Batal</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">No</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Angkatan</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Tahun Akademik</th>
                                <th colSpan={2} className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-x border-slate-100">Pendaftaran</th>
                                <th colSpan={2} className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Pelaksanaan</th>
                                <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-l border-slate-100">Kuota</th>
                                <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <th colSpan={4}></th>
                                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 text-center border-l border-slate-100">Mulai</th>
                                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 text-center border-r border-slate-100">Selesai</th>
                                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 text-center">Mulai</th>
                                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 text-center">Selesai</th>
                                <th colSpan={3}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {periods.data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-sm text-slate-500 italic font-medium">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                periods.data.map((p, idx) => (
                                    <tr key={p.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-4 py-4 text-xs text-slate-400 font-mono">{(periods.meta.current_page - 1) * periods.meta.per_page + idx + 1}</td>
                                        <td className="px-4 py-4 text-sm font-black text-slate-800 tracking-tight">{p.angkatan}</td>
                                        <td className="px-4 py-4 text-sm text-slate-600 font-black uppercase tracking-tighter">{p.jenis}</td>
                                        <td className="px-4 py-4 text-sm text-slate-500">{p.academic_year?.year || '-'}</td>
                                        <td className="px-4 py-4 text-[11px] text-slate-500 text-center border-l border-slate-50">{p.registration_start}</td>
                                        <td className="px-4 py-4 text-[11px] text-slate-500 text-center border-r border-slate-50">{p.registration_end}</td>
                                        <td className="px-4 py-4 text-[11px] text-slate-500 text-center">{p.start_date}</td>
                                        <td className="px-4 py-4 text-[11px] text-slate-500 text-center">{p.end_date}</td>
                                        <td className="px-4 py-4 text-sm text-center font-bold text-indigo-600 border-l border-slate-50">{p.kuota}</td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant={p.is_active ? 'success' : 'default'} className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                                                {p.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="h-8 w-8 p-0" title="Edit">
                                                    <span className="sr-only">Edit</span>
                                                    ✏️
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="h-8 w-8 p-0 text-red-600" title="Hapus">
                                                    <span className="sr-only">Hapus</span>
                                                    🗑️
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {periods.meta && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                        <Pagination meta={periods.meta} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Periode"
                message={`Anda yakin ingin menghapus periode "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                processing={deleteForm.processing}
                confirmLabel="Hapus Permanen"
            />
        </AppLayout>
    );
}
