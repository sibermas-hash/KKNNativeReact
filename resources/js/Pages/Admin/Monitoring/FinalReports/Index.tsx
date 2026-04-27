import { Head, router, Link, Deferred } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import type { PageProps } from '@/types';
import {
  FileCheck,
  Filter,
  FileText,
  Layers,
  ShieldCheck,
  Cpu,
  Archive,
  ChevronRight,
  Activity,
  Loader2,
  Eye,
  LayoutGrid,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Pagination } from '@/Components/UI';

import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface FinalReportData {
  id: number;
  title: string;
  status: string;
  submitted_at: string | null;
  mahasiswa?: { nama?: string | null; nim?: string | null } | null;
  kelompok?: { nama_kelompok?: string | null } | null;
}

interface Props extends PageProps {
  reports?: {
    data: FinalReportData[];
    meta: PaginationMeta;
  };
  filters: { status?: string };
}

const statusOptions = [
  { value: '', label: 'SEMUA STATUS' },
  { value: 'submitted', label: 'DIKIRIM (PENDING)' },
  { value: 'approved', label: 'DISETUJUI (VERIFIED)' },
  { value: 'revision', label: 'REVISI (NEED FIX)' },
];

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
  const rows = reports?.data ?? [];

  const handleFilterChange = (value: string) => {
    router.get(
      '/admin/laporan/akhir',
      { status: value || undefined },
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
    <AppLayout title="Repositori Laporan Akhir">
      <Head title="Repositori Laporan Akhir | SIBERMAS" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1600px] space-y-8 px-4 py-10 font-sans sm:px-6 lg:px-8"
      >
        <PageHeader
          title="Laporan Akhir."
          subtitle="Audit integritas luaran pengabdian dan validasi dokumen kelulusan akhir."
          icon={Archive}
          groupLabel="Monitoring & Arsip"
        />

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Deferred
            data="reports"
            fallback={<div className="h-24 rounded-2xl bg-gray-50 animate-pulse" />}
          >
            <StatCard
              label="Populasi Arsip"
              value={reports?.meta.total || 0}
              icon={FileCheck}
              variant="success"
            />
          </Deferred>
          <StatCard label="Audit State" value="VALIDATED" icon={ShieldCheck} variant="info" />
          <StatCard label="Node Arsip" value="AKTIF" icon={Activity} variant="gray" />
          <StatCard label="Protocol" value="REAL-TIME" icon={Cpu} variant="gray" />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ContentPanel
            title="Final Report Transaction Ledger"
            description="Basis data luaran pengabdian mahasiswa yang telah disahkan melalui sistem."
            icon={LayoutGrid}
            padding={false}
            headerAction={
              <div className="flex items-center gap-3">
                <div className="relative min-w-[240px]">
                  <select
                    value={filters.status ?? ''}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border-2 border-slate-50 bg-gray-50 pl-4 pr-10 text-[11px] font-black uppercase tracking-widest text-emerald-950 outline-none transition-all focus:border-emerald-600 focus:bg-white"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-emerald-950/20"
                  />
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-white shadow-lg shadow-emerald-950/10 transition-all hover:bg-black active:scale-95">
                  <Filter size={18} />
                </button>
              </div>
            }
            footer={
              <Deferred
                data="reports"
                fallback={<div className="h-4 w-48 rounded bg-gray-50 animate-pulse" />}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950/40 tabular-nums">
                      Entry #{reports?.meta.from || 0}-{reports?.meta.to || 0} &middot;{' '}
                      {reports?.meta.total || 0} Dokumen Terdaftar
                    </span>
                  </div>
                  {reports && <Pagination meta={reports.meta} />}
                </div>
              </Deferred>
            }
          >
            <Deferred
              data="reports"
              fallback={
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-32">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                    <Loader2 size={32} className="animate-spin text-emerald-600" />
                  </div>
                  <span className="animate-pulse text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40">
                    Sinkronisasi Database...
                  </span>
                </div>
              }
            >
              <PremiumTable
                headers={[
                  'Identitas Berkas',
                  'Kontributor',
                  'Unit / Kelompok',
                  'Validasi Audit',
                  'Opsi',
                ]}
                isEmpty={rows.length === 0}
                emptyText="Tidak ada arsip laporan yang ditemukan."
              >
                {rows.map((report) => (
                  <PremiumTableRow key={report.id} className="group">
                    <PremiumTableCell>
                      <div className="flex items-center gap-4 py-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-50 bg-gray-50 text-emerald-200 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="line-clamp-1 text-[13px] font-black uppercase tracking-tight leading-none text-emerald-950 transition-colors group-hover:text-emerald-700">
                            {report.title}
                          </span>
                          <span className="font-mono text-[9px] font-black uppercase tracking-tighter text-emerald-950/40">
                            DOCID: #{report.id.toString().padStart(5, '0')}
                          </span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase tracking-tight leading-none text-emerald-950">
                          {report.mahasiswa?.nama || '-'}
                        </span>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-tighter text-emerald-600/50">
                          NIM: {report.mahasiswa?.nim || '-'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-50 bg-[#F8FAF9] px-3 py-1">
                        <Layers size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-emerald-900">
                          {report.kelompok?.nama_kelompok || '-'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <StatusTag
                        status={
                          report.status === 'approved'
                            ? 'active'
                            : report.status === 'revision'
                              ? 'error'
                              : 'pending'
                        }
                        label={
                          report.status === 'approved'
                            ? 'VERIFIED'
                            : report.status === 'revision'
                              ? 'REVISION'
                              : report.status.toUpperCase()
                        }
                        size="sm"
                      />
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <Link
                        href={route('admin.laporan.akhir.show', report.id)}
                        className="flex h-9 items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 text-[10px] font-black uppercase text-emerald-900 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-95"
                      >
                        <Eye size={14} /> Audit
                      </Link>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </Deferred>
          </ContentPanel>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
