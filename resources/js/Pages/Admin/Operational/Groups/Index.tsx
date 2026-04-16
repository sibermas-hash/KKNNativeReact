import { type FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  Download, MapPin, Pencil, Plus, Search, Trash2, Users, UserCheck, Filter, CheckCircle2, Activity, Layers, ArrowRight
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

export default function GroupsIndex({
  groups = { data: [], meta: { total: 0, current_page: 1, per_page: 15, from: 0, to: 0, path: '', links: [], last_page: 1 } },
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
    setTimeout(() => {
        setEditingGroup(null);
        form.reset();
    }, 300);
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

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10 max-w-[1600px] mx-auto font-sans pb-16"
      >
        
        {/* PREMIUM HEADER CARD */}
        <motion.div variants={itemVariants} className="overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white p-10 lg:p-12 shadow-sm relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Layers size={20} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Operasional Sistem KKN</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-emerald-950 tracking-tight">Manajemen Kelompok KKN</h1>
              <p className="text-sm font-semibold text-emerald-700 max-w-xl">Alokasi, penempatan, dan monitoring kelompok KKN beserta kapasitas dan dosen pembimbing.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={route('admin.kelompok.template')}
                className="h-12 px-6 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
              >
                <Download size={16} /> Unduh Template
              </Link>
              <button
                onClick={openCreateForm}
                disabled={!canManage}
                className="h-12 px-7 bg-emerald-600 border border-transparent text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-xl focus:outline-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={18} strokeWidth={2.5} /> Tambah Kelompok
              </button>
            </div>
          </div>

          {/* INLINE METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-emerald-50 relative z-10">
            {[
              { label: 'Total Kelompok', value: summary?.total_groups ?? 0, icon: Layers, color: 'emerald' },
              { label: 'Kelompok Aktif', value: summary?.active_groups ?? 0, icon: Activity, color: 'emerald' },
              { label: 'Belum Ada DPL', value: summary?.groups_without_main_lecturer ?? 0, icon: UserCheck, color: summary?.groups_without_main_lecturer > 0 ? 'amber' : 'emerald' },
              { label: 'Kapasitas Sisa', value: summary?.total_available_slots ?? 0, icon: Users, color: 'emerald' },
            ].map((m) => {
              const isAmber = m.color === 'amber';
              return (
                <div key={m.label} className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-5 flex items-center gap-4 group/metric hover:bg-white hover:shadow-lg hover:shadow-emerald-900/5 transition-all">
                  <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover/metric:scale-110", isAmber ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                    <m.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-emerald-950 leading-none tabular-nums">{m.value}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mt-1">{m.label}</p>
                  </div>
                  {isAmber && <span className="ml-auto relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* DATA TABLE CARD */}
        <motion.div variants={itemVariants} className="bg-white border border-emerald-100 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 overflow-hidden flex flex-col">
           {/* SEARCH & FILTER BAR */}
           <div className="px-8 lg:px-10 py-6 border-b border-emerald-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-extrabold text-emerald-950">Daftar Kelompok</h3>
                <div className="h-8 px-3 bg-emerald-50 rounded-lg flex items-center text-xs font-bold text-emerald-600 tabular-nums">{groups.meta.total} total</div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    className="w-full h-11 pl-11 pr-4 bg-emerald-50/50 border border-emerald-100/60 rounded-xl text-sm font-semibold text-emerald-950 placeholder:text-emerald-300 placeholder:font-normal focus:border-emerald-500 focus:ring-0 transition-all"
                    placeholder="Cari kelompok..."
                  />
                </div>
                <select
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className="w-full sm:w-auto h-11 pl-4 pr-10 rounded-xl border border-emerald-100/60 bg-emerald-50/50 text-sm font-semibold text-emerald-950 focus:border-emerald-500 focus:ring-0 outline-none transition-all"
                >
                  <option value="">Semua Periode</option>
                  {(periods || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full sm:w-auto h-11 pl-4 pr-10 rounded-xl border border-emerald-100/60 bg-emerald-50/50 text-sm font-semibold text-emerald-950 focus:border-emerald-500 focus:ring-0 outline-none transition-all"
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Penyusunan (Draft)</option>
                  <option value="active">Aktif</option>
                  <option value="closed">Selesai</option>
                </select>

                <button
                  onClick={handleApplyFilters}
                  className="w-full sm:w-auto h-11 px-6 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 focus:outline-none transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Filter size={16} strokeWidth={2.5} /> Saring
                </button>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="min-w-full">
               <thead className="bg-emerald-950">
                 <tr>
                   <th scope="col" className="px-8 py-5 text-left text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Kelompok & Kode</th>
                   <th scope="col" className="px-8 py-5 text-left text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Lokasi Penugasan</th>
                   <th scope="col" className="px-8 py-5 text-left text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Status & DPL</th>
                   <th scope="col" className="px-8 py-5 text-center text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Kapasitas</th>
                   <th scope="col" className="px-8 py-5 text-right text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-emerald-50">
                 {groups?.data?.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-8 py-24 text-center">
                       <Layers className="mx-auto h-16 w-16 text-emerald-200 mb-4" strokeWidth={1} />
                       <p className="text-sm font-bold text-emerald-950 uppercase tracking-wider opacity-40">Belum ada data kelompok</p>
                     </td>
                   </tr>
                 ) : (
                   groups?.data?.map((group) => (
                     <tr key={group.id} className="hover:bg-emerald-50/30 transition-colors group/row">
                       <td className="px-8 py-6 whitespace-nowrap">
                         <div className="flex flex-col">
                           <span className="text-base font-extrabold text-emerald-950">{group.name}</span>
                           <span className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">{group.code}</span>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                         <div className="flex flex-col max-w-xs">
                           <div className="flex items-start gap-2 text-sm font-semibold text-emerald-900">
                             <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                             <span className="line-clamp-2">{group.location?.full_name || 'Lokasi belum diatur'}</span>
                           </div>
                           <span className="text-[11px] font-bold text-emerald-600/50 mt-1.5 ml-6 uppercase tracking-wider">Periode: {group.period?.name || '-'}</span>
                         </div>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                         <div className="flex flex-col gap-2.5">
                           <div className="flex items-center gap-2">
                             <span className={clsx(
                               'inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-widest',
                               group.status === 'active' ? 'bg-emerald-100 text-emerald-900' : 
                               group.status === 'closed' ? 'bg-emerald-950 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                             )}>
                               {group.status === 'draft' ? 'Penyusunan' : group.status === 'active' ? 'Aktif' : 'Selesai'}
                             </span>
                             {group.ready_for_placement && (
                               <span title="Siap Plotting"><CheckCircle2 size={16} className="text-emerald-500" /></span>
                             )}
                           </div>
                           <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                             <UserCheck size={14} className="text-emerald-600 shrink-0" />
                             <span className="truncate max-w-[160px]">{group.main_lecturer?.name || 'BELUM ADA DPL'}</span>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                         <div className="flex flex-col gap-2 w-32 mx-auto">
                           <div className="flex justify-between text-xs font-bold">
                             <span className="text-emerald-950 text-lg tabular-nums">{group.approved_participants_count}</span>
                             <span className="text-emerald-600/60 font-semibold tracking-wider self-end">/ {group.capacity}</span>
                           </div>
                           <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                             <div className={clsx("h-full transition-all rounded-full", (group.approved_participants_count / group.capacity) >= 1 ? 'bg-emerald-600' : 'bg-emerald-400')} style={{ width: `${Math.min(100, (group.approved_participants_count / group.capacity) * 100)}%` }} />
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                           <Link 
                             href={route('admin.kelompok.show', group.id)} 
                             className="h-10 px-5 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                           >
                             Detail <ArrowRight size={14} />
                           </Link>
                           {canManage && (
                             <>
                               <button onClick={() => openEditForm(group)} className="h-10 w-10 flex items-center justify-center text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-xl transition-colors bg-white border border-emerald-200" title="Edit">
                                 <Pencil size={16} />
                               </button>
                               <button onClick={() => setDeletingId(group.id)} className="h-10 w-10 flex items-center justify-center text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-colors bg-white border border-rose-200" title="Hapus">
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
             <div className="px-8 lg:px-10 py-6 border-t border-emerald-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider opacity-60">
                 Menampilkan <strong className="text-emerald-700">{groups.data.length}</strong> dari <strong className="text-emerald-700">{groups.meta.total}</strong> Kelompok
               </span>
               <Pagination meta={groups.meta} />
             </div>
           )}
        </motion.div>

        {/* FORM MODAL */}
        <Modal show={showForm} onClose={closeForm} maxWidth="xl">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-emerald-100 bg-emerald-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-extrabold text-emerald-950 uppercase tracking-tight">
                            {editingGroup ? 'Edit Kelompok' : 'Buat Kelompok Baru'}
                        </h2>
                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                            {editingGroup ? `Memperbarui data ${editingGroup.name}` : 'Registrasi grup penempatan mahasiswa'}
                        </p>
                    </div>
                </div>
                <form onSubmit={submitForm} className="p-8 space-y-6">
                 <div className="space-y-6">
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Periode Program</label>
                     <select
                       value={form.data.period_id}
                       onChange={(e) => form.setData('period_id', e.target.value)}
                       className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                       required
                     >
                       <option value="">Pilih Periode Aktif</option>
                       {(periods || []).map((p) => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Wilayah Penugasan</label>
                     <select
                       value={form.data.location_id}
                       onChange={(e) => form.setData('location_id', e.target.value)}
                       className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                       required
                     >
                       <option value="">Pilih Lokasi Wilayah Geografis</option>
                       {(locations || []).map((l) => (
                         <option key={l.id} value={l.id}>{l.full_name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Nama Formil Kelompok</label>
                     <input
                       type="text"
                       value={form.data.name}
                       onChange={(e) => form.setData('name', e.target.value)}
                       className="w-full h-12 px-4 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                       placeholder="Cth: Kelompok 45 Desa Karangduren"
                       required
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Daya Tampung (Kuota)</label>
                       <input
                         type="number"
                         min="1"
                         value={form.data.capacity}
                         onChange={(e) => form.setData('capacity', e.target.value)}
                         className="w-full h-12 px-4 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Status Deployment</label>
                       <select
                         value={form.data.status}
                         onChange={(e) => form.setData('status', e.target.value as any)}
                         className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                         required
                       >
                         <option value="draft">Mode Penyusunan (Draft)</option>
                         <option value="active">Mode Penempatan (Aktif)</option>
                         <option value="closed">Terkunci (Kelompok Final)</option>
                       </select>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Ketua DPL Pembimbing</label>
                     <select
                       value={form.data.lead_lecturer_id}
                       onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
                       className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                     >
                       <option value="">(Belum Diatur)</option>
                       {(lecturers || []).map((l) => (
                         <option key={l.id} value={l.id}>{l.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-emerald-100">
                   <button
                     type="button"
                     onClick={closeForm}
                     className="h-12 px-6 text-sm font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                   >
                     Batal
                   </button>
                   <button
                     type="submit"
                     disabled={form.processing}
                     className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                   >
                     {editingGroup ? 'Simpan Perubahan' : 'Deploy Kelompok'}
                   </button>
                 </div>
               </form>
            </div>
        </Modal>
      </motion.div>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Konfirmasi Penghapusan Kelompok"
        message="Kelompok KKN ini beserta alokasi pendaftar di dalamnya akan dihapus secara permanen. Apakah Anda yakin ingin melanjutkan?"
        confirmVariant="danger"
        confirmLabel="Ya, Hapus Kelompok"
      />
    </AppLayout>
  );
}

