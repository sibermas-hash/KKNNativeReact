import { Head, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  MapPinned,
  Plus,
  Trash2,
  Building2,
  Database,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Info,
  Users,
  CalendarDays,
  House,
  Pencil,
  Save,
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';
import ConfirmDialog from '@/Components/UI/ConfirmDialog';
import Modal from '@/Components/UI/Modal';
import Pagination from '@/Components/UI/Pagination';

interface Location {
  id: number;
  village_name: string;
  district_name: string;
  regency_name: string;
  village_code: string | null;
  full_name: string;
  capacity: number | string | null;
  groups_count: number;
  is_used_in_period?: boolean;
  can_delete: boolean;
  delete_blocker?: string | null;
}

interface Props {
  locations: {
    data: Location[];
    meta: any;
  };
  periods: { id: number; name: string }[];
  filters: {
    search?: string;
    period_id?: string;
  };
  summary: {
    total_locations: number;
    assigned_groups: number;
    reported_posko: number;
  };
  active_periode_name?: string;
}

export default function LocationsIndex({
  locations,
  periods,
  filters,
  summary,
  active_periode_name,
}: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [selectedPeriodId, setSelectedPeriodId] = useState(filters.period_id ?? '');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Wilayah dropdown states
  const [provinces, setProvinces] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [regencies, setRegencies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // Fetch provinces on mount
  useEffect(() => {
    fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Error fetching provinces:', err));
  }, []);

  // Fetch regencies when province selected
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      setSelectedRegencyId('');
      return;
    }
    fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
      .then(res => res.json())
      .then(data => setRegencies(data))
      .catch(err => console.error('Error fetching regencies:', err));
  }, [selectedProvinceId]);

  // Fetch districts when regency selected
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      setSelectedDistrictId('');
      return;
    }
    fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${selectedRegencyId}.json`)
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(err => console.error('Error fetching districts:', err));
  }, [selectedRegencyId]);

  // Fetch villages when district selected
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      setSelectedVillageId('');
      return;
    }
    fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`)
      .then(res => res.json())
      .then(data => setVillages(data))
      .catch(err => console.error('Error fetching villages:', err));
  }, [selectedDistrictId]);

  // Update form when village selected
  useEffect(() => {
    if (!selectedVillageId) return;
    const village = villages.find(v => v.id === selectedVillageId);
    if (village) {
      form.setData(data => ({
        ...data,
        village_name: village.name,
        village_code: village.id
      }));
    }
  }, [selectedVillageId]);

  const form = useForm({
    village_name: '',
    district_name: '',
    regency_name: '',
    village_code: '',
    capacity: 0,
  });

  const importForm = useForm({
    file: null as File | null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.get(
        route('admin.locations.index'),
        {
          search: search || undefined,
          period_id: selectedPeriodId || undefined,
        },
        { preserveState: true, replace: true, preserveScroll: true },
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search, selectedPeriodId]);

  const resetDropdowns = () => {
    setSelectedProvinceId('');
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      form.put(route('admin.locations.update', editingLocation.id), {
        onSuccess: () => {
          setEditingLocation(null);
          form.reset();
          resetDropdowns();
        },
      });
    } else {
      form.post(route('admin.locations.store'), {
        onSuccess: () => {
          setShowCreateModal(false);
          form.reset();
          resetDropdowns();
        },
      });
    }
  };

  const openEditForm = (l: Location) => {
    setEditingLocation(l);
    form.setData({
      village_name: l.village_name,
      district_name: l.district_name,
      regency_name: l.regency_name,
      village_code: l.village_code ?? '',
      capacity: Number(l.capacity ?? 0),
    });
    
    // Reset dropdowns first
    setSelectedProvinceId('');
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    
    // Pre-select dropdowns based on village_code (BPS code)
    if (l.village_code) {
      const code = l.village_code;
      // BPS code format: 10 digits (province=2, regency=4, district=6, village=10)
      const provId = code.substring(0, 2);
      const regId = code.substring(0, 4);
      const distId = code.substring(0, 6);
      
      // Set province first, useEffect will cascade
      setSelectedProvinceId(provId);
      setSelectedRegencyId(regId);
      setSelectedDistrictId(distId);
      setSelectedVillageId(code);
    }
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    form.reset();
    resetDropdowns();
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    form.reset();
    resetDropdowns();
  };

  const setDeleting = (l: Location) => {
    if (!l.can_delete) return;
    setDeletingLocation(l);
  };

  const confirmDelete = () => {
    if (!deletingLocation) return;
    router.delete(route('admin.locations.destroy', deletingLocation.id), {
      onSuccess: () => setDeletingLocation(null),
    });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    importForm.post(route('admin.lokasi.import'), {
      onSuccess: () => {
        setShowImportModal(false);
        importForm.reset();
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout title="Master Wilayah KKN">
      <Head title="Master Wilayah & Lokasi" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-24 font-sans"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Direktori Wilayah."
            subtitle="Manajemen data induk desa, kecamatan, dan kabupaten sebagai basis penempatan kelompok."
            icon={MapPinned}
            groupLabel="Master Data Operasional"
          >
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowImportModal(true)}
                className="h-10 px-5 bg-white border border-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Upload size={14} strokeWidth={2.5} /> Impor Massal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-5 bg-emerald-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-950 transition-all flex items-center gap-2 shadow-sm shadow-emerald-900/20"
              >
                <Plus size={14} strokeWidth={2.5} /> Tambah Lokasi
              </motion.button>
            </div>
          </PageHeader>
        </motion.div>

        {/* --- STATS GRID --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        </motion.div>

        {/* --- MAIN TABLE SECTION --- */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <ContentPanel
              title="Direktori Wilayah Penempatan"
              description="Daftar induk titik lokasi administratif di seluruh wilayah penugasan."
              icon={MapPinned}
              padding={false}
              headerAction={
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <select
                      value={selectedPeriodId}
                      onChange={(e) => setSelectedPeriodId(e.target.value)}
                      className="h-9 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-[10px] font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase tracking-widest"
                      title="Filter Periode KKN"
                      aria-label="Filter Periode KKN"
                    >
                      <option value="">SEMUA PERIODE</option>
                      {periods?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"
                    />
                  </div>
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="CARI DESA / KECAMATAN..."
                    className="w-72"
                  />
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest tabular-nums">
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
                        <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter truncate max-w-[200px]">
                          {l.full_name || '-'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">
                          {l.district_name || '-'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                          {l.regency_name || '-'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      {l.village_code ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-gray-50 rounded-lg flex items-center justify-center text-emerald-900 border border-gray-100">
                            <Database size={12} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-950 tabular-nums tracking-widest">
                            {l.village_code}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100 w-max" title="Kombinasi wilayah tidak valid. Silakan edit data ini.">
                          <AlertCircle size={12} strokeWidth={3} className="shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">
                            Data Cacat
                          </span>
                        </div>
                      )}
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-2 w-28">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter tabular-nums leading-none">
                          <div className="flex items-center gap-1.5">
                            <Users size={10} className="text-emerald-600" />
                            <span
                              className={clsx(
                                l.groups_count >= (Number(l.capacity) || 0) && (Number(l.capacity) || 0) > 0
                                  ? 'text-amber-600 font-black'
                                  : 'text-emerald-950',
                              )}
                            >
                              {l.groups_count}
                            </span>
                          </div>
                          <span className="text-emerald-600">/ {l.capacity ?? 0}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                          <div
                            className={clsx(
                              'h-full transition-all rounded-full',
                              (Number(l.capacity) ?? 0) > 0 && l.groups_count >= (Number(l.capacity))
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-400',
                            )}
                            style={{
                              width: `${Math.min(100, (l.groups_count / (Number(l.capacity) || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEditForm(l)}
                          className="h-9 px-3 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                          title="Edit"
                          aria-label="Edit lokasi"
                        >
                          <Pencil size={14} strokeWidth={2.5} /> Edit
                        </motion.button>
                        <motion.button
                          whileHover={l.can_delete ? { scale: 1.1 } : {}}
                          whileTap={l.can_delete ? { scale: 0.9 } : {}}
                          onClick={() => setDeleting(l)}
                          disabled={!l.can_delete}
                          className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm disabled:opacity-30"
                          title={l.can_delete ? 'Hapus' : (l.delete_blocker ?? 'Tidak dapat dihapus')}
                          aria-label="Hapus lokasi"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </motion.div>
        </div>
      </motion.div>

      {/* IMPORT MODAL */}
      <Modal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Master Wilayah"
      >
        <form onSubmit={handleImport} className="p-6 space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">Format Berkas</p>
                <p className="text-[10px] font-medium text-amber-800/70 leading-relaxed uppercase">
                  Gunakan format Excel (.xlsx) dengan kolom: Desa, Kecamatan, Kabupaten, Kapasitas.
                </p>
              </div>
              <a
                href={route('admin.lokasi.template')}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors"
                download
              >
                <FileSpreadsheet size={14} />
                Unduh Template Excel
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] pl-1">
              Pilih Berkas Spreadsheet
            </label>
            <div className="relative group/upload">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 group-hover/upload:border-emerald-400 transition-all bg-gray-50/50">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet size={28} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                    {importForm.data.file ? importForm.data.file.name : 'Klik untuk Unggah Berkas'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Maksimal 10MB (XLSX, CSV)</p>
                </div>
              </div>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                accept=".xlsx,.xls,.csv"
                title="Pilih Berkas Spreadsheet"
                aria-label="Pilih Berkas Spreadsheet"
              />
            </div>
            {importForm.errors.file && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 mt-3 shadow-sm">
                <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase tracking-wider">
                  {importForm.errors.file}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="flex-1 h-12 border-2 border-gray-100 text-gray-500 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={importForm.processing || !importForm.data.file}
              className="flex-[2] h-12 bg-emerald-900 text-white text-xs font-black rounded-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 active:scale-95 uppercase tracking-widest disabled:opacity-50"
            >
              {importForm.processing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Proses Impor Data
            </button>
          </div>
        </form>
      </Modal>

       {/* EDIT MODAL */}
       <Modal
         show={!!editingLocation}
         onClose={cancelEdit}
         title="Edit Data Wilayah KKN"
       >
         <form onSubmit={submitForm} className="p-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                 Provinsi
               </label>
               <select
                 value={selectedProvinceId}
                 onChange={(e) => {
                   setSelectedProvinceId(e.target.value);
                   form.setData(data => ({
                     ...data,
                     regency_name: '',
                     district_name: '',
                     village_name: '',
                     village_code: ''
                   }));
                 }}
                 className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white"
                 title="Pilih Provinsi"
                 aria-label="Pilih Provinsi"
                 required
               >
                 <option value="">-- Pilih Provinsi --</option>
                 {provinces.map((p) => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                 Kab/Kota
               </label>
               <select
                 value={selectedRegencyId}
                 onChange={(e) => {
                   setSelectedRegencyId(e.target.value);
                   const name = regencies.find((r) => r.id === e.target.value)?.name || '';
                   form.setData(data => ({
                     ...data,
                     regency_name: name,
                     district_name: '',
                     village_name: '',
                     village_code: ''
                   }));
                 }}
                 className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                 required
                 disabled={!selectedProvinceId || regencies.length === 0}
                 title="Pilih Kabupaten atau Kota"
                 aria-label="Pilih Kabupaten atau Kota"
               >
                 <option value="">-- Pilih Kab/Kota --</option>
                 {regencies.map((r) => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                 Kecamatan
               </label>
               <select
                 value={selectedDistrictId}
                 onChange={(e) => {
                   setSelectedDistrictId(e.target.value);
                   const name = districts.find((d) => d.id === e.target.value)?.name || '';
                   form.setData(data => ({
                     ...data,
                     district_name: name,
                     village_name: '',
                     village_code: ''
                   }));
                 }}
                 className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                 required
                 disabled={!selectedRegencyId || districts.length === 0}
                 title="Pilih Kecamatan"
                 aria-label="Pilih Kecamatan"
               >
                 <option value="">-- Pilih Kecamatan --</option>
                 {districts.map((d) => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                 Desa/Kelurahan
               </label>
               <select
                 value={selectedVillageId}
                 onChange={(e) => setSelectedVillageId(e.target.value)}
                 className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                 required
                 disabled={!selectedDistrictId || villages.length === 0}
                 title="Pilih Desa atau Kelurahan"
                 aria-label="Pilih Desa atau Kelurahan"
               >
                 <option value="">-- Pilih Desa --</option>
                 {villages.map((v) => (
                   <option key={v.id} value={v.id}>{v.name}</option>
                 ))}
               </select>
               {form.errors.village_name && (
                 <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest leading-relaxed">
                   {form.errors.village_name}
                 </p>
               )}
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">
                 Kode Wilayah (BPS)
               </label>
               <input
                 type="text"
                 value={form.data.village_code ?? ''}
                 onChange={(e) => form.setData('village_code', e.target.value)}
                 className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs font-black text-emerald-950 focus:border-emerald-600 outline-none uppercase tracking-widest"
                 placeholder="Terisi Otomatis"
                 readOnly
               />
             </div>
             <div className="space-y-1.5 md:col-span-2">
               <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">
                 Kapasitas Maksimal Kelompok
               </label>
               <input
                 type="number"
                 min="0"
                 value={form.data.capacity}
                 onChange={(e) => form.setData('capacity', Number(e.target.value))}
                 className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-white text-xs font-black text-emerald-950 text-center tabular-nums focus:border-emerald-600 outline-none"
                 placeholder="0"
                 title="Kapasitas Maksimal Kelompok"
                 aria-label="Kapasitas Maksimal Kelompok"
               />
             </div>
           </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 h-12 border-2 border-gray-100 text-gray-500 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              Batalkan
            </button>
            <motion.button
              whileHover={!form.processing ? { scale: 1.02 } : {}}
              whileTap={!form.processing ? { scale: 0.98 } : {}}
              type="submit"
              disabled={form.processing}
              className="flex-[2] h-12 bg-emerald-900 text-white text-xs font-black rounded-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 uppercase tracking-widest disabled:opacity-50"
            >
              {form.processing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Update Data Lokasi
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* CREATE MODAL */}
      <Modal
        show={showCreateModal}
        onClose={cancelCreate}
        title="Registrasi Wilayah Baru"
      >
        <form onSubmit={submitForm} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                Provinsi
              </label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  setSelectedProvinceId(e.target.value);
                  form.setData(data => ({
                    ...data,
                    regency_name: '',
                    district_name: '',
                    village_name: '',
                    village_code: ''
                  }));
                }}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white"
                title="Pilih Provinsi"
                aria-label="Pilih Provinsi"
                required
              >
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                Kab/Kota
              </label>
              <select
                value={selectedRegencyId}
                onChange={(e) => {
                  setSelectedRegencyId(e.target.value);
                  const name = regencies.find((r) => r.id === e.target.value)?.name || '';
                  form.setData(data => ({
                    ...data,
                    regency_name: name,
                    district_name: '',
                    village_name: '',
                    village_code: ''
                  }));
                }}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                required
                disabled={!selectedProvinceId || regencies.length === 0}
                title="Pilih Kabupaten atau Kota"
                aria-label="Pilih Kabupaten atau Kota"
              >
                <option value="">-- Pilih Kab/Kota --</option>
                {regencies.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                Kecamatan
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => {
                  setSelectedDistrictId(e.target.value);
                  const name = districts.find((d) => d.id === e.target.value)?.name || '';
                  form.setData(data => ({
                    ...data,
                    district_name: name,
                    village_name: '',
                    village_code: ''
                  }));
                }}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                required
                disabled={!selectedRegencyId || districts.length === 0}
                title="Pilih Kecamatan"
                aria-label="Pilih Kecamatan"
              >
                <option value="">-- Pilih Kecamatan --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                Desa/Kelurahan
              </label>
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-50"
                required
                disabled={!selectedDistrictId || villages.length === 0}
                title="Pilih Desa atau Kelurahan"
                aria-label="Pilih Desa atau Kelurahan"
              >
                <option value="">-- Pilih Desa --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">
                Kode Wilayah (BPS)
              </label>
              <input
                type="text"
                value={form.data.village_code ?? ''}
                onChange={(e) => form.setData('village_code', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs font-black text-emerald-950 focus:border-emerald-600 outline-none uppercase tracking-widest"
                placeholder="Terisi Otomatis"
                readOnly
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
                onChange={(e) => form.setData('capacity', Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-white text-xs font-black text-emerald-950 text-center tabular-nums focus:border-emerald-600 outline-none"
                placeholder="0"
                title="Kapasitas Maksimal"
                aria-label="Kapasitas Maksimal"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={cancelCreate}
              className="flex-1 h-12 border-2 border-gray-100 text-gray-500 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              Batalkan
            </button>
            <motion.button
              whileHover={!form.processing ? { scale: 1.02 } : {}}
              whileTap={!form.processing ? { scale: 0.98 } : {}}
              type="submit"
              disabled={form.processing}
              className="flex-[2] h-12 bg-emerald-900 text-white text-xs font-black rounded-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 uppercase tracking-widest disabled:opacity-50"
            >
              {form.processing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Registrasi Wilayah
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={confirmDelete}
        title="Hapus Lokasi?"
        message={`Apakah Anda yakin ingin menghapus data lokasi ${deletingLocation?.village_name}? Tindakan ini permanen.`}
        confirmVariant="danger"
      />
    </AppLayout>
  );
}
