import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, Modal } from '@/Components/ui';
import {
 Plus,
 Search,
 Trash2,
 X,
 UserCircle,
 GraduationCap,
 ExternalLink,
 Briefcase,
 Calendar,
 Users2,
 Fingerprint,
 ShieldCheck,
 Cpu,
 Activity,
 Edit2,
 ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

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
 <AppLayout title="Matriks Penugasan DPL">
 <Head title="Penugasan Dosen" />
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 PERSONNEL_ORCHESTRATION_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <ShieldCheck className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Matriks <span className="text-primary">Penugasan</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <GraduationCap className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Total_Otoritas</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {assignments.length} ENTRIES
 </span>
 </div>
 </div>
 </div>

 <button 
 onClick={openCreateModal}
 className="px-6 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
 >
 <Plus className="w-3.5 h-3.5 text-emerald-400" />
 ASSIGN_NEW_OFFICER
 </button>
 </div>
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="relative group flex-1 w-full max-w-2xl">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_DPL_REGISTRY (NAME / NIP / PERIOD)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>
 <div className="flex items-center gap-3 text-slate-300">
 <div className="h-1 w-12 bg-slate-50 rounded-full" />
 <span className="text-[9px] font-semibold">Delegated: <span className="text-primary">{filtered.length}</span> / {allDosen.length}</span>
 </div>
 </div>

 {/* Registry Ledger (Tactical Table) */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">OFFICER_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">TEMPORAL_SECTOR</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">LOAD_FACTOR</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">STATUS_LINK</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">OPERATIONS</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filtered.map((a) => (
 <tr key={a.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center group-hover/row:scale-110 transition-transform">
 {a.dosen.nama.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {a.dosen.nama}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Fingerprint className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIP: {a.dosen.nip}
 </span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
 <span className="text-[10px] font-semibold text-slate-900">
 {a.periode.name}
 </span>
 </div>
 <span className="text-[8px] font-semibold text-slate-400 ml-3.5 opacity-50">
 {a.periode.jenis} // ANGKATAN {a.periode.angkatan}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-col items-center gap-2 max-w-[120px] mx-auto">
 <div className="flex items-baseline gap-1.5">
 <span className="text-sm font-semibold text-slate-900 leading-none">{a.kelompok_count}</span>
 <span className="text-[9px] font-semibold text-slate-300 opacity-50">/</span>
 <span className="text-[10px] font-semibold text-slate-400 leading-none">{a.max_groups}</span>
 </div>
 <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 overflow-hidden p-0.5">
 <div
 className={clsx(
 "h-full rounded-full transition-all duration-700",
 (a.kelompok_count / a.max_groups) >= 0.8 ? 'bg-rose-500' : 'bg-primary'
 )}
 style={{ width: `${Math.min((a.kelompok_count / a.max_groups) * 100, 100)}%` }}
 />
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className={clsx(
 "inline-flex px-3 py-1 bg-white border rounded-lg text-[8px] font-semibold transition-all ",
 a.is_active ? 'text-primary border-primary/20' : 'text-slate-300 border-slate-100'
 )}>
 {a.is_active ? 'ACTIVE_LINK' : 'LINK_TERMINATED'}
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <div className="flex justify-end gap-2">
 <button
 onClick={() => openEditModal(a)}
 className="h-9 w-9 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 rounded-lg transition-all flex items-center justify-center"
 title="UPDATE_PARAMS"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 {a.kelompok_count === 0 && (
 <button
 onClick={() => handleRemove(a.id)}
 className="h-9 w-9 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all flex items-center justify-center"
 title="TERMINATE_DELEGATION"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 {filtered.length === 0 && (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <Users2 className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">ZERO_DELEGATIONS_FOUND</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Tactical Emerald Footer Monitor */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">GOVERNANCE_PERSONNEL_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: DELEGATION_INTEGRITY_SAFE</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Petunjuk Operasional: Batasan bimbingan (Load Factor) harus dipatuhi untuk menjamin kualitas bimbingan akademik. 
 Sistem secara otomatis akan mengunci modifikasi penugasan jika terdeteksi adanya keterikatan data kelompok aktif. 
 Gunakan audit trail untuk memantau sejarah delegasi secara temporal.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">AUTH_LINK_STABLE</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Activity className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
 <div className="bg-white rounded-lg overflow-hidden border border-slate-100">
 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 relative">
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-primary rounded-lg text-white">
 <Briefcase className="h-5 w-5" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-semibold text-slate-900">
 {editingAssignment ? 'UPDATE_DELEGATION_PARAMS' : 'INITIALIZE_OFFICER_ASSIGNMENT'}
 </h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">SINKRONISASI OTORITAS PERSONEL DPL</span>
 </div>
 </div>
 <button 
 onClick={() => setShowModal(false)} 
 className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg hover:rotate-90 transition-all z-10"
 >
 <X className="h-5 w-5" />
 </button>
 <Briefcase className="absolute right-[-20px] bottom-[-20px] h-32 w-32 text-slate-100/50 -rotate-12 pointer-events-none" />
 </div>

 <form onSubmit={handleAssign} className="p-10 space-y-10">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <UserCircle className="h-3 w-3 text-primary/60" /> SELECT_DPL_PERSONNEL
 </label>
 <FormSelect
 placeholder="SELECT_DPL..."
 options={dosenOptions}
 value={assignForm.data.dosen_id}
 onChange={(e) => assignForm.setData('dosen_id', e.target.value)}
 error={assignForm.errors.dosen_id}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none"
 />
 </div>

 <div className="space-y-4">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Calendar className="h-3 w-3 text-primary/60" /> TARGET_PERIODE
 </label>
 <FormSelect
 placeholder="SELECT_PERIOD..."
 options={periodOptions}
 value={assignForm.data.period_id}
 onChange={(e) => assignForm.setData('period_id', e.target.value)}
 error={assignForm.errors.period_id}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none"
 />
 </div>

 <div className="col-span-full space-y-4">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Activity className="h-3 w-3 text-primary/60" /> LOAD_FACTOR_LIMIT (MAX_GROUPS)
 </label>
 <FormInput
 type="number"
 min="1"
 max="20"
 value={assignForm.data.max_groups}
 onChange={(e) => assignForm.setData('max_groups', e.target.value)}
 error={assignForm.errors.max_groups}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white transition-all"
 />
 <p className="text-[9px] font-semibold text-slate-400 ml-1 opacity-50 leading-relaxed">
 * Rekomendasi beban operasional standar adalah 5-8 unit per DPL demi efisiensi bimbingan sektor.
 </p>
 </div>
 </div>

 <div className="flex items-center justify-between pt-10 border-t border-slate-50">
 <div className="flex items-center gap-4 text-slate-300">
 <ShieldCheck className="h-5 w-5" />
 <span className="text-[9px] font-semibold">DATA_INTEGRITY_V3.2</span>
 </div>
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setShowModal(false)}
 className="px-8 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-900 transition-all font-sans"
 >
 CANCEL_DELEGATION
 </button>
 <button
 type="submit"
 disabled={assignForm.processing}
 className="px-12 py-3 bg-primary text-white rounded-lg text-[10px] font-semibold hover:-translate-y-1 transition-all disabled:opacity-50"
 >
 {assignForm.processing ? 'SYNCING...' : (editingAssignment ? 'CONFIRM_MODIFICATION' : 'EXECUTE_ASSIGNMENT')}
 </button>
 </div>
 </div>
 </form>
 </div>
 </Modal>
 </AppLayout>
 );
}
