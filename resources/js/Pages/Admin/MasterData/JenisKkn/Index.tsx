import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { clsx } from 'clsx';

import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SlideOver from '@/Components/Premium/SlideOver';

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
  required_documents: string[];
  allowed_regencies: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
  periodes_count: number;
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
    required_documents: [] as string[],
    allowed_regencies: [] as string[],
    color: 'emerald',
    is_active: true,
    sort_order: 0,
  });

  const addCustomRequirement = () => {
    form.setData('custom_requirements', [...form.data.custom_requirements, '']);
  };

  const updateCustomRequirement = (index: number, value: string) => {
    const updated = [...form.data.custom_requirements];
    updated[index] = value;
    form.setData('custom_requirements', updated);
  };

  const removeCustomRequirement = (index: number) => {
    const updated = form.data.custom_requirements.filter((_, i) => i !== index);
    form.setData('custom_requirements', updated);
  };

  const addRequiredDocument = () => {
    form.setData('required_documents', [...form.data.required_documents, '']);
  };

  const updateRequiredDocument = (index: number, value: string) => {
    const updated = [...form.data.required_documents];
    updated[index] = value;
    form.setData('required_documents', updated);
  };

  const removeRequiredDocument = (index: number) => {
    const updated = form.data.required_documents.filter((_, i) => i !== index);
    form.setData('required_documents', updated);
  };

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
      required_documents: item.required_documents ?? [],
      allowed_regencies: item.allowed_regencies ?? [],
      color: item.color,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setIsDrawerOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
    setIsDrawerOpen(false);
  };

  const destroy = (item: JenisKkn) => {
    if (confirm(`Skema "${item.name}" akan dihapus secara permanen. Lanjutkan?`)) {
      router.delete(`/admin/jenis-kkn/${item.id}`, {
        preserveScroll: true,
      });
    }
  };

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

        <SlideOver
          isOpen={isDrawerOpen}
          onClose={cancelEdit}
          title={editingId ? 'Perbarui Skema' : 'Tambah Skema Baru'}
          description="Atur parameter kualifikasi dan alur kerja skema."
          width="md"
        >
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Persyaratan Tambahan
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_bta_ppi}
                    onChange={(e) => form.setData('require_bta_ppi', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Wajib Lulus BTA-PPI</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_not_married}
                    onChange={(e) => form.setData('require_not_married', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Belum Menikah</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_parent_permission}
                    onChange={(e) => form.setData('require_parent_permission', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Izin Orang Tua</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-cyan-200 transition-all">
                  <input
                    type="checkbox"
                    checked={form.data.require_health_certificate}
                    onChange={(e) => form.setData('require_health_certificate', e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Surat Keterangan Sehat</span>
                </label>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Khusus Program Studi (Opsional)
                </label>
                <select
                  multiple
                  value={form.data.specific_prodi_ids.map((id) => id.toString())}
                  onChange={(e) => {
                    const options = e.target.options;
                    const value = [];
                    for (let i = 0, l = options.length; i < l; i++) {
                      if (options[i].selected) {
                        value.push(parseInt(options[i].value));
                      }
                    }
                    form.setData('specific_prodi_ids', value);
                  }}
                  className="w-full h-24 px-4 py-2 rounded-xl border-2 border-slate-50 text-sm font-semibold text-slate-700 focus:border-cyan-600 outline-none bg-white font-sans scrollbar-hide"
                >
                  {prodis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.name || 'TANPA NAMA').toUpperCase()}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium pl-1 italic">
                  * Tahan Ctrl/Cmd untuk memilih lebih dari satu prodi.
                </p>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                    Persyaratan Manual (Lain-lain)
                  </label>
                  <button
                    type="button"
                    onClick={addCustomRequirement}
                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 uppercase tracking-tight"
                  >
                    <Plus size={12} /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {form.data.custom_requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => updateCustomRequirement(index, e.target.value)}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:border-cyan-600 outline-none bg-white"
                          placeholder="Ketik persyaratan tambahan..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomRequirement(index)}
                        className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {form.data.custom_requirements.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2 bg-white/50 rounded-xl border border-dashed border-slate-200">
                      Belum ada persyaratan kustom.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                    Daftar Dokumen Wajib (Upload File)
                  </label>
                  <button
                    type="button"
                    onClick={addRequiredDocument}
                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 uppercase tracking-tight"
                  >
                    <Plus size={12} /> Tambah Dokumen
                  </button>
                </div>

                <div className="space-y-2">
                  {form.data.required_documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200"
                    >
                      <input
                        type="text"
                        value={doc}
                        onChange={(e) => updateRequiredDocument(index, e.target.value)}
                        className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:border-cyan-600 outline-none bg-white"
                        placeholder="Cth: Karya Ilmiah / Paspor"
                      />
                      <button
                        type="button"
                        onClick={() => removeRequiredDocument(index)}
                        className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Batasan Wilayah Kabupaten (Opsional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 bg-white border border-slate-100 rounded-xl scrollbar-hide">
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
                <p className="text-[9px] text-slate-400 font-medium pl-1 italic">
                  * Jika kosong, maka semua wilayah diizinkan.
                </p>
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
        </SlideOver>

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
                          onClick={() => destroy(item)}
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
      </motion.div>
    </AppLayout>
  );
}
