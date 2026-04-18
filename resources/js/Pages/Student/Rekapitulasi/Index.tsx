import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  Calculator,
  MapPin,
  Calendar,
  ChevronLeft,
  Layers,
  Activity,
  CornerDownRight,
  ArrowUpRight,
  Search,
  Info,
  LayoutGrid,
} from 'lucide-react';
import type { PageProps, LucideIcon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface RekapRow {
  id?: number;
  uraian_kegiatan: string;
  satuan: string;
  volume: number;
  swadaya_mhs: number;
  swadaya_masyarakat: number;
  bantuan_pemerintah: number;
  donatur_lain: number;
  jumlah: number;
  keterangan?: string;
}

interface KelompokData {
  id: number;
  nama_kelompok: string;
  lokasi?: { village_name: string; district_name: string; regency_name: string };
  periode?: { name: string };
}

interface Props {
  kelompok: KelompokData;
  rekapitulasi: RekapRow[];
  dpl?: { nama: string };
}

export default function StudentRekapitulasiIndex({ kelompok, rekapitulasi, dpl }: Props) {
  const { flash } = (usePage() as unknown as { props: PageProps }).props;
  const items =
    rekapitulasi.length > 0
      ? rekapitulasi
      : [
          {
            uraian_kegiatan: '',
            satuan: 'kegiatan',
            volume: 1,
            swadaya_mhs: 0,
            swadaya_masyarakat: 0,
            bantuan_pemerintah: 0,
            donatur_lain: 0,
            jumlah: 0,
            keterangan: '',
          },
        ];

  const form = useForm({
    items: items as RekapRow[],
  });

  const addItem = () => {
    form.setData('items', [
      ...form.data.items,
      {
        uraian_kegiatan: '',
        satuan: 'kegiatan',
        volume: 1,
        swadaya_mhs: 0,
        swadaya_masyarakat: 0,
        bantuan_pemerintah: 0,
        donatur_lain: 0,
        jumlah: 0,
        keterangan: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    form.setData(
      'items',
      form.data.items.filter((_, i) => i !== index),
    );
  };

  const updateItem = (index: number, field: keyof RekapRow, value: string | number) => {
    const newItems = [...form.data.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate jumlah
    const row = newItems[index];
    row.jumlah =
      (row.swadaya_mhs || 0) +
      (row.swadaya_masyarakat || 0) +
      (row.bantuan_pemerintah || 0) +
      (row.donatur_lain || 0);

    form.setData('items', newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('student.rekapitulasi.store'));
  };

  const totalSwadayaMhs = form.data.items.reduce((sum, item) => sum + (item.swadaya_mhs || 0), 0);
  const totalSwadayaMasyarakat = form.data.items.reduce(
    (sum, item) => sum + (item.swadaya_masyarakat || 0),
    0,
  );
  const totalBantuan = form.data.items.reduce(
    (sum, item) => sum + (item.bantuan_pemerintah || 0),
    0,
  );
  const totalDonatur = form.data.items.reduce((sum, item) => sum + (item.donatur_lain || 0), 0);
  const totalJumlah = form.data.items.reduce((sum, item) => sum + (item.jumlah || 0), 0);

  return (
    <AppLayout title="Financial Ledger">
      <Head title="Rekapitulasi Kegiatan | SIM-KKN" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16 font-sans">
        {/* --- STRATEGIC HEADER --- */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-gradient-to-r from-emerald-50/50 to-slate-50/50 rounded-xl -z-10 group-hover:scale-[1.01] transition-transform duration-700" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                  <Calculator size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider text-xs font-semibold">
                    Section 05 / Financial Matrix
                  </h4>
                  <h1 className="text-2xl md:text-2xl font-bold text-emerald-950 tracking-tighter uppercase leading-[0.85]">
                    Rekap <br /> <span className="text-emerald-600">Kontribusi.</span>
                  </h1>
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed">
                Dokumentasi kuantitatif dari inisiatif dan swadaya selama KKN. <br />
                <span className="text-emerald-950">
                  "Transparansi anggaran adalah wujud profesionalisme pengabdian."
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href={route('student.program-kerja.index')}
                className="h-10 px-6 rounded-xl bg-white border border-emerald-50/60 text-emerald-950 hover:text-emerald-600 hover:border-emerald-200 font-bold text-sm transition-all flex items-center gap-4 uppercase tracking-wider text-xs font-semibold shadow-sm"
              >
                <FileSpreadsheet size={18} /> Program Kerja
              </Link>
              <button
                onClick={addItem}
                className="h-10 px-6 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm transition-all flex items-center gap-4 uppercase tracking-wider text-xs font-semibold shadow-2xl shadow-emerald-200"
              >
                <Plus size={18} strokeWidth={3} /> Tambah Item
              </button>
            </div>
          </div>
        </div>

        {/* --- SITE MATRIX (BENTO) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BentoCard
            label="Desa / Kelurahan"
            value={kelompok.lokasi?.village_name || '-'}
            icon={MapPin}
            color="emerald"
          />
          <BentoCard
            label="Kecamatan"
            value={kelompok.lokasi?.district_name || '-'}
            icon={Layers}
            color="slate"
          />
          <BentoCard
            label="Regiment (Unit)"
            value={kelompok.nama_kelompok}
            icon={LayoutGrid}
            color="slate"
          />
          <BentoCard
            label="Total Impact"
            value={`Rp ${(totalJumlah / 1000).toFixed(1)}M`}
            icon={Activity}
            color="emerald"
            highlight
          />
        </div>

        {/* --- FINANCIAL LEDGER MATRIX --- */}
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-white border border-emerald-50/60 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold opacity-40">
                      #
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold min-w-[320px]">
                      Uraian Aktivitas Strategis
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-center">
                      Unit
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-right">
                      Swadaya MHS
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-right">
                      Masyarakat
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-right">
                      Bantuan
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-right">
                      Donatur
                    </th>
                    <th className="px-8 py-8 text-sm font-bold uppercase tracking-wider text-xs font-semibold text-right text-emerald-400">
                      Total (K)
                    </th>
                    <th className="px-6 py-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {form.data.items.map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group hover:bg-emerald-50/20 transition-all"
                      >
                        <td className="px-8 py-6 text-xs font-bold text-slate-300 font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-8 py-6">
                          <input
                            type="text"
                            value={item.uraian_kegiatan}
                            onChange={(e) => updateItem(index, 'uraian_kegiatan', e.target.value)}
                            className="w-full h-11 bg-transparent border-none p-0 text-sm font-bold text-emerald-950 focus:ring-0 placeholder:text-slate-200 group-hover:text-emerald-800 transition-colors uppercase tracking-tight"
                            placeholder="Deskripsi kegiatan..."
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={item.volume}
                              onChange={(e) =>
                                updateItem(index, 'volume', parseInt(e.target.value) || 0)
                              }
                              className="w-14 h-11 bg-emerald-50/30 border-none rounded-xl text-center text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-[#1a7a4a] font-mono"
                            />
                            <input
                              type="text"
                              value={item.satuan}
                              onChange={(e) => updateItem(index, 'satuan', e.target.value)}
                              className="w-20 h-11 bg-transparent border-none p-0 text-sm font-bold text-emerald-950 font-semibold uppercase text-xs text-center"
                              placeholder="Satuan"
                            />
                          </div>
                        </td>
                        <LedgerInput
                          value={item.swadaya_mhs}
                          onChange={(v) => updateItem(index, 'swadaya_mhs', v)}
                        />
                        <LedgerInput
                          value={item.swadaya_masyarakat}
                          onChange={(v) => updateItem(index, 'swadaya_masyarakat', v)}
                        />
                        <LedgerInput
                          value={item.bantuan_pemerintah}
                          onChange={(v) => updateItem(index, 'bantuan_pemerintah', v)}
                        />
                        <LedgerInput
                          value={item.donatur_lain}
                          onChange={(v) => updateItem(index, 'donatur_lain', v)}
                        />
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-bold text-emerald-950 font-mono">
                            {item.jumlah.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                          {form.data.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot className="bg-emerald-700 text-white">
                  <tr className="divide-x divide-white/5">
                    <td colSpan={3} className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                          <ShieldAlert size={28} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold uppercase tracking-wider text-xs font-semibold text-[#1a7a4a]">
                            Global Aggregator
                          </p>
                          <p className="text-xl font-bold font-bold text-center">
                            Total Ledger Balance
                          </p>
                        </div>
                      </div>
                    </td>
                    <TotalCol lab="MHS" val={totalSwadayaMhs} />
                    <TotalCol lab="MASY" val={totalSwadayaMasyarakat} />
                    <TotalCol lab="GOV" val={totalBantuan} />
                    <TotalCol lab="DONOR" val={totalDonatur} />
                    <td className="px-8 py-6 text-right bg-emerald-600">
                      <p className="text-sm font-bold font-semibold uppercase text-xs text-emerald-200 mb-1 opacity-60 px-1">
                        Grand Total
                      </p>
                      <p className="text-2xl font-bold tracking-tight font-mono">
                        {totalJumlah.toLocaleString()}
                      </p>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 px-4">
            <div className="flex items-start gap-5 max-w-xl">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Info size={24} />
              </div>
              <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs leading-relaxed pt-1">
                * Seluruh nilai moneter diinput dalam satuan ribuan rupiah (K). Misal: input{' '}
                <span className="text-emerald-950 font-mono">1.000</span> untuk mewakili{' '}
                <span className="text-emerald-950">Rp 1.000.000</span>.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href={route('student.dashboard')}
                className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold hover:text-emerald-950 transition-colors"
              >
                Abort Changes
              </Link>
              <button
                type="submit"
                disabled={form.processing}
                className="h-10 px-6 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider text-xs font-semibold shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-6 active:scale-95 disabled:opacity-50"
              >
                {form.processing ? 'Transmitting...' : 'Save Ledger Protocol'}
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Save size={18} strokeWidth={3} />
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function BentoCard({
  label,
  value,
  icon: Icon,
  color,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'emerald' | 'slate';
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'p-10 rounded-xl border flex flex-col justify-between group transition-all h-64',
        highlight
          ? 'bg-emerald-900 text-white border-emerald-50/60 shadow-2xl'
          : 'bg-white border-emerald-50/60 hover:border-emerald-200 shadow-sm',
      )}
    >
      <div
        className={clsx(
          'h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform',
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50/30 text-emerald-950',
        )}
      >
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <div>
        <p
          className={clsx(
            'text-sm font-bold uppercase tracking-wider text-xs font-semibold mb-2',
            color === 'emerald' ? 'text-[#1a7a4a]' : 'text-emerald-950',
          )}
        >
          {label}
        </p>
        <p className="text-xl font-bold tracking-tighter uppercase truncate">{value}</p>
      </div>
    </div>
  );
}

function LedgerInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <td className="px-8 py-6 text-right">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-24 h-11 bg-emerald-50/30 border-none rounded-xl text-right text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-[#1a7a4a] font-mono placeholder:opacity-20 translate-x-2"
        placeholder="0"
      />
    </td>
  );
}

function TotalCol({ lab, val }: { lab: string; val: number }) {
  return (
    <td className="px-8 py-6 text-right">
      <p className="text-sm font-bold font-semibold uppercase text-xs text-white/40 mb-1">{lab}</p>
      <p className="text-sm font-bold tracking-tight font-mono">{val.toLocaleString()}</p>
    </td>
  );
}

function ShieldAlert({ size, className }: { size: number; className?: string }) {
  return (
    <div className={className}>
      <Calculator size={size} strokeWidth={2.5} />
    </div>
  );
}
