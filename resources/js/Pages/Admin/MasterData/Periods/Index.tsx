import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { 
    Calendar, 
    CheckCircle2, 
    Copy, 
    Download, 
    Edit2, 
    Plus, 
    Search, 
    Trash2, 
    X, 
    Info, 
    Gauge,
    Layers,
    Activity,
    Database,
    Binary,
    ShieldCheck,
    Zap,
    Cpu,
    Fingerprint,
    ArrowRight,
    Target,
    Settings,
    ChevronRight,
    ArrowLeft,
    Power,
    PowerOff,
    RefreshCw,
    Clock,
    Lock,
    Unlock,
    Archive,
    FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination, Button } from '@/Components/ui';
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
  description?: string | null;
  program_type?: string | null;
  program_subtype?: string | null;
  registration_mode_label?: string;
  placement_mode_label?: string;
}

interface PeriodData {
  id: number;
  jenis_kkn_id?: number | null;
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
  current_phase: string;
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

const phaseLabel = (phase: string) => {
    const p = phase.toLowerCase();
    if (p === 'upcoming') return 'PREPARATION';
    if (p === 'registration') return 'REGISTRATION';
    if (p === 'placement') return 'PLOTTING';
    if (p === 'execution') return 'FIELD WORK';
    if (p === 'grading') return 'EVALUATION';
    if (p === 'finished') return 'ARCHIVED/FIN';
    return p.toUpperCase();
};

export default function PeriodsIndex({ periods, academicYears, programOptions, filters }: Props) {
  const [editing, setEditing] = useState<PeriodData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<PeriodData | null>(null);
  const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const form = useForm(initialFormData);
  const deleteForm = useForm({});
  const duplicateForm = useForm({});

  const selectedJenisKkn = useMemo(
    () => programOptions.types.find((option) => option.value === form.data.jenis_kkn_id) ?? null,
    [form.data.jenis_kkn_id, programOptions.types],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => { if (search !== (filters.search || '')) router.get('/admin/periode', { search }, { preserveState: true, replace: true }); }, 300);
    return () => window.clearTimeout(timer);
  }, [search, filters.search]);

  useEffect(() => {
    const updates: Record<string, unknown> = {};
    if (!form.data.academic_year_id && academicYears.length > 0) updates.academic_year_id = String(academicYears[0].id);
    const canonicalProgramType = selectedJenisKkn?.program_type ?? form.data.program_type;
    const canonicalProgramSubtype = selectedJenisKkn?.program_subtype ?? form.data.program_subtype;
    if (canonicalProgramType && canonicalProgramType !== form.data.program_type) updates.program_type = canonicalProgramType;
    if (canonicalProgramType !== 'tematik' && form.data.program_subtype) updates.program_subtype = '';
    if (canonicalProgramType === 'tematik' && canonicalProgramSubtype && form.data.program_subtype !== canonicalProgramSubtype) updates.program_subtype = canonicalProgramSubtype;
    const programLabel = (canonicalProgramType === 'tematik' ? programOptions.subtypes.find(s => s.value === (updates.program_subtype ?? form.data.program_subtype))?.label : null) || selectedJenisKkn?.label || '';
    const jenisValue = selectedJenisKkn?.code || programLabel;
    if (jenisValue && form.data.jenis !== jenisValue) updates.jenis = jenisValue;
    const generatedName = form.data.periode && programLabel ? `Periode ${form.data.periode} - ${programLabel}` : '';
    if (generatedName && generatedName !== form.data.name) updates.name = generatedName;
    if (Object.keys(updates).length > 0) form.setData({ ...form.data, ...updates } as typeof form.data);
  }, [form.data.periode, form.data.program_subtype, form.data.program_type, form.data.academic_year_id, selectedJenisKkn, academicYears, programOptions.subtypes]);

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
    <AppLayout title="Academic Session Control">
      <Head title="Manajemen Periode | SIKKKN" />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
      >
        {/* --- COMMAND HEADER --- */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Academic Session Governance</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                    Session <span>Protocol.</span>
                </h1>
                <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                    Konfigurasi pilar operasional KKN. <br />
                    <span className="text-slate-900 not-italic">Penetapan parameter temporal, pembatasan kuota, dan aktivasi skema pengabdian fungsional institusi.</span>
                </p>
            </div>

            <div className="flex flex-col items-end gap-5 shrink-0">
                 <Button
                    onClick={() => { if(showForm) cancelForm(); else setShowForm(true); }}
                    className={clsx(
                        "h-20 px-10 rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group font-black",
                        showForm ? "bg-white border border-slate-100 text-slate-400 hover:text-rose-500" : "bg-slate-900 text-white hover:bg-emerald-600"
                    )}
                >
                    {showForm ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />}
                    {showForm ? 'Abort Protocol' : 'Initialize Session'}
                </Button>
            </div>
        </motion.div>

        {/* --- TELEMETRY BENTO MATRIX --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <MetricCard label="Session Density" value={`${periods.meta?.total || 0} VECTORS`} icon={Database} color="emerald" desc="Registered sessions in vault" />
            <MetricCard label="Active Broadcasters" value={`${periods.data.filter(p => p.is_active).length} NODES`} icon={Zap} color="emerald" desc="Operating synchronized periods" />
            <MetricCard label="System Integrity" value="VERIFIED" icon={ShieldCheck} color="emerald" desc="Operational hash authenticated" />
            <MetricCard label="Execution Phase" value="GOVERNANCE" icon={Cpu} color="emerald" desc="Global policy logic active" />
        </motion.div>

        <AnimatePresence mode="wait">
            {showForm && (
                <motion.section 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white border-2 border-emerald-500 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-emerald-500/10 mb-16"
                >
                    <div className="px-12 py-10 bg-slate-950 flex items-center justify-between">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Settings size={28} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Hardware logic</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{editing ? `Recalibrate Session: ${editing.periode}` : 'Initialize New Session Vector'}</p>
                              </div>
                         </div>
                         <div className="h-12 w-px bg-white/10" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-12 space-y-12">
                        <div className="grid gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-3">
                                <FormSelect id="academic_year_id" label="TIMELINE VECTOR" value={form.data.academic_year_id} onChange={(e) => form.setData('academic_year_id', e.target.value)} options={academicYears.map(y => ({ value: String(y.id), label: y.year }))} required error={form.errors.academic_year_id} className="h-16 px-6 font-black tracking-widest bg-slate-50 border-none rounded-2xl" />
                            </div>
                            <div className="lg:col-span-2">
                                <FormInput id="periode" label="SEQ. ID" type="number" value={form.data.periode} onChange={(e) => form.setData('periode', e.target.value)} placeholder="00" required error={form.errors.periode} className="h-16 px-6 font-black tracking-widest bg-slate-50 border-none rounded-2xl" />
                            </div>
                            <div className="lg:col-span-4">
                                <FormSelect id="jenis_kkn_id" label="SCHEMA TEMPLATE" value={form.data.jenis_kkn_id} onChange={(e) => form.setData('jenis_kkn_id', e.target.value)} options={programOptions.types} required error={form.errors.jenis_kkn_id} className="h-16 px-6 font-black tracking-widest bg-slate-50 border-none rounded-2xl" />
                            </div>
                            <div className="lg:col-span-3">
                                <FormInput id="kuota" label="OP_CAPACITY" type="number" value={form.data.kuota} onChange={(e) => form.setData('kuota', e.target.value)} required error={form.errors.kuota} className="h-16 px-6 font-black tracking-widest bg-slate-50 border-none rounded-2xl" />
                            </div>
                        </div>

                        {form.data.program_type === 'tematik' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-10 bg-emerald-50 border-2 border-emerald-100 rounded-3xl space-y-4">
                                <div className="flex items-center gap-4 text-emerald-600 mb-2">
                                     <Layers size={18} />
                                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sub-sector selection active</span>
                                </div>
                                <FormSelect id="program_subtype" label="SECTOR SPECIALIZATION" value={form.data.program_subtype} onChange={(e) => form.setData('program_subtype', e.target.value)} options={programOptions.subtypes} placeholder="SUB_SECTOR_DEFAULT" error={form.errors.program_subtype} className="h-16 px-6 font-black tracking-widest bg-white border-2 border-emerald-200 rounded-2xl" />
                            </motion.div>
                        )}

                        <div className="grid gap-10 lg:grid-cols-2">
                            <FormInput id="name" label="PUBLIC IDENTIFIER (DERIVED)" value={form.data.name} readOnly error={form.errors.name} className="h-16 px-6 font-black tracking-widest bg-slate-100 border-none rounded-2xl text-slate-400 italic" />
                            <FormSelect id="current_phase" label="CORE SYSTEM PHASE" value={form.data.current_phase} onChange={(e) => form.setData('current_phase', e.target.value)} options={[{ value: 'upcoming', label: 'PREPARATION' }, { value: 'registration', label: 'REGISTRATION' }, { value: 'placement', label: 'PLOTTING' }, { value: 'execution', label: 'FIELD_OPS' }, { value: 'grading', label: 'EVALUATION' }, { value: 'finished', label: 'ARCHIVED' }]} required error={form.errors.current_phase} className="h-16 px-6 font-black tracking-widest bg-slate-50 border-none rounded-2xl" />
                        </div>

                        <div className="grid gap-10 lg:grid-cols-2 pt-8 border-t border-slate-50">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-slate-300">
                                     <Clock size={16} />
                                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Inbound Buffer (Registration)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormInput id="registration_start" label="TRIGGER DATE" type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required error={form.errors.registration_start} className="h-16 px-6 font-black bg-slate-50 border-none rounded-2xl" />
                                    <FormInput id="registration_end" label="HALT DATE" type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required error={form.errors.registration_end} className="h-16 px-6 font-black bg-slate-50 border-none rounded-2xl" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-emerald-600">
                                     <Activity size={16} />
                                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Operational Loop (Execution)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormInput id="start_date" label="DEPLOYMENT" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required error={form.errors.start_date} className="h-16 px-6 font-black bg-slate-50 border-none rounded-2xl" />
                                    <FormInput id="end_date" label="WITHDRAWAL" type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required error={form.errors.end_date} className="h-16 px-6 font-black bg-slate-50 border-none rounded-2xl" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center justify-between pt-12 border-t border-slate-50 gap-10">
                            <div 
                                className="flex items-center gap-6 group cursor-pointer bg-slate-50 px-10 py-5 rounded-3xl border border-slate-100 hover:border-emerald-500 transition-all" 
                                onClick={() => form.setData('is_active', !form.data.is_active)}
                            >
                                <div className={clsx("w-14 h-8 rounded-full p-1.5 transition-all flex", form.data.is_active ? 'bg-emerald-600 items-end flex-row-reverse' : 'bg-slate-300 items-start')}>
                                    <div className="w-5 h-5 bg-white rounded-full shadow-lg" />
                                </div>
                                <div className="flex flex-col">
                                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1">Live Broadcast</span>
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest uppercase italic">Transmit to public dashboard?</span>
                                </div>
                            </div>
                            <div className="flex gap-6 w-full lg:w-auto">
                                <Button 
                                    type="submit" 
                                    disabled={form.processing} 
                                    className="h-20 px-16 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center gap-4 flex-1 lg:flex-none"
                                >
                                    {form.processing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                                    {form.processing ? 'SYNCHRONIZING...' : 'COMMIT SESSION VECTOR'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </motion.section>
            )}
        </AnimatePresence>

        {/* --- SESSION CATALOGUE GRID --- */}
        <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="px-12 py-10 bg-white border-b border-white flex flex-col md:flex-row md:items-center justify-between gap-10">
                 <div className="flex items-center gap-8">
                      <div className="h-16 w-16 bg-slate-950 text-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl">
                           <Layers size={28} />
                      </div>
                      <div className="space-y-1">
                           <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Inventory loop</h3>
                           <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Global Session Repository</p>
                      </div>
                 </div>
                 <div className="relative w-full md:w-96 group">
                      <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="FILTER BY SESSION / VECTOR ID..." 
                        className="w-full h-16 pl-20 pr-8 bg-slate-50 border-none rounded-2xl text-[11px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-200 uppercase tracking-widest" 
                      />
                 </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                            <th className="px-12 py-8">Session Node</th>
                            <th className="px-12 py-8">Schema / Protocol</th>
                            <th className="px-12 py-8 text-center">Temporal Vector</th>
                            <th className="px-12 py-8 text-center">Status</th>
                            <th className="px-12 py-8 text-right">Kernel Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {periods.data.length > 0 ? periods.data.map((period) => (
                            <tr key={period.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                <td className="px-12 py-8">
                                    <div className="flex items-center gap-10">
                                        <div className="w-20 h-20 bg-white border-2 border-slate-50 text-slate-200 flex flex-col items-center justify-center font-black rounded-3xl group-hover:bg-slate-950 group-hover:text-emerald-500 group-hover:border-slate-950 transition-all shadow-sm italic leading-none">
                                            <span className="text-[10px] opacity-30 mb-1 font-mono">SEQ</span>
                                            <span className="text-2xl tracking-tighter">#{period.periode}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-emerald-700 transition-colors leading-none uppercase">{period.name}</span>
                                            <div className="flex items-center gap-4">
                                                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest italic">{period.academic_year?.year || 'UNDEFINED'}</span>
                                                 <div className="flex items-center gap-2">
                                                      <Target size={12} className="text-slate-200" />
                                                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {period.id}</span>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8">
                                    <div className="flex flex-col gap-3">
                                        <div className="inline-flex h-10 items-center px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] italic shadow-xl shadow-slate-200 group-hover:bg-emerald-600 transition-colors truncate max-w-[200px]">
                                            {period.program_type_label || period.jenis}
                                        </div>
                                        <div className="flex items-center gap-3 ml-1">
                                             <Fingerprint size={12} className="text-slate-300" />
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{period.registration_mode_label}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8">
                                    <div className="flex flex-col gap-5 items-center">
                                        <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl group-hover:bg-white transition-all shadow-sm">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Inbound</span>
                                                <span className="text-[10px] font-black text-slate-600 font-mono tracking-tighter leading-none">{formatDate(period.registration_start)} - {formatDate(period.registration_end)}</span>
                                            </div>
                                            <div className="h-6 w-px bg-slate-200" />
                                            <div className="flex flex-col items-start font-sans">
                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Active Ops</span>
                                                <span className="text-[10px] font-black text-emerald-600 font-mono tracking-tighter leading-none uppercase">{formatDate(period.start_date)} - {formatDate(period.end_date)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                             <Clock size={12} className="text-slate-300" />
                                             <span className="text-[9px] font-black text-slate-300 uppercase underline decoration-emerald-500/30 underline-offset-4 tracking-widest">{period.duration_days} Days Mission</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        {period.is_active ? 
                                            <span className="bg-emerald-600 text-white h-8 px-6 flex items-center justify-center rounded-2xl font-black text-[9px] tracking-[0.2em] shadow-2xl shadow-emerald-500/20 italic">LIVE</span> :
                                            <span className="bg-slate-100 text-slate-300 h-8 px-6 flex items-center justify-center rounded-2xl font-black text-[9px] tracking-[0.2em] border border-slate-200 italic">OFF</span>
                                        }
                                        <div className="px-4 py-1.5 bg-slate-900 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-[0.25em] shadow-xl italic rotate-[-2deg] group-hover:rotate-0 transition-transform">
                                            {phaseLabel(period.current_phase)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                      <button onClick={() => setDuplicating(period)} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center active:scale-95" title="Clone Session"><Copy size={16} strokeWidth={2.5}/></button>
                                      <button onClick={() => startEdit(period)} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center active:scale-95" title="Recalibrate Vector"><Edit2 size={16} strokeWidth={2.5} /></button>
                                      <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-100 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" title={period.delete_blocker || "Purge Session"}><Trash2 size={16} strokeWidth={2.5}/></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-12 py-40 text-center">
                                    <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                        <Archive size={100} strokeWidth={1} />
                                        <div className="space-y-2">
                                            <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Global Archive Null</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO OPERATIONAL SESSIONS DETECTED IN STORAGE PIPELINE.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-5">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hall HAL. {periods.meta.current_page} / {periods.meta.last_page} Vector Inventory</span>
                </div>
                <Pagination meta={periods.meta} />
            </div>
        </motion.section>

        {/* --- FOOTER GOVERNANCE --- */}
        <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
            <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                 <ShieldCheck size={300} strokeWidth={1} />
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                <div className="space-y-6 flex-1">
                     <div className="flex items-center gap-5">
                          <Binary className="text-emerald-500" size={32} />
                          <div className="space-y-1">
                               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Registry Controller</span>
                               <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Immutable Session Governance</h3>
                          </div>
                     </div>
                     <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                        Katalog periode adalah pilar temporal seluruh ekosistem KKN. Setiap sesi mendefinisikan batasan pendaftaran, plotting lokasi, dan verifikasi nilai akhir secara atomik.
                     </p>
                </div>
                <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                     <Clock size={28} className="text-emerald-500" />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Synchronized Time Buffer</span>
                </div>
            </div>
        </motion.div>
      </motion.div>

      <ConfirmDialog open={!!duplicating} onClose={() => setDuplicating(null)} onConfirm={() => duplicating && duplicateForm.post(`/admin/periode/${duplicating.id}/duplikasi`, { onSuccess: () => setDuplicating(null) })} title="DUPLICATE VECTOR" message={`Ganti duplikasi periode "${duplicating?.name}"? Template kelompok akan ikut disalin.`} confirmLabel="EXECUTE CLONE" />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && deleteForm.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })} title="PURGE VECTOR" message={`Hapus permanen "${deleting?.name}"? Seluruh data pendaftaran terkait akan ikut terhapus.`} confirmLabel="EXECUTE PURGE" confirmVariant="primary" />
    </AppLayout>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
