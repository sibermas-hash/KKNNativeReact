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
  Info,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import { 
  PageHeader, 
  StatCard, 
  ContentPanel, 
  StatusTag 
} from '@/Components/Premium';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
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
      <Head title="Penugasan DPL | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        
        {/* --- PREMIUM HEADER --- */}
        <PageHeader
          title="Penugasan DPL"
          subtitle="Pusat kendali aktivasi DPL, orkestrasi plotting unit kelompok, serta penetapan yurisdiksi Koordinator Wilayah (Korwil)."
          icon={Briefcase}
          breadcrumb={[
            { label: 'Dashboard', href: route('admin.dashboard') },
            { label: 'Operasional', href: '#' },
            { label: 'Penugasan DPL' }
          ]}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFormMode(activeFormMode === 'import' ? 'default' : 'import')}
              className={clsx(
                "h-10 px-5 rounded-xl font-black transition-all flex items-center gap-2.5 text-[10px] shadow-sm uppercase tracking-wider",
                activeFormMode === 'import' 
                  ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                  : "bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50/50"
              )}
            >
              <FileSpreadsheet size={14} strokeWidth={2.5} /> Data Impor Massal
            </button>
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aktivasi DPL" value={summary?.active_assignments} icon={UserCheck} variant="info" />
          <StatCard label="Total Unit" value={summary?.groups_total} icon={Briefcase} variant="gray" />
          <StatCard label="Butuh Plotting" value={summary?.active_groups_without_dpl} icon={AlertTriangle} variant={summary?.active_groups_without_dpl ? "danger" : "success"} />
          <StatCard label="Koordinator" value={summary?.district_coordinators} icon={MapPinned} variant="success" />
        </div>

        {/* TWO-COLUMN MASTER DATA LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* --- LEFT COLUMN: CONTROL HUB (1/3) --- */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <ContentPanel
              title={activeFormMode === 'import' ? 'Transmisi Massal' :
                     activeTab === 'assignments' ? 'Aktivasi Otoritas' :
                     activeTab === 'groups' ? 'Validasi Unit' :
                     'Penunjukan Korwil'}
              description={activeFormMode === 'import' ? 'Mode: Impor Data' : `Mode: ${activeTab.toUpperCase()}`}
              icon={activeFormMode === 'import' ? Upload :
                    activeTab === 'assignments' ? UserPlus :
                    activeTab === 'groups' ? Target :
                    ShieldCheck}
              padding={true}
              actions={activeFormMode === 'import' ? (
                <button onClick={() => setActiveFormMode('default')} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors">
                  <X size={16} strokeWidth={3} />
                </button>
              ) : null}
            >
              {/* FORM: IMPORT */}
              {activeFormMode === 'import' && (
                <form onSubmit={submitImport} className="space-y-6">
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-gray-50/50 transition-all relative group/upload">
                    <div className="h-14 w-14 rounded-xl bg-white border border-emerald-50 shadow-sm flex items-center justify-center text-emerald-600 group-hover/upload:scale-110 transition-all">
                      <Upload size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      {importForm.data.file ? (
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-tight">{importForm.data.file.name}</span>
                      ) : (
                        <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Pilih Berkas Spreadsheet</p>
                      )}
                    </div>
                    <input type="file" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required accept=".xlsx,.csv"/>
                  </div>
                  <button type="submit" disabled={importForm.processing} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2.5 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
                    <Zap size={16} strokeWidth={2.5} /> Run Transmission
                  </button>
                </form>
              )}

              {/* FORM: AKTIVASI DPL (assignments tab) */}
              {activeFormMode === 'default' && activeTab === 'assignments' && (
                <form onSubmit={submitPeriodAssignment} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Dosen Pengampu</label>
                    <div className="relative group">
                      <select value={periodForm.data.dosen_id} onChange={(e) => periodForm.setData('dosen_id', e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase" required>
                        <option value="">PILIH DOSEN...</option>
                        {allDosen?.map((d) => (
                          <option key={d.id} value={d.id} disabled={d.is_qualified === false}>
                            {d.nama} &middot; {d.nip}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Target Periode</label>
                    <div className="relative group">
                      <select value={periodForm.data.period_id} onChange={(e) => periodForm.setData('period_id', e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase" required>
                        <option value="">PILIH PERIODE...</option>
                        {allPeriods?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kuota Bimbingan</label>
                    <input type="number" min="1" value={periodForm.data.max_groups} onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value))} className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-black text-emerald-950 focus:border-emerald-600 outline-none transition-all shadow-sm tabular-nums" required />
                  </div>

                  <button type="submit" disabled={periodForm.processing} className="w-full h-12 bg-emerald-950 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
                    <CheckCircle2 size={16} strokeWidth={2.5} /> Registrasikan DPL
                  </button>
                </form>
              )}

              {/* FORM: PLOTTING KELOMPOK (groups tab) */}
              {activeFormMode === 'default' && activeTab === 'groups' && (
                <form onSubmit={submitGroupAssignment} className="space-y-6">
                  {selectedGroup ? (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-emerald-700 border border-emerald-100 shadow-sm font-black text-[10px]">
                          {selectedGroup.code}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Unit Terpilih</span>
                          <span className="text-xs font-bold text-emerald-950 leading-tight">{selectedGroup.name}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => groupForm.reset()} className="h-8 w-8 rounded-lg hover:bg-rose-50 text-emerald-800 hover:text-rose-500 transition-colors flex items-center justify-center">
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 p-8 rounded-xl flex flex-col items-center justify-center gap-4 text-center group/select">
                      <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-300 group-hover/select:text-emerald-500 transition-all shadow-sm">
                        <Target size={24} strokeWidth={2} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                        Pilih unit kelompok dari tabel untuk memulai plotting.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Alokasi DPL</label>
                    <div className="relative group">
                      <select value={groupForm.data.dpl_period_id} onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)} disabled={!selectedGroup} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase disabled:opacity-50" required>
                        <option value="">PILIH DOSEN BERKUOTA...</option>
                        {availableAssignments?.map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama} &middot; [SISA {a.remaining_slots}]</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <button type="submit" disabled={groupForm.processing || !selectedGroup || availableAssignments.length === 0} className="w-full h-12 bg-emerald-950 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
                    <Target size={16} strokeWidth={2.5} /> Plot ke Unit
                  </button>
                </form>
              )}

              {/* FORM: KOORDINATOR WILAYAH (regions tab) */}
              {activeFormMode === 'default' && activeTab === 'regions' && (
                <form onSubmit={submitDistrictCoordinator} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Wilayah Kecamatan</label>
                    <div className="relative group">
                      <select value={coordForm.data.district_id} onChange={(e) => coordForm.setData('district_id', e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase" required>
                        <option value="">PILIH WILAYAH...</option>
                        {districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Otoritas Korwil</label>
                    <div className="relative group">
                      <select value={coordForm.data.dpl_period_id} onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase" required>
                        <option value="">PILIH DPL AKTIF...</option>
                        {assignments?.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <button type="submit" disabled={coordForm.processing} className="w-full h-12 bg-emerald-950 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
                    <ShieldCheck size={16} strokeWidth={2.5} /> Tetapkan Otoritas
                  </button>
                </form>
              )}
            </ContentPanel>

            <div className="bg-emerald-950 rounded-2xl p-6 text-white border-b-4 border-emerald-900 shadow-xl relative overflow-hidden group/alert">
              <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover/alert:scale-110" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Integritas Plotting</h4>
              </div>
              <p className="text-[10px] font-bold text-emerald-400/70 leading-relaxed uppercase relative z-10">
                Setiap penugasan akan disinkronkan secara real-time ke log mahasiswa dan DPL terkait. Pastikan ketersediaan kuota bimbingan mencukupi.
              </p>
            </div>
          </div>

          {/* --- RIGHT COLUMN: MASTER DATA (2/3) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[600px]">
              
              {/* TABS & SEARCH */}
              <div className="p-6 border-b border-emerald-50 bg-gray-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center p-1 bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                  <TabButton active={activeTab === 'assignments'} onClick={() => { setActiveTab('assignments'); setActiveFormMode('default'); }} label="DPL AKTIF" icon={ShieldCheck} />
                  <TabButton active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setActiveFormMode('default'); }} label="PLOTTING" icon={Users} />
                  <TabButton active={activeTab === 'regions'} onClick={() => { setActiveTab('regions'); setActiveFormMode('default'); }} label="KORWIL" icon={Target} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="relative w-full xl:w-80 group/search">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-emerald-600 transition-colors">
                    <Search size={14} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs font-black text-emerald-950 placeholder:text-gray-300 focus:border-emerald-500 outline-none transition-all shadow-sm uppercase tracking-wider"
                    placeholder="CARI DATA..."
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); router.get(route('admin.dpl.penugasan'), {}, { replace: true }); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors">
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}
                </form>
              </div>

              {/* TABLE AREA */}
              <div className="overflow-x-auto">
                {activeTab === 'assignments' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-50 bg-white">
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase">Identitas DPL</th>
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase text-center">Periode</th>
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase text-center w-48">Beban Kerja</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-emerald-950 tracking-widest uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {assignments.length === 0 ? (
                        <EmptyState icon={ShieldCheck} label="DPL AKTIF BELUM TERSEDIA" desc="Tidak ada dosen yang diaktivasi pada periode ini." />
                      ) : (
                        assignments.map((a) => (
                          <tr key={a.id} className="group hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-950 mb-0.5">{a.dosen?.nama}</span>
                                <span className="text-[10px] font-bold text-emerald-700/60 font-mono">NIP: {a.dosen?.nip}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex px-2 py-0.5 text-[9px] font-black rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-tighter shadow-sm">{a.period?.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-tight tabular-nums">
                                  <span className="text-emerald-900">{a.current_groups} Terisi</span>
                                  <span className="text-emerald-500">{a.max_groups} Kuota</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-emerald-50/30">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (a.current_groups / a.max_groups) * 100)}%` }}
                                    className={clsx("h-full rounded-full transition-all duration-1000", a.current_groups >= a.max_groups ? "bg-rose-500" : "bg-emerald-600")}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setDeletingId({ type: 'period', id: a.id })} className="h-8 w-8 inline-flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90">
                                <Trash2 size={14} />
                              </button>
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
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase">Identitas Unit</th>
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase text-center">Wilayah</th>
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase">DPL Pengampu</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-emerald-950 tracking-widest uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {groups.length === 0 ? (
                        <EmptyState icon={Users} label="DATA KELOMPOK KOSONG" desc="Belum ada unit kelompok yang didefinisikan." />
                      ) : (
                        groups.map((g) => (
                          <tr key={g.id} className={clsx("group transition-all", groupForm.data.group_id === String(g.id) ? "bg-emerald-50/70" : "hover:bg-gray-50/50")}>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-950 mb-0.5">{g.name}</span>
                                <span className="text-[10px] font-bold text-emerald-700/60 font-mono">CODE: {g.code} &middot; {g.status.toUpperCase()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest leading-none block">{g.location?.district_name || 'N/A'}</span>
                              <span className="text-[9px] font-bold text-emerald-700/40 uppercase">{g.location?.village_name}</span>
                            </td>
                            <td className="px-6 py-4">
                              {g.dpl ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-emerald-950 leading-tight mb-0.5">{g.dpl.nama}</span>
                                  <span className="text-[9px] font-bold text-emerald-700/50 font-mono">NIP: {g.dpl.nip}</span>
                                </div>
                              ) : (
                                <StatusTag label="MENUNGGU PLOTTING" variant="danger" pulse={true} />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => { groupForm.setData('group_id', String(g.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={clsx(
                                  "h-9 px-4 text-[10px] font-black rounded-xl border flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-sm",
                                  g.dpl ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-emerald-950 text-white border-emerald-900 hover:bg-black"
                                )}
                              >
                                <Target size={12} strokeWidth={3} /> {g.dpl ? 'Re-Plot' : 'Plot Unit'}
                              </button>
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
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase">Kecamatan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-emerald-950 tracking-widest uppercase">Otoritas Korwil</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-emerald-950 tracking-widest uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {districtCoordinators.length === 0 ? (
                        <EmptyState icon={Target} label="DATA KORWIL BELUM TERISI" desc="Belum ada DPL yang ditugaskan sebagai koordinator wilayah." />
                      ) : (
                        districtCoordinators.map((c) => (
                          <tr key={c.id} className="group hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-950 mb-0.5">{c.district_name}</span>
                                <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">{c.regency_name || 'BANYUMAS'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-emerald-950 mb-0.5">{c.dosen?.nama}</span>
                                <span className="text-[9px] font-bold text-emerald-700/50 font-mono">NIP: {c.dosen?.nip}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setDeletingId({ type: 'region', id: c.id })} className="h-8 w-8 inline-flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAGINATION */}
              <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex items-center justify-center">
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
        title="Konfirmasi Pencabutan Tugas"
        message={`Apakah Anda yakin ingin menghapus otoritas ${deletingId?.type === 'period' ? 'aktivasi periode dpl' : 'koordinator wilayah'} ini secara permanen?`}
        confirmVariant="danger"
        confirmLabel="Hapus Otoritas"
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
        'flex items-center gap-2.5 px-6 h-10 rounded-xl text-[10px] font-black transition-all whitespace-nowrap outline-none uppercase tracking-widest relative overflow-hidden',
        active 
          ? 'bg-emerald-950 text-white shadow-lg shadow-emerald-950/20' 
          : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
      )}
    >
      <Icon size={14} strokeWidth={active ? 3 : 2.5} /> {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute inset-0 bg-emerald-900 -z-10"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function EmptyState({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-6 py-24 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
            <Icon size={32} strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">{label}</span>
            <p className="text-[10px] font-bold text-emerald-700/40 uppercase tracking-wider max-w-[240px] mx-auto leading-relaxed">{desc}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2.5 px-6 h-10 rounded-xl text-[10px] font-black transition-all whitespace-nowrap outline-none uppercase tracking-widest relative overflow-hidden',
        active 
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
          : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
      )}
    >
      <Icon size={14} strokeWidth={active ? 3 : 2.5} /> {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute inset-0 bg-emerald-500 -z-10"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function EmptyState({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-6 py-32 text-center bg-gray-50/20">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-200">
            <Icon size={40} strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">{label}</span>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider max-w-xs mx-auto">{desc}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}
