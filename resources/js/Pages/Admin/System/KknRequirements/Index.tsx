import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
  Plus,
  Trash2,
  ShieldCheck,
  Database,
  X,
  Pencil,
  Save,
  RefreshCw,
  AlertTriangle,
  Zap,
  Scale,
  Activity,
  Info,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface Requirement {
  id: number;
  name: string;
  column_name: string;
  operator: string;
  expected_value: string;
  error_message: string;
  is_active: boolean;
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  requirements: Requirement[];
  availableColumns: Option[];
  operators: Option[];
}

export default function KknRequirementsIndex({ requirements, availableColumns, operators }: Props) {
  const [editingItem, setEditingItem] = useState<Requirement | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    column_name: '',
    operator: '>=',
    expected_value: '',
    error_message: '',
    is_active: true,
  });

  const cancelEdit = () => {
    setEditingItem(null);
    reset();
    clearErrors();
  };

  const startEdit = (r: Requirement) => {
    setEditingItem(r);
    setData({
      name: r.name,
      column_name: r.column_name,
      operator: r.operator,
      expected_value: r.expected_value,
      error_message: r.error_message,
      is_active: r.is_active,
    });
    clearErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      onSuccess: () => cancelEdit(),
      preserveScroll: true,
    };
    if (editingItem) {
      put(route('admin.kkn-requirements.update', editingItem.id), config);
    } else {
      post(route('admin.kkn-requirements.store'), config);
    }
  };

  const toggleStatus = (id: number) =>
    router.patch(route('admin.kkn-requirements.toggle', id), {}, { preserveScroll: true });
  const deleteItem = (id: number) =>
    confirm('Hapus aturan ini?') &&
    router.delete(route('admin.kkn-requirements.destroy', id), { preserveScroll: true });

  return (
    <AppLayout title="Konfigurasi Validasi">
      <Head title="Validation Registry | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Validation Registry."
          subtitle="Konfigurasi protokol validasi otomatis untuk pendaftaran KKN berdasarkan data akademik mahasiswa."
          icon={ShieldCheck}
          groupLabel="Sistem Keamanan & Validasi"
          stats={{
            label: 'Aturan Aktif',
            value: `${requirements.filter((r) => r.is_active).length} Protokol`,
            icon: Scale,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: FORM PANEL (1/3) */}
          <div className="lg:col-span-4 space-y-6">
            <ContentPanel
              title={editingItem ? 'Koreksi Protokol' : 'Registrasi Aturan Baru'}
              description={
                editingItem
                  ? `Memperbarui konfigurasi node #${editingItem.id}`
                  : 'Tentukan parameter logika validasi pendaftaran.'
              }
              icon={editingItem ? Pencil : Plus}
              padding={true}
              headerAction={
                editingItem && (
                  <button
                    onClick={cancelEdit}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <X size={16} />
                  </button>
                )
              }
            >
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Nama Protokol
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                    placeholder="Cth: MINIMAL_SKS_ELIGIBILITY"
                    required
                  />
                  {errors.name && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-tight">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                      Sumber Data
                    </label>
                    <div className="relative group">
                      <select
                        value={data.column_name}
                        onChange={(e) => setData('column_name', e.target.value)}
                        className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-[10px] font-black text-emerald-950 focus:border-emerald-600 outline-none appearance-none transition-all"
                        required
                      >
                        <option value="">PILIH SUMBER</option>
                        {availableColumns.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                      Operator
                    </label>
                    <div className="relative group">
                      <select
                        value={data.operator}
                        onChange={(e) => setData('operator', e.target.value)}
                        className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-black text-emerald-950 focus:border-emerald-600 outline-none appearance-none transition-all"
                      >
                        {operators.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.value}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Nilai Ekspektasi
                  </label>
                  <input
                    type="text"
                    value={data.expected_value}
                    onChange={(e) => setData('expected_value', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none tabular-nums transition-all"
                    placeholder="Cth: 100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Pesan Penolakan (Output)
                  </label>
                  <textarea
                    value={data.error_message}
                    onChange={(e) => setData('error_message', e.target.value)}
                    className="w-full h-24 px-4 py-3 rounded-xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none resize-none transition-all"
                    placeholder="Tuliskan alasan penolakan pendaftaran..."
                    required
                  />
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="h-5 w-5 rounded-lg border-emerald-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all"
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor="is_active"
                      className="text-[10px] font-black text-emerald-950 uppercase tracking-widest cursor-pointer leading-none mb-1"
                    >
                      Aktivasi Node
                    </label>
                    <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-tight">
                      Aturan akan langsung dievaluasi pendaftar.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full h-14 bg-emerald-600 text-white text-[10px] font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest disabled:opacity-50"
                >
                  {processing ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingItem ? 'Perbarui Protokol' : 'Simpan Protokol Baru'}
                </button>
              </form>
            </ContentPanel>
          </div>

          {/* RIGHT: TABLE PANEL (2/3) */}
          <div className="lg:col-span-8">
            <ContentPanel
              title="Database Logika Validasi"
              description={`Daftar ${requirements.length} protokol validasi sistem.`}
              icon={Database}
              padding={false}
              footer={
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums">
                    Sistem Validasi Operasional & Stabil
                  </span>
                </div>
              }
            >
              <PremiumTable
                headers={[
                  'Protocol Identity',
                  'Logic Condition',
                  'Return Message',
                  'Status',
                  'Opsi',
                ]}
                isEmpty={requirements.length === 0}
                emptyText="Belum ada aturan validasi yang terdaftar."
              >
                {requirements.map((r) => (
                  <PremiumTableRow
                    key={r.id}
                    className={clsx(editingItem?.id === r.id && 'bg-emerald-50/50')}
                  >
                    <PremiumTableCell>
                      <div className="flex flex-col py-1">
                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                          {r.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                          NODE_ID_AFFIRMED #{r.id}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="inline-flex flex-col gap-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] font-black text-emerald-800 font-mono tracking-widest uppercase">
                          {r.column_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-black text-xs">{r.operator}</span>
                          <span className="text-[11px] font-black text-emerald-950">
                            "{r.expected_value}"
                          </span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <p className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-2 max-w-[200px] italic">
                        "{r.error_message}"
                      </p>
                    </PremiumTableCell>
                    <PremiumTableCell align="center">
                      <button
                        onClick={() => toggleStatus(r.id)}
                        className="transition-all active:scale-95"
                      >
                        <StatusTag
                          status={r.is_active ? 'active' : 'draft'}
                          label={r.is_active ? 'ENABLED' : 'DISABLED'}
                          size="sm"
                        />
                      </button>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(r)}
                          className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(r.id)}
                          className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
