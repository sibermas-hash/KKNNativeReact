import { useForm, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { useState } from 'react';
import {
 User,
 IdCard,
 GraduationCap,
 Calendar,
 FileText,
 ShieldCheck,
 XCircle,
 ArrowLeft,
 CheckCircle2,
 Download,
 Eye,
 MessageSquare,
 BadgeCheck,
 
 Cpu,
 Fingerprint,
 X,
 FileSearch,
 ShieldAlert
} from 'lucide-react';

interface Props extends PageProps {
 registration: {
 id: number;
 status: string;
 registration_date: string;
 notes?: string;
 student: {
 nim: string;
 name: string;
 gender: string;
 batch_year: number;
 faculty?: { name: string };
 program?: { name: string };
 };
 period: { name: string };
 group: { name: string; code: string } | null;
 documents: { id: number; document_type: string; file_name: string; file_path: string; status: string }[];
 };
}

export default function RegistrationShow({ registration }: Props) {
 const [showReject, setShowReject] = useState(false);
 const approveForm = useForm({});
 const rejectForm = useForm({ notes: '' });

 const isPending = registration.status === 'pending' || registration.status === 'document_submitted';

 return (
 <AppLayout title="Audit Berkas Mahasiswa">
 <Head title={`Audit: ${registration.student.name}`} />
 
 <div className="space-y-8 pb-24">
 {/* 
 Emerald Premium Header 
 Refining from basic header to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-6 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <Link href="/admin/registrations" className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg border border-slate-200 text-xs font-semibold text-emerald-100 hover:bg-white/20mb-2">
 <ArrowLeft className="w-3.5 h-3.5" />
 KEMBALI KE LEDGER
 </Link>
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <FileSearch className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-xs font-semibold text-emerald-100 ">
 _V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Profil <span className="text-emerald-300">Entitas Peserta</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Verifikasi identitas akademik, validasi dokumen persyaratan, dan otorisasi delegasi penempatan untuk pendaftaran KKN UIN SAIZU.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:transition-transform">
 <BadgeCheck className="h-6 w-6" />
 </div>
 <div>
 <span className="text-xs font-semibold text-emerald-200/60 block mb-1.5">Status Verifikasi</span>
 <StatusBadge status={registration.status} className="px-5 py-2 rounded-lg text-xs font-semibold " />
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:mx-2">
 {/* Primary Data Panel (Left) */}
 <div className="lg:col-span-2 space-y-6">
 {/* Student Core Profile - Tactical Overhaul */}
 <div className="bg-white rounded-lg border border-slate-100 p-12 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-14 text-slate-900 pointer-events-none group-">
 <User className="w-80 h-auto" />
 </div>

 <div className="relative z-10">
 <div className="flex flex-col md:flex-row md:items-center gap-6 mb-14">
 <div className="relative shrink-0">
 <div className="h-28 w-28 rounded-lg bg-slate-900 text-primary flex items-center justify-center text-5xl font-semibold border border-slate-800 relative z-10">
 {registration.student.name.charAt(0)}
 </div>
 <div className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-lg border-4 border-white z-20">
 <Zap className="h-4 w-4 fill-white" />
 </div>
 </div>
 <div className="space-y-4">
 <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 ">{registration.student.name}</h2>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-xs font-semibold 
 <ShieldCheck className="w-3.5 h-3.5" /> ENTITAS_VALID
 </div>
 <span className="text-xs font-semibold text-slate-300">Sistem Identifikasi Terpadu</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-200">
 <ProfileItem icon={IdCard} label="Nomor Induk Mahasiswa (NIM)" value={registration.student.nim} />
 <ProfileItem icon={GraduationCap} label="Fakultas / Unit Akademik" value={registration.student.faculty?.name || '_EMPTY'} />
 <ProfileItem icon={FileText} label="Program Studi / Jurusan" value={registration.student.program?.name || '_EMPTY'} />
 <ProfileItem icon={Calendar} label="Angkatan / Tahun Masuk" value={registration.student.batch_year.toString()} />
 </div>
 </div>
 </div>

 {/* Documents & Assets - Tactical Grid */}
 <div className="bg-white rounded-lg border border-slate-100 p-12 relative group">
 <div className="absolute top-0 right-0 p-12 text-primary ">
 <FileSearch className="w-48 h-48" />
 </div>

 <div className="flex items-center justify-between mb-12 relative z-10">
 <div className="space-y-2">
 <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary">
 <FileText className="w-6 h-6" />
 </div>
 Persyaratan_Dokumen
 </h3>
 <p className="text-xs font-semibold text-slate-400 ml-16">INTEGRITAS BERKAS PERSYARATAN</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
 {registration.documents.length > 0 ? registration.documents.map((doc) => (
 <div key={doc.id} className="group/doc relative bg-slate-50 border border-slate-200 rounded-lg p-8 hover:bg-white hover:border-primary/30cursor-default">
 <div className="flex items-center justify-between mb-6">
 <div className="p-3.5 bg-white rounded-lg border border-slate-100 group-hover/doc:bg-slate-900 group-hover/doc:border-slate-800 transition-colors">
 <FileText className="w-6 h-6 text-primary" />
 </div>
 <StatusBadge status={doc.status} className="text-xs font-semibold />
 </div>
 <div className="space-y-1.5 min-w-0">
 <p className="text-xs font-semibold text-slate-400 group-hover/doc:text-primary transition-colors">{doc.document_type}</p>
 <p className="text-base font-semibold text-slate-900 truncate leading-normal group-hover/doc:translate-x-1 transition-transform">{doc.file_name}</p>
 </div>

 <div className="mt-8 flex gap-4">
 <button className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-400 text-xs font-semibold rounded-lg hover:bg-primary hover:text-white hover:border-primaryflex items-center justify-center gap-3">
 <Eye className="w-4 h-4" /> Preview
 </button>
 <button className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900flex items-center justify-center gap-3">
 <Download className="w-4 h-4" /> Get_File
 </button>
 </div>
 </div>
 )) : (
 <div className="md:col-span-2 py-24 text-center border-[3px] border-dashed border-slate-200 rounded-lg bg-slate-50/30 flex flex-col items-center justify-center gap-6">
 <div className="p-6 bg-white rounded-lg text-slate-200">
 <FileSearch className="h-12 w-12" />
 </div>
 <p className="text-sm font-semibold text-slate-300 ">Belum ada dokumen yang diunggah ke gateway</p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Secondary Intel Panel (Right) */}
 <div className="space-y-8">
 {/* Enrolment Metadata - Tactical Dark */}
 <div className="bg-slate-900 rounded-lg p-12 border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-4 border-b border-slate-200 pb-8">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <Fingerprint className="h-6 w-6 text-primary />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-white ">Intel_Pendaftaran</h3>
 <p className="text-xs font-semibold text-emerald-400 mt-2">METADATA_STREAM_OK</p>
 </div>
 </div>
 <div className="space-y-8">
 <IntelRow label="Periode KKN" value={registration.period.name} />
 <IntelRow label="Waktu Sinkronisasi" value={registration.registration_date} />
 <IntelRow label="Penempatan Unit" value={registration.group?.name || 'WAITING_ALLOCATION'} color={registration.group ? 'text-primary' : 'text-slate-500'} />
 </div>
 </div>
 </div>

 {/* Decision Nexus - Emerald Tactical */}
 {isPending && (
 <div className="bg-white rounded-lg border border-slate-100 p-12 relative overflow-hidden group/nexus">
 <div className="absolute top-0 right-0 p-10 text-slate-900 pointer-events-none group-hover/nexus:transition-transform">
 <Cpu className="h-40 w-40" />
 </div>

 <div className="relative z-10">
 <div className="flex items-center gap-5 border-b border-slate-200 pb-8 mb-10">
 <div className="p-3.5 bg-emerald-50 text-primary rounded-lg border border-primary
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-slate-900 ">Otorisasi_Akses</h3>
 <p className="text-xs font-semibold text-slate-400 mt-2">KEPUTUSAN OPERASIONAL</p>
 </div>
 </div>

 {!showReject ? (
 <div className="space-y-5">
 <button
 onClick={() => approveForm.patch(`/admin/registrations/${registration.id}/approve`)}
 disabled={approveForm.processing}
 className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-4 disabled:opacity-50 group/approve"
 >
 <CheckCircle2 className="w-6 h-6 text-primary transition-transform" />
 SETUJUI_ENTITAS
 </button>
 <button
 onClick={() => setShowReject(true)}
 className="w-full py-6 bg-white hover:bg-rose-50 text-rose-500 rounded-lg text-xs font-semibold border-2 border-slate-200 hover:border-rose-200active:flex items-center justify-center gap-4
 >
 <XCircle className="w-6 h-6" />
 TOLAK_PENDAFTARAN
 </button>
 </div>
 ) : (
 <div className="space-y-8">
 <div className="p-8 bg-rose-50 rounded-lg border border-rose-100
 <FormTextarea
 label="JUSTIFIKASI PENOLAKAN"
 placeholder="Berikan alasan mengapa pendaftaran ini ditolak..."
 value={rejectForm.data.notes}
 onChange={(e) => rejectForm.setData('notes', e.target.value)}
 error={rejectForm.errors.notes}
 required
 className="bg-white border-rose-100 text-slate-900 text-sm h-32 rounded-lg"
 />
 </div>
 <div className="flex flex-col gap-4">
 <button
 onClick={() => rejectForm.patch(`/admin/registrations/${registration.id}/reject`)}
 disabled={rejectForm.processing}
 className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold "
 >
 KONFIRMASI_REJECT_AKSI
 </button>
 <button
 onClick={() => setShowReject(false)}
 className="w-full py-4 text-slate-400 text-xs font-semibold hover:text-slate-600flex items-center justify-center gap-3"
 >
 <X className="h-4 w-4" /> BATALKAN_PROSES
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 
 {registration.notes && (
 <div className="p-10 bg-amber-50 rounded-lg border border-amber-100 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-amber-600 pointer-events-none ">
 <MessageSquare className="h-40 w-40" />
 </div>
 <div className="relative z-10">
 <div className="flex items-center gap-4 mb-6">
 <div className="p-3 bg-white rounded-lg text-amber-500 border border-amber-100">
 <ShieldAlert className="w-6 h-6" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-amber-600 ">REJECTION_LOG</h4>
 <p className="text-xs font-semibold text-amber-400 mt-1.5">CATATAN_AUDIT_HISTORIS</p>
 </div>
 </div>
 <p className="text-sm text-amber-900 leading-normal bg-white/40 p-6 rounded-lg border border-amber-100/50">
 "{registration.notes}"
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function ProfileItem({ icon: Icon, label, value }: any) {
 return (
 <div className="group/item space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 group-hover/item:bg-primary/20 group-hover/item:border-primary/30">
 <Icon className="w-3.5 h-3.5 text-primary" />
 </div>
 <span className="text-xs font-semibold text-slate-300 group-hover/item:text-primary transition-colors">{label}</span>
 </div>
 <p className="text-base font-semibold text-slate-900 pl-1 ml-0.5 group-hover/item:translate-x-1 transition-transform">
 {value}
 </p>
 </div>
 );
}

function IntelRow({ label, value, color = 'text-slate-100' }: any) {
 return (
 <div className="flex flex-col gap-3 group/intel">
 <div className="flex items-center gap-2">
 <div className="h-1 w-3 bg-primary/40 rounded-lg group-hover/intel:w-6" />
 <span className="text-xs font-semibold text-slate-500 ">{label}</span>
 </div>
 <span className={`text-base font-semibold pl-5 ${color}`}>{value}</span>
 </div>
 );
}
