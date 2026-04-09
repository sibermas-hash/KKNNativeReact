import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Copy, Download, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface AcademicYearOption {
  id: number;
  year: string;
}

interface ProgramOption {
  value: string;
  label: string;
  description?: string | null;
}

interface PeriodData {
  id: number;
  academic_year: AcademicYearOption | null;
  periode: number | null;
  jenis: string | null;
  program_type?: string | null;
  program_subtype?: string | null;
  registration_mode?: string | null;
  placement_mode?: string | null;
  program_type_label?: string | null;
  program_subtype_label?: string | null;
  registration_mode_label?: string | null;
  placement_mode_label?: string | null;
  self_service_enabled?: boolean;
  name: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  grading_start: string | null;
  grading_end: string | null;
  kuota: number | null;
  is_active: boolean;
  groups_count: number;
  participants_count: number;
  dpl_periods_count: number;
  can_delete: boolean;
  delete_blocker: string | null;
  duration_days: number;
  registration_duration_days: number;
  capacity_percentage: number;
}

interface Props extends PageProps {
  periods: {
    data: PeriodData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  academicYears: AcademicYearOption[];
  programOptions: {
    types: ProgramOption[];
    subtypes: ProgramOption[];
  };
  filters: {
    search?: string;
  };
}

const initialFormData = {
  academic_year_id: '',
  periode: '',
  jenis: '',
  program_type: 'reguler',
  program_subtype: '',
  name: '',
  start_date: '',
  end_date: '',
  registration_start: '',
  registration_end: '',
  grading_start: '',
  grading_end: '',
  kuota: '2000',
  is_active: false,
};

function buildGovernancePreview(programType: string, programSubtype: string): {
  registrationMode: string;
  placementMode: string;
  note: string;
} {
  if (programType === 'reguler') {
    return {
      registrationMode: 'Pendaftaran terbuka mandiri',
      placementMode: 'Penempatan otomatis setelah disetujui admin',
      note: 'Sesuai panduan, jalur ini dipakai untuk KKN Reguler. Mahasiswa mendaftar sendiri, lalu admin meninjau sebelum sistem menempatkan ke kelompok.',
    };
  }

  if (programType === 'tematik') {
    const themeLabel =
      programSubtype === 'kampung_zakat'
        ? 'Tematik Kampung Zakat'
        : programSubtype === 'desa_katana'
          ? 'Tematik Desa Katana'
          : 'KKN Tematik';

    return {
      registrationMode: 'Berbasis proposal atau program dosen',
      placementMode: 'Penempatan mengikuti desain program',
      note: `${themeLabel} dikelola sebagai program khusus. Peserta dan lokasi mengikuti proposal, tema, atau arahan LPPM, bukan pendaftaran mandiri reguler.`,
    };
  }

  if (programType === 'internasional_mandiri') {
    return {
      registrationMode: 'Seleksi khusus oleh panitia/LPPM',
      placementMode: 'Penempatan ditentukan mitra atau host',
      note: 'Program internasional tidak dibuka sebagai pendaftaran mandiri umum. Penetapan peserta dan lokasi mengikuti mitra kerja sama.',
    };
  }

  if (programType === 'kolaborasi_ptkin') {
    return {
      registrationMode: 'Seleksi khusus oleh panitia/LPPM',
      placementMode: 'Penempatan ditentukan PTKIN mitra',
      note: 'Program kolaborasi PTKIN mengikuti koordinasi dan penetapan lintas kampus, bukan pemilihan kelompok mandiri oleh mahasiswa.',
    };
  }

  return {
    registrationMode: 'Seleksi khusus oleh panitia/LPPM',
    placementMode: 'Penempatan manual oleh admin/LPPM',
    note: 'Program ini dikelola sebagai program khusus dengan seleksi dan penempatan oleh panitia sesuai pedoman.',
  };
}

export default function PeriodsIndex({ periods, academicYears, programOptions, filters }: Props) {
  const [editing, setEditing] = useState<PeriodData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<PeriodData | null>(null);
  const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const form = useForm(initialFormData);
  const deleteForm = useForm({});
  const duplicateForm = useForm({});

  const selectedProgramType = useMemo(
    () => programOptions.types.find((option) => option.value === form.data.program_type),
    [form.data.program_type, programOptions.types],
  );

  const selectedProgramSubtype = useMemo(
    () => programOptions.subtypes.find((option) => option.value === form.data.program_subtype),
    [form.data.program_subtype, programOptions.subtypes],
  );

  const governancePreview = useMemo(
    () => buildGovernancePreview(form.data.program_type, form.data.program_subtype),
    [form.data.program_type, form.data.program_subtype],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get('/admin/periode', { search }, { preserveState: true, replace: true });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, filters.search]);

  useEffect(() => {
    if (form.data.program_type !== 'tematik' && form.data.program_subtype) {
      form.setData('program_subtype', '');
      return;
    }

    const programLabel =
      (form.data.program_type === 'tematik' ? selectedProgramSubtype?.label : null) ||
      selectedProgramType?.label ||
      '';

    if (programLabel && form.data.jenis !== programLabel) {
      form.setData('jenis', programLabel);
    }

    const generatedName = form.data.periode && programLabel ? `Periode ${form.data.periode} - ${programLabel}` : '';
    if (generatedName !== form.data.name) {
      form.setData('name', generatedName);
    }
  }, [
    form,
    form.data.jenis,
    form.data.name,
    form.data.periode,
    form.data.program_subtype,
    form.data.program_type,
    selectedProgramSubtype?.label,
    selectedProgramType?.label,
  ]);

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
    form.reset();
    form.clearErrors();
  };

  const openCreateForm = () => {
    cancelForm();
    setShowForm(true);
  };

  const startEdit = (period: PeriodData) => {
    setEditing(period);
    setShowForm(true);
    form.clearErrors();
    form.setData({
      academic_year_id: period.academic_year ? String(period.academic_year.id) : '',
      periode: period.periode?.toString() ?? '',
      jenis: period.jenis ?? '',
      program_type: period.program_type ?? 'reguler',
      program_subtype: period.program_subtype ?? '',
      name: period.name,
      start_date: period.start_date,
      end_date: period.end_date,
      registration_start: period.registration_start,
      registration_end: period.registration_end,
      grading_start: period.grading_start ?? '',
      grading_end: period.grading_end ?? '',
      kuota: period.kuota?.toString() ?? '',
      is_active: period.is_active,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.clearErrors();

    if (editing) {
      form.put(`/admin/periode/${editing.id}`, {
        onSuccess: () => cancelForm(),
      });

      return;
    }

    form.post('/admin/periode', {
      onSuccess: () => cancelForm(),
    });
  };

  const totalPeriods = periods.meta?.total || periods.data.length;
  const activePeriods = periods.data.filter((period) => period.is_active).length;
  const selfServicePeriods = periods.data.filter((period) => period.self_service_enabled).length;

  return (
    <AppLayout title="Periode KKN">
      <Head title="Periode KKN" />

      <div className="space-y-6 px-4 pb-8 pt-4 md:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                <Calendar className="h-4 w-4" />
                Tata Kelola Periode
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Periode dan Program KKN</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Halaman ini dipakai untuk mengatur periode pelaksanaan KKN sesuai pedoman. Hanya KKN Reguler
                  yang membuka pendaftaran mandiri mahasiswa. Program lain seperti KKN Nusantara, KKN
                  Internasional, KKN Kolaborasi PTKIN, dan KKN Tematik dikelola sebagai program khusus oleh
                  panitia atau LPPM.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/admin/periode/ekspor';
                }}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <Download className="h-4 w-4" />
                Ekspor Excel
              </button>
              <button
                type="button"
                onClick={showForm ? cancelForm : openCreateForm}
                className={clsx(
                  'inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition',
                  showForm
                    ? 'border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700',
                )}
              >
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showForm ? 'Tutup Formulir' : 'Tambah Periode'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Total Periode</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{totalPeriods}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Periode Aktif</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{activePeriods}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Jalur Mandiri</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{selfServicePeriods}</p>
            </div>
          </div>
        </section>

        {showForm && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-950">
                {editing ? 'Perbarui Periode KKN' : 'Buat Periode KKN'}
              </h2>
              <p className="text-sm text-slate-600">
                Pilih jenis program resmi sesuai pedoman. Sistem akan menurunkan tata kelola pendaftaran dan
                penempatan secara otomatis dari pilihan ini.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <FormSelect
                  id="academic_year_id"
                  label="Tahun Akademik"
                  value={form.data.academic_year_id}
                  onChange={(event) => form.setData('academic_year_id', event.target.value)}
                  options={academicYears.map((year) => ({ value: String(year.id), label: year.year }))}
                  required
                  error={form.errors.academic_year_id}
                />
                <FormInput
                  id="periode"
                  label="Nomor Periode"
                  type="number"
                  value={form.data.periode}
                  onChange={(event) => form.setData('periode', event.target.value)}
                  placeholder="Contoh: 56"
                  required
                  error={form.errors.periode}
                />
                <div className="lg:col-span-2">
                  <FormSelect
                    id="program_type"
                    label="Jenis Program KKN"
                    value={form.data.program_type}
                    onChange={(event) => form.setData('program_type', event.target.value)}
                    options={programOptions.types}
                    required
                    error={form.errors.program_type}
                  />
                  {selectedProgramType?.description && (
                    <p className="mt-2 text-xs text-slate-500">{selectedProgramType.description}</p>
                  )}
                </div>
              </div>

              {form.data.program_type === 'tematik' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <FormSelect
                      id="program_subtype"
                      label="Subtema Tematik"
                      value={form.data.program_subtype}
                      onChange={(event) => form.setData('program_subtype', event.target.value)}
                      options={programOptions.subtypes}
                      placeholder="Tematik umum"
                      error={form.errors.program_subtype}
                    />
                    {selectedProgramSubtype?.description && (
                      <p className="mt-2 text-xs text-slate-500">{selectedProgramSubtype.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <FormInput
                  id="name"
                  label="Nama Resmi Periode"
                  value={form.data.name}
                  onChange={(event) => form.setData('name', event.target.value)}
                  readOnly
                  hint="Nama periode dibentuk otomatis dari nomor periode dan jenis program resmi."
                  error={form.errors.name}
                />
                <FormInput
                  id="kuota"
                  label="Kuota Peserta"
                  type="number"
                  value={form.data.kuota}
                  onChange={(event) => form.setData('kuota', event.target.value)}
                  required
                  error={form.errors.kuota}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Mode Pendaftaran</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{governancePreview.registrationMode}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Mode Penempatan</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{governancePreview.placementMode}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {governancePreview.note}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-black text-slate-950">Jadwal Pendaftaran</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput
                      id="registration_start"
                      label="Mulai Pendaftaran"
                      type="date"
                      value={form.data.registration_start}
                      onChange={(event) => form.setData('registration_start', event.target.value)}
                      required
                      error={form.errors.registration_start}
                    />
                    <FormInput
                      id="registration_end"
                      label="Selesai Pendaftaran"
                      type="date"
                      value={form.data.registration_end}
                      onChange={(event) => form.setData('registration_end', event.target.value)}
                      required
                      error={form.errors.registration_end}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-black text-slate-950">Jadwal Pelaksanaan</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput
                      id="start_date"
                      label="Mulai Pelaksanaan"
                      type="date"
                      value={form.data.start_date}
                      onChange={(event) => form.setData('start_date', event.target.value)}
                      required
                      error={form.errors.start_date}
                    />
                    <FormInput
                      id="end_date"
                      label="Selesai Pelaksanaan"
                      type="date"
                      value={form.data.end_date}
                      onChange={(event) => form.setData('end_date', event.target.value)}
                      required
                      error={form.errors.end_date}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <FormInput
                  id="grading_start"
                  label="Mulai Penilaian"
                  type="date"
                  value={form.data.grading_start}
                  onChange={(event) => form.setData('grading_start', event.target.value)}
                  error={form.errors.grading_start}
                />
                <FormInput
                  id="grading_end"
                  label="Selesai Penilaian"
                  type="date"
                  value={form.data.grading_end}
                  onChange={(event) => form.setData('grading_end', event.target.value)}
                  error={form.errors.grading_end}
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.data.is_active}
                  onChange={(event) => form.setData('is_active', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-slate-900">Jadikan periode aktif</span>
                  <span className="block text-sm text-slate-600">
                    Jika diaktifkan, sistem akan menonaktifkan periode aktif sebelumnya dan menggunakan periode
                    ini sebagai acuan utama portal.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="inline-flex h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={form.processing}
                  className="inline-flex h-11 items-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {form.processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Daftar Periode</h2>
              <p className="mt-1 text-sm text-slate-600">
                Gunakan tabel ini sebagai daftar kerja utama untuk memeriksa status periode, jenis program, dan
                tata kelola pendaftaran sesuai pedoman.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, jenis, atau nomor periode"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Tahun Akademik</th>
                  <th className="px-4 py-3">Pendaftaran</th>
                  <th className="px-4 py-3">Pelaksanaan</th>
                  <th className="px-4 py-3">Kuota</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {periods.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-500">
                      Belum ada data periode yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  periods.data.map((period) => (
                    <tr key={period.id} className="border-b border-slate-100 align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-base font-black text-slate-950">Periode {period.periode ?? '-'}</p>
                          <p className="text-sm font-medium text-slate-600">{period.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {period.program_subtype_label || period.program_type_label || period.jenis || '-'}
                          </div>
                          <p className="text-sm text-slate-600">{period.registration_mode_label}</p>
                          <p className="text-sm text-slate-500">{period.placement_mode_label}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {period.academic_year?.year || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{formatDate(period.registration_start)}</div>
                        <div className="text-slate-500">s.d. {formatDate(period.registration_end)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {period.registration_duration_days} hari
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{formatDate(period.start_date)}</div>
                        <div className="text-slate-500">s.d. {formatDate(period.end_date)}</div>
                        <div className="mt-1 text-xs text-slate-500">{period.duration_days} hari</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>{period.participants_count} peserta</span>
                            <span>/ {period.kuota || 0}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className={clsx(
                                'h-2 rounded-full',
                                period.capacity_percentage >= 90 ? 'bg-rose-500' : 'bg-emerald-500',
                              )}
                              style={{ width: `${Math.min(period.capacity_percentage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500">
                            {period.groups_count} kelompok, {period.dpl_periods_count} penugasan DPL
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div
                            className={clsx(
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                              period.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            {period.is_active && <CheckCircle2 className="h-4 w-4" />}
                            {period.is_active ? 'Aktif' : 'Arsip'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {period.self_service_enabled
                              ? 'Portal mahasiswa aktif untuk pendaftaran mandiri.'
                              : 'Dikelola sebagai program khusus.'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDuplicating(period)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                            title="Duplikasi"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(period)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                            title="Ubah"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(period)}
                            disabled={!period.can_delete}
                            className={clsx(
                              'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition',
                              period.can_delete
                                ? 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                                : 'cursor-not-allowed border-slate-100 text-slate-300',
                            )}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {!period.can_delete && period.delete_blocker && (
                          <p className="mt-2 text-right text-xs text-slate-500">{period.delete_blocker}</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {periods.meta && (
            <div className="flex flex-col gap-4 border-t border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-500">
                Menampilkan {periods.data.length} data pada halaman ini dari total {periods.meta.total} periode.
              </p>
              <Pagination meta={periods.meta} />
            </div>
          )}
        </section>

        <ConfirmDialog
          open={!!duplicating}
          onClose={() => !duplicateForm.processing && setDuplicating(null)}
          onConfirm={() =>
            duplicating &&
            duplicateForm.post(`/admin/periode/${duplicating.id}/duplikasi`, {
              onSuccess: () => setDuplicating(null),
            })
          }
          title="Duplikasi Periode"
          message={`Struktur periode "${duplicating?.name}" akan disalin beserta template kelompoknya. Data peserta dan penugasan aktif tidak ikut disalin.`}
          processing={duplicateForm.processing}
          confirmLabel="Duplikasi Sekarang"
        />

        <ConfirmDialog
          open={!!deleting}
          onClose={() => !deleteForm.processing && setDeleting(null)}
          onConfirm={() =>
            deleting &&
            deleteForm.delete(`/admin/periode/${deleting.id}`, {
              onSuccess: () => setDeleting(null),
            })
          }
          title="Hapus Periode"
          message={
            deleting?.can_delete
              ? `Periode "${deleting?.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
              : deleting?.delete_blocker || 'Periode ini belum dapat dihapus.'
          }
          processing={deleteForm.processing}
          confirmLabel="Hapus Permanen"
        />
      </div>
    </AppLayout>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
