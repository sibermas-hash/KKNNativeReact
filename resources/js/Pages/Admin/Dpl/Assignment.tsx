import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, Modal } from '@/Components/ui';

interface PeriodAssignment {
    id: number;
    dosen_id: number;
    period_id: number;
    max_groups: number;
    is_active: boolean;
    dosen: { id: number; nama: string; nip: string };
    periode: { id: number; name: string; angkatan: number; jenis: string };
    kelompok_count: number;
}

interface DosenOption {
    id: number;
    nama: string;
    nip: string;
}

interface PeriodOption {
    id: number;
    name: string;
    angkatan: number;
    jenis: string;
}

interface Props {
    assignments: PeriodAssignment[];
    allDosen: DosenOption[];
    allPeriods: PeriodOption[];
    title: string;
}

export default function DplAssignment({ assignments, allDosen, allPeriods, title }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    const assignForm = useForm({
        dosen_id: '',
        period_id: '',
        max_groups: '5',
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/admin/dpl/assign-period', {
            onSuccess: () => {
                setShowModal(false);
                assignForm.reset();
            },
        });
    };

    const handleRemove = (dplPeriodId: number) => {
        if (confirm('Yakin ingin menghapus penugasan DPL ini?')) {
            assignForm.patch(`/admin/dpl/remove-period/${dplPeriodId}`);
        }
    };

    const filtered = assignments.filter(a =>
        !search ||
        a.dosen.nama.toLowerCase().includes(search.toLowerCase()) ||
        a.dosen.nip.includes(search) ||
        a.periode.name.toLowerCase().includes(search.toLowerCase())
    );

    const dosenOptions = allDosen.map(d => ({ value: d.id, label: `${d.nama} (${d.nip})` }));
    const periodOptions = allPeriods.map(p => ({ value: p.id, label: `Angkatan ${p.angkatan} - ${p.jenis} (${p.name})` }));

    return (
        <AppLayout title={title}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 max-w-xl">
                    <FormInput
                        placeholder="Cari nama DPL, NIP, atau periode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <p className="hidden lg:block text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        {assignments.length} Penugasan
                    </p>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        + Tugaskan DPL
                    </Button>
                </div>
            </div>

            {/* Assignment Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">DPL</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Periode</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Kelompok</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Belum ada penugasan DPL.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a) => (
                                    <tr key={a.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{a.dosen.nama}</span>
                                                <span className="text-[10px] font-bold text-primary font-mono bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1">
                                                    NIP: {a.dosen.nip}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-bold text-slate-700">{a.periode.name}</span>
                                                <span className="text-slate-400 font-medium">
                                                    Angkatan {a.periode.angkatan} • {a.periode.jenis}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-slate-800">{a.kelompok_count}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">/ {a.max_groups} maks</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                variant={a.is_active ? 'success' : 'danger'}
                                                className="text-[9px] font-black uppercase tracking-widest"
                                            >
                                                {a.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {a.kelompok_count === 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-black text-[10px] uppercase tracking-wider text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRemove(a.id)}
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign DPL Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <form onSubmit={handleAssign} className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 mb-4">Tugaskan DPL ke Periode</h3>

                    <FormSelect
                        label="Dosen"
                        placeholder="Pilih Dosen..."
                        options={dosenOptions}
                        value={assignForm.data.dosen_id}
                        onChange={(e) => assignForm.setData('dosen_id', e.target.value)}
                        error={assignForm.errors.dosen_id}
                    />

                    <FormSelect
                        label="Periode"
                        placeholder="Pilih Periode..."
                        options={periodOptions}
                        value={assignForm.data.period_id}
                        onChange={(e) => assignForm.setData('period_id', e.target.value)}
                        error={assignForm.errors.period_id}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Maks Kelompok</label>
                        <FormInput
                            type="number"
                            min="1"
                            max="20"
                            value={assignForm.data.max_groups}
                            onChange={(e) => assignForm.setData('max_groups', e.target.value)}
                        />
                        {assignForm.errors.max_groups && <p className="mt-1 text-xs text-red-500">{assignForm.errors.max_groups}</p>}
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
                            Batal
                        </Button>
                        <Button type="submit" loading={assignForm.processing}>
                            Tugaskan
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
