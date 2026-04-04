import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormSelect, FormTextarea } from '@/Components/ui';
import { 
 PlusIcon, 
 CloudArrowUpIcon, 
 ArrowDownTrayIcon, 
 DocumentTextIcon,
 IdentificationIcon,
 AcademicCapIcon,
 SparklesIcon,
 BoltIcon,
 UserGroupIcon,
 TableCellsIcon,
 InformationCircleIcon
} from '@heroicons/react/24/outline';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

interface GroupWithStudents {
 id: number;
 name: string;
 registrations: { student: { id: number; nim: string; name: string } }[];
}

interface Props extends PageProps {
 groups: GroupWithStudents[];
 evaluations: { id: number; student: { name: string; nim: string }; group: { name: string }; total_score?: number; grade?: string }[];
}

export default function DplEvaluationsPage({ groups, evaluations }: Props) {
 const [showForm, setShowForm] = useState(false);

 // Manual Evaluation Form
 const manualForm = useForm({
 group_id: '',
 student_id: '',
 evaluator_type: 'dpl',
 notes: '',
 items: [
 { criterion: 'Kehadiran', score: '', weight: 20 },
 { criterion: 'Kedisiplinan', score: '', weight: 20 },
 { criterion: 'Partisipasi', score: '', weight: 20 },
 { criterion: 'Output Kerja', score: '', weight: 20 },
 { criterion: 'Laporan', score: '', weight: 20 },
 ]
 });

 // Import Excel Form
 const importForm = useForm({
 group_id: '',
 file: null as File | null,
 });

 const handleManualSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 manualForm.post(route('dpl.evaluations.store'), {
 onSuccess: () => {
 setShowForm(false);
 manualForm.reset();
 }
 });
 };

 const handleImportSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 importForm.post(route('dpl.evaluations.validate-import'), {
 onSuccess: () => {
 importForm.reset();
 const fileInput = document.getElementById('import-file') as HTMLInputElement;
 if (fileInput) fileInput.value = '';
 }
 });
 };

 const selectedGroup = groups.find((g) => String(g.id) === manualForm.data.group_id);
 const students = selectedGroup?.registrations?.map((r) => r.student) ?? [];

 const updateItem = (index: number, score: string) => {
 const newItems = [...manualForm.data.items];
 newItems[index].score = score;
 manualForm.setData('items', newItems);
 };

 return (
 <AppLayout title="Evaluasi dan Arsip Nilai">
 <Head title="Audit Penilaian Mahasiswa" />
 
 <div className="space-y-8 pb-16">
 {/* Professional Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="h-1.5 w-1.5 rounded-lg bg-primary" />
 <span className="text-[10px] text-sm text-slate-400 Akademik</span>
 </div>
 <h1 className="text-3xl font-extrabold text-slate-900 
 Evaluasi <span className="text-primary">Arsip</span> Nilai
 </h1>
 <p className="text-slate-500 text-sm mt-2 font-medium">Protokol penentuan kualifikasi akademik mahasiswa berdasarkan performa lapangan.</p>
 </div>

 <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200
 <div className="p-3 bg-primary/10 rounded-lg">
 <IdentificationIcon className="h-5 w-5 text-primary" />
 </div>
 <div>
 <span className="text-[10px] text-sm text-slate-400 block">Audit Selesai</span>
 <span className="text-xl font-extrabold text-slate-900">{evaluations.length} <span className="text-xs text-slate-400">MAHASISWA</span></span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-6">
 <div className="flex flex-col space-y-8">
 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
 <TableCellsIcon className="h-4 w-4 text-slate-400" />
 </div>
 <h3 className="text-sm font-semibold text-slate-900">Arsip Ledger Penilaian</h3>
 </div>
 {!showForm && (
 <Button 
 onClick={() => setShowForm(true)}
 className="h-12 px-6 rounded-lg bg-primary hover:bg-primary-dark flex items-center gap-3 group/btnactive:"
 >
 <PlusIcon className="h-4 w-4 transition-transform" />
 <span className="text-[9px] font-semibold text-white">Input Nilai Manual</span>
 </Button>
 )}
 </div>

 {showForm && (
 <div className="rounded-lg border border-slate-200 bg-white p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-slate-900 pointer-events-none ">
 <BoltIcon className="h-32 w-32" />
 </div>

 <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6 relative z-10">
 <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
 <PlusIcon className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900">Transmisi Penilaian Baru</h3>
 <p className="text-[9px] text-sm text-slate-400 mt-0.5">Entri Nilai Manual Tunggal</p>
 </div>
 </div>

 <form onSubmit={handleManualSubmit} className="space-y-8 relative z-10">
 <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
 <FormSelect
 label="Target Kelompok"
 options={groups.map(g => ({ value: g.id, label: g.name }))}
 value={manualForm.data.group_id}
 onChange={(e) => manualForm.setData('group_id', e.target.value)}
 error={manualForm.errors.group_id}
 required
 className="bg-slate-50 border-slate-200 rounded-lg"
 />
 <FormSelect
 label="Subjek Mahasiswa"
 options={students.map(s => ({ value: s.id, label: `${s.nim} - ${s.name}` }))}
 disabled={!manualForm.data.group_id}
 value={manualForm.data.student_id}
 onChange={(e) => manualForm.setData('student_id', e.target.value)}
 error={manualForm.errors.student_id}
 required
 className="bg-slate-50 border-slate-200 rounded-lg"
 />
 </div>

 <div className="overflow-hiddenrounded-lg border border-slate-200 bg-white
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-5 text-[9px] font-semibold text-slate-400 ">Matriks Kriteria</th>
 <th className="px-6 py-5 text-[9px] font-semibold text-slate-400 w-32 border-x border-slate-200">Bobot</th>
 <th className="px-6 py-5 text-[9px] font-semibold text-slate-400 w-32">Nilai</th>
 </tr>
 </thead>
 <tbody>
 {manualForm.data.items.map((item, i) => (
 <tr key={i} className="hover:bg-slate-50/30 transition-colors border-b border-slate-200 last:border-0">
 <td className="px-6 py-6 text-xs text-sm text-slate-700 ">{item.criterion}</td>
 <td className="px-6 py-6 text-xs font-semibold text-slate-400 border-x border-slate-200">{item.weight}%</td>
 <td className="px-6 py-6">
 <input
 type="number"
 min="0"
 max="100"
 value={item.score}
 onChange={(e) => updateItem(i, e.target.value)}
 className="w-full bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary
 placeholder="0-100"
 required
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <FormTextarea 
 label="Disertasi Observasi (Opsional)" 
 value={manualForm.data.notes} 
 onChange={(e) => manualForm.setData('notes', e.target.value)} 
 rows={2} 
 className="bg-slate-50 border-slate-200 rounded-lg"
 />

 <div className="flex gap-4 pt-4 border-t border-slate-200">
 <Button 
 type="submit" 
 loading={manualForm.processing}
 className="h-14 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs "
 >
 Verifikasi & Simpan
 </Button>
 <Button 
 variant="secondary" 
 onClick={() => setShowForm(false)}
 className="h-14 px-6 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-500 font-semibold text-xs "
 >
 Batal
 </Button>
 </div>
 </form>
 </div>
 )}

 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-6 text-xs font-semibold text-slate-400 ">Indentitas Mahasiswa</th>
 <th className="px-6 py-6 text-xs font-semibold text-slate-400 ">Penugasan Unit</th>
 <th className="px-6 py-6 text-xs font-semibold text-slate-400 ">Skor Total</th>
 <th className="px-6 py-6 text-xs font-semibold text-slate-400 text-right">Kualifikasi</th>
 </tr>
 </thead>
 <tbody>
 {evaluations.map((ev) => (
 <tr key={ev.id} className="group/row hover:bg-slate-50/50 transition-colors border-b border-slate-200 last:border-0">
 <td className="px-6 py-3">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover/row:bg-primary/5 group-hover/row:text-primary group-hover/row:border-primary/10">
 <AcademicCapIcon className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 group-hover/row:text-primary transition-colors mb-1">{ev.student.name}</p>
 <p className="text-[10px] font-semibold text-slate-400 
 </div>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 <UserGroupIcon className="h-3.5 w-3.5 text-slate-300" />
 <span className="text-[11px] text-sm text-slate-600 ">{ev.group.name}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-baseline gap-2">
 <span className="text-lg font-semibold text-slate-900 underline decoration-primary/10 decoration-2">{ev.total_score ?? '-'}</span>
 <span className="text-[9px] text-sm text-slate-400 
 </div>
 </td>
 <td className="px-6 py-3 text-right">
 <Badge 
 variant={ev.grade === 'A' || ev.grade === 'B' ? 'success' : ev.grade === 'C' ? 'warning' : 'danger'}
 className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-semibold ml-auto"
 >
 {ev.grade ?? '-'}
 </Badge>
 </td>
 </tr>
 ))}
 {evaluations.length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-20 text-center">
 <div className="mb-4 flex justify-center">
 <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
 <TableCellsIcon className="h-10 w-10 text-slate-200" />
 </div>
 </div>
 <h4 className="text-xs font-semibold text-slate-300 ">Ledger Evaluasi Kosong</h4>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-8">
 <section className="bg-white rounded-lg border border-slate-100 p-10 relative overflow-hidden group h-fit">
 <div className="absolute top-0 right-0 p-8 text-primary group-transition-transform pointer-events-none">
 <CloudArrowUpIcon className="h-32 w-32" />
 </div>

 <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6">
 <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
 <CloudArrowUpIcon className="h-5 w-5 text-primary" />
 </div>
 <h3 className="text-sm font-semibold text-slate-900">Impor Batch</h3>
 </div>

 <form onSubmit={handleImportSubmit} className="space-y-8 relative z-10">
 <FormSelect
 label="Target Unit"
 options={groups.map(g => ({ value: g.id, label: g.name }))}
 value={importForm.data.group_id}
 onChange={(e) => importForm.setData('group_id', e.target.value)}
 error={importForm.errors.group_id}
 required
 className="bg-slate-50 border-slate-200 rounded-lg"
 />
 
 <div className="space-y-4">
 <label className="text-[10px] font-semibold text-slate-400 px-1">Arsip Sumber (.xlsx)</label>
 <div className="relative group/file">
 <input
 id="import-file"
 type="file"
 accept=".xlsx,.xls"
 onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
 className="hidden"
 required
 />
 <label 
 htmlFor="import-file"
 className={clsx(
 "flex flex-col items-center justify-center p-8rounded-lg border-2 border-dashedcursor-pointer",
 importForm.data.file ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-primary/40"
 )}
 >
 <ArrowDownTrayIcon className={clsx("h-10 w-10 mb-4 transition-transform group-hover/file:-", importForm.data.file ? "text-emerald-500" : "text-slate-200")} />
 <span className="text-[10px] font-semibold ? importForm.data.file.name : 'Pilih File Excel'}</span>
 </label>
 </div>
 {importForm.errors.file && <p className="text-[10px] font-semibold text-rose-500 mt-2">{importForm.errors.file}</p>}
 </div>

 <Button 
 type="submit" 
 variant="primary" 
 className="w-full h-14 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs "
 loading={importForm.processing}
 >
 Sinkronisasi Massal
 </Button>
 </form>
 </section>

 <section className="bg-primary/5 rounded-lg p-10 border border-primary/10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-primary group-transition-transform pointer-events-none">
 <InformationCircleIcon className="h-32 w-32" />
 </div>
 
 <h4 className="text-[10px] font-semibold mb-8 flex items-center gap-3 text-primary">
 <span className="flex h-2 w-2 rounded-lg bg-primary" />
 Protokol Import
 </h4>
 
 <div className="space-y-6 relative z-10">
 <div className="flex gap-4 items-start">
 <div className="h-6 w-6 rounded-lg bg-white border border-primary flex items-center justify-center shrink-0">
 <SparklesIcon className="h-3 w-3 text-primary" />
 </div>
 <p className="text-[10px] text-sm text-slate-600 leading-normal indentitas NIM sebagai kunci sinkronisasi utama.</p>
 </div>
 <div className="flex gap-4 items-start">
 <div className="h-6 w-6 rounded-lg bg-white border border-primary flex items-center justify-center shrink-0">
 <DocumentTextIcon className="h-3 w-3 text-primary" />
 </div>
 <p className="text-[10px] text-sm text-slate-600 leading-normal internal: Kedisiplinan & Sikap dihitung @50% integrasi.</p>
 </div>
 <div className="flex gap-4 items-start">
 <div className="h-6 w-6 rounded-lg bg-white border border-primary flex items-center justify-center shrink-0">
 <BoltIcon className="h-3 w-3 text-primary" />
 </div>
 <p className="text-[10px] text-sm text-slate-600 leading-normal ">Data audit lama akan dioverwrite secara otomatis oleh sistem.</p>
 </div>
 </div>
 </section>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
