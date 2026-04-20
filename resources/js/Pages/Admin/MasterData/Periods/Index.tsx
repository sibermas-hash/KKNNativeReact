import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Copy, Edit2, Plus, Search, Trash2, X, Clock, Database, CheckCircle2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import FormInput from '@/Components/ui/FormInput';
import FormSelect from '@/Components/ui/FormSelect';
import Pagination from '@/Components/ui/Pagination';
import Modal from '@/Components/ui/Modal';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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
 const [showForm, setShowForm] = useState(false);
 const [deleting, setDeleting] = useState<PeriodData | null>(null);
 const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
 const [search, setSearch] = useState(filters.search || '');
 const [filterJenisId, setFilterJenisId] = useState(filters?.jenis_kkn_id || '');

 const form = useForm(initialFormData);

 const selectedJenisKkn = useMemo(
 () => programOptions?.types?.find((option) => option.value === form.data.jenis_kkn_id) ?? null,
 [form.data.jenis_kkn_id, programOptions?.types],
 );

 useEffect(() => {
 const timer = window.setTimeout(() => {
 router.get('/admin/periode', { search, jenis_kkn_id: filterJenisId }, { preserveState: true, replace: true });
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
  setShowForm(false);
  form.reset();
  form.clearErrors();
 };

 const startEdit = (period: PeriodData) => {
  setEditing(period);
  setShowForm(true);
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
 <Head title="Manajemen Periode"/>

 <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
 {/* HEADER SECTION */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-[#1a7a4a]"/>
 <span className="text-sm font-medium text-emerald-800">Operasional Sistem</span>
 </div>
 <h1 className="text-2xl font-bold text-emerald-950 leading-tight">Manajemen Periode</h1>
 <p className="text-sm text-emerald-800 max-w-2xl mt-1">
 Pengaturan linimasa pendaftaran, jadwal pelaksanaan, dan transisi fase KKN.
 </p>
 </div>
 
 <div className="flex items-center gap-4 shrink-0">
 <div className="px-4 py-2 bg-white border border-emerald-50 rounded-lg shadow-sm flex items-center gap-3">
 <Database size={18} className="text-[#1a7a4a]"/>
 <div className="flex flex-col">
 <span className="text-xs font-medium text-emerald-800">Total Periode</span>
 <span className="text-sm font-semibold text-emerald-950">{(periods.meta?.total || 0).toLocaleString()} Data</span>
 </div>
 </div>
 <button
 onClick={() => { if (showForm) cancelForm(); else setShowForm(true); }}
 className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 transition-colors"
 >
 {showForm ? <X size={16} /> : <Plus size={16} />}
 {showForm ? 'Batal' : 'Tambah Periode'}
 </button>
 </div>
 </div>

 {/* LIST DATA */}
 <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="h-8 w-8 bg-white border border-emerald-50 text-emerald-800 rounded flex items-center justify-center shadow-sm">
 <Clock size={16} />
 </div>
 <h3 className="text-sm font-semibold text-[#1f2937]">Daftar Periode</h3>
 </div>
 <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
 <div className="relative w-full sm:w-64">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800"/>
 <input
 type="text"
 placeholder="Cari..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 rounded-md text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-[#1a7a4a] shadow-sm"
 />
 </div>
 <div className="w-full sm:w-48">
 <select
 value={filterJenisId}
 onChange={(e) => setFilterJenisId(e.target.value)}
 className="w-full h-9 bg-white border border-gray-300 rounded-md text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-[#1a7a4a] shadow-sm"
 >
 <option value="">Semua Jenis KKN</option>
 {jenisKkn.map((j) => (
 <option key={j.id} value={String(j.id)}>{j.name}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800">Nama Periode</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800">Tahun Akademik</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800">Periode</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-emerald-800">Fase</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-emerald-800">Status Publikasi</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-emerald-800">Aksi</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {periods.data.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-sm text-emerald-800">
 <Clock className="mx-auto h-12 w-12 text-emerald-700 mb-3"strokeWidth={1} />
 Tidak ada data periode yang ditemukan.
 </td>
 </tr>
 ) : (
 periods.data.map((period) => (
 <tr key={period.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-emerald-950">{period.name}</span>
 <span className="text-xs text-emerald-800 mt-0.5">{period.program_type_label || 'Reguler'} • {period.jenis || 'Umum'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-sm text-emerald-800">
 {period.academic_year?.year || '-'}
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1">
 <span className="text-sm text-emerald-950">{formatDate(period.registration_start)}</span>
 <span className="text-xs text-emerald-800">s/d {formatDate(period.registration_end)}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
 {period.current_phase.toUpperCase()}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-center">
 <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", period.is_active ?"bg-[#e8f5ee] text-emerald-800":"bg-gray-100 text-[#1f2937]")}>
 {period.is_active ? 'Aktif' : 'Draft'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
 <div className="flex items-center justify-end gap-2">
 <Link
 href={`/admin/periode/${period.id}`}
 className="p-1.5 text-[#1a7a4a] hover:text-[#1f2937] bg-white border border-emerald-50 hover:bg-gray-50 rounded-md transition-colors"
 title="Detail"
 >
 Eksplorasi
 </Link>
 <button
 onClick={() => setDuplicating(period)}
 className="p-1.5 text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-50 hover:bg-gray-50 rounded-md transition-colors"
 title="Duplikasi"
 >
 <Copy size={16} />
 </button>
 <button
 onClick={() => startEdit(period)}
 className="p-1.5 text-blue-600 hover:text-blue-900 bg-white border border-emerald-50 hover:bg-gray-50 rounded-md transition-colors"
 title="Edit"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => setDeleting(period)}
 disabled={!period.can_delete}
 className="p-1.5 text-rose-600 hover:text-rose-900 bg-white border border-emerald-50 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 title="Hapus"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 <div className="px-6 py-4 border-t border-emerald-50 bg-gray-50 flex items-center justify-between flex-col md:flex-row gap-4">
 <span className="text-xs text-emerald-800">
 Menampilkan <strong>{periods.data.length}</strong> dari <strong>{periods.meta?.total || 0}</strong> periode
 </span>
 {periods.meta && <Pagination meta={periods.meta} />}
 </div>
 </div>
 </div>

 {/* FORM MODAL */}
 <Modal show={showForm} onClose={cancelForm} maxWidth="4xl">
 <div className="bg-white rounded-xl shadow-sm border border-emerald-50">
 <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between">
 <h3 className="text-lg font-medium text-emerald-950">{editing ? 'Edit Periode' : 'Tambah Periode Baru'}</h3>
 <button onClick={cancelForm} className="text-emerald-800 hover:text-emerald-800"><X size={20} /></button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
 <div className="space-y-4">
 <h4 className="text-sm font-semibold text-emerald-950 border-b border-emerald-50 pb-2">Informasi Dasar</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormSelect id="academic_year_id"label="Tahun Akademik"value={form.data.academic_year_id} onChange={(e) => form.setData('academic_year_id', e.target.value)} options={academicYears.map((y) => ({ value: String(y.id), label: y.year }))} required error={form.errors.academic_year_id} />
 <FormInput id="periode"label="Periode (Angka)"type="number"value={form.data.periode} onChange={(e) => form.setData('periode', e.target.value)} placeholder="Misal: 1"required error={form.errors.periode} />
 <FormSelect id="jenis_kkn_id"label="Jenis KKN"value={form.data.jenis_kkn_id} onChange={(e) => form.setData('jenis_kkn_id', e.target.value)} options={programOptions?.types || []} required error={form.errors.jenis_kkn_id} />
 <FormInput id="kuota"label="Kuota Peserta"type="number"value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} required error={form.errors.kuota} />
 </div>

 {form.data.program_type === 'tematik' && (
 <div className="p-4 bg-gray-50 border border-emerald-50 rounded-lg mt-2">
 <FormSelect id="program_subtype"label="Lokasi/Tema"value={form.data.program_subtype} onChange={(e) => form.setData('program_subtype', e.target.value)} options={programOptions?.subtypes || []} error={form.errors.program_subtype} />
 </div>
 )}
 </div>

 <div className="space-y-4 pt-2">
 <h4 className="text-sm font-semibold text-emerald-950 border-b border-emerald-50 pb-2">Penjadwalan</h4>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
 <FormSelect id="current_phase"label="Fase Saat Ini"value={form.data.current_phase} onChange={(e) => form.setData('current_phase', e.target.value)} options={[{ value: 'upcoming', label: 'Belum Dimulai' }, { value: 'registration', label: 'Pendaftaran' }, { value: 'placement', label: 'Penempatan' }, { value: 'execution', label: 'Pelaksanaan' }, { value: 'grading', label: 'Penilaian' }, { value: 'finished', label: 'Selesai' }]} required error={form.errors.current_phase} />
 
 <div className="flex flex-col">
 <label className="text-sm font-medium text-emerald-800 mb-1">Status Publikasi</label>
 <div className="flex items-center h-[38px]">
 <input id="is_active"type="checkbox"checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="focus:ring-[#1a7a4a] h-4 w-4 text-[#1a7a4a] border-gray-300 rounded"/>
 <label htmlFor="is_active"className="ml-2 block text-sm text-emerald-950">
 {form.data.is_active ? 'Aktif (Dapat Dilihat Publik)' : 'Draft (Hanya Admin)'}
 </label>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-emerald-50 rounded-lg">
 <div>
 <h5 className="text-xs font-semibold text-emerald-800 mb-3">Periode Pendaftaran</h5>
 <div className="space-y-3">
<FormInput id="registration_start"label="Pendaftaran Dibuka"type="date"value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required error={form.errors.registration_start} />
  <FormInput 
    id="registration_end"
    label="Pendaftaran Ditutup"
    type="date"
    value={form.data.registration_end} 
    onChange={(e) => form.setData('registration_end', e.target.value)}
    min={form.data.registration_start || undefined}
    required error={form.errors.registration_end} 
  />
 </div>
 </div>
<div>
  <h5 className="text-xs font-semibold text-emerald-800 mb-3">Periode Pelaksanaan</h5>
  <div className="space-y-3">
  <div>
    <FormInput 
      id="start_date"
      label="Penerjunan"
      type="date"
      value={form.data.start_date}
      onChange={(e) => form.setData('start_date', e.target.value)}
      min={minStartDate}
      required 
      error={form.errors.start_date}
    />
    {form.data.registration_end && form.data.start_date && isGapInsufficient && (
      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
        <AlertTriangle size={12} />
        <span>Jarak hanya {gapDays} hari (min. {MIN_GAP_DAYS} hari)</span>
      </div>
    )}
  </div>
  <FormInput id="end_date"label="Penarikan"type="date"value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} min={form.data.start_date || undefined} required error={form.errors.end_date} />
  </div>
  </div>
  </div>
  </div>

  <div className="pt-4 border-t border-emerald-50 flex justify-end gap-3">
  <button type="button"onClick={cancelForm} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-emerald-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a7a4a]">Batal</button>
  <button type="button" disabled={form.processing || !!isGapInsufficient} onClick={handleSubmit} className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#16a34a] hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a7a4a] disabled:opacity-50">
  {form.processing ? <RefreshCw size={16} className="animate-spin mr-2"/> : <CheckCircle2 size={16} className="mr-2"/>}
  {editing ? 'Simpan' : 'Tambah Periode'}
  </button>
  </div>
  </form>
 </div>
 </Modal>

 <ConfirmDialog
 open={!!duplicating}
 onClose={() => setDuplicating(null)}
 onConfirm={() => duplicating && router.post(`/admin/periode/${duplicating.id}/duplikasi`, {}, { onSuccess: () => setDuplicating(null) })}
 title="Duplikasi Periode"
 message={`Apakah Anda yakin ingin menduplikasi pengaturan dari periode"${duplicating?.name}"?`}
 confirmLabel="Ya, Duplikasi"
 />
 
 <ConfirmDialog
 open={!!deleting}
 onClose={() => setDeleting(null)}
 onConfirm={() => deleting && router.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
 title="Hapus Periode"
 message={`Apakah Anda yakin ingin menghapus"${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
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
