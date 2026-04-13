import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { 
    Calendar, 
    CheckCircle2, 
    Copy, 
    Edit2, 
    Plus, 
    Search, 
    Trash2, 
    X, 
    Database, 
    Power,
    PowerOff,
    RefreshCw,
    Clock,
    Target,
    Layers,
    Info,
    Binary,
    Activity,
    History,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import { Deferred } from '@inertiajs/react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import FormInput from '@/Components/ui/FormInput';
import FormSelect from '@/Components/ui/FormSelect';
import Pagination from '@/Components/ui/Pagination';
import Button from '@/Components/ui/Button';
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
  periods: {
    data: PeriodData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  academicYears: AcademicYearOption[];
  jenisKkn: Array<{ id: number; name: string; code: string }>;
  programOptions: {
    types: ProgramOption[];
    subtypes: ProgramOption[];
  };
  filters: {
    search?: string;
    jenis_kkn_id?: string;
  };
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
  aiInsights = ""
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

  // Filter Sync
  useEffect(() => {
    const timer = window.setTimeout(() => { 
        router.get('/admin/periode', 
            { search, jenis_kkn_id: filterJenisId }, 
            { preserveState: true, replace: true }
        ); 
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search, filterJenisId]);

  useEffect(() => {
    const updates: Record<string, unknown> = {};
    if (!form.data.academic_year_id && academicYears?.length > 0) updates.academic_year_id = String(academicYears[0].id);
    
    const programLabel = (form.data.program_type === 'tematik' ? programOptions?.subtypes?.find(s => s.value === form.data.program_subtype)?.label : null) || selectedJenisKkn?.label || '';
    const generatedName = form.data.periode && programLabel ? `Periode ${form.data.periode} - ${programLabel}` : '';
    if (generatedName && generatedName !== form.data.name) updates.name = generatedName;
    
    if (Object.keys(updates).length > 0) form.setData({ ...form.data, ...updates } as typeof form.data);
  }, [form.data.periode, form.data.program_subtype, form.data.program_type, form.data.academic_year_id, selectedJenisKkn]);

  const cancelForm = () => { setEditing(null); setShowForm(false); form.reset(); form.clearErrors(); };
  
  const startEdit = (period: PeriodData) => {
    setEditing(period); setShowForm(true); form.clearErrors();
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
    if (editing) { form.put(`/admin/periode/${editing.id}`, { onSuccess: () => cancelForm() }); return; }
    form.post('/admin/periode', { onSuccess: () => cancelForm() });
  };

  return (
    <AppLayout>
      <Head title="Periode Program" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Administrasi Data Master</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Periode <span className="text-emerald-500">Program.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Konfigurasi Penjadwalan Operasional dan Tahapan Pelaksanaan KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Clock size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Sesi</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{periods.meta?.total || 0} OPERASIONAL</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { if(showForm) cancelForm(); else setShowForm(true); }}
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        {showForm ? 'BATAL' : 'TAMBAH PERIODE'}
                    </button>
                </div>
            </div>
        </div>
        
        {/* --- AI INSIGHTS --- */}
        <Deferred data="aiInsights" fallback={
            <div className="p-8 bg-white border border-slate-200 rounded-[2rem] animate-pulse flex items-center gap-6 shadow-sm">
                <div className="h-12 w-12 bg-slate-100 rounded-2xl" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
                    <div className="h-4 w-full bg-slate-100 rounded-full" />
                </div>
            </div>
        }>
            {aiInsights && (
                <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-700">
                        <Activity size={120} className="text-emerald-500" />
                    </div>
                    <div className="flex items-start gap-8 relative z-10">
                        <div className="h-14 w-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                            <Activity size={28} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Strategi AI Operasional</h4>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                            <p className="text-slate-800 text-sm font-medium italic leading-relaxed">
                                "{aiInsights}"
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={10} className="text-emerald-500" />
                                <span>Analisis Otonom oleh Laravel AI SDK &middot; Cycle 2026/2027</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Deferred>

        <Modal 
            show={showForm} 
            onClose={cancelForm}
            maxWidth="4xl"
        >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-10 py-8 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                             <Calendar size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-black">{editing ? 'Edit Periode' : 'Tambah Periode Baru'}</h3>
                            <p className="text-sm text-emerald-600 font-medium mt-1">Konfigurasi Pengaturan Sesi Pendaftaran KKN</p>
                        </div>
                    </div>
                    <button onClick={cancelForm} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-emerald-100 text-emerald-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* --- BAGIAN 1: IDENTITAS & SKEMA --- */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                             <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                             Informasi Dasar & Target
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-3">
                                <FormSelect id="academic_year_id" label="Tahun Akademik" value={form.data.academic_year_id} onChange={(e) => form.setData('academic_year_id', e.target.value)} options={academicYears.map(y => ({ value: String(y.id), label: y.year }))} required error={form.errors.academic_year_id} />
                            </div>
                            <div className="md:col-span-2">
                                <FormInput id="periode" label="Periode Ke" type="number" value={form.data.periode} onChange={(e) => form.setData('periode', e.target.value)} placeholder="00" required error={form.errors.periode} />
                            </div>
                            <div className="md:col-span-4">
                                <FormSelect id="jenis_kkn_id" label="Jenis KKN" value={form.data.jenis_kkn_id} onChange={(e) => form.setData('jenis_kkn_id', e.target.value)} options={programOptions?.types || []} required error={form.errors.jenis_kkn_id} />
                            </div>
                            <div className="md:col-span-3">
                                <FormInput id="kuota" label="Kuota (Mahasiswa)" type="number" value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} required error={form.errors.kuota} />
                            </div>
                        </div>

                        {form.data.program_type === 'tematik' && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                <FormSelect id="program_subtype" label="Pilih Lokasi Tematik (Sub-Jenis)" value={form.data.program_subtype} onChange={(e) => form.setData('program_subtype', e.target.value)} options={programOptions?.subtypes || []} placeholder="— Pilih Lokasi Tematik —" error={form.errors.program_subtype} />
                            </motion.div>
                        )}
                    </div>

                    {/* --- BAGIAN 2: PENJADWALAN & TAHAPAN --- */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                             <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                             Tahapan Sistem & Penjadwalan
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormSelect id="current_phase" label="Tahapan Berjalan" value={form.data.current_phase} onChange={(e) => form.setData('current_phase', e.target.value)} options={[{ value: 'upcoming', label: 'Persiapan / Belum Dibuka' }, { value: 'registration', label: 'Pendaftaran Peserta' }, { value: 'placement', label: 'Plotting Kelompok' }, { value: 'execution', label: 'Kegiatan Lapangan' }, { value: 'grading', label: 'Massa Penilaian' }, { value: 'finished', label: 'Selesai' }]} required error={form.errors.current_phase} />
                             
                             <div 
                                className="flex items-center gap-4 cursor-pointer px-6 border border-slate-200 rounded-2xl bg-white hover:border-emerald-500 transition-all shadow-sm" 
                                onClick={() => form.setData('is_active', !form.data.is_active)}
                             >
                                <div className={clsx("w-12 h-6 rounded-full p-1 transition-all duration-300 flex", form.data.is_active ? 'bg-emerald-500 flex-row-reverse' : 'bg-slate-200')}>
                                    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Status</span>
                                    <span className={clsx("text-xs font-bold leading-none mt-1", form.data.is_active ? 'text-emerald-600' : 'text-slate-400')}>{form.data.is_active ? 'TERBIT (LIVE)' : 'DRAFT'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="space-y-4">
                                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                     <Clock size={12} /> Masa Pendaftaran
                                </h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput id="registration_start" label="Mulai" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required error={form.errors.registration_start} />
                                    <FormInput id="registration_end" label="Selesai" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required error={form.errors.registration_end} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                     <Activity size={12} /> Masa Pelaksanaan
                                </h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput id="start_date" label="Penerjunan" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required error={form.errors.start_date} />
                                    <FormInput id="end_date" label="Penarikan" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required error={form.errors.end_date} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={form.processing} 
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {form.processing ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            {editing ? 'Simpan Perubahan' : 'Terbitkan Periode'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>

        {/* --- COMMAND FILTER BAR --- */}
        <Deferred data="jenisKkn" fallback={
            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 animate-pulse h-22 flex gap-4">
                <div className="flex-1 bg-slate-50 rounded-2xl" />
                <div className="w-80 bg-slate-50 rounded-2xl" />
            </div>
        }>
            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm shadow-slate-200/50 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="CARI PERIODE / KODE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase placeholder:text-slate-300"
                    />
                </div>
                <div className="h-10 w-px bg-slate-100 hidden md:block" />
                <div className="relative w-full md:w-80 group">
                    <Layers className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <select 
                        value={filterJenisId} 
                        onChange={(e) => setFilterJenisId(e.target.value)}
                        className="w-full h-14 pl-14 pr-12 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-widest cursor-pointer"
                    >
                        <option value="">SEMUA JENIS KKN</option>
                        {jenisKkn.map(j => <option key={j.id} value={String(j.id)}>{j.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 rotate-90 pointer-events-none" />
                </div>
            </div>
        </Deferred>

        {/* --- LIST TABLE --- */}
        <Deferred data="periods" fallback={
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 space-y-6">
                <div className="h-4 w-1/4 bg-slate-100 rounded-full animate-pulse" />
                <div className="space-y-4">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
                <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <Binary size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daftar Sesi Operasional</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Penjadwalan dan Kontrol Tahapan</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-50">
                            <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <th className="px-10 py-6">Status & Sesi</th>
                                <th className="px-10 py-6">Identitas Periode</th>
                                <th className="px-10 py-6">Konfigurasi Program</th>
                                <th className="px-10 py-6">Masa Pendaftaran</th>
                                <th className="px-10 py-6 text-right">Kelola</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {periods.data.length > 0 ? periods.data.map((period) => (
                                <tr key={period.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-3">
                                            <div className={clsx(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border shadow-sm",
                                                period.is_active ? "bg-emerald-500 border-emerald-400 text-white" : "bg-slate-100 border-slate-200 text-slate-400"
                                            )}>
                                                {period.is_active ? 'LIVE' : 'DRAFT'}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] tabular-nums">#{period.periode}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-tight">{period.name}</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{period.academic_year?.year}</span>
                                                <span className="text-[10px] text-slate-300 font-bold">&middot;</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">ID SYSTEM_{period.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-2">
                                            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg tracking-wider inline-block">
                                                {period.program_type_label || 'REGULER'}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{period.jenis || 'UMUM'}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={12} className="opacity-50" />
                                                <span className="text-[11px] font-bold text-slate-700 tabular-nums">{formatDate(period.registration_start)} &mdash; {formatDate(period.registration_end)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Tahapan: {period.current_phase}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 outline-none opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                href={`/admin/periode/${period.id}`} 
                                                className="h-11 px-6 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center shadow-sm active:scale-95" 
                                            >
                                                Detail
                                            </Link>
                                            <button onClick={() => setDuplicating(period)} className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center justify-center shadow-sm active:scale-95">
                                                <Copy size={18} />
                                            </button>
                                            <button onClick={() => startEdit(period)} className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center justify-center shadow-sm active:scale-95">
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleting(period)} 
                                                disabled={!period.can_delete} 
                                                className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center disabled:opacity-10 shadow-sm active:scale-95" 
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 text-slate-200">
                                            <History size={64} strokeWidth={1} />
                                            <p className="text-xs font-black uppercase tracking-[0.4em] leading-none">Database Periode Kosong</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Menampilkan {periods.data.length} &middot; Total {periods.meta?.total || 0} Entitas Operasional</span>
                    {periods.meta && <Pagination meta={periods.meta} />}
                </div>
            </div>
        </Deferred>

        {/* --- INFO CARD --- */}
        <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><RefreshCw size={350} className="opacity-10" /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex items-center gap-10">
                    <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">Integritas Operasional</h4>
                        <p className="text-sm font-medium text-emerald-50 max-w-3xl leading-relaxed">
                            Pengaturan periode mengontrol seluruh aliran pendaftaran dan pelaksanaan KKN. Pastikan parameter tanggal dan kuota telah diverifikasi untuk menjamin stabilitas sistem selama masa operasional berlangsung.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <ConfirmDialog open={!!duplicating} onClose={() => setDuplicating(null)} onConfirm={() => duplicating && router.post(`/admin/periode/${duplicating.id}/duplikasi`, {}, { onSuccess: () => setDuplicating(null) })} title="Konfirmasi Duplikasi" message={`Salin seluruh pengaturan dari "${duplicating?.name}" ke sesi baru?`} confirmLabel="Ya, Salin" />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && router.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })} title="Hapus Periode" message={`Hapus permanent "${deleting?.name}"? Data yang sudah terkait mungkin akan berpengaruh.`} confirmLabel="Hapus Sekarang" confirmVariant="danger" />
    </AppLayout>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
