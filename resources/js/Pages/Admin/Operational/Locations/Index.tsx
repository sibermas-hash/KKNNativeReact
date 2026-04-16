import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Building2, House, MapPin, MapPinned, Pencil, Plus, Search, Trash2, X, Database, Layers3, RefreshCw, ChevronRight, Activity, ShieldCheck, Target, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion } from 'framer-motion';

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
  locations: { data: LocationData[]; links: unknown[]; meta: PaginationMeta; };
  filters: { search?: string; };
  summary: { total_locations: number; assigned_groups: number; reported_posko: number; };
  workflow: { primary_source: 'groups_import' | 'manual'; groups_import_url: string; };
}

interface LocationFormData {
  village_name: string;
  district_name: string;
  regency_name: string;
  village_code: string;
  capacity: string;
}

const emptyForm: LocationFormData = {
  village_name: '', district_name: '', regency_name: '', village_code: '', capacity: '',
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
        router.get('/admin/lokasi', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
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
    if (editingLocation) { form.put(`/admin/lokasi/${editingLocation.id}`, options); return; }
    form.post('/admin/lokasi', options);
  }

  return (
    <AppLayout title="Manajemen Wilayah KKN">
      <Head title="Manajemen Lokasi" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <MapPin size={18} />
            <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Geo-Operasional Lapangan</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                Wilayah <span className="text-emerald-500">Penugasan.</span>
              </h1>
              <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
                Data induk wilayah desa/kelurahan sebagai titik penempatan operasional pilar pengabdian mahasiswa.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={openCreateModal}
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase"
              >
                <Plus size={18} /> TAMBAH TITIK LOKASI
              </button>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <LocationMetric label="Total Wilayah Terdaftar" value={summary.total_locations} icon={Building2} desc="Desa / Kelurahan" />
          <LocationMetric label="Kelompok Terplotting" value={summary.assigned_groups} icon={MapPinned} desc="Unit Kelompok Aktif" />
          <LocationMetric label="Posko Teridentifikasi" value={summary.reported_posko} icon={House} desc="Posko Lapangan" />
        </div>

        {/* SYNC NOTICE */}
        {workflow.primary_source === 'groups_import' && (
          <div className="bg-emerald-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/sync">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/sync:rotate-12 transition-transform"><RefreshCw size={150} /></div>
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner"><Activity size={24} /></div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-2">Sinkronisasi Otomatis Terdeteksi</h4>
                    <p className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed">Wilayah akan diperbarui secara otomatis melalui transmisi data impor kelompok penempatan.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.get(workflow.groups_import_url)}
                  className="h-12 px-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-95 flex items-center gap-3 whitespace-nowrap"
                >
                  Otorisasi Impor Data <ChevronRight size={16} strokeWidth={3} />
                </button>
             </div>
          </div>
        )}

        {/* --- TABLE PANEL --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 bg-emerald-50/50 border-b-2 border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-emerald-950">
              <Layers3 size={18} className="text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest"><strong className="text-emerald-700 text-sm tabular-nums tracking-tight">{locations.meta.total.toLocaleString()}</strong> Wilayah Terdaftar</span>
            </div>
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input
                type="text"
                placeholder="CARI DESA, KECAMATAN, ATAU KABUPATEN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300 uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-emerald-50">
              <thead className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-950">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Identitas Wilayah</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Eselon Administrasi</th>
                  <th className="px-8 py-5 text-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-l border-emerald-100">Kode BPS</th>
                  <th className="px-8 py-5 text-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Alur Kapasitas</th>
                  <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-emerald-50">
                {locations.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <MapPin size={40} className="text-emerald-100 mb-2" strokeWidth={1.5} />
                        <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Titik Lokasi Tiada</span>
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Tidak ada data wilayah yang ditemukan untuk parameter ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  locations.data.map((l) => (
                    <tr key={l.id} className="group hover:bg-emerald-50/30 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors leading-tight mb-1">{l.village_name}</span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-60 truncate max-w-xs">{l.full_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight leading-tight mb-1">{l.district_name || '—'}</span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{l.regency_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center border-l border-emerald-50/50">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 font-mono tracking-wider tabular-nums">
                          {l.village_code || 'NON_BPS'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2 w-36 mx-auto">
                          <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest">
                            <span className="text-emerald-950 tabular-nums">{l.groups_count}</span>
                            <span className="text-emerald-400 tabular-nums">/ {l.capacity ?? 0} UNIT</span>
                          </div>
                          <div className="w-full h-2 bg-emerald-50 border border-emerald-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(((l.groups_count || 0) / (l.capacity || 1)) * 100, 100)}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-emerald-500 rounded-full shadow-lg"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => openEditModal(l)}
                            className="h-9 w-9 bg-white border-2 border-emerald-100 text-emerald-500 hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleting(l)}
                            disabled={!l.can_delete}
                            className="h-9 w-9 bg-white border-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={l.can_delete ? 'Hapus' : l.delete_blocker ?? 'Akses Terkunci'}
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
          </div>

          <div className="px-8 py-5 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
               Halaman {locations.meta.current_page} dari {locations.meta.total} Entri Lokasi
            </span>
            <Pagination meta={locations.meta} />
          </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 -mr-20 -mt-20"><ShieldCheck size={300} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-800 shadow-inner">
                        <Zap size={40} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight uppercase leading-none mb-1">Integritas Basis Wilayah KKN</h2>
                        <p className="text-[12px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-2xl">
                           Parameter wilayah geostrategis harus selaras dengan data BPS serta kapasitas logistik posko. Kesalahan identifikasi wilayah akan menghambat penerbitan dokumen administrasi dan legalitas mahasiswa di lapangan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={closeModal} maxWidth="lg">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden font-sans font-sans">
          <div className="px-10 py-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">{editingLocation ? 'Edit Geospasial Wilayah' : 'Pendaftaran Wilayah Baru'}</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Parameter Lokasi Penugasan</p>
            </div>
            <button onClick={closeModal} className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 transition-all shadow-sm active:scale-90"><X size={20} /></button>
          </div>

          <form onSubmit={submitForm} className="p-10 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Identitas Desa / Kelurahan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.data.village_name}
                onChange={(e) => form.setData('village_name', e.target.value)}
                className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-wider"
                placeholder="CONTOH: KARANGKLESEM"
                required
              />
              {form.errors.village_name && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 pl-1">{form.errors.village_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Kecamatan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.data.district_name}
                  onChange={(e) => form.setData('district_name', e.target.value)}
                  className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-wider"
                  placeholder="KECAMATAN"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Kabupaten / Kota <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.data.regency_name}
                  onChange={(e) => form.setData('regency_name', e.target.value)}
                  className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-wider"
                  placeholder="KABUPATEN"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Kode BPS Wilayah</label>
                <input
                  type="text"
                  value={form.data.village_code}
                  onChange={(e) => form.setData('village_code', e.target.value)}
                  className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 font-mono tracking-widest"
                  placeholder="33.02.XX.XX"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">Kapasitas Unit (Kelompok) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.data.capacity}
                  onChange={(e) => form.setData('capacity', e.target.value)}
                  className="w-full h-12 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 tabular-nums font-black"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t-2 border-emerald-50">
              <button type="button" onClick={closeModal} className="h-12 px-8 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-white border-2 border-emerald-100 hover:bg-emerald-50 rounded-xl transition-all active:scale-95">Batalkan</button>
              <button type="submit" disabled={form.processing} className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95">
                {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {editingLocation ? 'SIMPAN PERUBAHAN' : 'REKAYASA TITIK LOKASI'}
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
        title="OTORISASI PENGHAPUSAN WILAYAH"
        message={
          deleting?.can_delete
            ? `Apakah Anda yakin ingin melenyapkan data wilayah "${deleting?.village_name}" beserta riwayat geografisnya secara permanen?`
            : deleting?.delete_blocker ?? 'Akses ditolak. Wilayah ini memiliki ketergantungan relasi operasional kelompok aktif.'
        }
        confirmLabel="HAPUS PERMANEN"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function LocationMetric({ label, value, icon: Icon, desc }: { label: string; value: number; desc: string; icon: any; }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className="h-14 w-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tight tabular-nums leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value.toLocaleString('id-ID')}</span>
        <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}
