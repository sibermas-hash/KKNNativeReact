import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/ui/Badge';
import { route } from 'ziggy-js';
import {
  Plus,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  ShieldAlert,
  ChevronRight,
  LayoutGrid,
  History,
  ArrowUpRight,
} from 'lucide-react';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface IzinRow {
  id: number;
  kelompok: { nama_kelompok: string };
  tanggal_mulai: string;
  tanggal_kembali: string;
  durasi_hari: number;
  alasan: string;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  catatan_dpl?: string | null;
  diproses_oleh?: { name: string } | null;
  diproses_pada?: string | null;
}

interface Props {
  izins: {
    data: IzinRow[];
    current_page: number;
    last_page: number;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  akumulasiTanpaKeterangan: number;
}

export default function StudentIzinIndex({ izins, akumulasiTanpaKeterangan }: Props) {
  const pageProps = (usePage() as unknown as { props: PageProps }).props;
  const flash = (pageProps as Record<string, unknown>).flash as { success?: string; error?: string } | undefined;

  const statusColors: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    menunggu: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200/50',
      dot: 'bg-amber-500',
    },
    disetujui: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200/50',
      dot: 'bg-emerald-500',
    },
    ditolak: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200/50',
      dot: 'bg-rose-500',
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <AppLayout title="Clearance Protocol">
      <Head title="Izin & Absensi | SIM-KKN" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 font-sans">
        {/* --- AUTHORITATIVE HEADER --- */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-gradient-to-r from-emerald-50/50 to-slate-50/50 rounded-[4rem] -z-10 group-hover:scale-[1.01] transition-transform duration-700" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-[1.5rem] flex items-center justify-center text-emerald-700 shadow-sm">
                  <ShieldAlert size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">
                    Section 04 / Clearance Protocol
                  </h4>
                  <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-[0.85]">
                    Otorisasi <br /> <span className="text-emerald-600">Izin Lokasi.</span>
                  </h1>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-400 tracking-tight leading-relaxed">
                Kelola mobilitas dan status kehadiran Anda secara transparan. <br />
                <span className="text-gray-900 italic">
                  "Disiplin adalah fondasi pengabdian yang bermartabat."
                </span>
              </p>
            </div>

            <Link
              href={route('student.izin.create')}
              className="h-24 px-12 rounded-[2rem] bg-emerald-600 text-white hover:bg-emerald-700 font-black text-xs transition-all flex items-center justify-center gap-6 shadow-lg shadow-emerald-200 active:scale-95 uppercase tracking-[0.3em] group"
            >
              <span>Ajukan Clearance</span>
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all">
                <Plus size={20} strokeWidth={3} />
              </div>
            </Link>
          </div>
        </div>

        {/* --- MISSION CRITICAL ALERT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Risk Matrix */}
          <div
            className={clsx(
              'lg:col-span-2 rounded-[3.5rem] p-12 border flex flex-col md:flex-row items-center gap-12 relative overflow-hidden transition-all',
              akumulasiTanpaKeterangan >= 3
                ? 'bg-red-50 border-red-200 text-red-900 shadow-lg'
                : 'bg-emerald-50 border-emerald-200 text-bg-emerald-100 shadow-lg',
            )}
          >
            <div className="absolute top-0 right-0 h-full w-64 bg-white/5 skew-x-12 translate-x-32 pointer-events-none" />
            <div className="h-40 w-40 shrink-0 bg-white/10 rounded-[3rem] flex items-center justify-center shadow-2xl">
              <div className="text-center">
                <span className="text-6xl font-black leading-none">{akumulasiTanpaKeterangan}</span>
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-60">
                  Hari
                </span>
              </div>
            </div>
            <div className="space-y-6 relative z-10">
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
                  {akumulasiTanpaKeterangan >= 3 ? 'Mission Terminated' : 'Integrity Matrix'}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 opacity-80">
                  Absensi Tanpa Keterangan (Alpha)
                </p>
              </div>
              <p className="text-sm font-bold opacity-70 leading-relaxed uppercase tracking-tight max-w-xl">
                Akumulasi ketidakhadiran tanpa izin resmi telah mencapai batas pantau.{' '}
                {akumulasiTanpaKeterangan >= 3
                  ? 'Sistem mendeteksi pelanggaran batas maksimum. Status KKN dalam peninjauan pembatalan.'
                  : 'Batas toleransi maksimal adalah 3 hari sebelum sistem memicu protokol pembatalan otomatis.'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-emerald-50 rounded-[3.5rem] p-12 border border-emerald-100 flex flex-col justify-between group">
            <div className="h-16 w-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h4 className="text-5xl font-black text-gray-950 tracking-tighter uppercase leading-none">
                {izins.data.length}
              </h4>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                Total Clearance Log
              </p>
            </div>
          </div>
        </div>

        {/* --- CLEARANCE MATRIX --- */}
        <div className="space-y-10">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">
                Clearance History
              </h3>
              <div className="h-px w-24 bg-slate-100" />
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-8"
          >
            {izins.data.length > 0 ? (
              izins.data.map((izin) => (
                <motion.div
                  key={izin.id}
                  variants={cardVariants}
                  className="bg-white rounded-[3rem] border border-slate-100 p-10 lg:p-12 shadow-sm hover:shadow-2xl transition-all duration-500 relative flex flex-col xl:flex-row gap-12 group"
                >
                  {/* Period Nodal */}
                  <div className="xl:w-64 shrink-0 space-y-6">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:border-emerald-200 transition-colors">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Duration: {izin.durasi_hari} Days
                      </p>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-gray-900 tracking-tight uppercase">
                          {new Date(izin.tanggal_mulai).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <div className="h-4 w-px bg-slate-200 ml-4 my-1" />
                        <p className="text-lg font-black text-gray-900 tracking-tight uppercase">
                          {new Date(izin.tanggal_kembali).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        'px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ring-4 ring-opacity-10',
                        statusColors[izin.status].bg,
                        statusColors[izin.status].text,
                        statusColors[izin.status].ring,
                      )}
                    >
                      <div
                        className={clsx('w-2 h-2 rounded-full', statusColors[izin.status].dot)}
                      />
                      Clearance: {izin.status}
                    </div>
                  </div>

                  {/* Detail Matrix */}
                  <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                        Justification Log
                      </h4>
                      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative group/reason">
                        <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase tracking-tight italic">
                          "{izin.alasan}"
                        </p>
                        <FileText
                          className="absolute right-8 top-8 text-slate-200 opacity-20 group-hover/reason:opacity-100 transition-opacity"
                          size={40}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-10">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-gray-400">
                          <MapPin size={14} />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          {izin.kelompok.nama_kelompok}
                        </span>
                      </div>
                      {izin.diproses_oleh && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle size={14} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Verified by {izin.diproses_oleh.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {izin.catatan_dpl && (
                      <div className="p-8 bg-emerald-50/50 border border-emerald-100/50 rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-4">
                          <History size={14} className="text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            DPL Feedback Protocol
                          </span>
                        </div>
                        <p className="text-xs font-bold text-bg-emerald-100 leading-relaxed uppercase tracking-tight">
                          {izin.catatan_dpl}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-32 flex flex-col items-center gap-8 text-center bg-slate-50 rounded-[4rem] border border-dashed border-slate-200">
                <FileText size={80} className="text-slate-200" strokeWidth={1} />
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">
                    Zero Clearance Issued
                  </h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Anda belum memiliki riwayat pengajuan izin lokasi.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pagination Matrix */}
        {izins.last_page > 1 && (
          <div className="flex flex-col items-center gap-6 pt-12">
            <div className="h-px w-32 bg-slate-100" />
            <div className="flex items-center gap-4">
              {izins.links?.slice(1, -1).map((link, i) => (
                <Link
                  key={i}
                  href={link.url || '#'}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={clsx(
                    'h-14 min-w-[56px] px-5 flex items-center justify-center rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all',
                    link.active
                      ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200'
                      : 'bg-white border border-slate-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm',
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
