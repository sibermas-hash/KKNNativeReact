import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  RefreshCw,
  Users,
  Link2,
  ShieldCheck,
  Database,
  Zap,
  CheckCircle2,
  Activity,
  Target,
  ArrowRight,
  ListFilter,
  Info,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  summary: {
    local_lecturers: number;
    with_master_link: number;
    with_user_account: number;
    last_synced_at: string | null;
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) return 'BELUM PERNAH';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DplSync({ summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({
    nip_list: '',
  });

  function submitBulk() {
    bulkForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    targetedForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  return (
    <AppLayout title="Sinkronisasi Kolektif Dosen">
      <Head title="Sinkronisasi Dosen - Panel Kontrol" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        {/* --- MODERN HEADER --- */}
        <div className="space-y-6 pt-12">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">
              Integritas &middot; Data Master
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-black tracking-tight leading-tight pt-2">
                Sinkronisasi <span>Dosen.</span>
              </h1>
              <p className="text-lg font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-2xl mt-4">
                Jembatan data master Dosen Pembimbing Lapangan melalui basis data pusat institusi
                UIN SAIZU.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="h-10 px-6 bg-emerald-600 border border-emerald-800 rounded-xl flex items-center gap-8 text-white shadow-sm font-sans overflow-hidden relative group">
                <div className="flex flex-col relative z-10">
                  <span className="text-sm font-bold text-white/40 font-semibold text-xs leading-none mb-2">
                    Update Terakhir
                  </span>
                  <span className="text-sm font-bold text-emerald-200 tabular-nums leading-none tracking-tight">
                    {formatSyncTime(summary.last_synced_at)}
                  </span>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              </div>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCore
            label="Data Lokal"
            value={summary.local_lecturers}
            icon={Users}
            color="emerald"
            desc="Total DPL Terintegrasi"
          />
          <MetricCore
            label="Terhubung Induk"
            value={summary.with_master_link}
            icon={Link2}
            color="emerald"
            desc="Konektivitas Master Valid"
          />
          <MetricCore
            label="Akun Login Aktif"
            value={summary.with_user_account}
            icon={ShieldCheck}
            color="emerald"
            desc="Dosen Dengan Akses Sistem"
          />
          <MetricCore
            label="Arus Data"
            value="STABIL"
            icon={Activity}
            color="emerald"
            isText
            desc="Database Master Online"
          />
        </div>

        {/* --- SYNC METHODS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sinkronisasi Massal */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all hover:shadow-emerald-950/10 font-sans">
            <div className="px-6 py-6 border-b border-emerald-50/10 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-8">
                <div className="h-16 w-16 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xl transition-transform group-hover:rotate-12">
                  <Database size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold">
                    Sinkronisasi Menyeluruh
                  </h3>
                  <p className="text-xl font-bold text-black leading-tight font-bold text-center mt-1">
                    Otomasi Basis Data Pusat
                  </p>
                </div>
              </div>
            </div>

            <div className="p-12 space-y-12 flex-1 flex flex-col">
              <div className="bg-emerald-50/30 border border-gray-200 rounded-[2.5rem] p-10 space-y-8 flex-1">
                <p className="text-sm font-bold text-black leading-relaxed tracking-wide">
                  Prosedur ini memindai direktori dosen aktif di sistem induk untuk diperbarui ke
                  basis data portal KKN secara otomatis.
                </p>
                <div className="space-y-4">
                  {[
                    'Sinkronisasi Identitas & NIP Kolektif',
                    'Pembaruan Afiliasi Fakultas & Prodi',
                    'Validasi Status Kepegawaian Terbaru',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-sm font-bold text-emerald-700 font-semibold text-xs leading-none">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={submitBulk}
                disabled={bulkForm.processing || targetedForm.processing}
                className="h-10 w-full bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-6 text-sm tracking-wider text-xs font-semibold disabled:opacity-50 active:scale-95 border-none"
              >
                {bulkForm.processing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <RefreshCw size={24} strokeWidth={3} />
                )}
                {bulkForm.processing ? 'MEMPROSES TRANSMISI...' : 'EKSEKUSI SINKRONISASI MASSAL'}
              </button>
            </div>
          </div>

          {/* Sinkronisasi Terapan */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all hover:shadow-emerald-950/10 font-sans">
            <div className="px-6 py-6 border-b border-emerald-50/10 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-8">
                <div className="h-16 w-16 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xl transition-transform group-hover:-rotate-12">
                  <Target size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold">
                    Perbaruan Manual Terpilih
                  </h3>
                  <p className="text-xl font-bold text-black leading-tight font-bold text-center mt-1">
                    Intervensi Target NIP
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={submitTargeted} className="p-12 space-y-8 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <label className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold flex items-center gap-3 leading-none">
                  <ListFilter size={14} strokeWidth={3} className="text-emerald-500" /> Daftar NIP
                  Target
                </label>
                <textarea
                  value={targetedForm.data.nip_list}
                  onChange={(e) => targetedForm.setData('nip_list', e.target.value)}
                  className="w-full flex-1 px-8 py-8 rounded-[2.5rem] bg-gray-50/50 border border-gray-200 text-sm font-bold text-black focus:bg-white focus:border-emerald-500 focus:ring-[15px] focus:ring-emerald-500/5 outline-none transition-all placeholder:text-emerald-100 font-mono scrollbar-hide "
                  placeholder={'19900101XXXXXXXX\n19900101XXXXXXXX'}
                  rows={5}
                />
              </div>

              <div className="bg-emerald-600 rounded-[2.5rem] p-8 flex items-start gap-6 shadow-sm">
                <Info size={24} className="text-white shrink-0" strokeWidth={2.5} />
                <p className="text-sm font-bold text-emerald-50/60 leading-relaxed ">
                  MODE INI DIGUNAKAN UNTUK PERBAIKAN DATA DOSEN SPESIFIK SECARA INSTAN. MASUKKAN NIP
                  TARGET UNTUK RE-SINKRONISASI.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  targetedForm.processing ||
                  bulkForm.processing ||
                  targetedForm.data.nip_list.trim() === ''
                }
                className="h-10 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-6 text-sm tracking-wider text-xs font-semibold disabled:opacity-50 active:scale-95 border-none"
              >
                {targetedForm.processing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <ArrowRight size={24} strokeWidth={3} />
                )}
                {targetedForm.processing ? 'MEMPERBARUI TARGET...' : 'PERBARUI NIP TERPILIH'}
              </button>
            </form>
          </div>
        </div>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-600 rounded-xl p-16 text-white relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 -mr-32 -mt-32 transition-transform group-hover:rotate-45 duration-1000">
            <ShieldCheck size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-12 w-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shrink-0 border border-emerald-400/20 shadow-2xl transition-transform hover:scale-110">
                  <RefreshCw size={56} className="text-black" strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-bold font-bold text-center leading-none">
                  Kedaulatan Data Master.
                </h3>
              </div>
              <p className="text-sm font-bold text-emerald-50/40 leading-relaxed max-w-4xl group-hover:text-emerald-50/60 transition-colors">
                Sinkronisasi berkala menjamin data Dosen Pembimbing Lapangan tetap relevan dengan
                data induk universitas. Pastikan koneksi pipeline arus data utama stabil sebelum
                menjalankan prosedur sinkronisasi menyeluruh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCore({
  label,
  value,
  icon: Icon,
  desc,
  isText = false,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  isText?: boolean;
  desc: string;
}) {
  return (
    <div className="bg-white border border-gray-200 p-10 rounded-xl shadow-sm hover:shadow-emerald-950/10 transition-all group relative overflow-hidden font-sans">
      <div className="flex items-center justify-between relative z-10">
        <div className="h-16 w-16 rounded-xl flex items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all duration-500 group-hover:scale-110 shadow-sm border-none">
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="h-10 w-10 bg-emerald-50/50 rounded-full flex items-center justify-center text-emerald-200 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2">
          <ChevronRight size={20} strokeWidth={3} />
        </div>
      </div>
      <div className="mt-10 space-y-4 relative z-10">
        <p className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none mb-1">
          {label}
        </p>
        <p
          className={clsx(
            'font-bold text-black tracking-tight tabular-nums leading-none ',
            isText ? 'text-xl' : 'text-2xl',
          )}
        >
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        <p className="text-sm font-bold text-black/20 tracking-tight pt-4 leading-none">{desc}</p>
      </div>
    </div>
  );
}
