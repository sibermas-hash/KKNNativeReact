import { type FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
 Download, MapPin, Pencil, Plus, Search, Trash2, Users, UserCheck, Filter, CheckCircle2, Activity, Layers, ArrowRight, Save, X, RefreshCw, Upload, Info
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination, Modal, FormInput, FormSelect, Button, Badge } from '@/Components/ui';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

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
    periode_id?: string | number;
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
  groups,
  periods = [],
  locations = [],
  lecturers = [],
  filters = {},
  ui = {},
  summary,
}: Props) {
  const [search, setSearch] = useState(filters?.search ?? '');
  const [periodId, setPeriodId] = useState(filters?.periode_id ? String(filters.periode_id) : '');
  const [statusFilter, setStatusFilter] = useState(filters?.status ? String(filters.status) : '');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const form = useForm<GroupFormData>(initialFormData);
  const syncForm = useForm({
    periode_id: '',
    default_capacity: '10',
    default_status: 'active'
  });
  const canManage = ui?.can_manage ?? false;

  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      router.post(route('admin.kelompok.import'), { file: e.target.files[0] }, {
        preserveScroll: true,
        onFinish: () => setImporting(false),
      });
      e.target.value = '';
    }
  };

  const handleApplyFilters = () => {
    router.get(
      route('admin.kelompok.index'),
      {
        search: search || undefined,
        periode_id: periodId || undefined,
        status: statusFilter || undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    form.reset();
    form.clearErrors();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        onSuccess: () => cancelEdit(),
      });
    } else {
      router.post(route('admin.kelompok.store'), payload, {
        preserveScroll: true,
        onSuccess: () => form.reset(),
      });
    }
  };

  const handleSync = (e: FormEvent) => {
    e.preventDefault();
    syncForm.post(route('admin.kelompok.sync-from-locations'), {
      preserveScroll: true,
      onSuccess: () => setShowSyncModal(false),
    });
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
    <AppLayout title="Manajemen Kelompok">
      <Head title="Manajemen Kelompok | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Unit Kelompok."
          subtitle="Kelola unit kelompok, kuota peserta, dan penempatan wilayah penugasan KKN secara terpusat."
          icon={Layers}
          groupLabel="Kelompok & Penugasan"
          stats={{
            label: 'Total Unit Terdaftar',
            value: `${summary?.total_groups?.toLocaleString() ?? '0'} Unit`,
            icon: Users
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSyncModal(true)}
              className="h-11 px-5 bg-white border border-slate-200 text-emerald-900 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={14} /> Sinkron Wilayah
            </button>
            <Link
              href={route('admin.kelompok.template')}
              className="h-11 px-5 bg-white border border-slate-200 text-emerald-900 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
            >
              <Download size={14} /> Template
            </Link>
            <label className="h-11 px-5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95">
              {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              Impor Excel
              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} disabled={importing} />
            </label>
          </div>
        </PageHeader>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Unit Aktif" value={summary?.active_groups ?? 0} icon={Users} variant="success" />
          <StatCard label="Butuh DPL" value={summary?.groups_without_main_lecturer ?? 0} icon={UserCheck} variant="warning" />
          <StatCard label="Siap Ploting" value={summary?.groups_ready_for_placement ?? 0} icon={Target} variant="info" />
          <StatCard label="Total Slot" value={summary?.total_available_slots ?? 0} icon={Layers} variant="gray" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: FORM PANEL (1/3) */}
          <div className="lg:col-span-4 space-y-6">
            <ContentPanel
              title={editingGroup ? "Perbarui Unit" : "Pendaftaran Kelompok"}
              description="Konfigurasi parameter unit bimbingan KKN."
              icon={editingGroup ? Pencil : Plus}
              padding={true}
              headerAction={editingGroup && (
                <button onClick={cancelEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                  <X size={16} />
                </button>
              )}
            >
              <form onSubmit={submitForm} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">Periode Program</label>
                  <select
                    value={form.data.period_id}
                    onChange={(e) => form.setData('period_id', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                    required
                  >
                    <option value="">Pilih Periode Aktif</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">Wilayah Penugasan</label>
                  <select
                    value={form.data.location_id}
                    onChange={(e) => form.setData('location_id', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                    required
                  >
                    <option value="">Pilih Lokasi Desa</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.full_name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">Nama Kelompok</label>
                  <input
                    type="text"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                    placeholder="Cth: Kelompok 10 Karangduren"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">Kapasitas</label>
                    <input
                      type="number"
                      min="1"
                      value={form.data.capacity}
                      onChange={(e) => form.setData('capacity', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none text-center"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">Status</label>
                    <select
                      value={form.data.status}
                      onChange={(e) => form.setData('status', e.target.value as any)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                      required
                    >
                      <option value="draft">Drafting</option>
                      <option value="active">Publish</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1 font-display">DPL Utama (Ketua)</label>
                  <select
                    value={form.data.lead_lecturer_id}
                    onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                  >
                    <option value="">(Opsional)</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit"
                  disabled={form.processing || !canManage} 
                  className="w-full h-14 bg-emerald-600 text-white text-[10px] font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 active:scale-[0.98] uppercase tracking-[0.2em] disabled:opacity-50 font-display"
                >
                  {form.processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingGroup ? 'Perbarui Data Unit' : 'Aktivasi Unit Baru'}
                </button>
              </form>
            </ContentPanel>

          </div>

          {/* RIGHT: TABLE PANEL (2/3) */}
          <div className="lg:col-span-8">
            <ContentPanel
              title="Indeks Unit Kelompok"
              description={`Daftar ${groups.meta.total} unit kelompok bimbingan.`}
              icon={Layers}
              padding={false}
              headerAction={
                <div className="flex items-center gap-3">
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-500 focus:border-emerald-600 outline-none transition-all uppercase tracking-tight"
                  >
                    <option value="">SEMUA PERIODE</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onSearch={handleApplyFilters}
                    placeholder="CARI KODE / NAMA..."
                    className="w-64"
                  />
                  <button
                    onClick={handleApplyFilters}
                    className="h-10 px-5 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-sm font-display active:scale-95 transition-all"
                  >
                    Filter
                  </button>
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums">
                    {groups.meta.total} UNIT LOADED
                  </span>
                  <Pagination meta={groups.meta} />
                </div>
              }
            >
              <PremiumTable
                headers={['Identitas Unit', 'Wilayah Kerja', 'Okupansi Slot', 'Opsi']}
                isEmpty={groups.data.length === 0}
                emptyText="Data Kelompok Tidak Ditemukan"
              >
                {groups.data.map((group) => (
                  <PremiumTableRow key={group.id}>
                    <PremiumTableCell>
                      <div className="flex flex-col py-1">
                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-tight font-display">{group.name}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200">#{group.code}</span>
                          <StatusTag status={group.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-black text-emerald-800 uppercase tracking-tighter opacity-60">
                          <UserCheck size={10} className="text-emerald-600" />
                          <span className="truncate max-w-[200px]">{group.main_lecturer?.name || 'BELUM ADA DPL'}</span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-black text-emerald-950 uppercase leading-none">
                           <MapPin size={10} className="text-rose-500" />
                           {group.location?.full_name || '-'}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{group.period?.name || '-'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-2 w-32">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[11px] font-black text-emerald-950 tabular-nums">{group.approved_participants_count}</span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">/ {group.capacity} KEL.</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={clsx("h-full transition-all rounded-full", (group.approved_participants_count / group.capacity) >= 0.9 ? 'bg-amber-500' : 'bg-emerald-600')} 
                            style={{ width: `${Math.min(100, (group.approved_participants_count / group.capacity) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={route('admin.kelompok.show', group.id)} 
                          className="h-8 px-4 flex items-center justify-center text-[9px] font-black uppercase tracking-widest bg-white ring-2 ring-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white hover:ring-emerald-950 rounded-lg transition-all shadow-sm no-underline active:scale-95 font-display"
                        >
                          Detail
                        </Link>
                        {canManage && (
                          <>
                            <button onClick={() => openEditForm(group)} className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeletingId(group.id)} className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>
      </div>

      {/* Sync Modal & Confirm Dialog */}
      <Modal show={showSyncModal} onClose={() => setShowSyncModal(false)} title="Sinkronisasi Wilayah" maxWidth="md">
        <form onSubmit={handleSync} className="p-8 space-y-6">
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
            <Info size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest leading-none mb-2 font-display">Logika Sinkronisasi:</p>
              <p className="text-[10px] text-emerald-800 leading-relaxed font-bold uppercase tracking-tight opacity-70">
                Sistem akan membuat kelompok baru untuk setiap desa yang belum memiliki unit bimbingan pada periode terpilih.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Periode Target</label>
              <select
                value={syncForm.data.periode_id}
                onChange={(e) => syncForm.setData('periode_id', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                required
              >
                <option value="">Pilih Periode KKN</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kapasitas Default</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={syncForm.data.default_capacity}
                  onChange={(e) => syncForm.setData('default_capacity', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none text-center"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Status Awal</label>
                <select
                  value={syncForm.data.default_status}
                  onChange={(e) => syncForm.setData('default_status', e.target.value as any)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                  required
                >
                  <option value="draft">Drafting</option>
                  <option value="active">Publish</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => setShowSyncModal(false)}
              className="flex-1 h-12 border-2 border-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-400 hover:bg-slate-50 transition-all font-display"
            >
              Batalkan
            </button>
            <button 
              type="submit" 
              className="flex-1 h-12 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 flex items-center justify-center gap-2 font-display" 
              disabled={syncForm.processing}
            >
              {syncForm.processing ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
              Mulai Sinkron
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Kelompok?"
        message="Data kelompok ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmVariant="danger"
        confirmLabel="Hapus Permanen"
      />
    </AppLayout>
  );
}
