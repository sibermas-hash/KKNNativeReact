import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Props {
  registration: {
    id: number;
    status: string;
    status_label: string;
    registration_date: string;
    approved_at: string | null;
    period: {
      name: string;
      jenis: string;
    };
    notes: string | null;
    rejection_reason: string | null;
    group: {
      name: string;
      location: string | null;
      lecturer: string | null;
    } | null;
  };
  student: {
    nim: string;
    name: string;
    phone: string | null;
  };
}

export default function RegistrationStatus({ registration, student }: Props) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: AlertCircle,
    cancelled: XCircle,
  };

  const StatusIcon = statusIcons[registration.status] || Info;

  return (
    <AppLayout title="Status Pendaftaran KKN">
      <Head title="Cek Status Pendaftaran" />

      <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Link
            href="/mahasiswa"
            className="p-2 bg-white border border-emerald-100 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-emerald-950 tracking-tight">Status Pendaftaran</h1>
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-widest">Detail Riwayat Pengajuan</p>
          </div>
        </div>

        {/* Main Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden"
        >
          <div className={clsx("p-6 border-b flex items-center justify-between", statusColors[registration.status])}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/50 rounded-lg">
                <StatusIcon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Status Saat Ini</p>
                <p className="text-lg font-black uppercase tracking-tight">{registration.status_label}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Terakhir Diperbarui</p>
              <p className="text-xs font-bold">{registration.approved_at || registration.registration_date}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Context Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Periode KKN</p>
                    <p className="text-sm font-bold text-emerald-950">{registration.period.name}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{registration.period.jenis}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">ID Pendaftaran</p>
                    <p className="text-sm font-bold text-emerald-950">#REG-{registration.id.toString().padStart(6, '0')}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Daftar pada {registration.registration_date}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Data Mahasiswa</p>
                    <p className="text-sm font-bold text-emerald-950">{student.name}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">NIM: {student.nim}</p>
                  </div>
                </div>

                {registration.group && (
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Informasi Kelompok</p>
                      <p className="text-sm font-bold text-emerald-950">{registration.group.name}</p>
                      <p className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {registration.group.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Feedback Section */}
            {registration.status === 'pending' && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600">
                  <Info size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-amber-900 uppercase">Menunggu Verifikasi</p>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Berkas Anda sedang dalam antrian pemeriksaan oleh Admin LPPM. Harap memantau halaman ini atau Dashboard secara berkala.
                  </p>
                </div>
              </div>
            )}

            {registration.status === 'rejected' && (
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-center gap-3 text-rose-800">
                  <XCircle size={20} />
                  <p className="text-sm font-black uppercase">Pendaftaran Perlu Perbaikan</p>
                </div>
                <div className="p-4 bg-white/60 rounded-xl text-sm font-bold text-rose-950 italic border border-rose-100">
                  "{registration.rejection_reason || 'Mohon hubungi LPPM untuk informasi lebih lanjut.'}"
                </div>
                <div className="pt-2">
                  <Link
                    href={`/mahasiswa/pendaftaran/${registration.id}/dokumen`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                  >
                    Upload Ulang Berkas
                  </Link>
                </div>
              </div>
            )}

            {registration.status === 'approved' && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-emerald-900 uppercase">Pendaftaran Disetujui</p>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Selamat! Pendaftaran Anda telah divalidasi. Anda kini resmi menjadi peserta KKN. Silakan melanjutkan ke pengisian Program Kerja.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-emerald-50 flex items-center justify-center">
             <Link
                href="/mahasiswa"
                className="text-xs font-black text-emerald-800 uppercase tracking-widest hover:text-emerald-950 transition-colors"
             >
                Kembali ke Dashboard
             </Link>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="text-center opacity-40">
           <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
             Sistem Informasi Manajemen <span className="text-cyan-600">SIBER</span><span className="text-lime-600">DAYA</span>
           </p>
        </div>
      </div>
    </AppLayout>
  );
}
