import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  AlertTriangle,
  FileSpreadsheet,
  MapPinned,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Activity,
  Target,
  Briefcase,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  X,
  Info
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { LucideIcon } from '@/types';

interface DosenOption {
  id: number;
  nama: string;
  nip: string;
  is_qualified?: boolean;
  qualification_reason?: string;
}

interface PeriodOption {
  id: number;
  name: string;
  periode?: number | null;
}

interface AssignmentRow {
  id: number;
  max_groups: number;
  current_groups: number;
  remaining_slots: number;
  is_active: boolean;
  dosen: DosenOption;
  period: PeriodOption;
}

interface GroupRow {
  id: number;
  name: string;
  code: string;
  status: string;
  dpl_period_id: number | null;
  period: PeriodOption;
  location?: {
    village_name?: string | null;
    district_name?: string | null;
    regency_name?: string | null;
  } | null;
  dpl?: {
    nama: string;
    nip: string;
  } | null;
}

interface DistrictOption {
  id: string;
  name: string;
}

interface DistrictCoordinatorRow {
  id: number;
  district_name?: string;
  regency_name?: string | null;
  dosen?: {
    nama: string;
    nip?: string;
  };
  period?: PeriodOption;
}

interface Summary {
  active_assignments: number;
  groups_total: number;
  groups_without_dpl: number;
  active_groups_without_dpl: number;
  district_coordinators: number;
}

interface Props {
  allDosen: DosenOption[];
  allPeriods: PeriodOption[];
  groups: GroupRow[];
  districts: DistrictOption[];
  assignments: AssignmentRow[];
  districtCoordinators?: DistrictCoordinatorRow[];
  summary?: Summary;
  assignments_pagination?: Record<string, any>;
  groups_pagination?: Record<string, any>;
  coordinators_pagination?: Record<string, any>;
  filters?: Record<string, any>;
}

export default function Assignment({
  allDosen = [],
  allPeriods = [],
  groups = [],
  districts = [],
  assignments = [],
  districtCoordinators = [],
  summary,
  assignments_pagination,
  groups_pagination,
  coordinators_pagination,
  filters,
}: Props) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'groups' | 'regions'>('assignments');
  const [activeFormMode, setActiveFormMode] = useState<'default' | 'import'>('default');
  const [search, setSearch] = useState(filters?.search ?? '');
  const [deletingId, setDeletingId] = useState<{ type: 'period' | 'region'; id: number } | null>(null);

  const periodForm = useForm({ dosen_id: '', period_id: '', max_groups: 10 });
  const groupForm = useForm({ group_id: '', dpl_period_id: '' });
  const coordForm = useForm({ district_id: '', dpl_period_id: '' });
  const importForm = useForm({ file: null as File | null });

  const handleApplyFilters = () => {
    router.get(
      route('admin.dpl.penugasan'),
      { search: search || undefined },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const selectedGroup = useMemo(
    () => (groups || []).find((g) => String(g.id) === groupForm.data.group_id),
    [groupForm.data.group_id, groups]
  );

  const availableAssignments = useMemo(() => {
    if (!selectedGroup?.period?.id || !assignments) return [];
    return (assignments || []).filter(
      (a) => a.period.id === selectedGroup.period.id && a.is_active && a.remaining_slots > 0
    );
  }, [assignments, selectedGroup]);

  const submitPeriodAssignment = (e: FormEvent) => {
    e.preventDefault();
    periodForm.post(route('admin.dpl.tugaskan-periode'), {
      preserveScroll: true,
      onSuccess: () => periodForm.reset(),
    });
  };

  const submitGroupAssignment = (e: FormEvent) => {
    e.preventDefault();
    groupForm.post(route('admin.dpl.tugaskan-kelompok', { group: groupForm.data.group_id }), {
      preserveScroll: true,
      onSuccess: () => groupForm.reset(),
    });
  };

  const submitDistrictCoordinator = (e: FormEvent) => {
    e.preventDefault();
    coordForm.post(route('admin.dpl.tugaskan-wilayah'), {
      preserveScroll: true,
      onSuccess: () => coordForm.reset(),
    });
  };

  const submitImport = (e: FormEvent) => {
    e.preventDefault();
    importForm.post(route('admin.dpl.impor'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        importForm.reset();
        setActiveFormMode('default');
      },
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const { type, id } = deletingId;
    const url = type === 'period' ? route('admin.dpl.lepas-periode', id) : route('admin.dpl.lepas-wilayah', id);
    router.patch(url, {}, { preserveScroll: true, onSuccess: () => setDeletingId(null) });
  };

  return (
    <AppLayout title="Penugasan DPL">
      <Head title="Penugasan DPL | KKN UIN SAIZU"/>

      <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
          <div className="space-y-4">
            <div className="h-10 w-10 bg-[#e8f5ee] text-[#1a7a4a] rounded-xl flex items-center justify-center border border-emerald-50 shadow-sm">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
                Penugasan DPL.
              </h1>
              <p className="text-sm font-medium text-emerald-800 max-w-2xl">
                Kelola aktivasi Dosen Pembimbing Lapangan, plotting unit kelompok KKN, dan penetapan Koordinator Wilayah (Korwil).
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveFormMode(activeFormMode === 'import' ? 'default' : 'import')}
              className={clsx(
                "h-12 px-6 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm",
                activeFormMode === 'import' 
                  ? "bg-[#16a34a] text-white border border-emerald-700 hover:bg-[#15803d]" 
                  : "bg-white border border-emerald-50 text-[#1a7a4a] hover:bg-gray-50"
              )}
            >
              <FileSpreadsheet size={16} /> DATA IMPOR MASSAL
            </button>
          </div>
        </div>

        {/* TWO-COLUMN MASTER DATA LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          
          {/* --- LEFT COLUMN: DYNAMIC FORM --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-[#1a7a4a] border border-emerald-50">
                    {activeFormMode === 'import' ? <Upload size={20} strokeWidth={3} /> :
                     activeTab === 'assignments' ? <UserPlus size={20} strokeWidth={3} /> :
                     activeTab === 'groups' ? <Target size={20} strokeWidth={3} /> :
                     <ShieldCheck size={20} strokeWidth={3} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                      {activeFormMode === 'import' ? 'Transmisi Data Massal' :
                       activeTab === 'assignments' ? 'Aktivasi Otoritas DPL' :
                       activeTab === 'groups' ? 'Validasi Otoritas Unit' :
                       'Penunjukan Korwil'}
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                      {activeFormMode === 'import' ? 'MODE: IMPOR DATA' : `MODE: ${activeTab.toUpperCase()}`}
                    </p>
                  </div>
                </div>
                {activeFormMode === 'import' && (
                  <button onClick={() => setActiveFormMode('default')} className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-800 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
              
              {/* RENDERING DYNAMIC FORMS BASED ON STATE & TABS */}

              {/* FORM: IMPORT */}
              {activeFormMode === 'import' && (
                <form onSubmit={submitImport} className="p-8 space-y-6">
                   <div className="border-4 border-dashed border-[#f3f4f6] rounded-xl p-8 flex flex-col items-center justify-center gap-6 hover:bg-gray-50 transition-all relative group/upload">
                    <div className="h-16 w-16 rounded-xl bg-white border border-emerald-50 shadow-sm flex items-center justify-center text-[#1a7a4a] group-hover/upload:scale-110 group-hover/upload:rotate-12 transition-all">
                      <Upload size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      {importForm.data.file ? (
                        <>
                          <span className="text-sm font-bold text-emerald-950">{importForm.data.file.name}</span>
                          <span className="text-xs font-bold text-[#1a7a4a] uppercase">File Siap Ditransmisikan</span>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-emerald-950">Pilih Berkas Spreadsheet</p>
                          <p className="text-xs font-bold text-[#1a7a4a]/60 leading-none">FORMAT: .XLSX, .CSV</p>
                        </>
                      )}
                    </div>
                    <input type="file" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required accept=".xlsx,.csv"/>
                  </div>
                  
                  <div className="bg-[#e8f5ee] rounded-xl p-6 flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Informasi Sinkronisasi</span>
                    <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                      Kolom dalam file harus mengikuti template sistem secara kaku (strict typing). Data akan meng-override konfigurasi aktif.
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-[#f3f4f6]">
                    <button type="submit" disabled={importForm.processing} className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-none transition-all flex items-center justify-center gap-3 text-xs active:scale-95 disabled:opacity-50">
                      <Zap size={20} strokeWidth={2.5} /> RUN TRANSMISSION
                    </button>
                  </div>
                </form>
              )}

              {/* FORM: AKTIVASI DPL (assignments tab) */}
              {activeFormMode === 'default' && activeTab === 'assignments' && (
                <form onSubmit={submitPeriodAssignment} className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Dosen Pengampu <span className="text-rose-500">*</span></label>
                    <select value={periodForm.data.dosen_id} onChange={(e) => periodForm.setData('dosen_id', e.target.value)} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm appearance-none" required>
                      <option value="">PILIH DOSEN TERVALIDASI...</option>
                      {allDosen?.map((d) => (
                        <option key={d.id} value={d.id} disabled={d.is_qualified === false}>
                          {d.nama.toUpperCase()} &middot; {d.nip} {!d.is_qualified ? ` [❌ ${d.qualification_reason}]` : ''}
                        </option>
                      ))}
                    </select>
                    {allDosen?.find(d => String(d.id) === periodForm.data.dosen_id)?.is_qualified === false && (
                      <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-2 uppercase tracking-tight">
                        <ShieldAlert size={12} /> DITOLAK: {allDosen.find(d => String(d.id) === periodForm.data.dosen_id)?.qualification_reason}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Target Periode <span className="text-rose-500">*</span></label>
                    <select value={periodForm.data.period_id} onChange={(e) => periodForm.setData('period_id', e.target.value)} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all appearance-none" required>
                      <option value="">PILIH PERIODE AKADEMIK...</option>
                      {allPeriods?.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Kuota Bimbingan <span className="text-rose-500">*</span></label>
                    <input type="number" min="1" value={periodForm.data.max_groups} onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value))} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 text-center focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm tabular-nums" required />
                  </div>

                  <div className="pt-2 border-t border-[#f3f4f6]">
                    <button type="submit" disabled={periodForm.processing} className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-none transition-all flex items-center justify-center gap-3 text-xs active:scale-95 disabled:opacity-50">
                      <CheckCircle2 size={20} strokeWidth={2.5} /> REGISTRASIKAN DPL
                    </button>
                  </div>
                </form>
              )}

              {/* FORM: PLOTTING KELOMPOK (groups tab) */}
              {activeFormMode === 'default' && activeTab === 'groups' && (
                <form onSubmit={submitGroupAssignment} className="p-8 space-y-6">
                  {selectedGroup ? (
                    <div className="bg-[#e8f5ee] p-5 rounded-xl border border-emerald-50 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1a7a4a] uppercase tracking-widest leading-none mb-2">UNIT TERPILIH</span>
                        <span className="text-sm font-bold text-emerald-950">{selectedGroup.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-950 bg-white px-2 py-1 rounded border border-emerald-50 shadow-sm font-mono">{selectedGroup.code}</span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 bg-dashed border-2 border-dashed border-emerald-50 p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                       <Target size={24} className="text-emerald-800" />
                       <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Silakan Pilih Unit Anda<br/>Dari Tabel di Sebelah Kanan</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Alokasi DPL <span className="text-rose-500">*</span></label>
                    <select value={groupForm.data.dpl_period_id} onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)} disabled={!selectedGroup} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm appearance-none disabled:opacity-50" required>
                      <option value="">PILIH DOSEN BERBENTUK KUOTA...</option>
                      {availableAssignments?.map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama.toUpperCase()} &middot; {a.dosen?.nip} [SISA {a.remaining_slots || 0} KELOMPOK]</option>)}
                    </select>
                    {availableAssignments.length === 0 && selectedGroup && (
                      <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1 uppercase tracking-tight">
                        <AlertTriangle size={12} /> PERINGATAN: TIDAK ADA KUOTA DPL TERSISA
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#f3f4f6]">
                    <button type="submit" disabled={groupForm.processing || !selectedGroup || availableAssignments.length === 0} className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-none transition-all flex items-center justify-center gap-3 text-xs active:scale-95 disabled:opacity-50 mt-4">
                      <Target size={20} strokeWidth={2.5} /> PLOT KE KELOMPOK
                    </button>
                    {selectedGroup && (
                      <button type="button" onClick={() => groupForm.reset()} className="mt-2 w-full h-10 text-xs font-bold text-emerald-800 hover:text-rose-500 transition-colors uppercase tracking-widest">
                        Batalkan Pilihan
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* FORM: KOORDINATOR WILAYAH (regions tab) */}
              {activeFormMode === 'default' && activeTab === 'regions' && (
                <form onSubmit={submitDistrictCoordinator} className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Wilayah Kecamatan <span className="text-rose-500">*</span></label>
                    <select value={coordForm.data.district_id} onChange={(e) => coordForm.setData('district_id', e.target.value)} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm appearance-none" required>
                      <option value="">PILIH ZONA EKSISTING...</option>
                      {districts?.map((d) => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1 mb-2">Otoritas Korwil <span className="text-rose-500">*</span></label>
                    <select value={coordForm.data.dpl_period_id} onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)} className="w-full h-12 px-4 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm appearance-none" required>
                      <option value="">PILIH DPL AKTIF SEBAGAI KORWIL...</option>
                      {assignments?.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama.toUpperCase()} &middot; {a.dosen?.nip}</option>)}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-[#f3f4f6]">
                    <button type="submit" disabled={coordForm.processing} className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-none transition-all flex items-center justify-center gap-3 text-xs active:scale-95 disabled:opacity-50">
                      <ShieldCheck size={20} strokeWidth={2.5} /> TETAPKAN OTORITAS
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* INLINE METRICS (Master Data Pattern) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-emerald-50 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <UserCheck size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-950 leading-none tabular-nums mt-1">{summary?.active_assignments}</p>
                  <p className="text-xs font-bold text-[#1a7a4a] mt-1 uppercase tracking-wider">Aktivasi DPL</p>
                </div>
              </div>
              <div className="bg-white border border-emerald-50 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <Briefcase size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-950 leading-none tabular-nums mt-1">{summary?.groups_total}</p>
                  <p className="text-xs font-bold text-[#1a7a4a] mt-1 uppercase tracking-wider">Total Kelompok</p>
                </div>
              </div>
            </div>
            {(summary?.active_groups_without_dpl ?? 0) > 0 && (
              <div className="bg-white border border-rose-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500">
                    <AlertTriangle size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 mt-1 uppercase tracking-wider">Kritis: Butuh Plotting</p>
                    <p className="text-2xl font-black text-rose-950 leading-none tabular-nums mt-1">{summary?.active_groups_without_dpl} Unit</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white border border-emerald-50 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <MapPinned size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a7a4a] mt-1 uppercase tracking-wider">Otoritas Lintas Wilayah</p>
                  <p className="text-2xl font-black text-emerald-950 leading-none tabular-nums mt-1">{summary?.district_coordinators} Korwil Terdata</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: TABEL MASTER DATA (2/3 Width) --- */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-white border border-emerald-50 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
              
              {/* TABS & SEARCH */}
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center p-1.5 bg-white border border-emerald-50 rounded-xl overflow-x-auto shadow-sm shadow-emerald-900/5">
                  <TabButton active={activeTab === 'assignments'} onClick={() => { setActiveTab('assignments'); setActiveFormMode('default'); }} label="DPL AKTIF" icon={ShieldCheck} />
                  <TabButton active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setActiveFormMode('default'); }} label="PLOTTING KELOMPOK" icon={Users} />
                  <TabButton active={activeTab === 'regions'} onClick={() => { setActiveTab('regions'); setActiveFormMode('default'); }} label="KORWIL" icon={Target} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="relative w-full xl:w-72 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-emerald-50 rounded-lg text-xs font-bold text-emerald-950 placeholder:text-black focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm"
                    placeholder="CARI NIP, NAMA, WILAYAH..."
                  />
                </form>
              </div>

              {/* CONTENT AREA */}
              <div className="overflow-x-auto min-h-[500px]">
                {activeTab === 'assignments' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-50 bg-white">
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Identitas Dosen [NIP]</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase text-center">Periode Akademik</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase text-center">Beban Kerja Bimbingan</th>
                        <th className="px-6 py-4 text-right text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Otoritas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {(!assignments || assignments.length === 0) ? (
                        <EmptyState icon={ShieldCheck} label="DPL AKTIF BELUM TERSEDIA" desc="Tidak ada dosen yang diaktivasi pada periode ini." />
                      ) : (
                        assignments.map((a) => (
                          <tr key={a.id} className="group hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-emerald-950 mb-1">{a.dosen?.nama || 'N/A'}</span>
                                <span className="text-xs font-bold text-emerald-800 font-mono">NIP: {a.dosen?.nip || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center align-top">
                              <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded bg-[#e8f5ee] text-[#1a7a4a] uppercase">{a.period?.name || 'UMUM'}</span>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col items-center gap-1.5 w-24 mx-auto">
                                <div className="flex justify-between text-xs font-bold w-full uppercase">
                                  <span className="text-emerald-950 tabular-nums">{a.current_groups || 0}</span>
                                  <span className="text-emerald-800 tabular-nums">/ {a.max_groups || 0} MAX</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, ((a.current_groups || 0) / (a.max_groups || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right align-top">
                              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setDeletingId({ type: 'period', id: a.id })}
                                  className="h-8 w-8 flex items-center justify-center text-rose-500 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg transition-all active:scale-90"
                                  title="Cabut Aktivasi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'groups' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-50 bg-white">
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Identitas Kelompok [KODE]</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Titik Lokasi Wilayah</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Otoritas DPL Pengampu</th>
                        <th className="px-6 py-4 text-right text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {(!groups || groups.length === 0) ? (
                        <EmptyState icon={Users} label="DATA KELOMPOK KOSONG" desc="Belum ada unit kelompok yang didefinisikan." />
                      ) : (
                        groups.map((g) => (
                          <tr key={g.id} className={clsx("group transition-all", groupForm.data.group_id === String(g.id) ? "bg-emerald-50/70" : "hover:bg-gray-50")}>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-emerald-950 mb-1">{g.name}</span>
                                <span className="text-xs font-bold text-emerald-800 font-mono">CODE: {g.code} &middot; {g.status.toUpperCase()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-emerald-950 truncate max-w-xs mb-1">{g.location?.district_name || 'UMUM'}</span>
                                <span className="text-xs font-bold text-emerald-800">{g.location?.village_name || 'BELUM TERPLOT'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              {g.dpl ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-emerald-950 leading-tight mb-1">{g.dpl.nama}</span>
                                  <span className="text-xs font-bold text-emerald-800 font-mono text-ellipsis overflow-hidden">NIP: {g.dpl.nip}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Otoritas Kosong</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right align-top">
                              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { groupForm.setData('group_id', String(g.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                  className={clsx(
                                    "h-8 px-4 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all uppercase tracking-wide",
                                    g.dpl ? "bg-[#e8f5ee] text-[#1a7a4a] border-emerald-50 hover:bg-[#e8f5ee]" : "bg-white text-[#1a7a4a] border-emerald-50 hover:bg-gray-50 shadow-sm"
                                  )}
                                >
                                  {g.dpl ? 'Ganti DPL' : 'Pilih Unit'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'regions' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-50 bg-white">
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Kecamatan Administratif</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Otoritas Koordinator Wilayah</th>
                        <th className="px-6 py-4 text-right text-xs font-extrabold text-emerald-950 tracking-widest uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {(!districtCoordinators || districtCoordinators.length === 0) ? (
                        <EmptyState icon={Target} label="DATA KORWIL BELUM TERISI" desc="Belum ada DPL yang ditugaskan sebagai koordinator wilayah." />
                      ) : (
                        districtCoordinators.map((c) => (
                          <tr key={c.id} className="group hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-emerald-950 mb-1">{c.district_name || 'N/A'}</span>
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">{c.regency_name || 'BANYUMAS'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-emerald-950 mb-1">{c.dosen?.nama || 'N/A'}</span>
                                <span className="text-xs font-bold text-emerald-800 font-mono">NIP: {c.dosen?.nip || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right align-top">
                              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setDeletingId({ type: 'region', id: c.id })}
                                  className="h-8 w-8 flex items-center justify-center text-rose-500 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg transition-all active:scale-90"
                                  title="Copot Korwil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAGINATION */}
              <div className="px-6 py-4 border-t border-[#f3f4f6] bg-gray-50 flex items-center justify-center">
                <Pagination
                  meta={
                    (activeTab === 'assignments' ? assignments_pagination
                      : activeTab === 'groups' ? groups_pagination
                      : coordinators_pagination) as import('@/Components/ui/Pagination').PaginationMeta
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Otorisasi Pencabutan Tugas"
        message={`Apakah Anda yakin ingin melenyapkan otoritas ${deletingId?.type === 'period' ? 'aktivasi periode dpl' : 'koordinator wilayah'} ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.`}
        confirmVariant="danger"
        confirmLabel="Pusnahkan Otoritas"
      />
    </AppLayout>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-6 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap outline-none uppercase tracking-widest',
        active ? 'bg-[#16a34a] text-white shadow-sm' : 'text-emerald-800 hover:text-[#1a7a4a] hover:bg-gray-50'
      )}
    >
      <Icon size={14} strokeWidth={2.5} /> {label}
    </button>
  );
}

function EmptyState({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-emerald-700 mb-2">
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-widest">{label}</span>
          <p className="text-xs font-bold text-emerald-800">{desc}</p>
        </div>
      </td>
    </tr>
  );
}
