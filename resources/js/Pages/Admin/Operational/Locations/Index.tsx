import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Building2, House, MapPin, MapPinned, Pencil, Plus, Search, Trash2, X, Database, Layers3, RefreshCw, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

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
    <AppLayout title="Manajemen Wilayah Penugasan">
      <Head title="Manajemen Wilayah KKN" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-500">Operasional KKN</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Manajemen Wilayah Penugasan</h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              Data wilayah desa/kelurahan sebagai lokasi penugasan kelompok KKN.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Lokasi
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Wilayah" value={summary.total_locations} unit="Desa / Kelurahan" icon={Building2} />
          <StatCard label="Kelompok Terplotting" value={summary.assigned_groups} unit="Unit Aktif" icon={MapPinned} />
          <StatCard label="Posko Terdata" value={summary.reported_posko} unit="Posko Identifikasi" icon={House} />
        </div>

        {/* SYNC NOTICE */}
        {workflow.primary_source === 'groups_import' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Sinkronisasi Otomatis Aktif</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Wilayah akan bertambah otomatis melalui proses impor data kelompok.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.get(workflow.groups_import_url)}
              className="h-9 px-4 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors flex items-center gap-2 shrink-0"
            >
              Impor Data Kelompok <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Layers3 size={16} className="text-emerald-600" />
              <span><strong className="text-gray-900">{locations.meta.total.toLocaleString()}</strong> wilayah terdaftar</span>
            </div>
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari desa, kecamatan, kabupaten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Wilayah</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kecamatan / Kabupaten</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Kode BPS</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Kelompok / Kapasitas</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      <MapPin className="mx-auto h-10 w-10 text-gray-300 mb-3" strokeWidth={1.5} />
                      Tidak ada data wilayah yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  locations.data.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{l.village_name}</span>
                          <span className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{l.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800">{l.district_name || '—'}</span>
                          <span className="text-xs text-gray-500">{l.regency_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {l.village_code || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5 w-32 mx-auto">
                          <div className="flex justify-between w-full text-xs">
                            <span className="font-semibold text-gray-900">{l.groups_count}</span>
                            <span className="text-gray-400">/ {l.capacity ?? 0} kelompok</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(((l.groups_count || 0) / (l.capacity || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(l)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(l)}
                            disabled={!l.can_delete}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={l.can_delete ? 'Hapus' : l.delete_blocker ?? 'Tidak dapat dihapus'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Menampilkan <strong>{locations.data.length}</strong> dari <strong>{locations.meta.total.toLocaleString()}</strong> wilayah
            </span>
            <Pagination meta={locations.meta} />
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={closeModal} maxWidth="lg">
        <div className="bg-white rounded-lg font-sans">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {editingLocation ? 'Edit Data Wilayah' : 'Tambah Wilayah Baru'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Isi detail geografis lokasi penugasan KKN.</p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 p-1">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={submitForm} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nama Desa / Kelurahan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.data.village_name}
                onChange={(e) => form.setData('village_name', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                placeholder="Contoh: Karangklesem"
                required
              />
              {form.errors.village_name && <p className="text-xs text-rose-600">{form.errors.village_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Kecamatan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.data.district_name}
                  onChange={(e) => form.setData('district_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                  placeholder="Nama Kecamatan"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Kabupaten / Kota <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.data.regency_name}
                  onChange={(e) => form.setData('regency_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                  placeholder="Nama Kabupaten"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Kode BPS Wilayah</label>
                <input
                  type="text"
                  value={form.data.village_code}
                  onChange={(e) => form.setData('village_code', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900 font-mono"
                  placeholder="33.02.xxx.xxx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Kapasitas Kelompok <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.data.capacity}
                  onChange={(e) => form.setData('capacity', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">
                Batal
              </button>
              <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2">
                {form.processing && <RefreshCw size={14} className="animate-spin" />}
                {editingLocation ? 'Simpan Perubahan' : 'Tambah Lokasi'}
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
        title="Hapus Data Wilayah"
        message={
          deleting?.can_delete
            ? `Hapus wilayah "${deleting?.village_name}" secara permanen?`
            : deleting?.delete_blocker ?? 'Lokasi tidak dapat dihapus karena memiliki kelompok aktif.'
        }
        confirmLabel="Hapus Permanen"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function StatCard({ label, value, unit, icon: Icon }: {
  label: string; value: number; unit: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight tabular-nums">{value.toLocaleString('id-ID')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
