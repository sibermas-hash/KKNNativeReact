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
  ChevronRight,
  X
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
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
  const [search, setSearch] = useState(filters?.search ?? '');
  const [showForm, setShowForm] = useState<'period' | 'group' | 'region' | 'import' | null>(null);
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
    [groupForm.data.group_id, groups],
  );

  const availableAssignments = useMemo(() => {
    if (!selectedGroup?.period?.id || !assignments) return [];
    return (assignments || []).filter(
      (a) => a.period.id === selectedGroup.period.id && a.is_active && a.remaining_slots > 0,
    );
  }, [assignments, selectedGroup]);

  const submitPeriodAssignment = (e: FormEvent) => {
    e.preventDefault();
    periodForm.post(route('admin.dpl.tugaskan-periode'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowForm(null);
        periodForm.reset();
      },
    });
  };

  const submitGroupAssignment = (e: FormEvent) => {
    e.preventDefault();
    groupForm.post(route('admin.dpl.tugaskan-kelompok', { group: groupForm.data.group_id }), {
      preserveScroll: true,
      onSuccess: () => {
        setShowForm(null);
        groupForm.reset();
      },
    });
  };

  const submitDistrictCoordinator = (e: FormEvent) => {
    e.preventDefault();
    coordForm.post(route('admin.dpl.tugaskan-wilayah'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowForm(null);
        coordForm.reset();
      },
    });
  };

  const submitImport = (e: FormEvent) => {
    e.preventDefault();
    importForm.post(route('admin.dpl.impor'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowForm(null);
        importForm.reset();
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
    <AppLayout title="Penugasan Dosen Pembimbing (DPL)">
      <Head title="Manajemen Penugasan DPL" />

      <div className="max-w-[1600px] mx-auto space-y-10 pb-24 font-sans text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <Briefcase size={18} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">SDM & Otoritas Lapangan</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Penugasan <span className="text-emerald-500">DPL.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Kelola aktivasi Dosen Pembimbing Lapangan, plotting unit kelompok KKN, dan penetapan Koordinator Wilayah (Korwil).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <button
                  onClick={() => setShowForm('import')}
                  className="h-14 px-7 bg-white border-2 border-emerald-50 text-emerald-700 rounded-2xl font-black transition-all shadow-sm flex items-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase"
                >
                  <FileSpreadsheet size={18} /> IMPOR DATA
                </button>
                <button
                  onClick={() => setShowForm('period')}
                  className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase"
                >
                  <UserPlus size={18} /> AKTIVASI DPL BARU
                </button>
              </div>
           </div>
        </div>

        {/* --- METRICS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Aktivasi DPL" value={summary?.active_assignments} icon={UserCheck} type="success" desc="Dosen Aktif Periode" />
          <MetricCard label="Total Kelompok" value={summary?.groups_total} icon={Briefcase} type="success" desc="Unit Plotting" />
          <MetricCard label="Tanpa DPL" value={summary?.groups_without_dpl} icon={AlertTriangle} type={summary?.groups_without_dpl && summary.groups_without_dpl > 0 ? 'warning' : 'success'} desc="Belum Plotting" />
          <MetricCard label="Urgensi Plotting" value={summary?.active_groups_without_dpl} icon={Activity} type={summary?.active_groups_without_dpl && summary.active_groups_without_dpl > 0 ? 'danger' : 'success'} desc="Kelompok Perlu DPL" />
          <MetricCard label="Korwil Terdata" value={summary?.district_coordinators} icon={MapPinned} type="success" desc="Koordinator Wilayah" />
        </div>

        {/* --- DATA TABLE CARD --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
           {/* TABS & SEARCH */}
           <div className="px-8 py-6 border-b-2 border-emerald-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-emerald-50/20">
              <div className="flex items-center p-1.5 bg-white border-2 border-emerald-50 rounded-2xl overflow-x-auto">
                 <TabButton active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} label="DAFTAR DPL AKTIF" icon={ShieldCheck} />
                 <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="PLOTTING KELOMPOK" icon={Users} />
                 <TabButton active={activeTab === 'regions'} onClick={() => setActiveTab('regions')} label="KOORDINATOR WILAYAH" icon={Target} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="relative w-full xl:w-96">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                 <input
                   type="text"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full h-12 pl-12 pr-4 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300 uppercase tracking-widest"
                   placeholder="CARI NIP, NAMA, ATAU WILAYAH..."
                 />
              </form>
           </div>

           {/* CONTENT AREA */}
           <div className="overflow-x-auto min-h-[500px]">
             {activeTab === 'assignments' && (
               <table className="min-w-full divide-y divide-emerald-50">
                 <thead className="bg-emerald-50/50 text-emerald-950">
                   <tr>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Identitas Dosen [NIP]</th>
                     <th className="px-10 py-5 text-center text-[10px] font-black uppercase tracking-widest">Periode Akademik</th>
                     <th className="px-10 py-5 text-center text-[10px] font-black uppercase tracking-widest">Beban Kerja Bimbingan</th>
                     <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest">Otoritas</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-emerald-50">
                   {(!assignments || assignments.length === 0) ? (
                     <EmptyState icon={ShieldCheck} label="DPL AKTIF BELUM TERSEDIA" desc="Tidak ada dosen yang diaktivasi pada periode ini." />
                   ) : (
                     assignments.map((a) => (
                       <tr key={a.id} className="group hover:bg-emerald-50/30 transition-all">
                         <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors leading-tight mb-1.5">{a.dosen?.nama || 'N/A'}</span>
                             <span className="text-[10px] font-black text-emerald-500 tracking-widest font-mono">NIP: {a.dosen?.nip || '-'}</span>
                           </div>
                         </td>
                         <td className="px-10 py-6 text-center">
                           <span className="text-[10px] font-black text-emerald-950 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">{a.period?.name || 'UMUM'}</span>
                         </td>
                         <td className="px-10 py-6">
                           <div className="flex flex-col items-center gap-2 w-40 mx-auto">
                             <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest mb-1">
                               <span className="text-emerald-950 tabular-nums text-sm tracking-tight">{a.current_groups || 0}</span>
                               <span className="text-emerald-300 tabular-nums self-end">/ {a.max_groups || 0} UNIT</span>
                             </div>
                             <div className="w-full h-2 bg-emerald-50 border border-emerald-100 rounded-full overflow-hidden shadow-inner">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min(100, ((a.current_groups || 0) / (a.max_groups || 1)) * 100)}%` }}
                                 transition={{ duration: 1 }}
                                 className="h-full bg-emerald-500 rounded-full shadow-lg" 
                               />
                             </div>
                           </div>
                         </td>
                         <td className="px-10 py-6 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button
                                onClick={() => setDeletingId({ type: 'period', id: a.id })}
                                className="h-10 w-10 bg-white border-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                title="Cabut Aktivasi"
                              >
                                <Trash2 size={18} />
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
               <table className="min-w-full divide-y divide-emerald-50">
                 <thead className="bg-emerald-50/50 text-emerald-950">
                   <tr>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Identitas Kelompok [KODE]</th>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Titik Lokasi Wilayah</th>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Otoritas DPL Pengampu</th>
                     <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-emerald-50">
                   {(!groups || groups.length === 0) ? (
                     <EmptyState icon={Users} label="DATA KELOMPOK KOSONG" desc="Belum ada unit kelompok yang didefinisikan." />
                   ) : (
                     groups.map((g) => (
                       <tr key={g.id} className="group hover:bg-emerald-50/30 transition-all">
                         <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors leading-tight mb-1.5">{g.name}</span>
                             <span className="text-[10px] font-black text-emerald-500 tracking-widest font-mono">CODE: {g.code} &middot; {g.status.toUpperCase()}</span>
                           </div>
                         </td>
                         <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight leading-tight mb-1 truncate max-w-xs">{g.location?.district_name || 'UMUM'}</span>
                             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{g.location?.village_name || 'BELUM TERPLOT'}</span>
                           </div>
                         </td>
                         <td className="px-10 py-6">
                           {g.dpl ? (
                             <div className="flex flex-col">
                               <span className="text-sm font-bold text-emerald-950 uppercase leading-tight mb-1">{g.dpl.nama}</span>
                               <span className="text-[10px] font-black text-emerald-600 tracking-widest font-mono">NIP: {g.dpl.nip}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-lg shadow-rose-200" />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Otoritas Kosong</span>
                             </div>
                           )}
                         </td>
                         <td className="px-10 py-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => { groupForm.setData('group_id', String(g.id)); setShowForm('group'); }}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                              >
                                {g.dpl ? 'RE-PLOTTING' : 'VALIDASI DPL'} <ArrowRight size={14} strokeWidth={3} />
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
               <table className="min-w-full divide-y divide-emerald-50">
                 <thead className="bg-emerald-50/50 text-emerald-950">
                   <tr>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Kecamatan / Kabupaten</th>
                     <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest">Otoritas Koordinator Wilayah</th>
                     <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest">
                        <button
                          onClick={() => setShowForm('region')}
                          className="h-10 px-5 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                          + Tambah Korwil
                        </button>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-emerald-50">
                   {(!districtCoordinators || districtCoordinators.length === 0) ? (
                     <EmptyState icon={Target} label="DATA KORWIL BELUM TERISI" desc="Belum ada DPL yang ditugaskan sebagai koordinator wilayah." />
                   ) : (
                     districtCoordinators.map((c) => (
                       <tr key={c.id} className="group hover:bg-emerald-50/30 transition-all">
                         <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors leading-tight mb-1.5">{c.district_name || 'N/A'}</span>
                             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{c.regency_name || 'BANYUMAS'}</span>
                           </div>
                         </td>
                         <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-emerald-950 uppercase leading-tight mb-1 mb-1.5">{c.dosen?.nama || 'N/A'}</span>
                             <span className="text-[10px] font-black text-emerald-600 tracking-widest font-mono uppercase tracking-widest">NIP: {c.dosen?.nip || '-'}</span>
                           </div>
                         </td>
                         <td className="px-10 py-6 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button
                                onClick={() => setDeletingId({ type: 'region', id: c.id })}
                                className="h-10 w-10 bg-white border-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                title="Copot Korwil"
                              >
                                <Trash2 size={18} />
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
           <div className="px-10 py-6 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] opacity-80">
                Pusat Kontrol Operasional &middot; Sistem Manajemen DPL 2026/2027
              </span>
              <Pagination
                meta={
                  (activeTab === 'assignments' ? assignments_pagination
                  : activeTab === 'groups' ? groups_pagination
                  : coordinators_pagination) as import('@/Components/ui/Pagination').PaginationMeta
                }
              />
           </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
            <Zap size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <UserCheck size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Integritas SDM Penugasan</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Protokol Kendali Mutu DPL</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                Setiap penugasan DPL harus melewati validasi kualifikasi akademik dan ketersediaan beban bimbingan. Penetapan Koordinator Wilayah (Korwil) bersifat strategis untuk menjamin kelancaran komunikasi dan pemantauan progres ABCD mahasiswa di lapangan secara intensif.
              </p>
            </div>
          </div>
        </div>

        {/* --- FORM MODALS --- */}
        
        {/* MODAL: AKTIVASI DPL */}
        <Modal show={showForm === 'period'} onClose={() => setShowForm(null)} maxWidth="lg">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden font-sans">
              <div className="px-10 py-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Aktivasi Otoritas DPL</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Registrasi Dosen Pada Periode Aktif</p>
                </div>
                <button onClick={() => setShowForm(null)} className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 transition-all shadow-sm active:scale-90"><X size={20} /></button>
              </div>
              <form onSubmit={submitPeriodAssignment} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Dosen Pendamping Lapangan <span className="text-rose-500">*</span></label>
                  <select value={periodForm.data.dosen_id} onChange={(e) => periodForm.setData('dosen_id', e.target.value)} className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-wider appearance-none" required>
                    <option value="">PILIH DOSEN DENGAN KUALIFIKASI VALID...</option>
                    {allDosen?.map((d) => (
                      <option key={d.id} value={d.id} disabled={d.is_qualified === false}>
                        {d.nama.toUpperCase()} &middot; {d.nip} {!d.is_qualified ? ` [❌ ${d.qualification_reason}]` : ''}
                      </option>
                    ))}
                  </select>
                  {allDosen?.find(d => String(d.id) === periodForm.data.dosen_id)?.is_qualified === false && (
                    <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 text-[10px] font-black text-rose-600 uppercase tracking-tight flex items-center gap-2 bg-rose-50 p-3 rounded-lg border border-rose-100">
                      <ShieldAlert size={14} /> KUALIFIKASI DITOLAK: {allDosen.find(d => String(d.id) === periodForm.data.dosen_id)?.qualification_reason?.toUpperCase()}
                    </motion.p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Periode Akademik <span className="text-rose-500">*</span></label>
                    <select value={periodForm.data.period_id} onChange={(e) => periodForm.setData('period_id', e.target.value)} className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none" required>
                      <option value="">PILIH PERIODE...</option>
                      {allPeriods?.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Kapasitas Sks/Unit <span className="text-rose-500">*</span></label>
                    <input type="number" min="1" value={periodForm.data.max_groups} onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value))} className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all tabular-nums" required />
                  </div>
                </div>
                <div className="pt-8 flex justify-end gap-3 border-t-2 border-emerald-50">
                   <button type="button" onClick={() => setShowForm(null)} className="h-12 px-8 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all active:scale-95">Batalkan</button>
                   <button type="submit" disabled={periodForm.processing} className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-3">
                     <CheckCircle2 size={16} strokeWidth={3} /> AKTIVASI DPL
                   </button>
                </div>
              </form>
          </div>
        </Modal>

        {/* MODAL: PLOTTING KELOMPOK */}
        <Modal show={showForm === 'group'} onClose={() => setShowForm(null)} maxWidth="lg">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden font-sans">
              <div className="px-10 py-6 bg-emerald-950 border-b-2 border-emerald-800 flex items-center justify-between text-white">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1.5">Validasi Otoritas Unit</h3>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Plotting Dosen Pembimbing Lapangan</p>
                </div>
                <button onClick={() => setShowForm(null)} className="h-10 w-10 bg-emerald-900 border border-emerald-800 rounded-xl flex items-center justify-center text-emerald-400 hover:text-white transition-all active:scale-90"><X size={20} /></button>
              </div>
              <form onSubmit={submitGroupAssignment} className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-6 rounded-2xl border-2 border-emerald-50 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Unit Kelompok Target</span>
                        <span className="text-base font-black text-emerald-950 uppercase">{selectedGroup ? selectedGroup.name : 'N/A'}</span>
                     </div>
                     <span className="text-xs font-black text-emerald-600 bg-white px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest font-mono">{selectedGroup?.code}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">DPL Ditetapkan <span className="text-rose-500">*</span></label>
                  <select value={groupForm.data.dpl_period_id} onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)} className="w-full h-14 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none" required>
                    <option value="">PILIH DOSEN DENGAN BEBAN TERSEDIA...</option>
                    {availableAssignments?.map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama.toUpperCase()} &middot; {a.dosen?.nip} [SISA {a.remaining_slots || 0} UNIT]</option>)}
                  </select>
                  {availableAssignments.length === 0 && (
                     <p className="mt-3 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 pl-1 animate-pulse">
                        <AlertTriangle size={14} /> PERINGATAN: TIDAK ADA DPL DENGAN KUOTA TERSEDIA PADA PERIODE INI.
                     </p>
                  )}
                </div>
                <div className="pt-8 flex justify-end gap-3 border-t-2 border-emerald-50">
                   <button type="button" onClick={() => setShowForm(null)} className="h-12 px-8 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all active:scale-95">Batalkan</button>
                   <button type="submit" disabled={groupForm.processing || availableAssignments.length === 0} className="h-12 px-10 bg-emerald-950 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-950/20 transition-all active:scale-95 flex items-center gap-3">
                     <Target size={16} /> SIMPAN PENUGASAN
                   </button>
                </div>
              </form>
          </div>
        </Modal>

        {/* MODAL: KORWIL */}
        <Modal show={showForm === 'region'} onClose={() => setShowForm(null)} maxWidth="lg">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden font-sans">
              <div className="px-10 py-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Penunjukan Korwil</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Koordinator Wilayah Geografis</p>
                </div>
                <button onClick={() => setShowForm(null)} className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 transition-all active:scale-90"><X size={20} /></button>
              </div>
              <form onSubmit={submitDistrictCoordinator} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Wilayah Kecamatan <span className="text-rose-500">*</span></label>
                  <select value={coordForm.data.district_id} onChange={(e) => coordForm.setData('district_id', e.target.value)} className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none" required>
                    <option value="">PILIH WILAYAH...</option>
                    {districts?.map((d) => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">DPL Ditetapkan <span className="text-rose-500">*</span></label>
                  <select value={coordForm.data.dpl_period_id} onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)} className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none" required>
                    <option value="">PILIH DOSEN DPL AKTIF...</option>
                    {assignments?.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama.toUpperCase()} &middot; {a.dosen?.nip}</option>)}
                  </select>
                </div>
                <div className="pt-8 flex justify-end gap-3 border-t-2 border-emerald-50">
                   <button type="button" onClick={() => setShowForm(null)} className="h-12 px-8 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all active:scale-95">Batalkan</button>
                   <button type="submit" disabled={coordForm.processing} className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-3">
                     <ShieldCheck size={16} /> TETAPKAN KORWIL
                   </button>
                </div>
              </form>
          </div>
        </Modal>

        {/* MODAL: IMPOR EXCEL */}
        <Modal show={showForm === 'import'} onClose={() => setShowForm(null)} maxWidth="lg">
           <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden font-sans">
              <div className="px-10 py-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Transmisi Data Massal</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Impor Direktori Penugasan Melalui File</p>
                </div>
                <button onClick={() => setShowForm(null)} className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 transition-all active:scale-90"><X size={20} /></button>
              </div>
              <form onSubmit={submitImport} className="p-10 space-y-10">
                <div className="border-4 border-dashed border-emerald-50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-6 hover:bg-emerald-50/30 transition-all relative group/upload shadow-inner">
                  <div className="h-20 w-20 rounded-[1.5rem] bg-white border-2 border-emerald-50 shadow-sm flex items-center justify-center text-emerald-600 group-hover/upload:scale-110 group-hover/upload:rotate-12 transition-all">
                    <Upload size={32} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    {importForm.data.file ? (
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-sm font-black text-emerald-950 uppercase tracking-tight">{importForm.data.file.name}</span>
                         <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">SIAP UNTUK TRANSMISI</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-black text-emerald-950 uppercase tracking-tighter">Otorisasi Berkas Excel</p>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic leading-none">FORMAT: .XLSX, .CSV (MAX: 10MB)</p>
                      </>
                    )}
                  </div>
                  <input type="file" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required accept=".xlsx,.csv" />
                </div>
                
                <div className="bg-emerald-950 rounded-[2rem] p-8 flex items-start gap-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 -mr-8 -mt-8"><Info size={100} /></div>
                   <div className="flex flex-col gap-2 relative z-10">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Instruksi Otoritas</span>
                      <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest leading-relaxed">Pastikan header kolom sesuai dengan template standar universitas guna menghindari korupsi data pada saat pemrosesan basis data utama.</p>
                   </div>
                </div>

                <div className="pt-8 flex justify-end gap-3 border-t-2 border-emerald-50">
                   <button type="button" onClick={() => setShowForm(null)} className="h-12 px-8 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all active:scale-95">Batalkan</button>
                   <button type="submit" disabled={importForm.processing} className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-3">
                     <Zap size={16} /> JALANKAN TRANSMISI
                   </button>
                </div>
              </form>
           </div>
        </Modal>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="OTORISASI PENCABUTAN TUGAS"
        message={`Apakah Anda yakin ingin melenyapkan otoritas ${deletingId?.type === 'period' ? 'aktivasi periode dpl' : 'koordinator wilayah'} ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.`}
        confirmVariant="danger"
        confirmLabel="YA, CABUT OTORITAS"
      />
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, type, desc }: { label: string; value: any; icon: any; type: 'success' | 'warning' | 'danger'; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2", 
        type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
        type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{typeof value === 'number' ? value.toLocaleString('id-ID') : (value ?? '0')}</span>
        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap outline-none uppercase tracking-[0.15em]',
        active ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-900/10' : 'text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50'
      )}
    >
      <Icon size={14} strokeWidth={3} /> {label}
    </button>
  );
}

function EmptyState({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-10 py-32 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-100 mb-2">
            <Icon size={40} strokeWidth={1} />
          </div>
          <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">{label}</span>
          <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">{desc}</p>
        </div>
      </td>
    </tr>
  );
}

function Info({ size, className, strokeWidth }: { size: number; className?: string; strokeWidth?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth ?? 2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
