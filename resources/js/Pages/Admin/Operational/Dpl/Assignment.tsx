import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  AlertTriangle,
  FileSpreadsheet,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  ChevronRight,
  Zap,
  Activity,
  Target,
  Database,
  CheckCircle2,
  UserCheck,
  Briefcase,
  Download,
  Filter,
  X
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination, Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';

interface DosenOption {
  id: number;
  nama: string;
  nip: string;
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
  filters
}: Props) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'groups' | 'regions'>('assignments');
  const [search, setSearch] = useState(filters?.search ?? '');
  const [showForm, setShowForm] = useState<'period' | 'group' | 'region' | 'import' | null>(null);
  const [deletingId, setDeletingId] = useState<{ type: 'period' | 'region', id: number } | null>(null);

  const periodForm = useForm({ dosen_id: '', period_id: '', max_groups: 10 });
  const groupForm = useForm({ group_id: '', dpl_period_id: '' });
  const coordForm = useForm({ district_id: '', dpl_period_id: '' });
  const importForm = useForm({ file: null as File | null });

  const handleApplyFilters = () => {
    router.get(route('admin.dpl.penugasan'), { search: search || undefined }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const selectedGroup = useMemo(() => (groups || []).find(g => String(g.id) === groupForm.data.group_id), [groupForm.data.group_id, groups]);
  
  const availableAssignments = useMemo(() => {
    if (!selectedGroup?.period?.id || !assignments) return [];
    return (assignments || []).filter(a => a.period.id === selectedGroup.period.id && a.is_active && a.remaining_slots > 0);
  }, [assignments, selectedGroup]);

  const submitPeriodAssignment = (e: FormEvent) => {
    e.preventDefault();
    periodForm.post(route('admin.dpl.tugaskan-periode'), { preserveScroll: true, onSuccess: () => { setShowForm(null); periodForm.reset(); } });
  };

  const submitGroupAssignment = (e: FormEvent) => {
    e.preventDefault();
    groupForm.post(route('admin.dpl.tugaskan-kelompok', { group: groupForm.data.group_id }), { preserveScroll: true, onSuccess: () => { setShowForm(null); groupForm.reset(); } });
  };

  const submitDistrictCoordinator = (e: FormEvent) => {
    e.preventDefault();
    coordForm.post(route('admin.dpl.tugaskan-wilayah'), { preserveScroll: true, onSuccess: () => { setShowForm(null); coordForm.reset(); } });
  };

  const submitImport = (e: FormEvent) => {
    e.preventDefault();
    importForm.post(route('admin.dpl.impor'), { forceFormData: true, preserveScroll: true, onSuccess: () => { setShowForm(null); importForm.reset(); } });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const { type, id } = deletingId;
    const url = type === 'period' ? route('admin.dpl.lepas-periode', id) : route('admin.dpl.lepas-wilayah', id);
    router.patch(url, {}, { preserveScroll: true, onSuccess: () => setDeletingId(null) });
  };

  return (
    <AppLayout title="Protokol Penugasan DPL">
      <Head title="Penugasan DPL" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Briefcase size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Manajemen Sumber Daya Manusia</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Penugasan <span className="text-emerald-500">DPL.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Protokol Alokasi Dosen Pembimbing Lapangan dan Korespondensi Tugas Wilayah Strategis
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => setShowForm('import')}
                        className="h-14 px-8 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-3 text-xs font-bold active:scale-95 uppercase tracking-widest"
                    >
                        <FileSpreadsheet size={18} /> INGEST DATA
                    </button>
                    <button
                        onClick={() => setShowForm('period')}
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <UserPlus size={20} /> AKTIVASI DPL
                    </button>
                </div>
            </div>
        </div>

        {/* --- STRATEGIC METRICS --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            <MetricCard label="Telah Aktivasi" value={summary?.active_assignments} icon={UserCheck} color="emerald" desc="Total DPL Aktif" />
            <MetricCard label="Total Unit" value={summary?.groups_total} icon={Briefcase} color="emerald" desc="Basis Unit Lapangan" />
            <MetricCard label="Tanpa DPL" value={summary?.groups_without_dpl} icon={AlertTriangle} color="rose" desc="Unit Kritis" />
            <MetricCard label="Status Plot" value={summary?.active_groups_without_dpl} icon={Activity} color="rose" desc="Perlu Atensi" />
            <MetricCard label="Korwil" value={summary?.district_coordinators} icon={MapPinned} color="amber" desc="Kecamatan Tercover" />
        </div>

        {/* --- TABS & SEARCH --- */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/20">
                <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl w-full lg:w-auto">
                    <TabButton active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} label="Registry Aktivasi" icon={ShieldCheck} />
                    <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Penempatan Unit" icon={Users} />
                    <TabButton active={activeTab === 'regions'} onClick={() => setActiveTab('regions')} label="Komando Wilayah" icon={Target} />
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="flex-1 relative min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-lg text-sm text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                            placeholder="Cari Nama DPL, NIP, Unit..."
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
               <AnimatePresence mode="wait">
                  {activeTab === 'assignments' && (
                    <motion.table initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Instruktur / NIP</th>
                                <th className="px-6 py-4">Periode Target</th>
                                <th className="px-6 py-4">Kapasitas Load</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(assignments || []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                         <div className="flex flex-col items-center gap-3 text-slate-200">
                                             <ShieldCheck size={48} strokeWidth={1} />
                                             <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Registry Aktivasi Kosong</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : (
                                assignments?.map((a) => (
                                    <tr key={a.id} className="group hover:bg-slate-50/50 transition-all font-sans">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-tight line-clamp-1">{a.dosen?.nama || 'N/A'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">NIP: {a.dosen?.nip || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{a.period?.name || 'PERIODE TIDAK DIKETAHUI'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${((a.current_groups || 0) / (a.max_groups || 1)) * 100}%` }} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-900">{a.current_groups || 0} / {a.max_groups || 0} Unit</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setDeletingId({ type: 'period', id: a.id })} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </motion.table>
                  )}

                  {activeTab === 'groups' && (
                    <motion.table initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Unit Identity</th>
                                <th className="px-6 py-4">Deployment Zone</th>
                                <th className="px-6 py-4">Instructor Assigned</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(groups || []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                         <div className="flex flex-col items-center gap-3 text-slate-200">
                                             <Users size={48} strokeWidth={1} />
                                             <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Daftar Unit Kosong</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : (
                                groups?.map((g) => (
                                    <tr key={g.id} className="group hover:bg-slate-50/50 transition-all font-sans">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-tight line-clamp-1">{g.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">{g.code} · {g.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight line-clamp-1">{g.location?.district_name || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {g.dpl ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold text-emerald-700 uppercase line-clamp-1 italic">{g.dpl.nama}</span>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">NIP: {g.dpl.nip}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest italic animate-pulse">AWAITING DPL</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button onClick={() => { groupForm.setData('group_id', String(g.id)); setShowForm('group'); }} className="h-8 px-4 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 scale-95 hover:scale-100 transition-all">Assign DPL</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </motion.table>
                  )}

                  {activeTab === 'regions' && (
                    <motion.table initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Regional Command</th>
                                <th className="px-6 py-4">Commander (DPL)</th>
                                <th className="px-6 py-4 text-right">
                                     <Button onClick={() => setShowForm('region')} className="h-7 px-3 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-md shadow-sm active:scale-95">New Coordinator</Button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(districtCoordinators || []).length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-24 text-center">
                                         <div className="flex flex-col items-center gap-3 text-slate-200">
                                             <MapPinned size={48} strokeWidth={1} />
                                             <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Komando Wilayah Belum Ditetapkan</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : (
                                districtCoordinators?.map((c) => (
                                    <tr key={c.id} className="group hover:bg-slate-50/50 transition-all font-sans">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-tight italic">{c.district_name || 'N/A'}</span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest line-clamp-1">{c.regency_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700 uppercase line-clamp-1">{c.dosen?.nama || 'N/A'}</span>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">NIP: {c.dosen?.nip || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <button onClick={() => setDeletingId({ type: 'region', id: c.id })} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ml-auto">
                                                <Trash2 size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </motion.table>
                  )}
               </AnimatePresence>
            </div>

            <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
                    Registry Node Focus: {activeTab.toUpperCase()} | Hall Hal. {(activeTab === 'assignments' ? assignments_pagination : activeTab === 'groups' ? groups_pagination : coordinators_pagination)?.current_page ?? 1}
                </span>
                {(activeTab === 'assignments' ? assignments_pagination : activeTab === 'groups' ? groups_pagination : coordinators_pagination) && (
                    <Pagination meta={activeTab === 'assignments' ? assignments_pagination : activeTab === 'groups' ? groups_pagination : coordinators_pagination} />
                )}
            </div>
        </section>

        {/* --- MODALS --- */}
        {/* Aktivasi DPL */}
        <Modal show={showForm === 'period'} onClose={() => setShowForm(null)} title="Personnel Activation Protocol">
            <form onSubmit={submitPeriodAssignment} className="p-6 space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Personnel</label>
                    <select value={periodForm.data.dosen_id} onChange={(e) => periodForm.setData('dosen_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" required>
                        <option value="">CARI DOSEN...</option>
                        {allDosen?.map(d => <option key={d.id} value={d.id}>{d.nama} ({d.nip})</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Period</label>
                        <select value={periodForm.data.period_id} onChange={(e) => periodForm.setData('period_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" required>
                            <option value="">PILIH PERIODE</option>
                            {allPeriods?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Load (Unit)</label>
                        <input type="number" value={periodForm.data.max_groups} onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value))} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none" required />
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => setShowForm(null)} type="button" className="h-12 px-8 text-[10px] uppercase font-bold text-slate-400">Cancel</Button>
                    <Button type="submit" disabled={periodForm.processing} className="h-12 px-10 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">Execute Activation</Button>
                </div>
            </form>
        </Modal>

        {/* Plotting DPL */}
        <Modal show={showForm === 'group'} onClose={() => setShowForm(null)} title="Field Personnel Matching">
            <form onSubmit={submitGroupAssignment} className="p-6 space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Operational Unit</label>
                    <select value={groupForm.data.group_id} onChange={(e) => groupForm.setData('group_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" disabled={groupForm.data.group_id !== ''} required>
                        <option value="">PILIH KELOMPOK...</option>
                        {groups?.map(g => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Instructors (DPL)</label>
                    <select value={groupForm.data.dpl_period_id} onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" required>
                        <option value="">SELECT ASSIGNED PERSONNEL...</option>
                        {availableAssignments?.map(a => <option key={a.id} value={a.id}>{a.dosen?.nama || 'N/A'} ({a.remaining_slots || 0} Slots Left)</option>)}
                    </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => setShowForm(null)} type="button" className="h-12 px-8 text-[10px] uppercase font-bold text-slate-400">Cancel</Button>
                    <Button type="submit" disabled={groupForm.processing || availableAssignments.length === 0} className="h-12 px-10 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">Assign Personnel</Button>
                </div>
            </form>
        </Modal>

        {/* Koordinator Wilayah */}
        <Modal show={showForm === 'region'} onClose={() => setShowForm(null)} title="Regional Command Assignment">
            <form onSubmit={submitDistrictCoordinator} className="p-6 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deployment District</label>
                    <select value={coordForm.data.district_id} onChange={(e) => coordForm.setData('district_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" required>
                        <option value="">PILIH KECAMATAN</option>
                        {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Commander (DPL)</label>
                    <select value={coordForm.data.dpl_period_id} onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-900 focus:border-emerald-500 outline-none uppercase" required>
                        <option value="">SELECT PERSONNEL...</option>
                        {assignments?.filter(a => a.is_active).map(a => <option key={a.id} value={a.id}>{a.dosen?.nama || 'N/A'} · {a.period?.name || '-'}</option>)}
                    </select>
                </div>
                 <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => setShowForm(null)} type="button" className="h-12 px-8 text-[10px] uppercase font-bold text-slate-400">Cancel</Button>
                    <Button type="submit" disabled={coordForm.processing} className="h-12 px-10 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-amber-100">Establish Command</Button>
                </div>
            </form>
        </Modal>

        {/* Import Massal */}
        <Modal show={showForm === 'import'} onClose={() => setShowForm(null)} title="Mass Data Ingestion">
            <form onSubmit={submitImport} className="p-6 space-y-6">
                <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center gap-4 hover:border-emerald-200 transition-all cursor-pointer relative group">
                    <Upload size={32} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{importForm.data.file ? importForm.data.file.name : 'Click to browser .xlsx / .csv'}</span>
                    <input type="file" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                </div>
                <div className="flex justify-end gap-3">
                     <Button type="submit" disabled={importForm.processing} className="w-full h-14 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">Execute Ingestion</Button>
                </div>
            </form>
        </Modal>

        <ConfirmDialog
            show={deletingId !== null}
            onClose={() => setDeletingId(null)}
            onConfirm={handleDelete}
            title="Terminate Deployment Protocol"
            message={`Seluruh data ${deletingId?.type === 'period' ? 'aktivasi periode' : 'komando wilayah'} instruktur ini akan dihapus dari registry operasional. Lanjutkan eliminasi?`}
        />
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: LucideIcon; color: 'emerald' | 'amber' | 'rose' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex flex-col gap-4 relative z-10">
                <div className={clsx('h-10 w-10 rounded-lg flex items-center justify-center transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6', 
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                  color === 'rose' ? 'bg-rose-50 text-rose-600' : 
                  color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400')}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic leading-none">{label}</p>
                  <p className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: LucideIcon }) {
    return (
        <button onClick={onClick} className={clsx('flex items-center gap-2 px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap', active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <Icon size={12} strokeWidth={3} /> {label}
        </button>
    );
}
