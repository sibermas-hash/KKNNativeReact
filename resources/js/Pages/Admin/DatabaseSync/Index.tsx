import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/UI';
import { clsx } from 'clsx';
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
  Filter,
  Check,
} from 'lucide-react';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableCell, PremiumTableRow } from '@/Components/Premium/PremiumTable';
import type { PaginationMeta } from '@/Components/UI/Pagination';

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
    pgsql: { status: string; latency_ms: number | null };
    redis: { status: string; latency_ms: number | null };
    timestamp: string;
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

export default function DatabaseSyncIndex({
  health,
  apiHealth,
  dashboard,
  logs,
  entityTypes,
  filters,
}: Props) {
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    router.get(
      '/admin/database-sync',
      { ...filters, [key]: value },
      { preserveState: true, replace: true },
    );
  };

  const handleManualSync = (type: string) => {
    setIsSyncing(type);
    router.post(
      '/admin/database-sync/manual',
      {
        entity_type: type,
        sync_mode: 'full',
      },
      {
        onFinish: () => setIsSyncing(null),
        preserveScroll: true,
      },
    );
  };

  const isHealthy = health.overall_status === 'healthy';

  const translateEntityType = (type: string) => {
    const map: Record<string, string> = {
      mahasiswa: 'Mahasiswa',
      dosen: 'Dosen',
      faculty: 'Fakultas',
      program: 'Program Studi',
      all: 'Semua Data',
    };
    return map[type.toLowerCase()] || type;
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
    <AppLayout title="Monitoring Database">
      <Head title="Monitoring Database" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="py-8 font-sans transition-all text-emerald-950">
        {/* HEADER SECTION */}
        <PageHeader
          title="Monitoring Database"
          subtitle="Pusat sinkronisasi data dari sistem utama UIN SAIZU untuk memastikan integritas data akademik."
          icon={Database}
          groupLabel="Operasional Sistem"
          stats={{
            label: 'Kondisi Sistem',
            value: isHealthy ? 'NORMAL' : 'GANGGUAN',
            icon: isHealthy ? CheckCircle2 : ShieldAlert,
          }}
        />

        {/* CONNECTION STATUS GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
          <StatCard
            icon={Database}
            label="Database Aplikasi"
            value={health.pgsql?.status === 'connected' ? 'AKTIF' : 'TERPUTUS'}
            variant={health.pgsql?.status === 'connected' ? 'success' : 'danger'}
            trend={health.pgsql?.latency_ms ? `${health.pgsql.latency_ms}ms` : undefined}
          />
          <StatCard
            icon={Server}
            label="API SIKAD Pusat"
            value={apiHealth.api_status === 'OK' ? 'AKTIF' : 'TERPUTUS'}
            variant={apiHealth.api_status === 'OK' ? 'success' : 'danger'}
            trend={
              apiHealth.timestamp
                ? new Date(apiHealth.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : undefined
            }
          />
          <StatCard
            icon={Cpu}
            label="Cache & Antrean"
            value={health.redis?.status === 'connected' ? 'AKTIF' : 'TERPUTUS'}
            variant={health.redis?.status === 'connected' ? 'success' : 'danger'}
            trend={health.redis?.latency_ms ? `${health.redis.latency_ms}ms` : undefined}
          />
          <StatCard
            icon={History}
            label="Sesi Sinkronisasi"
            value={`${dashboard.summary.total_today}`}
            variant="info"
            trend="Hari Ini"
          />
                </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (Actions) */}
          <div className="space-y-6 lg:col-span-1">
            <motion.div variants={itemVariants}>
<ContentPanel
              title="Perbarui Data Mandiri"
              description="Sinkronisasi manual dari sistem pusat."
              icon={Terminal}
            >
              <div className="space-y-4">
                <p className="text-xs text-emerald-800 leading-relaxed font-medium bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                  Gunakan kontrol di bawah untuk memaksa pembaruan data jika terjadi keterlambatan
                  sinkronisasi otomatis dari SIKAD.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {['Mahasiswa', 'Dosen', 'Faculty', 'Program'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleManualSync(type.toLowerCase())}
                      disabled={isSyncing !== null}
                      className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-emerald-100 text-emerald-950 shadow-sm transition-all rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                            isSyncing === type.toLowerCase()
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-50 border border-gray-100 text-emerald-800 group-hover:bg-white group-hover:border-emerald-200 group-hover:text-[#0d9488]',
                          )}
                        >
                          <RefreshCw
                            size={14}
                            className={clsx(
                              isSyncing === type.toLowerCase()
                                ? 'animate-spin'
                                : 'group-hover:rotate-180 transition-transform duration-700',
                            )}
                          />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Data {translateEntityType(type)}
                        </span>
                      </div>
                      {isSyncing === type.toLowerCase() ? (
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                          Proses...
                        </span>
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </ContentPanel>
</motion.div>

            <div className="bg-white rounded-2xl p-6 relative overflow-hidden shadow-sm border border-emerald-100">
              <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] rotate-12 pointer-events-none text-[#0d9488]">
                <Zap size={120} />
              </div>
              <div className="relative z-10 space-y-5">
                <div className="h-10 w-10 bg-[#f0fdfa] rounded-xl flex items-center justify-center border border-emerald-100">
                  <Activity size={20} className="text-[#0d9488]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-1">
                    Efisiensi Hari Ini
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums leading-none tracking-tight text-emerald-950">
                      {dashboard.summary.success_rate_today}%
                    </span>
                    <span className="text-xs font-bold text-[#0d9488] uppercase tracking-widest">
                      Berhasil
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-emerald-50 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800/60 block mb-1">
                      Total Sesi
                    </span>
                    <span className="text-sm font-bold tabular-nums text-emerald-950">
                      {dashboard.summary.total_today} Kali
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800/60 block mb-1">
                      Gagal
                    </span>
                    <span
                      className={clsx(
                        'text-sm font-bold tabular-nums',
                        dashboard.summary.failed_today > 0 ? 'text-rose-600' : 'text-emerald-950',
                      )}
                    >
                      {dashboard.summary.failed_today} Sesi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Logs) */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants}>
<ContentPanel
              title="Riwayat Pembaruan Data"
              description="Catatan terperinci aktivitas sinkronisasi hari ini."
              icon={History}
              padding={false}
              headerAction={
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <Filter
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none"
                    />
                    <select
                      value={filters.entity_type}
                      onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                      className="h-9 pl-9 pr-9 bg-gray-50 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-950 outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] shadow-sm appearance-none transition-colors cursor-pointer"
                    >
                      <option value="all">Semua Data</option>
                      {entityTypes.map((et) => (
                        <option key={et.entity_type} value={et.entity_type}>
                          {translateEntityType(et.entity_type)}
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-emerald-700 pointer-events-none group-hover:text-[#0d9488] transition-colors"
                    />
                  </div>
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total <strong className="text-emerald-950">{logs.meta.total}</strong> Catatan
                  </span>
                  <Pagination meta={logs.meta} />
                </div>
              }
            >
              <PremiumTable
                headers={['Jenis Data', 'Status', 'Keterangan', 'Aksi']}
                isEmpty={logs.data.length === 0}
                emptyText="Belum ada riwayat sinkronisasi untuk kriteria ini."
              >
                {logs.data.map((log) => (
                  <PremiumTableRow key={log.id} className="group">
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-950 uppercase text-xs mb-0.5 tracking-tight">
                          {translateEntityType(log.entity_type)}
                        </span>
                        <span className="text-xs text-emerald-700 font-mono tracking-wider">
                          ID: {log.entity_id || 'Global'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="center">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest border',
                          log.status === 'success'
                            ? 'bg-emerald-50 text-[#0d9488] border-emerald-200'
                            : log.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200',
                        )}
                      >
                        {log.status === 'success' ? <Check size={10} strokeWidth={3} /> : null}
                        {log.status === 'success'
                          ? 'BERHASIL'
                          : log.status === 'failed'
                            ? 'GAGAL'
                            : 'PROSES'}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col max-w-[200px] sm:max-w-xs">
                        <span className="text-xs text-emerald-900 font-medium line-clamp-1 leading-normal mb-1">
                          {log.error_message || 'Sinkronisasi berhasil diselesaikan tanpa kendala.'}
                        </span>
                        <span className="text-xs text-emerald-700 font-medium tabular-nums">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <Link
                        href={route('admin.database-sync.logs.show', log.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 text-emerald-700 bg-white hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        title="Lihat Detail Log"
                      >
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                      </Link>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
</motion.div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
