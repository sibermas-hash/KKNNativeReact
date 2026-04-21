import { Head, usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/ui/Modal';
import {
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  ArrowRight,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { PageProps } from '@/types';

interface DosenInfo {
  id: number;
  nip: string;
  nama: string;
  fakultas: string | null;
}

interface WorkshopStatus {
  has_registered: boolean;
  is_passed: boolean;
  attendance_status?: string;
  workshop_title?: string;
  workshop_date?: string;
}

interface DplRegistration {
  status: string;
  periode_name: string | null;
  is_active: boolean;
  rejection_reason: string | null;
}

interface AvailableWorkshop {
  id: number;
  title: string;
  date: string | null;
  location: string | null;
  slots_left: number;
}

interface Props {
  dosen: DosenInfo | null;
  workshop_status: WorkshopStatus;
  dpl_registration: DplRegistration | null;
  available_periods: Array<{ id: number; name: string }>;
  available_workshops: AvailableWorkshop[];
  has_passed_workshop: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DosenDashboard({
  dosen,
  workshop_status,
  dpl_registration,
  available_periods,
  available_workshops,
  has_passed_workshop,
}: Props) {
  const { auth } = usePage<PageProps>().props;
  const firstName = dosen?.nama?.split(' ')?.[0] ?? auth?.user?.name?.split(' ')?.[0] ?? 'Dosen';

  const [selectedWorkshop, setSelectedWorkshop] = useState<AvailableWorkshop | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const phases = [
    {
      id: 1,
      label: 'Workshop',
      desc: 'Pembekalan DPL',
      icon: BookOpen,
      isCompleted: has_passed_workshop,
      isActive: !workshop_status.has_registered,
    },
    {
      id: 2,
      label: 'Pendaftaran',
      desc: 'Ajukan Diri',
      icon: ClipboardCheck,
      isCompleted: dpl_registration?.status === 'approved',
      isActive: has_passed_workshop && !dpl_registration,
    },
    {
      id: 3,
      label: 'Verifikasi',
      desc: 'Disetujui Admin',
      icon: UserCheck,
      isCompleted: dpl_registration?.status === 'approved',
      isActive: dpl_registration?.status === 'pending',
    },
    {
      id: 4,
      label: 'Penempatan',
      desc: 'Penugasan Kelompok',
      icon: MapPin,
      isCompleted: false,
      isActive: dpl_registration?.status === 'approved',
    },
  ];

  const completedPhases = phases.filter((p) => p.isCompleted).length;
  const progressPercent = Math.floor((completedPhases / phases.length) * 100);

  return (
    <AppLayout title="Portal Dosen">
      <Head title="Beranda Dosen" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* --- WELCOME CARD --- */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-100">
              {firstName.charAt(0)}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold text-emerald-950 tracking-tight">
                Halo, <span className="text-emerald-600">{firstName}!</span>
              </h1>
              <p className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                NIP: {dosen?.nip || '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-50">
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-950 uppercase leading-none mb-1">
                Status
              </p>
              <p className="text-sm font-bold text-emerald-600 uppercase">
                {dpl_registration?.status === 'approved'
                  ? 'DPL Aktif'
                  : dpl_registration?.status === 'pending'
                    ? 'Menunggu Verifikasi'
                    : has_passed_workshop
                      ? 'Lulus Workshop'
                      : 'Dosen'}
              </p>
            </div>
            <div
              className={clsx(
                'h-8 w-8 rounded-lg flex items-center justify-center',
                dpl_registration?.status === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-emerald-950',
              )}
            >
              {dpl_registration?.status === 'approved' ? (
                <CheckCircle2 size={16} />
              ) : (
                <GraduationCap size={16} />
              )}
            </div>
          </div>
        </motion.div>

        {/* --- PROGRESS TIMELINE --- */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ClipboardCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                Progres Rekrutmen DPL
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-600">{progressPercent}%</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="bg-emerald-600 h-1.5 rounded-full"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {phases.map((phase) => {
              const Icon = phase.icon;
              return (
                <div key={phase.id} className="relative">
                  <div
                    className={clsx(
                      'flex flex-col gap-2 p-3 rounded-xl border transition-all text-center',
                      phase.isCompleted
                        ? 'bg-emerald-50 border-emerald-100'
                        : phase.isActive
                          ? 'bg-white border-emerald-200 shadow-sm'
                          : 'bg-gray-50 border-slate-100',
                    )}
                  >
                    <div
                      className={clsx(
                        'h-8 w-8 mx-auto rounded-lg flex items-center justify-center',
                        phase.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : phase.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-emerald-950',
                      )}
                    >
                      {phase.isCompleted ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-950 leading-none mb-0.5">
                        {phase.label}
                      </p>
                      <p className="text-xs font-bold text-emerald-700 uppercase">{phase.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Action Card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            {!workshop_status.has_registered ? (
              /* Belum ikut workshop */
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center space-y-4">
                <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                  <BookOpen size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
                    Ikuti Workshop Pembekalan DPL
                  </h3>
                  <p className="text-xs font-bold text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Anda harus mengikuti dan lulus Workshop Pembekalan DPL sebelum bisa mendaftar
                    sebagai Dosen Pembimbing Lapangan.
                  </p>
                </div>
                {available_workshops.length > 0 ? (
                  <div className="space-y-2 max-w-md mx-auto">
                    {available_workshops.map((w) => (
                      <div
                        key={w.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 gap-3"
                      >
                        <div className="text-left flex-1">
                          <p className="text-sm font-bold text-emerald-950">{w.title}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700 mt-1.5">
                            {w.date && (
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar size={12} /> {w.date}
                              </span>
                            )}
                            {w.location && (
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin size={12} /> {w.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-emerald-100/50 pt-3 sm:pt-0 sm:border-0">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                            Sisa {w.slots_left}
                          </span>
                          <button
                            onClick={() => setSelectedWorkshop(w)}
                            disabled={w.slots_left <= 0}
                            className="bg-[#1a7a4a] text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#135c37] transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 shrink-0"
                          >
                            Daftar
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 max-w-md mx-auto">
                    Belum ada jadwal workshop yang tersedia. Hubungi admin untuk informasi lebih
                    lanjut.
                  </p>
                )}
              </div>
            ) : !has_passed_workshop ? (
              /* Sudah daftar tapi belum lulus */
              <div className="bg-white rounded-xl border border-amber-200 p-10 text-center space-y-4">
                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
                  <Clock size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
                    Menunggu Hasil Workshop
                  </h3>
                  <p className="text-xs font-bold text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Anda telah terdaftar di workshop{' '}
                    <span className="text-emerald-600 font-black">
                      {workshop_status.workshop_title}
                    </span>
                    . Hasil kelulusan akan diumumkan setelah workshop selesai.
                  </p>
                </div>
              </div>
            ) : !dpl_registration ? (
              /* Lulus workshop, belum daftar DPL */
              <DplRegistrationForm availablePeriods={available_periods} />
            ) : dpl_registration.status === 'pending' ? (
              /* Sudah daftar, menunggu approval */
              <div className="bg-white rounded-xl border border-amber-200 p-10 text-center space-y-4">
                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
                  <Clock size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
                    Pendaftaran DPL Diajukan
                  </h3>
                  <p className="text-xs font-bold text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Pendaftaran Anda untuk{' '}
                    <span className="text-emerald-600 font-black">
                      {dpl_registration.periode_name}
                    </span>{' '}
                    sedang dalam proses verifikasi oleh admin.
                  </p>
                </div>
              </div>
            ) : dpl_registration.status === 'rejected' ? (
              /* Ditolak */
              <div className="bg-white rounded-xl border border-rose-200 p-10 text-center space-y-4">
                <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
                  <XCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-950 uppercase tracking-tight">
                    Pendaftaran DPL Ditolak
                  </h3>
                  {dpl_registration.rejection_reason && (
                    <p className="text-xs font-bold text-rose-800 max-w-md mx-auto bg-rose-50 p-3 rounded-lg border border-rose-100">
                      {dpl_registration.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Approved - seharusnya redirect ke /dpl */
              <div className="bg-emerald-600 rounded-xl p-10 text-center text-white space-y-4">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight">
                  Anda Telah Resmi Menjadi DPL
                </h3>
                <p className="text-xs font-bold text-emerald-100 max-w-md mx-auto">
                  Akses halaman DPL untuk mulai membimbing kelompok KKN Anda.
                </p>
              </div>
            )}
          </motion.div>

          {/* Right sidebar */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                <GraduationCap size={12} className="text-emerald-600" />
                Data Dosen
              </h3>
              <div className="space-y-2">
                <InfoRow label="Nama" value={dosen?.nama ?? '-'} />
                <InfoRow label="NIP" value={dosen?.nip ?? '-'} />
                <InfoRow label="Fakultas" value={dosen?.fakultas ?? '-'} />
              </div>
            </div>

            {/* Panduan */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-50">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3">
                Panduan Rekrutmen DPL
              </h3>
              <div className="space-y-2">
                <GuideItem step={1} text="Ikuti Workshop Pembekalan DPL" />
                <GuideItem step={2} text="Lulus Workshop & Dapatkan Sertifikat" />
                <GuideItem step={3} text="Ajukan Pendaftaran DPL untuk Periode KKN" />
                <GuideItem step={4} text="Tunggu Persetujuan Admin" />
                <GuideItem step={5} text="Terima Penempatan Kelompok KKN" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Registration Modal */}
      <Modal 
        show={!!selectedWorkshop} 
        onClose={() => !isRegistering && setSelectedWorkshop(null)}
        title="Konfirmasi Pendaftaran"
        maxWidth="md"
      >
        {selectedWorkshop && (
          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="text-sm font-bold text-emerald-950 mb-3 leading-snug">{selectedWorkshop.title}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>{selectedWorkshop.date ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                  <MapPin size={14} className="text-emerald-600" />
                  <span>{selectedWorkshop.location ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="text-sm font-medium text-emerald-950 leading-relaxed">
              Apakah Anda yakin ingin mendaftar ke workshop ini? Sisa kuota peserta saat ini adalah <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{selectedWorkshop.slots_left} slot</span>.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedWorkshop(null)}
                disabled={isRegistering}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-900 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setIsRegistering(true);
                  router.post(`/dosen/workshops/${selectedWorkshop.id}/register`, {}, {
                    preserveScroll: true,
                    onFinish: () => {
                      setIsRegistering(false);
                      setSelectedWorkshop(null);
                    }
                  });
                }}
                disabled={isRegistering}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1a7a4a] hover:bg-[#135c37] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20 uppercase tracking-wider active:scale-95"
              >
                {isRegistering ? 'Memproses...' : 'Ya, Daftar Sekarang'}
                {!isRegistering && <CheckCircle2 size={16} />}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function DplRegistrationForm({ availablePeriods }: { availablePeriods: Array<{ id: number; name: string }> }) {
  const form = useForm({ periode_id: availablePeriods[0]?.id?.toString() || '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data.periode_id) return;
    form.post('/dosen/daftar-dpl', { preserveScroll: true });
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 p-10 text-center space-y-4">
      <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
        <CheckCircle2 size={24} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
          Selamat, Anda Lulus Workshop!
        </h3>
        <p className="text-xs font-bold text-emerald-800 max-w-md mx-auto leading-relaxed">
          Anda dapat mendaftarkan diri sebagai Dosen Pembimbing Lapangan (DPL) untuk periode KKN yang tersedia.
        </p>
      </div>
      {availablePeriods.length > 0 ? (
        <form onSubmit={submit} className="space-y-3 max-w-sm mx-auto">
          <select
            value={form.data.periode_id}
            onChange={(e) => form.setData('periode_id', e.target.value)}
            className="w-full h-10 px-3 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
          >
            {availablePeriods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={form.processing || !form.data.periode_id}
            className="inline-flex items-center gap-2 px-6 py-2.5 font-bold text-xs rounded-lg shadow-lg transition-all uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 disabled:opacity-50"
          >
            {form.processing ? 'Mengirim...' : 'Daftar Sebagai DPL'}
            <ArrowRight size={14} />
          </button>
          {form.errors.periode_id && <p className="text-xs font-bold text-rose-600">{form.errors.periode_id}</p>}
        </form>
      ) : (
        <p className="text-xs font-bold text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 max-w-md mx-auto">
          Belum ada periode KKN yang dibuka untuk pendaftaran DPL.
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-emerald-700 uppercase">{label}</span>
      <span className="text-xs font-bold text-emerald-950 text-right truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function GuideItem({ step, text }: { step: number; text: string }) {
  return (
    <div className="flex gap-2 text-xs font-bold text-emerald-900 leading-tight">
      <div className="h-5 w-5 shrink-0 bg-emerald-600 text-white rounded-md flex items-center justify-center text-[10px] font-black">
        {step}
      </div>
      <p className="pt-0.5">{text}</p>
    </div>
  );
}
