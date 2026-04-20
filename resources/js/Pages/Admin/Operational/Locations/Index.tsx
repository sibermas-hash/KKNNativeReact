import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Building2, House, MapPin, MapPinned, Pencil, Plus, Search, Trash2, X, RefreshCw, Activity, Save, Download, Upload, FileSpreadsheet, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination, Modal, FormInput, Button } from '@/Components/ui';
import PageHeader from '@/Components/Premium/PageHeader';
import SearchInput from '@/Components/Premium/SearchInput';
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
  const [showImportModal, setShowImportModal] = useState(false);

  const form = useForm<LocationFormData>(emptyForm);
  const importForm = useForm<{ file: File | null }>({ file: null });
  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get('/admin/locations', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
      }
    }, 400);
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
      capacity: location.capacity != null ? String(location.capacity) : '0',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const options = { preserveScroll: true, onSuccess: () => cancelEdit() };
    if (editingLocation) { form.put(`/admin/locations/${editingLocation.id}`, options); return; }
    form.post('/admin/locations', options);
  }

  function handleImport(e: FormEvent) {
    e.preventDefault();
    importForm.post('/admin/lokasi/impor', {
      preserveScroll: true,
      onSuccess: () => {
        setShowImportModal(false);
        importForm.reset();
      },
    });
  }

  function handleExport() {
    const url = route('locations.export', { search: search || undefined });
    window.location.href = url;
  }

  return (
    <AppLayout title="Manajemen Wilayah KKN">
      <Head title="Manajemen Lokasi | KKN UIN SAIZU"/>

      <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Lokasi Penugasan"
          subtitle="Data induk wilayah desa/kelurahan sebagai titik penempatan peserta KKN."
          icon={MapPin}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Total Desa',
            value: summary.total_locations.toLocaleString(),
            icon: Building2,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-emerald-800 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Upload size={16} /> Impor Data
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-emerald-800 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download size={16} /> Unduh Data
            </button>
            {workflow.primary_source === 'groups_import' && (
              <button
                onClick={() => router.get(workflow.groups_import_url)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium shadow-sm"
              >
                <Activity size={16} /> Sinkronisasi Kelompok
              </button>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: FORM PANEL (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
                    {editingLocation ? <Pencil size={16} /> : <Plus size={16} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
                    </h3>
                    <p className="text-xs text-emerald-800">
                      {editingLocation ? 'Perbarui data wilayah yang ada' : 'Registrasi wilayah baru'}
                    </p>
                  </div>
                </div>
                {editingLocation && (
                  <button onClick={cancelEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-800 hover:text-[#ef4444] hover:bg-red-50 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <form onSubmit={submitForm} className="p-5 space-y-5">
                <FormInput
                  label="Nama Desa/Kelurahan"
                  id="village_name"
                  value={form.data.village_name}
                  onChange={(e) => form.setData('village_name', e.target.value)}
                  error={form.errors.village_name}
                  placeholder="Contoh: Karangklesem"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Kecamatan"
                    id="district_name"
                    value={form.data.district_name}
                    onChange={(e) => form.setData('district_name', e.target.value)}
                    error={form.errors.district_name}
                    placeholder="Nama Kec."
                    required
                  />
                  <FormInput
                    label="Kab/Kota"
                    id="regency_name"
                    value={form.data.regency_name}
                    onChange={(e) => form.setData('regency_name', e.target.value)}
                    error={form.errors.regency_name}
                    placeholder="Nama Kab."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Kode BPS"
                    id="village_code"
                    value={form.data.village_code}
                    onChange={(e) => form.setData('village_code', e.target.value)}
                    error={form.errors.village_code}
                    placeholder="Misal: 33.02.XX"
                    className="font-mono"
                  />
                  <FormInput
                    label="Kapasitas"
                    id="capacity"
                    type="number"
                    min="0"
                    value={form.data.capacity}
                    onChange={(e) => form.setData('capacity', e.target.value)}
                    error={form.errors.capacity}
                    required
                    className="text-center tabular-nums"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={form.processing} 
                  className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingLocation ? 'Simpan Perubahan' : 'Tambahkan Lokasi'}
                </button>
              </form>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary.assigned_groups}</p>
                  <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">Unit Kelompok</p>
                </div>
              </div>
              <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
                  <House size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary.reported_posko}</p>
                  <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">Posko Terlapor</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: TABLE PANEL (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
              
              <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Daftar Wilayah Penempatan</h3>
                  <p className="text-[11px] text-emerald-800 uppercase font-semibold tracking-wider">Total: {locations.meta.total} Titik</p>
                </div>
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari desa atau kecamatan..."
                  className="w-full sm:w-72"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-emerald-50 bg-gray-50/20">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Desa/Kelurahan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kecamatan & Kabupaten</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kode BPS</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kapasitas</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {locations.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <MapPin size={32} className="mx-auto text-[#d1d5db] mb-3" strokeWidth={1} />
                          <p className="text-sm font-medium text-emerald-800">Data lokasi tidak ditemukan.</p>
                        </td>
                      </tr>
                    ) : (
                      locations.data.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 transition-colors group/row">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-base font-semibold text-emerald-950">{l.village_name}</span>
                              <span className="text-[11px] text-emerald-700 mt-0.5 truncate max-w-[180px]">{l.full_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-emerald-950">{l.district_name || '-'}</span>
                              <span className="text-xs text-emerald-800 mt-0.5">{l.regency_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-center">
                            <span className="text-[11px] font-mono bg-gray-100 text-emerald-800 px-1.5 py-0.5 rounded border border-gray-200">
                              {l.village_code || 'NON-BPS'}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1.5 w-24 mx-auto">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className={clsx(l.groups_count >= (l.capacity || 0) && (l.capacity || 0) > 0 ? 'text-amber-600' : 'text-emerald-950')}>
                                  {l.groups_count} Kel.
                                </span>
                                <span className="text-emerald-800">/ {l.capacity ?? 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                                <div 
                                  className={clsx("h-full transition-all rounded-full", ((l.capacity ?? 0) > 0 && l.groups_count >= (l.capacity as number)) ? 'bg-amber-500' : 'bg-[#16a34a]')} 
                                  style={{ width: `${Math.min(100, (l.groups_count / (l.capacity || 1)) * 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right align-top">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditForm(l)} className="h-8 w-8 flex items-center justify-center text-emerald-800 hover:text-emerald-950 hover:bg-white border border-transparent hover:border-emerald-100 rounded-md transition-all shadow-sm" title="Edit">
                                <Pencil size={15} />
                              </button>
                              <button 
                                onClick={() => setDeleting(l)} 
                                disabled={!l.can_delete}
                                className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm" 
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
                <div className="px-5 py-4 border-t border-emerald-50 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                    Menampilkan <strong>{locations.data.length}</strong> dari <strong>{locations.meta.total}</strong> data
                  </span>
                  <Pagination meta={locations.meta} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* IMPORT MODAL */}
      <Modal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Master Wilayah"
        maxWidth="md"
      >
        <form onSubmit={handleImport} className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3">
            <Info size={18} className="text-[#1a7a4a] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Format Excel/CSV:</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Wajib kolom: <strong className="text-emerald-950">desa, kecamatan, kabupaten</strong>. <br/>
                Opsional: <strong>kode_desa</strong> (BPS). Baris header wajib ada.
              </p>
              <div className="pt-2">
                <a 
                  href={route('admin.lokasi.template')} 
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#16a34a] hover:text-[#15803d] uppercase tracking-wider bg-white px-2 py-1 rounded border border-emerald-100 shadow-sm transition-all"
                >
                  <FileSpreadsheet size={12} /> Unduh Template .XLSX
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Pilih File Wilayah</label>
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                className="w-full h-32 border-2 border-dashed border-emerald-100 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer p-4 bg-gray-50 group-hover:bg-emerald-50/50 group-hover:border-emerald-300"
                required
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {importForm.data.file ? (
                  <>
                    <FileSpreadsheet size={32} className="text-[#16a34a] mb-2" />
                    <span className="text-xs font-bold text-emerald-950">{importForm.data.file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-emerald-300 mb-2 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-xs font-medium text-emerald-800">Klik atau tarik file ke sini</span>
                    <span className="text-[10px] text-emerald-600 mt-1 uppercase tracking-tighter">Maksimal 10MB</span>
                  </>
                )}
              </div>
            </div>
            {importForm.errors.file && <p className="text-xs font-medium text-[#ef4444] mt-1">{importForm.errors.file}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="flex-1 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-emerald-950 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={importForm.processing}
              className="flex-1 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {importForm.processing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              Proses Impor
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
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
        title="Hapus Lokasi?"
        message={
          deleting?.can_delete
            ? `Apakah Anda yakin ingin menghapus data wilayah Desa ${deleting?.village_name}? Tindakan ini tidak dapat dibatalkan.`
            : deleting?.delete_blocker ?? 'Wilayah ini tidak bisa dihapus.'
        }
        confirmLabel="Hapus"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}
