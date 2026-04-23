import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  ShieldAlert, 
  Zap,
  Activity,
  ScanLine,
  Database,
  ShieldCheck,
  RefreshCw,
  Cpu,
  ShieldQuestion,
  Clock,
  LayoutGrid,
  Search,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface AuditedReport {
  id: number;
  user_name: string;
  group_name: string;
  title: string;
  submitted_at: string;
  risk_score: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_flags: string[];
  description_preview: string;
}

interface Props {
  reports: { data: AuditedReport[]; meta: PaginationMeta };
  stats: { high_risk_count: number };
}

export default function QualityAuditIndex({ reports, stats }: Props) {
  return (
    <AppLayout title="Audit Integritas Aktivitas">
      <Head title="Audit Integritas | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Audit Integritas."
          subtitle="Pemindaian otomatis anomali transmisi laporan dan identifikasi risiko kejujuran data lapangan."
          icon={ShieldAlert}
          groupLabel="Monitoring & Penjaminan Mutu"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Laporan Berisiko" value={stats.high_risk_count} icon={ShieldQuestion} variant="error" />
          <StatCard label="Audit Pipeline" value="STABIL" icon={ShieldCheck} variant="success" />
          <StatCard label="Update Sinyal" value="REAL-TIME" icon={RefreshCw} variant="info" />
          <StatCard label="Sistem Sentinel" value="ACTIVE" icon={ScanLine} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <ContentPanel
          title="Integrity Scanner Ledger"
          description="Daftar laporan yang terdeteksi memiliki potensi anomali berdasarkan algoritma pemindaian sistem."
          icon={LayoutGrid}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 border-2 border-slate-50 rounded-xl text-[12px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-950/20"
                  placeholder="CARI ANOMALI PELAPORAN..."
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">SENTINEL_ACTIVE</span>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  System Surveillance Nomimal &middot; {reports.meta.total} Entitas Terdeteksi
                </span>
              </div>
              <Pagination meta={reports.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Identitas Peserta', 'Rincian Transmisi', 'Indikasi Temuan', 'Risk Score', 'Opsi']}
            isEmpty={reports.data.length === 0}
            emptyText="Tidak ada indikasi risiko yang ditemukan."
          >
            {reports.data.map((r) => (
              <PremiumTableRow key={r.id} className={clsx("group", r.risk_level === 'HIGH' ? 'bg-rose-50/10' : '')}>
                <PremiumTableCell>
                  <div className="flex items-center gap-4 py-1">
                    <div className={clsx(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-black shadow-sm transition-all group-hover:scale-110",
                      r.risk_level === 'HIGH' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-gray-50 border border-emerald-50 text-emerald-950 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600'
                    )}>
                      {r.user_name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors">{r.user_name}</span>
                      <span className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest">{r.group_name}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-emerald-950 line-clamp-1 leading-none mb-1">{r.title}</span>
                    <div className="flex items-center gap-1.5 text-emerald-700/40">
                      <Clock size={10} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest tabular-nums">{r.submitted_at}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-wrap gap-2">
                    {r.risk_flags.length > 0 ? r.risk_flags.map((flag, idx) => (
                      <span key={idx} className="h-6 px-3 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center shadow-sm">
                        {flag.replace(/_/g, ' ')}
                      </span>
                    )) : (
                      <StatusTag status="active" label="PASSED" size="sm" />
                    )}
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <div className={clsx(
                    'h-11 w-11 inline-flex items-center justify-center rounded-2xl text-[12px] font-black border-2 transition-all shadow-sm tabular-nums', 
                    r.risk_score >= 70 ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200 rotate-6' : 
                    r.risk_score >= 30 ? 'bg-amber-50 border-amber-200 text-amber-600 border-amber-200 shadow-amber-50' : 
                    'bg-[#F8FAF9] border-emerald-50 text-emerald-950'
                  )}>
                    {r.risk_score}
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <button 
                    className="h-9 px-4 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase"
                  >
                    <Eye size={14} /> Audit
                  </button>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

      </div>
    </AppLayout>
  );
}
