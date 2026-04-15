import { Head, Link } from '@inertiajs/react';
import {
 ArrowLeft,
 ClipboardList,
 MapPin,
 ShieldCheck,
 Users,
 Activity,
 Target,
 Zap,
 Briefcase,
 Building2,
 LayoutDashboard,
 Globe,
 Camera,
 Info,
 CheckCircle2,
 UserCheck,
 Lock,
 Search,
 ChevronRight,
 UserPlus,
 Cpu,
 ArrowRight,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps, LucideIcon } from '@/types';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GroupLecturer {
 id: number;
 nama?: string | null;
 nip?: string | null;
 pivot?: {
 role?: string | null;
 } | null;
}

interface GroupStudent {
 id: number;
 status: string;
 role?: string | null;
 mahasiswa?: {
 nim?: string | null;
 nama?: string | null;
 fakultas?: {
 nama?: string | null;
 } | null;
 prodi?: {
 nama?: string | null;
 } | null;
 } | null;
}

interface WorkProgram {
 id: number;
 title?: string | null;
 status?: string | null;
}

interface GroupData {
 id: number;
 code?: string | null;
 nama_kelompok?: string | null;
 token?: string | null;
 capacity?: number | null;
 status: string;
 periode?: {
 name?: string | null;
 } | null;
 lokasi?: {
 village_name?: string | null;
 district_name?: string | null;
 regency_name?: string | null;
 full_name?: string | null;
 address?: string | null;
 } | null;
 dosen?: GroupLecturer[];
 peserta?: GroupStudent[];
 program_kerja?: WorkProgram[];
 posko?: {
 id?: number;
 latitude?: number | string | null;
 longitude?: number | string | null;
 gmaps_link?: string | null;
 photo_url?: string | null;
 photo_name?: string | null;
 updated_at?: string | null;
 } | null;
}

interface Props extends PageProps {
 group: GroupData;
 members?: GroupStudent[];
}

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function GroupShow({ group, members = [] }: Props) {
 const memberRows = members.length > 0 ? members : (group.peserta ?? []);
 const lecturerRows = group.dosen ?? [];
 const workPrograms = group.program_kerja ?? [];
 const mainLecturer =
 lecturerRows.find((l) => l.pivot?.role === 'Ketua') ?? lecturerRows[0] ?? null;
 const approvedCount = memberRows.filter((m) => m.status === 'approved').length;
 const pendingCount = memberRows.filter((m) => m.status === 'pending').length;
 const availableSlots = Math.max((group.capacity ?? 0) - approvedCount, 0);

 return (
 <AppLayout title={`Spesifikasi Detail Unit: ${group.code || ''}`}>
 <Head title={`Audit Komprehensif Unit: ${group.nama_kelompok || ''}`} />

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
 <div className="flex items-center gap-6">
 <Link
 href="/admin/kelompok"
 className="h-16 w-16 bg-white border border-gray-200 rounded-3xl flex items-center justify-center text-emerald-200 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group/back"
 >
 <ArrowLeft
 size={28}
 strokeWidth={2.5}
 className="group-hover/back:-translate-x-2 transition-transform"
 />
 </Link>
 <div className="space-y-1">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">
 Pusat Kendali / Audit Unit Operasional
 </span>
 </div>
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight flex flex-col pt-3">
 Identitas <span>{group.code || 'Unit'}</span>.
 </h1>
 </div>
 </div>
 <p className="text-xl font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-3xl ">
 {group.nama_kelompok} <br />
 <span className="text-black not-italic opacity-100">
 Audit struktur unit, pembimbing, keanggotaan, dan rencana kerja lapangan terpadu.
 </span>
 </p>
 </div>

 <div className="flex flex-wrap gap-6 shrink-0">
 <div className="h-28 px-6 rounded-xl bg-gray-50/50 border border-gray-200 flex flex-col justify-center gap-2 shadow-sm group">
 <div className="flex items-center gap-3">
 <Lock size={14} className="text-emerald-300" strokeWidth={3} />
 <span className="text-sm font-bold text-emerald-700/30 tracking-wider text-xs font-semibold leading-none">
 Manajemen Token Akses
 </span>
 </div>
 <p className="text-3xl font-bold text-black tracking-[0.2em] font-mono group-hover:text-emerald-500 transition-colors leading-none">
 {group.token || 'NIHIL'}
 </p>
 </div>
 <div className="h-28 px-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent)]" />
 <div className="flex flex-col gap-2 relative z-10">
 <span className="text-sm font-bold text-white tracking-wider text-xs font-semibold leading-none">
 Status Keaktifan Unit
 </span>
 <div className="scale-125 origin-left pt-2">
 <StatusBadge status={group.status} />
 </div>
 </div>
 </div>
 </div>
 </motion.div>

 {/* --- STRATEGIC METRICS MATRIX --- */}
 <motion.div
 variants={itemVariants}
 className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8"
 >
 <MetricCard
 label="Siklus Aktif"
 value={group.periode?.name || 'NIHIL'}
 icon={Briefcase}
 color="emerald"
 desc="Siklus Berjalan"
 />
 <MetricCard
 label="Pembimbing Utama"
 value={mainLecturer?.nama?.split(' ')[0] || 'NIHIL'}
 icon={UserCheck}
 color="emerald"
 desc="Delegasi DPL"
 />
 <MetricCard
 label="Kapasitas Terisi"
 value={approvedCount}
 icon={CheckCircle2}
 color="emerald"
 desc="Peserta Lolos"
 />
 <MetricCard label="Menunggu Validasi" value={pendingCount} icon={Activity} color="amber" desc="Antrean Review" />
 <MetricCard label="Sisa Kuota" value={availableSlots} icon={Lock} color="rose" desc="Slot Tersedia" />
 <MetricCard
 label="Manifest Proker"
 value={workPrograms.length}
 icon={ClipboardList}
 color="emerald"
 desc="Total Program"
 />
 </motion.div>

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
 <div className="xl:col-span-8 space-y-16">
 {/* --- UNIT PERSONNEL LEDGER --- */}
 <motion.section
 variants={itemVariants}
 className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
 >
 <div className="px-6 py-6 bg-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-900 border border-emerald-800 rounded-3xl flex items-center justify-center shadow-2xl">
 <Users size={32} className="text-white" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold">
 Inventarisasi Personel
 </h3>
 <p className="text-2xl font-bold text-white font-bold text-center leading-none">
 Ledger Personel Unit
 </p>
 </div>
 </div>
 <div className="h-px flex-1 mx-16 bg-white/5 hidden lg:block" />
 <div className="flex items-center gap-6 text-white">
 <span className="text-sm font-bold tracking-wider text-xs font-semibold opacity-40">
 Total Beban Kerja
 </span>
 <span className="text-2xl font-bold text-emerald-500 tabular-nums leading-none">
 {memberRows.length}
 </span>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left">
 <thead className="bg-gray-50/50 border-b border-emerald-50/50">
 <tr>
 <th className="px-6 py-8 text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30">
 Data Peserta / NIM
 </th>
 <th className="px-6 py-8 text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30">
 Basis Akademik
 </th>
 <th className="px-6 py-8 text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30">
 Manajemen Peran
 </th>
 <th className="px-6 py-8 text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30">
 Status Validitas
 </th>
 <th className="px-6 py-8 text-sm font-bold tracking-wider text-xs font-semibold text-emerald-700/30 text-right">
 Manajemen Aksi
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-50/50">
 {memberRows.length > 0 ? (
 memberRows.map((m) => (
 <tr key={m.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
 <td className="px-6 py-6">
 <div className="flex flex-col gap-3">
 <span className="text-lg font-bold text-black tracking-tight leading-none group-hover:text-emerald-600 transition-colors truncate max-w-[250px]">
 {m.mahasiswa?.nama || '-'}
 </span>
 <span className="text-sm font-bold text-emerald-700/20 font-semibold text-xs font-mono leading-none">
 {m.mahasiswa?.nim || '-'}
 </span>
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="flex flex-col gap-3">
 <span className="text-sm font-bold text-black tracking-tight leading-none max-w-[200px] truncate">
 {m.mahasiswa?.prodi?.nama || '-'}
 </span>
 <span className="text-sm font-bold text-emerald-700/20 font-semibold text-xs leading-none">
 {m.mahasiswa?.fakultas?.nama || '-'}
 </span>
 </div>
 </td>
 <td className="px-6 py-6">
 <div
 className={clsx(
 'inline-flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold font-bold text-center leading-none shadow-sm',
 m.role === 'Ketua'
 ? 'bg-emerald-600 text-white border border-emerald-800'
 : 'bg-emerald-50/50 text-emerald-700/30 border border-gray-200',
 )}
 >
 {m.role === 'Ketua' && <ShieldCheck size={14} strokeWidth={3} />}
 {m.role || 'ANGGOTA'}
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="scale-110 origin-left">
 <StatusBadge status={m.status} />
 </div>
 </td>
 <td className="px-6 py-6 text-right">
 <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-500">
 <Link
 href={`/admin/pendaftaran/${m.id}`}
 className="h-14 px-8 bg-white border border-emerald-100 shadow-sm text-black hover:bg-emerald-600 hover:text-white rounded-2xl flex items-center justify-center text-sm font-bold font-semibold text-xs transition-all no-underline"
 >
 Audit
 </Link>
 {m.role !== 'Ketua' && m.status === 'approved' ? (
 <Link
 href={`/admin/pendaftaran/${m.id}/jadikan-ketua`}
 method="post"
 as="button"
 className="h-14 w-14 bg-white border border-emerald-100 shadow-sm text-emerald-200 hover:text-emerald-600 hover:border-emerald-500 hover:rotate-12 rounded-2xl flex items-center justify-center transition-all"
 title="Tetapkan Koordinator"
 >
 <UserCheck size={24} strokeWidth={2.5} />
 </Link>
 ) : null}
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td
 colSpan={5}
 className="px-6 py-40 text-center text-sm font-bold text-emerald-700/10 tracking-[0.6em]"
 >
 Ledger Personel Kosong
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </motion.section>

 {/* --- WORK MANIFEST INVENTORY --- */}
 <motion.section
 variants={itemVariants}
 className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
 >
 <div className="px-6 py-6 border-b border-emerald-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/50">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-white border border-emerald-100 placeholder:shadow-sm rounded-xl flex items-center justify-center">
 <ClipboardList size={32} className="text-emerald-500" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-700/30 tracking-wider text-xs font-semibold">
 Inventaris Rencana Kerja
 </h3>
 <p className="text-2xl font-bold text-black font-bold text-center leading-none">
 Indeks Program Kerja
 </p>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <span className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none">
 Arus Program Aktif
 </span>
 <div className="h-16 w-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-xl font-bold text-black tabular-nums">
 {workPrograms.length}
 </div>
 </div>
 </div>
 <div className="p-12 space-y-6">
 {workPrograms.length > 0 ? (
 workPrograms.map((p) => (
 <div
 key={p.id}
 className="group/pro relative flex items-center justify-between p-10 bg-white border border-emerald-50/50 rounded-[2.5rem] hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden"
 >
 <div className="flex items-center gap-6 relative z-10">
 <div className="w-16 h-16 rounded-2xl bg-emerald-50/50 border border-emerald-100/30 flex items-center justify-center text-emerald-200 group-hover/pro:bg-emerald-600 group-hover/pro:text-white group-hover/pro:rotate-12 transition-all duration-500">
 <Zap size={28} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col gap-3">
 <span className="text-xl font-bold text-black font-bold text-center group-hover/pro:text-emerald-600 transition-colors leading-none truncate max-w-[400px]">
 {p.title || 'Rencana Tanpa Judul'}
 </span>
 <div className="flex items-center gap-4">
 <span className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none">
 ID Aturan: #{p.id.toString().padStart(4, '0')}
 </span>
 </div>
 </div>
 </div>
 <div className="scale-125 group-hover/pro:scale-150 transition-all duration-500 mr-4">
 <StatusBadge status={p.status || 'draft'} />
 </div>
 </div>
 ))
 ) : (
 <div className="py-40 text-center border-4 border-dashed border-emerald-50/30 rounded-xl bg-emerald-50/5 flex flex-col items-center gap-6 group/none hover:border-emerald-200 transition-all duration-700">
 <Info size={100} className="text-emerald-50" strokeWidth={1} />
 <div className="space-y-4">
 <p className="text-xs font-bold text-emerald-700/20 tracking-[0.6em] leading-none">
 Rencana Kerja Tidak Terdeteksi
 </p>
 <p className="text-sm font-bold text-emerald-700/40 font-semibold text-xs leading-none">
 Unit ini belum mengunggah rencana kerja operasional.
 </p>
 </div>
 </div>
 )}
 </div>
 </motion.section>
 </div>

 {/* --- RIGHT COMMAND SIDEBAR --- */}
 <div className="xl:col-span-4 space-y-16">
 {/* --- LEADERSHIP STACK --- */}
 <motion.section
 variants={itemVariants}
 className="bg-emerald-600 rounded-xl p-12 text-white space-y-12 relative overflow-hidden group/l shadow-[0_45px_100px_rgba(6,78,59,0.3)]"
 >
 <div className="absolute top-[-40px] right-[-40px] opacity-5 group-hover:scale-150 transition-transform duration-1000 rotate-12">
 <Briefcase size={250} strokeWidth={1} />
 </div>
 <div className="flex items-center gap-8 relative z-10">
 <div className="h-14 w-14 bg-emerald-900 border border-emerald-800 rounded-xl flex items-center justify-center text-white">
 <ShieldCheck size={28} strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold leading-none">
 Struktur Pembimbing
 </h3>
 <p className="text-2xl font-bold text-white font-bold text-center pt-1 leading-none">
 Dosen Pembimbing
 </p>
 </div>
 </div>

 <div className="space-y-8 relative z-10">
 {lecturerRows.length > 0 ? (
 lecturerRows.map((l) => (
 <div
 key={l.id}
 className="p-10 bg-white/5 border border-white/10 rounded-xl group/card hover:bg-white hover:text-black transition-all duration-500 flex flex-col gap-6 shadow-sm"
 >
 <div className="space-y-3">
 <p className="text-xl font-bold font-bold text-center leading-[1.1] truncate">
 {l.nama || '-'}
 </p>
 <div className="h-px w-20 bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
 <p className="text-sm font-bold text-white/30 font-mono group-hover:text-emerald-600 transition-colors leading-none pt-2 tracking-normal ">
 ID NIP: {l.nip || '-'}
 </p>
 </div>
 <div className="flex items-center justify-between pt-2">
 <div className="px-6 py-2 rounded-xl bg-emerald-900 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-sm font-bold tracking-wider text-xs font-semibold border border-emerald-800 transition-all">
 Role: {l.pivot?.role || 'ANGGOTA'}
 </div>
 <ShieldCheck
 size={28}
 className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"
 strokeWidth={2.5}
 />
 </div>
 </div>
 ))
 ) : (
 <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
 <p className="text-xs font-bold text-white/20 font-semibold text-xs">
 BELUM ADA PEMBIMBING TERDETEKSI.
 </p>
 </div>
 )}
 </div>
 </motion.section>

 {/* --- GEO-INTELLIGENCE HUB --- */}
 <motion.section
 variants={itemVariants}
 className="bg-white border border-gray-200 rounded-xl p-12 space-y-12 shadow-sm group/geo relative overflow-hidden"
 >
 <div className="flex items-center gap-8">
 <div className="h-14 w-14 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
 <MapPin size={28} strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold leading-none">
 Pusat Navigasi Geografis
 </h3>
 <p className="text-2xl font-bold text-black font-bold text-center pt-1 leading-none">
 Koordinat Posko
 </p>
 </div>
 </div>

 <div className="space-y-10">
 <div className="space-y-4">
 <p className="text-sm font-bold text-emerald-700/30 tracking-wider text-xs font-semibold leading-none ml-2">
 Zona Penempatan
 </p>
 <div className="p-10 bg-gray-50/50 border border-emerald-50/50 rounded-xl group/loc hover:border-emerald-500 transition-all duration-500 shadow-sm">
 <p className="text-2xl font-bold text-black font-bold text-center group-hover:text-emerald-600 transition-colors leading-tight mb-4">
 {group.lokasi?.full_name || group.lokasi?.village_name || 'BELUM TERPETAKAN'}
 </p>
 {group.lokasi?.address && (
 <div className="flex items-start gap-4 text-emerald-700/40">
 <Building2 size={18} className="shrink-0 mt-1" strokeWidth={2.5} />
 <p className="text-sm font-bold leading-relaxed tracking-tight">
 {group.lokasi.address}
 </p>
 </div>
 )}
 </div>
 </div>

 {group.posko ? (
 <div className="space-y-8">
 {group.posko.photo_url && (
 <div className="relative group/photo rounded-[3.5rem] overflow-hidden shadow-2xl border border-emerald-50">
 <img
 src={group.posko.photo_url}
 alt="Foto posko"
 className="h-80 w-full object-cover group-hover/photo:scale-125 transition-transform duration-[2000ms]"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent flex flex-col justify-end p-10">
 <div className="flex items-center gap-4">
 <Camera size={20} className="text-white" strokeWidth={2.5} />
 <span className="text-sm font-bold text-white tracking-wider text-xs font-semibold leading-none">
 Visualisasi Infrastruktur Posko
 </span>
 </div>
 </div>
 </div>
 )}
 <div className="p-10 bg-emerald-600 rounded-xl text-white space-y-8 shadow-[0_30px_60px_rgba(6,78,59,0.3)]">
 <div className="grid grid-cols-2 gap-6 opacity-30">
 <div className="space-y-3">
 <p className="text-sm font-bold tracking-wider text-xs font-semibold text-emerald-500 leading-none">
 Koordinat Lintang
 </p>
 <p className="text-sm font-bold font-mono leading-none tabular-nums">
 {group.posko.latitude || '-'}
 </p>
 </div>
 <div className="space-y-3">
 <p className="text-sm font-bold tracking-wider text-xs font-semibold text-emerald-500 leading-none">
 Koordinat Bujur
 </p>
 <p className="text-sm font-bold font-mono leading-none tabular-nums">
 {group.posko.longitude || '-'}
 </p>
 </div>
 </div>
 <div className="h-px w-full bg-white/5" />
 {group.posko.gmaps_link ? (
 <a
 href={group.posko.gmaps_link}
 target="_blank"
 rel="noreferrer"
 className="w-full h-10 bg-emerald-500 hover:bg-white hover:text-black text-white rounded-3xl flex items-center justify-center gap-6 text-sm font-bold tracking-wider text-xs font-semibold transition-all shadow-xl shadow-emerald-500/20 active:scale-95 no-underline"
 >
 <Globe size={24} strokeWidth={3} />
 Luncurkan Navigasi Eksternal
 </a>
 ) : (
 <div className="text-sm font-bold text-emerald-700/20 tracking-wider text-xs font-semibold flex items-center justify-center gap-4 py-4">
 <Lock size={16} strokeWidth={2.5} /> Sinyal Eksternal Terputus
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="py-24 text-center bg-emerald-50/5 border-4 border-dashed border-emerald-50/20 rounded-[3.5rem] flex flex-col items-center gap-8 group/none hover:border-emerald-200 transition-all duration-700">
 <Search
 size={60}
 strokeWidth={1}
 className="text-emerald-50 group-hover/none:text-emerald-100 transition-colors"
 />
 <p className="text-sm font-bold text-emerald-700/10 tracking-[0.6em] group-hover/none:text-emerald-500 transition-colors">
 Sinyal Infrastruktur Nihil
 </p>
 </div>
 )}
 </div>
 </motion.section>
 </div>
 </div>

 {/* --- GOVERNANCE FOOTER --- */}
 <motion.div
 variants={itemVariants}
 className="bg-emerald-600 rounded-xl p-16 flex flex-col lg:flex-row items-center justify-between gap-16 text-white relative overflow-hidden group/footer shadow-2xl border border-emerald-900"
 >
 <div className="absolute top-[-50px] right-[-50px] opacity-10 group-hover/footer:rotate-45 transition-transform duration-[2000ms] pointer-events-none">
 <Cpu size={400} strokeWidth={0.5} />
 </div>
 <div className="flex items-center gap-6 relative z-10">
 <div className="h-28 w-28 bg-white/5 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10 group-hover/footer:scale-110 transition-transform duration-700">
 <ShieldCheck size={56} className="text-emerald-500" strokeWidth={3} />
 </div>
 <div className="space-y-4">
 <h4 className="text-2xl font-bold font-bold text-center leading-none">
 Manifest Audit Terotorisasi
 </h4>
 <p className="text-sm font-bold text-emerald-100/30 font-semibold text-xs leading-relaxed max-w-2xl">
 Seluruh data pada unit operasional ini adalah representasi real-time dari sistem
 manajemen KKN UIN SAIZU. Perubahan pada struktur kepemimpinan, manifest proker, atau
 koordinat posko akan dicatat secara audit trail demi integritas program pengabdian
 masyarakat.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-6 relative z-10">
 <div className="text-right hidden lg:block">
 <p className="text-sm font-bold tracking-wider text-xs font-semibold leading-none mb-3 opacity-30">
 Waktu Aktif Sistem
 </p>
 <p className="text-3xl font-bold tracking-tight opacity-100 text-white">TERENKRIPSI & AMAN</p>
 </div>
 <div className="h-12 w-px bg-white/10 hidden lg:block" />
 <div className="h-12 w-24 rounded-xl bg-emerald-900 flex items-center justify-center shadow-2xl group-hover/footer:rotate-[360deg] transition-all duration-[2000ms] border border-emerald-800">
 <Target size={40} className="text-emerald-500" strokeWidth={2.5} />
 </div>
 </div>
 </motion.div>
 </motion.div>
 </AppLayout>
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
 value: string | number;
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
 <p className="text-3xl font-bold text-black tracking-tight leading-none truncate" title={value.toString()}>
 {value.toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 );
}
