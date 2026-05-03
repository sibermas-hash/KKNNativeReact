import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, LucideIcon } from '@/types';
import {
  RefreshCw,
  Users,
  Database,
  Link2,
  ListFilter,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Activity,
  Search,
  ChevronRight,
  Target,
  Zap,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader, StatCard, ContentPanel } from '@/Components/Premium';
import { clsx } from 'clsx';

interface Props extends PageProps {
  title: string;
  summary: {
    local_students: number;
    with_master_link: number;
    last_synced_at: string | null;
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) return 'Belum Pernah';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function StudentSync({ summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({ nim_list: '' });

  function submitBulk() {
    bulkForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    targetedForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
  }

  return (
    <AppLayout title="Sinkronisasi Mahasiswa">
      <Head title="Sinkronisasi Mahasiswa KKN" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        <PageHeader
          title="Transmisi Mahasiswa."
          subtitle="Pusat integrasi data untuk menyelaraskan identitas dan riwayat studi mahasiswa antara sistem KKN dan database induk universitas secara real-time."
          icon={RefreshCw}
          groupLabel="Data Master & Integrasi"
          stats={{
            label: 'Sinkronisasi Terakhir',
            value: formatSyncTime(summary.last_synced_at),
            icon: Activity,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Data KKN Lokal"
            value={summary.local_students}
            icon={Users}
            variant="info"
          />
          <StatCard
            label="Terhubung Master"
            value={summary.with_master_link}
            icon={Link2}
            variant="success"
          />
          <StatCard label="Koneksi Sistem" value="AKTIF" icon={Zap} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sinkronisasi Massal */}
          <ContentPanel
            title="Sinkronisasi Menyeluruh"
            description="Pembaruan Database Mahasiswa Kolektif"
            icon={Database}
            padding={true}
          >
            <div className="space-y-8">
              <div className="bg-slate-50 border-2 border-emerald-50 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 group-hover:rotate-12 transition-transform duration-700">
                  <RefreshCw size={150} />
                </div>
                <p className="text-sm font-black text-emerald-950 leading-relaxed relative z-10 font-display">
                  Proses ini akan menarik seluruh data mahasiswa aktif dari server pusat universitas
                  untuk menyelaraskan database operasional KKN secara masif.
                </p>
                <div className="mt-8 space-y-4 relative z-10">
                  {[
                    'Pembaruan Identitas & Biodata',
                    'Validasi Program Studi & Fakultas',
                    'Sinkronisasi Status Akademik',
                    'Kalibrasi Riwayat Kelompok',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                      <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest font-display">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={submitBulk}
                disabled={bulkForm.processing || targetedForm.processing}
                className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-4 text-xs tracking-[0.2em] disabled:opacity-50 active:scale-95 group font-display"
              >
                {bulkForm.processing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <RefreshCw
                    size={24}
                    strokeWidth={3}
                    className="group-hover:rotate-180 transition-transform duration-700"
                  />
                )}
                {bulkForm.processing ? 'SEDANG MENTRANSMISI...' : 'EKSEKUSI SINKRONISASI TOTAL'}
              </button>
            </div>
          </ContentPanel>

          {/* Sinkronisasi Terapan */}
          <ContentPanel
            title="Sinkronisasi Spesifik"
            description="Intervensi Data Berdasarkan NIM"
            icon={Target}
            padding={true}
          >
            <form onSubmit={submitTargeted} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-950 pl-1 leading-none flex items-center gap-3 uppercase tracking-widest font-display">
                  <ListFilter size={14} strokeWidth={3} className="text-emerald-600" /> Daftar NIM
                  Target
                </label>
                <textarea
                  value={targetedForm.data.nim_list}
                  onChange={(e) => targetedForm.setData('nim_list', e.target.value)}
                  className="w-full px-6 py-6 rounded-2xl bg-slate-50 border-2 border-emerald-50 text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300 font-mono"
                  placeholder={'123456789\n987654321'}
                  rows={4}
                />
              </div>

              <div className="bg-emerald-50/50 rounded-2xl p-6 flex items-start gap-5 border border-emerald-100">
                <Info size={20} className="text-emerald-600 shrink-0 mt-1" strokeWidth={3} />
                <p className="text-[11px] font-black text-emerald-800 leading-relaxed font-display">
                  Gunakan mode ini untuk perbaikan data individu secara presisi tanpa membebani
                  server pusat universitas atau melakukan transmisi masif.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  targetedForm.processing ||
                  bulkForm.processing ||
                  targetedForm.data.nim_list.trim() === ''
                }
                className="h-16 w-full bg-emerald-950 hover:bg-black text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-4 text-xs tracking-[0.2em] disabled:opacity-50 active:scale-95 font-display"
              >
                {targetedForm.processing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <ArrowRight size={24} strokeWidth={3} />
                )}
                {targetedForm.processing ? 'SEDANG MEMPROSES...' : 'SINKRONKAN NIM TERPILIH'}
              </button>
            </form>
          </ContentPanel>
        </div>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-white rounded-3xl p-10 border-2 border-emerald-50 shadow-sm overflow-hidden group">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-emerald-950 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                  <ShieldCheck size={32} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-emerald-950 leading-none mb-2 font-display uppercase tracking-tight">
                    Kedaulatan Data Mahasiswa.
                  </h3>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-display">
                    Protokol Keamanan & Integrasi
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-800 leading-relaxed max-w-4xl font-display opacity-80">
                Data mahasiswa yang tersinkronisasi merupakan fondasi akurasi penempatan kelompok
                dan penilaian akhir. Pastikan integritas NIM yang dimasukkan pada mode spesifik
                untuk menghindari duplikasi atau kesalahan identitas pada basis data operasional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
