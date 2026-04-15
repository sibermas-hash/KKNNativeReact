import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
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
  UserCheck
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
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
    <AppLayout title="Penugasan Dosen Pembimbing">
      <Head title="Manajemen DPL" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                 <Briefcase size={16} className="text-emerald-600" />
                 <span className="text-sm font-medium text-gray-500">Operasional SDM Terpadu</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">Manajemen Penugasan DPL</h1>
             <p className="text-sm text-gray-500 max-w-2xl mt-1">
               Kelola aktivasi Dosen Pembimbing Lapangan, plotting kelompok, dan penunjukan koordinator wilayah (Korwil).
             </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
             <button
               onClick={() => setShowForm('import')}
               className="h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center justify-center gap-2 text-sm font-medium"
             >
               <FileSpreadsheet size={16} /> Impor Data
             </button>
             <button
               onClick={() => setShowForm('period')}
               className="h-10 px-4 bg-emerald-600 text-white border border-transparent rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
             >
               <UserPlus size={16} /> Aktivasi DPL Baru
             </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <MetricCard label="DPL Aktif" value={summary?.active_assignments} icon={UserCheck} />
           <MetricCard label="Total Kelompok" value={summary?.groups_total} icon={Briefcase} />
           <MetricCard label="Belum Ada DPL" value={summary?.groups_without_dpl} icon={AlertTriangle} color={summary?.groups_without_dpl && summary.groups_without_dpl > 0 ? 'amber' : 'emerald'} />
           <MetricCard label="Aktivasi Plotting" value={summary?.active_groups_without_dpl} icon={Activity} color={summary?.active_groups_without_dpl && summary.active_groups_without_dpl > 0 ? 'rose' : 'emerald'} />
           <MetricCard label="Korwil Terdaftar" value={summary?.district_coordinators} icon={MapPinned} />
        </div>

        {/* MAIN PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
           {/* TABS & SEARCH */}
           <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center p-1 bg-gray-100 rounded-lg overflow-x-auto w-full md:w-auto border border-gray-200">
                 <TabButton active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} label="DPL Terdaftar" icon={ShieldCheck} />
                 <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Plotting Kelompok" icon={Users} />
                 <TabButton active={activeTab === 'regions'} onClick={() => setActiveTab('regions')} label="Koordinator Wilayah" icon={Target} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="relative w-full md:w-80">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                   placeholder="Cari NIP, nama, wilayah..."
                 />
              </form>
           </div>

           {/* CONTENT AREA */}
           <div className="overflow-x-auto min-h-[400px]">
             {activeTab === 'assignments' && (
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nama & NIP</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Periode Bertugas</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Beban Bimbingan</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {(!assignments || assignments.length === 0) ? (
                     <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">Tidak ada data DPL yang terdaftar.</td></tr>
                   ) : (
                     assignments.map((a) => (
                       <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-900">{a.dosen?.nama || 'N/A'}</span>
                             <span className="text-xs text-gray-500">NIP: {a.dosen?.nip || '-'}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className="text-sm text-gray-700">{a.period?.name || 'Unknown'}</span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1.5 w-32 mx-auto">
                             <div className="flex justify-between w-full text-xs font-medium">
                               <span className="text-gray-900">{a.current_groups || 0}</span>
                               <span className="text-gray-500">/ {a.max_groups || 0} Kelompok</span>
                             </div>
                             <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, ((a.current_groups || 0) / (a.max_groups || 1)) * 100)}%` }} />
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => setDeletingId({ type: 'period', id: a.id })}
                             className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent"
                             title="Hapus"
                           >
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             )}

             {activeTab === 'groups' && (
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Identitas Kelompok</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Wilayah</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">DPL Pengampu</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {(!groups || groups.length === 0) ? (
                     <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">Tidak ada data kelompok.</td></tr>
                   ) : (
                     groups.map((g) => (
                       <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-900">{g.name}</span>
                             <span className="text-xs text-gray-500">Kode: {g.code} &middot; {g.status}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-sm text-gray-700">{g.location?.district_name || 'N/A'}</span>
                         </td>
                         <td className="px-6 py-4">
                           {g.dpl ? (
                             <div className="flex flex-col">
                               <span className="text-sm font-medium text-gray-900">{g.dpl.nama}</span>
                               <span className="text-xs text-gray-500">NIP: {g.dpl.nip}</span>
                             </div>
                           ) : (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                               Belum Ada DPL
                             </span>
                           )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => { groupForm.setData('group_id', String(g.id)); setShowForm('group'); }}
                             className="px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-md text-xs font-medium transition-colors"
                           >
                             Plotting DPL
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             )}

             {activeTab === 'regions' && (
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Kecamatan / Kabupaten</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Koordinator Bertugas</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                       <button
                         onClick={() => setShowForm('region')}
                         className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                       >
                         Tambah Korwil
                       </button>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {(!districtCoordinators || districtCoordinators.length === 0) ? (
                     <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">Data Korwil belum tersedia.</td></tr>
                   ) : (
                     districtCoordinators.map((c) => (
                       <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-900">{c.district_name || 'N/A'}</span>
                             <span className="text-xs text-gray-500">{c.regency_name || '-'}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-gray-900">{c.dosen?.nama || 'N/A'}</span>
                             <span className="text-xs text-gray-500">NIP: {c.dosen?.nip || '-'}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => setDeletingId({ type: 'region', id: c.id })}
                             className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent"
                             title="Hapus"
                           >
                             <Trash2 size={16} />
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
           <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Paginasi Data {activeTab === 'assignments' ? 'Aktivasi' : activeTab === 'groups' ? 'Kelompok' : 'Korwil'}
              </span>
              <Pagination
                meta={
                  activeTab === 'assignments' ? assignments_pagination
                  : activeTab === 'groups' ? groups_pagination
                  : coordinators_pagination
                }
              />
           </div>
        </div>

        {/* MODAL: AKTIVASI DPL */}
        <Modal show={showForm === 'period'} onClose={() => setShowForm(null)} title="Aktivasi DPL Baru" maxWidth="md">
          <form onSubmit={submitPeriodAssignment} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pendamping</label>
              <select value={periodForm.data.dosen_id} onChange={(e) => periodForm.setData('dosen_id', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required>
                <option value="">Pilih Dosen...</option>
                {allDosen?.map((d) => <option key={d.id} value={d.id}>{d.nama} ({d.nip})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                <select value={periodForm.data.period_id} onChange={(e) => periodForm.setData('period_id', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required>
                  <option value="">Pilih</option>
                  {allPeriods?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Maksimal</label>
                <input type="number" min="1" value={periodForm.data.max_groups} onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200">
               <button type="button" onClick={() => setShowForm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Batal</button>
               <button type="submit" disabled={periodForm.processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">Aktivasi</button>
            </div>
          </form>
        </Modal>

        {/* MODAL: PLOTTING KELOMPOK */}
        <Modal show={showForm === 'group'} onClose={() => setShowForm(null)} title="Plotting Kelompok KKN" maxWidth="md">
          <form onSubmit={submitGroupAssignment} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelompok Target</label>
              <select value={groupForm.data.group_id} disabled className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm text-gray-500">
                <option value="">{selectedGroup ? `${selectedGroup.code} - ${selectedGroup.name}` : ''}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DPL Tersedia</label>
              <select value={groupForm.data.dpl_period_id} onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required>
                <option value="">Pilih Dosen Bimbingan...</option>
                {availableAssignments?.map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama || 'N/A'} (Sisa {a.remaining_slots || 0})</option>)}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200">
               <button type="button" onClick={() => setShowForm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Batal</button>
               <button type="submit" disabled={groupForm.processing || availableAssignments.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">Simpan Detail</button>
            </div>
          </form>
        </Modal>

        {/* MODAL: KORWIL */}
        <Modal show={showForm === 'region'} onClose={() => setShowForm(null)} title="Tambah Koordinator Wilayah" maxWidth="md">
          <form onSubmit={submitDistrictCoordinator} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
              <select value={coordForm.data.district_id} onChange={(e) => coordForm.setData('district_id', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required>
                <option value="">Pilih Wilayah...</option>
                {districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DPL Ditetapkan</label>
              <select value={coordForm.data.dpl_period_id} onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" required>
                <option value="">Pilih Dosen...</option>
                {assignments?.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.dosen?.nama || 'N/A'}</option>)}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200">
               <button type="button" onClick={() => setShowForm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Batal</button>
               <button type="submit" disabled={coordForm.processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">Pilih Korwil</button>
            </div>
          </form>
        </Modal>

        {/* MODAL: IMPOR EXCEL */}
        <Modal show={showForm === 'import'} onClose={() => setShowForm(null)} title="Impor Data Massal" maxWidth="md">
          <form onSubmit={submitImport} className="p-6 space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors relative">
              <Upload size={32} className="text-gray-400" />
              <div className="text-sm text-gray-600 text-center">
                {importForm.data.file ? (
                  <span className="font-semibold text-emerald-600">{importForm.data.file.name}</span>
                ) : (
                  <><span>Klik untuk unggah</span> atau seret file XPS/CSV kesini</>
                )}
              </div>
              <input type="file" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required accept=".xlsx,.csv" />
            </div>
            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200">
               <button type="button" onClick={() => setShowForm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Batal</button>
               <button type="submit" disabled={importForm.processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">Jalankan Impor</button>
            </div>
          </form>
        </Modal>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Data"
        message={`Data ${deletingId?.type === 'period' ? 'aktivasi periode' : 'koordinator wilayah'} ini akan dihapus. Lanjutkan?`}
        confirmVariant="danger"
        confirmLabel="Hapus Permanen"
      />
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color = 'slate' }: { label: string; value: number | string | undefined; icon: LucideIcon; color?: 'emerald' | 'amber' | 'rose' | 'slate' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={clsx("w-10 h-10 rounded-lg flex flex-col items-center justify-center", color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-600')}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight">{typeof value === 'number' ? value.toLocaleString() : (value ?? '0')}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
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
        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap outline-none',
        active ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent'
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
