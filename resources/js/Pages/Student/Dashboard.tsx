import { Link, Head } from '@inertiajs/react';
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
    Zap,
    Info,
    Rocket,
    Lock,
    Beaker,
    ClipboardList,
    CheckCircle,
    Activity,
    ChevronRight,
    Presentation,
    BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';

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
    const isApproved = registration?.status === 'approved';
    const isPending = registration?.status === 'pending';
    const isGroupPinned = isApproved && Boolean(registration?.group);
    const studentFirstName = student?.name?.split(' ')?.[0] ?? 'Mahasiswa';

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
                            <div className="h-16 w-16 rounded-lg bg-white border border-slate-100 text-primary flex items-center justify-center text-2xl font-black italic leading-none">
                                {student?.name?.charAt(0) ?? 'M'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center border border-slate-100">
                               <ShieldCheck className={clsx("h-3.5 w-3.5", isApproved ? "text-emerald-500" : "text-slate-300")} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-emerald-600 uppercase  italic">
                                    STUDENT_TERMINAL_V3.2
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900  uppercase italic leading-none">
                                Halo, <span className="text-primary">{studentFirstName}!</span>
                            </h1>
                            <p className="text-slate-400 font-bold text-xs italic  flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-100" />
                                Anda sedang dalam tahap <span className="text-slate-600 underline decoration-emerald-200 decoration-2 underline-offset-4">{isPending ? 'VERIFIKASI_ADMIN' : currentPhase.label}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-6 min-w-[220px]">
                            <div className="text-right">
                                <span className="block text-[9px] font-black text-slate-400 uppercase  italic leading-none mb-1">Status Otoritas</span>
                                <span className={clsx(
                                    "text-sm font-black uppercase italic  leading-none block",
                                    isApproved ? "text-emerald-600" : "text-amber-500"
                                )}>
                                    {isApproved ? 'AKTIF_VERIFIED' : isPending ? 'PENDING' : 'DATA_KOSONG'}
                                </span>
                            </div>
                            <div className={clsx(
                                "h-10 w-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center",
                                isApproved ? "text-emerald-500" : "text-amber-500"
                            )}>
                                {isApproved ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                            </div>
                        </div>
                        
                        <Link 
                            href="/student/register" 
                            className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase  flex items-center justify-center hover:bg-primary transition-all active:scale-95 italic"
                        >
                            Detail Pendaftaran
                        </Link>
                    </div>
                </div>

                {/* Road to Success - Progress Viz */}
                <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 relative group overflow-hidden">
                    <div className="flex items-center gap-4 mb-16 relative z-10">
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:text-primary transition-colors">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase  italic text-slate-900 leading-none">Alur Pelaksanaan KKN</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase  italic opacity-60">Progress Perjalanan Anda (SOP UIN SAIZU)</p>
                        </div>
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-6">
                        {/* Connecting Line */}
                        <div className="absolute top-10 left-10 right-10 h-0.5 bg-slate-50 hidden md:block" />
                        
                        {phases.map((phase, idx) => {
                            const Icon = phase.icon;
                            return (
                                <div key={idx} className="relative z-10 flex-1 flex flex-col items-center text-center group/phase mt-2">
                                    <div className={clsx(
                                        "h-20 w-20rounded-lg flex items-center justify-center transition-all border-4
                                        phase.isCompleted ? "bg-emerald-500 border-white text-white" :
                                        phase.isActive ? "bg-primary border-white text-white scale-110" :
                                        "bg-slate-50 border-white text-slate-300"
                                    )}>
                                        {phase.isCompleted ? <CheckCircle className="w-10 h-10" /> : <Icon className="w-10 h-10" />}
                                    </div>
                                    <div className="mt-8 space-y-2">
                                        <p className={clsx(
                                            "text-[11px] font-black uppercase  italic",
                                            phase.isActive ? "text-primary" : phase.isCompleted ? "text-emerald-600" : "text-slate-400"
                                        )}>
                                            {phase.label}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase  opacity-60 leading-none">{phase.desc}</p>
                                    </div>
                                    {!phase.isCompleted && !phase.isActive && (
                                        <div className="absolute top-0 right-1 -mt-2 -mr-2 bg-white p-2 rounded-xl border border-slate-100
                                            <Lock className="w-3.5 h-3.5 text-slate-200" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contextual Stats & Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        {isGroupPinned ? (
                            <section className="bg-white rounded-[3.5rem] p-12 border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-125 transition-transform">
                                    <MapPin className="h-64 w-64" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 text-primary mb-10 border-b border-slate-50 pb-8">
                                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                            <MapPin className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-black uppercase  text-slate-400 italic">Informasi Lokasi & Posko</h3>
                                            <p className="text-[10px] font-bold text-primary uppercase  mt-1 italic">Data Penempatan Terakreditasi</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-12">
                                        <p className="text-[10px] font-black text-slate-400 uppercase  mb-4 italic">Desa / Kelurahan</p>
                                        <h2 className="text-5xl font-black  text-slate-900 italic uppercase">
                                            {registration.group.location?.name ?? 'Lokasi Belum Ditetapkan'}
                                        </h2>
                                        <div className="mt-8 flex items-center gap-4">
                                            <span className="text-slate-900 text-xl font-black uppercase  bg-slate-50 border border-slate-100 px-8 py-3.5 rounded-[1.5rem] tabular-nums italic
                                                {registration.group.name}
                                            </span>
                                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase  italic">Unit Aktif</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-12 border-t border-slate-50">
                                        <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 group/item hover:bg-white hover:border-primary/20 transition-all cursor-default
                                            <div className="h-16 w-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all
                                                <User className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase  mb-1.5 italic leading-none">Dosen Pembimbing</p>
                                                <p className="font-black text-base text-slate-900  uppercase italic">{registration.group.lecturer?.name ?? 'Belum Ditetapkan'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 group/item hover:bg-white hover:border-primary/20 transition-all cursor-default
                                            <div className="h-16 w-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all
                                                <Calendar className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase  mb-1.5 italic leading-none">Periode KKN</p>
                                                <p className="font-black text-base text-slate-900  uppercase italic">{registration.period?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            <section className="bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 p-24 text-center group transition-all hover:border-primary/40 hover:bg-primary/5
                                <div className="relative inline-block mb-10">
                                    <MapPin className={clsx("h-20 w-20 transition-all", isPending ? "text-amber-200" : "text-slate-100")} />
                                    <div className={clsx("absolute top-0 right-0 h-5 w-5 rounded-full animate-ping", isPending ? "bg-amber-400" : "bg-primary")} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900  uppercase italic mb-4">
                                    {isPending ? 'Verifikasi Berlangsung' : 'Penempatan Menunggu'}
                                </h3>
                                <p className="text-slate-400 font-bold uppercase  text-[11px] mb-14 leading-relaxed max-w-sm mx-auto opacity-70 italic">
                                    {isPending 
                                        ? 'Data pendaftaran Anda sedang dalam tahap peninjauan oleh Admin LPPM.' 
                                        : 'Sistem belum menetapkan lokasi penempatan untuk profil Anda.'}
                                </p>
                                <Link
                                    href="/student/register"
                                    className="inline-flex items-center gap-5 px-14 py-6 bg-slate-900 text-whiterounded-lg text-[11px] font-black uppercase  hover:bg-primary transition-all active:scale-95 italic group/btn"
                                >
                                    {isPending ? 'Ubah Pilihan' : 'Daftar Kelompok'} <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            </section>
                        )}

                        {/* Visual Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <StatCard
                                title="Total Laporan"
                                value={dailyReportCount}
                                unit="Entri"
                                icon={FileText}
                                color="primary"
                            />
                            <StatCard
                                title="Status Laporan Akhir"
                                value={finalReport ? 'TERKIRIM' : 'BELUM'}
                                unit="Status"
                                icon={ShieldCheck}
                                color="emerald"
                            />
                            <StatCard
                                title="Verifikasi Akun"
                                value={isApproved ? 'TERVERIFIKASI' : isPending ? 'MENUNGGU' : 'BELUM AKTIF'}
                                unit="Status"
                                icon={GraduationCap}
                                color="slate"
                            />
                        </div>
                    </div>

                    {/* Navigation Sidebar */}
                    <div className="space-y-12">
                        <section className="bg-white rounded-[3rem] border border-slate-100 p-10 h-fit">
                            <div className="flex items-center gap-4 mb-12 border-b border-slate-50 pb-8">
                                <div className="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black uppercase  italic text-slate-900 leading-none">Menu Cepat</h3>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic opacity-60">Akses Aktivitas Utama</p>
                                </div>
                            </div>
                            
                            <div className="space-y-5">
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

                        <section className="bg-white rounded-[3rem] p-10 border border-slate-100 relative overflow-hidden group italic">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-primary group-hover:scale-125 transition-transform pointer-events-none">
                                <Info className="h-40 w-40" />
                            </div>
                            
                            <h3 className="text-[11px] font-black mb-12 flex items-center gap-4 uppercase  italic text-slate-400">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse />
                                Informasi Penting
                            </h3>
                            
                            <div className="space-y-8 relative z-10 italic">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-primary uppercase  italic flex items-center gap-2">
                                        <Lock className="h-3.5 w-3.5" />
                                        Batas Pengunggahan
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic opacity-80 uppercase  seluruh laporan harian telah diverifikasi sebelum periode pelaksanaan berakhir.</p>
                                </div>
                                <div className="space-y-3 pt-6 border-t border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase  italic flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        Proteksi Jamsostek
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic opacity-80 uppercase  mahasiswa peserta KKN telah didaftarkan dalam program BPJS Ketenagakerjaan selama masa bakti.</p>
                                </div>
                                <div className="space-y-3 pt-6 border-t border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase  italic flex items-center gap-2">
                                        <IdCard className="h-3.5 w-3.5" />
                                        Penerbitan Sertifikat
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic opacity-80 uppercase  akan diterbitkan otomatis setelah proses evaluasi nilai oleh DPL dan Admin selesai.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="text-center pt-12 opacity-20">
                    <p className="text-[10px] font-black text-slate-300 uppercase  italic">
                        Pusat Layanan Mahasiswa • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, unit, icon: Icon, color }: any) {
    const colorClasses: any = {
        primary: 'bg-primary/5 text-primary border-primary/10
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100
        slate: 'bg-slate-50 text-slate-400 border-slate-200
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 hover:shadow-2xl hover:-translate-y-1.5 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] text-slate-900 transition-transform group-hover:scale-150 group-hover:rotate-12">
                <Icon className="h-24 w-24" />
            </div>
            
            <div className={clsx(
                "h-20 w-20rounded-lg flex items-center justify-center mb-10 border transition-all group-hover:scale-110 relative z-10",
                colorClasses[color]
            )}>
                <Icon className="h-10 w-10" />
            </div>
            
            <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase  mb-3 group-hover:text-primary transition-colors italic leading-none">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900  italic">{value}</span>
                    {unit && <span className="text-[10px] font-black text-slate-400 uppercase  opacity-60 italic">{unit}</span>}
                </div>
            </div>
        </div>
    );
}

function QuickActionButton({ href, icon: Icon, label, desc, disabled }: any) {
    if (disabled) {
        return (
            <div className="flex items-center gap-6 p-7 rounded-[2.5rem] bg-slate-50 border border-slate-100 opacity-40 cursor-not-allowed">
                <div className="h-16 w-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-200
                    <Icon className="h-8 w-8" />
                </div>
                <div>
                    <p className="font-black text-sm text-slate-400 uppercase italic  leading-none">{label}</p>
                    <p className="text-[10px] text-slate-300 font-bold mt-2.5 uppercase  italic leading-none opacity-60">{desc}</p>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className="flex items-center gap-6 p-7 rounded-[2.5rem] bg-white border border-slate-100 transition-all hover:bg-slate-50 hover:border-primary/20 hover:shadow-xl group active:scale-95
        >
            <div className="h-16 w-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white group-hover:border-primary/20 transition-all
                <Icon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
                <p className="font-black text-sm text-slate-900 leading-none group-hover:text-primary transition-colors uppercase italic 
                <p className="text-[10px] text-slate-400 font-bold mt-2.5 uppercase  truncate italic opacity-80 leading-none">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
    );
}
