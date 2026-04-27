import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  RefreshCw,
  Info,
  Settings,
  Eye,
  LayoutGrid,
  AlertTriangle,
  X,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

interface JenisKkn {
  id: number;
  code: string;
  name: string;
  description: string | null;
  registration_mode: string;
  placement_mode: string;
  registration_mode_label: string;
  placement_mode_label: string;
  min_sks: number;
  min_gpa: string;
  require_not_married: boolean;
  require_parent_permission: boolean;
  require_health_certificate: boolean;
  require_bta_ppi: boolean;
  specific_prodi_ids: number[];
  custom_requirements: string[];
  allowed_regencies: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
  periodes_count: number;
  attendance_config: {
    geofence_enabled: boolean;
    radius_meters: number;
    location_source: string;
    require_photo: boolean;
    allow_offline_sync?: boolean;
  } | null;
}

interface Props {
  jenisKkn: JenisKkn[];
  filters: { search?: string };
  prodis: { id: number; nama: string }[];
  registrationModes: { value: string; label: string }[];
  placementModes: { value: string; label: string }[];
}

export default function JenisKknIndex({
  jenisKkn,
  filters,
  prodis,
  registrationModes,
  placementModes,
}: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Premium Confirm Dialog State ──────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<JenisKkn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const form = useForm({
    code: '',
    name: '',
    description: '',
    registration_mode: 'open',
    placement_mode: 'automatic_after_approval',
    min_sks: 0,
    min_gpa: '0.00',
    require_not_married: false,
    require_parent_permission: false,
    require_health_certificate: false,
    require_bta_ppi: true,
    specific_prodi_ids: [] as number[],
    custom_requirements: [] as string[],
    allowed_regencies: [] as string[],
    color: 'emerald',
    is_active: true,
    sort_order: 0,
    attendance_config: {
      geofence_enabled: true,
      radius_meters: 500,
      location_source: 'posko',
      require_photo: true,
    },
  });

  const JAWA_TENGAH_REGENCIES = [
    'BANYUMAS',
    'PURBALINGGA',
    'BANJARNEGARA',
    'KEBUMEN',
    'CILACAP',
    'BREBES',
    'TEGAL',
    'PEMALANG',
    'PEKALONGAN',
    'BATANG',
    'KENDAL',
    'SEMARANG',
    'DEMAK',
    'KUDUS',
    'PATI',
    'JEPARA',
    'REMBANG',
    'BLORA',
    'GROBOGAN',
    'SRAGEN',
    'KARANGANYAR',
    'WONOGIRI',
    'SUKOHARJO',
    'KLATEN',
    'BOYOLALI',
    'MAGELANG',
    'TEMANGGUNG',
    'WONOSOBO',
    'PURWOREJO',
    'PANGANDARAN',
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(
          '/admin/jenis-kkn',
          { search: search || undefined },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [filters.search, search]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      form.put(`/admin/jenis-kkn/${editingId}`, {
        preserveScroll: true,
        onSuccess: () => {
          form.reset();
          setEditingId(null);
          setIsDrawerOpen(false);
        },
      });
    } else {
      form.post('/admin/jenis-kkn', {
        preserveScroll: true,
        onSuccess: () => {
          form.reset();
          setIsDrawerOpen(false);
        },
      });
    }
  };

  const startEdit = (item: JenisKkn) => {
    setEditingId(item.id);
    form.setData({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      registration_mode: item.registration_mode,
      placement_mode: item.placement_mode,
      min_sks: item.min_sks,
      min_gpa: item.min_gpa,
      require_not_married: item.require_not_married,
      require_parent_permission: item.require_parent_permission,
      require_health_certificate: item.require_health_certificate,
      require_bta_ppi: item.require_bta_ppi,
      specific_prodi_ids: item.specific_prodi_ids ?? [],
      custom_requirements: item.custom_requirements ?? [],
      allowed_regencies: item.allowed_regencies ?? [],
      color: item.color,
      is_active: item.is_active,
      sort_order: item.sort_order,
      attendance_config: item.attendance_config ?? {
        geofence_enabled: true,
        radius_meters: 500,
        location_source: 'posko',
        require_photo: true,
      },
    });
    setIsDrawerOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
    setIsDrawerOpen(false);
  };

  const openConfirmDialog = useCallback((item: JenisKkn) => {
    setConfirmTarget(item);
    setConfirmOpen(true);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmOpen(false);
    setTimeout(() => {
      setConfirmTarget(null);
      setIsDeleting(false);
    }, 300);
  }, []);

  const confirmDestroy = useCallback(() => {
    if (!confirmTarget) return;
    setIsDeleting(true);
    router.delete(`/admin/jenis-kkn/${confirmTarget.id}`, {
      preserveScroll: true,
      onFinish: () => closeConfirmDialog(),
    });
  }, [confirmTarget, closeConfirmDialog]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  };

  return (
    <AppLayout title="Manajemen Jenis KKN">
      <Head title="Konfigurasi Skema KKN" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto space-y-8 font-sans pb-12 px-4 sm:px-6 lg:px-8"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-end gap-6">
          <PageHeader
            title="Skema Program."
            subtitle="Konfigurasi parameter akademik dan aturan operasional untuk setiap kategori KKN."
            icon={Layers}
            groupLabel="Data Master Sistem"
            stats={{
              label: 'Total Skema',
              value: jenisKkn.length,
              icon: Database,
            }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingId(null);
              form.reset();
              setIsDrawerOpen(true);
            }}
            className="mb-8 h-12 px-6 bg-cyan-600 text-white text-sm font-semibold rounded-2xl hover:bg-cyan-700 transition-all flex items-center gap-3 shadow-lg shadow-cyan-600/20 active:scale-[0.98] font-sans tracking-tight shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Tambah Skema Baru
          </motion.button>
        </motion.div>

        {/* ── FORM MODAL (Popup) ────────────────────────────────── */}
        <AnimatePresence>
          {isDrawerOpen && (
            <Dialog
              as="div"
              className="relative z-50"
              open={isDrawerOpen}
              onClose={cancelEdit}
              static
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                aria-hidden="true"
              />

              {/* Panel Container */}
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-full max-w-4xl"
                >
                  <DialogPanel className="bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-8 py-6 flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-bold text-white tracking-tight font-sans">
                          {editingId ? 'Perbarui Skema' : 'Tambah Skema Baru'}
                        </DialogTitle>
                        <p className="text-cyan-100 text-sm mt-1 font-sans">
                          Atur parameter kualifikasi dan alur kerja skema.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={submit} className="p-8 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                            Kode Skema
                          </label>
                          <input
                            type="text"
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none uppercase font-sans bg-[#F8FAF9]"
                            placeholder="REGULER"
                            required
                          />
                          {form.errors.code && (
                            <p className="text-[11px] font-medium text-rose-600 mt-1 font-sans">
                              {form.errors.code}
                            </p>
                          )}
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                  Nama Program
                </label>
                <input
                  type="text"
                  value={form.data.name}
                  onChange={(e) => form.setData('name', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none font-sans bg-[#F8FAF9]"
                  placeholder="KKN Reguler"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                Deskripsi Singkat
              </label>
              <textarea
                value={form.data.description}
                onChange={(e) => form.setData('description', e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-slate-50 text-sm font-medium text-cyan-950 focus:border-cyan-600 outline-none min-h-[100px] font-sans bg-[#F8FAF9]"
                placeholder="Penjelasan mengenai skema program ini..."
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                  Minimal SKS
                </label>
                <input
                  type="number"
                  value={form.data.min_sks}
                  onChange={(e) => form.setData('min_sks', parseInt(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none tabular-nums font-sans bg-[#F8FAF9]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                  Minimal IPK
                </label>
                <input
                  type="text"
                  value={form.data.min_gpa}
                  onChange={(e) => form.setData('min_gpa', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none tabular-nums font-sans bg-[#F8FAF9]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                  Mode Pendaftaran
                </label>
                <select
                  value={form.data.registration_mode}
                  onChange={(e) => form.setData('registration_mode', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none bg-[#F8FAF9] font-sans"
                >
                  {registrationModes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans">
                  Mode Penempatan
                </label>
                <select
                  value={form.data.placement_mode}
                  onChange={(e) => form.setData('placement_mode', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none bg-[#F8FAF9] font-sans"
                >
                  {placementModes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- VALIDASI OTOMATIS SISTEM --- */}
            <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                VALIDASI OTOMATIS SISTEM
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_bta_ppi}
                    onChange={(e) => form.setData('require_bta_ppi', e.target.checked)}
                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Lulus BTA-PPI</span>
                    <span className="text-[10px] text-slate-500 font-medium">Sistem mengecek data BTA di database.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_not_married}
                    onChange={(e) => form.setData('require_not_married', e.target.checked)}
                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Belum Menikah</span>
                    <span className="text-[10px] text-slate-500 font-medium">Sistem mengecek status pernikahan.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* --- DOKUMEN PERSYARATAN (CEK MANUAL) --- */}
            <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                DOKUMEN PERSYARATAN (CEK MANUAL ADMIN)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_health_certificate}
                    onChange={(e) => form.setData('require_health_certificate', e.target.checked)}
                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Surat Sehat</span>
                    <span className="text-[10px] text-slate-500 font-medium">Wajib unggah Surat Keterangan Sehat.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_parent_permission}
                    onChange={(e) => form.setData('require_parent_permission', e.target.checked)}
                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Izin Orang Tua/Suami</span>
                    <span className="text-[10px] text-slate-500 font-medium">Wajib unggah Surat Izin.</span>
                  </div>
                </label>
                
                <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-cyan-200 transition-all sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.data.custom_requirements || []).length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          form.setData('custom_requirements', ['']);
                        } else {
                          form.setData('custom_requirements', []);
                        }
                      }}
                      className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Dokumen Tambahan Opsional Khusus</span>
                      <span className="text-[10px] text-slate-500 font-medium">Centang bila ada dokumen ekstra spesifik yang harus diunggah mahasiswa.</span>
                    </div>
                  </label>
                  {(form.data.custom_requirements || []).length > 0 && (
                    <div className="pl-8 space-y-3">
                      {(form.data.custom_requirements || []).map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => {
                              const newReqs = [...form.data.custom_requirements];
                              newReqs[index] = e.target.value;
                              form.setData('custom_requirements', newReqs);
                            }}
                            placeholder="Ketik nama dokumen (Contoh: Surat Rekomendasi Dekan)"
                            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-white shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newReqs = [...form.data.custom_requirements];
                              newReqs.splice(index, 1);
                              form.setData('custom_requirements', newReqs);
                            }}
                            className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => form.setData('custom_requirements', [...form.data.custom_requirements, ''])}
                        className="text-[10px] font-bold text-cyan-600 flex items-center gap-1 hover:text-cyan-800 px-2 py-1 transition-colors"
                      >
                        <Plus size={12} /> Tambah Syarat Dokumen Lainnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">

              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  KONFIGURASI ABSENSI & GEOTAGGING
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-cyan-200 transition-all shadow-sm">
                      <input
                        type="checkbox"
                        checked={form.data.attendance_config?.geofence_enabled}
                        onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, geofence_enabled: e.target.checked })}
                        className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Aktifkan Geofencing</span>
                        <span className="text-[10px] text-slate-500 font-medium">Validasi lokasi saat mahasiswa absen.</span>
                      </div>
                    </label>

                    {form.data.attendance_config?.geofence_enabled && (
                      <div className="space-y-1.5 pl-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius Absensi (Meter)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={form.data.attendance_config?.radius_meters}
                            onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, radius_meters: parseInt(e.target.value) })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-white"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">METER</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sumber Lokasi Rujukan</label>
                      <div className="relative group">
                        <select
                          value={form.data.attendance_config?.location_source}
                          onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, location_source: e.target.value })}
                          className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-xs font-bold text-cyan-950 focus:border-cyan-600 appearance-none outline-none bg-white shadow-sm"
                        >
                          <option value="posko">POSKO KELOMPOK (REGULER)</option>
                          <option value="domisili">LOKASI DOMISILI (MANDIRI)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-cyan-200 transition-all shadow-sm">
                      <input
                        type="checkbox"
                        checked={form.data.attendance_config?.require_photo}
                        onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, require_photo: e.target.checked })}
                        className="w-5 h-5 text-cyan-600 border-slate-300 rounded-lg focus:ring-cyan-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-cyan-950 uppercase tracking-tight">Wajib Lampiran Foto</span>
                        <span className="text-[10px] text-slate-500 font-medium">Mahasiswa wajib upload foto saat absen.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-6 border-t border-slate-200">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Batasan Wilayah Kabupaten (Opsional)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-white border border-slate-100 rounded-xl scrollbar-hide">
                  {JAWA_TENGAH_REGENCIES.map((regency) => (
                    <label key={regency} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.data.allowed_regencies.includes(regency)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...form.data.allowed_regencies, regency]
                            : form.data.allowed_regencies.filter((r) => r !== regency);
                          form.setData('allowed_regencies', updated);
                        }}
                        className="w-3.5 h-3.5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-[10px] font-bold text-slate-600 group-hover:text-cyan-600 transition-colors uppercase">
                        {regency}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.data.is_active}
                  onChange={(e) => form.setData('is_active', e.target.checked)}
                  className="w-5 h-5 text-cyan-600 border-slate-200 rounded-lg focus:ring-cyan-500 cursor-pointer"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-semibold text-cyan-950 cursor-pointer tracking-tight font-sans"
                >
                  Skema Aktif
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider font-sans">
                  Urutan
                </label>
                <input
                  type="number"
                  value={form.data.sort_order}
                  onChange={(e) => form.setData('sort_order', parseInt(e.target.value))}
                  className="w-16 h-10 text-center rounded-xl border-2 border-slate-50 text-sm font-bold font-sans bg-[#F8FAF9]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-cyan-50">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 h-12 border-2 border-slate-100 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all font-sans tracking-tight"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={form.processing}
                className="flex-[2] h-12 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-600/20 active:scale-[0.98] font-sans tracking-tight disabled:opacity-50"
              >
                {form.processing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : editingId ? (
                  <Settings size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {editingId ? 'Simpan Perubahan' : 'Daftarkan Skema'}
              </button>
            </div>
                    </form>
                  </DialogPanel>
                </motion.div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-8 items-start">
          {/* DATA TABLE PANEL */}
          <motion.div variants={itemVariants} className="w-full">
            <ContentPanel
              title="Indeks Skema Program"
              icon={LayoutGrid}
              padding={false}
              headerAction={
                <SearchInput
                  placeholder="CARI SKEMA..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
              }
            >
              <PremiumTable
                headers={['Nama & Deskripsi', 'Parameter Syarat', 'Alur Kerja', 'Status', 'Opsi']}
                isEmpty={jenisKkn.length === 0}
                emptyText="Belum ada skema KKN yang terkonfigurasi."
              >
                {jenisKkn.map((item) => (
                  <PremiumTableRow
                    key={item.id}
                    className={clsx('group', editingId === item.id && 'bg-cyan-50/50')}
                  >
                    <PremiumTableCell>
                      <div className="flex flex-col py-1 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-cyan-950 tracking-tight group-hover:text-cyan-600 transition-colors">
                            {item.name}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-50 text-cyan-800/60 rounded text-[9px] font-bold border border-cyan-100 uppercase tracking-wider">
                            {item.code}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1 max-w-[200px]">
                          {item.description || 'Tidak ada deskripsi.'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1.5 font-sans">
                        <div className="flex items-center gap-2">
                          <Database size={12} className="text-cyan-600" />
                          <span className="text-[11px] font-bold text-cyan-950 tabular-nums">
                            {item.min_sks} SKS
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={12} className="text-cyan-600" />
                          <span className="text-[11px] font-bold text-cyan-950 tabular-nums">
                            IPK {item.min_gpa}
                          </span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1 font-sans">
                        <span className="text-[10px] font-bold text-cyan-950 uppercase tracking-wider leading-none">
                          {item.registration_mode_label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                          {item.placement_mode_label}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <StatusTag status={item.is_active ? 'Aktif' : 'Nonaktif'} />
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/jenis-kkn/${item.id}`}
                          className="h-9 px-3 bg-white border-2 border-slate-50 text-cyan-950 rounded-xl hover:bg-cyan-50 hover:border-cyan-100 transition-all flex items-center gap-2 text-[11px] font-semibold tracking-tight no-underline font-sans"
                        >
                          <Eye size={16} /> Detail
                        </Link>
                        <button
                          onClick={() => startEdit(item)}
                          className="h-8 w-8 flex items-center justify-center text-emerald-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => openConfirmDialog(item)}
                          className="h-8 w-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </motion.div>
        </div>

        {/* ── Premium Confirm Dialog ── */}
        <Transition show={confirmOpen} as="div">
          <Dialog
            as="div"
            className="relative z-[9999]"
            initialFocus={cancelButtonRef}
            onClose={closeConfirmDialog}
          >
            {/* Backdrop */}
            <TransitionChild
              as="div"
              enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Dialog Container */}
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <TransitionChild
                  as="div"
                  enter="ease-out duration-300" enterFrom="opacity-0 scale-90 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
                  leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-90 translate-y-4"
                >
                  <DialogPanel className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-rose-900/10 ring-1 ring-slate-900/5">
                    {/* Close Button */}
                    <button
                      onClick={closeConfirmDialog}
                      className="absolute right-4 top-4 z-10 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>

                    {/* Top Gradient Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />

                    <div className="px-8 pt-8 pb-4">
                      {/* Icon */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-red-100 ring-8 ring-rose-50"
                      >
                        <ShieldAlert size={28} className="text-rose-600" strokeWidth={2} />
                      </motion.div>

                      {/* Title */}
                      <DialogTitle as="h3" className="text-center text-lg font-bold text-slate-900 tracking-tight font-sans">
                        Hapus Skema Program?
                      </DialogTitle>

                      {/* Description */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-3 text-center"
                      >
                        <p className="text-sm text-slate-500 leading-relaxed font-sans">
                          Skema{' '}
                          <span className="font-bold text-slate-800 bg-rose-50 px-2 py-0.5 rounded-lg">
                            {confirmTarget?.name}
                          </span>{' '}
                          akan dihapus secara <span className="font-bold text-rose-600">permanen</span>.
                        </p>
                        <p className="mt-2 text-xs text-slate-400 font-medium font-sans">
                          Tindakan ini tidak dapat dibatalkan dan semua data terkait akan hilang.
                        </p>
                      </motion.div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 px-8 pb-8 pt-4">
                      <motion.button
                        ref={cancelButtonRef}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={closeConfirmDialog}
                        className="flex-1 h-12 border-2 border-slate-150 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-sans tracking-tight active:scale-[0.98]"
                      >
                        Batalkan
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        onClick={confirmDestroy}
                        disabled={isDeleting}
                        className="flex-[1.5] h-12 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-bold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-rose-600/25 active:scale-[0.98] font-sans tracking-tight disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} strokeWidth={2.5} />
                        )}
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                      </motion.button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      </motion.div>
    </AppLayout>
  );
}
