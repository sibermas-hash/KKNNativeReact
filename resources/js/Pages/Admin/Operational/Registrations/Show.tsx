import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormTextarea, StatusBadge, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
  User,
  FileText,
  Info,
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Fingerprint,
  Database,
  ArrowLeft,
  Clock,
  Users,
  ChevronRight,
  Activity,
  Target,
  Briefcase,
  Zap,
  XCircle,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface RegistrationDocument {
  id: number;
  document_type?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  status?: string | null;
}

interface RegistrationData {
  id: number;
  status: string;
  registration_date?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  revision_count?: number | null;
  last_rejected_at?: string | null;
  resubmitted_at?: string | null;
  role?: string | null;
  mahasiswa?: {
    nim?: string | null;
    nama?: string | null;
    gender?: string | null;
    batch_year?: number | null;
    fakultas?: { nama?: string | null } | null;
    prodi?: { nama?: string | null } | null;
  } | null;
  periode?: {
    name?: string | null;
    governance?: {
      program_type_label?: string | null;
      program_subtype_label?: string | null;
      registration_mode_label?: string | null;
      placement_mode_label?: string | null;
    } | null;
    guide?: {
      requirements?: string[];
      governance_notes?: string[];
    } | null;
  } | null;
  kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
  dokumen?: RegistrationDocument[];
}

interface Props extends PageProps {
  registration: RegistrationData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function RegistrationShow({ registration }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const approveForm = useForm({});
  const rejectForm = useForm({
    notes: registration.rejection_reason ?? '',
  });

  const documents = useMemo(() => registration.dokumen ?? [], [registration.dokumen]);
  const isPending = ['menunggu', 'pending', 'document_submitted'].includes(registration.status);

  return (
    <AppLayout title="Entity Verification HUB">
      <Head title={`Verify: ${registration.mahasiswa?.nama || '-'}`} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
      >
        {/* --- COMMAND HEADER --- */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-12"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-emerald-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">
                Operation Center / Entity Verification Hub
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
              Identify <span>Protocol.</span>
            </h1>
            <p className="text-lg font-bold text-gray-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
              Validasi identitas dan persyaratan. <br />
              <span className="text-gray-900 not-italic">
                Otentikasi data mahasiswa, verifikasi berkas pendukung, dan penetapan status
                pendaftaran.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 shrink-0">
            <Link
              href="/admin/pendaftaran"
              className="h-20 px-10 rounded-[2.5rem] bg-white border border-slate-200 text-gray-900 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-4 group/btn shadow-sm active:scale-95"
            >
              <ArrowLeft
                size={22}
                className="group-hover/btn:-translate-x-1 transition-transform"
              />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Abort & Exit Hub
              </span>
            </Link>
            <div className="h-20 px-10 rounded-[2.5rem] bg-emerald-600 text-white flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.3em] leading-none">
                  Status Protocol
                </span>
                <div className="scale-110 origin-left translate-y-1">
                  <StatusBadge status={registration.status} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- STRATEGIC METRICS MATRIX --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricCard
            label="Registration ID"
            value={`#REG-${registration.id.toString().padStart(5, '0')}`}
            icon={Fingerprint}
            color="slate"
          />
          <MetricCard
            label="Requirements Cache"
            value={`${documents.length} Files`}
            icon={Database}
            color="emerald"
          />
          <MetricCard
            label="Revision Loop"
            value={`${registration.revision_count ?? 0} cycles`}
            icon={Activity}
            color="amber"
          />
          <MetricCard
            label="Assigned Cluster"
            value={registration.kelompok?.code || 'UNASSIGNED'}
            icon={Target}
            color="rose"
          />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
          <div className="xl:col-span-8 space-y-12">
            {/* --- ENTITY PROFILE --- */}
            <motion.section
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50"
            >
              <div className="px-10 py-10 bg-emerald-700 flex items-center gap-6">
                <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <User size={24} className="text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                    Personal Data Registry
                  </h3>
                  <p className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">
                    Profil Identitas Mahasiswa
                  </p>
                </div>
              </div>
              <div className="p-12">
                <dl className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Full Legal Name" value={registration.mahasiswa?.nama} />
                  <DetailItem label="Unique ID (NIM)" value={registration.mahasiswa?.nim} />
                  <DetailItem
                    label="Faculty Cluster"
                    value={registration.mahasiswa?.fakultas?.nama}
                  />
                  <DetailItem label="Applied Program" value={registration.mahasiswa?.prodi?.nama} />
                  <DetailItem
                    label="Batch Transmission"
                    value={registration.mahasiswa?.batch_year?.toString()}
                  />
                  <DetailItem
                    label="Gender Identity"
                    value={registration.mahasiswa?.gender === 'L' ? 'MALE' : 'FEMALE'}
                  />
                </dl>
              </div>
            </motion.section>

            {/* --- REQUIREMENT INVENTORY --- */}
            <motion.section
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50"
            >
              <div className="px-10 py-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <FileText size={24} className="text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                      Requirement Inventory
                    </h3>
                    <p className="text-xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
                      Dokumen Pendukung
                    </p>
                  </div>
                </div>
                <div className="h-px flex-1 mx-10 bg-slate-100 hidden lg:block" />
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                    Manifest Verified
                  </span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
              <div className="p-10 space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="group/doc relative flex items-center justify-between p-8 bg-white border border-slate-100 rounded-3xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-50 transition-all overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover/doc:opacity-[0.03] group-hover/doc:scale-150 transition-all duration-700">
                        <FileText size={100} strokeWidth={1} />
                      </div>
                      <div className="flex items-center gap-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shadow-sm group-hover/doc:bg-emerald-600 group-hover/doc:text-white transition-all">
                          <span className="text-[10px] font-black uppercase leading-none text-gray-900 group-hover/doc:text-emerald-500">
                            PDF
                          </span>
                          <div className="h-px w-6 bg-slate-200 my-1.5" />
                          <span className="text-[8px] font-bold text-gray-400">DATA</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-base font-black text-gray-900 uppercase tracking-tighter group-hover/doc:text-emerald-700 transition-colors">
                            {doc.document_type || 'Unspecified Document'}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono truncate max-w-xs">
                              {doc.file_name}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase italic">
                              SHA-256 Verified
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="scale-90 opacity-80 group-hover/doc:opacity-100 group-hover/doc:scale-100 transition-all">
                          <StatusBadge status={doc.status || 'pending'} />
                        </div>
                        <Link
                          href={doc.file_path || '#'}
                          target="_blank"
                          className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:border-emerald-200 hover:rotate-6 transition-all shadow-sm"
                        >
                          <ChevronRight size={24} strokeWidth={3} />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[2.5rem] bg-slate-50/10 flex flex-col items-center gap-6">
                    <AlertCircle size={48} className="text-slate-200" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-300 uppercase tracking-widest">
                        Inventory Cache Empty
                      </p>
                      <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest italic leading-none">
                        TIDAK ADA DOKUMEN YANG DIUNGGAH.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          <div className="xl:col-span-4 space-y-12">
            {/* --- SESSION TELEMETRY --- */}
            <motion.section
              variants={itemVariants}
              className="bg-emerald-600 rounded-[3.5rem] p-10 text-white space-y-10 relative overflow-hidden group/s shadow-2xl shadow-emerald-200"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                <LayoutDashboard size={200} strokeWidth={1} />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover/s:bg-emerald-600 transition-all">
                  <Info size={20} className="text-white" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                    Audit Summary
                  </h3>
                  <p className="text-xl font-black text-white uppercase tracking-tighter">
                    Ringkasan Sesi
                  </p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                <SummaryItem
                  label="Transmission Date"
                  value={registration.registration_date}
                  icon={Clock}
                />
                <SummaryItem
                  label="Tactical Program"
                  value={
                    registration.periode?.governance?.program_subtype_label ||
                    registration.periode?.governance?.program_type_label ||
                    registration.periode?.name
                  }
                  icon={Briefcase}
                />
                <SummaryItem
                  label="Ingestion Mode"
                  value={registration.periode?.governance?.registration_mode_label}
                  icon={Fingerprint}
                />
                <SummaryItem
                  label="Cluster Assignment"
                  value={registration.kelompok?.nama_kelompok || 'AWAITING PLOT'}
                  icon={Users}
                />
              </div>
            </motion.section>

            {/* --- TACTICAL COMMAND HUB --- */}
            <motion.section
              variants={itemVariants}
              className={clsx(
                'rounded-[3.5rem] border p-12 shadow-2xl transition-all space-y-10',
                isPending
                  ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/5'
                  : 'bg-slate-50 border-slate-100',
              )}
            >
              <div className="flex items-center gap-5">
                <div
                  className={clsx(
                    'h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl',
                    isPending ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-gray-500',
                  )}
                >
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                    Decision Protocol
                  </h3>
                  <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Status Ketetapan
                  </p>
                </div>
              </div>

              {isPending ? (
                <div className="space-y-6">
                  <AnimatePresence mode="wait">
                    {!showRejectForm ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                      >
                        <button
                          onClick={() =>
                            approveForm.patch(`/admin/pendaftaran/${registration.id}/setujui`)
                          }
                          disabled={approveForm.processing}
                          className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-20"
                        >
                          {approveForm.processing ? (
                            <Activity size={20} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={20} strokeWidth={3} />
                          )}
                          Authorize Node
                        </button>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="w-full h-20 bg-white border-2 border-slate-100 text-gray-400 hover:text-rose-600 hover:border-rose-100 transition-all rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-sm active:scale-95"
                        >
                          Initialize Rejection
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          rejectForm.patch(`/admin/pendaftaran/${registration.id}/tolak`, {
                            onSuccess: () => setShowRejectForm(false),
                          });
                        }}
                        className="space-y-8"
                      >
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                            Rejection Reason Protocol
                          </label>
                          <textarea
                            required
                            placeholder="Berikan alasan yang jelas agar mahasiswa dapat memperbaiki berkas..."
                            value={rejectForm.data.notes}
                            onChange={(e) => rejectForm.setData('notes', e.target.value)}
                            className="w-full h-40 px-6 py-4 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:ring-0 text-sm font-bold transition-all placeholder:text-slate-300"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="flex-1 h-16 bg-slate-100 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                          >
                            Abort
                          </button>
                          <button
                            type="submit"
                            disabled={rejectForm.processing}
                            className="flex-2 h-16 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-3 px-8"
                          >
                            {rejectForm.processing ? (
                              <Activity size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Confirm Purge
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3 text-gray-400">
                      <AlertCircle size={14} />
                      <p className="text-[9px] font-black uppercase tracking-widest leading-none">
                        Transmission Log:
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-600 leading-relaxed italic uppercase tracking-tight">
                      "
                      {registration.status === 'rejected'
                        ? registration.rejection_reason || 'NO REJECTION REASON CAPTURED.'
                        : registration.notes || 'NODE AUTHORIZED WITHOUT SPECIAL BYPASS NOTES.'}
                      "
                    </p>
                  </div>
                  {registration.status === 'rejected' && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100 w-fit">
                      <Activity size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">
                        Iteration Loop: {registration.revision_count ?? 0}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-3 group/item">
      <dt className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-none group-hover/item:text-emerald-500 transition-colors italic">
        {label}
      </dt>
      <dd className="text-base font-black text-gray-900 leading-none uppercase tracking-tight italic">
        {value || 'N/A'}
      </dd>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-6 group/sitem">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover/sitem:bg-white group-hover/sitem:text-gray-950 group-hover/sitem:rotate-6 transition-all shadow-sm shrink-0">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] leading-none italic">
          {label}
        </span>
        <span className="text-sm font-black text-white uppercase tracking-tighter leading-none italic">
          {value || 'UNSET'}
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  return (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
        <Icon size={100} strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-5 relative z-10">
        <div
          className={clsx(
            'h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-gray-900 group-hover:text-white',
            color === 'emerald'
              ? 'bg-emerald-50 text-emerald-600'
              : color === 'amber'
                ? 'bg-amber-50 text-amber-600'
                : color === 'rose'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-50 text-gray-600',
          )}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-60 italic leading-none">
            {label}
          </p>
          <p className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
