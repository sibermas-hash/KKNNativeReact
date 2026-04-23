import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
  History,
  Search,
  User,
  Activity,
  Eye,
  ShieldCheck,
  Zap,
  Cpu,
  Binary,
  ShieldAlert,
  Terminal,
  LayoutGrid,
  Filter,
  RefreshCw
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

interface AuditLog {
  id: number;
  description: string;
  subject_type: string | null;
  user?: { name: string; email: string };
  severity: 'low' | 'medium' | 'high';
  action: string;
  ip_address?: string;
  created_at: string;
}

interface Props {
  logs: { data: AuditLog[]; meta: PaginationMeta };
  filters: { search?: string };
  stats: { total: number; high_risk: number; unique_users: number; today_logs: number };
}

export default function AuditLogIndex({ logs, filters, stats }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('admin.audit-log.index'), { search }, { preserveState: true });
  };

  return (
    <AppLayout title="Audit Log Sistem">
      <Head title="Audit Log Intelijen | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Intelijen Sistem."
          subtitle="Audit jejak aktivitas sistem secara immutable dan pemantauan anomali intervensi data."
          icon={History}
          groupLabel="Chronological Integrity Audit"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Populasi Log" value={stats.total} icon={Terminal} variant="success" />
          <StatCard label="Risiko Tinggi" value={stats.high_risk} icon={ShieldAlert} variant={stats.high_risk > 0 ? 'error' : 'info'} />
          <StatCard label="Aktor Aktif" value={stats.unique_users} icon={User} variant="gray" />
          <StatCard label="Kernel State" value="STABIL" icon={Cpu} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <ContentPanel
          title="Chronological Audit Stream"
          description="Aliran aktivitas real-time yang mencatat setiap perubahan dan interaksi dalam infrastruktur sistem."
          icon={LayoutGrid}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative group min-w-[350px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 border-2 border-slate-50 rounded-xl text-[12px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-950/20"
                  placeholder="CARI IDENTIFIER, AKSI, ATAU AKTOR..."
                />
              </form>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">STREAM_LIVE</span>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  Transmission Stage {logs.meta.current_page} OF {logs.meta.last_page} &middot; {stats.total} Logs Terdaftar
                </span>
              </div>
              <Pagination meta={logs.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Node ID', 'Deskripsi Aktivitas', 'Otoritas Aktor', 'Subjek Event', 'Opsi']}
            isEmpty={logs.data.length === 0}
            emptyText="Tidak ada aliran transmisi log yang ditemukan."
          >
            {logs.data.map((log) => (
              <PremiumTableRow key={log.id} className={clsx("group", log.severity === 'high' ? 'bg-rose-50/10' : log.severity === 'medium' ? 'bg-amber-50/5' : '')}>
                <PremiumTableCell>
                  <span className="text-[10px] font-black text-emerald-700/40 font-mono tracking-tighter uppercase group-hover:text-emerald-600 transition-colors">#{log.id.toString().padStart(6, '0')}</span>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex items-center gap-4 py-1">
                    <div className={clsx(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:rotate-6 shrink-0",
                      log.severity === 'high' ? 'bg-rose-600 text-white shadow-rose-200' : 
                      log.severity === 'medium' ? 'bg-amber-500 text-white shadow-amber-200' : 
                      'bg-gray-50 border border-emerald-50 text-emerald-950 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600'
                    )}>
                      {log.severity === 'high' ? <ShieldAlert size={18} strokeWidth={2.5} /> : <Activity size={18} strokeWidth={2.5} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] font-bold text-emerald-950 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-1">{log.description}</span>
                      <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest",
                        log.severity === 'high' ? 'text-rose-600' : log.severity === 'medium' ? 'text-amber-600' : 'text-emerald-600/50'
                      )}>{log.action}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">{log.user?.name || 'SYSTEM_DAEMON'}</span>
                    <span className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest">AUTHORIZED_ACTOR</span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAF9] border border-emerald-50 rounded-lg">
                    <Binary size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">
                      {log.subject_type?.split('\\').pop() || 'STATIC_EVENT'}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] font-black text-emerald-700/40 font-mono tabular-nums mr-2">{log.created_at}</span>
                    <Link 
                      href={route('admin.audit-log.show', log.id)}
                      className="h-9 px-4 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                    >
                      <Eye size={14} /> Inspect
                    </Link>
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
