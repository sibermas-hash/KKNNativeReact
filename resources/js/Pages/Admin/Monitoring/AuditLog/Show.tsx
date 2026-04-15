import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { ChevronLeft, Clock, User, Layers, Code2, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface AuditLog {
 id: number; description: string; subject_type: string | null; subject_id: number | null;
 causer_type: string | null; causer_id: number | null; causer?: { name: string };
 properties: Record<string, unknown>; created_at: string;
}
interface Props { log: AuditLog; }

export default function AuditLogShow({ log }: Props) {
 const subjectModel = log.subject_type?.split('\\').pop() || 'Sistem';
 const causerModel = log.causer_type?.split('\\').pop() || 'Internal';

 return (
 <AppLayout title="Detail Log Aktivitas">
 <Head title={`Detail Log #${log.id} | POS-KKN`} />

 <div className="min-h-screen bg-emerald-50/30/50 pb-20">
 {/* Header */}
 <div className="bg-white border-b border-emerald-100/60">
 <div className="max-w-[1600px] mx-auto px-8 py-6">
 <div className="flex items-center gap-6">
 <Link href={route('admin.audit-log.index')} className="h-12 w-12 rounded-xl bg-emerald-50/30 text-emerald-950 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-emerald-100/60">
 <ChevronLeft size={20} />
 </Link>
 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <div className="h-2 w-2 bg-emerald-500 rounded-full" />
 <span className="text-xs font-semibold text-emerald-600 font-semibold text-xs">Detail Aktivitas</span>
 </div>
 <h1 className="text-3xl font-semibold text-black tracking-tight">
 Log <span className="text-emerald-600">#{log.id.toString().padStart(6, '0')}</span>
 </h1>
 <p className="text-emerald-950 text-base font-medium">
 Analisis perubahan data dan aktor yang terlibat dalam aktivitas ini.
 </p>
 </div>
 </div>
 </div>
 </div>

 <div className="max-w-[1600px] mx-auto px-8 mt-8">
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
 {/* Main */}
 <div className="xl:col-span-8 space-y-8">
 {/* Description */}
 <div className="bg-white rounded-3xl border border-emerald-100/60 shadow-xl overflow-hidden">
 <div className="px-8 py-6 border-b border-emerald-100/60 bg-emerald-50/30/30 flex items-center gap-5">
 <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
 <Info size={22} />
 </div>
 <div>
 <h2 className="text-base font-bold text-black">Ringkasan Aktivitas</h2>
 <p className="text-sm text-emerald-950 mt-0.5">Deskripsi dan waktu kejadian</p>
 </div>
 </div>
 <div className="p-8 space-y-6">
 <p className="text-lg font-bold text-black">{log.description}</p>
 <div className="flex items-center gap-3 text-emerald-950">
 <Clock size={16} />
 <span className="text-sm font-medium tabular-nums">{log.created_at}</span>
 </div>
 </div>
 </div>

 {/* Info Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <InfoCard label="Aktor" value={log.causer?.name || 'Sistem'} sub={`Tipe: ${causerModel}`} icon={User} />
 <InfoCard label="Subjek" value={subjectModel} sub={log.subject_id ? `ID: #${log.subject_id}` : 'Tidak ada ID subjek'} icon={Layers} />
 </div>

 {/* Properties JSON */}
 <div className="bg-white rounded-3xl border border-emerald-100/60 shadow-xl overflow-hidden">
 <div className="px-8 py-6 border-b border-emerald-100/60 bg-emerald-50/30/30 flex items-center gap-5">
 <div className="h-12 w-12 rounded-2xl bg-emerald-50/60 text-emerald-950 flex items-center justify-center border border-emerald-100/60 shadow-sm">
 <Code2 size={22} />
 </div>
 <div>
 <h2 className="text-base font-bold text-black">Data Properti</h2>
 <p className="text-sm text-emerald-950 mt-0.5">Detail perubahan data dalam format JSON</p>
 </div>
 </div>
 <div className="p-6 bg-emerald-900 rounded-b-3xl">
 <pre className="text-sm text-white leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono tabular-nums">
 {JSON.stringify(log.properties, null, 4)}
 </pre>
 </div>
 </div>
 </div>

 {/* Sidebar */}
 <div className="xl:col-span-4 space-y-8">
 <div className="bg-white rounded-3xl border border-emerald-100/60 shadow-xl p-8 space-y-6">
 <h3 className="text-sm font-bold text-black">Metadata</h3>
 <div className="space-y-4">
 <MetaRow label="ID Subjek" value={log.subject_id ? `#${log.subject_id.toString().padStart(4, '0')}` : '-'} />
 <MetaRow label="Tipe Aktor" value={causerModel} />
 <MetaRow label="Aksi" value={log.description.split(' ')[0]} />
 <MetaRow label="Modul" value={subjectModel} />
 </div>
 </div>

 <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-8 space-y-4">
 <h3 className="text-sm font-bold text-bg-emerald-100">Catatan</h3>
 <p className="text-sm text-emerald-950 leading-relaxed">
 Log ini bersifat permanen dan tidak dapat diubah. Seluruh data mutasi tercatat untuk menjamin akuntabilitas operasional sistem KKN.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function InfoCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ElementType }) {
 return (
 <div className="bg-white rounded-3xl border border-emerald-100/60 shadow-xl p-8 space-y-4">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
 <Icon size={18} />
 </div>
 <span className="text-xs font-bold text-emerald-950 font-semibold text-xs">{label}</span>
 </div>
 <p className="text-lg font-bold text-black">{value}</p>
 <p className="text-xs text-emerald-950">{sub}</p>
 </div>
 );
}

function MetaRow({ label, value }: { label: string; value: string }) {
 return (
 <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
 <span className="text-xs font-semibold text-emerald-950">{label}</span>
 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{value}</span>
 </div>
 );
}
