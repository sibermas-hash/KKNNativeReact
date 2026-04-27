import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  User,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Clock,
  Users,
  Search,
  Activity,
  Target,
  Briefcase,
  Database,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  History,
  Phone,
  MapPin,
  AtSign,
  BookOpen,
  CalendarDays,
  CheckCircle,
  XCircle,
  Fingerprint,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import StatusTag from '@/Components/Premium/StatusTag';

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
    nik?: string | null;
    nama?: string | null;
    gender?: string | null;
    batch_year?: number | null;
    gpa?: number | null;
    sks_completed?: number | null;
    is_bta_ppi_passed?: boolean | null;
    birth_place?: string | null;
    birth_date?: string | null;
    fakultas?: { nama?: string | null } | null;
    prodi?: { nama?: string | null } | null;
    user?: {
      avatar?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    } | null;
  } | null;
  periode?: {
    name?: string | null;
    guide?: {
      requirements: string[];
    } | null;
    governance?: {
      program_type_label?: string | null;
      program_subtype_label?: string | null;
      registration_mode_label?: string | null;
      placement_mode_label?: string | null;
    } | null;
  } | null;
  kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
  dokumen?: RegistrationDocument[];
}

interface Props {
  registration: RegistrationData;
}

export default function RegistrationShow({ registration }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const approveForm = useForm({});
  const rejectForm = useForm({
    notes: registration.rejection_reason ?? '',
  });

  const documents = useMemo(() => registration.dokumen ?? [], [registration.dokumen]);
  const isPending = ['menunggu', 'pending', 'document_submitted'].includes(registration.status);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAvatarUrl = () => {
    if (registration.mahasiswa?.user?.avatar) {
      return `/storage/${registration.mahasiswa.user.avatar}`;
    }
    return null;
  };

  return (
    <AppLayout title="Detail Pendaftaran">
      <Head title={`Pendaftaran: ${registration.mahasiswa?.nama || '-'}`} />

      <div className="space-y-6 font-sans pb-12 text-emerald-950">
        {/* BREADCRUMB HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#0d9488]" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Audit & Otorisasi
              </span>
            </div>
            <h1 className="text-2xl font-black text-emerald-950 leading-tight">
              Detail Pendaftaran.
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <StatusTag status={registration.status} />
            <Link
              href="/admin/pendaftaran"
              className="h-9 px-4 bg-white border border-gray-200 text-emerald-900 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 no-underline flex items-center gap-2 shadow-sm hover:border-emerald-600"
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Kembali
            </Link>
          </div>
        </div>

        {/* COMPACT STAT ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CompactStat
            label="ID Pendaftaran"
            value={`#REG-${registration.id}`}
            icon={Fingerprint}
          />
          <CompactStat label="Audit Berkas" value={`${documents.length} File`} icon={Database} />
          <CompactStat
            label="Unit / Kelompok"
            value={registration.kelompok?.code || 'MENUNGGU'}
            icon={Users}
          />
          <CompactStat
            label="Periode"
            value={registration.periode?.name || '-'}
            icon={CalendarDays}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* DATA MAHASISWA WITH COMPACT PHOTO */}
            <ContentPanel title="Data Identitas Mahasiswa" icon={User}>
              <div className="flex flex-col md:flex-row gap-8 items-start py-2">
                {/* PHOTO - COMPACT SQUARE */}
                <div className="shrink-0">
                  <div className="h-32 w-32 rounded-xl bg-gray-50 border border-emerald-50 overflow-hidden shadow-sm relative group">
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl() ?? undefined}
                        alt="Avatar"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-200">
                        <User size={48} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                </div>

                {/* INFO GRID */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 w-full">
                  <SimpleItem label="Nama Lengkap" value={registration.mahasiswa?.nama} />
                  <SimpleItem label="NIM" value={registration.mahasiswa?.nim} />
                  <SimpleItem label="NIK" value={registration.mahasiswa?.nik} />
                  <SimpleItem label="Fakultas" value={registration.mahasiswa?.fakultas?.nama} />
                  <SimpleItem label="Program Studi" value={registration.mahasiswa?.prodi?.nama} />
                  <SimpleItem
                    label="Angkatan"
                    value={registration.mahasiswa?.batch_year?.toString()}
                  />
                  <SimpleItem
                    label="Gender"
                    value={registration.mahasiswa?.gender === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                  />
                  <SimpleItem label="Telepon/WA" value={registration.mahasiswa?.user?.phone} />
                  <SimpleItem label="Email" value={registration.mahasiswa?.user?.email} />
                  <div className="md:col-span-2 lg:col-span-3">
                    <SimpleItem
                      label="Alamat Domisili"
                      value={registration.mahasiswa?.user?.address}
                    />
                  </div>
                </div>
              </div>
            </ContentPanel>

            {/* DOKUMEN VAULT - COMPACT LIST */}
            <ContentPanel title="Berkas Persyaratan" icon={FileText} padding={false}>
              <div className="divide-y divide-gray-50 border-t border-gray-50">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 bg-[#f0fdfa] text-[#0d9488] rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-black text-emerald-950 uppercase tracking-tight truncate">
                            {doc.document_type}
                          </span>
                          <span className="text-xs text-emerald-800 font-mono truncate">
                            {doc.file_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <StatusTag status={doc.status || 'pending'} />
                        <a
                          href={`/admin/pendaftaran/berkas/unduh?path=${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 bg-white border border-emerald-50 text-emerald-600 text-xs font-black uppercase rounded-lg hover:bg-emerald-950 hover:text-white transition-all no-underline flex items-center gap-2 shadow-sm"
                        >
                          Lihat <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-xs font-bold text-emerald-800 uppercase tracking-widest">
                    Belum ada berkas pendukung.
                  </div>
                )}
              </div>
            </ContentPanel>
          </div>

          <div className="space-y-6">
            {/* DYNAMIC AUDIT PREREQUISITES */}
            <ContentPanel title="Audit Kelayakan Sistem" icon={GraduationCap}>
              <div className="space-y-3">
                {registration.periode?.guide?.requirements?.map((req, idx) => {
                  const isSks = req.toLowerCase().includes('sks');
                  const isGpa = req.toLowerCase().includes('ipk');
                  const isBta = req.toLowerCase().includes('bta');
                  
                  // Simple heuristic for UI validation state in admin view
                  let isValid = true;
                  let value = "VALID";

                  if (isSks) {
                    const sks = registration.mahasiswa?.sks_completed ?? 0;
                    isValid = sks >= 100;
                    value = `${sks} SKS`;
                  } else if (isGpa) {
                    const gpa = registration.mahasiswa?.gpa ?? 0;
                    isValid = gpa >= 2.0;
                    value = `IPK ${gpa.toFixed(2)}`;
                  } else if (isBta) {
                    isValid = !!registration.mahasiswa?.is_bta_ppi_passed;
                    value = isValid ? "LULUS" : "BELUM";
                  }

                  return (
                    <StatusItem
                      key={idx}
                      label={req.toUpperCase()}
                      value={value}
                      isValid={isValid}
                    />
                  );
                }) || (
                  <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Tidak ada prasyarat sistem terdefinisi.
                  </p>
                )}
              </div>
            </ContentPanel>

            {/* ACTION HUB */}
            <ContentPanel title="Otorisasi Status" icon={ShieldCheck}>
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {isPending ? (
                    !showRejectForm ? (
                      <div className="grid gap-3">
                        {Object.keys(approveForm.errors).length > 0 && (
                          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-100">
                            {Object.values(approveForm.errors).map((err, i) => (
                              <div key={i}>{err}</div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() =>
                            approveForm.patch(`/admin/pendaftaran/${registration.id}/setujui`)
                          }
                          disabled={approveForm.processing}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-none disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {approveForm.processing ? (
                            <RefreshCw className="animate-spin h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                          )}
                          Sahkan Pendaftaran
                        </button>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="w-full h-10 border border-emerald-50 text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-colors"
                        >
                          Tolak / Revisi
                        </button>
                      </div>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          rejectForm.patch(`/admin/pendaftaran/${registration.id}/tolak`, {
                            onSuccess: () => setShowRejectForm(false),
                          });
                        }}
                        className="space-y-3"
                      >
                        {Object.keys(rejectForm.errors).length > 0 && (
                          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-100">
                            {Object.values(rejectForm.errors).map((err, i) => (
                              <div key={i}>{err}</div>
                            ))}
                          </div>
                        )}
                        <textarea
                          required
                          placeholder="Tulis alasan penolakan..."
                          value={rejectForm.data.notes}
                          onChange={(e) => rejectForm.setData('notes', e.target.value)}
                          className="w-full h-24 p-3 bg-gray-50 border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:ring-[#0d9488] focus:border-[#f3f4f6]0 outline-none transition-all placeholder:text-black"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="flex-1 h-9 bg-gray-100 text-emerald-800 text-[9px] font-black uppercase rounded-lg"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={rejectForm.processing}
                            className="flex-[2] h-9 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                          >
                            Kirim Penolakan
                          </button>
                        </div>
                      </motion.form>
                    )
                  ) : (
                    <div className="p-4 bg-gray-50 border border-emerald-50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-emerald-950/40 uppercase tracking-widest">
                          Keputusan Akhir
                        </span>
                        <StatusTag status={registration.status} />
                      </div>
                      <p className="text-xs font-bold text-emerald-950 italic leading-relaxed">
                        "
                        {registration.status === 'rejected'
                          ? registration.rejection_reason
                          : registration.notes || 'REGISTRASI DINYATAKAN VALID.'}
                        "
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CompactStat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="bg-white border border-emerald-50 p-4 rounded-xl shadow-sm flex items-center gap-4 hover:border-emerald-50 transition-colors group">
      <div className="h-10 w-10 bg-[#f0fdfa] text-[#0d9488] rounded-lg flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
        <Icon size={18} strokeWidth={3} />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">
          {label}
        </span>
        <span className="text-xs font-black text-emerald-950 truncate" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}

function SimpleItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <span className="text-xs font-black text-emerald-950 uppercase leading-snug">
        {value || '-'}
      </span>
    </div>
  );
}

function StatusItem({ label, value, isValid }: { label: string; value: string; isValid: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
      <span className="text-xs font-black text-emerald-800 uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <span className={clsx('text-xs font-black', isValid ? 'text-[#0d9488]' : 'text-rose-600')}>
          {value}
        </span>
        {isValid ? (
          <CheckCircle size={14} className="text-[#0d9488]" strokeWidth={3} />
        ) : (
          <AlertCircle size={14} className="text-rose-400" strokeWidth={3} />
        )}
      </div>
    </div>
  );
}

function ExternalLink({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
