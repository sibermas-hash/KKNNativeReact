import { Head, Link, useForm } from '@inertiajs/react';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { useEffect, useMemo, type FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
import { 
    FolderKanban, 
    ArrowRight, 
    ShieldCheck, 
    FileCheck, 
    MapPin, 
    UserCheck, 
    AlertCircle, 
    Info, 
    ChevronRight, 
    FileText, 
    Download,
    Cpu,
    Zap,
    Activity,
    Lock,
    Binary,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';

interface Group {
    id: number;
    nama_kelompok: string;
    capacity: number;
    peserta_count: number;
    remaining_seats: number;
    lokasi?: {
        village_name?: string;
        district_name?: string;
        regency_name?: string;
        full_name?: string;
    } | null;
}

interface PeriodRegistration {
    id: number;
    status: string;
    notes?: string | null;
    rejection_reason?: string | null;
    revision_count?: number;
    kelompok_id?: number | null;
    group?: {
        id: number;
        name: string;
        location?: {
            id: number;
            name: string;
        } | null;
    } | null;
}

interface PeriodGuide {
    program_label?: string;
    requirements?: string[];
    governance_notes?: string[];
}

interface PeriodOption {
    id: number;
    nama: string;
    jenis?: string | null;
    program_type?: string | null;
    program_subtype?: string | null;
    program_type_label?: string | null;
    program_subtype_label?: string | null;
    registration_mode?: string | null;
    registration_mode_label?: string | null;
    placement_mode?: string | null;
    placement_mode_label?: string | null;
    self_service_enabled?: boolean;
    guide?: PeriodGuide | null;
    registration_start: string;
    registration_end: string;
    kelompok: Group[];
    registration?: PeriodRegistration | null;
}

interface ProfileSummary {
    is_complete: boolean;
    profile_url: string;
    missing_fields: Array<{
        key: string;
        label: string;
    }>;
}

interface DomicileSummary extends ProfileSummary {
    is_verified: boolean;
    verified_at?: string | null;
    regency_name?: string | null;
}

interface RegisterProps extends PageProps {
    periods: PeriodOption[];
    managed_programs?: PeriodOption[];
    student_gender?: 'L' | 'P' | null;
    student_academic?: {
        sks_completed: number;
        is_bta_ppi_passed: boolean;
        bta_ppi_status?: string | null;
        has_health_certificate: boolean;
        has_parent_permission?: boolean;
        parent_permission_template?: string | null;
        min_sks: number;
    } | null;
    bpjs_profile?: ProfileSummary | null;
    domicile_profile?: DomicileSummary | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const RequirementNode = ({ label, ok, value, icon: Icon }: { label: string; ok: boolean; value: string; icon: any }) => (
    <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className={clsx(
            "p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group",
            ok ? "bg-white border-slate-100 shadow-sm" : "bg-rose-50/50 border-rose-100/50"
        )}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={clsx(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                ok ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white text-rose-500 border border-rose-100"
            )}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="space-y-0.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
                <span className={clsx("block text-sm font-black tracking-tight", ok ? "text-slate-900" : "text-rose-950")}>{value}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={clsx("h-1.5 flex-1 rounded-full", ok ? "bg-emerald-100" : "bg-rose-100")}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: ok ? '100%' : '20%' }}
                    className={clsx("h-full rounded-full", ok ? "bg-emerald-600" : "bg-rose-500")}
                />
            </div>
            <span className={clsx("text-[9px] font-black uppercase tracking-widest", ok ? "text-emerald-600" : "text-rose-600")}>
                {ok ? 'READY' : 'REQUIRED'}
            </span>
        </div>
        <div className={clsx(
            "absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 pointer-events-none",
            ok ? "text-emerald-900" : "text-rose-900"
        )}>
            <Icon size={100} />
        </div>
    </motion.div>
);

const WarningMessage = ({ title, description, actionHref, actionLabel, icon: Icon = AlertCircle }: { title: string; description: string; actionHref: string; actionLabel: string, icon?: any }) => (
    <motion.div 
        variants={itemVariants}
        className="rounded-[2.5rem] bg-rose-950 p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
            <Icon size={120} />
        </div>
        <div className="h-20 w-20 rounded-[2rem] bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-rose-900/50 relative z-10 border-4 border-rose-500/20">
            <Icon size={32} strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-2">{title}</h3>
            <p className="text-sm font-bold text-rose-200/60 leading-relaxed uppercase tracking-wide max-w-xl">{description}</p>
        </div>
        <Link 
            href={actionHref}
            className="px-10 py-5 bg-white text-rose-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-100 transition-all hover:-translate-y-1 active:scale-95 relative z-10"
        >
            {actionLabel}
        </Link>
    </motion.div>
);

export default function Register({
    periods,
    managed_programs = [],
    student_academic,
    bpjs_profile,
    domicile_profile,
}: RegisterProps) {
    const form = useForm({
        period_id: '',
        health_certificate: null as File | null,
        parent_permission: null as File | null,
        notes: '',
    });

    const selectedPeriod = useMemo(
        () => periods.find((period) => period.id === Number(form.data.period_id)),
        [form.data.period_id, periods],
    );

    useEffect(() => {
        if (form.data.period_id || periods.length === 0) {
            return;
        }

        const preferredPeriod = periods.find((period) => period.registration?.id) ?? periods[0];
        if (!preferredPeriod) {
            return;
        }

        form.setData((current) => ({
            ...current,
            period_id: String(preferredPeriod.id),
            notes: preferredPeriod.registration?.notes ?? current.notes,
        }));
    }, [form, form.data.period_id, periods]);

    const currentRegistration = selectedPeriod?.registration ?? null;
    const isRejectedRegistration = currentRegistration?.status === 'rejected';
    const qualifiedBySks = (student_academic?.sks_completed ?? 0) >= (student_academic?.min_sks ?? 100);
    const qualifiedByBta = !!student_academic?.is_bta_ppi_passed || ['LULUS', 'PASSED', 'SUCCESS'].includes((student_academic?.bta_ppi_status ?? '').toUpperCase());
    const hasHealthCertificate = !!student_academic?.has_health_certificate || !!form.data.health_certificate;
    const hasParentPermission = !!student_academic?.has_parent_permission || !!form.data.parent_permission;
    const hasCompleteBpjsProfile = bpjs_profile?.is_complete ?? true;
    const hasVerifiedDomicile = domicile_profile?.is_complete ?? true;
    const supportsSelfService = selectedPeriod?.self_service_enabled ?? true;
    const readyToRegister = qualifiedBySks && qualifiedByBta && hasHealthCertificate && hasParentPermission && hasCompleteBpjsProfile && hasVerifiedDomicile;
    const canSubmit = readyToRegister && !!form.data.period_id && supportsSelfService;

    const handlePeriodChange = (value: string) => {
        const period = periods.find((item) => item.id === Number(value));
        form.setData({
            ...form.data,
            period_id: value,
            notes: period?.registration?.notes ?? '',
        });
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('student.registration.store'), {
            forceFormData: true,
        });
    };

    return (
        <ErrorBoundary>
            <AppLayout title="Portal Pendaftaran KKN">
                <Head title="Enrollment | KKN UIN Saizu" />

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="mx-auto max-w-7xl space-y-16 pb-32"
                >
                    {/* --- HERO: OPERATIONAL FOCUS --- */}
                    <motion.section variants={itemVariants} className="relative rounded-[4rem] bg-slate-900 p-12 lg:p-20 text-white overflow-hidden shadow-2xl shadow-slate-200 group">
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-emerald-600 opacity-5 -skew-x-12 translate-x-1/4 pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                            <div className="space-y-8 max-w-3xl">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                                        <Zap size={30} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">System Enrollment</h4>
                                        <p className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Mulai <span className="text-emerald-500">Pendaftaran.</span></p>
                                    </div>
                                </div>
                                <p className="text-base font-bold text-slate-400 leading-relaxed uppercase tracking-[0.05em] opacity-80 max-w-xl">
                                    Pilih skema KKN dan lengkapi prasyarat operasional. Database akan memproses penempatan berdasarkan kualifikasi akademik dan domisili terverifikasi.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[320px]">
                                <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Enrollment Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className={clsx("h-2 w-2 rounded-full", readyToRegister ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-rose-500")} />
                                            <span className="text-[10px] font-black text-white uppercase">{readyToRegister ? 'ELIGIBLE' : 'INCOMPLETE'}</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed px-2">
                                        Sistem hanya menerima aplikasi dari mahasiswa yang telah memenuhi syarat SKS, BTA-PPI, dan kesehatan dokumen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* --- NODAL MATRIX: PREREQUISITES --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <RequirementNode label="AKADEMIK" ok={qualifiedBySks} value={`${student_academic?.sks_completed ?? 0} SKS`} icon={Binary} />
                        <RequirementNode label="RELIGIUS" ok={qualifiedByBta} value="BTA-PPI" icon={UserCheck} />
                        <RequirementNode label="FISIK" ok={hasHealthCertificate} value="SURAT SEHAT" icon={ShieldCheck} />
                        <RequirementNode label="IZIN" ok={hasParentPermission} value="SURAT IZIN" icon={FileCheck} />
                        <RequirementNode label="DOMISILI" ok={hasVerifiedDomicile} value="VERIFIKASI" icon={MapPin} />
                    </div>

                    {/* --- SYSTEM NOTIFICATIONS --- */}
                    <AnimatePresence>
                        {(bpjs_profile && !bpjs_profile.is_complete) || (domicile_profile && !domicile_profile.is_complete) ? (
                            <div className="space-y-6">
                                {bpjs_profile && !bpjs_profile.is_complete && (
                                    <WarningMessage 
                                        title="Dossier Incomplete" 
                                        description={`Data profil wajib dilengkapi: ${bpjs_profile.missing_fields.map(f => f.label).join(', ')}.`}
                                        actionHref={bpjs_profile.profile_url}
                                        actionLabel="Sync Profile"
                                        icon={Cpu}
                                    />
                                )}
                                {domicile_profile && !domicile_profile.is_complete && (
                                    <WarningMessage 
                                        title="Verification Failed" 
                                        description={`Lengkapi verifikasi domisili untuk plotting: ${domicile_profile.missing_fields.map(f => f.label).join(', ')}.`}
                                        actionHref={domicile_profile.profile_url}
                                        actionLabel="Verify Address"
                                        icon={MapPin}
                                    />
                                )}
                            </div>
                        ) : null}
                    </AnimatePresence>

                    {/* --- MANAGED PROGRAMS: SPECIAL DEPLOYMENTS --- */}
                    {managed_programs.length > 0 && (
                        <motion.section variants={itemVariants} className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="h-1 w-24 bg-emerald-600 rounded-full" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Managed Deployments</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {managed_programs.map((program) => (
                                    <ManagedProgramCard key={program.id} program={program} />
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* --- MAIN INTERFACE: OPERATIONAL ENROLLMENT --- */}
                    {periods.length === 0 ? (
                        <motion.div variants={itemVariants} className="p-20 text-center rounded-[4rem] bg-white border border-dashed border-slate-200 group">
                            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] mx-auto flex items-center justify-center border border-slate-100 mb-8 text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                                <FolderKanban size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Active Enrollment Cycle</h3>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-md mx-auto">Pantau terus portal informasi LPPM untuk jadwal pendaftaran KKN Reguler Cycle 2026/2027.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-20">
                            {/* PERIOD SELECTION MATRIX */}
                            <motion.div variants={itemVariants} className="space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="h-1 w-24 bg-emerald-600 rounded-full" />
                                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Scheme Selection</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{periods.length} Programs Available</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {periods.map((period) => (
                                        <button
                                            key={period.id}
                                            type="button"
                                            onClick={() => handlePeriodChange(String(period.id))}
                                            className={clsx(
                                                "text-left p-10 rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden",
                                                form.data.period_id === String(period.id)
                                                    ? "border-emerald-500 bg-white ring-8 ring-emerald-50 shadow-2xl"
                                                    : "border-slate-50 bg-white hover:border-emerald-100 hover:shadow-xl"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-8">
                                                <div className={clsx(
                                                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all",
                                                    form.data.period_id === String(period.id) ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                )}>
                                                    <FolderKanban size={28} strokeWidth={2.5} />
                                                </div>
                                                {period.registration?.status && (
                                                    <span className={clsx(
                                                        "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest",
                                                        period.registration.status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                                    )}>
                                                        {period.registration.status === 'approved' ? 'CONFIRMED' : 'PENDING'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2 mb-8">
                                                <h3 className={clsx("text-2xl font-black tracking-tighter uppercase", form.data.period_id === String(period.id) ? "text-emerald-900" : "text-slate-900")}>
                                                    {period.nama}
                                                </h3>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                                                    {period.program_type_label || period.jenis || 'KKN Scheme'} &bull; Deadline: {period.registration_end}
                                                </p>
                                            </div>
                                            <div className={clsx(
                                                "flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                                form.data.period_id === String(period.id) ? "text-emerald-600" : "text-slate-300 group-hover:text-emerald-600"
                                            )}>
                                                Select Program <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* DOCUMENTATION & VALIDATION MATRIX */}
                            <AnimatePresence>
                                {selectedPeriod && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 40 }}
                                        className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                                    >
                                        <div className="lg:col-span-2 space-y-12">
                                            {/* DATA INGESTION: FILE UPLOADS */}
                                            <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-12 relative overflow-hidden">
                                                <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                                                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                                        <FileText size={24} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Data Ingestion</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 opacity-70">Verify administrative dossiers</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    {/* HEALTH DATA */}
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Clearance</label>
                                                            {student_academic?.has_health_certificate && <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1"><ShieldCheck size={12} /> Exists</span>}
                                                        </div>
                                                        <FileDrop 
                                                            file={form.data.health_certificate} 
                                                            onChange={(f) => form.setData('health_certificate', f)} 
                                                            label="Surat Keterangan Sehat" 
                                                            error={form.errors.health_certificate}
                                                        />
                                                    </div>

                                                    {/* GUARDIAN DATA */}
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Permission</label>
                                                            {student_academic?.has_parent_permission && <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1"><ShieldCheck size={12} /> Exists</span>}
                                                        </div>
                                                        <FileDrop 
                                                            file={form.data.parent_permission} 
                                                            onChange={(f) => form.setData('parent_permission', f)} 
                                                            label="Surat Izin Orang Tua" 
                                                            error={form.errors.parent_permission}
                                                            templateUrl={student_academic?.parent_permission_template}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-6">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block opacity-70">Operational Notes (Optional)</label>
                                                    <textarea
                                                        value={form.data.notes}
                                                        onChange={(e) => form.setData('notes', e.target.value)}
                                                        rows={4}
                                                        className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none text-[13px] font-bold text-slate-700 placeholder:text-slate-300 uppercase tracking-tight"
                                                        placeholder="Tuliskan catatan khusus pendaftaran jika diperlukan..."
                                                    />
                                                </div>
                                            </div>

                                            {/* PROTOCOLS & GOVERNANCE */}
                                            <div className="p-12 rounded-[4rem] bg-emerald-950 text-white shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-12 text-emerald-800/10 group-hover:rotate-12 transition-transform duration-[2s]">
                                                    <Lock size={180} />
                                                </div>
                                                <div className="relative z-10 grid gap-16 md:grid-cols-2">
                                                    <div>
                                                        <h4 className="text-base font-black tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
                                                            <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Scheme Intelligence
                                                        </h4>
                                                        <ul className="space-y-6">
                                                            {(selectedPeriod.guide?.requirements || []).map((item, i) => (
                                                                <li key={i} className="flex gap-4 group/li">
                                                                    <div className="h-6 w-6 rounded-lg bg-emerald-900 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-emerald-600 transition-colors">
                                                                        <CheckCircle className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                                                                    </div>
                                                                    <span className="text-[13px] font-bold text-emerald-100/70 leading-relaxed uppercase tracking-tight">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
                                                            <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Governance Protocol
                                                        </h4>
                                                        <ul className="space-y-6">
                                                            {(selectedPeriod.guide?.governance_notes || []).map((item, i) => (
                                                                <li key={i} className="flex gap-4 group/li">
                                                                    <div className="h-6 w-6 rounded-lg bg-emerald-900 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-emerald-600 transition-colors">
                                                                        <Activity className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                                                                    </div>
                                                                    <span className="text-[13px] font-bold text-emerald-100/70 leading-relaxed uppercase tracking-tight">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VALIDATION BRIEFING & SUBMISSION */}
                                        <div className="space-y-8">
                                            <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-md sticky top-12 space-y-10">
                                                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                                    <div className="h-14 w-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                                        <ShieldCheck size={28} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enrollment Briefing</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 opacity-70">Review & Deploy</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    <BriefingItem label="Mode" value={selectedPeriod.registration_mode_label || 'Pribadi'} icon={UserCheck} />
                                                    <BriefingItem label="Placement" value={selectedPeriod.placement_mode_label || 'Auto-Plot'} icon={MapPin} />
                                                    <BriefingItem label="Origin Territory" value={domicile_profile?.regency_name || 'UNVERIFIED'} icon={Activity} />
                                                    
                                                    <div className="pt-6 border-t border-slate-50 space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Integrity Status</span>
                                                            <span className={clsx("text-[10px] font-black uppercase tracking-widest", readyToRegister ? "text-emerald-600" : "text-rose-600")}>
                                                                {readyToRegister ? 'VALID' : 'BLOCKED'}
                                                            </span>
                                                        </div>
                                                        {!readyToRegister && (
                                                            <motion.div 
                                                                animate={{ x: [0, -5, 5, 0] }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4"
                                                            >
                                                                <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                                                <p className="text-[11px] font-bold text-rose-900 leading-normal uppercase">Lengkapi prasyarat akademik dan dokumen untuk melanjutkan pendaftaran.</p>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={!canSubmit || form.processing}
                                                    className={clsx(
                                                        "w-full py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl transition-all relative overflow-hidden group flex items-center justify-center gap-4",
                                                        canSubmit && !form.processing
                                                            ? "bg-slate-900 text-white shadow-slate-300 hover:bg-emerald-600 hover:-translate-y-2 active:scale-95"
                                                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                                    )}
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {form.processing ? (
                                                            <motion.div key="loading" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={20} /></motion.div>
                                                        ) : (
                                                            <motion.div key="ready" className="flex items-center gap-4">
                                                                {isRejectedRegistration ? 'Resubmit Enrollment' : 'Deploy Application'}
                                                                <ArrowRight size={18} className="group-hover:translate-x-3 transition-transform" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </button>

                                                {!supportsSelfService && (
                                                    <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] leading-relaxed">
                                                            LPPM MANAGED SCHEME: SELEKSI INTERNAL AKTIF
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    )}
                </motion.div>
            </AppLayout>
        </ErrorBoundary>
    );
}

function ManagedProgramCard({ program }: { program: PeriodOption }) {
    return (
        <article className="p-10 rounded-[3.5rem] bg-white border border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-slate-900 text-white flex items-center justify-center rounded-bl-[2rem] shadow-xl group-hover:bg-emerald-600 transition-colors">
                <Lock size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="inline-flex rounded-xl bg-slate-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {program.program_subtype_label || program.program_type_label || program.jenis || 'Special Program'}
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    CLOSE: {program.registration_end}
                </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-8 group-hover:text-emerald-700 transition-colors">{program.nama}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration</p>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{program.registration_mode_label || 'Managed'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Placement</p>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{program.placement_mode_label || 'Managed'}</p>
                </div>
            </div>

            {program.guide && (
                <div className="p-6 bg-emerald-50/20 rounded-[2rem] border border-emerald-100 shadow-inner">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Activity size={14} /> Critical Requirements
                    </p>
                    <ul className="space-y-3">
                        {(program.guide.requirements || []).slice(0, 3).map((item) => (
                            <li key={item} className="text-[11px] font-bold text-emerald-800/70 leading-relaxed uppercase tracking-tight flex gap-3">
                                <span className="text-emerald-400 mt-1">•</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}

function FileDrop({ file, onChange, label, error, templateUrl }: { file: File | null, onChange: (f: File | null) => void, label: string, error?: string, templateUrl?: string | null }) {
    return (
        <div className="relative group/file">
            <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className={clsx(
                "p-8 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center text-center gap-4",
                file ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50 group-hover/file:border-emerald-200 group-hover/file:bg-emerald-50/20",
                error && "border-rose-500 bg-rose-50/30"
            )}>
                <div className={clsx(
                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all",
                    file ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" : "bg-white text-slate-300 group-hover/file:text-emerald-500 group-hover/file:scale-110",
                    error && "bg-rose-500 text-white"
                )}>
                    {file ? <FileCheck size={32} strokeWidth={2.5} /> : <Download size={32} strokeWidth={2.5} />}
                </div>
                <div className="space-y-1">
                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">
                        {file ? file.name : (error || label)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">PDF/JPG MAX 2MB</p>
                </div>
                {templateUrl && (
                    <a 
                        href={templateUrl} 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 text-[9px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.3em] flex items-center gap-2 relative z-20"
                    >
                        GET TEMPLATE <Download size={10} strokeWidth={3} />
                    </a>
                )}
            </div>
            {error && <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">{error}</p>}
        </div>
    );
}

function BriefingItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
    return (
        <div className="flex items-center gap-6 group">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{label}</p>
                <p className="text-sm font-black text-slate-900 tracking-tight uppercase group-hover:text-emerald-900 transition-colors">{value}</p>
            </div>
        </div>
    );
}
