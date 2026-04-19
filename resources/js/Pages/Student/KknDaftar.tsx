import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
  Calendar, Clock, ArrowRight, AlertTriangle, Info,
  GraduationCap, BookOpen, FileCheck,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

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
  cuota: number | null;
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

export default function KknDaftar({ periods = [], user_eligibility = {} as UserEligibility, registration_status }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSummary | null>(null);
  const hasRegistered = registration_status?.has_registered ?? false;

  const activePeriods = periods.filter(p => p.current_phase === 'registration');
  const upcomingPeriods = periods.filter(p => ['placement', 'execution'].includes(p.current_phase));

  return (
    <AppLayout title="Pendaftaran KKN">
      <Head title="Pendaftaran KKN"/>

      <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans px-4 sm:px-6">
        {/* Header */}
        <div className="pt-8 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Kuliah Kerja Nyata</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Pendaftaran KKN</h1>
          <p className="text-sm text-emerald-700 mt-1 max-w-xl">
            Pilih periode KKN yang tersedia untuk melaksanakan pengabdian masyarakat.
          </p>
        </div>

        {/* Already Registered Banner */}
        {hasRegistered && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Anda sudah terdaftar pada KKN</p>
              <p className="text-xs text-amber-700">
                Anda telah mendaftar <strong>{registration_status.period_name}</strong> ({registration_status.jenis_name})
                {registration_status.registered_at && <> pada {registration_status.registered_at}</>}.
                Setiap mahasiswa hanya diperbolehkan mendaftar KKN <strong>1 kali</strong>.
              </p>
              <p className="text-xs text-amber-600 pt-1">
                Status: <span className="font-semibold capitalize">{registration_status.status?.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>
        )}

        {/* Active Periods */}
        {activePeriods.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={15} className="text-emerald-600" />
              Periode Pendaftaran Terbuka
            </h2>
            <div className="grid gap-4">
              {activePeriods.map((period) => (
                <PeriodCard
                  key={period.id}
                  period={period}
                  onDaftar={() => setSelectedPeriod(period)}
                  userEligibility={user_eligibility}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Periods */}
        {upcomingPeriods.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Clock size={15} className="text-emerald-600" />
              Periode Sedang Berjalan
            </h2>
            <div className="grid gap-4">
              {upcomingPeriods.map((period) => (
                <PeriodCard
                  key={period.id}
                  period={period}
                  upcoming
                  userEligibility={user_eligibility}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {periods.length === 0 && (
          <div className="bg-white border border-emerald-50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Info size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-950">Belum Ada Periode KKN</h3>
            <p className="text-sm text-emerald-700 mt-2 max-w-sm mx-auto">
              Saat ini belum ada periode KKN yang terbuka. Pantau terus pengumuman dari LPPM.
            </p>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          onConfirm={() => {
            if (selectedPeriod) {
              router.get(`/mahasiswa/pendaftaran/${selectedPeriod.id}/dokumen`);
            }
          }}
          title={`Daftar ${selectedPeriod?.name}`}
          message={`Anda akan memulai proses pendaftaran untuk periode ${selectedPeriod?.name}. Lanjutkan?`}
          confirmLabel="Ya, Lanjutkan"
        />
      </div>
    </AppLayout>
  );
}

function PeriodCard({
  period,
  onDaftar,
  upcoming = false,
  userEligibility,
}: {
  period: PeriodSummary;
  onDaftar?: () => void;
  upcoming?: boolean;
  userEligibility?: UserEligibility;
}) {
  const canRegister = upcoming ? false : (period.can_register ?? false);
  const reasons = period.ineligible_reasons ?? [];
  const hasReasons = !canRegister && !upcoming && reasons.length > 0;

  const { sks_completed = 0, gpa = 0, bta_ppi_passed = false } = userEligibility ?? {};
  
  return (
    <div className={clsx(
      "bg-white border rounded-2xl overflow-hidden transition-all",
      upcoming 
        ? "border-emerald-50 opacity-80" 
        : canRegister 
          ? "border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300" 
          : "border-emerald-50 shadow-sm"
    )}>
      {/* Card Header */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BookOpen size={16} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-emerald-950 leading-snug">{period.name}</h3>
                {period.jenis && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                    {period.jenis.name}
                  </span>
                )}
              </div>
            </div>
            
            {period.jenis?.description && (
              <p className="text-sm text-emerald-700 leading-relaxed pl-12">{period.jenis.description}</p>
            )}

            {/* Date Info */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-emerald-700 pl-12">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-500" />
                <span>Pendaftaran: <strong className="text-emerald-900">{period.registration_start} — {period.registration_end}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" />
                <span>Pelaksanaan: <strong className="text-emerald-900">{period.start_date} — {period.end_date}</strong></span>
              </div>
            </div>

            {/* Requirements */}
            <div className="flex items-center gap-3 text-xs text-emerald-600 pl-12">
              <span className="flex items-center gap-1">
                <FileCheck size={12} />
                Min. {period.requirements?.min_sks ?? 100} SKS
              </span>
              <span className="w-px h-3 bg-emerald-200" />
              <span>IPK ≥ {period.requirements?.min_gpa ?? 2.0}</span>
            </div>

            {/* User Eligibility Status */}
            {userEligibility && (
              <div className="flex flex-wrap items-center gap-2 text-xs pl-12">
                <span className={clsx(
                  "px-2 py-1 rounded-md",
                  sks_completed >= (period.requirements?.min_sks ?? 100)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                )}>
                  SKS: {sks_completed}
                </span>
                <span className={clsx(
                  "px-2 py-1 rounded-md",
                  gpa >= (period.requirements?.min_gpa ?? 2.0)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                )}>
                  IPK: {gpa.toFixed(2)}
                </span>
                <span className={clsx(
                  "px-2 py-1 rounded-md",
                  bta_ppi_passed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                )}>
                  BTA/PPI
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:pt-1">
            {upcoming ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-emerald-700 rounded-xl text-xs font-semibold">
                <Clock size={14} />
                Sedang Berjalan
              </div>
            ) : (
              <button 
                onClick={canRegister ? onDaftar : undefined}
                disabled={!canRegister}
                className={clsx(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  canRegister 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                Daftar Sekarang
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ineligibility Reasons — shown at bottom of card */}
      {hasReasons && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-5 sm:px-6 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-800">Belum memenuhi syarat:</p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-px">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}