import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  FileText, 
  Search, 
  Filter, 
  Layers, 
  Activity, 
  Cpu, 
  Archive,
  Zap,
  RefreshCw,
  LayoutGrid,
  Eye,
  Download,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { Pagination } from '@/Components/ui';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface ReportRow {
  id: number; 
  title: string; 
  type: string; 
  status: string; 
  file_name: string; 
  submitted_at: string | null; 
  user: { name: string; }; 
  group: { name: string; village: string; };
}

interface Props { 
  reports: { data: ReportRow[]; meta?: Record<string, any>; }; 
  summary: { total_reports: number; pending_review: number; }; 
}

const typeLabels: Record<string, string> = {
  final_report: 'LAPORAN AKHIR', 
  book_anthology: 'ANTOLOGI KKN', 
  scholarly_article: 'ARTIKEL PENGABDIAN', 
  village_map: 'PETA ASET DESA', 
  video_documentation: 'DOKUMENTASI VIDEO', 
  photo_documentation: 'DOKUMENTASI FOTO', 
  attendance_sheet: 'DAFTAR HADIR', 
  activity_proposal: 'PROPOSAL DESIGN', 
  evaluation_report: 'EVALUASI REFLEKSI',
};

export default function ReportsIndex({ reports, summary }: Props) {
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return reports.data;
    return reports.data.filter((report) => {
      const haystack = [report.title, report.type, report.user.name, report.group.name, report.group.village, report.file_name].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [reports.data, search]);

  return (
    <AppLayout title="Pustaka Aset Digital">
      <Head title="Pustaka Aset Digital | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Pustaka Aset."
          subtitle="Repositori terpusat luaran akademik dan dokumentasi pengabdian masyarakat UIN SAIZU."
          icon={Archive}
          groupLabel="Digital Asset Vault"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Aset KKN" value={summary.total_reports} icon={Trophy} variant="success" />
          <StatCard label="Audit Pending" value={summary.pending_review} icon={Activity} variant={summary.pending_review > 0 ? 'warning' : 'info'} />
          <StatCard label="Vault Status" value="ONLINE_SYNC" icon={Zap} variant="gray" />
          <StatCard label="Protocol" value="SIGNED_OFF" icon={ShieldCheck} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <ContentPanel
          title="Digital Asset Inventory"
          description="Direktori inventori produk akademik dan dokumentasi digital dari lokasi pengabdian."
          icon={LayoutGrid}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 border-2 border-slate-50 rounded-xl text-[12px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-950/20"
                  placeholder="CARI IDENTIFIER ASET..."
                />
              </div>
              <button 
                className="h-11 w-11 bg-emerald-950 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-95 shadow-lg shadow-emerald-950/10"
              >
                <Filter size={18} />
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  Vault Stream Nominal &middot; {summary.total_reports} Aset Terdaftar
                </span>
              </div>
              {reports.meta && <Pagination meta={reports.meta as any} />}
            </div>
          }
        >
          <PremiumTable
            headers={['Identitas Aset Digital', 'Unit / Dosen', 'Kategori Aset', 'Integritas', 'Opsi']}
            isEmpty={filteredReports.length === 0}
            emptyText="Tidak ada aset digital yang ditemukan."
          >
            {filteredReports.map((report) => (
              <PremiumTableRow key={report.id} className="group">
                <PremiumTableCell>
                  <div className="flex items-center gap-4 py-1">
                    <div className="h-10 w-10 bg-gray-50 border border-emerald-50 text-emerald-200 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">{report.title}</span>
                      <span className="text-[9px] font-black text-emerald-950/40 font-mono tracking-tighter uppercase">{report.file_name}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">{report.group.name}</span>
                    <span className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest">{report.user.name}</span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAF9] border border-emerald-50 rounded-lg">
                    <Layers size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">
                      {typeLabels[report.type] || report.type}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <StatusTag 
                    status={
                      report.status === 'disetujui' ? 'active' : 
                      report.status === 'revisi' ? 'error' : 'pending'
                    } 
                    label={
                      report.status === 'disetujui' ? 'VERIFIED' : 
                      report.status.toUpperCase()
                    } 
                    size="sm" 
                  />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/admin/laporan/${report.id}/unduh`}
                      className="h-9 w-9 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center"
                      title="Unduh Aset"
                    >
                      <Download size={14} />
                    </Link>
                    <button 
                      className="h-9 w-9 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

      </div>
    </AppLayout>
  );
}
