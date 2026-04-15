import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Copy, Edit2, Plus, Search, Trash2, X, Clock, Activity, History, RefreshCw, Database
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
  jenisKkn = [],
  programOptions = { types: [], subtypes: [] },
  filters = {},
  aiInsights = '',
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
    if (editing) {
      form.put(`/admin/periode/${editing.id}`, { onSuccess: () => cancelForm() });
      return;
    }
    form.post('/admin/periode', { onSuccess: () => cancelForm() });
  };

  return (
    <AppLayout title="Data Master Periode KKN">
      <Head title="Manajemen Periode KKN" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                 <Clock size={16} className="text-emerald-600" />
                 <span className="text-sm font-medium text-gray-500">Data Master Sistem</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Manajemen Periode KKN</h1>
             <p className="text-sm text-gray-500 max-w-2xl mt-1">
               Pengaturan linimasa pendaftaran, jadwal pelaksanaan, dan fase operasional program KKN.
             </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-3">
                <Database size={18} className="text-emerald-600" />
                <div className="flex flex-col">
                   <span className="text-xs font-medium text-gray-500">Siklus Terdaftar</span>
                   <span className="text-sm font-semibold text-gray-900">{(periods.meta?.total || 0).toLocaleString()} Data</span>
                </div>
             </div>
             <button
               onClick={() => { if (showForm) cancelForm(); else setShowForm(true); }}
               className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
             >
               {showForm ? <X size={16} /> : <Plus size={16} />}
               {showForm ? 'Batal' : 'Tambah Periode'}
             </button>
          </div>
        </div>

        {/* AI INSIGHTS */}
        {aiInsights && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-4">
            <Activity size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Catatan AI</h4>
              <p className="text-sm text-emerald-700 mt-1">{aiInsights}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* SEARCH & FILTERS */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:flex-1">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input
                     type="text"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                     placeholder="Cari ID Periode / Nama..."
                   />
                </div>
                <div className="w-full md:w-72">
                   <select
                     value={filterJenisId}
                     onChange={(e) => setFilterJenisId(e.target.value)}
                     className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                   >
                     <option value="">Semua Jenis KKN</option>
                     {jenisKkn.map((j) => (
                       <option key={j.id} value={String(j.id)}>{j.name}</option>
                     ))}
                   </select>
                </div>
             </div>

             {/* LIST DATA */}
             <div className="overflow-x-auto min-h-[400px]">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status &amp; Periode</th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Identitas Periode</th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Atribut</th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rentang Penjadwalan</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {periods.data.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                         <History className="mx-auto h-12 w-12 text-gray-300 mb-3" strokeWidth={1} />
                         Tidak ada data periode ditemukan.
                       </td>
                     </tr>
                   ) : (
                     periods.data.map((period) => (
                       <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-2">
                             <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold", period.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600")}>
                               {period.is_active ? 'Publik' : 'Draft'}
                             </span>
                             <span className="text-xs font-mono text-gray-400">#{period.periode}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-col max-w-xs">
                             <span className="text-sm font-semibold text-gray-900 truncate" title={period.name}>{period.name}</span>
                             <span className="text-xs text-gray-500 mt-1">{period.academic_year?.year}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex flex-col gap-1.5">
                             <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded w-fit">{period.program_type_label || 'Reguler'}</span>
                             <span className="text-xs text-gray-500">{period.jenis || 'Umum'}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-1.5 text-xs text-gray-700">
                               <Clock size={14} className="text-emerald-500" />
                               <span>{formatDate(period.registration_start)} - {formatDate(period.registration_end)}</span>
                             </div>
                             <span className="text-xs font-medium text-gray-500">Fase: <span className="text-emerald-600">{period.current_phase}</span></span>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                           <div className="flex items-center justify-end gap-2">
                             <Link href={`/admin/periode/${period.id}`} className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors">
                               Detail
                             </Link>
                             <button onClick={() => setDuplicating(period)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent" title="Duplikasi">
                               <Copy size={16} />
                             </button>
                             <button onClick={() => startEdit(period)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent" title="Edit">
                               <Edit2 size={16} />
                             </button>
                             <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent disabled:opacity-30 disabled:hover:bg-transparent" title="Hapus">
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

             <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
               <span className="text-xs text-gray-500">
                 Menampilkan <strong>{periods.data.length}</strong> dari <strong>{periods.meta?.total || 0}</strong> baris
               </span>
               {periods.meta && <Pagination meta={periods.meta} />}
             </div>
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={cancelForm} maxWidth="3xl">
        <div className="bg-white rounded-lg shadow-sm font-sans border-b border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Periode KKN' : 'Tambah Periode Baru'}</h3>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-500"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">1. Parameter Dasar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect id="academic_year_id" label="Tahun Akademik" value={form.data.academic_year_id} onChange={(e) => form.setData('academic_year_id', e.target.value)} options={academicYears.map((y) => ({ value: String(y.id), label: y.year }))} required error={form.errors.academic_year_id} />
                <FormInput id="periode" label="Periode Ke-" type="number" value={form.data.periode} onChange={(e) => form.setData('periode', e.target.value)} placeholder="Misal: 1" required error={form.errors.periode} />
                <FormSelect id="jenis_kkn_id" label="Jenis Program KKN" value={form.data.jenis_kkn_id} onChange={(e) => form.setData('jenis_kkn_id', e.target.value)} options={programOptions?.types || []} required error={form.errors.jenis_kkn_id} />
                <FormInput id="kuota" label="Kapasitas Maksimal (Mhs)" type="number" value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} required error={form.errors.kuota} />
              </div>

              {form.data.program_type === 'tematik' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md mt-4">
                  <FormSelect id="program_subtype" label="Lokasi Strategis Tematik" value={form.data.program_subtype} onChange={(e) => form.setData('program_subtype', e.target.value)} options={programOptions?.subtypes || []} placeholder="Pilih Lokasi Wilayah Tematik" error={form.errors.program_subtype} />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">2. Penjadwalan & Transisi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect id="current_phase" label="Fase Aktif Transisi" value={form.data.current_phase} onChange={(e) => form.setData('current_phase', e.target.value)} options={[{ value: 'upcoming', label: 'Persiapan / Belum Dibuka' }, { value: 'registration', label: 'Pendaftaran Mahasiswa' }, { value: 'placement', label: 'Plotting Penempatan' }, { value: 'execution', label: 'Operasi Lapangan' }, { value: 'grading', label: 'Validasi Penilaian' }, { value: 'finished', label: 'Dikunci / Selesai' }]} required error={form.errors.current_phase} />
                
                <div className="flex flex-col space-y-1.5 mt-1">
                  <label className="text-sm font-medium text-gray-700">Status Publikasi</label>
                  <label className="flex items-center cursor-pointer p-2 bg-gray-50 border border-gray-200 rounded-md w-full gap-3 h-[42px]">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                      <div className={clsx("block w-10 h-6 rounded-full transition-colors", form.data.is_active ? "bg-emerald-500" : "bg-gray-300")}></div>
                      <div className={clsx("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", form.data.is_active ? "transform translate-x-4" : "")}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{form.data.is_active ? 'Terbit (Publik)' : 'Sembunyikan (Draft)'}</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-200 rounded-md mt-4">
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2 border-b border-gray-200 pb-2"><Activity size={14} /> Rentang Pendaftaran</h5>
                  <FormInput id="registration_start" label="Dibuka Tanggal" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required error={form.errors.registration_start} />
                  <FormInput id="registration_end" label="Ditutup Tanggal" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required error={form.errors.registration_end} />
                </div>
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2 border-b border-gray-200 pb-2"><Calendar size={14} /> Penerjunan Lapangan</h5>
                  <FormInput id="start_date" label="Tanggal Keberangkatan" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required error={form.errors.start_date} />
                  <FormInput id="end_date" label="Tanggal Penarikan" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required error={form.errors.end_date} />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 flex justify-end gap-3 border-t border-gray-200">
               <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Batal</button>
               <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2">
                 {form.processing && <RefreshCw size={16} className="animate-spin" />}
                 {editing ? 'Simpan Perubahan' : 'Buat Periode Target'}
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
        message={`Salin seluruh konfigurasi operasional dari "${duplicating?.name}" ke sesi baru?`}
        confirmLabel="Ya, Salin"
      />
      
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && router.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
        title="Hapus Periode"
        message={`Apakah Anda yakin ingin menghapus data periode "${deleting?.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Permanen"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
