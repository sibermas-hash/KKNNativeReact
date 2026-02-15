import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, FormTextarea, Modal } from '@/Components/ui';

interface Student {
    id: number;
    mahasiswa: {
        nama: string;
        nim: string;
    };
    status: string;
    kelompok?: {
        id: number;
        nama_kelompok: string;
        code: string;
    } | null;
    periode: {
        id: number;
        name: string;
        angkatan: number;
        jenis: string;
    };
}

interface PeriodOption {
    id: number;
    name: string;
    angkatan: number;
    jenis: string;
    kuota: number | null;
}

interface GroupOption {
    id: number;
    nama: string;
    capacity: number | null;
    current_count: number;
    available: number | null;
}

interface Props {
    students: Student[];
    targetPeriods: PeriodOption[];
    title: string;
}

export default function StudentTransfer({ students, targetPeriods, title }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroups, setTargetGroups] = useState<GroupOption[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [search, setSearch] = useState('');

    const transferForm = useForm({
        peserta_kkn_id: '',
        target_period_id: '',
        target_group_id: '',
        reason: '',
    });

    const openTransfer = (student: Student) => {
        setSelectedStudent(student);
        transferForm.setData('peserta_kkn_id', String(student.id));
        transferForm.setData('target_period_id', '');
        transferForm.setData('target_group_id', '');
        transferForm.setData('reason', '');
        setTargetGroups([]);
        setShowModal(true);
    };

    const handlePeriodChange = async (value: string) => {
        transferForm.setData('target_period_id', value);
        transferForm.setData('target_group_id', '');
        setTargetGroups([]);

        if (value) {
            setLoadingGroups(true);
            try {
                const res = await fetch(`/admin/api/transfer-targets?current_period_id=${selectedStudent?.periode.id}&target_period_id=${value}`);
                const data = await res.json();
                setTargetGroups(data.groups || []);
            } catch {
                setTargetGroups([]);
            } finally {
                setLoadingGroups(false);
            }
        }
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        transferForm.post('/admin/peserta/transfer', {
            onSuccess: () => {
                setShowModal(false);
                setSelectedStudent(null);
                transferForm.reset();
            },
        });
    };

    const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
        pending: { variant: 'warning', label: 'Pending' },
        approved: { variant: 'success', label: 'Disetujui' },
        rejected: { variant: 'danger', label: 'Ditolak' },
        transferred: { variant: 'info', label: 'Dipindahkan' },
        completed: { variant: 'success', label: 'Selesai' },
    };

    const filtered = students.filter(s =>
        !search ||
        s.mahasiswa.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.mahasiswa.nim.includes(search)
    );

    const transferableStudents = filtered.filter(s => s.status !== 'completed' && s.status !== 'rejected');

    const periodOptions = targetPeriods.map(p => ({
        value: p.id,
        label: `Angkatan ${p.angkatan} - ${p.jenis} (${p.name})${p.kuota ? ` [Kuota: ${p.kuota}]` : ''}`,
    }));

    const groupOptions = targetGroups.map(g => ({
        value: g.id,
        label: `${g.nama} (${g.current_count}/${g.capacity ?? '∞'})${g.available !== null ? ` - Sisa ${g.available}` : ''}`,
    }));

    return (
        <AppLayout title={title}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 max-w-xl">
                    <FormInput
                        placeholder="Cari nama mahasiswa atau NIM..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <p className="hidden lg:block text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
                    {transferableStudents.length} Mahasiswa dapat dipindahkan
                </p>
            </div>

            {/* Student List */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Mahasiswa</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Periode</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Kelompok</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Data peserta tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const status = statusMap[s.status] || { variant: 'warning' as const, label: s.status };
                                    const canTransfer = s.status !== 'completed' && s.status !== 'rejected';
                                    return (
                                        <tr key={s.id} className="transition hover:bg-slate-50/80 group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.mahasiswa.nama}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded w-fit mt-1">
                                                        NIM: {s.mahasiswa.nim}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-xs">
                                                    <span className="font-bold text-slate-700">{s.periode.name}</span>
                                                    <span className="text-slate-400 font-medium">
                                                        Angkatan {s.periode.angkatan} • {s.periode.jenis}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                {s.kelompok ? (
                                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">
                                                        {s.kelompok.nama_kelompok || s.kelompok.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum ditempatkan</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant={status.variant} className="text-[9px] font-black uppercase tracking-widest">
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canTransfer && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="font-black text-[10px] uppercase tracking-wider text-indigo-600 hover:bg-indigo-50"
                                                        onClick={() => openTransfer(s)}
                                                    >
                                                        Pindahkan
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transfer Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <form onSubmit={handleTransfer} className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 mb-2">Pindahkan Peserta</h3>
                    {selectedStudent && (
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-sm font-bold text-slate-700">{selectedStudent.mahasiswa.nama}</p>
                            <p className="text-xs text-slate-500">
                                NIM: {selectedStudent.mahasiswa.nim} • Dari: {selectedStudent.periode.name}
                            </p>
                        </div>
                    )}

                    <FormSelect
                        label="Periode Tujuan"
                        placeholder="Pilih Periode Tujuan..."
                        options={periodOptions}
                        value={transferForm.data.target_period_id}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        error={transferForm.errors.target_period_id}
                    />

                    <FormSelect
                        label="Kelompok Tujuan (Opsional)"
                        placeholder={loadingGroups ? 'Memuat kelompok...' : 'Pilih Kelompok (opsional)...'}
                        options={groupOptions}
                        value={transferForm.data.target_group_id}
                        onChange={(e) => transferForm.setData('target_group_id', e.target.value)}
                        disabled={loadingGroups || targetGroups.length === 0}
                        error={transferForm.errors.target_group_id}
                    />

                    <FormTextarea
                        label="Alasan Pemindahan"
                        value={transferForm.data.reason}
                        onChange={(e) => transferForm.setData('reason', e.target.value)}
                        placeholder="Jelaskan alasan pemindahan peserta..."
                        rows={3}
                        error={transferForm.errors.reason}
                    />

                    <div className="pt-4 flex gap-3 justify-end">
                        <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
                            Batal
                        </Button>
                        <Button type="submit" loading={transferForm.processing}>
                            Pindahkan
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
