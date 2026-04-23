import { Head, router, Link, Deferred } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PaginationMeta } from '@/Components/ui/Pagination';
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
  LayoutGrid
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Pagination } from '@/Components/ui';

// Premium Components
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
  mahasiswa?: { nama?: string | null; nim?: string | null; } | null;
  kelompok?: { nama_kelompok?: string | null; } | null;
}

interface Props extends PageProps {
  reports?: {
    data: FinalReportData[];
    meta: PaginationMeta;
  };
  filters: { status?: string; };
}

const statusOptions = [
  { value: '', label: 'SEMUA STATUS' },
  { value: 'submitted', label: 'DIKIRIM (PENDING)' },
  { value: 'reviewed', label: 'MENUNGGU REVIEW' },
  { value: 'disetujui', label: 'DISETUJUI (VERIFIED)' },
  { value: 'revisi', label: 'REVISI (NEED FIX)' },
];

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
  const rows = reports?.data ?? [];

  const handleFilterChange = (value: string) => {
    router.get('/admin/laporan/akhir', { status: value || undefined }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout title="Repositori Laporan Akhir">
      <Head title="Repositori Laporan Akhir | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Laporan Akhir."
          subtitle="Audit integritas luaran pengabdian dan validasi dokumen kelulusan akhir."
          icon={Archive}
          groupLabel="Monitoring & Arsip"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Deferred data="reports" fallback={<div className="h-24 bg-gray-50 animate-pulse rounded-2xl" />}>
            <StatCard label="Populasi Arsip" value={reports?.meta.total || 0} icon={FileCheck} variant="success" />
          </Deferred>
          <StatCard label="Audit State" value="VALIDATED" icon={ShieldCheck} variant="info" />
          <StatCard label="Node Arsip" value="AKTIF" icon={Activity} variant="gray" />
          <StatCard label="Protocol" value="REAL-TIME" icon={Cpu} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
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
                  className="w-full h-11 pl-4 pr-10 bg-gray-50 border-2 border-slate-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-950/20 rotate-90 pointer-events-none" />
              </div>
              <button 
                className="h-11 w-11 bg-emerald-950 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-95 shadow-lg shadow-emerald-950/10"
              >
                <Filter size={18} />
              </button>
            </div>
          }
          footer={
            <Deferred data="reports" fallback={<div className="h-4 w-48 bg-gray-50 animate-pulse rounded" />}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Entry #{reports?.meta.from || 0}-{reports?.meta.to || 0} &middot; {reports?.meta.total || 0} Dokumen Terdaftar
                  </span>
                </div>
                {reports && <Pagination meta={reports.meta} />}
              </div>
            </Deferred>
          }
        >
          <Deferred data="reports" fallback={
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl">
              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <Loader2 size={32} className="text-emerald-600 animate-spin" />
              </div>
              <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Database...</span>
            </div>
          }>
            <PremiumTable
              headers={['Identitas Berkas', 'Kontributor', 'Unit / Kelompok', 'Validasi Audit', 'Opsi']}
              isEmpty={rows.length === 0}
              emptyText="Tidak ada arsip laporan yang ditemukan."
            >
              {rows.map((report) => (
                <PremiumTableRow key={report.id} className="group">
                  <PremiumTableCell>
                    <div className="flex items-center gap-4 py-1">
                      <div className="h-10 w-10 bg-gray-50 border border-emerald-50 text-emerald-200 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">{report.title}</span>
                        <span className="text-[9px] font-black text-emerald-950/40 font-mono tracking-tighter uppercase">DOCID: #{report.id.toString().padStart(5, '0')}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">{report.mahasiswa?.nama || '-'}</span>
                      <span className="text-[9px] font-bold text-emerald-600/50 font-mono tracking-tighter uppercase">NIM: {report.mahasiswa?.nim || '-'}</span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAF9] border border-emerald-50 rounded-lg">
                      <Layers size={12} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">{report.kelompok?.nama_kelompok || '-'}</span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <StatusTag 
                      status={
                        report.status === 'disetujui' ? 'active' : 
                        report.status === 'revisi' ? 'error' : 
                        report.status === 'reviewed' ? 'info' : 'pending'
                      } 
                      label={
                        report.status === 'disetujui' ? 'VERIFIED' : 
                        report.status === 'reviewed' ? 'REVIEWING' : 
                        report.status.toUpperCase()
                      } 
                      size="sm" 
                    />
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    <Link 
                      href={route('admin.laporan.akhir.show', report.id)}
                      className="h-9 px-4 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase"
                    >
                      <Eye size={14} /> Audit
                    </Link>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </Deferred>
        </ContentPanel>

      </div>
    </AppLayout>
  );
}
