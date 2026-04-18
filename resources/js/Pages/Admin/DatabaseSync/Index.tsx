import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Activity,
  Server,
  Network,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Cpu,
  SearchCode,
  ArrowRight,
  ShieldAlert,
  Zap,
  History,
  Terminal,
  ChevronRight,
  ArrowUpRight,
  Search,
  Filter
} from 'lucide-react';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableCell, PremiumTableRow } from '@/Components/Premium/PremiumTable';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface SyncLog {
  id: number;
  entity_type: string;
  entity_id: string | null;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  created_at: string;
  synced_by?: { name: string } | null;
}

interface Props {
  health: { 
    overall_status: string; 
    kkn: { status: string; latency_ms: number | null }; 
    master: { status: string; latency_ms: number | null }; 
    redis: { status: string; latency_ms: number | null }; 
    timestamp: string 
  };
  apiHealth: { api_status: string; api_error: string | null; last_sync: any; timestamp: string };
  dashboard: { 
    today_stats: Record<string, any>;
    trends: any[];
    errors: any[];
    summary: { total_today: number; failed_today: number; success_rate_today: number };
  };
  logs: { data: SyncLog[]; meta: PaginationMeta };
  entityTypes: { entity_type: string; count: number }[];
  filters: { entity_type: string; period: string };
}

export default function DatabaseSyncIndex({ health, apiHealth, dashboard, logs, entityTypes, filters }: Props) {
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    router.get('/admin/database-sync', { ...filters, [key]: value }, { preserveState: true, replace: true });
  };

  const handleManualSync = (type: string) => {
    setIsSyncing(type);
    router.post('/admin/database-sync/manual', {
      entity_type: type,
      sync_mode: 'full'
    }, {
      onFinish: () => setIsSyncing(null),
      preserveScroll: true
    });
  };

  const isHealthy = health.overall_status === 'healthy';

  const translateEntityType = (type: string) => {
    const map: Record<string, string> = {
      'mahasiswa': 'Data Mahasiswa',
      'dosen': 'Data Dosen',
      'faculty': 'Data Fakultas',
      'program': 'Data Program Studi',
      'all': 'Semua Data'
    };
    return map[type.toLowerCase()] || type;
  };

  return (
    <AppLayout title="Monitoring Database">
      <Head title="Monitoring Database" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-all">
        
        {/* HEADER SECTION (Gold Standard Aligned) */}
        <PageHeader
          title="Monitoring Database"
          subtitle="Pusat sinkronisasi data dari sistem utama UIN SAIZU untuk memastikan integritas data akademik."
          icon={Database}
          groupLabel="Operasional Sistem"
          stats={{
            label: "Kondisi Sistem",
            value: isHealthy ? 'NORMAL' : 'GANGGUAN',
            icon: isHealthy ? CheckCircle2 : ShieldAlert
          }}
        />

        {/* CONNECTION STATUS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
          <StatCard 
            icon={HardDrive} 
            label="Data Aplikasi" 
            value={health.kkn.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            variant={health.kkn.status === 'connected' ? 'success' : 'danger'}
            trend={health.kkn.latency_ms ? `${health.kkn.latency_ms}ms` : undefined}
          />
          <StatCard 
            icon={Server} 
            label="Data Pusat (SIKAD)" 
            value={health.master.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            variant={health.master.status === 'connected' ? 'success' : 'danger'}
            trend={health.master.latency_ms ? `${health.master.latency_ms}ms` : undefined}
          />
          <StatCard 
            icon={Cpu} 
            label="Kecepatan Sistem" 
            value={health.redis.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            variant={health.redis.status === 'connected' ? 'success' : 'danger'}
            trend={health.redis.latency_ms ? `${health.redis.latency_ms}ms` : undefined}
          />
          <StatCard 
            icon={Network} 
            label="Layanan Koneksi" 
            value={apiHealth.api_status === 'OK' ? 'AKTIF' : 'NONAKTIF'} 
            variant={apiHealth.api_status === 'OK' ? 'success' : 'warning'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (Actions) */}
          <div className="space-y-6 lg:col-span-1">
            <ContentPanel
              title="Perbarui Data Mandiri"
              description="Sinkronisasi manual dari sistem pusat."
              icon={Terminal}
            >
              <div className="space-y-4">
                <p className="text-xs text-emerald-800 leading-relaxed font-medium bg-emerald-50/30 p-3 rounded-lg border border-emerald-50">
                  Gunakan kontrol di bawah untuk memaksa pembaruan data jika terjadi keterlambatan sinkronisasi otomatis.
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  {['Mahasiswa', 'Dosen', 'Faculty', 'Program'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => handleManualSync(type.toLowerCase())}
                      disabled={isSyncing !== null}
                      className="flex items-center justify-between px-4 py-3 bg-white hover:bg-[#1a7a4a] hover:text-white border border-emerald-50 text-emerald-950 shadow-sm transition-all rounded-xl group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw size={14} className={clsx(isSyncing === type.toLowerCase() ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                        <span className="text-xs font-bold uppercase tracking-wider">Segarkan {translateEntityType(type)}</span>
                      </div>
                      {isSyncing === type.toLowerCase() ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ChevronRight size={14} className="text-emerald-700/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </ContentPanel>

            <div className="bg-emerald-950 text-white rounded-xl p-6 relative overflow-hidden shadow-lg shadow-emerald-900/20">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Zap size={100} />
              </div>
              <div className="relative z-10 space-y-4">
               <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <Activity size={20} className="text-emerald-400" />
               </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Efisiensi Hari Ini</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold tabular-nums leading-none">{dashboard.summary.success_rate_today}%</span>
                    <span className="text-xs font-medium text-emerald-400 mb-1 uppercase tracking-wider">Suksestrate</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Total Sesi</span>
                    <span className="text-sm font-bold tabular-nums">{dashboard.summary.total_today} Kali</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Gagal</span>
                    <span className={clsx("text-sm font-bold tabular-nums", dashboard.summary.failed_today > 0 ? "text-rose-400" : "text-emerald-400")}>
                      {dashboard.summary.failed_today} Sesi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Logs) */}
          <div className="lg:col-span-2">
            <ContentPanel
              title="Riwayat Pembaruan Data"
              description="Catatan terperinci aktivitas sinkronisasi."
              icon={History}
              padding={false}
              headerAction={
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-800" />
                    <select 
                      value={filters.entity_type} 
                      onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                      className="h-8 pl-8 pr-8 bg-white border border-emerald-100 rounded-lg text-xs font-semibold text-emerald-950 outline-none focus:border-emerald-500 shadow-sm appearance-none"
                    >
                      <option value="all">Semua Jenis Data</option>
                      {entityTypes.map(et => (
                        <option key={et.entity_type} value={et.entity_type}>
                          {translateEntityType(et.entity_type)}
                        </option>
                      ))}
                    </select>
                    <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-emerald-800 pointer-events-none" />
                  </div>
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800">
                    Menampilkan <strong className="text-emerald-950">{logs.data.length}</strong> dari <strong className="text-emerald-950">{logs.meta.total}</strong> log
                  </span>
                  <Pagination meta={logs.meta} />
                </div>
              }
            >
              <PremiumTable
                headers={['Jenis Data', 'Status', 'Keterangan', 'Aksi']}
                isEmpty={logs.data.length === 0}
                emptyText="Belum ada riwayat sinkronisasi untuk periode ini."
              >
                {logs.data.map((log) => (
                  <PremiumTableRow key={log.id} className="group">
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-950 uppercase text-[11px] mb-1">{translateEntityType(log.entity_type)}</span>
                        <span className="text-[10px] text-emerald-800/60 font-mono tracking-wider italic">ID: {log.entity_id || '-'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="center">
                      <span className={clsx(
                        "inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                        log.status === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                        log.status === 'failed' ? "bg-rose-50 text-rose-700 border-rose-200" : 
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {log.status === 'success' ? 'BERHASIL' : log.status === 'failed' ? 'GAGAL' : 'PROSES'}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col max-w-[200px] sm:max-w-xs">
                        <span className="text-xs text-emerald-900 font-medium line-clamp-1 leading-normal mb-1">
                          {log.error_message || 'Sinkronisasi berhasil diselesaikan.'}
                        </span>
                        <span className="text-[9px] text-emerald-800/50 font-bold uppercase tabular-nums tracking-wider">{log.created_at}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <Link 
                        href={route('admin.database-sync.show', log.id)} 
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 text-emerald-700 bg-white hover:bg-emerald-700 hover:text-white hover:border-emerald-700 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        title="Lihat Detail Log"
                      >
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                      </Link>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
