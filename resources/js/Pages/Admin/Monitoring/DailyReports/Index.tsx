import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import type { PageProps } from '@/types';
import {
  Calendar,
  Activity,
  Search,
  ChevronRight,
  Target,
  ShieldCheck,
  Zap,
  RefreshCw,
  FileText,
  Filter,
  Eye,
  LayoutGrid,
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { Pagination } from '@/Components/UI';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface ReportData {
  id: number;
  date: string;
  title: string;
  status: string;
  student: { name: string; nim: string };
  group: { name: string };
}

interface Props extends PageProps {
  reports: { data: ReportData[]; meta: PaginationMeta };
  filters: { status?: string; search?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');

  const handleApplyFilters = () => {
    router.get(
      '/admin/laporan/harian',
      {
        search: search || undefined,
        status: status || undefined,
      },
      { preserveState: true, replace: true },
    );
  };

    const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

return (
    <AppLayout title="Monitoring Logbook Harian">
      <Head title="Audit Logbook Harian | SIBERMAS" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Logbook Harian."
          subtitle="Audit transmisi aktivitas harian dan verifikasi kehadiran mahasiswa di lapangan."
          icon={Activity}
          groupLabel="Monitoring & Evaluasi"
        />

        {/* STATS GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Transmisi"
            value={reports.meta.total}
            icon={FileText}
            variant="success"
          />
          <StatCard label="Audit State" value="REAL-TIME" icon={RefreshCw} variant="info" />
          <StatCard label="Verifikasi AI" value="ACTIVE" icon={ShieldCheck} variant="gray" />
          <StatCard label="Security" value="ENCRYPTED" icon={Zap} variant="gray" />
          </motion.div>

        {/* MAIN CONTENT */}
        <motion.div variants={itemVariants}>
<ContentPanel
          title="Logbook Transaction Ledger"
          description="Daftar aktivitas harian mahasiswa yang telah dikirimkan melalui sistem."
          icon={LayoutGrid}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 border-2 border-slate-50 rounded-xl text-[12px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-950/20"
                  placeholder="CARI NAMA, NIM, ATAU JUDUL..."
                />
              </div>
              <div className="relative min-w-[200px]">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-gray-50 border-2 border-slate-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">SEMUA STATUS</option>
                  <option value="submitted">DIKIRIM (PENDING)</option>
                  <option value="disetujui">DISETUJUI (VERIFIED)</option>
                  <option value="revisi">REVISI</option>
                  <option value="draf">DRAF</option>
                </select>
                <ChevronRight
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-950/20 rotate-90 pointer-events-none"
                />
              </div>
              <button
                onClick={handleApplyFilters}
                className="h-11 px-6 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 active:scale-95"
              >
                <Filter size={16} /> Filter
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  Audit Trail Aktif &middot; {reports.meta.total} Laporan Terdeteksi
                </span>
              </div>
              <Pagination meta={reports.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={[
              'Aktivitas Mahasiswa',
              'Identitas Personel',
              'Lokasi/Kelompok',
              'Status Audit',
              'Opsi',
            ]}
            isEmpty={reports.data.length === 0}
            emptyText="Tidak ada transmisi laporan yang ditemukan."
          >
            {reports.data.map((r) => (
              <PremiumTableRow key={r.id} className="group">
                <PremiumTableCell>
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {r.title}
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-700/40">
                      <Calendar size={10} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {r.date}
                      </span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">
                      {r.student.name}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600/50 font-mono tracking-tighter uppercase">
                      {r.student.nim}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAF9] border border-emerald-50 rounded-lg">
                    <Target size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">
                      {r.group.name}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <StatusTag
                    status={
                      r.status === 'disetujui'
                        ? 'active'
                        : r.status === 'revisi'
                          ? 'error'
                          : r.status === 'submitted'
                            ? 'pending'
                            : 'draft'
                    }
                    label={
                      r.status === 'disetujui'
                        ? 'VERIFIED'
                        : r.status === 'submitted'
                          ? 'PENDING'
                          : r.status.toUpperCase()
                    }
                    size="sm"
                  />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <Link
                    href={`/admin/laporan/harian/${r.id}`}
                    className="h-9 px-4 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase"
                  >
                    <Eye size={14} /> Detail
                  </Link>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>
</motion.div>
      </motion.div>
    </AppLayout>
  );
}
