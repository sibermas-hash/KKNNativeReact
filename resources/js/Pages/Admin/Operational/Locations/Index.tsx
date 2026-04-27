import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Building2,
  Users,
  House,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Filter,
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
  ChevronDown,
  Database,
  Target,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination, Modal } from '@/Components/UI';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';

import type { PaginationMeta } from '@/Components/UI/Pagination';
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
  is_used_in_period: boolean;
  can_delete: boolean;
  delete_blocker: string | null;
}

interface Props extends PageProps {
  locations: { data: LocationData[]; links: unknown[]; meta: PaginationMeta };
  filters: { search?: string; period_id?: string };
  summary: { total_locations: number; assigned_groups: number; reported_posko: number };
  workflow: { primary_source: 'groups_import' | 'manual'; groups_import_url: string };
  periods?: { id: number; name: string; periode: string }[];
  active_periode_id?: number;
  active_periode_name?: string;
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

export default function LocationsIndex({
  locations,
  filters,
  summary,
  workflow,
  periods,
  active_periode_id,
  active_periode_name,
}: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    filters.period_id ?? String(active_periode_id ?? ''),
  );
  const [deleting, setDeleting] = useState<LocationData | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const form = useForm<LocationFormData>(emptyForm);
  const importForm = useForm<{ file: File | null }>({ file: null });
  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(
          '/admin/locations',
          { search: search || undefined, period_id: selectedPeriodId || undefined },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, filters.search]);

  useEffect(() => {
    if (selectedPeriodId !== (filters.period_id ?? '')) {
      router.get(
        '/admin/locations',
        { period_id: selectedPeriodId || undefined, search: search || undefined },
        { preserveState: true, replace: true, preserveScroll: true },
      );
    }
  }, [selectedPeriodId]);

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
    if (editingLocation) {
      form.put(`/admin/locations/${editingLocation.id}`, options);
      return;
    }
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
    const url = route('locations.export', {
      search: search || undefined,
      period_id: selectedPeriodId || undefined,
    });
    window.location.href = url;
  }

  return (
    <AppLayout title="Manajemen Wilayah KKN">
      <Head title="Manajemen Lokasi | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-24 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Lokasi Penugasan."
          subtitle="Data induk wilayah desa/kelurahan sebagai titik penempatan strategis peserta KKN."
          icon={MapPin}
          groupLabel="Data Master Sistem"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 text-emerald-950 rounded-xl hover:border-emerald-600 transition-all text-xs font-black uppercase tracking-widest shadow-sm active:scale-95"
            >
              <Upload size={14} strokeWidth={2.5} /> Impor Data
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 text-emerald-950 rounded-xl hover:border-emerald-600 transition-all text-xs font-black uppercase tracking-widest shadow-sm active:scale-95"
            >
              <Download size={14} strokeWidth={2.5} /> Unduh Data
            </button>
            {workflow.primary_source === 'groups_import' && (
              <button
                onClick={() => router.get(workflow.groups_import_url)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Activity size={14} strokeWidth={2.5} /> Sinkronisasi
              </button>
            )}
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Titik Lokasi"
            value={summary.total_locations}
            icon={Building2}
            variant="gray"
          />
          <StatCard
            label="Unit Kelompok"
            value={summary.assigned_groups}
            icon={MapPinned}
            variant="success"
          />
          <StatCard
            label="Posko Aktif"
            value={summary.reported_posko}
            icon={House}
            variant="warning"
          />
          <StatCard
            label="Konteks Periode"
            value={active_periode_name ? (active_periode_name.split(' ').pop() ?? '') : '-'}
            subValue={active_periode_name}
            icon={CalendarDays}
            variant="gray"
          />
        </div>

        {/* --- HORIZONTAL FILTER & FORM SECTION --- */}
        <div className="space-y-6">
          <ContentPanel title="Filter & Registrasi Wilayah" icon={Filter} padding={true}>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filter Column */}
              <div className="lg:w-1/4 space-y-5 border-r border-gray-100 pr-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Periode KKN
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedPeriodId}
                      onChange={(e) => setSelectedPeriodId(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none"
                    >
                      <option value="">SEMUA PERIODE</option>
                      {periods?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"
                    />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/30 flex items-start gap-3">
                  <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-tight leading-relaxed">
                    Pilih periode untuk memfilter lokasi yang memiliki penempatan kelompok pada
                    periode tersebut.
                  </p>
                </div>
              </div>

              {/* Form Column */}
              <form onSubmit={submitForm} className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                      Desa/Kelurahan
                    </label>
                    <input
                      type="text"
                      value={form.data.village_name}
                      onChange={(e) => form.setData('village_name', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Contoh: Karangklesem"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={form.data.district_name}
                      onChange={(e) => form.setData('district_name', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Nama Kec."
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                      Kab/Kota
                    </label>
                    <input
                      type="text"
                      value={form.data.regency_name}
                      onChange={(e) => form.setData('regency_name', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Nama Kab."
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-6 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">
                        Kode Wilayah (BPS)
                      </label>
                      <input
                        type="text"
                        value={form.data.village_code}
                        onChange={(e) => form.setData('village_code', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 outline-none uppercase tracking-widest"
                        placeholder="33.02.XX"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">
                        Kapasitas Maksimal
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.data.capacity}
                        onChange={(e) => form.setData('capacity', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-white text-xs font-black text-emerald-950 text-center tabular-nums focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingLocation && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="h-11 px-6 border border-gray-200 text-emerald-950 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="h-11 px-8 bg-emerald-900 text-white text-xs font-black rounded-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/10 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                    >
                      {form.processing ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : editingLocation ? (
                        <Save size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      {editingLocation ? 'Update Data' : 'Registrasi Wilayah'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </ContentPanel>

          {/* --- MAIN TABLE SECTION --- */}
          <ContentPanel
            title="Direktori Wilayah Penempatan"
            description="Daftar induk titik lokasi administratif di seluruh wilayah penugasan."
            icon={MapPinned}
            padding={false}
            headerAction={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="CARI DESA / KECAMATAN..."
                className="w-80"
              />
            }
            footer={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Total {locations.meta.total} Titik Terdata &middot; Halaman{' '}
                    {locations.meta.current_page} dari {locations.meta.last_page}
                  </span>
                </div>
                {locations.meta && (locations.meta.last_page ?? 0) > 1 && (
                  <Pagination meta={locations.meta} />
                )}
              </div>
            }
          >
            <PremiumTable
              headers={[
                'Desa/Kelurahan',
                'Wilayah Administratif',
                'Kode BPS',
                'Okupansi & Kapasitas',
                'Opsi',
              ]}
              isEmpty={locations.data.length === 0}
              emptyText="Data lokasi administratif tidak ditemukan."
            >
              {locations.data.map((l) => (
                <PremiumTableRow
                  key={l.id}
                  className={clsx('group', editingLocation?.id === l.id && 'bg-emerald-50/50')}
                >
                  <PremiumTableCell>
                    <div className="flex flex-col py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                          {l.village_name}
                        </span>
                        {selectedPeriodId && l.is_used_in_period && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[8px] font-black border border-emerald-100 uppercase tracking-widest">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800/40 mt-1 uppercase tracking-tighter truncate max-w-[200px]">
                        {l.full_name || '-'}
                      </span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">
                        {l.district_name || '-'}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-widest">
                        {l.regency_name || '-'}
                      </span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-50 rounded-lg flex items-center justify-center text-emerald-900 border border-gray-100">
                        <Database size={12} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-950 tabular-nums tracking-widest">
                        {l.village_code || 'N/A'}
                      </span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-2 w-28">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter tabular-nums leading-none">
                        <div className="flex items-center gap-1.5">
                          <Users size={10} className="text-emerald-600" />
                          <span
                            className={clsx(
                              l.groups_count >= (l.capacity || 0) && (l.capacity || 0) > 0
                                ? 'text-amber-600 font-black'
                                : 'text-emerald-950',
                            )}
                          >
                            {l.groups_count}
                          </span>
                        </div>
                        <span className="text-emerald-800/30">/ {l.capacity ?? 0}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                        <div
                          className={clsx(
                            'h-full transition-all rounded-full',
                            (l.capacity ?? 0) > 0 && l.groups_count >= (l.capacity as number)
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-400',
                          )}
                          style={{
                            width: `${Math.min(100, (l.groups_count / (l.capacity || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(l)}
                        className="h-9 px-3 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase"
                        title="Edit"
                      >
                        <Pencil size={14} strokeWidth={2.5} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleting(l)}
                        disabled={!l.can_delete}
                        className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm disabled:opacity-30 active:scale-95"
                        title={l.can_delete ? 'Hapus' : (l.delete_blocker ?? 'Tidak dapat dihapus')}
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </ContentPanel>
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
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">
              Impor Master Wilayah
            </h3>
            <button
              onClick={() => setShowImportModal(false)}
              className="text-emerald-800 hover:text-emerald-950"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleImport} className="p-6 space-y-6">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-4">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <Info size={16} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                  Standar Kolom Excel:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['desa', 'kecamatan', 'kabupaten', 'kode_desa'].map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-white border border-emerald-100 rounded text-[9px] font-black text-emerald-700 uppercase"
                    >
                      {tag}
                    </span>
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
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                Arsip Wilayah (.xlsx, .csv)
              </label>
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
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">
                        {importForm.data.file.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload
                        size={24}
                        className="text-emerald-200 mb-2 group-hover:text-emerald-400 transition-colors"
                      />
                      <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">
                        Klik atau tarik file
                      </span>
                    </>
                  )}
                </div>
              </div>
              {importForm.errors.file && (
                <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">
                  {importForm.errors.file}
                </p>
              )}
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
                {importForm.processing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
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
            : (deleting?.delete_blocker ?? 'Wilayah ini tidak bisa dihapus.')
        }
        confirmLabel="Hapus"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}
