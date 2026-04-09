import { Head, Link, useForm } from '@inertiajs/react';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { useEffect, useMemo, type FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';

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

export default function Register({
    periods,
    managed_programs = [],
    student_gender,
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

    const availableOutsideHomeRegency = selectedPeriod
        ? selectedPeriod.kelompok.filter((group) => {
              const homeRegency = normalizeAdministrativeName(domicile_profile?.regency_name);
              const groupRegency = normalizeAdministrativeName(group.lokasi?.regency_name);

              return homeRegency === '' || groupRegency !== homeRegency;
          }).length
        : 0;

    return (
        <ErrorBoundary>
            <AppLayout title="Pendaftaran KKN">
                <Head title="Pendaftaran KKN" />

                <div className="mx-auto max-w-5xl space-y-6">
                    <section className="rounded-lg border border-slate-200 bg-white p-8">
                    <h1 className="text-2xl font-semibold text-slate-900">Pendaftaran KKN</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Portal ini digunakan untuk pengajuan mandiri KKN Reguler. Program khusus
                        seperti KKN Nusantara, KKN Terpadu Internasional Mandiri, KKN Kolaborasi
                        PTKIN, dan KKN Tematik mengikuti tata kelola seleksi atau penugasan khusus
                        sesuai panduan LPPM.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <RequirementCard
                        label="SKS"
                        ok={qualifiedBySks}
                        value={`${student_academic?.sks_completed ?? 0} / ${student_academic?.min_sks ?? 100}`}
                    />
                    <RequirementCard
                        label="BTA-PPI"
                        ok={qualifiedByBta}
                        value={qualifiedByBta ? 'Lulus' : 'Belum lulus'}
                    />
                    <RequirementCard
                        label="Surat sehat"
                        ok={hasHealthCertificate}
                        value={hasHealthCertificate ? 'Lengkap' : 'Belum'}
                    />
                    <RequirementCard
                        label="Izin orang tua"
                        ok={hasParentPermission}
                        value={hasParentPermission ? 'Lengkap' : 'Belum'}
                    />
                    <RequirementCard
                        label="Domisili"
                        ok={hasVerifiedDomicile}
                        value={hasVerifiedDomicile ? 'Terverifikasi' : 'Belum terverifikasi'}
                    />
                </section>

                {bpjs_profile && !bpjs_profile.is_complete ? (
                    <WarningBox
                        title="Lengkapi biodata peserta"
                        description={`Data berikut wajib dilengkapi sebelum mendaftar KKN: ${bpjs_profile.missing_fields
                            .map((field) => field.label)
                            .join(', ')}.`}
                        actionHref={bpjs_profile.profile_url}
                        actionLabel="Lengkapi Profil"
                    />
                ) : null}

                {domicile_profile && !domicile_profile.is_complete ? (
                    <WarningBox
                        title="Alamat domisili belum siap dipakai untuk auto-plotting"
                        description={`Lengkapi dan verifikasi data berikut terlebih dahulu: ${domicile_profile.missing_fields
                            .map((field) => field.label)
                            .join(', ')}.`}
                        actionHref={domicile_profile.profile_url}
                        actionLabel="Lengkapi Domisili"
                    />
                ) : null}

                {managed_programs.length > 0 ? (
                    <section className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Program Khusus yang Sedang Dibuka
                            </h2>
                            <p className="text-sm text-slate-600">
                                Program berikut aktif, tetapi tidak memakai pendaftaran mandiri
                                pada portal reguler. Ikuti pengumuman, seleksi panitia, atau
                                penugasan program sesuai skemanya.
                            </p>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            {managed_programs.map((program) => (
                                <ManagedProgramCard key={program.id} program={program} />
                            ))}
                        </div>
                    </section>
                ) : null}

                {periods.length === 0 ? (
                    <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                        {managed_programs.length > 0
                            ? 'Saat ini tidak ada periode KKN Reguler yang membuka pendaftaran mandiri. Untuk program khusus, ikuti pengumuman resmi dari LPPM.'
                            : 'Belum ada periode pendaftaran yang aktif saat ini. Silakan tunggu jadwal resmi dari LPPM.'}
                    </section>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <section className="rounded-lg border border-slate-200 bg-white p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Periode aktif
                                    </label>
                                    <select
                                        value={form.data.period_id}
                                        onChange={(event) => handlePeriodChange(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Pilih periode</option>
                                        {periods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {period.nama}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.period_id ? (
                                        <p className="text-xs text-red-600">{form.errors.period_id}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Jenis kelamin mahasiswa
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        {student_gender === 'L'
                                            ? 'Laki-laki'
                                            : student_gender === 'P'
                                              ? 'Perempuan'
                                              : 'Belum terisi'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Unggah surat sehat
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(event) =>
                                            form.setData('health_certificate', event.target.files?.[0] ?? null)
                                        }
                                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
                                    />
                                    {form.errors.health_certificate ? (
                                        <p className="text-xs text-red-600">
                                            {form.errors.health_certificate}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Unggah izin orang tua
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(event) =>
                                            form.setData('parent_permission', event.target.files?.[0] ?? null)
                                        }
                                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
                                    />
                                    {form.errors.parent_permission ? (
                                        <p className="text-xs text-red-600">
                                            {form.errors.parent_permission}
                                        </p>
                                    ) : null}
                                    {student_academic?.parent_permission_template ? (
                                        <a
                                            href={student_academic.parent_permission_template}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Unduh template izin orang tua
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {selectedPeriod ? (
                            <section className="rounded-lg border border-slate-200 bg-white p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            Tata Kelola Pendaftaran
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Pendaftaran dibuka {selectedPeriod.registration_start} sampai{' '}
                                            {selectedPeriod.registration_end}. Periode ini berjalan sebagai{' '}
                                            {selectedPeriod.program_type_label || selectedPeriod.jenis || 'program KKN'}{' '}
                                            dengan pola{' '}
                                            {selectedPeriod.registration_mode_label?.toLowerCase() || 'pendaftaran terkelola'}.
                                        </p>
                                    </div>

                                    {currentRegistration ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            <p>Status: {humanizeRegistrationStatus(currentRegistration.status)}</p>
                                            <p className="mt-1">
                                                Kelompok:{' '}
                                                {currentRegistration.group?.name || 'Belum ditetapkan'}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                {!supportsSelfService ? (
                                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                        <p className="font-semibold text-amber-900">
                                            Periode ini tidak memakai pendaftaran mandiri
                                        </p>
                                        <p className="mt-2">
                                            {selectedPeriod.program_type_label || selectedPeriod.jenis || 'Program ini'} dikelola melalui{' '}
                                            {selectedPeriod.registration_mode_label?.toLowerCase() || 'mekanisme khusus'}.
                                            Silakan ikuti pengumuman atau seleksi yang ditetapkan LPPM.
                                        </p>
                                    </div>
                                ) : null}

                                {isRejectedRegistration ? (
                                    <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                                        <p className="font-semibold text-rose-900">
                                            Pendaftaran sebelumnya ditolak
                                        </p>
                                        <p className="mt-2">
                                            {currentRegistration?.rejection_reason ||
                                                'Admin meminta Anda memperbaiki data atau dokumen pendaftaran sebelum mengajukan ulang.'}
                                        </p>
                                        {currentRegistration?.revision_count ? (
                                            <p className="mt-2 text-xs text-rose-700">
                                                Riwayat pengajuan ulang: {currentRegistration.revision_count} kali.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="mt-6 grid gap-4 md:grid-cols-3">
                                    <PlacementInfoCard
                                        label="Domisili asal"
                                        value={domicile_profile?.regency_name || 'Belum diisi'}
                                    />
                                    <PlacementInfoCard
                                        label="Mode pendaftaran"
                                        value={selectedPeriod.registration_mode_label || 'Belum diatur'}
                                    />
                                    <PlacementInfoCard
                                        label="Mode penempatan"
                                        value={selectedPeriod.placement_mode_label || 'Belum diatur'}
                                    />
                                </div>

                                {selectedPeriod.guide ? (
                                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                        <GuideCard
                                            title="Syarat Program"
                                            items={selectedPeriod.guide.requirements || []}
                                        />
                                        <GuideCard
                                            title="Tata Kelola Program"
                                            items={selectedPeriod.guide.governance_notes || []}
                                        />
                                    </div>
                                ) : null}

                                {supportsSelfService ? (
                                    <>
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <PlacementInfoCard
                                                label="Kelompok aktif di periode ini"
                                                value={`${selectedPeriod.kelompok.length} unit`}
                                            />
                                            <PlacementInfoCard
                                                label="Kandidat di luar domisili"
                                                value={`${availableOutsideHomeRegency} unit`}
                                            />
                                        </div>

                                        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                            <p className="font-semibold text-emerald-900">Aturan penempatan reguler</p>
                                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                                <li>Mahasiswa wajib melengkapi dan memverifikasi domisili di profil.</li>
                                                <li>Pendaftaran masuk lebih dulu untuk direview admin.</li>
                                                <li>Sistem tidak akan menempatkan Anda pada kabupaten/kota yang sama dengan domisili asal.</li>
                                                <li>Setelah disetujui admin, sistem menempatkan Anda ke kelompok yang lolos aturan kuota dan komposisi.</li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">
                                            Program ini dikelola di luar pendaftaran mandiri
                                        </p>
                                        <p className="mt-2">
                                            Portal reguler hanya menampilkan informasi tata kelola.
                                            Pengusulan peserta, seleksi, dan penempatan kelompok
                                            dilakukan oleh LPPM, panitia, host, atau pengusul program
                                            sesuai skema KKN.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 space-y-4">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Catatan tambahan
                                    </label>
                                    <FormInput
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                        error={form.errors.notes}
                                        placeholder="Tuliskan catatan tambahan bila diperlukan."
                                    />
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || form.processing}
                                        className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {form.processing
                                            ? 'Mengirim...'
                                            : isRejectedRegistration
                                              ? 'Ajukan Ulang Pendaftaran'
                                              : currentRegistration
                                                ? 'Perbarui Pendaftaran'
                                                : 'Ajukan Pendaftaran'}
                                    </button>
                                </div>
                                {!supportsSelfService ? (
                                    <p className="mt-3 text-right text-xs text-slate-500">
                                        Tombol pendaftaran dinonaktifkan karena periode ini mengikuti tata kelola khusus.
                                    </p>
                                ) : null}
                            </section>
                        ) : null}
                    </form>
                )}
            </div>
            </AppLayout>
        </ErrorBoundary>
    );
}

function ManagedProgramCard({ program }: { program: PeriodOption }) {
    return (
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {program.program_subtype_label || program.program_type_label || program.jenis || 'Program khusus'}
                </span>
                <span className="text-xs text-slate-500">
                    Pendaftaran {program.registration_start} s.d. {program.registration_end}
                </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">{program.nama}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <PlacementInfoCard
                    label="Mode pendaftaran"
                    value={program.registration_mode_label || 'Terkelola'}
                />
                <PlacementInfoCard
                    label="Mode penempatan"
                    value={program.placement_mode_label || 'Terkelola'}
                />
            </div>
            {program.guide ? (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                        <p className="font-semibold text-slate-900">Syarat umum</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                            {(program.guide.requirements || []).map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Tata kelola</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                            {(program.guide.governance_notes || []).map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </article>
    );
}

function RequirementCard({
    label,
    ok,
    value,
}: {
    label: string;
    ok: boolean;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
            <p className={`mt-2 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                {ok ? 'Siap' : 'Belum siap'}
            </p>
        </div>
    );
}

function PlacementInfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-base font-semibold text-slate-800">{value}</p>
        </div>
    );
}

function GuideCard({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

function WarningBox({
    title,
    description,
    actionHref,
    actionLabel,
}: {
    title: string;
    description: string;
    actionHref: string;
    actionLabel: string;
}) {
    return (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-semibold text-amber-900">{title}</p>
            <p className="mt-2">{description}</p>
            <Link
                href={actionHref}
                className="mt-4 inline-flex rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
                {actionLabel}
            </Link>
        </section>
    );
}

function normalizeAdministrativeName(value?: string | null): string {
    return (value ?? '')
        .toLowerCase()
        .replace(/\b(kabupaten|kab\.|kota)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function humanizeRegistrationStatus(status: string): string {
    return {
        pending: 'Menunggu verifikasi',
        approved: 'Disetujui',
        rejected: 'Ditolak',
    }[status] ?? status;
}
