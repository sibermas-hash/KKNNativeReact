import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Copy, Edit2, Plus, Search, Trash2, X, Clock, Activity, History, RefreshCw, Database, ShieldCheck, ChevronRight, Filter, Loader2
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
      <Head title="Manajemen Periode" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <Clock size={18} />
            <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Parameter Dasar Sistem</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                Manajemen <span className="text-emerald-500">Periode.</span>
              </h1>
              <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
                Pengaturan linimasa pendaftaran, jadwal pelaksanaan, dan fase operasional program KKN universitas.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-14 px-6 bg-white border-2 border-emerald-50 rounded-2xl flex items-center gap-4 shadow-sm">
                <Database size={20} className="text-emerald-500" />
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none mb-1.5">Total Siklus</span>
                   <span className="text-sm font-black text-emerald-950">{(periods.meta?.total || 0).toLocaleString()} DATA</span>
                </div>
              </div>
              <button
                onClick={() => { if (showForm) cancelForm(); else setShowForm(true); }}
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm tracking-widest uppercase"
              >
                {showForm ? <X size={18} /> : <Plus size={18} />}
                {showForm ? 'BATALKAN' : 'TAMBAH PERIODE'}
              </button>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS */}
        {aiInsights && (
          <div className="p-6 bg-emerald-600 rounded-[2rem] text-white relative overflow-hidden shadow-lg shadow-emerald-100 border border-emerald-500">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 -mr-10 -mt-10"><Activity size={150} /></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner"><Activity size={24} /></div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-2">Asisten Analitik AI</h4>
                <p className="text-sm font-bold leading-relaxed">{aiInsights}</p>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <section className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-5 bg-emerald-50/50 border-b-2 border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:flex-1">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
               <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-12 pl-12 pr-4 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300 uppercase tracking-widest"
                 placeholder="CARI NAMA PERIODE ATAU ID..."
               />
            </div>
            <div className="w-full md:w-80 group relative">
               <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
               <select
                 value={filterJenisId}
                 onChange={(e) => setFilterJenisId(e.target.value)}
                 className="w-full h-12 pl-12 pr-10 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm"
               >
                 <option value="">SEMUA JENIS KKN</option>
                 {jenisKkn.map((j) => (
                   <option key={j.id} value={String(j.id)}>{j.name.toUpperCase()}</option>
                 ))}
               </select>
               <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none rotate-90" size={16} />
            </div>
          </div>

          {/* LIST DATA */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-emerald-50">
              <thead className="bg-emerald-50/50 border-b-2 border-emerald-100 text-emerald-950">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest">Status / ID</th>
                  <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest">Identitas Periode KKN</th>
                  <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-center">Tipe Program</th>
                  <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-center">Fase Operasional</th>
                  <th scope="col" className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-emerald-50">
                {periods.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <History size={40} className="text-emerald-100 mb-2" strokeWidth={1.5} />
                        <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Riwayat Belum Tersedia</span>
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Tidak ada data periode ditemukan untuk pencarian ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  periods.data.map((period) => (
                    <tr key={period.id} className="group hover:bg-emerald-50/30 transition-all">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={clsx("h-2.5 w-2.5 rounded-full shadow-sm", period.is_active ? "bg-emerald-500 animate-pulse" : "bg-emerald-200")} />
                          <span className="text-[11px] font-bold text-emerald-600 font-mono tracking-wider">#{period.periode}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col max-w-sm">
                          <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors truncate" title={period.name}>{period.name}</span>
                          <span className="text-[10px] font-bold text-emerald-500 mt-1.5 uppercase tracking-widest">{period.academic_year?.year}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="inline-flex h-6 items-center px-3 bg-emerald-100/50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wide">{period.program_type_label || 'REGULER'}</span>
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none">{period.jenis || 'UMUM'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-950 tabular-nums uppercase">
                             <Clock size={14} className="text-emerald-500" />
                             <span>{formatDate(period.registration_start)} - {formatDate(period.registration_end)}</span>
                           </div>
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{period.current_phase.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <Link href={`/admin/periode/${period.id}`} className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95">
                            Detail
                          </Link>
                          <button onClick={() => setDuplicating(period)} className="h-8 w-8 bg-white border border-emerald-100 text-emerald-500 hover:bg-emerald-50 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90" title="Duplikasi">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => startEdit(period)} className="h-8 w-8 bg-white border border-emerald-100 text-emerald-500 hover:bg-emerald-50 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className="h-8 w-8 bg-white border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent" title="Hapus">
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

          <div className="px-8 py-5 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Halaman {periods.meta?.current_page || 1} dari {periods.meta?.total || 0} entri terdaftar
            </span>
            {periods.meta && <Pagination meta={periods.meta} />}
          </div>
        </section>

        {/* GOVERNANCE FOOTER */}
        <div className="bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 -mr-20 -mt-20"><ShieldCheck size={300} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-800 shadow-inner">
                        <RefreshCw size={40} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight uppercase">Integritas Siklus Operasional KKN</h2>
                        <p className="text-[12px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-2xl">
                           Manajemen periode adalah jantung kendali linimasa seluruh proses KKN. Perubahan status publikasi dan fase operasional berdampak langsung pada hak akses mahasiswa, DPL, serta integrasi sistem pusat universitas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={cancelForm} maxWidth="3xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl font-sans border border-emerald-50 overflow-hidden">
          <div className="px-10 py-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
            <div className="flex flex-col">
               <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">{editing ? 'Edit Periode Eksisting' : 'Inisiasi Periode Baru'}</h3>
               <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Parameter Operasi KKN</p>
            </div>
            <button onClick={cancelForm} className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 transition-all"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[80vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-emerald-50 pb-3">
                 <div className="h-6 w-6 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black italic">1</div>
                 <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-[0.2em]">Parameter Identitas</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect id="academic_year_id" label="TAHUN AKADEMIK" value={form.data.academic_year_id} onChange={(e) => form.setData('academic_year_id', e.target.value)} options={academicYears.map((y) => ({ value: String(y.id), label: y.year }))} required error={form.errors.academic_year_id} />
                <FormInput id="periode" label="URUTAN PERIODE" type="number" value={form.data.periode} onChange={(e) => form.setData('periode', e.target.value)} placeholder="01" required error={form.errors.periode} />
                <FormSelect id="jenis_kkn_id" label="SKEMA PROGRAM KKN" value={form.data.jenis_kkn_id} onChange={(e) => form.setData('jenis_kkn_id', e.target.value)} options={programOptions?.types || []} required error={form.errors.jenis_kkn_id} />
                <FormInput id="kuota" label="KAPASITAS MAHASISWA" type="number" value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} required error={form.errors.kuota} />
              </div>

              {form.data.program_type === 'tematik' && (
                <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl mt-4">
                  <FormSelect id="program_subtype" label="WILAYAH TEMATIK STRATEGIS" value={form.data.program_subtype} onChange={(e) => form.setData('program_subtype', e.target.value)} options={programOptions?.subtypes || []} placeholder="PILIH WILAYAH" error={form.errors.program_subtype} />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-emerald-50 pb-3">
                 <div className="h-6 w-6 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black italic">2</div>
                 <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-[0.2em]">Penjadwalan & Transisi</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect id="current_phase" label="FASE OPERASI AKTIF" value={form.data.current_phase} onChange={(e) => form.setData('current_phase', e.target.value)} options={[{ value: 'upcoming', label: 'PRE-PENDAFTARAN' }, { value: 'registration', label: 'PENDAFTARAN MAHASISWA' }, { value: 'placement', label: 'PENEMPATAN (PLOTTING)' }, { value: 'execution', label: 'OPERASI LAPANGAN' }, { value: 'grading', label: 'VALIDASI PENILAIAN' }, { value: 'finished', label: 'ARSIP / SELESAI' }]} required error={form.errors.current_phase} />
                
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">STATUS PUBLIKASI SISTEM</label>
                  <label className="flex items-center cursor-pointer px-5 py-3.5 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl w-full gap-4 h-[50px] transition-all hover:bg-emerald-50">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                      <div className={clsx("block w-11 h-6 rounded-full transition-all", form.data.is_active ? "bg-emerald-600 shadow-md shadow-emerald-100" : "bg-emerald-200")}></div>
                      <div className={clsx("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300", form.data.is_active ? "transform translate-x-5" : "")}></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-950 uppercase">{form.data.is_active ? 'TERBITKAN KE PUBLIK' : 'SIMPAN SEBAGAI DRAFT'}</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-emerald-50/20 border-2 border-emerald-50 rounded-[2rem] mt-4">
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.15em] flex items-center gap-3 border-b border-emerald-100 pb-3"><Activity size={16} className="text-emerald-500" /> GERBANG PENDAFTARAN</h5>
                  <FormInput id="registration_start" label="DIBUKA PADA" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required error={form.errors.registration_start} />
                  <FormInput id="registration_end" label="DITUTUP PADA" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required error={form.errors.registration_end} />
                </div>
                <div className="space-y-6 border-l-2 border-emerald-50/50 pl-8">
                  <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.15em] flex items-center gap-3 border-b border-emerald-100 pb-3"><Calendar size={16} className="text-emerald-500" /> OPERASI LAPANGAN</h5>
                  <FormInput id="start_date" label="TANGGAL PENERJUNAN" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required error={form.errors.start_date} />
                  <FormInput id="end_date" label="TANGGAL PENARIKAN" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required error={form.errors.end_date} />
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-3 border-t-2 border-emerald-50 uppercase tracking-widest">
               <button type="button" onClick={cancelForm} className="px-8 py-4 text-[10px] font-bold text-emerald-700 bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all">BATAL</button>
               <button type="submit" disabled={form.processing} className="px-8 py-4 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95">
                 {form.processing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                 {editing ? 'SIMPAN PERUBAHAN' : 'BUAT SIKLUS PERIODE'}
               </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!duplicating}
        onClose={() => setDuplicating(null)}
        onConfirm={() => duplicating && router.post(`/admin/periode/${duplicating.id}/duplikasi`, {}, { onSuccess: () => setDuplicating(null) })}
        title="DUPLIKASI SIKLUS OPERASIONAL"
        message={`Apakah Anda yakin ingin menggandakan seluruh konfigurasi operasional dari "${duplicating?.name}" ke dalam sesi baru?`}
        confirmLabel="YA, SALIN DATA"
      />
      
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && router.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
        title="HAPUS PERIODE PERMANEN"
        message={`Apakah Anda yakin ingin melenyapkan data periode "${deleting?.name}"? Tindakan ini akan menghapus seluruh data terkait secara permanen.`}
        confirmLabel="HAPUS PERMANEN"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
