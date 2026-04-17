import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import {
  Building2, House, MapPin, MapPinned, Pencil, Plus, Search, Trash2, X, RefreshCw, Activity, Layers, Save, Download
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
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

  const form = useForm<LocationFormData>(emptyForm);
  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get('/admin/locations', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters.search]);

  function cancelEdit() {
    setEditingLocation(null);
    form.clearErrors();
    form.reset();
  }

  function openEditForm(location: LocationData) {
    setEditingLocation(location);
    form.clearErrors();
    form.setData({
      village_name: location.village_name ?? '',
      district_name: location.district_name ?? '',
      regency_name: location.regency_name ?? '',
      village_code: location.village_code ?? '',
      capacity: location.capacity != null ? String(location.capacity) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const options = { preserveScroll: true, onSuccess: () => cancelEdit() };
    if (editingLocation) { form.put(`/admin/locations/${editingLocation.id}`, options); return; }
    form.post('/admin/locations', options);
  }

  return (
    <AppLayout title="Manajemen Wilayah KKN">
      <Head title="Manajemen Lokasi | KKN UIN SAIZU"/>

      <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Data Master Sistem</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Lokasi Penugasan</h1>
            <p className="text-sm text-gray-700 max-w-2xl leading-relaxed">
              Data induk wilayah desa/kelurahan sebagai titik penempatan peserta KKN.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {workflow.primary_source === 'groups_import' && (
              <button
                onClick={() => router.get(workflow.groups_import_url)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Activity size={16} /> Sinkronisasi Kelompok
              </button>
            )}
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Download size={16} /> Unduh Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: FORM PANEL (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
                    {editingLocation ? <Pencil size={16} /> : <Plus size={16} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
                    </h3>
                    <p className="text-xs text-gray-700">
                      {editingLocation ? 'Perbarui data wilayah yang ada' : 'Registrasi wilayah baru'}
                    </p>
                  </div>
                </div>
                {editingLocation && (
                  <button onClick={cancelEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-[#ef4444] hover:bg-red-50 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <form onSubmit={submitForm} className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Desa/Kelurahan <span className="text-[#ef4444]">*</span></label>
                  <input
                    type="text"
                    value={form.data.village_name}
                    onChange={(e) => form.setData('village_name', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
                    placeholder="Contoh: Karangklesem"
                    required
                  />
                  {form.errors.village_name && <p className="text-xs text-[#ef4444] mt-1">{form.errors.village_name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kecamatan <span className="text-[#ef4444]">*</span></label>
                    <input
                      type="text"
                      value={form.data.district_name}
                      onChange={(e) => form.setData('district_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
                      placeholder="Nama Kec."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kab/Kota <span className="text-[#ef4444]">*</span></label>
                    <input
                      type="text"
                      value={form.data.regency_name}
                      onChange={(e) => form.setData('regency_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
                      placeholder="Nama Kab."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode BPS</label>
                    <input
                      type="text"
                      value={form.data.village_code}
                      onChange={(e) => form.setData('village_code', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all font-mono"
                      placeholder="Misal: 33.02.XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kapasitas <span className="text-[#ef4444]">*</span></label>
                    <input
                      type="number"
                      min="0"
                      value={form.data.capacity}
                      onChange={(e) => form.setData('capacity', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 text-center focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all tabular-nums"
                      required
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={form.processing} 
                  className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingLocation ? 'Simpan Perubahan' : 'Tambahkan Lokasi'}
                </button>
              </form>
            </div>

            {/* INLINE METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{summary.total_locations}</p>
                  <p className="text-xs font-medium text-gray-700">Desa Terdaftar</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{summary.assigned_groups}</p>
                  <p className="text-xs font-medium text-gray-700">Unit Kelompok</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                <House size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{summary.reported_posko} Rumah</p>
                <p className="text-xs font-medium text-gray-700">Posko Terlapor</p>
              </div>
            </div>
          </div>

          {/* RIGHT: TABLE PANEL (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              
              <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Daftar Wilayah</h3>
                  <p className="text-xs text-gray-700">Total: {locations.meta.total} entri data</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"/>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
                    placeholder="Cari desa atau kecamatan..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Desa/Kelurahan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kecamatan & Kabupaten</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Kode BPS</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Kapasitas</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {locations.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <MapPin size={32} className="mx-auto text-[#d1d5db] mb-3" />
                          <p className="text-sm font-medium text-gray-700">Data Lokasi Kosong</p>
                          <p className="text-xs text-gray-700 mt-1">Silakan tambah baru atau impor dari data kelompok.</p>
                        </td>
                      </tr>
                    ) : (
                      locations.data.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 transition-colors group/row">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-base font-semibold text-gray-900">{l.village_name}</span>
                              <span className="text-xs text-gray-700 mt-0.5">{l.full_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{l.district_name || '-'}</span>
                              <span className="text-xs text-gray-700 mt-0.5">{l.regency_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-center">
                            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {l.village_code || 'NON-BPS'}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1.5 w-24 mx-auto">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-gray-900">{l.groups_count} Kel.</span>
                                <span className="text-gray-700">/ {l.capacity ?? 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={clsx("h-full transition-all rounded-full", ((l.capacity ?? 0) > 0 && l.groups_count >= (l.capacity as number)) ? 'bg-amber-500' : 'bg-[#16a34a]')} 
                                  style={{ width: `${Math.min(100, (l.groups_count / (l.capacity || 1)) * 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right align-top">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditForm(l)} className="h-8 w-8 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors" title="Edit">
                                <Pencil size={15} />
                              </button>
                              <button 
                                onClick={() => setDeleting(l)} 
                                disabled={!l.can_delete}
                                className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                                title={l.can_delete ? 'Hapus' : l.delete_blocker ?? 'Tidak dapat dihapus'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {locations.meta && (locations.meta.last_page ?? 0) > 1 && (
                <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-700">Menampilkan {locations.data.length} dari {locations.meta.total} baris</span>
                  <Pagination meta={locations.meta} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteForm.delete(`/admin/locations/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
          });
        }}
        title="Hapus Wilayah?"
        message={
          deleting?.can_delete
            ? `Apakah Anda yakin ingin menghapus data wilayah Desa ${deleting?.village_name}? Tindakan ini tidak dapat dibatalkan.`
            : deleting?.delete_blocker ?? 'Wilayah ini tidak bisa dihapus.'
        }
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}
