import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Verified,
  ShieldCheck,
  FileCheck,
  ArrowRightCircle,
  Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { KKNScore, CertificateChecksum, PageProps } from '@/types';

interface Props extends PageProps {
  eligible: boolean;
  checks: CertificateChecksum;
  score: KKNScore;
  laporan_akhir_status: string;
  certificate_url: string | null;
}

export default function CertificateIndex({
  eligible,
  checks,
  score,
  laporan_akhir_status,
  certificate_url,
}: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <AppLayout title="Sertifikat KKN">
      <Head title="Sertifikat KKN" />

      <div className="mx-auto max-w-6xl space-y-12 pb-20">
        {/* --- ACCREDITATION HERO --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-xl bg-emerald-600 p-12 lg:p-16 text-white shadow-2xl shadow-emerald-500/20"
        >
          <div className="absolute top-0 right-0 h-full w-1/2 bg-emerald-500 opacity-5 -skew-x-12 translate-x-1/3" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-emerald-500/10 rounded-full blur-[120px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-8 max-w-xl">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-emerald-950">
                  <Award size={20} strokeWidth={3} />
                </div>
                <div className="h-px w-12 bg-emerald-500/30" />
                <span className="text-sm font-bold uppercase tracking-wider text-xs font-semibold text-[#0d9488]">
                  Official Accreditation
                </span>
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl md:text-2xl font-bold tracking-tighter uppercase leading-[0.9]">
                  E-Sertifikat <span className="text-[#0d9488]">Pengabdian.</span>
                </h1>
                <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs leading-relaxed opacity-80">
                  Dokumen resmi tanda kelulusan dan kontribusi nyata Anda dalam program KKN UIN
                  Saizu.
                </p>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="group relative">
                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 scale-150 group-hover:opacity-40 transition-opacity duration-1000" />
                <div className="relative rounded-[2.5rem] bg-white/5 p-10 backdrop-blur-3xl border border-white/10 shadow-2xl ring-1 ring-white/10">
                  <FileCheck className="h-12 w-24 text-emerald-400 opacity-80" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* --- VERIFICATION MATRIX --- */}
          <div className="lg:col-span-3 space-y-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl bg-white border border-emerald-50/60 p-12 shadow-sm"
            >
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold mb-12 flex items-center gap-3">
                <Fingerprint size={16} /> Clearance Protocol
              </h2>

              <div className="space-y-12">
                <CheckItem
                  label="DPL Authorization"
                  status={
                    checks.report_approved
                      ? 'success'
                      : laporan_akhir_status === 'pending'
                        ? 'pending'
                        : 'failed'
                  }
                  desc="Status manifes laporan akhir wajib disetujui DPL."
                  variants={itemVariants}
                />
                <CheckItem
                  label="Grade Finalization"
                  status={checks.is_finalized ? 'success' : 'pending'}
                  desc="Nilai akhir wajib melewati audit dan finalisasi LPPM."
                  variants={itemVariants}
                />
                <CheckItem
                  label="Quality Threshold"
                  status={checks.has_score ? (checks.min_grade ? 'success' : 'failed') : 'pending'}
                  desc="Minimal pencapaian nilai 70.00 untuk hak sertifikasi."
                  variants={itemVariants}
                />
              </div>
            </motion.div>

            {!eligible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-amber-600/5 border border-amber-600/10 p-8 flex gap-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shrink-0">
                  <AlertCircle size={24} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-900 font-semibold uppercase text-xs">
                    Protocol Warning
                  </p>
                  <p className="text-sm text-amber-900/60 font-bold leading-relaxed uppercase tracking-tight">
                    Status eligibilitas saat ini: <span className="text-amber-600">Terhenti</span>.
                    Lengkapi seluruh prasyarat atau hubungi Operator LPPM jika terjadi anomali data.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* --- ACTION CONSULE --- */}
          <div className="lg:col-span-2">
            <div className="sticky top-10 rounded-xl bg-white border border-emerald-50/60 overflow-hidden shadow-2xl shadow-slate-200/50">
              <div className="p-12 text-center space-y-10">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider text-xs font-semibold">
                  System Outcome
                </h3>

                {eligible ? (
                  <div className="space-y-10">
                    <div className="relative mx-auto h-32 w-32 flex items-center justify-center">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[40px] opacity-20 animate-pulse" />
                      <div className="h-28 w-28 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 ring-8 ring-emerald-500/5 z-10 flex">
                        <Verified size={48} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-emerald-950 font-bold text-center">
                        Approved.
                      </p>
                      <p className="text-sm font-bold text-[#0d9488] uppercase tracking-wider text-xs font-semibold">
                        Access Granted for Download
                      </p>
                    </div>
                    <a
                      href={certificate_url ?? '#'}
                      className="inline-flex w-full h-10 items-center justify-center gap-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-500 shadow-2xl shadow-emerald-200 active:scale-95 group/dl"
                    >
                      <Download className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
                      <span className="text-xs font-bold font-semibold uppercase text-xs">
                        Generate Certificate
                      </span>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50/30 text-slate-200 ring-8 ring-slate-100">
                      <Clock size={48} strokeWidth={1.5} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-slate-300 font-bold text-center">
                        Pending.
                      </p>
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-wider text-xs font-semibold">
                        Awaiting Authorization
                      </p>
                    </div>
                    <div className="h-10 w-full flex items-center justify-center gap-4 rounded-xl bg-emerald-50/30 text-slate-300 border border-emerald-50/60">
                      <span className="text-xs font-bold font-semibold uppercase text-xs">
                        Locked Area
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-50">
                  <p className="text-sm font-bold text-slate-300 font-semibold uppercase text-xs px-8 leading-relaxed">
                    Blockchain-ready verification. Digitally signed by LPPM SAIZU.
                  </p>
                </div>
              </div>

              {eligible && score && (
                <div className="bg-emerald-700 px-6 py-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold">
                      Score Matrix
                    </span>
                    <span className="text-2xl font-bold text-white tracking-tighter">
                      {score.total_score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold">
                      Final Grade
                    </span>
                    <div className="px-5 py-2 bg-emerald-500 rounded-[1rem] shadow-lg shadow-emerald-500/20">
                      <span className="text-sm font-bold text-emerald-950">{score.letter_grade}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CheckItem({
  label,
  status,
  desc,
  variants,
}: {
  label: string;
  status: 'success' | 'failed' | 'pending';
  desc: string;
  variants: Record<string, any>;
}) {
  return (
    <motion.div variants={variants} className="flex gap-6 group">
      <div className="shrink-0 mt-1">
        {status === 'success' ? (
          <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-emerald-950" strokeWidth={3} />
          </div>
        ) : status === 'failed' ? (
          <div className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-500/20">
            <XCircle className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-2xl bg-emerald-50/30 flex items-center justify-center border-2 border-emerald-50/60">
            <Clock className="h-6 w-6 text-slate-300" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p
          className={clsx(
            'text-sm font-bold font-semibold uppercase text-xs transition-colors',
            status === 'success' ? 'text-emerald-950' : 'text-emerald-950',
          )}
        >
          {label}
        </p>
        <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}
