import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps, LucideIcon } from '@/types';
import {
 User,
 FileText,
 ShieldCheck,
 ArrowLeft,
 Clock,
 Users,
 ChevronRight,
 Activity,
 Target,
 Briefcase,
 Zap,
 XCircle,
 LayoutDashboard,
 AlertCircle,
 Fingerprint,
 Database,
 CheckCircle2,
 Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface RegistrationDocument {
 id: number;
 document_type?: string | null;
 file_name?: string | null;
 file_path?: string | null;
 status?: string | null;
}

interface RegistrationData {
 id: number;
 status: string;
 registration_date?: string | null;
 notes?: string | null;
 rejection_reason?: string | null;
 revision_count?: number | null;
 last_rejected_at?: string | null;
 resubmitted_at?: string | null;
 role?: string | null;
 mahasiswa?: {
 nim?: string | null;
 nama?: string | null;
 gender?: string | null;
 batch_year?: number | null;
 fakultas?: { nama?: string | null } | null;
 prodi?: { nama?: string | null } | null;
 } | null;
 periode?: {
 name?: string | null;
 governance?: {
 program_type_label?: string | null;
 program_subtype_label?: string | null;
 registration_mode_label?: string | null;
 placement_mode_label?: string | null;
 } | null;
 guide?: {
 requirements?: string[];
 governance_notes?: string[];
 } | null;
 } | null;
 kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
 dokumen?: RegistrationDocument[];
}

interface Props extends PageProps {
 registration: RegistrationData;
}

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function RegistrationShow({ registration }: Props) {
 const [showRejectForm, setShowRejectForm] = useState(false);
 const approveForm = useForm({});
 const rejectForm = useForm({
 notes: registration.rejection_reason ?? '',
 });

 const documents = useMemo(() => registration.dokumen ?? [], [registration.dokumen]);
 const isPending = ['menunggu', 'pending', 'document_submitted'].includes(registration.status);

 return (
 <AppLayout title="Pusat Verifikasi Data Peserta">
 <Head title={`Otorisasi Data Peserta: ${registration.mahasiswa?.nama || '-'}`} />

 <motion.div
 initial="hidden"
 animate="visible"
 variants={containerVariants}
 className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-20 font-sans"
 >
 {/* --- COMMAND HEADER --- */}
 <motion.div
 variants={itemVariants}
 className="flex flex-col lg:flex-row lg:items-end justify-between gap-16"
 >
 <div className="space-y-8">
 <div className="flex items-center gap-6 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">
 Pusat Operasional / Verifikasi Data Peserta
 </span>
 </div>
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight flex flex-col pt-3">
 Aturan <span>Identifikasi.</span>
 </h1>
 <p className="text-xl font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-3xl ">
 Siklus validasi identitas dan prasyarat akademik. <br />
 <span className="text-black not-italic opacity-100">
 Otentikasi basis data mahasiswa, audit validitas berkas, dan finalisasi status pendaftaran program.
 </span>
 </p>
 </div>

 <div className="flex flex-wrap gap-6 shrink-0">
 <Link
 href="/admin/pendaftaran"
 className="h-12 px-6 rounded-xl bg-white border border-gray-200 text-black hover:border-emerald-500 hover:text-emerald-700 transition-all flex items-center justify-center gap-6 group/btn shadow-sm active:scale-95 no-underline font-bold font-semibold text-xs text-sm"
 >
 <ArrowLeft
 size={24}
 strokeWidth={3}
 className="group-hover/btn:-translate-x-3 transition-transform"
 />
 Batalkan & Keluar
 </Link>
 <div className="h-12 px-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden group">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent)]" />
 <div className="flex flex-col gap-2 relative z-10">
 <span className="text-sm font-bold text-white tracking-wider text-xs font-semibold leading-none">
 Status Aturan
 </span>
 <div className="scale-125 origin-left pt-2">
 <StatusBadge status={registration.status} />
 </div>
 </div>
 </div>
 </div>
 </motion.div>

 {/* --- STRATEGIC METRICS MATRIX --- */}
 <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
 <MetricCard
 label="ID Pendaftaran"
 value={`#REG-${registration.id.toString().padStart(5, '0')}`}
 icon={Fingerprint}
 color="emerald"
 desc="Identifikasi Unik"
 />
 <MetricCard
 label="Repositori Berkas"
 value={`${documents.length} Dokumen`}
 icon={Database}
 color="emerald"
 desc="Manifest Persyaratan"
 />
 <MetricCard
 label="Siklus Revisi"
 value={`${registration.revision_count ?? 0} kali`}
 icon={Activity}
 color="amber"
 desc="Loop Iterasi"
 />
 <MetricCard
 label="Penempatan Unit"
 value={registration.kelompok?.code || 'MENUNGGU PENEMPATAN'}
 icon={Target}
 color="rose"
 desc="Delegasi Unit"
 />
 </motion.div>

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
 <div className="xl:col-span-8 space-y-16">
 {/* --- ENTITY PROFILE --- */}
 <motion.section
 variants={itemVariants}
 className="bg-white border border-gray-200 rounded-[4.5rem] overflow-hidden shadow-sm"
 >
 <div className="px-6 py-6 bg-emerald-600 flex items-center gap-6">
 <div className="h-16 w-16 bg-emerald-900 border border-emerald-800 rounded-3xl flex items-center justify-center shadow-2xl">
 <User size={32} className="text-white" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-500 tracking-[0.6em]">
 Registri Data Personal
 </h3>
 <p className="text-2xl font-bold text-white font-bold text-center leading-none">
 Profil Data Peserta
 </p>
 </div>
 </div>
 <div className="p-16">
 <dl className="grid gap-x-16 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
 <DetailItem label="Nama Lengkap Sesuai Identitas" value={registration.mahasiswa?.nama} />
 <DetailItem label="NIM (Nomor Induk Mahasiswa)" value={registration.mahasiswa?.nim} />
 <DetailItem
 label="Manajemen Fakultas"
 value={registration.mahasiswa?.fakultas?.nama}
 />
 <DetailItem label="Manajemen Program Studi" value={registration.mahasiswa?.prodi?.nama} />
 <DetailItem
 label="Angkatan Akademik"
 value={registration.mahasiswa?.batch_year?.toString()}
 />
 <DetailItem
 label="Identitas Gender"
 value={registration.mahasiswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
 />
 </dl>
 </div>
 </motion.section>

 {/* --- REQUIREMENT INVENTORY --- */}
 <motion.section
 variants={itemVariants}
 className="bg-white border border-gray-200 rounded-[4.5rem] overflow-hidden shadow-sm"
 >
 <div className="px-6 py-6 bg-gray-50/50 border-b border-emerald-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
 <FileText size={32} className="text-emerald-500" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-700/30 tracking-[0.6em]">
 Inventarisasi Berkas
 </h3>
 <p className="text-2xl font-bold text-black font-bold text-center leading-none">
 Manifest Berkas Persyaratan
 </p>
 </div>
 </div>
 <div className="bg-emerald-600 px-6 py-5 rounded-xl border border-emerald-900 flex items-center gap-6 shadow-xl">
 <span className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold leading-none">
 Manifest Terverifikasi
 </span>
 <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
 </div>
 </div>
 <div className="p-12 space-y-6">
 {documents.length > 0 ? (
 documents.map((doc) => (
 <div
 key={doc.id}
 className="group/doc relative flex items-center justify-between p-10 bg-white border border-emerald-50/50 rounded-xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden"
 >
 <div className="absolute top-[-40px] right-[-40px] opacity-0 group-hover/doc:opacity-[0.03] group-hover/doc:scale-150 transition-all duration-1000 rotate-12">
 <FileText size={200} strokeWidth={1} />
 </div>
 <div className="flex items-center gap-6 relative z-10">
 <div className="w-20 h-10 rounded-xl bg-emerald-50/30 border border-emerald-100/30 flex flex-col items-center justify-center group-hover/doc:bg-emerald-600 group-hover/doc:text-white group-hover/doc:rotate-6 transition-all duration-500 shadow-sm overflow-hidden">
 <span className="text-sm font-bold leading-none text-black group-hover/doc:text-emerald-500 pb-1">
 PDF
 </span>
 <div className="h-px w-8 bg-emerald-200 group-hover:bg-emerald-800 my-2" />
 <span className="text-sm font-bold text-emerald-700/30 tracking-normal ">DATA</span>
 </div>
 <div className="flex flex-col gap-3">
 <span className="text-xl font-bold text-black font-bold text-center group-hover/doc:text-emerald-600 transition-colors leading-none truncate max-w-[400px]">
 {doc.document_type || 'Dokumen Tidak Spesifik'}
 </span>
 <div className="flex items-center gap-4">
 <span className="text-sm font-bold text-emerald-700/20 font-semibold text-xs font-mono truncate max-w-sm leading-none">
 {doc.file_name}
 </span>
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-100" />
 <span className="text-sm font-bold text-emerald-700/30 leading-none tracking-normal">
 Tervalidasi Digital
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-8 relative z-10">
 <div className="scale-125 group-hover/doc:scale-150 transition-all duration-500">
 <StatusBadge status={doc.status || 'pending'} />
 </div>
 <Link
 href={doc.file_path || '#'}
 target="_blank"
 className="h-16 w-16 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-200 hover:text-emerald-600 hover:border-emerald-500 hover:rotate-12 transition-all shadow-sm shadow-emerald-900/5 group-hover/doc:scale-110"
 >
 <ChevronRight size={32} strokeWidth={3} />
 </Link>
 </div>
 </div>
 ))
 ) : (
 <div className="py-40 text-center border-4 border-dashed border-emerald-50/20 rounded-xl bg-emerald-50/5 flex flex-col items-center gap-6 group/none hover:border-emerald-200 transition-all duration-700">
 <AlertCircle size={100} strokeWidth={1} className="text-emerald-50 group-hover/none:text-emerald-100" />
 <div className="space-y-4">
 <p className="text-xs font-bold text-emerald-700/10 tracking-[0.8em] leading-none">
 Repositori Berkas Kosong
 </p>
 <p className="text-sm font-bold text-emerald-700/40 font-semibold text-xs leading-none">
 BELUM ADA BERKAS PERSYARATAN YANG DIUNGGAH.
 </p>
 </div>
 </div>
 )}
 </div>
 </motion.section>
 </div>

 <div className="xl:col-span-4 space-y-16">
 {/* --- SESSION TELEMETRY --- */}
 <motion.section
 variants={itemVariants}
 className="bg-emerald-600 rounded-xl p-12 text-white space-y-12 relative overflow-hidden group/s shadow-[0_45px_100px_rgba(6,78,59,0.3)]"
 >
 <div className="absolute top-[-50px] right-[-50px] opacity-10 group-hover:rotate-45 transition-transform duration-[2000ms] pointer-events-none">
 <LayoutDashboard size={300} strokeWidth={0.5} />
 </div>
 <div className="flex items-center gap-8 relative z-10">
 <div className="h-14 w-14 bg-emerald-900 border border-emerald-800 rounded-xl flex items-center justify-center group-hover/s:rotate-12 transition-all">
 <Info size={28} className="text-white" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-500 tracking-[0.6em] leading-none">
 Telemetri Sesi Audit
 </h3>
 <p className="text-2xl font-bold text-white font-bold text-center pt-1 leading-none">
 Data Pokok Pendaftaran
 </p>
 </div>
 </div>
 <div className="space-y-8 relative z-10 pt-4">
 <SummaryItem
 label="Waktu Pengiriman"
 value={registration.registration_date}
 icon={Clock}
 />
 <SummaryItem
 label="Program KKN Tujuan"
 value={
 registration.periode?.governance?.program_subtype_label ||
 registration.periode?.governance?.program_type_label ||
 registration.periode?.name
 }
 icon={Briefcase}
 />
 <SummaryItem
 label="Metode Pendaftaran"
 value={registration.periode?.governance?.registration_mode_label}
 icon={Fingerprint}
 />
 <SummaryItem
 label="Delegasi Unit Kelompok"
 value={registration.kelompok?.nama_kelompok || 'MENUNGGU PENEMPATAN'}
 icon={Users}
 />
 </div>
 </motion.section>

 {/* --- TACTICAL COMMAND HUB --- */}
 <motion.section
 variants={itemVariants}
 className={clsx(
 'rounded-[4.5rem] border p-12 shadow-2xl transition-all duration-700 space-y-12',
 isPending
 ? 'bg-white border-emerald-500 shadow-emerald-950/10 ring-8 ring-emerald-500/5'
 : 'bg-emerald-50/20 border-gray-200',
 )}
 >
 <div className="flex items-center gap-8">
 <div
 className={clsx(
 'h-16 w-16 rounded-xl flex items-center justify-center shadow-2xl transition-colors duration-500',
 isPending ? 'bg-emerald-600 text-white shadow-emerald-900/50' : 'bg-emerald-100 text-white',
 )}
 >
 <ShieldCheck size={32} strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-700/30 tracking-wider text-xs font-semibold leading-none">
 Aturan Keputusan
 </h3>
 <p className="text-2xl font-bold text-black font-bold text-center pt-1 leading-none">
 Otorisasi Ketetapan
 </p>
 </div>
 </div>

 {isPending ? (
 <div className="space-y-8">
 <AnimatePresence mode="wait">
 {!showRejectForm ? (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="space-y-6"
 >
 <button
 onClick={() =>
 approveForm.patch(`/admin/pendaftaran/${registration.id}/setujui`)
 }
 disabled={approveForm.processing}
 className="w-full h-12 bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-xs tracking-wider text-xs font-semibold rounded-xl shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-30 border-none cursor-pointer"
 >
 {approveForm.processing ? (
 <Activity size={24} className="animate-spin text-white" />
 ) : (
 <CheckCircle2 size={24} strokeWidth={3} className="text-white" />
 )}
 Otorisasi & Setujui
 </button>
 <button
 onClick={() => setShowRejectForm(true)}
 className="w-full h-12 bg-white border-2 border-emerald-50 text-emerald-200 hover:text-rose-600 hover:border-rose-100 transition-all duration-500 rounded-xl text-sm font-bold tracking-wider text-xs font-semibold shadow-sm active:scale-95 cursor-pointer"
 >
 Inisialisasi Penolakan
 </button>
 </motion.div>
 ) : (
 <motion.form
 initial={{ opacity: 0, x: 30 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -30 }}
 onSubmit={(e) => {
 e.preventDefault();
 rejectForm.patch(`/admin/pendaftaran/${registration.id}/tolak`, {
 onSuccess: () => setShowRejectForm(false),
 });
 }}
 className="space-y-10"
 >
 <div className="space-y-4">
 <label className="text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30 ml-2">
 Aturan Alasan Penolakan
 </label>
 <textarea
 required
 placeholder="Berikan alasan yang jelas agar mahasiswa dapat memperbaiki berkas..."
 value={rejectForm.data.notes}
 onChange={(e) => rejectForm.setData('notes', e.target.value)}
 className="w-full h-56 px-6 py-8 rounded-[2.5rem] bg-emerald-50/30 border-2 border-emerald-50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 text-sm font-bold transition-all duration-500 placeholder:text-emerald-700/10 text-black outline-none"
 />
 </div>
 <div className="flex gap-6">
 <button
 type="button"
 onClick={() => setShowRejectForm(false)}
 className="flex-1 h-10 bg-emerald-50 text-emerald-300 font-bold text-sm font-semibold text-xs rounded-3xl hover:bg-emerald-100 hover:text-emerald-700 transition-all border-none cursor-pointer"
 >
 Batalkan Aksi
 </button>
 <button
 type="submit"
 disabled={rejectForm.processing}
 className="flex-[2] h-10 bg-rose-600 hover:bg-rose-950 text-white font-bold text-sm tracking-wider text-xs font-semibold rounded-3xl shadow-2xl shadow-rose-900/20 transition-all flex items-center justify-center gap-5 px-6 border-none cursor-pointer"
 >
 {rejectForm.processing ? (
 <Activity size={20} className="animate-spin text-rose-300" />
 ) : (
 <XCircle size={20} strokeWidth={2.5} className="text-rose-300" />
 )}
 Konfirmasi Penolakan
 </button>
 </div>
 </motion.form>
 )}
 </AnimatePresence>
 </div>
 ) : (
 <div className="space-y-10">
 <div className="p-10 bg-emerald-50/30 border border-emerald-50 rounded-xl space-y-6 shadow-sm">
 <div className="flex items-center gap-4 text-emerald-700/20">
 <AlertCircle size={18} strokeWidth={2.5} />
 <p className="text-sm font-bold tracking-wider text-xs font-semibold leading-none mb-1">
 Log Distribusi Audit:
 </p>
 </div>
 <p className="text-base font-bold text-black leading-relaxed tracking-tight opacity-80">
 "
 {registration.status === 'rejected'
 ? registration.rejection_reason || 'TIDAK ADA ALASAN PENOLAKAN TERCATAT.'
 : registration.notes || 'DATA DISETUJUI TANPA CATATAN KHUSUS.'}
 "
 </p>
 </div>
 {registration.status === 'rejected' && (
 <div className="flex items-center gap-6 px-6 py-6 bg-rose-50 rounded-3xl border border-rose-100 w-fit shadow-sm">
 <Activity size={20} className="text-rose-500" strokeWidth={2.5} />
 <span className="text-sm font-bold text-rose-600 tracking-wider text-xs font-semibold leading-none">
 Loop Iterasi: {registration.revision_count ?? 0}
 </span>
 </div>
 )}
 </div>
 )}
 </motion.section>
 </div>
 </div>
 </motion.div>
 </AppLayout>
 );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
 return (
 <div className="space-y-4 group/item">
 <dt className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none group-hover/item:text-emerald-500 transition-colors duration-500">
 {label}
 </dt>
 <dd className="text-lg font-bold text-black leading-none font-bold text-center truncate group-hover/item:text-emerald-700 transition-colors duration-500">
 {value || 'NIHIL'}
 </dd>
 </div>
 );
}

function SummaryItem({
 label,
 value,
 icon: Icon,
}: {
 label: string;
 value?: string | null;
 icon: any;
}) {
 return (
 <div className="flex items-center gap-8 group/sitem">
 <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500/20 group-hover/sitem:bg-white group-hover/sitem:text-black group-hover/sitem:rotate-12 transition-all duration-500 shadow-2xl shrink-0">
 <Icon size={28} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col gap-2">
 <span className="text-sm font-bold text-emerald-500/30 tracking-wider text-xs font-semibold leading-none">
 {label}
 </span>
 <span className="text-base font-bold text-white font-bold text-center leading-tight truncate max-w-[200px]">
 {value || 'NIHIL'}
 </span>
 </div>
 </div>
 );
}

function MetricCard({
 label,
 value,
 icon: Icon,
 color,
 desc,
}: {
 label: string;
 value: string;
 icon: any;
 color: 'emerald' | 'amber' | 'rose' | 'slate';
 desc: string;
}) {
 return (
 <div className="bg-white border border-gray-200 p-10 rounded-xl shadow-sm hover:shadow-emerald-950/10 transition-all duration-500 group relative overflow-hidden font-sans">
 <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:scale-150 group-hover:rotate-12 transition-all duration-1000 text-black">
 <Icon size={180} strokeWidth={1} />
 </div>
 <div className="flex flex-col gap-8 relative z-10">
 <div className="flex items-center justify-between">
 <div
 className={clsx(
 'h-16 w-16 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm',
 color === 'emerald'
 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
 : color === 'amber'
 ? 'bg-amber-50 text-amber-600 border border-amber-100'
 : color === 'rose'
 ? 'bg-rose-50 text-rose-600 border border-rose-100'
 : 'bg-emerald-50 text-emerald-700/40 border border-emerald-100',
 )}
 >
 <Icon size={28} strokeWidth={2.5} />
 </div>
 <span className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none">{desc}</span>
 </div>
 <div>
 <p className="text-sm font-bold text-emerald-700/30 tracking-wider text-xs font-semibold mb-4 leading-none opacity-100">
 {label}
 </p>
 <p className="text-3xl font-bold text-black tracking-tight leading-none truncate" title={value}>
 {value}
 </p>
 </div>
 </div>
 </div>
 );
}
