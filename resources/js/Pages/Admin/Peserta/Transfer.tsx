import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect, FormTextarea } from '@/Components/ui';
import {
 ArrowLeftRight,
 Search,
 RefreshCw,
 Users2,
 IdCard,
 Info,
 X,
 ShieldCheck,
 CheckCircle2,
 Fingerprint,
 Activity,
 ChevronRight,
 Cpu,
} from 'lucide-react';
import { clsx } from 'clsx';

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
}

export default function StudentTransfer({ students, targetPeriods }: Props) {
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

 const filtered = students.filter(s =>
 !search ||
 s.mahasiswa.nama.toLowerCase().includes(search.toLowerCase()) ||
 s.mahasiswa.nim.includes(search)
 );

 const transferableStudents = filtered.filter(s => s.status !== 'completed' && s.status !== 'rejected');

 const periodOptions = targetPeriods.map(p => ({
 value: p.id,
 label: `ANGKATAN ${p.angkatan} // ${p.jenis} [${p.name}]${p.kuota ? ` (CAP: ${p.kuota})` : ''}`,
 }));

 const groupOptions = targetGroups.map(g => ({
 value: g.id,
 label: `KELOMPOK ${g.nama} (${g.current_count}/${g.capacity ?? '∞'})${g.available !== null ? ` - SISA: ${g.available}` : ''}`,
 }));

 return (
 <AppLayout title="Transfer Peserta KKN">
 <Head title="Manajemen Re-Deployment" />

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 RE_DEPLOYMENT_CORE_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <ArrowLeftRight className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Transfer <span className="text-primary">Peserta</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Users2 className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Siap_Mobilisasi</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {transferableStudents.length} ACTIVE
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="relative group flex-1 w-full max-w-2xl">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_PERSONNEL (NAME / NIM)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>
 </div>

 {/* Data Registry */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">PERSONNEL_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">CURRENT_SYCO</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">UNIT_ASSIGNMENT</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">AUTHORIZATION</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">INITIALIZE_TRANSFER</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filtered.map((s) => {
 const canTransfer = s.status !== 'completed' && s.status !== 'rejected';
 return (
 <tr key={s.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center group-hover/row:scale-110 transition-transform">
 {s.mahasiswa.nama.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {s.mahasiswa.nama}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Fingerprint className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIM: {s.mahasiswa.nim}
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
 {s.periode.name}
 </span>
 </div>
 <span className="text-[8px] font-semibold text-slate-400 ml-3.5 opacity-50">
 FASE {s.periode.angkatan} // {s.periode.jenis}
 </span>
 </div>
 </td>
 <td className="px-8 py-6">
 {s.kelompok ? (
 <div className="inline-flex items-center gap-3 px-3 py-1 bg-white border border-primary/20 rounded-lg ">
 <Users2 className="w-3 h-3 text-primary/60" />
 <span className="text-[9px] font-semibold text-primary">
 {s.kelompok.nama_kelompok ?? s.kelompok.code}
 </span>
 </div>
 ) : (
 <span className="text-[9px] font-semibold text-slate-300 opacity-50">UNASSIGNED_UNIT</span>
 )}
 </td>
 <td className="px-8 py-6 text-center">
 <StatusBadge status={s.status} className="px-4 py-1.5 rounded-lg text-[8px] font-semibold border-none " />
 </td>
 <td className="px-8 py-6 text-right">
 {canTransfer ? (
 <button
 onClick={() => openTransfer(s)}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-primary transition-all rounded-lg text-[9px] font-semibold group/btn"
 >
 <RefreshCw className="w-3.5 h-3.5 text-primary group-hover/btn:rotate-180 transition-transform duration-500" />
 EXECUTE_TRANSFER
 </button>
 ) : (
 <div className="inline-flex items-center justify-center h-10 w-10 bg-slate-50 border border-slate-100 rounded-lg text-slate-300">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 )}
 </td>
 </tr>
 );
 })}
 {filtered.length === 0 && (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <IdCard className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">ZERO_COORDS_DETECTED</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Tactical Footer Monitor */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">STUDENT_MOBILITY_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: REDEPLOYMENT_LEDGER_SYNCED</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Setiap perpindahan peserta akan dicatat secara permanen dalam basis data re-deployment. 
 Seluruh luaran akademik akan dimigrasikan secara otomatis ke unit kelompok tujuan demi menjaga kontinuitas operasional.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">SECURITY_LEDGER_ACTIVE</span>
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

 {/* Transfer Modal - V3 Premium */}
 {showModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm fade-in duration-300">
 <div className="bg-white rounded-lg w-full max-w-2xl border border-slate-100 overflow-hidden zoom-in-95 duration-300">
 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 relative">
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-slate-900 rounded-lg text-primary">
 <ArrowLeftRight className="h-5 w-5" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-semibold text-slate-900">RE_DEPLOYMENT_CONFIG</h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">SYNCHRONIZING_PERSONNEL_VECTOR</span>
 </div>
 </div>
 <button 
 onClick={() => setShowModal(false)} 
 className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg hover:rotate-90 transition-all z-10"
 >
 <X className="h-5 w-5" />
 </button>
 <ArrowLeftRight className="absolute right-[-20px] bottom-[-20px] h-32 w-32 text-slate-100/50 -rotate-12 pointer-events-none" />
 </div>

 <form onSubmit={handleTransfer} className="p-10 space-y-8">
 {selectedStudent && (
 <div className="p-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-6">
 <div className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xl font-semibold text-primary">
 {selectedStudent.mahasiswa.nama.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <p className="text-sm font-semibold text-slate-900 truncate leading-none mb-1">{selectedStudent.mahasiswa.nama}</p>
 <div className="flex items-center gap-2">
 <span className="text-[8px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">VERIFIED_PROFILE</span>
 <span className="text-[10px] font-semibold text-slate-400 opacity-50 font-mono">NIM: {selectedStudent.mahasiswa.nim}</span>
 </div>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Calendar className="h-3 w-3 text-primary/60" /> TARGET_SYCO_PERIOD
 </label>
 <FormSelect
 placeholder="SELECT_TARGET..."
 options={periodOptions}
 value={transferForm.data.target_period_id}
 onChange={(e) => handlePeriodChange(e.target.value)}
 error={transferForm.errors.target_period_id}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none"
 />
 </div>

 <div className="space-y-3">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Users2 className="h-3 w-3 text-primary/60" /> TARGET_UNIT_GROUP
 </label>
 <FormSelect
 placeholder={loadingGroups ? 'SCANNING...' : 'SELECT_UNIT (OPTIONAL)...'}
 options={groupOptions}
 value={transferForm.data.target_group_id}
 onChange={(e) => transferForm.setData('target_group_id', e.target.value)}
 disabled={loadingGroups || targetGroups.length === 0}
 error={transferForm.errors.target_group_id}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none"
 />
 </div>

 <div className="col-span-full space-y-3">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Info className="h-3 w-3 text-primary/60" /> REDEPLOYMENT_JUSTIFICATION
 </label>
 <FormTextarea
 value={transferForm.data.reason}
 onChange={(e) => transferForm.setData('reason', e.target.value)}
 placeholder="Tuliskan justifikasi operasional pemindahan unit..."
 rows={3}
 error={transferForm.errors.reason}
 required
 className="bg-slate-50 border-slate-100 rounded-lg text-sm text-slate-900 focus:bg-white transition-all min-h-[100px]"
 />
 </div>
 </div>

 <div className="p-6 bg-primary/5 rounded-lg border border-primary/10 flex gap-4">
 <Info className="w-6 h-6 text-primary shrink-0 opacity-50" />
 <p className="text-[10px] font-semibold text-primary leading-relaxed">
 Peringatan: Eksekusi transfer akan memindahkan vektor operasional mahasiswa secara permanen. Seluruh logbooks dan luaran nilai akan dimigrasikan otomatis.
 </p>
 </div>

 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
 <button
 type="button"
 onClick={() => setShowModal(false)}
 className="px-8 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-900 transition-all"
 >
 ABORT_TRANSFER
 </button>
 <button
 type="submit"
 disabled={transferForm.processing}
 className="px-12 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
 >
 <RefreshCw className={clsx("w-3.5 h-3.5 text-primary", transferForm.processing && "animate-spin")} />
 {transferForm.processing ? 'EXECUTING...' : 'INIT_TRANSFER'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </AppLayout>
 );
}

// Re-using common icons but making sure they're imported
const Calendar = ({ className }: { className?: string }) => <CalendarIcon className={className} />;
import { Calendar as CalendarIcon } from 'lucide-react';
