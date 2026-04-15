import { Head, Link } from '@inertiajs/react';
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
  Globe,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { DashboardMetricProps, ColorPalette } from '@/types';

interface GroupSummary {
  id: number;
  code: string;
  name: string;
  period_name: string;
  village_name: string;
  member_count: number;
  daily_report_count: number;
}

interface Props {
  groups: GroupSummary[];
  pendingReports: number;
  gradingProgress: string;
  atRiskStudents: Student[];
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
        className="space-y-6"
      >
        {/* --- HEADER --- */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-black tracking-tight">Portal <span className="text-emerald-600">Bimbingan DPL</span></h1>
            <p className="text-emerald-900 font-bold uppercase text-sm tracking-widest">Monitoring progres pengabdian & validasi logbook.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
             <div className="text-right">
                <p className="text-sm font-bold text-emerald-900 uppercase leading-none mb-1">Status Akses</p>
                <p className="text-sm font-bold text-black uppercase">Dosen Pembimbing</p>
            </div>
            <div className="h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
               <ShieldCheck size={16} />
            </div>
          </div>
        </motion.div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox title="Unit Bimbingan" value={groups.length} icon={Users} color="emerald" />
          <StatBox title="Laporan Masuk" value={pendingReports} icon={FileText} color="amber" />
          <StatBox title="Progres Nilai" value={gradingProgress} icon={CheckCircle2} color="blue" />
          <StatBox title="Wilayah Tugas" value={coordinatorAreas.length} icon={MapPin} color="rose" />
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Unit List */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><LayoutGrid size={16} /></div>
                <h2 className="text-xs font-bold text-black uppercase tracking-tight">Kelompok Bimbingan</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-sm font-bold text-emerald-900 font-semibold uppercase text-xs border-b border-slate-50">
                    <th className="px-6 py-3">Kode Unit</th>
                    <th className="px-6 py-3">Identitas Kelompok</th>
                    <th className="px-6 py-3">Lokasi Desa</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <tr key={group.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 bg-emerald-900 text-white text-sm font-bold rounded-lg uppercase tracking-wider">
                            #{group.code}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-xs font-bold text-black">{group.name}</div>
                          <div className="text-sm font-semibold text-emerald-900 uppercase tracking-tight">{group.period_name}</div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <MapPin size={12} className="text-rose-500" />
                            {group.village_name}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/dpl/kelompok/${group.id}`}
                            className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider"
                          >
                            Buka Panel
                            <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center">
                        <p className="text-sm font-bold text-emerald-900 uppercase">Belum ada kelompok bimbingan</p>
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
            <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><AlertTriangle size={16} /></div>
                <div>
                  <h2 className="text-sm font-bold text-black uppercase tracking-tight">Atensi Khusus</h2>
                  <p className="text-sm font-semibold text-emerald-900 uppercase leading-none mt-1">Inaktif {'>'} 72 Jam</p>
                </div>
              </div>
              <div className="space-y-3">
                {atRiskStudents.length > 0 ? (
                  atRiskStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black truncate max-w-[120px]">{student.name}</p>
                        <p className="text-sm font-semibold text-emerald-900 uppercase">{student.nim}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm font-bold text-slate-300 uppercase">Semua mahasiswa terpantau aktif</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Trends */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={16} /></div>
                <h2 className="text-sm font-bold text-black uppercase tracking-tight">Tren Aktivitas</h2>
              </div>
              <div className="space-y-3">
                {activityTrend.length > 0 ? (
                  activityTrend.slice(0, 5).map((item: { date: string; count: number }) => (
                    <div key={item.date} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 hover:px-1 transition-all">
                      <span className="text-sm font-bold text-emerald-900 uppercase">{item.date}</span>
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg">{item.count} Entri</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-bold text-slate-300 uppercase text-center py-4">Belum ada statistik entri</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}

function StatBox({ title, value, icon: Icon, color = 'emerald' }: DashboardMetricProps & { title?: string; color?: string }) {
  const colors: ColorPalette = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center border', colors[color])}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-1">{title || value}</p>
        <p className="text-lg font-bold text-black leading-none">{value}</p>
      </div>
    </div>
  );
}
