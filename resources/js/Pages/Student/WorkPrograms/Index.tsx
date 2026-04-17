import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  Info,
  Target,
  Wallet,
  ArrowRight,
  Layers,
  Zap,
  Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';

interface WorkProgram {
  id: number;
  title: string;
  description?: string | null;
  objectives?: string | null;
  budget: number;
  status: string;
}

interface Props {
  workPrograms: WorkProgram[];
  canCreate: boolean;
}

export default function StudentWorkProgramsIndex({ workPrograms, canCreate }: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
  };

  return (
    <AppLayout title="Program Kerja">
      <Head title="Program Kerja" />

      <div className="mx-auto max-w-6xl space-y-12 pb-20">
        {/* --- STRATEGIC HEADER --- */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-xl bg-emerald-50 border border-gray-200 p-12 lg:p-16 text-bg-emerald-100 shadow-lg"
        >
          <div className="absolute top-0 right-0 h-full w-1/3 bg-emerald-500 opacity-5 -skew-x-12 translate-x-1/2" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black shadow-xl shadow-emerald-500/20">
                  <Briefcase size={24} strokeWidth={3} />
                </div>
                <div className="h-px w-12 bg-emerald-500/30" />
                <span className="text-sm font-bold uppercase tracking-wider text-xs font-semibold text-[#1a7a4a]">
                  Operation Pipeline
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-2xl font-bold tracking-tighter uppercase leading-[0.9]">
                  Program <span className="text-[#1a7a4a]">Kerja Unit.</span>
                </h1>
                <p className="text-sm font-bold text-gray-900 font-semibold uppercase text-xs leading-relaxed max-w-md opacity-80">
                  Matriks strategi pengabdian dan pemberdayaan masyarakat oleh kelompok Anda.
                </p>
              </div>
            </div>

            {canCreate && (
              <Link
                href={route('student.program-kerja.create')}
                className="h-10 px-6 rounded-xl bg-emerald-500 text-black hover:bg-white transition-all flex items-center justify-center gap-4 group/btn shadow-2xl shadow-emerald-500/20 active:scale-95"
              >
                <Plus
                  size={24}
                  strokeWidth={4}
                  className="group-hover/btn:rotate-90 transition-transform duration-500"
                />
                <span className="text-sm font-bold font-semibold uppercase text-xs">
                  Inisiasi Program
                </span>
              </Link>
            )}
          </div>
        </motion.section>

        {/* --- PROGRAM MATRIX --- */}
        {workPrograms.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2"
          >
            {workPrograms.map((program) => (
              <motion.section
                key={program.id}
                variants={cardVariants}
                className="group relative rounded-[2.5rem] bg-white border border-gray-200/60 p-10 shadow-sm hover:shadow-2xl hover:shadow-bg-emerald-100/5 transition-all duration-500 overflow-hidden"
              >
                {/* Active Indicator */}
                <div className="absolute top-0 right-0 h-12 w-24 bg-emerald-500 opacity-0 group-hover:opacity-[0.03] -rotate-45 translate-x-12 -translate-y-12 transition-all duration-700" />

                <div className="flex items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-wider text-xs font-semibold">
                        Module-PK26-{program.id}
                      </p>
                    </div>
                    <h2 className="text-2xl font-bold text-black tracking-tighter uppercase group-hover:text-emerald-600 transition-colors leading-none">
                      {program.title}
                    </h2>
                  </div>
                  <StatusBadge
                    status={program.status}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold font-semibold uppercase text-xs border-2"
                  />
                </div>

                <div className="space-y-8">
                  <div className="bg-emerald-50/30 rounded-3xl p-8 border border-gray-200/60/50 min-h-[120px] relative overflow-hidden">
                    <Layers className="absolute -bottom-4 -right-4 h-12 w-24 text-slate-200 opacity-20" />
                    <p className="text-sm font-bold text-gray-900 leading-relaxed uppercase tracking-tight relative z-10">
                      {program.description ||
                        'Deskripsi operasional belum dikonfigurasi untuk modul ini.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/60 shadow-sm space-y-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Target size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-semibold uppercase text-xs text-gray-900 mb-1">
                          Objektif Utama
                        </p>
                        <p className="text-xs font-bold text-black uppercase truncate">
                          {program.objectives || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/60 shadow-sm space-y-3">
                      <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Wallet size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-semibold uppercase text-xs text-gray-900 mb-1">
                          Asset Allocation
                        </p>
                        <p className="text-xs font-bold text-black uppercase tabular-nums">
                          Rp {Number(program.budget || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={route('student.program-kerja.show', program.id)}
                    className="w-full h-14 rounded-2xl bg-emerald-50 border border-gray-200 flex items-center justify-between px-8 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all group/link"
                  >
                    <span className="text-sm font-bold font-semibold uppercase text-xs">
                      Detail & Manifes
                    </span>
                    <ArrowRight
                      size={16}
                      className="group-hover/link:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </motion.section>
            ))}
          </motion.div>
        ) : (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-4 border-dashed border-gray-200/60 bg-white py-32 text-center group hover:bg-emerald-50/30 transition-all duration-700"
          >
            <div className="mx-auto h-12 w-24 rounded-3xl bg-emerald-50/30 flex items-center justify-center text-slate-200 mb-10 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-[#1a7a4a] transition-all duration-500">
              <FolderKanban size={48} strokeWidth={1} />
            </div>
            <h3 className="text-3xl font-bold text-black font-bold text-center">
              Database Entry Kosong
            </h3>
            <p className="text-sm font-bold text-gray-900 mt-4 uppercase tracking-wider text-xs font-semibold max-w-sm mx-auto leading-relaxed opacity-60">
              Belum ada manifes program kerja yang terdaftar dalam unit kelompok Anda.
            </p>
          </motion.section>
        )}

        {/* --- INTELLIGENCE FOOTER --- */}
        <div className="bg-emerald-600 rounded-xl p-12 lg:p-16 relative overflow-hidden group shadow-2xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-white/10 -skew-x-12 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-10 w-20 rounded-xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-2xl">
              <Zap size={36} strokeWidth={3} className="animate-pulse" />
            </div>
            <div className="space-y-4 text-center md:text-left flex-1">
              <h4 className="text-xl font-bold text-white uppercase tracking-tight">
                Kriteria Validitas Program
              </h4>
              <p className="text-sm font-bold text-white/70 leading-relaxed font-semibold uppercase text-xs leading-loose max-w-2xl">
                Setiap program wajib melewati verifikasi DPL sebelum implementasi lapangan. Pastikan
                alokasi aset mematuhi metodologi{' '}
                <span className="text-white underline underline-offset-4 decoration-2">
                  Asset Based Community Development (ABCD)
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
