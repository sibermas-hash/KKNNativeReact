import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Users,
  FileText,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  ChevronRight,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { PageProps, ColorPalette } from '@/types';

interface GroupSummary {
  id: number;
  code: string;
  name: string;
  period_name: string;
  village_name: string;
  member_count: number;
  daily_report_count: number;
}

interface AtRiskStudent {
  id: number;
  name: string;
  nim: string;
  group_code: string;
}

interface Props {
  groups: GroupSummary[];
  pendingReports: number;
  gradingProgress: string;
  atRiskStudents: AtRiskStudent[];
  activityTrend: Array<{ date: string; count: number }>;
  coordinatorAreas: Array<{ area: string; count: number }>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DplDashboard({
  groups,
  pendingReports,
  gradingProgress,
  atRiskStudents,
  activityTrend,
  coordinatorAreas,
}: Props) {
  const { auth } = usePage<PageProps>().props;

  return (
    <AppLayout title="Bimbingan DPL">
      <Head title="Beranda DPL" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        {/* COMPACT HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                Sistem Monitoring DPL
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {auth.user.name.split(',')[0]}. 👋
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="flex flex-col border-r border-slate-100 pr-4 text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                Perlu Validasi
              </span>
              <span className="text-xs font-black text-rose-600">{pendingReports} Laporan</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                Role Akses
              </span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                Dosen Pembimbing
              </span>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Unit Bimbingan" value={groups.length} icon={Users} color="emerald" />
          <StatBox label="Laporan Masuk" value={pendingReports} icon={FileText} color="amber" />
          <StatBox label="Progres Nilai" value={gradingProgress} icon={CheckCircle2} color="blue" />
          <StatBox
            label="Wilayah Tugas"
            value={coordinatorAreas.length || '—'}
            icon={MapPin}
            color="rose"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: GROUP TABLE (8 COLS) */}
          <div className="lg:col-span-8 bg-white ring-1 ring-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-600/20">
                  <LayoutGrid size={16} />
                </div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  Kelompok Bimbingan Aktif
                </h2>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {groups.length} Kelompok Terdata
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Kode Unit
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Identitas Kelompok
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Lokasi Desa
                    </th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <tr key={group.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-wider">
                            #{group.code}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {group.name}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">
                            {group.period_name}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                            <MapPin size={12} className="text-rose-500" />
                            {group.village_name}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/dpl/kelompok/${group.id}`}
                            className="inline-flex h-9 items-center gap-2 px-4 bg-white ring-1 ring-slate-200 text-[10px] font-black text-slate-900 hover:bg-slate-900 hover:text-white hover:ring-slate-900 rounded-lg transition-all uppercase tracking-widest active:scale-95"
                          >
                            Kelola Unit <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <Users size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
                          Belum ada unit bimbingan yang ditugaskan.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: ALERTS & TRENDS (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            {/* ATENSI KHUSUS */}
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle size={16} />
                  </div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Atensi Khusus
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black rounded uppercase">
                  Urgensi Tinggi
                </span>
              </div>

              <div className="space-y-2">
                {atRiskStudents.length > 0 ? (
                  atRiskStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg group transition-all hover:bg-rose-50 hover:border-rose-100"
                    >
                      <div className="h-9 w-9 bg-white ring-1 ring-slate-200 text-slate-400 group-hover:text-rose-600 rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-tight">
                          {student.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          {student.nim} • {student.group_code}
                        </p>
                      </div>
                      <Link
                        href={`/dpl/mahasiswa/${student.id}`}
                        className="ml-auto p-1.5 text-slate-300 hover:text-rose-600"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      Seluruh Mahasiswa
                      <br />
                      Terpantau Aktif
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TREN AKTIVITAS */}
            <div className="bg-slate-900 rounded-xl p-6 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 -mr-4 -mt-4">
                <Activity size={80} />
              </div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-900/40">
                  <Activity size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest">Tren Aktivitas</h2>
              </div>

              <div className="space-y-4 relative z-10">
                {activityTrend.length > 0 ? (
                  activityTrend.slice(0, 4).map((item) => (
                    <div
                      key={item.date}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                        {item.date}
                      </span>
                      <span className="text-[11px] font-black text-white">
                        {item.count} LAPORAN
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-white/30 uppercase text-center py-6 tracking-widest">
                    Sinkronisasi Data...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  };
  return (
    <div className="bg-white p-5 rounded-xl ring-1 ring-slate-200 shadow-sm flex items-center gap-5 group hover:ring-slate-300 transition-all">
      <div
        className={clsx(
          'h-12 w-12 rounded-lg flex items-center justify-center ring-1 shadow-inner group-hover:scale-110 transition-transform',
          colors[color],
        )}
      >
        <Icon size={24} strokeWidth={3} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
