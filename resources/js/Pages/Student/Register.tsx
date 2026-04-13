import { Head, useForm } from '@inertiajs/react';
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
  MapPin,
  UserCheck,
  AlertCircle,
  Activity,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

// Types
import type { 
  PeriodOption, 
  ProfileSummary, 
  DomicileSummary 
} from './Register/types';

// Components
import { WarningMessage } from './Register/Components/WarningMessage';
import { ManagedProgramCard } from './Register/Components/ManagedProgramCard';
import { BriefingItem } from './Register/Components/BriefingItem';

// Registration Refactored Components
import { RegistrationHeader } from '@/Components/Registration/RegistrationHeader';
import { IdentityForm } from '@/Components/Registration/IdentityForm';
import { AcademicForm } from '@/Components/Registration/AcademicForm';
import { DocumentUpload } from '@/Components/Registration/DocumentUpload';
import { OperationalNotes } from '@/Components/Registration/OperationalNotes';

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
    semester?: number;
  } | null;
  bpjs_profile?: ProfileSummary | null;
  domicile_profile?: DomicileSummary | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

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
  const qualifiedBySks =
    (student_academic?.sks_completed ?? 0) >= (student_academic?.min_sks ?? 100);
  const qualifiedByBta =
    !!student_academic?.is_bta_ppi_passed ||
    ['LULUS', 'PASSED', 'SUCCESS'].includes((student_academic?.bta_ppi_status ?? '').toUpperCase());
  const hasHealthCertificate =
    !!student_academic?.has_health_certificate || !!form.data.health_certificate;
  const hasParentPermission =
    !!student_academic?.has_parent_permission || !!form.data.parent_permission;
  const hasCompleteBpjsProfile = bpjs_profile?.is_complete ?? true;
  const hasVerifiedDomicile = domicile_profile?.is_complete ?? true;
  const supportsSelfService = selectedPeriod?.self_service_enabled ?? true;
  const readyToRegister =
    qualifiedBySks &&
    qualifiedByBta &&
    hasHealthCertificate &&
    hasParentPermission &&
    hasCompleteBpjsProfile &&
    hasVerifiedDomicile;
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
        <Head title="Pendaftaran KKN | KKN UIN Saizu" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mx-auto max-w-7xl space-y-16 pb-32"
        >
          <RegistrationHeader readyToRegister={readyToRegister} />

          {/* Identity & Academic Summary */}
          <div className="space-y-16">
            <IdentityForm 
              domicile_profile={domicile_profile} 
              bpjs_profile={bpjs_profile}
              hasVerifiedDomicile={hasVerifiedDomicile}
            />
            <AcademicForm 
              student_academic={student_academic}
              qualifiedBySks={qualifiedBySks}
              qualifiedByBta={qualifiedByBta}
            />
          </div>

          {/* --- SYSTEM NOTIFICATIONS --- */}
          <AnimatePresence>
            {(bpjs_profile && !bpjs_profile.is_complete) ||
            (domicile_profile && !domicile_profile.is_complete) ? (
              <div className="space-y-6">
                {bpjs_profile && !bpjs_profile.is_complete && (
                  <WarningMessage
                    title="Dossier Incomplete"
                    description={`Data profil wajib dilengkapi: ${bpjs_profile.missing_fields.map((f) => f.label).join(', ')}.`}
                    actionHref={bpjs_profile.profile_url}
                    actionLabel="Sync Profile"
                    icon={Activity}
                  />
                )}
                {domicile_profile && !domicile_profile.is_complete && (
                  <WarningMessage
                    title="Verification Failed"
                    description={`Lengkapi verifikasi domisili untuk plotting: ${domicile_profile.missing_fields.map((f) => f.label).join(', ')}.`}
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
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.4em]">
                  Managed Deployments
                </h3>
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
            <motion.div
              variants={itemVariants}
              className="p-20 text-center rounded-[4rem] bg-white border border-dashed border-slate-200 group"
            >
              <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] mx-auto flex items-center justify-center border border-slate-100 mb-8 text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                <FolderKanban size={48} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                No Active Enrollment Cycle
              </h3>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-loose max-w-md mx-auto">
                Pantau terus portal informasi LPPM untuk jadwal pendaftaran KKN Reguler Cycle
                2026/2027.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-20">
              {/* PERIOD SELECTION MATRIX */}
              <motion.div variants={itemVariants} className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-1 w-24 bg-emerald-600 rounded-full" />
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.4em]">
                      Scheme Selection
                    </h2>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {periods.length} Programs Available
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {periods.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => handlePeriodChange(String(period.id))}
                      className={clsx(
                        'text-left p-10 rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden',
                        form.data.period_id === String(period.id)
                          ? 'border-emerald-500 bg-white ring-8 ring-emerald-50 shadow-2xl'
                          : 'border-slate-50 bg-white hover:border-emerald-100 hover:shadow-xl',
                      )}
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div
                          className={clsx(
                            'h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all',
                            form.data.period_id === String(period.id)
                              ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                              : 'bg-slate-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600',
                          )}
                        >
                          <FolderKanban size={28} strokeWidth={2.5} />
                        </div>
                        {period.registration?.status && (
                          <span
                            className={clsx(
                              'px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest',
                              period.registration.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100',
                            )}
                          >
                            {period.registration.status === 'approved' ? 'CONFIRMED' : 'PENDING'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mb-8">
                        <h3
                          className={clsx(
                            'text-2xl font-black tracking-tighter uppercase',
                            form.data.period_id === String(period.id)
                              ? 'text-bg-emerald-100'
                              : 'text-gray-900',
                          )}
                        >
                          {period.nama}
                        </h3>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                          {period.program_type_label || period.jenis || 'KKN Scheme'} &bull;
                          Deadline: {period.registration_end}
                        </p>
                      </div>
                      <div
                        className={clsx(
                          'flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                          form.data.period_id === String(period.id)
                            ? 'text-emerald-600'
                            : 'text-slate-300 group-hover:text-emerald-600',
                        )}
                      >
                        Select Program{' '}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-2 transition-transform"
                        />
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
                      <DocumentUpload 
                        form={form}
                        student_academic={student_academic}
                        hasHealthCertificate={hasHealthCertificate}
                        hasParentPermission={hasParentPermission}
                      />
                      
                      <OperationalNotes 
                        notes={form.data.notes}
                        setNotes={(val) => form.setData('notes', val)}
                      />

                      {/* PROTOCOLS & GOVERNANCE */}
                      <div className="p-12 rounded-[4rem] bg-bg-emerald-50 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 text-emerald-800/10 group-hover:rotate-12 transition-transform duration-[2s]">
                          <Lock size={180} />
                        </div>
                        <div className="relative z-10 grid gap-16 md:grid-cols-2">
                          <div>
                            <h4 className="text-base font-black tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
                              <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Scheme
                              Intelligence
                            </h4>
                            <ul className="space-y-6">
                              {(selectedPeriod.guide?.requirements || []).map((item, i) => (
                                <li key={i} className="flex gap-4 group/li">
                                  <div className="h-6 w-6 rounded-lg bg-bg-emerald-100 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-emerald-600 transition-colors">
                                    <Activity className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                                  </div>
                                  <span className="text-[13px] font-bold text-emerald-100/70 leading-relaxed uppercase tracking-tight">
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-base font-black tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
                              <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Governance
                              Protocol
                            </h4>
                            <ul className="space-y-6">
                              {(selectedPeriod.guide?.governance_notes || []).map((item, i) => (
                                <li key={i} className="flex gap-4 group/li">
                                  <div className="h-6 w-6 rounded-lg bg-bg-emerald-100 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-emerald-600 transition-colors">
                                    <Activity className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                                  </div>
                                  <span className="text-[13px] font-bold text-emerald-100/70 leading-relaxed uppercase tracking-tight">
                                    {item}
                                  </span>
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
                          <div className="h-14 w-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                            <ShieldCheck size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                              Enrollment Briefing
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 opacity-70">
                              Review & Deploy
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <BriefingItem
                            label="Mode"
                            value={selectedPeriod.registration_mode_label || 'Pribadi'}
                            icon={UserCheck}
                          />
                          <BriefingItem
                            label="Placement"
                            value={selectedPeriod.placement_mode_label || 'Auto-Plot'}
                            icon={MapPin}
                          />
                          <BriefingItem
                            label="Origin Territory"
                            value={domicile_profile?.regency_name || 'UNVERIFIED'}
                            icon={Activity}
                          />

                          <div className="pt-6 border-t border-slate-50 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                Integrity Status
                              </span>
                              <span
                                className={clsx(
                                  'text-[10px] font-black uppercase tracking-widest',
                                  readyToRegister ? 'text-emerald-600' : 'text-rose-600',
                                )}
                              >
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
                                <p className="text-[11px] font-bold text-rose-900 leading-normal uppercase">
                                  Lengkapi prasyarat akademik dan dokumen untuk melanjutkan
                                  pendaftaran.
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!canSubmit || form.processing}
                          className={clsx(
                            'w-full py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl transition-all relative overflow-hidden group flex items-center justify-center gap-4',
                            canSubmit && !form.processing
                              ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-2 active:scale-95'
                              : 'bg-slate-100 text-slate-300 cursor-not-allowed',
                          )}
                        >
                          <AnimatePresence mode="wait">
                            {form.processing ? (
                              <motion.div
                                key="loading"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <RefreshCw size={20} />
                              </motion.div>
                            ) : (
                              <motion.div key="ready" className="flex items-center gap-4">
                                {isRejectedRegistration
                                  ? 'Resubmit Enrollment'
                                  : 'Deploy Application'}
                                <ArrowRight
                                  size={18}
                                  className="group-hover:translate-x-3 transition-transform"
                                />
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
