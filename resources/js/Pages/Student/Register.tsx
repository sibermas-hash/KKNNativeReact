import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { AcademicForm } from '@/Components/Registration/AcademicForm';
import { DocumentUpload } from '@/Components/Registration/DocumentUpload';
import { EmptyEnrollmentState } from '@/Components/Registration/EmptyEnrollmentState';
import { EnrollmentBriefing } from '@/Components/Registration/EnrollmentBriefing';
import { IdentityForm } from '@/Components/Registration/IdentityForm';
import { ManagedDeployments } from '@/Components/Registration/ManagedDeployments';
import { NotificationPanel } from '@/Components/Registration/NotificationPanel';
import { OperationalNotes } from '@/Components/Registration/OperationalNotes';
import { SchemeSelectionMatrix } from '@/Components/Registration/SchemeSelectionMatrix';
import { AlertTriangle, CircleCheckBig, MapPinned } from 'lucide-react';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';
import type { DomicileSummary, PeriodOption, ProfileSummary } from './Register/types';

interface StudentAcademic {
  sks_completed: number;
  gpa?: number | null;
  is_bta_ppi_passed: boolean;
  bta_ppi_status?: string | null;
  has_health_certificate: boolean;
  has_parent_permission?: boolean;
  parent_permission_template?: string | null;
  semester?: number;
  min_sks?: number;
}

interface EligibilitySummary {
  is_eligible: boolean;
  requirements?: {
    sks?: number;
    gpa?: number | null;
    bta_ppi?: boolean;
  };
}

interface RegistrationFormData {
  periode_id: string;
  health_certificate: File | null;
  parent_permission: File | null;
  notes: string;
}

type StudentRegisterProps = PageProps<{
  periods: PeriodOption[];
  managed_programs: PeriodOption[];
  student_gender?: string | null;
  student_academic?: StudentAcademic | null;
  eligibility?: EligibilitySummary | null;
  biodata_profile?: ProfileSummary | null;
  domicile_profile?: DomicileSummary | null;
  current_phase?: string;
}>;

export default function StudentRegister({
  periods,
  managed_programs,
  student_gender,
  student_academic,
  eligibility,
  biodata_profile,
  domicile_profile,
}: StudentRegisterProps) {
  const firstPeriodId = periods[0] ? String(periods[0].id) : '';
  const [selectedPeriodId, setSelectedPeriodId] = useState(firstPeriodId);
  const form = useForm<RegistrationFormData>({
    periode_id: firstPeriodId,
    health_certificate: null,
    parent_permission: null,
    notes: periods[0]?.registration?.notes ?? '',
  });

  useEffect(() => {
    if (!selectedPeriodId && periods[0]) {
      const nextPeriodId = String(periods[0].id);
      setSelectedPeriodId(nextPeriodId);
      form.setData({
        periode_id: nextPeriodId,
        health_certificate: null,
        parent_permission: null,
        notes: periods[0].registration?.notes ?? '',
      });
    }
  }, [form, periods, selectedPeriodId]);

  const selectedPeriod = periods.find((period) => String(period.id) === selectedPeriodId) ?? null;
  const currentRegistration = selectedPeriod?.registration ?? null;
  const isRejectedRegistration = currentRegistration?.status === 'rejected';
  const hasActiveRegistration = currentRegistration !== null && !isRejectedRegistration;
  const isBiodataComplete = biodata_profile?.is_complete ?? false;
  const isDomicileReady = domicile_profile?.is_complete ?? false;
  const minimumSks = student_academic?.min_sks ?? 100;
  const currentSks = student_academic?.sks_completed ?? 0;
  const qualifiedBySks = currentSks >= minimumSks;
  const qualifiedByBta = student_academic?.is_bta_ppi_passed ?? false;
  const hasHealthCertificate = (student_academic?.has_health_certificate ?? false) || form.data.health_certificate !== null;
  const hasParentPermission = (student_academic?.has_parent_permission ?? false) || form.data.parent_permission !== null;
  const readyToRegister =
    isBiodataComplete &&
    isDomicileReady &&
    qualifiedBySks &&
    qualifiedByBta &&
    hasHealthCertificate &&
    hasParentPermission &&
    (eligibility?.is_eligible ?? true);
  const supportsSelfService = selectedPeriod?.self_service_enabled ?? false;
  const canSubmit = Boolean(selectedPeriodId) && supportsSelfService && readyToRegister && !hasActiveRegistration;

  const handlePeriodChange = (periodId: string) => {
    const nextPeriod = periods.find((period) => String(period.id) === periodId);

    setSelectedPeriodId(periodId);
    form.setData({
      periode_id: periodId,
      health_certificate: null,
      parent_permission: null,
      notes: nextPeriod?.registration?.notes ?? '',
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPeriodId || !canSubmit) {
      return;
    }

    form.post(route('student.registration.store'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  return (
    <AppLayout title="Pendaftaran KKN">
      <Head title="Pendaftaran KKN" />

      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.5fr_1fr] lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                <CircleCheckBig className="h-4 w-4" />
                Portal Pendaftaran
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-emerald-950 lg:text-4xl">
                  Pendaftaran KKN Mandiri
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-emerald-800">
                  Pilih periode aktif, cek kelengkapan biodata dan domisili, lalu kirim pendaftaran
                  dengan dokumen pendukung agar proses verifikasi admin berjalan lancar.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatusMetric
                label="Biodata"
                value={isBiodataComplete ? 'Lengkap' : 'Perlu dilengkapi'}
                ok={isBiodataComplete}
              />
              <StatusMetric
                label="Domisili"
                value={isDomicileReady ? 'Terverifikasi' : 'Perlu verifikasi'}
                ok={isDomicileReady}
              />
              <StatusMetric
                label="Akademik"
                value={`${currentSks}/${minimumSks} SKS`}
                ok={qualifiedBySks}
              />
              <StatusMetric
                label="BTA/PPI"
                value={qualifiedByBta ? 'Lulus' : 'Belum lulus'}
                ok={qualifiedByBta}
              />
            </div>
          </div>
        </section>

        <NotificationPanel
          biodata_profile={biodata_profile}
          domicile_profile={domicile_profile}
        />

        {selectedPeriod && currentRegistration && (
          <StatusBanner
            registrationStatus={currentRegistration.status}
            notes={currentRegistration.notes ?? null}
            rejectionReason={currentRegistration.rejection_reason ?? null}
            isRejected={isRejectedRegistration}
          />
        )}

        {periods.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
              <SchemeSelectionMatrix
                periods={periods}
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={handlePeriodChange}
              />
            </section>

            {selectedPeriod && (
              <>
                <PlacementPreview
                  groups={selectedPeriod.kelompok}
                  studentGender={student_gender}
                />

                <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                  <section className="space-y-8 rounded-[2rem] border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm lg:p-8">
                    <IdentityForm
                      domicile_profile={domicile_profile}
                      biodata_profile={biodata_profile}
                      hasVerifiedDomicile={isDomicileReady}
                    />

                    <AcademicForm
                      student_academic={{
                        ...student_academic,
                        min_sks: minimumSks,
                      }}
                      qualifiedBySks={qualifiedBySks}
                      qualifiedByBta={qualifiedByBta}
                    />

                    <DocumentUpload
                      form={{
                        data: form.data,
                        setData: (key, value) => form.setData(key as keyof RegistrationFormData, value),
                        errors: form.errors,
                      }}
                      student_academic={student_academic}
                      hasHealthCertificate={hasHealthCertificate}
                      hasParentPermission={hasParentPermission}
                    />

                    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
                      <OperationalNotes
                        notes={form.data.notes}
                        setNotes={(value) => form.setData('notes', value)}
                      />
                    </section>
                  </section>

                  <EnrollmentBriefing
                    selectedPeriod={selectedPeriod}
                    domicile_profile={domicile_profile}
                    readyToRegister={readyToRegister}
                    canSubmit={canSubmit}
                    formProcessing={form.processing}
                    isRejectedRegistration={isRejectedRegistration}
                    supportsSelfService={supportsSelfService}
                  />
                </div>
              </>
            )}
          </form>
        ) : managed_programs.length === 0 ? (
          <EmptyEnrollmentState />
        ) : null}

        <ManagedDeployments managed_programs={managed_programs} />
      </div>
    </AppLayout>
  );
}

function StatusMetric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div
      className={clsx(
        'rounded-[1.5rem] border px-4 py-4',
        ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/70',
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function StatusBanner({
  registrationStatus,
  notes,
  rejectionReason,
  isRejected,
}: {
  registrationStatus: string;
  notes: string | null;
  rejectionReason: string | null;
  isRejected: boolean;
}) {
  const title = isRejected ? 'Pendaftaran perlu perbaikan' : 'Pendaftaran sudah tercatat';
  const tone = isRejected
    ? 'border-rose-200 bg-rose-50 text-rose-900'
    : 'border-emerald-200 bg-emerald-50 text-emerald-950';

  return (
    <section className={clsx('rounded-[2rem] border px-6 py-5 shadow-sm', tone)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={clsx('mt-0.5 h-5 w-5', isRejected ? 'text-rose-600' : 'text-emerald-600')} />
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.24em]">{title}</p>
          <p className="text-sm leading-6">
            Status saat ini: <strong>{registrationStatus.replace(/_/g, ' ')}</strong>
          </p>
          {rejectionReason && (
            <p className="text-sm leading-6">
              Alasan revisi: <strong>{rejectionReason}</strong>
            </p>
          )}
          {notes && (
            <p className="text-sm leading-6">
              Catatan Anda sebelumnya: <strong>{notes}</strong>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PlacementPreview({
  groups,
  studentGender,
}: {
  groups: PeriodOption['kelompok'];
  studentGender?: string | null;
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <MapPinned className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-emerald-950">Preview Penempatan Kelompok</h2>
          <p className="text-sm text-emerald-800">
            Sistem akan memproses penempatan setelah verifikasi admin, dengan mempertimbangkan
            ketersediaan kursi dan komposisi kelompok.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const needsMoreMaleMembers = group.requires_more_male_members ?? false;
          const genderNotice =
            studentGender === 'L' && needsMoreMaleMembers
              ? 'Kelompok ini masih memerlukan peserta laki-laki.'
              : studentGender === 'P' && needsMoreMaleMembers
                ? 'Kuota minimal peserta laki-laki masih diprioritaskan.'
                : 'Komposisi kelompok sudah mendekati target.';

          return (
            <article
              key={group.id}
              className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/30 p-5"
            >
              <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-950">{group.nama_kelompok}</h3>
                <p className="text-sm text-emerald-800">
                  {group.lokasi?.full_name ?? 'Lokasi penempatan belum tersedia'}
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white px-3 py-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                    Kapasitas
                  </dt>
                  <dd className="mt-1 font-semibold text-emerald-950">
                    {group.peserta_count}/{group.capacity}
                  </dd>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                    Sisa Kursi
                  </dt>
                  <dd className="mt-1 font-semibold text-emerald-950">{group.remaining_seats}</dd>
                </div>
              </dl>

              <p className="mt-4 text-sm leading-6 text-emerald-900">{genderNotice}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
