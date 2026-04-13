import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Building2,
  House,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Database,
  Layers3,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationData {
  id: number;
  village_code: string | null;
  village_name: string;
  district_name: string | null;
  regency_name: string | null;
  capacity: number | null;
  full_name: string;
  groups_count: number;
  posko_count: number;
  can_delete: boolean;
  delete_blocker: string | null;
}

interface Props extends PageProps {
  locations: {
    data: LocationData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  filters: {
    search?: string;
  };
  summary: {
    total_locations: number;
    assigned_groups: number;
    reported_posko: number;
  };
  workflow: {
    primary_source: 'groups_import' | 'manual';
    groups_import_url: string;
  };
}

interface LocationFormData {
  village_name: string;
  district_name: string;
  regency_name: string;
  village_code: string;
  capacity: string;
}

const emptyForm: LocationFormData = {
  village_name: '',
  district_name: '',
  regency_name: '',
  village_code: '',
  capacity: '',
};

export default function LocationsIndex({ locations, filters, summary, workflow }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [deleting, setDeleting] = useState<LocationData | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<LocationFormData>(emptyForm);
  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(
          '/admin/lokasi',
          { search: search || undefined },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters.search]);

  function openCreateModal() {
    setEditingLocation(null);
    setShowForm(true);
    form.clearErrors();
    form.setData(emptyForm);
  }

  function openEditModal(location: LocationData) {
    setEditingLocation(location);
    setShowForm(true);
    form.clearErrors();
    form.setData({
      village_name: location.village_name ?? '',
      district_name: location.district_name ?? '',
      regency_name: location.regency_name ?? '',
      village_code: location.village_code ?? '',
      capacity: location.capacity != null ? String(location.capacity) : '',
    });
  }

  function closeModal() {
    setShowForm(false);
    setEditingLocation(null);
    form.clearErrors();
    form.reset();
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const options = { preserveScroll: true, onSuccess: () => closeModal() };
    if (editingLocation) {
      form.put(`/admin/lokasi/${editingLocation.id}`, options);
      return;
    }
    form.post('/admin/lokasi', options);
  }

  return (
    <AppLayout title="Direktori Wilayah KKN">
      <Head title="Direktori Wilayah" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <MapPin size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Manajemen Operasional Lapangan</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Direktori <span className="text-emerald-500">Wilayah.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Basis Data Geografis Penugasan dan Monitoring Posko Terpadu KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Database size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Unit</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{summary.total_locations} TERDATA</span>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} />
                        TAMBAH WILAYAH
                    </button>
                </div>
            </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Total Desa / Kelurahan" value={summary.total_locations} icon={Building2} color="emerald" />
          <MetricCard label="Kelompok Terplotting" value={summary.assigned_groups} icon={MapPinned} color="sky" />
          <MetricCard label="Posko Teridentifikasi" value={summary.reported_posko} icon={House} color="amber" />
        </div>

        {/* --- IMPOR OTOMATIS CTA --- */}
        {workflow.primary_source === 'groups_import' && (
          <div className="bg-emerald-900 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-45 duration-1000">
                <MapPin size={260} />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-white/10 text-emerald-300 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                <MapPin size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Sinkronisasi Wilayah Otomatis</h3>
                <p className="text-xs font-medium text-emerald-100/60 uppercase tracking-widest">Wilayah akan bertambah otomatis saat impor data kelompok.</p>
              </div>
            </div>
            <button
              onClick={() => router.get(workflow.groups_import_url)}
              className="px-10 h-14 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 shadow-xl active:scale-95 relative z-10"
            >
              Impor Data Kelompok
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* --- MAIN TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                <Layers3 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Daftar Wilayah Target</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Administratif lokasi penugasan</p>
              </div>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="CARI DESA, KECAMATAN, KABUPATEN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 transition-all outline-none uppercase placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                  <th className="px-10 py-6">Nama Wilayah</th>
                  <th className="px-10 py-6">Kecamatan / Kabupaten</th>
                  <th className="px-10 py-6 text-center">Kode BPS</th>
                  <th className="px-10 py-6 text-center">Beban Plotting</th>
                  <th className="px-10 py-6 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {locations.data.length > 0 ? (
                  locations.data.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-none">
                            {l.village_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em] opacity-60">{l.full_name}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-slate-700 uppercase">
                            KEC. {l.district_name || '—'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            KAB. {l.regency_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-xl tabular-nums">
                          {l.village_code || 'NULL'}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col items-center gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 tabular-nums">{l.groups_count}</span>
                            <span className="text-xs text-slate-300">/</span>
                            <span className="text-xs font-bold text-slate-400 tabular-nums">{l.capacity ?? 0} UNIT</span>
                          </div>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${Math.min(((l.groups_count || 0) / (l.capacity || 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3 outline-none">
                          <button
                            onClick={() => openEditModal(l)}
                            className="h-10 w-10 bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl flex items-center justify-center transition-all active:scale-95"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleting(l)}
                            disabled={!l.can_delete}
                            className={clsx(
                              'h-10 w-10 rounded-xl flex items-center justify-center transition-all border outline-none active:scale-95',
                              l.can_delete
                                ? 'bg-white border-slate-200 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:shadow-sm'
                                : 'bg-slate-50 border-slate-50 text-slate-100 cursor-not-allowed opacity-20',
                            )}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-40 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-200">
                            <MapPin size={60} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database wilayah masih kosong</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
                Transmission Hal. {locations.meta.current_page} — {locations.meta.total} unit terdata
            </span>
            <Pagination meta={locations.meta} />
          </div>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      <Modal show={showForm} onClose={closeModal} maxWidth="2xl">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {editingLocation ? 'Koreksi Data Wilayah' : 'Pendaftaran Wilayah Baru'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Registrasi Geografis Target KKN</p>
                </div>
                <button onClick={closeModal} className="h-12 w-12 bg-white border border-slate-200 text-slate-300 rounded-2xl flex items-center justify-center hover:text-rose-500 transition-all shadow-sm">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={submitForm} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Desa / Kelurahan</label>
                    <input
                      type="text"
                      value={form.data.village_name}
                      onChange={(e) => form.setData('village_name', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase tracking-tight"
                      placeholder="Input nama desa atau kelurahan..."
                      required
                    />
                    {form.errors.village_name && <p className="text-[10px] text-rose-500 font-bold uppercase mt-2">{form.errors.village_name}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kecamatan</label>
                    <input
                      type="text"
                      value={form.data.district_name}
                      onChange={(e) => form.setData('district_name', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase tracking-tight"
                      placeholder="Nama Kecamatan..."
                       required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kabupaten</label>
                    <input
                      type="text"
                      value={form.data.regency_name}
                      onChange={(e) => form.setData('regency_name', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none uppercase tracking-tight"
                      placeholder="Nama Kabupaten..."
                       required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kode Wilayah (BPS)</label>
                    <input
                      type="text"
                      value={form.data.village_code}
                      onChange={(e) => form.setData('village_code', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-emerald-600 focus:bg-white focus:border-emerald-500 transition-all outline-none font-mono tracking-widest tabular-nums"
                      placeholder="33.02..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kapasitas Maks Unit Kelompok</label>
                    <input
                      type="number"
                      min="0"
                      value={form.data.capacity}
                      onChange={(e) => form.setData('capacity', e.target.value)}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-all outline-none tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-6 pt-10 border-t border-slate-50">
                  <button type="button" onClick={closeModal} className="px-8 font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase text-[10px] tracking-[0.2em]">Batal</button>
                  <button 
                    type="submit" 
                    disabled={form.processing} 
                    className="px-12 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                  >
                    {form.processing ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    Simpan Perubahan
                  </button>
                </div>
            </form>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteForm.delete(`/admin/lokasi/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
          });
        }}
        title="Hapus Data Wilayah?"
        message={deleting?.can_delete ? `Apakah Anda yakin ingin menghapus "${deleting?.village_name}"? Seluruh metadata terkait lokasi ini akan dieliminasi dari sistem.` : (deleting?.delete_blocker || 'Lokasi tidak dapat dihapus karena sudah memiliki dependensi data kelompok.')}
        confirmLabel="Ya, Hapus Permanen"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: 'emerald' | 'amber' | 'sky' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
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
            <p className="text-4xl font-extrabold text-slate-900 tracking-tighter tabular-nums leading-none">
                {value.toLocaleString('id-ID')}
            </p>
        </div>
      </div>
    </div>
  );
}
