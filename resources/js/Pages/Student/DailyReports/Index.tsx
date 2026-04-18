import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Camera,
  MapPin,
  AlertCircle,
  Info,
  FileText,
  History,
  Activity,
  Layers,
  LayoutGrid,
  CornerDownRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';

interface Report {
  id: number;
  date: string;
  title: string;
  status: string;
  activity: string;
  reflection: string | null;
  file_kegiatan: FileKegiatan[];
  ai_summary?: string;
  ai_analysis?: {
    summary: string;
    abcd_compliance: number;
    quality_score: number;
    feedback: string;
    tags: string[];
  };
}

interface Props {
  reports: {
    data: Report[];
    total: number;
    links: Array<{ name: string; label?: string; url?: string; icon?: LucideIcon; active?: boolean }>;
    current_page: number;
    last_page: number;
  };
  flash: {
    success?: string;
    error?: string;
  };
}

interface FileKegiatan {
  id: number;
  file_path: string;
  file_name?: string;
}

export default function DailyReportIndex({ reports, flash }: Props) {
  const statusColors: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    submitted: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200/50',
      dot: 'bg-amber-500',
    },
    approved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      ring: 'ring-emerald-200/50',
      dot: 'bg-emerald-500',
    },
    revision: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200/50',
      dot: 'bg-rose-500',
    },
  };

  const statusLabels: Record<string, string> = {
    submitted: 'Prajurit Menunggu Review',
    approved: 'Lulus Verifikasi DPL',
    revision: 'Instruksi Revisi',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
  };

  return (
    <AppLayout title="Tactical Logbook">
      <Head title="Logbook Harian | SIM-KKN Mahasiswa" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16 font-sans">
        {/* --- OPERATIONAL HEADER --- */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-gradient-to-r from-emerald-50/50 to-slate-50/50 rounded-xl -z-10 group-hover:scale-[1.02] transition-transform duration-700" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 shadow-sm">
                  <Activity size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider text-xs font-semibold">
                    Section 01 / Operational Log
                  </h4>
                  <h1 className="text-2xl md:text-2xl font-bold text-emerald-950 tracking-tighter uppercase leading-[0.85]">
                    Jurnal <br /> <span className="text-emerald-600">Pengabdian.</span>
                  </h1>
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed">
                Rekam jejak digital kontribusi Anda di masyarakat. <br />
                <span className="text-emerald-950">
                  "Setiap tindakan adalah data, setiap data adalah dedikasi."
                </span>
              </p>
            </div>

            <Link
              href={route('student.laporan-harian.create')}
              className="h-12 px-6 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs transition-all flex items-center justify-center gap-6 shadow-lg shadow-emerald-200 active:scale-95 uppercase tracking-wider text-xs font-semibold group"
            >
              <span>Tambah Aktivitas</span>
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all">
                <Plus size={20} strokeWidth={3} />
              </div>
            </Link>
          </div>
        </div>

        {/* --- PROTOCOL STATUS BAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: 'SOP Waktu',
              desc: 'Maks. 24 Jam Paska-Kegiatan',
              icon: Clock,
              color: 'emerald',
            },
            { label: 'SOP Lokasi', desc: 'Wajib Radius Area KKN', icon: MapPin, color: 'blue' },
            { label: 'SOP File', desc: 'Dokumentasi Asli (No Fake)', icon: Camera, color: 'amber' },
          ].map((sop, i) => (
            <div
              key={i}
              className="bg-white p-10 rounded-[2.5rem] border border-emerald-50/60 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
            >
              <div
                className={`absolute top-0 right-0 h-40 w-40 bg-${sop.color}-50 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl`}
              />
              <div
                className={`p-4 bg-${sop.color}-50 text-${sop.color}-600 rounded-2xl w-fit group-hover:scale-110 transition-transform`}
              >
                <sop.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="space-y-2 relative">
                <p
                  className={`text-sm font-bold text-${sop.color}-700 uppercase tracking-wider text-xs font-semibold`}
                >
                  {sop.label}
                </p>
                <p className="text-sm font-bold text-emerald-950 leading-tight uppercase tracking-tight">
                  {sop.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- TIMELINE MATRIX --- */}
        <div className="space-y-10">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold">
                Audit Timeline
              </h3>
              <div className="h-px w-24 bg-emerald-50/60" />
            </div>
            <div className="bg-emerald-600 px-6 py-2 rounded-full text-sm font-bold text-white font-semibold uppercase text-xs flex items-center gap-3">
              <Layers size={12} /> Total Records: {reports.total}
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 relative"
          >
            {/* Center line (Desktop) */}
            <div className="absolute left-[88px] top-4 bottom-4 w-px bg-emerald-50/60 hidden lg:block" />

            <AnimatePresence>
              {reports.data.length > 0 ? (
                reports.data.map((report) => (
                  <motion.div
                    key={report.id}
                    variants={cardVariants}
                    className="relative flex flex-col lg:flex-row gap-8 lg:gap-16 group"
                  >
                    {/* Date Column */}
                    <div className="lg:w-44 shrink-0 relative">
                      <div className="bg-white border-2 border-slate-50 rounded-xl p-6 lg:p-8 flex flex-col items-center justify-center shadow-sm group-hover:border-emerald-200 transition-all group-hover:shadow-xl group-hover:shadow-emerald-500/5 relative z-10">
                        <span className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold mb-2">
                          {new Date(report.date).toLocaleDateString('id-ID', { month: 'long' })}
                        </span>
                        <span className="text-2xl font-bold text-emerald-950 tracking-tighter leading-none">
                          {new Date(report.date).getDate()}
                        </span>
                        <div className="mt-4 h-1.5 w-1.5 rounded-full bg-emerald-500 group-hover:scale-[3] transition-transform" />
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-50 p-8 lg:p-12 shadow-sm hover:shadow-2xl transition-all duration-500 relative flex flex-col xl:flex-row gap-6">
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                          <span
                            className={clsx(
                              'inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold font-semibold uppercase text-xs ring-4 ring-opacity-10 transition-all',
                              statusColors[report.status].bg,
                              statusColors[report.status].text,
                              statusColors[report.status].ring,
                            )}
                          >
                            <div
                              className={clsx(
                                'w-2 h-2 rounded-full',
                                statusColors[report.status].dot,
                              )}
                            />
                            {statusLabels[report.status]}
                          </span>
                          {report.reflection && (
                            <span className="bg-emerald-600 text-white text-sm font-bold font-semibold uppercase text-xs px-6 py-2.5 rounded-full flex items-center gap-2">
                              <Activity size={12} /> Refleksi Aktif
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-2xl lg:text-3xl font-bold text-emerald-950 tracking-tight leading-none group-hover:text-emerald-600 transition-colors uppercase">
                            {report.title}
                          </h4>
                          <div className="flex items-start gap-4">
                            <CornerDownRight size={20} className="text-slate-200 shrink-0 mt-1" />
                            <p className="text-sm font-bold text-emerald-950 leading-relaxed uppercase tracking-tight">
                              "{report.activity}"
                            </p>
                          </div>
                        </div>

                        {/* AI SENSE: Automated Insight */}
                        {report.ai_analysis && (
                          <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-50/60 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Activity size={64} />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <LayoutGrid size={16} strokeWidth={3} />
                              </div>
                              <h5 className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold">
                                AI Intelligence Review
                              </h5>
                              <div className="ml-auto flex items-center gap-2">
                                <span
                                  className={clsx(
                                    'px-2 py-1 rounded-md text-sm font-bold uppercase',
                                    report.ai_analysis.abcd_compliance >= 8
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-700',
                                  )}
                                >
                                  ABCD: {report.ai_analysis.abcd_compliance}/10
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                              {report.ai_analysis.feedback}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {report.ai_analysis.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-sm font-bold text-emerald-600 font-bold text-center"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-6 flex gap-3">
                          {report.status !== 'approved' && (
                            <Link
                              href={route('student.laporan-harian.edit', report.id)}
                              className="h-14 px-8 rounded-2xl bg-emerald-50/30 border border-emerald-50/60 text-emerald-950 hover:bg-emerald-600 hover:text-white font-bold text-sm transition-all flex items-center gap-3 uppercase tracking-wider text-xs font-semibold"
                            >
                              Review Detail <ChevronRight size={14} strokeWidth={3} />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Activity Media Preview */}
                      <div className="xl:w-64 shrink-0">
                        <div className="grid grid-cols-2 gap-3 h-full min-h-[160px]">
                          {report.file_kegiatan.length > 0 ? (
                            <>
                              {report.file_kegiatan.slice(0, 3).map((file, i) => (
                                <div
                                  key={i}
                                  className={clsx(
                                    'rounded-2xl bg-emerald-50/60 overflow-hidden relative group/img overflow-hidden border-4 border-slate-50',
                                    i === 0
                                      ? 'col-span-2 row-span-2 aspect-video'
                                      : 'aspect-square',
                                  )}
                                >
                                  <img
                                    src={`/storage/${file.file_path}`}
                                    className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-700 scale-110 group-hover/img:scale-100"
                                    alt="Bukti"
                                  />
                                  <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                </div>
                              ))}
                              {report.file_kegiatan.length > 3 && (
                                <div className="rounded-2xl bg-emerald-600 flex flex-col items-center justify-center text-white gap-1 aspect-square">
                                  <span className="text-lg font-bold">
                                    {report.file_kegiatan.length - 3}+
                                  </span>
                                  <span className="text-sm font-bold font-bold text-center">
                                    Images
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="col-span-2 bg-emerald-50/30 rounded-2xl border-2 border-dashed border-emerald-50/60 flex flex-col items-center justify-center text-slate-200 gap-3">
                              <Camera size={32} strokeWidth={1} />
                              <span className="text-sm font-bold font-semibold uppercase text-xs">
                                No Media Asset
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-32 flex flex-col items-center gap-8 text-center">
                  <div className="h-40 w-40 bg-emerald-50/30 rounded-xl flex items-center justify-center text-slate-100 animate-pulse">
                    <LayoutGrid size={80} strokeWidth={1} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-3xl font-bold text-slate-200 font-bold text-center">
                      Zero Logs Detected
                    </h4>
                    <p className="text-sm font-bold text-slate-300 font-semibold uppercase text-xs">
                      Anda belum mengunggah rekam jejak aktivitas KKN.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* --- INTELLIGENCE FOOTER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-emerald-700 rounded-xl p-12 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 h-full w-64 bg-emerald-500 skew-x-12 translate-x-44 group-hover:translate-x-32 transition-transform duration-1000 opacity-20" />
            <div className="relative space-y-8">
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <Info size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold tracking-tight uppercase">
                  Protocol: Location Discovery
                </h4>
                <p className="text-emerald-950 font-bold leading-relaxed uppercase tracking-tight text-xs">
                  Jika portal gagal mendeteksi koordinat, pastikan Browser mengizinkan akses lokasi
                  secara eksplisit (*Location Access: Explicitly Granted*).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 rounded-xl p-12 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 h-full w-64 bg-emerald-900 -skew-x-12 translate-x-44 group-hover:translate-x-32 transition-transform duration-1000 opacity-20" />
            <div className="relative space-y-8 text-right flex flex-col items-end">
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <History size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold tracking-tight uppercase">Integrity Status</h4>
                <p className="text-emerald-100 font-bold leading-relaxed uppercase tracking-tight text-xs max-w-sm">
                  Setiap laporan yang disetujui (Approved) akan dikunci secara otomatis oleh sistem
                  untuk menjaga integritas data audit akademik.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Matrix */}
        {reports.links.length > 3 && (
          <div className="flex flex-col items-center gap-6">
            <div className="h-px w-32 bg-emerald-50/60" />
            <div className="flex items-center gap-4">
              {reports.links.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                  className={clsx(
                    'h-14 min-w-[56px] px-5 flex items-center justify-center rounded-2xl text-sm font-bold tracking-widest uppercase transition-all',
                    link.active
                      ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200'
                      : 'bg-white border border-emerald-50/60 text-emerald-950 hover:text-emerald-600 hover:border-emerald-200 shadow-sm',
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
