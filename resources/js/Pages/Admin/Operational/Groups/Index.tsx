import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  Download,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  UserCheck,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Zap,
  Target,
  Activity,
  Filter,
  X,
  Database,
  Info,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination, Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showFilters, setShowFilters] = useState(false);
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
    <AppLayout title="Direktori Kelompok KKN">
      <Head title="Kelompok KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Target size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Alokasi & Manajemen Unit</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Kelompok <span className="text-emerald-500">KKN.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Pusat Kendali Plotting Mahasiswa dan Strategi Penugasan Wilayah Terpadu
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Link
                        href={route('admin.kelompok.template')}
                        className="h-14 px-8 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-3 text-xs font-bold active:scale-95 uppercase tracking-widest"
                    >
                        <Download size={18} /> UNDUH TEMPLATE
                    </Link>
                    <button
                        onClick={openCreateForm}
                        disabled={!canManage}
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider"
                    >
                        <Plus size={22} /> TAMBAH KELOMPOK
                    </button>
                </div>
            </div>
        </div>

        {/* --- STATS GRID --- */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Kelompok" value={summary?.total_groups ?? 0} icon={Layers3} color="emerald" />
          <StatCard label="Kelompok Aktif" value={summary?.active_groups ?? 0} icon={Activity} color="sky" />
          <StatCard label="Tanpa DPL" value={summary?.groups_without_main_lecturer ?? 0} icon={UserCheck} color="rose" />
          <StatCard label="Sisa Kuota" value={summary?.total_available_slots ?? 0} icon={Users} color="slate" />
        </div>

        {/* --- SEARCH & FILTER BAR --- */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/20">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-white border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Search size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Pencarian Unit</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Filter berdasarkan kriteria spesifik</p>
              </div>
            </div>
            <div className="flex flex-1 max-w-3xl gap-4">
                <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Cari berdasarkan Nama, Lokasi, atau DPL..."
                  />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={clsx(
                        "h-14 px-8 rounded-2xl text-xs font-bold uppercase flex items-center gap-3 transition-all border", 
                        showFilters ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100/50" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Filter size={18} /> {showFilters ? 'Tutup Filter' : 'Filter Lanjut'}
                </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-b border-slate-100 overflow-hidden">
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Periode Program KKN</label>
                    <div className="relative">
                        <select
                          value={periodId}
                          onChange={(e) => setPeriodId(e.target.value)}
                          className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700 outline-none transition-all focus:bg-white focus:border-emerald-500 appearance-none pr-12"
                        >
                          <option value="">Semua Periode</option>
                          {(periods || []).map((p) => (
                            <option key={p.id} value={p.id}>{p.name?.toUpperCase() || 'UNTITLED'}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Status Operasional</label>
                    <div className="relative">
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700 outline-none transition-all focus:bg-white focus:border-emerald-500 appearance-none pr-12"
                        >
                          <option value="">Semua Status</option>
                          <option value="draft">DRAF (BELUM AKTIF)</option>
                          <option value="active">AKTIF (TERBUKA)</option>
                          <option value="closed">SELESAI (TERTUTUP)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="px-10 pb-10 flex justify-end gap-6">
                     <button onClick={() => { setSearch(''); setPeriodId(''); setStatus(''); }} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">Reset Semua Parameter</button>
                      <button onClick={handleApplyFilters} className="px-10 h-12 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">Terapkan Perubahan</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                    <tr>
                      <th className="px-8 py-6 w-16 text-center">#</th>
                      <th className="px-8 py-6">Informasi Kelompok</th>
                      <th className="px-8 py-6">Lokasi / Wilayah</th>
                      <th className="px-8 py-6">Status & Pendamping</th>
                      <th className="px-8 py-6 text-center">Kapasitas</th>
                      <th className="px-8 py-6 text-right">Kelola</th>
                    </tr>
                </thead>
              <tbody className="divide-y divide-slate-50">
                {(groups?.data?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-200">
                            <Info size={60} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Data kelompok belum terenkripsi</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  groups?.data?.map((group, idx) => (
                    <tr key={group.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-8 text-center text-[11px] font-bold text-slate-300 tabular-nums">
                        {idx + 1 + ((groups?.meta?.current_page ?? 1) - 1) * (groups?.meta?.per_page ?? 15)}
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-none">
                            {group.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em] font-mono tabular-nums">
                            {group.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold uppercase leading-tight line-clamp-1">
                              {group.location?.full_name || 'Lokasi Belum Diatur'}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-5 opacity-60">
                            {group.period?.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={clsx(
                                'px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all',
                                group.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                group.status === 'closed' ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                              )}
                            >
                              {group.status === 'draft' ? 'DRAF' : group.status === 'active' ? 'AKTIF' : 'SELESAI'}
                            </span>
                            {group.ready_for_placement && (
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> Terverifikasi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase italic opacity-80">
                            <UserCheck size={12} className="text-slate-300" />
                            <span className="line-clamp-1">{group.main_lecturer?.name || 'BELUM ADA DPL'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="space-y-3 w-36 mx-auto">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums leading-none">
                            <span>{group.approved_participants_count} User</span>
                            <span>Limit {group.capacity}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                            <div
                              className={clsx(
                                  "h-full transition-all duration-1000",
                                  (group.approved_participants_count / group.capacity) >= 1 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{
                                width: `${Math.min(100, (group.approved_participants_count / group.capacity) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <div className="flex justify-end gap-3 outline-none">
                             <Link 
                                 href={route('admin.kelompok.show', group.id)} 
                                 className="h-10 px-5 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-100 shadow-sm rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center active:scale-95 group/btn"
                             >
                                 Detail
                                 <ChevronRight size={14} className="ml-1 opacity-40 group-hover/btn:translate-x-0.5 transition-transform" />
                             </Link>
                             {canManage && (
                                <>
                                    <button onClick={() => openEditForm(group)} className="h-10 w-10 bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl flex items-center justify-center transition-all active:scale-95">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => setDeletingId(group.id)} className="h-10 w-10 bg-white border border-slate-200 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:shadow-sm rounded-xl flex items-center justify-center transition-all active:scale-95">
                                        <Trash2 size={20} />
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

          <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              Data Hal. {groups?.meta?.current_page ?? 1} — {(groups?.meta?.total ?? 0).toLocaleString()} unit terdeteksi
            </span>
            {groups?.meta && <Pagination meta={groups.meta} />}
          </div>
        </div>

        {/* --- FORM MODAL --- */}
        <Modal show={showForm} onClose={closeForm} maxWidth="2xl">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div className="space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {editingGroup ? 'Koreksi Data Kelompok' : 'Tambah Unit Kelompok'}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Konfigurasi Penugasan & Plotting</p>
                  </div>
                  <button onClick={closeForm} className="h-12 w-12 bg-white border border-slate-200 text-slate-300 rounded-2xl flex items-center justify-center hover:text-rose-500 transition-all shadow-sm">
                      <X size={24} />
                  </button>
              </div>

              <form onSubmit={submitForm} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Periode Program</label>
                    <div className="relative">
                        <select
                          value={form.data.period_id}
                          onChange={(e) => form.setData('period_id', e.target.value)}
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-12"
                          required
                        >
                          <option value="">— Pilih Periode —</option>
                          {(periods || []).map((p) => (
                            <option key={p.id} value={p.id}>{p.name?.toUpperCase() || 'UNTITLED'}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Wilayah Penugasan</label>
                    <div className="relative">
                        <select
                          value={form.data.location_id}
                          onChange={(e) => form.setData('location_id', e.target.value)}
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-12"
                          required
                        >
                          <option value="">— Pilih Lokasi —</option>
                          {(locations || []).map((l) => (
                            <option key={l.id} value={l.id}>{l.full_name?.toUpperCase() || 'UNKNOWN_LOCATION'}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Label / Nama Kelompok</label>
                  <input
                    type="text"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 uppercase tracking-tight"
                    placeholder="Contoh: Kelompok 01 Desa Karangjati..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kapasitas Maks</label>
                    <input
                      type="number"
                      value={form.data.capacity}
                      onChange={(e) => form.setData('capacity', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all tabular-nums"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Status Plotting</label>
                    <div className="relative">
                        <select
                          value={form.data.status}
                          onChange={(e) => form.setData('status', e.target.value as any)}
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-12"
                        >
                          <option value="draft">DRAF</option>
                          <option value="active">AKTIF</option>
                          <option value="closed">NON-AKTIF</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">DPL Utama</label>
                    <div className="relative">
                        <select
                          value={form.data.lead_lecturer_id}
                          onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-12"
                        >
                          <option value="">(Belum Ditugaskan)</option>
                          {(lecturers || []).map((l) => (
                            <option key={l.id} value={l.id}>{l.name?.toUpperCase() || 'UNNAMED_LECTURER'}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex justify-end gap-6 border-t border-slate-50">
                  <button
                    onClick={closeForm}
                    type="button"
                    className="px-8 font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase text-[10px] tracking-[0.2em]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={form.processing}
                    className="px-12 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {form.processing ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    {editingGroup ? 'Simpan Perubahan' : 'Finalisasi Unit'}
                  </button>
                </div>
              </form>
          </div>
        </Modal>

        <ConfirmDialog
          show={deletingId !== null}
          onClose={() => setDeletingId(null)}
          onConfirm={handleDelete}
          title="Hapus Unit Kelompok?"
          message="Metadata kelompok akan dieliminasi secara permanen. Mahasiswa terdaftar akan otomatis dikembalikan ke status pendaftaran mandiri. Lanjutkan tindakan ini?"
        />

        {/* --- FOOTER GUIDE --- */}
        <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12 -mr-16 -mt-16">
                 <ShieldCheck size={350} />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex items-center gap-10">
                    <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                        <Users size={48} className="text-white" />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight">Otoritas Penempatan Unit</h4>
                        <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
                            Manajemen kelompok adalah inti dari distribusi peserta KKN ke wilayah penugasan. Pastikan setiap unit memiliki kuota mahasiswa yang seimbang dan didampingi oleh Dosen Pembimbing Lapangan yang kompeten.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: LucideIcon; color: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate' }) {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-red-50 text-red-600 border-red-100',
        slate: 'bg-slate-50 text-slate-400 border-slate-100'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 hover:shadow-lg transition-all group overflow-hidden relative shadow-sm">
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx('h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', colorMap[color])}>
                    <Icon size={24} />
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-extrabold text-slate-900 tracking-tighter tabular-nums leading-none uppercase">
                        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                    </p>
                </div>
            </div>
        </div>
    );
}
