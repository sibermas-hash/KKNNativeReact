import type { PageProps } from '@/types';
import AppLayout from '@/Layouts/AppLayout';
import DashboardCard from '@/Components/DashboardCard';

interface DashboardProps extends PageProps {
  stats: {
    total_students: number;
    total_groups: number;
    total_reports: number;
  };
}

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Mahasiswa" value={stats.total_students} />
        <DashboardCard title="Total Kelompok" value={stats.total_groups} />
        <DashboardCard title="Laporan Harian" value={stats.total_reports} />
      </div>
    </AppLayout>
  );
}

