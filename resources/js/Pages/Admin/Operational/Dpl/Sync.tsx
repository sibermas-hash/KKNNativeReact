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
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  summary: {
    local_lecturers: number;
    with_master_link: number;
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
    <AppLayout title="Sinkronisasi Data Dosen">
      <Head title="Sinkronisasi Dosen" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <RefreshCw size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Data Master & Integrasi</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Sinkronisasi <span className="text-emerald-500">Dosen.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Prosedur Integrasi Data Master Dosen Pembimbing Lapangan melalui Basis Data Pusat Institusi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-5 text-white shadow-xl shadow-emerald-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Update Terakhir</span>
                            <span className="text-sm font-black text-emerald-400 uppercase tabular-nums leading-none tracking-tight">{formatSyncTime(summary.last_synced_at)}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Data Lokal" value={summary.local_lecturers} icon={Users} color="emerald" desc="Total DPL di sistem KKN" />
          <MetricCard label="Terhubung Induk" value={summary.with_master_link} icon={Link2} color="sky" desc="Data dosen tersinkronisasi" />
          <MetricCard label="Pipeline Data" value="AKTIF" icon={ShieldCheck} color="emerald" isText desc="Koneksi database induk stabil" />
        </div>

        {/* --- SYNC METHODS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sinkronisasi Massal */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 transition-transform group-hover:scale-110">
                           <Database size={24} />
                      </div>
                      <div>
                           <h3 className="text-sm font-bold text-black uppercase tracking-wider">Metode Massal</h3>
                           <p className="text-lg font-extrabold text-black leading-tight">Sinkronkan Seluruh Data</p>
                      </div>
                 </div>
            </div>

            <div className="p-8 space-y-8 flex-1 flex flex-col">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-6 flex-1">
                <p className="text-sm font-bold text-emerald-900 leading-relaxed uppercase">
                  Prosedur ini akan memindai seluruh direktori dosen aktif di sistem induk kampus untuk diperbarui ke database SIM-KKN.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Sinkronisasi identitas lengkap & NIP',
                    'Pembaruan asal Fakultas & Jurusan',
                    'Pemetaan status kepegawaian terbaru'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight leading-none">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={submitBulk}
                disabled={bulkForm.processing || targetedForm.processing}
                className="h-16 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 text-sm uppercase disabled:opacity-50 active:scale-95"
              >
                {bulkForm.processing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                {bulkForm.processing ? 'Sedang Memproses...' : 'Mulai Sinkronisasi Massal'}
              </button>
            </div>
          </div>

          {/* Sinkronisasi Terarah */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                           <ListFilter size={24} />
                      </div>
                      <div>
                           <h3 className="text-sm font-bold text-black uppercase tracking-wider">Metode Spesifik</h3>
                           <p className="text-lg font-extrabold text-black leading-tight">Sinkronkan Per NIP</p>
                      </div>
                 </div>
            </div>

            <form onSubmit={submitTargeted} className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Daftar NIP Dosen</label>
                <textarea
                  value={targetedForm.data.nip_list}
                  onChange={(e) => targetedForm.setData('nip_list', e.target.value)}
                  className="w-full flex-1 px-5 py-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-black focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 font-mono"
                  placeholder={'Masukkan NIP, pisahkan dengan baris baru\nContoh:\n19900101XXXXXXXX\n19900101XXXXXXXX'}
                  rows={5}
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
                 <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                   Gunakan mode ini untuk perbaikan data dosen tertentu secara cepat. Masukkan NIP dosen yang ingin diperbarui datanya.
                 </p>
              </div>

              <button
                type="submit"
                disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nip_list.trim() === ''}
                className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 text-sm uppercase disabled:opacity-50 active:scale-95"
              >
                {targetedForm.processing ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                {targetedForm.processing ? 'Sedang Memperbarui...' : 'Sinkronkan NIP Terpilih'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color, isText = false, desc }: { label: string; value: string | number; icon: LucideIcon; color: 'emerald' | 'sky'; isText?: boolean; desc: string }) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className={clsx(
            'h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', 
            color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-sky-50 text-sky-600 border-sky-100'
        )}>
          <Icon size={24} />
        </div>
        <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={16} />
        </div>
      </div>
      <div className="mt-6 space-y-1 relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={clsx('font-black text-black tracking-tighter tabular-nums leading-none', isText ? 'text-lg' : 'text-3xl')}>
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        <p className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tight pt-2">{desc}</p>
      </div>
    </div>
  );
}
