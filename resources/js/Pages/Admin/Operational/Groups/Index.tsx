import { type FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  Download, MapPin, Pencil, Plus, Search, Trash2, Users, UserCheck, Filter, CheckCircle2, Activity, Layers
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Group {
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: string;
  registrations_count: number;
  approved_participants_count: number;
  pending_participants_count: number;
  available_slots: number;
  ready_for_placement: boolean;
  placement_note: string;
  period?: { id: number; name: string } | null;
  location?: {
    id: number;
    village_name: string;
    district_name?: string | null;
    regency_name?: string | null;
    full_name: string;
  } | null;
  main_lecturer?: { id: number; name: string } | null;
}

interface Summary {
  total_groups: number;
  active_groups: number;
  draft_groups: number;
  groups_without_main_lecturer: number;
  groups_ready_for_placement: number;
  total_available_slots: number;
}

interface Props {
  groups: {
    data: Group[];
    meta: PaginationMeta;
  };
  periods: Array<{ id: number; name: string }>;
  locations: Array<{ id: number; village_name: string; full_name: string }>;
  lecturers: Array<{ id: number; name: string }>;
  filters: {
    search?: string;
    period_id?: string | number;
    status?: string;
  };
  ui?: {
    can_manage?: boolean;
  };
  summary: Summary;
}

type GroupFormData = {
  period_id: string;
  location_id: string;
  lead_lecturer_id: string;
  name: string;
  capacity: string;
  status: 'draft' | 'active' | 'closed';
};

const initialFormData: GroupFormData = {
  period_id: '',
  location_id: '',
  lead_lecturer_id: '',
  name: '',
  capacity: '10',
  status: 'draft',
};

export default function GroupsIndex({
  groups = { data: [], meta: { total: 0, current_page: 1, per_page: 15 } },
  periods = [],
  locations = [],
  lecturers = [],
  filters = {},
  ui = {},
  summary = { total_groups: 0, active_groups: 0, draft_groups: 0, groups_without_main_lecturer: 0, groups_ready_for_placement: 0, total_available_slots: 0 },
}: Props) {
  const [search, setSearch] = useState(filters?.search ?? '');
  const [periodId, setPeriodId] = useState(filters?.period_id ? String(filters.period_id) : '');
  const [status, setStatus] = useState(filters?.status ? String(filters.status) : '');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<GroupFormData>(initialFormData);
  const canManage = ui?.can_manage ?? false;

  const handleApplyFilters = () => {
    router.get(
      route('admin.kelompok.index'),
      {
        search: search || undefined,
        period_id: periodId || undefined,
        status: status || undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const openCreateForm = () => {
    setEditingGroup(null);
    form.reset();
    form.clearErrors();
    setShowForm(true);
  };

  const openEditForm = (group: Group) => {
    setEditingGroup(group);
    form.clearErrors();
    form.setData({
      period_id: String(group.period?.id ?? ''),
      location_id: String(group.location?.id ?? ''),
      lead_lecturer_id: String(group.main_lecturer?.id ?? ''),
      name: group.name,
      capacity: String(group.capacity),
      status: (group.status as GroupFormData['status']) ?? 'draft',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGroup(null);
    form.reset();
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form.data,
      nama_kelompok: form.data.name,
      lecturers: form.data.lead_lecturer_id
        ? [{ id: Number(form.data.lead_lecturer_id), role: 'Ketua' }]
        : [],
    };

    if (editingGroup) {
      router.put(route('admin.kelompok.update', editingGroup.id), payload, {
        preserveScroll: true,
        onSuccess: () => closeForm(),
      });
    } else {
      router.post(route('admin.kelompok.store'), payload, {
        preserveScroll: true,
        onSuccess: () => closeForm(),
      });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      router.delete(route('admin.kelompok.destroy', deletingId), {
        preserveScroll: true,
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  return (
    <AppLayout title="Data Kelompok">
      <Head title="Manajemen Kelompok" />

      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                 <Layers size={16} className="text-emerald-600" />
                 <span className="text-sm font-medium text-gray-500">Operasional Sistem KKN</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">Manajemen Kelompok KKN</h1>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <Link
               href={route('admin.kelompok.template')}
               className="h-10 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center justify-center gap-2 text-sm font-medium"
             >
               <Download size={16} /> Unduh Template
             </Link>
             <button
               onClick={openCreateForm}
               disabled={!canManage}
               className="h-10 px-4 bg-emerald-600 border border-transparent text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Plus size={16} /> Tambah Kelompok
             </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <MetricCard label="Total Kelompok" value={summary?.total_groups ?? 0} icon={Layers} />
           <MetricCard label="Kelompok Aktif" value={summary?.active_groups ?? 0} icon={Activity} />
           <MetricCard label="Belum Ada DPL" value={summary?.groups_without_main_lecturer ?? 0} icon={UserCheck} highlight={summary?.groups_without_main_lecturer > 0} color="amber" />
           <MetricCard label="Kapasitas Sisa" value={summary?.total_available_slots ?? 0} icon={Users} color="emerald" />
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
           {/* FILTER BAR */}
           <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:max-w-md">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                   className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                   placeholder="Cari kelompok, wilayah, dosen..."
                 />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                 <select
                   value={periodId}
                   onChange={(e) => setPeriodId(e.target.value)}
                   className="w-full sm:w-auto h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                 >
                   <option value="">Semua Periode</option>
                   {(periods || []).map((p) => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
                 
                 <select
                   value={status}
                   onChange={(e) => setStatus(e.target.value)}
                   className="w-full sm:w-auto h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                 >
                   <option value="">Semua Status</option>
                   <option value="draft">Penyusunan (Draft)</option>
                   <option value="active">Aktif</option>
                   <option value="closed">Selesai</option>
                 </select>

                 <button
                   onClick={handleApplyFilters}
                   className="w-full sm:w-auto h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                   <Filter size={16} className="text-gray-500" /> Saring
                 </button>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500">Kelompok & Kode</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500">Lokasi Penugasan</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status & DPL</th>
                   <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500">Kapasitas</th>
                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500">Aksi</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {groups?.data?.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                       <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" strokeWidth={1} />
                       Belum ada data kelompok ditemukan.
                     </td>
                   </tr>
                 ) : (
                   groups?.data?.map((group) => (
                     <tr key={group.id} className="hover:bg-gray-50 transition-colors group">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col">
                           <span className="text-sm font-semibold text-gray-900">{group.name}</span>
                           <span className="text-xs text-gray-500 mt-0.5">Kode: {group.code}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col max-w-xs">
                           <div className="flex items-start gap-1.5 text-sm text-gray-900">
                             <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                             <span className="line-clamp-2">{group.location?.full_name || 'Lokasi belum diatur'}</span>
                           </div>
                           <span className="text-xs text-gray-500 mt-1">Periode: {group.period?.name || '-'}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                             <span className={clsx(
                               'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                               group.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                               group.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                             )}>
                               {group.status === 'draft' ? 'Penyusunan' : group.status === 'active' ? 'Aktif' : 'Terkunci'}
                             </span>
                             {group.ready_for_placement && (
                               <CheckCircle2 size={16} className="text-emerald-500" title="Siap Plotting" />
                             )}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs text-gray-600">
                             <UserCheck size={14} className="text-gray-400" />
                             <span className="truncate max-w-[150px]">{group.main_lecturer?.name || 'Belum Ada DPL'}</span>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col gap-1.5 w-24 mx-auto">
                           <div className="flex justify-between text-xs font-semibold">
                             <span className="text-gray-900">{group.approved_participants_count}</span>
                             <span className="text-gray-500">/ {group.capacity}</span>
                           </div>
                           <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div className={clsx("h-full transition-all", (group.approved_participants_count / group.capacity) >= 1 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, (group.approved_participants_count / group.capacity) * 100)}%` }} />
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                         <div className="flex items-center justify-end gap-2">
                           <Link 
                             href={route('admin.kelompok.show', group.id)} 
                             className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors"
                           >
                             Detail
                           </Link>
                           {canManage && (
                             <>
                               <button onClick={() => openEditForm(group)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent" title="Edit">
                                 <Pencil size={16} />
                               </button>
                               <button onClick={() => setDeletingId(group.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent" title="Hapus">
                                 <Trash2 size={16} />
                               </button>
                             </>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>

           {groups?.meta && (
             <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
               <span className="text-xs text-gray-500">
                 Menampilkan <strong>{groups.data.length}</strong> dari total <strong>{groups.meta.total}</strong> kelompoks
               </span>
               <Pagination meta={groups.meta} />
             </div>
           )}
        </div>

        {/* FORM MODAL */}
        <Modal show={showForm} onClose={closeForm} title={editingGroup ? 'Edit Kelompok' : 'Buat Kelompok Baru'} maxWidth="md">
           <form onSubmit={submitForm} className="p-6 space-y-5">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Periode Program</label>
                 <select
                   value={form.data.period_id}
                   onChange={(e) => form.setData('period_id', e.target.value)}
                   className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                   required
                 >
                   <option value="">Pilih Periode</option>
                   {(periods || []).map((p) => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah Penugasan</label>
                 <select
                   value={form.data.location_id}
                   onChange={(e) => form.setData('location_id', e.target.value)}
                   className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                   required
                 >
                   <option value="">Pilih Lokasi Wilayah</option>
                   {(locations || []).map((l) => (
                     <option key={l.id} value={l.id}>{l.full_name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok</label>
                 <input
                   type="text"
                   value={form.data.name}
                   onChange={(e) => form.setData('name', e.target.value)}
                   className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                   placeholder="Cth: Kelompok 45 Desa Karangduren"
                   required
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Maksimal</label>
                   <input
                     type="number"
                     min="1"
                     value={form.data.capacity}
                     onChange={(e) => form.setData('capacity', e.target.value)}
                     className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <select
                     value={form.data.status}
                     onChange={(e) => form.setData('status', e.target.value as any)}
                     className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                     required
                   >
                     <option value="draft">Penyusunan (Draft)</option>
                     <option value="active">Aktif</option>
                     <option value="closed">Terkunci</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pendamping (DPL)</label>
                 <select
                   value={form.data.lead_lecturer_id}
                   onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
                   className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                 >
                   <option value="">(Belum Diatur)</option>
                   {(lecturers || []).map((l) => (
                     <option key={l.id} value={l.id}>{l.name}</option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="pt-5 mt-5 flex justify-end gap-3 border-t border-gray-200">
               <button
                 type="button"
                 onClick={closeForm}
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
               >
                 Batal
               </button>
               <button
                 type="submit"
                 disabled={form.processing}
                 className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
               >
                 {editingGroup ? 'Simpan Perubahan' : 'Buat Kelompok'}
               </button>
             </div>
           </form>
        </Modal>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Kelompok KKN"
        message="Kelompok KKN serta pendaftar di dalamnya akan dilepaskan secara permanen. Lanjutkan penghapusan?"
        confirmVariant="danger"
        confirmLabel="Hapus Kelompok"
      />
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, highlight, color = 'emerald' }: { label: string; value: number | string; icon: any; highlight?: boolean; color?: string }) {
  const isAmber = highlight || color === 'amber';
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden h-28">
      {isAmber && <div className="absolute top-0 right-0 p-1.5"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span></div>}
      <div className="flex justify-between items-start z-10">
        <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center", isAmber ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="z-10 mt-2">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
