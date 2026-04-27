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
  Globe,
  Camera,
  MapPin,
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
  requirements_config: any[] | null;
  attendance_config: {
    geofence_enabled: boolean;
    radius_meters: number;
    location_source: string;
    require_photo: boolean;
  } | null;
  allowed_regencies: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
  periodes_count: number;
}

interface Props {
  jenisKkn: JenisKkn[];
  filters: { search?: string };
  registrationModes: { value: string; label: string }[];
  placementModes: { value: string; label: string }[];
}

export default function JenisKknIndex({
  jenisKkn,
  filters,
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
    allowed_regencies: [] as string[],
    color: 'emerald',
    is_active: true,
    sort_order: 0,
    requirements_config: [] as any[],
    attendance_config: {
      geofence_enabled: true,
      radius_meters: 100,
      location_source: 'posko',
      require_photo: true,
    },
  });

  const JAWA_TENGAH_REGENCIES = [
    'BANYUMAS', 'PURBALINGGA', 'BANJARNEGARA', 'KEBUMEN', 'CILACAP', 'BREBES', 'TEGAL', 'PEMALANG',
    'PEKALONGAN', 'BATANG', 'KENDAL', 'SEMARANG', 'DEMAK', 'KUDUS', 'PATI', 'JEPARA', 'REMBANG',
    'BLORA', 'GROBOGAN', 'SRAGEN', 'KARANGANYAR', 'WONOGIRI', 'SUKOHARJO', 'KLATEN', 'BOYOLALI',
    'MAGELANG', 'TEMANGGUNG', 'WONOSOBO', 'PURWOREJO', 'PANGANDARAN',
  ];

  const addDynamicRequirement = (type: 'upload' | 'db_check') => {
    const newRequirement = type === 'upload' 
      ? { name: '', type: 'upload', key: `upload_${Date.now()}` }
      : { name: '', type: 'db_check', field: 'sks_completed', min_value: 100, key: `db_${Date.now()}` };
    
    form.setData('requirements_config', [...(form.data.requirements_config || []), newRequirement]);
  };

  const removeDynamicRequirement = (index: number) => {
    const updated = [...(form.data.requirements_config || [])];
    updated.splice(index, 1);
    form.setData('requirements_config', updated);
  };

  const updateDynamicRequirement = (index: number, field: string, value: any) => {
    const updated = [...(form.data.requirements_config || [])];
    updated[index] = { ...updated[index], [field]: value };
    form.setData('requirements_config', updated);
  };

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
      allowed_regencies: item.allowed_regencies ?? [],
      color: item.color,
      is_active: item.is_active,
      sort_order: item.sort_order,
      requirements_config: item.requirements_config ?? [],
      attendance_config: item.attendance_config ?? {
        geofence_enabled: true,
        radius_meters: 100,
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
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
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

        {/* ── FORM MODAL ── */}
        <AnimatePresence>
          {isDrawerOpen && (
            <Dialog as="div" className="relative z-50" open={isDrawerOpen} onClose={cancelEdit} static>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-4xl"
                >
                  <DialogPanel className="bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-8 py-6 flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-bold text-white tracking-tight">
                          {editingId ? 'Perbarui Skema' : 'Tambah Skema Baru'}
                        </DialogTitle>
                        <p className="text-cyan-100 text-sm mt-1">Konfigurasi aturan dan parameter pendaftaran.</p>
                      </div>
                      <button onClick={cancelEdit} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={submit} className="p-8 space-y-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-cyan-900 uppercase tracking-wider pl-1">Kode Skema</label>
                          <input
                            type="text"
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-[#F8FAF9]"
                            placeholder="REGULER"
                            required
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[11px] font-black text-cyan-900 uppercase tracking-wider pl-1">Nama Program</label>
                          <input
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-50 text-sm font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-[#F8FAF9]"
                            placeholder="KKN Reguler"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-cyan-900 uppercase tracking-wider pl-1">Mode Pendaftaran</label>
                          <div className="relative group">
                            <select
                              value={form.data.registration_mode}
                              onChange={(e) => form.setData('registration_mode', e.target.value)}
                              className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-slate-50 text-sm font-bold text-cyan-950 focus:border-cyan-600 appearance-none outline-none bg-[#F8FAF9]"
                            >
                              {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-cyan-900 uppercase tracking-wider pl-1">Mode Penempatan</label>
                          <div className="relative group">
                            <select
                              value={form.data.placement_mode}
                              onChange={(e) => form.setData('placement_mode', e.target.value)}
                              className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-slate-50 text-sm font-bold text-cyan-950 focus:border-cyan-600 appearance-none outline-none bg-[#F8FAF9]"
                            >
                              {placementModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                          </div>
                        </div>
                      </div>

                      {/* --- BUILDER PERSYARATAN --- */}
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PERSYARATAN DINAMIS (HYBRID)</h4>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => addDynamicRequirement('db_check')} className="h-8 px-3 bg-white border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm">
                              <Database size={12} /> + Cek Database
                            </button>
                            <button type="button" onClick={() => addDynamicRequirement('upload')} className="h-8 px-3 bg-white border border-cyan-100 text-cyan-700 text-[9px] font-black uppercase rounded-lg hover:bg-cyan-50 transition-all flex items-center gap-1.5 shadow-sm">
                              <Plus size={12} /> + Syarat Upload
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(form.data.requirements_config || []).map((req, index) => (
                            <div key={req.key || index} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-4">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nama Syarat</label>
                                  <input type="text" value={req.name} onChange={(e) => updateDynamicRequirement(index, 'name', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-100 text-xs font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-slate-50/30" placeholder="Cth: Bukti UKT" />
                                </div>
                                {req.type === 'db_check' ? (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Field DB</label>
                                      <select value={req.field} onChange={(e) => updateDynamicRequirement(index, 'field', e.target.value)} className="w-full h-9 px-2 rounded-lg border border-slate-100 text-[10px] font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-slate-50/30">
                                        <option value="sks_completed">SKS</option>
                                        <option value="gpa">IPK</option>
                                        <option value="status_bta_ppi">BTA-PPI</option>
                                        <option value="is_paid_ukt">STATUS UKT</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nilai Minimal</label>
                                      <input type="text" value={req.min_value || req.expected_value || ''} onChange={(e) => updateDynamicRequirement(index, req.field === 'sks_completed' || req.field === 'gpa' ? 'min_value' : 'expected_value', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-100 text-xs font-bold text-cyan-950 focus:border-cyan-600 outline-none bg-slate-50/30" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-2 flex items-center h-full pt-4">
                                    <span className="px-3 py-1 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-lg text-[9px] font-black tracking-widest">TIPE: FILE UPLOAD</span>
                                  </div>
                                )}
                              </div>
                              <button type="button" onClick={() => removeDynamicRequirement(index)} className="mt-4 text-slate-300 hover:text-rose-600 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* --- KONFIGURASI ABSENSI --- */}
                      <div className="p-6 bg-emerald-50/30 rounded-[2rem] border border-emerald-100 space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">ATURAN ABSENSI & GEOTAGGING</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="flex items-center gap-3 p-4 bg-white border border-emerald-100 rounded-2xl cursor-pointer shadow-sm">
                              <input type="checkbox" checked={form.data.attendance_config?.geofence_enabled} onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, geofence_enabled: e.target.checked })} className="w-5 h-5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500" />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-emerald-950 uppercase">Aktifkan Geofencing</span>
                                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">Kunci lokasi saat absen.</span>
                              </div>
                            </label>
                            {form.data.attendance_config?.geofence_enabled && (
                              <div className="space-y-1.5 pl-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius (Meter)</label>
                                <input type="number" value={form.data.attendance_config?.radius_meters} onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, radius_meters: parseInt(e.target.value) })} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-cyan-950 focus:border-cyan-600 outline-none" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rujukan Lokasi</label>
                              <div className="relative group">
                                <select value={form.data.attendance_config?.location_source} onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, location_source: e.target.value })} className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-xs font-bold text-cyan-950 appearance-none outline-none bg-white">
                                  <option value="posko">POSKO (REGULER)</option>
                                  <option value="domisili">RUMAH (MANDIRI)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                              </div>
                            </div>
                            <label className="flex items-center gap-3 p-4 bg-white border border-emerald-100 rounded-2xl cursor-pointer shadow-sm">
                              <input type="checkbox" checked={form.data.attendance_config?.require_photo} onChange={(e) => form.setData('attendance_config', { ...form.data.attendance_config, require_photo: e.target.checked })} className="w-5 h-5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500" />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-emerald-950 uppercase">Wajib Foto Selfie</span>
                                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">Lampiran bukti visual.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* --- WILAYAH KABUPATEN --- */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-cyan-900 uppercase tracking-wider pl-1">Batasan Wilayah Kabupaten</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
                          {JAWA_TENGAH_REGENCIES.map((regency) => (
                            <label key={regency} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" checked={form.data.allowed_regencies.includes(regency)} onChange={(e) => {
                                const updated = e.target.checked ? [...form.data.allowed_regencies, regency] : form.data.allowed_regencies.filter((r) => r !== regency);
                                form.setData('allowed_regencies', updated);
                              }} className="w-3.5 h-3.5 text-cyan-600 border-slate-300 rounded" />
                              <span className="text-[9px] font-bold text-slate-600 group-hover:text-cyan-600 transition-colors uppercase">{regency}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                        <button type="button" onClick={cancelEdit} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all">BATAL</button>
                        <button type="submit" disabled={form.processing} className="flex-[2] h-12 bg-cyan-600 text-white text-sm font-black rounded-2xl hover:bg-cyan-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-600/20">
                          {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          {editingId ? 'SIMPAN PERUBAHAN' : 'DAFTARKAN SKEMA'}
                        </button>
                      </div>
                    </form>
                  </DialogPanel>
                </motion.div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* --- DATA TABLE --- */}
        <motion.div variants={itemVariants}>
          <ContentPanel title="Indeks Skema Program" icon={LayoutGrid} padding={false} headerAction={<SearchInput placeholder="CARI SKEMA..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />}>
            <PremiumTable headers={['Nama & Deskripsi', 'Aturan Absensi', 'Status', 'Opsi']} isEmpty={jenisKkn.length === 0} emptyText="Belum ada skema KKN.">
              {jenisKkn.map((item) => (
                <PremiumTableRow key={item.id} className={clsx('group', editingId === item.id && 'bg-cyan-50/50')}>
                  <PremiumTableCell>
                    <div className="flex flex-col py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-cyan-950 uppercase tracking-tight group-hover:text-cyan-600 transition-colors">{item.name}</span>
                        <span className="px-1.5 py-0.5 bg-slate-50 text-cyan-800/60 rounded text-[9px] font-bold border border-cyan-100 uppercase tracking-wider">{item.code}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{item.registration_mode_label} &middot; {item.placement_mode_label}</span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-cyan-950 uppercase">{item.attendance_config?.location_source || 'POSKO'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-cyan-950 tabular-nums">{item.attendance_config?.radius_meters || 0}M</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <StatusTag status={item.is_active ? 'Aktif' : 'Nonaktif'} />
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(item)} className="h-9 px-4 bg-white border-2 border-slate-50 text-cyan-950 rounded-xl hover:bg-cyan-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase"><Settings size={14} /> Atur</button>
                      <button onClick={() => openConfirmDialog(item)} className="h-9 w-9 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </ContentPanel>
        </motion.div>

        {/* --- CONFIRM DIALOG --- */}
        <Transition show={confirmOpen} as="div">
          <Dialog as="div" className="relative z-[9999]" initialFocus={cancelButtonRef} onClose={closeConfirmDialog}>
            <TransitionChild as="div" enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <div className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center p-4">
              <TransitionChild as="div" enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center space-y-6">
                  <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto"><ShieldAlert size={32} /></div>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Hapus Skema?</DialogTitle>
                  <p className="text-sm text-slate-500 font-medium">Skema <span className="font-bold text-slate-800">"{confirmTarget?.name}"</span> akan dihapus permanen. Data terkait tidak dapat dipulihkan.</p>
                  <div className="flex gap-3">
                    <button onClick={closeConfirmDialog} className="flex-1 h-12 border-2 border-slate-100 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all">BATAL</button>
                    <button onClick={confirmDestroy} className="flex-1 h-12 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                      {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />} HAPUS
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>
      </motion.div>
    </AppLayout>
  );
}
