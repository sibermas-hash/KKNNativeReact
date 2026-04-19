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
  return (
    <AppLayout title="Bimbingan DPL">
      <Head title="Beranda DPL" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Unit Bimbingan" value={groups.length} icon={Users} color="emerald" />
          <StatBox label="Laporan Masuk" value={pendingReports} icon={FileText} color="amber" />
          <StatBox label="Progres Nilai" value={gradingProgress} icon={CheckCircle2} color="blue" />
          <StatBox
            label="Wilayah Tugas"
            value={coordinatorAreas.length > 0 ? coordinatorAreas.length : '—'}
            icon={MapPin}
            color="rose"
          />
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Unit List */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <LayoutGrid size={16} />
                </div>
                <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                  Kelompok Bimbingan
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] font-black text-emerald-800 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Kelompok & Periode</th>
                    <th className="px-6 py-4">Lokasi Desa</th>
                    <th className="px-6 py-4 text-right">Navigasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <tr key={group.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-900 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                            #{group.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-emerald-950">{group.name}</div>
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">
                            {group.period_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <MapPin size={12} className="text-rose-500/70" />
                            {group.village_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dpl/kelompok/${group.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-100 text-[10px] font-black text-emerald-800 hover:bg-emerald-900 hover:text-white rounded-lg transition-all uppercase tracking-widest shadow-sm"
                          >
                            Kelola
                            <ChevronRight size={10} strokeWidth={3} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                         <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-200">
                            <Users size={24} />
                         </div>
                        <p className="text-xs font-black text-emerald-950 uppercase tracking-widest opacity-40">
                          Belum ada kelompok bimbingan
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Side Panels */}
          <div className="space-y-4">
            {/* Risk Students */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-emerald-950 uppercase tracking-widest">
                    Atensi Khusus
                  </h2>
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                    Inaktif {'>'} 72 Jam
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {atRiskStudents.length > 0 ? (
                  atRiskStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-rose-50/30 rounded-xl border border-rose-100/50 hover:bg-rose-50 transition-colors cursor-default"
                    >
                      <div className="h-8 w-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-emerald-950 truncate">
                          {student.name}
                        </p>
                        <p className="text-[9px] font-bold text-rose-800 uppercase tracking-wider">
                          {student.nim} • {student.group_code}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                    <p className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest">
                      Semua Mahasiswa Aktif
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Trends */}
            <motion.div
              variants={itemVariants}
              className="bg-emerald-900 rounded-xl p-5 shadow-lg shadow-emerald-950/20 text-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-white/10 text-emerald-100 rounded-lg">
                  <Activity size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest">
                  Tren Aktivitas
                </h2>
              </div>
              <div className="space-y-3">
                {activityTrend.length > 0 ? (
                  activityTrend.slice(0, 4).map((item: { date: string; count: number }) => (
                    <div
                      key={item.date}
                      className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                    >
                      <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                        {item.date}
                      </span>
                      <span className="text-[10px] font-black bg-emerald-800 px-2 py-0.5 rounded-md">
                        {item.count} LAPORAN
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-white/30 uppercase text-center py-4 tracking-widest">
                    Belum ada data
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  color = 'emerald',
}: { label: string; value: any; icon: any; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
      <div
        className={clsx(
          'h-10 w-10 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-transform shadow-inner',
          colors[color],
        )}
      >
        <Icon size={18} strokeWidth={3} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5 truncate">
          {label}
        </p>
        <p className="text-lg font-black text-emerald-950 leading-none">{value}</p>
      </div>
    </div>
  );
}
