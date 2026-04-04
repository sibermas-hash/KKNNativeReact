import { Head, router, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import type { PageProps } from '@/types';

interface SlotRule {
 id: number;
 tipe_slot: 'fakultas' | 'prodi';
 label: string;
 kuota_slot: number;
}

interface Group {
 id: number;
 nama_kelompok: string;
 capacity: number;
 peserta_count: number;
 remaining_seats: number;
 male_member_count: number;
 female_member_count: number;
 male_min_required: number;
 male_target_maximum: number;
 requires_more_male_members: boolean;
 male_target_reached: boolean;
 reserved_male_slots: number;
 slot_terkunci: SlotRule[];
 lokasi?: {
 village_name: string;
 full_name?: string;
 } | null;
}

interface PeriodRegistration {
 id: number;
 status: string;
 notes?: string | null;
 kelompok_id?: number | null;
 joined_group_at?: string | null;
 group_locked_until?: string | null;
 group?: {
 id: number;
 name: string;
 location?: {
 id: number;
 name: string;
 } | null;
 } | null;
 queue: {
 status: string;
 penalti_poin: number;
 pindah_count: number;
 max_group_moves: number;
 };
}

interface PeriodOption {
 id: number;
 nama: string;
 registration_start: string;
 registration_end: string;
 kelompok: Group[];
 registration?: PeriodRegistration | null;
}

interface RegisterProps extends PageProps {
 periods: PeriodOption[];
 student_gender?: 'L' | 'P' | null;
 student_academic?: {
 sks_completed: number;
 is_bta_ppi_passed: boolean;
 has_health_certificate: boolean;
 has_parent_permission?: boolean;
 parent_permission_template?: string | null;
 min_sks: number;
 } | null;
}

export default function Register({ periods, student_gender, student_academic }: RegisterProps) {
 const form = useForm({
 period_id: '',
 kelompok_id: '',
 health_certificate: null as File | null,
 parent_permission: null as File | null,
 notes: '',
 });

 const selectedPeriod = useMemo(
 () => periods.find((period) => period.id === Number(form.data.period_id)),
 [form.data.period_id, periods],
 );

 const currentRegistration = selectedPeriod?.registration ?? null;
 const qualifiedBySks =
 (student_academic?.sks_completed ?? 0) >= (student_academic?.min_sks ?? 100);
 const qualifiedByBta = !!student_academic?.is_bta_ppi_passed;
 const hasHealthCertificate =
 !!student_academic?.has_health_certificate || !!form.data.health_certificate;
 const hasParentPermission =
 !!student_academic?.has_parent_permission || !!form.data.parent_permission;
 const readyToRegister = qualifiedBySks && qualifiedByBta && hasHealthCertificate && hasParentPermission;

 const handlePeriodChange = (value: string) => {
 const period = periods.find((item) => item.id === Number(value));
 form.setData({
 ...form.data,
 period_id: value,
 kelompok_id: period?.registration?.kelompok_id ? String(period.registration.kelompok_id) : '',
 notes: period?.registration?.notes ?? '',
 });
 };

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/student/register', {
 forceFormData: true,
 });
 };

 const leaveGroup = () => {
 if (!selectedPeriod || !currentRegistration) {
 return;
 }

 if (!window.confirm('Keluar dari kelompok pada periode ini?')) {
 return;
 }

 router.delete(`/student/register/${selectedPeriod.id}/group`, {
 preserveScroll: true,
 });
 };

 return (
 <AppLayout title="Pendaftaran KKN">
 <Head title="Pendaftaran KKN" />

 <div className="mx-auto max-w-6xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Pendaftaran KKN</h1>
 <p className="mt-2 text-sm text-slate-500">
 Lengkapi syarat akademik dan pilih kelompok pada periode pendaftaran yang masih aktif.
 </p>
 </section>

 <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
 <RequirementCard label="SKS" ok={qualifiedBySks} value={`${student_academic?.sks_completed ?? 0} / ${student_academic?.min_sks ?? 100}`} />
 <RequirementCard label="BTA-PPI" ok={qualifiedByBta} value={qualifiedByBta ? 'Lulus' : 'Belum lulus'} />
 <RequirementCard label="Surat sehat" ok={hasHealthCertificate} value={hasHealthCertificate ? 'Siap' : 'Belum'} />
 <RequirementCard label="Izin orang tua" ok={hasParentPermission} value={hasParentPermission ? 'Siap' : 'Belum'} />
 </section>

 <form onSubmit={handleSubmit} className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="grid gap-6 md:grid-cols-2">
 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Periode aktif</label>
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
 {form.errors.period_id && <p className="text-xs text-red-600">{form.errors.period_id}</p>}
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Jenis kelamin mahasiswa</label>
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
 {student_gender === 'L' ? 'Laki-laki' : student_gender === 'P' ? 'Perempuan' : 'Belum terisi'}
 </div>
 </div>
       </div>

 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Unggah surat sehat</label>
 <input
 type="file"
 accept=".pdf,.jpg,.jpeg,.png"
 onChange={(event) => form.setData('health_certificate', event.target.files?.[0] ?? null)}
 className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
 />
 {form.errors.health_certificate && <p className="text-xs text-red-600">{form.errors.health_certificate}</p>}
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Unggah izin orang tua</label>
 <input
 type="file"
 accept=".pdf,.jpg,.jpeg,.png"
 onChange={(event) => form.setData('parent_permission', event.target.files?.[0] ?? null)}
 className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
 />
 {form.errors.parent_permission && <p className="text-xs text-red-600">{form.errors.parent_permission}</p>}
 {student_academic?.parent_permission_template && (
 <a
 href={student_academic.parent_permission_template}
 className="text-xs font-medium text-primary hover:underline"
 >
 Unduh template izin orang tua
 </a>
 )}
 </div>
 </div>
 </section>

 {selectedPeriod && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">Kelompok Tersedia</h2>
 <p className="mt-1 text-sm text-slate-500">
 Pendaftaran dibuka {selectedPeriod.registration_start} sampai {selectedPeriod.registration_end}.
 </p>
 </div>
 {currentRegistration && (
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
 <p>Status: {currentRegistration.status}</p>
 <p className="mt-1">
 Kelompok: {currentRegistration.group?.name || 'Belum memilih kelompok'}
 </p>
 </div>
 )}
 </div>

 <div className="mt-6 grid gap-4 md:grid-cols-2">
 {selectedPeriod.kelompok.map((group) => {
 const isSelected = String(group.id) === form.data.kelompok_id;
 return (
 <button
 key={group.id}
 type="button"
 onClick={() => form.setData('kelompok_id', String(group.id))}
 className={`rounded-lg border p-4 text-left transition ${
 isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
 }`}
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-base font-semibold text-slate-900">{group.nama_kelompok}</h3>
 <p className="mt-1 text-sm text-slate-500">
 {group.lokasi?.full_name || group.lokasi?.village_name || 'Lokasi belum tersedia'}
 </p>
 </div>
 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
 {group.peserta_count}/{group.capacity}
 </span>
 </div>
 <div className="mt-4 grid gap-2 text-sm text-slate-600">
 <p>Sisa kursi: {group.remaining_seats}</p>
 <p>
 Komposisi L/P: {group.male_member_count}/{group.female_member_count}
 </p>
 <p>
 Target laki-laki: minimal {group.male_min_required}, ideal sampai {group.male_target_maximum}
 </p>
 {group.requires_more_male_members && (
 <p className="text-amber-700">Kelompok ini masih membutuhkan anggota laki-laki.</p>
 )}
 {group.slot_terkunci.length > 0 && (
 <p className="text-xs text-slate-500">
 Slot khusus: {group.slot_terkunci.map((rule) => `${rule.label} (${rule.kuota_slot})`).join(', ')}
 </p>
 )}
 </div>
 </button>
 );
 })}
 </div>

 <div className="mt-6">
 <FormInput
 label="Catatan tambahan"
 value={form.data.notes}
 onChange={(event) => form.setData('notes', event.target.value)}
 error={form.errors.notes}
 />
 </div>

 <div className="mt-6 flex flex-wrap justify-end gap-3">
 {currentRegistration && (
 <button
 type="button"
 onClick={leaveGroup}
 className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
 >
 Keluar dari kelompok
 </button>
 )}
 <button
 type="submit"
 disabled={!readyToRegister || form.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Memproses...' : currentRegistration ? 'Perbarui pendaftaran' : 'Daftar sekarang'}
 </button>
 </div>
 </section>
 )}
 </form>
 </div>
 </AppLayout>
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
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm font-medium text-slate-500">{label}</p>
 <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
 <p className={`mt-2 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
 {ok ? 'Memenuhi syarat' : 'Belum memenuhi syarat'}
 </p>
 </div>
 );
}
