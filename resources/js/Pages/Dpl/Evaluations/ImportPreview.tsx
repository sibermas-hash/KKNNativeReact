import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge } from '@/Components/ui';
import {
 CheckCircleIcon,
 ExclamationCircleIcon,
 ArrowLeftIcon,
 CloudArrowUpIcon,
 UserGroupIcon
} from '@heroicons/react/24/outline';

interface PreviewItem {
 id: number | null;
 nim: string;
 name: string;
 discipline: number;
 attitude: number;
 status: 'READY' | 'NOT_IN_GROUP' | 'NOT_FOUND';
}

interface Props {
 preview: PreviewItem[];
 group: any;
}

export default function ImportPreview({ preview, group }: Props) {
 const readyCount = preview.filter(p => p.status === 'READY').length;

 const handleConfirm = () => {
 router.post(route('dpl.evaluations.import'), {
 group_id: group.id,
 data: preview as any
 });
 };

 return (
 <AppLayout title="Preview Nilai">
 <Head title="Preview Nilai KKN" />

 <div className="max-w-6xl mx-auto pb-20 p-6">
 <div className="flex items-center gap-4 mb-8">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => window.history.back()}
 className="rounded-xl"
 >
 <ArrowLeftIcon className="w-4 h-4 mr-2" />
 Kembali
 </Button>
 <div className="h-4 w-px bg-slate-200 mx-2" />
 <div>
 <h1 className="text-2xl font-semibold text-slate-900 Import Nilai</h1>
 <p className="text-slate-500 text-sm font-medium">Tinjau data dari file sebelum disimpan ke database.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Left side: Stats & Action */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-whiterounded-lg p-6 border border-slate-200 overflow-hidden relative">
 <div className="relative z-10">
 <p className="text-[10px] font-semibold text-slate-400 mb-4">Ringkasan File</p>
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-sm text-sm text-slate-600">Total Baris</span>
 <span className="text-lg font-semibold text-slate-900">{preview.length}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-sm text-slate-600 text-emerald-600">Siap Import</span>
 <Badge variant="success" className="text-xs font-semibold px-3">{readyCount}</Badge>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-sm text-slate-600 text-rose-600">Bermasalah</span>
 <Badge variant="danger" className="text-xs font-semibold px-3">{preview.length - readyCount}</Badge>
 </div>
 </div>
 </div>
 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 rounded-lg blur-3xl opacity-50" />
 </div>

 <div className="bg-slate-900rounded-lg p-6 text-white
 <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
 <UserGroupIcon className="w-5 h-5 text-indigo-400" />
 Kelompok Target
 </h4>
 <p className="text-2xl font-semibold mb-1">{group.name}</p>
 <p className="text-xs text-slate-400 text-sm 
 </div>

 <Button
 onClick={handleConfirm}
 disabled={readyCount === 0}
 size="lg"
 className="w-full h-14 rounded-lg font-semibold 
 >
 <CloudArrowUpIcon className="w-5 h-5 mr-2" />
 Selesaikan Import
 </Button>
 </div>

 {/* Right side: Table Preview */}
 <div className="lg:col-span-3">
 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500 
 <th className="px-6 py-4">Mahasiswa</th>
 <th className="px-6 py-4 text-center">Kedisiplinan</th>
 <th className="px-6 py-4 text-center">Sikap</th>
 <th className="px-6 py-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {preview.map((item, idx) => (
 <tr key={idx} className={`group hover:bg-slate-50/50 transition-colors ${item.status !== 'READY' ? 'bg-rose-50/20' : ''}`}>
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900">{item.name}</div>
 <div className="text-xs font-mono text-slate-400">{item.nim}</div>
 </td>
 <td className="px-6 py-4 text-center font-semibold text-slate-700">{item.discipline}</td>
 <td className="px-6 py-4 text-center font-semibold text-slate-700">{item.attitude}</td>
 <td className="px-6 py-4">
 {item.status === 'READY' ? (
 <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
 <CheckCircleIcon className="w-4 h-4" />
 READY
 </div>
 ) : (
 <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold">
 <ExclamationCircleIcon className="w-4 h-4" />
 {item.status === 'NOT_FOUND' ? 'NIM TIDAK DITEMUKAN' : 'BUKAN ANGGOTA KELOMPOK'}
 </div>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
