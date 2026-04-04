import { Link, Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Calendar,
 MapPin,
 User,
 FileText,
 UploadCloud,
 GraduationCap,
 ShieldCheck,
 ArrowRight,
 Sparkles,
 IdCard,
 
 Info,
 Rocket,
 Lock,
 Beaker,
 ClipboardList,
 CheckCircle,
 Activity,
 ChevronRight,
 Presentation,
 BadgeCheck,
 UserCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { PageProps } from '@/types';

interface Props {
 student: any;
 registration: any;
 dailyReportCount: number;
 workProgramCount: number;
 workshopRegistered: boolean;
 finalReport: any;
 grade: any;
}

export default function StudentDashboard({ student, registration, dailyReportCount, workProgramCount, workshopRegistered, finalReport, grade }: Props) {
 const { auth } = usePage<PageProps>().props;
 const isApproved = registration?.status === 'approved';
 const isPending = registration?.status === 'pending';
 const isGroupPinned = isApproved && Boolean(registration?.group);
 const studentFirstName = student?.name?.split(' ')?.[0] ?? auth.user?.name?.split(' ')?.[0] ?? 'Mahasiswa';

 // Alur Pelaksanaan KKN (SOP UIN SAIZU Compliance)
 const phases = [
 {
 id: 1,
 label: 'Pendaftaran',
 desc: 'Registrasi & Plotting',
 icon: Rocket,
 isCompleted: isApproved,
 isActive: !registration || isPending
 },
 {
 id: 2,
 label: 'Pembekalan',
 desc: 'Pembekalan & Metode',
 icon: Presentation,
 isCompleted: isApproved && workshopRegistered,
 isActive: isApproved && !workshopRegistered
 },
 {
 id: 3,
 label: 'Persiapan',
 desc: 'Program Kerja',
 icon: Beaker,
 isCompleted: workshopRegistered && workProgramCount > 0, 
 isActive: workshopRegistered && workProgramCount === 0
 },
 {
 id: 4,
 label: 'Pelaksanaan',
 desc: 'Laporan Harian',
 icon: ClipboardList,
 isCompleted: dailyReportCount >= (registration?.period?.min_logbook ?? 30), 
 isActive: workProgramCount > 0 && dailyReportCount < (registration?.period?.min_logbook ?? 30)
 },
 {
 id: 5,
 label: 'Pelaporan',
 desc: 'Laporan Akhir',
 icon: UploadCloud,
 isCompleted: !!finalReport,
 isActive: dailyReportCount >= (registration?.period?.min_logbook ?? 30) && !finalReport
 },
 {
 id: 6,
 label: 'Evaluasi',
 desc: 'Nilai & Sertifikat',
 icon: BadgeCheck,
 isCompleted: grade?.is_finalized,
 isActive: !!finalReport && !grade?.is_finalized
 }
 ];

 const activePhaseIndex = phases.findIndex(p => p.isActive);
 const currentPhase = activePhaseIndex !== -1 ? phases[activePhaseIndex] : (phases.every(p => p.isCompleted) ? phases[5] : phases[0]);

 return (
 <AppLayout title="Dasbor Mahasiswa">
 <Head title="Portal Mahasiswa" />
 
 <div className="space-y-12 pb-24">
 {/* Sleek Minimalist Operational Header */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-100 pb-10">
 <div className="flex items-center gap-6">
 <div className="relative shrink-0">
 <div className="h-16 w-16 rounded-lg bg-white border border-slate-100 text-primary flex items-center justify-center text-2xl font-semibold leading-none">
 {studentFirstName.charAt(0)}
 </div>
 <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center border border-slate-100">
 <ShieldCheck className={clsx("h-3.5 w-3.5", isApproved ? "text-emerald-500" : "text-slate-300")} />
 </div>
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <span className="text-[10px] font-semibold text-emerald-600">
 STUDENT_TERMINAL_V3.2
 </span>
 </div>
 <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-none">
 Halo, <span className="text-primary">{studentFirstName}!</span>
 </h1>
 <p className="text-slate-400 font-semibold text-xs flex items-center gap-2">
 <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-100" />
 Anda sedang dalam tahap <span className="text-slate-600 underline decoration-emerald-200 decoration-2 underline-offset-4">{isPending ? 'VERIFIKASI_ADMIN' : currentPhase.label.toUpperCase()}</span>.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-6 py-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-6 min-w-[220px]">
 <div className="text-right">
 <span className="block text-[9px] font-semibold text-slate-400 leading-none mb-1">Status Otoritas</span>
 <span className={clsx(
 "text-sm font-semibold leading-none block",
 isApproved ? "text-emerald-600" : "text-amber-500"
 )}>
 {isApproved ? 'AKTIF_VERIFIED' : isPending ? 'PENDING' : 'DATA_KOSONG'}
 </span>
 </div>
 <div className={clsx(
 "h-10 w-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center",
 isApproved ? "text-emerald-500" : "text-amber-500"
 )}>
 {isApproved ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
 </div>
 </div>
 
 <Link 
 href="/student/register" 
 className="h-12 px-6 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center hover:bg-primary transition-all active:"
 >
 Detail Pendaftaran
 </Link>
 </div>
 </div>

 {/* Road to Success - Progress Viz */}
 <div className="bg-white rounded-lg p-8 md:p-12 border border-slate-100 relative group overflow-hidden">
 <div className="flex items-center gap-4 mb-12 relative z-10">
 <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 group-hover:text-primary transition-colors">
 <Activity className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900 leading-none">Alur Pelaksanaan KKN</h3>
 <p className="text-[10px] font-semibold text-slate-400 mt-1 opacity-60">Progress Perjalanan Anda (SOP UIN SAIZU)</p>
 </div>
 </div>

 <div className="relative flex flex-col md:flex-row justify-between gap-10 md:gap-4">
 {/* Connecting Line */}
 <div className="absolute top-10 left-10 right-10 h-0.5 bg-slate-100 hidden md:block" />
 
 {phases.map((phase, idx) => {
 const Icon = phase.icon;
 return (
 <div key={idx} className="relative z-10 flex-1 flex flex-col items-center text-center group/phase">
 <div className={clsx(
 "h-20 w-20 rounded-lg flex items-center justify-center transition-all border-4",
 phase.isCompleted ? "bg-emerald-500 border-white text-white" :
 phase.isActive ? "bg-primary border-white text-white/20" :
 "bg-slate-50 border-white text-slate-300"
 )}>
 {phase.isCompleted ? <CheckCircle className="w-10 h-10" /> : <Icon className="w-10 h-10" />}
 </div>
 <div className="mt-6 space-y-1">
 <p className={clsx(
 "text-[11px] font-semibold",
 phase.isActive ? "text-primary" : phase.isCompleted ? "text-emerald-600" : "text-slate-400"
 )}>
 {phase.label}
 </p>
 <p className="text-[10px] font-semibold text-slate-400 opacity-60 leading-none">{phase.desc}</p>
 </div>
 {!phase.isCompleted && !phase.isActive && (
 <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white p-1.5 rounded-lg border border-slate-100">
 <Lock className="w-3 h-3 text-slate-300" />
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Contextual Stats & Info */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">
 {isGroupPinned ? (
 <section className="bg-white rounded-lg p-10 border border-slate-100 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-slate-900 pointer-events-none group-transition-transform">
 <MapPin className="h-64 w-64" />
 </div>
 
 <div className="relative z-10">
 <div className="flex items-center gap-5 text-primary mb-10 border-b border-slate-50 pb-8">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <MapPin className="h-6 w-6" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-slate-400">Informasi Lokasi & Posko</h3>
 <p className="text-[10px] font-semibold text-primary mt-0.5">Data Penempatan Terakreditasi</p>
 </div>
 </div>
 
 <div className="mb-10">
 <p className="text-[10px] font-semibold text-slate-400 mb-3">Desa / Kelurahan</p>
 <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
 {registration.group.location?.name ?? 'Lokasi Belum Ditetapkan'}
 </h2>
 <div className="mt-6 flex items-center gap-4">
 <span className="text-slate-900 text-lg font-semibold bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-lg tabular-nums">
 {registration.group.name}
 </span>
 <span className="h-2 w-2 rounded-full bg-primary" />
 <span className="text-[10px] font-semibold text-slate-400">Unit Aktif</span>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-50">
 <div className="flex items-center gap-5 p-6 rounded-lg bg-slate-50 border border-slate-100 group/item hover:bg-white hover:border-primary/20 transition-all cursor-default">
 <div className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all">
 <UserCircle className="h-7 w-7" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-400 mb-1 leading-none">Dosen Pembimbing</p>
 <p className="font-semibold text-sm text-slate-900 leading-tight">{registration.group.lecturer?.name ?? 'Belum Ditetapkan'}</p>
 </div>
 </div>
 <div className="flex items-center gap-5 p-6 rounded-lg bg-slate-50 border border-slate-100 group/item hover:bg-white hover:border-primary/20 transition-all cursor-default">
 <div className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all">
 <Calendar className="h-7 w-7" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-slate-400 mb-1 leading-none">Periode KKN</p>
 <p className="font-semibold text-sm text-slate-900 leading-tight">{registration.period?.name}</p>
 </div>
 </div>
 </div>
 </div>
 </section>
 ) : (
 <section className="bg-white rounded-lg border-2 border-dashed border-slate-200 p-16 md:p-24 text-center group transition-all hover:border-primary/40 hover:bg-primary/5">
 <div className="relative inline-block mb-8">
 <MapPin className={clsx("h-16 w-16 transition-all", isPending ? "text-amber-200" : "text-slate-100")} />
 <div className={clsx("absolute top-0 right-0 h-4 w-4 rounded-full", isPending ? "bg-amber-400" : "bg-primary")} />
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-3">
 {isPending ? 'Verifikasi Berlangsung' : 'Penempatan Menunggu'}
 </h3>
 <p className="text-slate-400 font-semibold text-xs mb-10 leading-relaxed max-w-sm mx-auto opacity-70">
 {isPending 
 ? 'Data pendaftaran Anda sedang dalam tahap peninjauan oleh Admin LPPM.' 
 : 'Sistem belum menetapkan lokasi penempatan untuk profil Anda.'}
 </p>
 <Link
 href="/student/register"
 className="inline-flex items-center gap-4 px-8 py-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-primary transition-all active:group/btn -200"
 >
 {isPending ? 'Ubah Pilihan' : 'Daftar Kelompok'} <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
 </Link>
 </section>
 )}

 {/* Visual Metrics */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <StatCard
 title="Total Laporan"
 value={dailyReportCount}
 unit="Entri"
 icon={FileText}
 color="primary"
 />
 <StatCard
 title="Laporan Akhir"
 value={finalReport ? 'TERKIRIM' : 'BELUM'}
 unit="Status"
 icon={ShieldCheck}
 color="emerald"
 />
 <StatCard
 title="Status Akun"
 value={isApproved ? 'VERIFIED' : isPending ? 'PENDING' : 'NULL'}
 unit="Status"
 icon={GraduationCap}
 color="slate"
 />
 </div>
 </div>

 {/* Navigation Sidebar */}
 <div className="space-y-8">
 <section className="bg-white rounded-lg border border-slate-100 p-8 h-fit">
 <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
 <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
 <Zap className="h-5 w-5" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-slate-900 leading-none">Menu Cepat</h3>
 <p className="text-[9px] font-semibold text-slate-400 mt-0.5 opacity-60">Akses Aktivitas Utama</p>
 </div>
 </div>
 
 <div className="space-y-4">
 <QuickActionButton
 href="/student/workshops"
 icon={Presentation}
 label="Pembekalan"
 desc="Ikuti pembekalan resmi"
 disabled={!isApproved}
 />
 <QuickActionButton
 href="/student/daily-reports"
 icon={ClipboardList}
 label="Laporan Harian"
 desc="Catat aktivitas lapangan"
 disabled={!isGroupPinned}
 />
 <QuickActionButton
 href="/student/posko"
 icon={MapPin}
 label="Perbarui Posko"
 desc="Perbarui koordinat lokasi"
 disabled={!isGroupPinned}
 />
 <QuickActionButton
 href="/student/final-report"
 icon={UploadCloud}
 label="Laporan Akhir"
 desc="Unggah produk KKN final"
 disabled={!isGroupPinned}
 />
 </div>
 </section>

 <section className="bg-white rounded-lg p-8 border border-slate-100 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-primary group-transition-transform pointer-events-none">
 <Info className="h-40 w-40" />
 </div>
 
 <h3 className="text-[11px] font-semibold mb-10 flex items-center gap-3 text-slate-400">
 <span className="flex h-2 w-2 rounded-full bg-primary" />
 Informasi Penting
 </h3>
 
 <div className="space-y-6 relative z-10">
 <div className="space-y-2">
 <p className="text-[10px] font-semibold text-primary flex items-center gap-2">
 <Lock className="h-3 w-3" />
 Batas Waktu
 </p>
 <p className="text-[11px] font-semibold text-slate-500 leading-relaxed opacity-80">Pastikan seluruh laporan harian telah diverifikasi sebelum periode pelaksanaan berakhir.</p>
 </div>
 <div className="space-y-2 pt-5 border-t border-slate-50">
 <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-2">
 <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
 Asuransi
 </p>
 <p className="text-[11px] font-semibold text-slate-500 leading-relaxed opacity-80">Mahasiswa terdaftar dalam program BPJS Ketenagakerjaan selama masa bakti KKN.</p>
 </div>
 <div className="space-y-2 pt-5 border-t border-slate-50">
 <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-2">
 <IdCard className="h-3.5 w-3.5" />
 E-Sertifikat
 </p>
 <p className="text-[11px] font-semibold text-slate-500 leading-relaxed opacity-80">Sertifikat terbit otomatis setelah evaluasi DPL & Admin selesai divalidasi.</p>
 </div>
 </div>
 </section>
 </div>
 </div>

 <div className="text-center pt-8 opacity-20">
 <p className="text-[10px] font-semibold text-slate-300">
 Pusat Layanan Mahasiswa • UIN SAIZU © 2026
 </p>
 </div>
 </div>
 </AppLayout>
 );
}

function StatCard({ title, value, unit, icon: Icon, color }: any) {
 const colorClasses: any = {
 primary: 'bg-primary/5 text-primary border-primary/10',
 emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
 slate: 'bg-slate-50 text-slate-400 border-slate-200'
 };

 return (
 <div className="bg-white border border-slate-100 rounded-lg p-8 hover:-transition-all group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-[0.02] text-slate-900 transition-transform group-">
 <Icon className="h-24 w-24" />
 </div>
 
 <div className={clsx(
 "h-14 w-14 rounded-lg flex items-center justify-center mb-8 border transition-all group-relative z-10",
 colorClasses[color]
 )}>
 <Icon className="h-7 w-7" />
 </div>
 
 <div className="relative z-10">
 <p className="text-[10px] font-semibold text-slate-400 mb-2 group-hover:text-primary transition-colors leading-none">{title}</p>
 <div className="flex items-baseline gap-1.5">
 <span className="text-3xl font-semibold text-slate-900">{value}</span>
 {unit && <span className="text-[10px] font-semibold text-slate-400 opacity-60">{unit}</span>}
 </div>
 </div>
 </div>
 );
}

function QuickActionButton({ href, icon: Icon, label, desc, disabled }: any) {
 if (disabled) {
 return (
 <div className="flex items-center gap-5 p-5 rounded-lg bg-slate-50 border border-slate-100 opacity-40 cursor-not-allowed">
 <div className="h-12 w-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-200">
 <Icon className="h-6 w-6" />
 </div>
 <div>
 <p className="font-semibold text-xs text-slate-400 leading-none">{label}</p>
 <p className="text-[10px] text-slate-300 font-semibold mt-2 leading-none opacity-60">{desc}</p>
 </div>
 </div>
 );
 }

 return (
 <Link
 href={href}
 className="flex items-center gap-5 p-5 rounded-lg bg-white border border-slate-100 transition-all hover:bg-slate-50 hover:border-primary/20 group active:"
 >
 <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white group-hover:border-primary/20 transition-all">
 <Icon className="h-6 w-6" />
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-xs text-slate-900 leading-none group-hover:text-primary transition-colors">{label}</p>
 <p className="text-[10px] text-slate-400 font-semibold mt-2 truncate opacity-80 leading-none">{desc}</p>
 </div>
 <ChevronRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
 </Link>
 );
}
