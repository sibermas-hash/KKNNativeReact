import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  AlertTriangle,
  Info,
  GraduationCap,
  BookOpen,
  FileCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDialog from '@/Components/UI/ConfirmDialog';
import { PageHeader } from '@/Components/Premium';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

// --- Interfaces ---

interface UserEligibility {
  sks_completed: number;
  gpa: number;
  bta_ppi_passed: boolean;
  has_health_certificate: boolean;
  has_parent_permission: boolean;
}

interface PeriodSummary {
  id: number;
  name: string;
  jenis: {
    id: number;
    name: string;
    code: string;
    description: string | null;
  } | null;
  requirements: {
    min_sks: number;
    min_gpa: number;
  };
  program_type: string | null;
  registration_start: string;
  registration_end: string;
  start_date: string;
  end_date: string;
  kuota: number | null;
  current_phase: string;
  can_register: boolean;
  ineligible_reasons: string[];
}

interface RegistrationStatus {
  has_registered: boolean;
  status?: string;
  period_name?: string;
  jenis_name?: string;
  registered_at?: string;
}

interface Props extends PageProps {
  periods: PeriodSummary[];
  user_eligibility: UserEligibility;
  registration_status: RegistrationStatus;
}

// --- Main Component ---

export default function KknDaftar({
  periods = [],
  user_eligibility = {} as UserEligibility,
  registration_status,
}: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSummary | null>(null);
  const hasRegistered = registration_status?.has_registered ?? false;

  const activePeriods = periods.filter((p) => p.current_phase === 'registration');
  const upcomingPeriods = periods.filter((p) =>
    ['placement', 'execution'].includes(p.current_phase),
  );

  return (
    <AppLayout title="Pendaftaran KKN">
      <Head title="Pendaftaran KKN" />

      <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
        {/* Header Section */}
        <PageHeader
          title="Pendaftaran KKN"
          subtitle="Pilih periode KKN yang tersedia untuk melaksanakan pengabdian masyarakat."
          icon={GraduationCap}
          breadcrumbs={[
            { label: 'Mahasiswa', href: '/mahasiswa/dashboard' },
            { label: 'Pendaftaran KKN' },
          ]}
        />

        {/* Global Registration Status Banner */}
        {hasRegistered && (
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-amber-950">Anda sudah terdaftar pada KKN</p>
              <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                Anda telah mendaftar pada periode{' '}
                <strong className="text-amber-950">{registration_status.period_name}</strong> (
                {registration_status.jenis_name})
                {registration_status.registered_at && (
                  <> sejak {registration_status.registered_at}</>
                )}
                . Setiap mahasiswa hanya diperbolehkan mendaftar KKN <strong>1 kali</strong> pada
                periode yang aktif.
              </p>
              <div className="flex items-center gap-2 mt-2 pt-1">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest">
                  Status Anda:
                </span>
                <span className="px-2.5 py-1 bg-amber-200/50 text-amber-900 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                  {registration_status.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {periods.length === 0 && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
              <Info size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 tracking-tight">
              Belum Ada Periode KKN
            </h3>
            <p className="text-sm text-emerald-700/80 mt-2 max-w-md mx-auto leading-relaxed">
              Saat ini belum ada periode Kuliah Kerja Nyata yang dibuka untuk pendaftaran. Silakan
              pantau terus pengumuman resmi dari LPPM.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12 space-y-8">
            {/* Active Periods List */}
            {activePeriods.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-600" />
                  Periode Pendaftaran Terbuka
                </h2>
                <div className="grid gap-5">
                  {activePeriods.map((period) => (
                    <PeriodCard
                      key={period.id}
                      period={period}
                      onDaftar={() => setSelectedPeriod(period)}
                      userEligibility={user_eligibility}
                      isRegistered={hasRegistered}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming/Running Periods List */}
            {upcomingPeriods.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-emerald-100/50">
                <h2 className="text-sm font-bold text-emerald-950/70 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-emerald-500" />
                  Periode Sedang Berjalan
                </h2>
                <div className="grid gap-5">
                  {upcomingPeriods.map((period) => (
                    <PeriodCard
                      key={period.id}
                      period={period}
                      upcoming
                      userEligibility={user_eligibility}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmDialog
          open={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          onConfirm={() => {
            if (selectedPeriod) {
              router.get(`/mahasiswa/pendaftaran/${selectedPeriod.id}/dokumen`);
            }
          }}
          title={`Daftar ${selectedPeriod?.name}`}
          message={`Anda akan memulai proses pendaftaran untuk periode ${selectedPeriod?.name}. Pastikan data profil akademik Anda sudah benar. Apakah Anda ingin melanjutkan?`}
          confirmLabel="Ya, Lanjutkan Pendaftaran"
        />
      </div>
    </AppLayout>
  );
}

// --- Sub-components ---

function StatusBadge({
  label,
  value,
  passed,
}: {
  label: string;
  value: string | number;
  passed: boolean;
}) {
  return (
    <div
      className={clsx(
        'px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all',
        passed
          ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/50'
          : 'bg-rose-50 text-rose-700 border border-rose-200/50',
      )}
    >
      {passed ? (
        <CheckCircle2 size={14} className="text-emerald-600" />
      ) : (
        <XCircle size={14} className="text-rose-500" />
      )}
      <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
        {label}: {value}
      </span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon size={12} className="text-emerald-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-emerald-950/50 uppercase tracking-widest">
          {label}
        </span>
        <strong className="text-xs text-emerald-950 font-medium">{value}</strong>
      </div>
    </div>
  );
}

function PeriodCard({
  period,
  onDaftar,
  upcoming = false,
  userEligibility,
  isRegistered = false,
}: {
  period: PeriodSummary;
  onDaftar?: () => void;
  upcoming?: boolean;
  userEligibility?: UserEligibility;
  isRegistered?: boolean;
}) {
  const isMissingConfig = !period.jenis;
  const canRegister = !upcoming && !isMissingConfig && (period.can_register ?? false);

  // Custom reasons handling for missing config
  const rawReasons = period.ineligible_reasons ?? [];
  const displayReasons = isMissingConfig
    ? [
        'Pendaftaran belum dapat dilakukan karena konfigurasi jenis KKN belum lengkap. Silakan hubungi admin LPPM.',
      ]
    : rawReasons;

  const hasReasons = !canRegister && !upcoming && displayReasons.length > 0;

  const { sks_completed = 0, gpa = 0, bta_ppi_passed = false } = userEligibility ?? {};

  return (
    <div
      className={clsx(
        'bg-white border rounded-3xl overflow-hidden transition-all duration-300 relative',
        upcoming
          ? 'border-emerald-100 opacity-80'
          : canRegister
            ? 'border-emerald-200/80 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-300 group'
            : 'border-emerald-100/80 bg-emerald-50/10',
      )}
    >
      {/* Decorative gradient border top */}
      {canRegister && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-6 flex-1 min-w-0">
            {/* Title & Badge */}
            <div className="flex items-start gap-4">
              <div className="mt-1 shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <BookOpen size={24} className="opacity-90" />
              </div>
              <div className="min-w-0 pt-1">
                {isMissingConfig ? (
                  <span className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 uppercase tracking-widest">
                    <AlertTriangle size={12} />
                    Menunggu Konfigurasi Admin
                  </span>
                ) : (
                  <span className="inline-block mb-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                    {period.jenis?.name}
                  </span>
                )}
                <h3 className="text-xl font-bold text-emerald-950 leading-tight tracking-tight">
                  {period.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            {!isMissingConfig && period.jenis?.description && (
              <p className="text-sm text-emerald-700/80 leading-relaxed max-w-3xl">
                {period.jenis.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/30 rounded-2xl p-4 border border-emerald-50">
              <InfoRow
                icon={Calendar}
                label="Jadwal Pendaftaran"
                value={`${period.registration_start} — ${period.registration_end}`}
              />
              <InfoRow
                icon={Clock}
                label="Jadwal Pelaksanaan"
                value={`${period.start_date} — ${period.end_date}`}
              />
            </div>

            {/* Requirements & Personal Eligibility Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-2">
              {/* Target Requirements */}
              <div className="flex flex-col gap-2 border-l-2 border-emerald-200 pl-4">
                <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">
                  Persyaratan Akademik Minimum
                </span>
                <div className="flex items-center gap-4 text-xs font-semibold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-500" />
                    {period.requirements?.min_sks ?? 100} SKS
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-emerald-500" />
                    IPK {period.requirements?.min_gpa ?? 2.0}
                  </span>
                </div>
              </div>

              {/* Your Progress */}
              {!isMissingConfig && !upcoming && (
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  <StatusBadge
                    label="SKS"
                    value={sks_completed}
                    passed={sks_completed >= (period.requirements?.min_sks ?? 100)}
                  />
                  <StatusBadge
                    label="IPK"
                    value={gpa.toFixed(2)}
                    passed={gpa >= (period.requirements?.min_gpa ?? 2.0)}
                  />
                  <StatusBadge
                    label="BTA/PPI"
                    value={bta_ppi_passed ? 'Lulus' : 'Belum'}
                    passed={bta_ppi_passed}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 shrink-0 lg:w-48 lg:border-l lg:border-emerald-100 lg:pl-8">
            {period.kuota && (
              <div className="text-center w-full bg-emerald-50/50 py-2 rounded-xl border border-emerald-100/50 hidden lg:block">
                <span className="block text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest mb-0.5">
                  Sisa Kuota
                </span>
                <span className="text-sm font-bold text-emerald-700">{period.kuota} Peserta</span>
              </div>
            )}

            {upcoming ? (
              <div className="w-full text-center py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold uppercase tracking-widest border border-emerald-100">
                Sedang Berjalan
              </div>
            ) : (
              <button
                onClick={canRegister ? onDaftar : undefined}
                disabled={!canRegister}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300',
                  canRegister
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200',
                )}
              >
                {isRegistered ? 'Sudah Terdaftar' : 'Daftar KKN'}
                <ArrowRight
                  size={18}
                  className={clsx(canRegister && 'group-hover:translate-x-1 transition-transform')}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning/Reason Footer */}
      {hasReasons && (
        <footer
          className={clsx(
            'border-t px-6 sm:px-8 py-4 bg-gray-50/50',
            isMissingConfig ? 'border-amber-100' : 'border-gray-100',
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className={clsx(
                isMissingConfig ? 'text-amber-500' : 'text-rose-500',
                'mt-0.5 shrink-0',
              )}
            />
            <div className="space-y-1.5">
              <p
                className={clsx(
                  'text-xs font-bold uppercase tracking-widest',
                  isMissingConfig ? 'text-amber-800' : 'text-rose-800',
                )}
              >
                {isMissingConfig ? 'Peringatan Sistem' : 'Syarat Belum Terpenuhi:'}
              </p>
              <ul
                className={clsx(
                  'text-xs space-y-1.5 font-medium',
                  isMissingConfig ? 'text-amber-700' : 'text-gray-600',
                )}
              >
                {displayReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 opacity-50 shrink-0" />
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
