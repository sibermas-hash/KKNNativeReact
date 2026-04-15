import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Calendar,
  Users,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  ChevronLeft,
  BarChart3,
  ArrowRight,
  Target,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  period: {
    id: number;
    name: string;
    academic_year: { name: string };
    registration_start: string;
    registration_end: string;
    execution_start: string;
    execution_end: string;
    grading_start: string;
    grading_end: string;
    status_kkn: string;
    description: string | null;
    is_active: boolean;
    stats?: {
      total_students: number;
      total_groups: number;
      total_locations: number;
    };
  };
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(dateString));
}

const phaseLabel: Record<string, string> = {
  upcoming: 'Pra-Pendaftaran',
  registration: 'Pendaftaran',
  pendaftaran: 'Pendaftaran',
  placement: 'Plotting Penempatan',
  execution: 'Pelaksanaan Lapangan',
  pelaksanaan: 'Pelaksanaan Lapangan',
  grading: 'Penilaian',
  penilaian: 'Penilaian',
  finished: 'Selesai',
};

export default function PeriodShow({ period }: Props) {
  const currentPhaseLabel = phaseLabel[period.status_kkn] ?? period.status_kkn;

  const timeline = [
    {
      title: 'Pendaftaran Peserta',
      start: period.registration_start,
      end: period.registration_end,
      phase: 'pendaftaran',
    },
    {
      title: 'Pelaksanaan Lapangan',
      start: period.execution_start,
      end: period.execution_end,
      phase: 'pelaksanaan',
    },
    {
      title: 'Penilaian & Validasi Dokumen',
      start: period.grading_start,
      end: period.grading_end,
      phase: 'penilaian',
    },
  ];

  return (
    <AppLayout title={`Detail Periode — ${period.name}`}>
      <Head title={`Detail Periode — ${period.name}`} />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/periode"
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Periode KKN</span>
                <span className="text-gray-300">/</span>
                <span className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  period.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                )}>
                  {period.is_active ? 'Publik' : 'Draft'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-0.5">{period.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500">
              Tahun Akademik: <strong className="text-gray-700">{period.academic_year.name}</strong>
            </span>
            <Link
              href="/admin/periode"
              className="h-9 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Kembali ke Daftar
            </Link>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Peserta" value={period.stats?.total_students ?? 0} unit="Pendaftar" icon={Users} />
          <StatCard label="Total Kelompok" value={period.stats?.total_groups ?? 0} unit="Unit Kelompok" icon={Target} />
          <StatCard label="Cakupan Lokasi" value={period.stats?.total_locations ?? 0} unit="Titik Wilayah" icon={MapPin} />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: TIMELINE + DESKRIPSI */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Clock size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-800">Linimasa Operasional</h3>
              </div>
              <div className="p-6">
                <ol className="relative border-l border-gray-200 space-y-6 ml-3">
                  {timeline.map((item, idx) => {
                    const isActive = period.status_kkn === item.phase;
                    return (
                      <li key={idx} className="ml-6">
                        <span className={clsx(
                          'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white',
                          isActive ? 'bg-emerald-500' : 'bg-gray-200'
                        )}>
                          {isActive
                            ? <CheckCircle2 size={14} className="text-white" />
                            : <span className="h-2 w-2 rounded-full bg-gray-400" />
                          }
                        </span>
                        <div className={clsx(
                          'p-4 rounded-lg border',
                          isActive
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-gray-200'
                        )}>
                          <div className="flex items-center justify-between gap-4">
                            <p className={clsx(
                              'text-sm font-semibold',
                              isActive ? 'text-emerald-900' : 'text-gray-700'
                            )}>
                              {item.title}
                            </p>
                            {isActive && (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Fase Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 tabular-nums">
                            {formatDate(item.start)} — {formatDate(item.end)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-800">Keterangan Periode</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {period.description || 'Tidak ada keterangan tambahan untuk periode ini.'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: STATUS + QUICK ACCESS */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Info size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-800">Status Periode</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Publikasi</span>
                  <span className={clsx(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    period.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  )}>
                    {period.is_active ? 'Terbit (Publik)' : 'Sembunyikan (Draft)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fase Saat Ini</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {currentPhaseLabel}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Seluruh akses fitur mahasiswa dan DPL dikontrol berdasarkan fase aktif periode ini.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">Akses Cepat</h3>
              </div>
              <div className="p-4 space-y-2">
                <QuickLink href="/admin/pendaftaran" label="Validasi Pendaftaran Peserta" />
                <QuickLink href="/admin/kelompok" label="Manajemen Kelompok KKN" />
                <QuickLink href="/admin/dosen/penugasan" label="Penugasan DPL" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, unit, icon: Icon }: {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight tabular-nums">
          {value.toLocaleString('id-ID')}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
    >
      <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-800">{label}</span>
      <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
    </Link>
  );
}
