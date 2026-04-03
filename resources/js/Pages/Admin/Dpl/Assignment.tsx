import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, Modal } from '@/Components/ui';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    XMarkIcon,
    UserCircleIcon,
    AcademicCapIcon,
    ArrowUpRightIcon,
    BriefcaseIcon,
    CalendarIcon,
    UsersIcon,
    IdentificationIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Cpu } from 'lucide-react';

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

export default function DplAssignment({ assignments, allDosen, allPeriods }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [editingAssignment, setEditingAssignment] = useState<PeriodAssignment | null>(null);

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
                setEditingAssignment(null);
                assignForm.reset();
            },
        });
    };

    const openEditModal = (assignment: PeriodAssignment) => {
        setEditingAssignment(assignment);
        assignForm.setData({
            dosen_id: assignment.dosen_id.toString(),
            period_id: assignment.period_id.toString(),
            max_groups: assignment.max_groups.toString(),
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingAssignment(null);
        assignForm.reset();
        setShowModal(true);
    };

    const handleRemove = (dplPeriodId: number) => {
        if (confirm('KONFIRMASI: Apakah Anda yakin ingin menghentikan penugasan DPL ini?')) {
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
    const periodOptions = allPeriods.map(p => ({ value: p.id, label: `ANGKATAN ${p.angkatan} // ${p.jenis} (${p.name})` }));

    return (
        <AppLayout title="Penugasan Dosen (DPL)">
            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                PERSONNEL_ORCHESTRATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Matriks <span className="text-emerald-300">Penugasan</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Alokasi strategis Dosen Pembimbing Lapangan (DPL) ke periode aktif serta manajemen kapasitas bimbingan mahasiswa secara terpadu.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
                                <AcademicCapIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Total Otoritas</span>
                                <span className="text-2xl font-semibold text-white">{assignments.length} Entri</span>
                            </div>
                        </div>

                        <button 
                            onClick={openCreateModal} 
                            className="flex items-center gap-4 px-6 py-2 bg-white hover:bg-emerald-50 text-primary rounded-lg font-semibold text-xs"
                        >
                            <PlusIcon className="w-5 h-5 stroke-[3px]" />
                            Tugaskan DPL Baru
                        </button>
                    </div>
                </div>

                {/* Tactical Search Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
                    <div className="relative group max-w-md w-full">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari DPL atau Nama Periode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-lg text-sm text-sm text-slate-900 outline-none focus:border-primary/50 placeholder:opacity-50"
                        />
                    </div>
                </div>

                {/* Registry Ledger (Tactical Table) */}
                <div className="bg-whiterounded-lg border border-slate-200 overflow-hidden relative">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-6 text-left text-xs font-semibold  text-slate-400">Identitas Personel</th>
                                    <th className="px-6 py-6 text-left text-xs font-semibold  text-slate-400">Periode KKN</th>
                                    <th className="px-6 py-6 text-center text-xs font-semibold  text-slate-400">Beban Tugas</th>
                                    <th className="px-6 py-6 text-center text-xs font-semibold  text-slate-400">Status</th>
                                    <th className="px-6 py-6 text-right text-xs font-semibold  text-slate-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-50">
                                                <div className="p-6 bg-slate-50 rounded-lg">
                                                     <UserCircleIcon className="h-12 w-12 text-slate-200" />
                                                </div>
                                                <p className="text-[10px] font-semibold text-slate-500 ">PENUGASAN TIDAK DITEMUKAN</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((a) => (
                                        <tr key={a.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-whitefont-semibold text-xs h-12 w-12 flex items-center justify-center shrink-0">
                                                        {a.dosen.nama.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[14px] font-semibold text-slate-900 group-hover:text-primary transition-colors  truncate">{a.dosen.nama}</span>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <IdentificationIcon className="h-3 w-3 text-slate-300" />
                                                            <span className="text-[9px] text-sm text-slate-400 font-mono ">ID: {a.dosen.nip}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-semibold text-slate-800 ">{a.periode.name}</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="h-1 w-1 rounded-lg bg-primary/40" />
                                                        <span className="text-[10px] text-sm text-slate-400 ">{a.periode.jenis}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="flex items-baseline gap-1.5 p-1 px-3 bg-slate-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                                                        <span className="text-[16px] font-semibold text-slate-900">{a.kelompok_count}</span>
                                                        <span className="text-[10px] font-semibold text-slate-400  {a.max_groups}</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-lg overflow-hidden
                                                        <div 
                                                            className={clsx(
                                                                "h-full rounded-lg",
                                                                (a.kelompok_count / a.max_groups) >= 0.8 ? "bg-rose-500 : "bg-primary
                                                            )}
                                                            style={{ width: `${Math.min((a.kelompok_count / a.max_groups) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className={clsx(
                                                    "inline-flex px-4 py-1.5 rounded-lg text-[9px] font-semibold 
                                                    a.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                )}>
                                                    {a.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right">
                                                <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => openEditModal(a)} className="p-3 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:scale-105outline-none" title="ATUR PENUGASAN">
                                                        <ArrowUpRightIcon className="h-4 w-4 stroke-[2.5px]" />
                                                    </button>
                                                    {a.kelompok_count === 0 && (
                                                        <button onClick={() => handleRemove(a.id)} className="p-3 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:scale-105outline-none" title="HENTIKAN PENUGASAN">
                                                            <TrashIcon className="h-4 w-4 stroke-[2.5px]" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-1">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                                    <ShieldCheckIcon className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-semibold text-white ">GOVERNANCE_PERSONNEL_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 text-sm  mt-2 whitespace-nowrap">STATUS: DELEGATION_INTEGRITY_VERIFIED</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
                                Petunjuk Operasional: Batasan bimbingan (Load Factor) harus dipatuhi untuk menjamin kualitas bimbingan akademik pada tiap sektor KKN. 
                                Sistem secara otomatis akan mengunci modifikasi penugasan jika terdeteksi adanya keterikatan data kelompok aktif. 
                                Gunakan audit trail untuk memantau sejarah delegasi otoritas personel DPL secara temporal.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
                                <span className="text-[11px] font-semibold text-slate-100 ">AUTH_LINK_STABLE</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Cpu className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <div className="bg-white rounded-lg p-10 overflow-hidden relative border border-slate-200">
                    <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/30 flex items-center gap-6 relative overflow-hidden">
                        <div className="p-4 bg-primary rounded-[1.25rem] text-white relative z-10">
                            <BriefcaseIcon className="h-7 w-7 stroke-[2.5px]" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-semibold text-slate-900 ">
                                {editingAssignment ? 'Modifikasi_Delegasi' : 'Inisialisasi_Tugas'}
                            </h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-2  opacity-50">SINKRONISASI OTORITAS PERSONEL DPL</p>
                        </div>
                        <div className="absolute top-0 right-0 p-8 text-slate-900 pointer-events-none">
                            <BriefcaseIcon className="h-32 w-32" />
                        </div>
                        <button onClick={() => setShowModal(false)} className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100hover:rotate-90">
                            <XMarkIcon className="h-7 w-7" />
                        </button>
                    </div>

                    <form onSubmit={handleAssign} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-slate-400  ml-2 flex items-center gap-2">
                                    <UserCircleIcon className="h-3.5 w-3.5 text-primary/60" /> PILIH DPL
                                </label>
                                <FormSelect
                                    placeholder="PILIH DPL..."
                                    options={dosenOptions}
                                    value={assignForm.data.dosen_id}
                                    onChange={(e) => assignForm.setData('dosen_id', e.target.value)}
                                    error={assignForm.errors.dosen_id}
                                    className="bg-slate-50 border-slate-200 text-sm font-semibold text-slate-900 h-14 rounded-lg focus:bg-white focus:border-primary
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-slate-400  ml-2 flex items-center gap-2">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary/60" /> PILIH PERIODE
                                </label>
                                <FormSelect
                                    placeholder="PILIH PERIODE..."
                                    options={periodOptions}
                                    value={assignForm.data.period_id}
                                    onChange={(e) => assignForm.setData('period_id', e.target.value)}
                                    error={assignForm.errors.period_id}
                                    className="bg-slate-50 border-slate-200 text-sm font-semibold text-slate-900 h-14 rounded-lg focus:bg-white focus:border-primary
                                />
                            </div>

                            <div className="col-span-full space-y-3">
                                <label className="text-[10px] font-semibold text-slate-400  ml-2 flex items-center gap-2">
                                    <UsersIcon className="h-3.5 w-3.5 text-primary/60" /> BATAS KAPASITAS (MAKS. KELOMPOK)
                                </label>
                                <FormInput
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={assignForm.data.max_groups}
                                    onChange={(e) => assignForm.setData('max_groups', e.target.value)}
                                    error={assignForm.errors.max_groups}
                                    className="bg-slate-50 border-slate-200 text-lg font-semibold text-slate-900 h-14 rounded-lg focus:bg-white focus:border-primary
                                />
                                <p className="text-[9px] text-sm text-slate-400 ml-2 mt-2  opacity-50">* Rekomendasi kapasitas standar adalah 5-8 kelompok per DPL.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-10 border-t border-slate-200">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 bg-white text-slate-400 text-xs font-semibold  rounded-lg border border-slate-200 hover:bg-slate-50">
                                BATAL
                            </button>
                            <button type="submit" disabled={assignForm.processing} className="px-12 py-4 bg-slate-900 text-white text-xs font-semibold  rounded-lg hover:scale-[1.03]disabled:opacity-50">
                                {editingAssignment ? 'SIMPAN PERUBAHAN' : 'SIMPAN PENUGASAN'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
