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
  RefreshCw, 
  Activity, 
  Save, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Info,
  ChevronRight,
  Database,
  Target
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination, Modal } from '@/Components/ui';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';

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

      <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Lokasi Penugasan."
          subtitle="Data induk wilayah desa/kelurahan sebagai titik penempatan strategis peserta KKN."
          icon={MapPin}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Titik Lokasi',
            value: summary.total_locations.toLocaleString(),
            icon: Building2,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-emerald-900 rounded-xl hover:bg-gray-50 transition-all text-xs font-black uppercase tracking-widest"
            >
              <Upload size={14} /> Impor Data
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-emerald-900 rounded-xl hover:bg-gray-50 transition-all text-xs font-black uppercase tracking-widest"
            >
              <Download size={14} /> Unduh Data
            </button>
            {workflow.primary_source === 'groups_import' && (
              <button
                onClick={() => router.get(workflow.groups_import_url)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20"
              >
                <Activity size={14} /> Sinkronisasi
              </button>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: FORM PANEL (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <ContentPanel
              title={editingLocation ? 'Koreksi Wilayah' : 'Registrasi Wilayah'}
              description={editingLocation ? 'Perbarui parameter koordinat administratif.' : 'Daftarkan titik lokasi penempatan baru.'}
              icon={editingLocation ? Pencil : Plus}
              padding={true}
            >
              <form onSubmit={submitForm} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Nama Desa/Kelurahan</label>
                  <input
                    type="text"
                    value={form.data.village_name}
                    onChange={(e) => form.setData('village_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                    placeholder="Contoh: Karangklesem"
                    required
                  />
                  {form.errors.village_name && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-tight">{form.errors.village_name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kecamatan</label>
                    <input
                      type="text"
                      value={form.data.district_name}
                      onChange={(e) => form.setData('district_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Nama Kec."
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kab/Kota</label>
                    <input
                      type="text"
                      value={form.data.regency_name}
                      onChange={(e) => form.setData('regency_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Nama Kab."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/30">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Kode BPS</label>
                    <input
                      type="text"
                      value={form.data.village_code}
                      onChange={(e) => form.setData('village_code', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-[11px] font-black text-emerald-950 focus:border-emerald-600 outline-none uppercase tracking-widest"
                      placeholder="33.02.XX"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Kapasitas (Kel)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.data.capacity}
                      onChange={(e) => form.setData('capacity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-[11px] font-black text-emerald-950 text-center tabular-nums focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={form.processing} 
                    className="w-full h-11 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest disabled:opacity-50"
                  >
                    {form.processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {editingLocation ? 'Simpan Perubahan' : 'Registrasi Lokasi'}
                  </button>
                  {editingLocation && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full h-11 bg-white border border-gray-200 text-emerald-900 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                    >
                      Batal Koreksi
                    </button>
                  )}
                </div>
              </form>
            </ContentPanel>

            {/* METRICS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-950 tabular-nums leading-none">{summary.assigned_groups}</p>
                  <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mt-1">Unit Kelompok</p>
                </div>
              </div>
              <div className="bg-white border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                  <House size={18} />
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-950 tabular-nums leading-none">{summary.reported_posko}</p>
                  <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mt-1">Posko Aktif</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: TABLE PANEL (2/3) */}
          <div className="lg:col-span-2">
            <ContentPanel
              title="Direktori Wilayah Penempatan"
              icon={MapPinned}
              padding={false}
              headerAction={
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="CARI DESA / KECAMATAN..."
                  className="w-64"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    {locations.meta.total} Titik Terdata &middot; Kapasitas Terpantau
                  </span>
                  {locations.meta && (locations.meta.last_page ?? 0) > 1 && (
                    <Pagination meta={locations.meta} />
                  )}
                </div>
              }
            >
              <PremiumTable
                headers={['Desa/Kelurahan', 'Wilayah', 'Kode', 'Okupansi', 'Aksi']}
                isEmpty={locations.data.length === 0}
                emptyText="Data lokasi administratif tidak ditemukan."
              >
                {locations.data.map((l) => (
                  <PremiumTableRow key={l.id} className="group">
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors leading-tight">{l.village_name}</span>
                        <span className="text-[10px] font-bold text-emerald-800/40 mt-1 uppercase tracking-tighter truncate max-w-[150px]">{l.full_name || '-'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight leading-none">{l.district_name || '-'}</span>
                        <span className="text-[9px] font-bold text-emerald-800/40 mt-1 uppercase tracking-widest">{l.regency_name || '-'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <span className="text-[9px] font-black bg-gray-50 text-emerald-800 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest tabular-nums">
                        {l.village_code || 'N/A'}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1.5 w-20">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter tabular-nums leading-none">
                          <span className={clsx(l.groups_count >= (l.capacity || 0) && (l.capacity || 0) > 0 ? 'text-amber-600' : 'text-emerald-950')}>
                            {l.groups_count}
                          </span>
                          <span className="text-emerald-800/30">/ {l.capacity ?? 0}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                          <div 
                            className={clsx("h-full transition-all rounded-full", ((l.capacity ?? 0) > 0 && l.groups_count >= (l.capacity as number)) ? 'bg-amber-500' : 'bg-emerald-500')} 
                            style={{ width: `${Math.min(100, (l.groups_count / (l.capacity || 1)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(l)} className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-emerald-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleting(l)} 
                          disabled={!l.can_delete}
                          className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm disabled:opacity-30" 
                          title={l.can_delete ? 'Hapus' : l.delete_blocker ?? 'Tidak dapat dihapus'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>

            <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100/30 flex items-center gap-6 mt-6">
               <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
                  <Info size={24} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Kapasitas & Distribusi</h4>
                  <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-tighter leading-relaxed">
                    Pengaturan kapasitas desa memengaruhi algoritma penempatan kelompok. Pastikan kapasitas mencerminkan ketersediaan posko fisik di lapangan.
                  </p>
               </div>
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
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Impor Master Wilayah</h3>
            <button onClick={() => setShowImportModal(false)} className="text-emerald-800 hover:text-emerald-950"><X size={20} /></button>
          </div>

          <form onSubmit={handleImport} className="p-6 space-y-6">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-4">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <Info size={16} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Standar Kolom Excel:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['desa', 'kecamatan', 'kabupaten', 'kode_desa'].map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-white border border-emerald-100 rounded text-[9px] font-black text-emerald-700 uppercase">{tag}</span>
                  ))}
                </div>
                <div className="pt-2">
                  <a 
                    href={route('admin.lokasi.template')} 
                    className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm transition-all active:scale-95"
                  >
                    <FileSpreadsheet size={12} /> Unduh Template
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Arsip Wilayah (.xlsx, .csv)</label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                  className="w-full h-32 border-2 border-dashed border-emerald-100 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer p-4 bg-gray-50 group-hover:bg-emerald-50/30 group-hover:border-emerald-300"
                  required
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {importForm.data.file ? (
                    <>
                      <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-2">
                        <FileSpreadsheet size={24} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">{importForm.data.file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-emerald-200 mb-2 group-hover:text-emerald-400 transition-colors" />
                      <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Klik atau tarik file</span>
                    </>
                  )}
                </div>
              </div>
              {importForm.errors.file && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{importForm.errors.file}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 h-11 border border-gray-200 text-emerald-950 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={importForm.processing}
                className="flex-1 h-11 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                {importForm.processing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                Eksekusi Impor
              </button>
            </div>
          </form>
        </div>
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
        title="Hapus Wilayah?"
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
