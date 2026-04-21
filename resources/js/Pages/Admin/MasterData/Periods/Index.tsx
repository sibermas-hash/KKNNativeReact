import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
  Calendar, 
  Copy, 
  Edit2, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Clock, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Settings2,
  ChevronRight,
  Info,
  CalendarDays,
  Users2
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';

const MIN_GAP_DAYS = 7;

function getMinStartDate(registrationEnd: string | ''): string {
  if (!registrationEnd) return '';
  const date = new Date(registrationEnd);
  date.setDate(date.getDate() + MIN_GAP_DAYS);
  return date.toISOString().split('T')[0];
}

function getGapDays(registrationEnd: string | '', startDate: string | ''): number {
  if (!registrationEnd || !startDate) return 0;
  const end = new Date(registrationEnd);
  const start = new Date(startDate);
  const diff = start.getTime() - end.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface AcademicYearOption {
 id: number;
 year: string;
}

interface ProgramOption {
 id: number;
 value: string;
 label: string;
 code?: string;
 program_type?: string | null;
 program_subtype?: string | null;
}

interface PeriodData {
 id: number;
 jenis_kkn_id?: number | null;
 academic_year: AcademicYearOption | null;
 periode: number | null;
 jenis: string | null;
 program_type?: string | null;
 program_subtype?: string | null;
 program_type_label?: string | null;
 registration_mode_label?: string | null;
 name: string;
 start_date: string;
 end_date: string;
 registration_start: string;
 registration_end: string;
 grading_start: string | null;
 grading_end: string | null;
 kuota: number | null;
 is_active: boolean;
 participants_count: number;
 can_delete: boolean;
 delete_blocker: string | null;
 duration_days: number;
 current_phase: string;
}

interface Props extends PageProps {
 periods: { data: PeriodData[]; links: unknown[]; meta: PaginationMeta; };
 academicYears: AcademicYearOption[];
 jenisKkn: Array<{ id: number; name: string; code: string }>;
 programOptions: { types: ProgramOption[]; subtypes: ProgramOption[]; };
 filters: { search?: string; jenis_kkn_id?: string; };
 aiInsights?: string;
}

const initialFormData = {
 academic_year_id: '',
 periode: '',
 jenis_kkn_id: '',
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
 current_phase: 'upcoming',
};

export default function PeriodsIndex({
 periods = { data: [], links: [], meta: { total: 0, current_page: 1, from: null, last_page: 1, links: [], path: '', per_page: 15, to: null } },
 academicYears = [],
 programOptions = { types: [], subtypes: [] },
 filters = {},
 aiInsights = '',
 jenisKkn = []
}: Props) {
 const [editing, setEditing] = useState<PeriodData | null>(null);
 const [deleting, setDeleting] = useState<PeriodData | null>(null);
 const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
 const [search, setSearch] = useState(filters.search || '');
 const [filterJenisId, setFilterJenisId] = useState(filters?.jenis_kkn_id || '');

 const form = useForm(initialFormData);

 const selectedJenisKkn = programOptions?.types?.find((option) => option.value === form.data.jenis_kkn_id) ?? null;

 useEffect(() => {
   const timer = window.setTimeout(() => {
     router.get('/admin/periode', { search, jenis_kkn_id: filterJenisId }, { preserveState: true, replace: true, preserveScroll: true });
   }, 400);
   return () => window.clearTimeout(timer);
 }, [search, filterJenisId]);

 useEffect(() => {
  const updates: Record<string, unknown> = {};
  if (!form.data.academic_year_id && academicYears?.length > 0) updates.academic_year_id = String(academicYears[0].id);

  const programLabel = (form.data.program_type === 'tematik' ? programOptions?.subtypes?.find((s) => s.value === form.data.program_subtype)?.label : null) || selectedJenisKkn?.label || '';
  const generatedName = form.data.periode && programLabel ? `Periode ${form.data.periode} - ${programLabel}` : '';
  if (generatedName && generatedName !== form.data.name) updates.name = generatedName;

  if (Object.keys(updates).length > 0) form.setData({ ...form.data, ...updates } as typeof form.data);
 }, [form.data.periode, form.data.program_subtype, form.data.program_type, form.data.academic_year_id, selectedJenisKkn]);

 const minStartDate = getMinStartDate(form.data.registration_end);
 const gapDays = getGapDays(form.data.registration_end, form.data.start_date);
 const isGapInsufficient = form.data.start_date && gapDays < MIN_GAP_DAYS;

 const validateDates = () => {
   if (!form.data.registration_end || !form.data.start_date) return true;
   return gapDays >= MIN_GAP_DAYS;
 };

 const cancelForm = () => {
  setEditing(null);
  form.reset();
  form.clearErrors();
 };

 const startEdit = (period: PeriodData) => {
  setEditing(period);
  form.clearErrors();
  form.setData({
   academic_year_id: period.academic_year ? String(period.academic_year.id) : '',
   periode: period.periode?.toString() ?? '',
   jenis_kkn_id: period.jenis_kkn_id ? String(period.jenis_kkn_id) : '',
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
   current_phase: period.current_phase === 'selection' ? 'placement' : (period.current_phase ?? 'upcoming'),
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault();
  if (!validateDates()) {
    alert(`Jarak minimal antara penutupan pendaftaran dan mulai pelaksanaan adalah ${MIN_GAP_DAYS} hari. Saat ini hanya ${gapDays} hari.`);
    return;
  }
  if (editing) {
    form.put(`/admin/periode/${editing.id}`, { onSuccess: () => cancelForm() });
    return;
  }
  form.post('/admin/periode', { onSuccess: () => cancelForm() });
 };

 return (
  <AppLayout title="Manajemen Periode">
    <Head title="Manajemen Periode" />

    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
      <PageHeader
        title="Siklus KKN."
        subtitle="Manajemen linimasa pendaftaran, jadwal pelaksanaan, dan orkestrasi fase transisi KKN."
        icon={Clock}
        groupLabel="Operasional Sistem"
        stats={{
          label: 'Periode Aktif',
          value: `${periods.data.filter(p => p.is_active).length} Aktif`,
          icon: CalendarDays,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- FORM PANEL (Left 1/3) --- */}
        <div className="lg:col-span-1">
          <ContentPanel
            title={editing ? 'Koreksi Siklus' : 'Registrasi Siklus'}
            description={editing ? `Memperbarui parameter periode ${editing.name}` : 'Daftarkan siklus pelaksanaan KKN baru.'}
            icon={editing ? Edit2 : Plus}
            padding={true}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Tahun Akademik</label>
                  <select
                    value={form.data.academic_year_id}
                    onChange={(e) => form.setData('academic_year_id', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none bg-white"
                  >
                    {academicYears.map((y) => <option key={y.id} value={String(y.id)}>{y.year}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Periode Ke</label>
                    <input
                      type="number"
                      value={form.data.periode}
                      onChange={(e) => form.setData('periode', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                      placeholder="Misal: 1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Kuota Max</label>
                    <input
                      type="number"
                      value={form.data.kuota}
                      onChange={(e) => form.setData('kuota', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Skema Program</label>
                  <select
                    value={form.data.jenis_kkn_id}
                    onChange={(e) => form.setData('jenis_kkn_id', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none bg-white"
                  >
                    <option value="">Pilih Skema...</option>
                    {programOptions.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {form.errors.jenis_kkn_id && <p className="text-xs font-medium text-rose-600 mt-1">{form.errors.jenis_kkn_id}</p>}
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider pl-1">Jadwal Pendaftaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={form.data.registration_start}
                        onChange={(e) => form.setData('registration_start', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none"
                      />
                      <input
                        type="date"
                        value={form.data.registration_end}
                        onChange={(e) => form.setData('registration_end', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider pl-1">Jadwal Pelaksanaan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={form.data.start_date}
                        onChange={(e) => form.setData('start_date', e.target.value)}
                        className={clsx(
                          "w-full px-3 py-2 rounded-lg border bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none",
                          isGapInsufficient ? 'border-rose-300' : 'border-emerald-100'
                        )}
                      />
                      <input
                        type="date"
                        value={form.data.end_date}
                        onChange={(e) => form.setData('end_date', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none"
                      />
                    </div>
                    {isGapInsufficient && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-rose-50 rounded border border-rose-100">
                        <AlertTriangle size={12} className="text-rose-600" />
                        <span className="text-xs font-medium text-rose-600">Jarak min. {MIN_GAP_DAYS} hari (Sekarang: {gapDays} hari)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Fase Aktif</label>
                  <select
                    value={form.data.current_phase}
                    onChange={(e) => form.setData('current_phase', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none bg-white"
                  >
                    <option value="upcoming">Belum Dimulai</option>
                    <option value="registration">Pendaftaran</option>
                    <option value="placement">Penempatan</option>
                    <option value="execution">Pelaksanaan</option>
                    <option value="grading">Penilaian</option>
                    <option value="finished">Selesai</option>
                  </select>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center h-5 pt-0.5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={form.data.is_active}
                      onChange={(e) => form.setData('is_active', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="is_active" className="text-sm font-bold text-emerald-950 cursor-pointer uppercase tracking-wider">Publikasikan Periode</label>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">Draft hanya dapat dilihat oleh administrator.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={form.processing || !!isGapInsufficient}
                  className="w-full h-11 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] uppercase tracking-wider disabled:opacity-50"
                >
                  {form.processing ? <RefreshCw size={14} className="animate-spin" /> : editing ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                  {editing ? 'Simpan Perubahan' : 'Daftarkan Siklus'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="w-full h-11 bg-white border border-gray-200 text-emerald-900 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-wider"
                  >
                    Batal Koreksi
                  </button>
                )}
              </div>
            </form>
          </ContentPanel>
        </div>

        {/* --- DATA LIST PANEL (Right 2/3) --- */}
        <div className="lg:col-span-2 space-y-6">
          <ContentPanel
            title="Arsip Siklus Pelaksanaan"
            icon={Clock}
            padding={false}
            headerAction={
              <div className="flex items-center gap-3">
                <select
                  value={filterJenisId}
                  onChange={(e) => setFilterJenisId(e.target.value)}
                  className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-emerald-900 uppercase tracking-tight focus:border-emerald-600 outline-none"
                >
                  <option value="">SEMUA SKEMA</option>
                  {jenisKkn.map((j) => <option key={j.id} value={String(j.id)}>{j.name.toUpperCase()}</option>)}
                </select>
                <SearchInput
                  placeholder="CARI PERIODE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48"
                />
              </div>
            }
            footer={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  {periods.meta?.total || 0} Siklus Terdaftar &middot; Halaman {periods.meta?.current_page} dari {periods.meta?.last_page}
                </span>
                {periods.meta && <Pagination meta={periods.meta} />}
              </div>
            }
          >
            <PremiumTable
              headers={['Nama & Skema', 'Tahun', 'Jadwal', 'Fase', 'Aksi']}
              isEmpty={periods.data.length === 0}
              emptyText="Data periode pelaksanaan tidak ditemukan."
            >
              {periods.data.map((period) => (
                <PremiumTableRow key={period.id} className="group">
                  <PremiumTableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors leading-tight">{period.name}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                          {period.program_type_label || 'Reguler'}
                        </span>
                        <span className="text-xs font-medium text-emerald-800/60 leading-none">
                          {period.jenis || 'Umum'}
                        </span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <span className="text-sm font-bold text-emerald-950 tabular-nums">{period.academic_year?.year || '-'}</span>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-950 tabular-nums">{formatDate(period.registration_start)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-[12px]" />
                        <span className="text-[10px] font-bold text-emerald-800/60 uppercase">s/d {formatDate(period.registration_end)}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                        {period.current_phase}
                      </span>
                      <StatusTag status={period.is_active ? 'Aktif' : 'Draft'} />
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/periode/${period.id}`}
                        className="h-8 w-8 flex items-center justify-center bg-gray-50 border border-gray-100 text-emerald-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                        title="Eksplorasi"
                      >
                        <ChevronRight size={14} />
                      </Link>
                      <button
                        onClick={() => setDuplicating(period)}
                        className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-emerald-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                        title="Duplikasi"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => startEdit(period)}
                        className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-emerald-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(period)}
                        disabled={!period.can_delete}
                        className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm disabled:opacity-30"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </ContentPanel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100/30 flex items-start gap-4">
               <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
                  <Info size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Integritas Linimasa</h4>
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    Setiap transisi fase memicu perubahan akses fitur bagi mahasiswa dan DPL secara otomatis. Pastikan jadwal pendaftaran dan pelaksanaan tidak tumpang tindih.
                  </p>
               </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/50 flex items-start gap-4">
               <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                  <Settings2 size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Otomasi Alur</h4>
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    Gunakan fitur Duplikasi untuk mempercepat pembuatan periode baru dengan parameter yang sama dari tahun sebelumnya.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={!!duplicating}
      onClose={() => setDuplicating(null)}
      onConfirm={() => duplicating && router.post(`/admin/periode/${duplicating.id}/duplikasi`, {}, { onSuccess: () => setDuplicating(null) })}
      title="Duplikasi Periode"
      message={`Apakah Anda yakin ingin menduplikasi pengaturan dari periode "${duplicating?.name}"?`}
      confirmLabel="Ya, Duplikasi"
    />
    
    <ConfirmDialog
      open={!!deleting}
      onClose={() => setDeleting(null)}
      onConfirm={() => deleting && router.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
      title="Hapus Periode"
      message={`Apakah Anda yakin ingin menghapus "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      confirmLabel="Hapus"
      confirmVariant="danger"
    />
  </AppLayout>
 );
}

function formatDate(value: string | null) {
 if (!value) return '-';
 return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
