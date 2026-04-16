import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import {
  Database,
  Activity,
  Server,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Cpu,
  SearchCode,
  ArrowRight,
  HardDrive,
  ShieldAlert,
  Zap
} from 'lucide-react';
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
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    router.get('/admin/database-sync', { ...filters, [key]: value }, { preserveState: true, replace: true });
  };

  const handleManualSync = (type: string) => {
    setIsSyncing(true);
    router.post('/admin/database-sync/manual', {
      entity_type: type,
      sync_mode: 'full'
    }, {
      onFinish: () => setIsSyncing(false),
      preserveScroll: true
    });
  };

  const isHealthy = health.overall_status === 'healthy';

  return (
    <AppLayout title="Audit & Sinkronisasi Database">
      <Head title="Monitoring Database" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <Database size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-800">Infrastruktur & Integritas Data</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Database <span className="text-emerald-600">Sync.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Pemantauan latensi dan sinkronisasi data master UIN SAIZU secara real-time. Kelola lalu lintas pertukaran data untuk menjamin konsistensi pada sistem KKN.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-4">
                  <div className={clsx(
                    "h-20 px-8 border-2 rounded-[2rem] flex items-center gap-6 shadow-sm transition-all",
                    isHealthy ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100/50" : "bg-rose-50 border-rose-100 text-rose-600 shadow-rose-100/50"
                  )}>
                    <div className="flex flex-col">
                      <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest leading-none mb-2",
                        isHealthy ? "text-emerald-800" : "text-rose-800"
                      )}>Sistem Induk</span>
                      <span className={clsx(
                        "text-xl font-black tabular-nums leading-none tracking-tight uppercase",
                        isHealthy ? "text-emerald-950" : "text-rose-950"
                      )}>
                        {health.overall_status}
                      </span>
                    </div>
                    <div className={clsx(
                      "w-px h-10",
                      isHealthy ? "bg-emerald-200" : "bg-rose-200"
                    )} />
                    {isHealthy ? <CheckCircle2 size={28} className="text-emerald-600" /> : <ShieldAlert size={28} className="text-rose-600" />}
                  </div>
              </div>
           </div>
        </div>

        {/* --- CONNECTION STATUS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatusCard label="KKN Local Database" status={health.kkn.status} latency={health.kkn.latency_ms} icon={HardDrive} />
           <StatusCard label="Master Database" status={health.master.status} latency={health.master.latency_ms} icon={Server} />
           <StatusCard label="Redis Cache Engine" status={health.redis.status} latency={health.redis.latency_ms} icon={Cpu} />
           <StatusCard label="API Master SIKKKN" status={apiHealth.api_status} latency={null} icon={Network} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* --- LEFT COL: SYNC METRICS --- */}
           <div className="space-y-8 lg:col-span-1">
              <section className="bg-white border-2 border-emerald-100 rounded-[3rem] p-8 text-emerald-950 shadow-sm relative overflow-hidden group/metrics tracking-tight">
                 <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover/metrics:rotate-45 transition-transform duration-1000"><Activity size={150} className="text-emerald-600" /></div>
                 <div className="flex items-center gap-4 relative z-10 mb-8">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm"><RefreshCw size={20} className={clsx(isSyncing && "animate-spin")} /></div>
                    <div className="flex flex-col text-emerald-950">
                        <span className="text-xl font-black uppercase tracking-tight leading-none">Aktivitas Hari Ini</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Total Transmisi Sinkronisasi</span>
                    </div>
                 </div>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Akurasi Validasi</span>
                       <span className="text-2xl font-black tabular-nums text-emerald-600">{dashboard.summary.success_rate_today}%</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                       <div className="h-full bg-emerald-600" style={{ width: `${dashboard.summary.success_rate_today}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 shadow-xs">
                          <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">BERHASIL</span>
                          <span className="text-xl font-black tabular-nums text-emerald-600">{dashboard.summary.total_today - dashboard.summary.failed_today}</span>
                       </div>
                       <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 shadow-xs">
                          <span className="block text-[9px] font-black text-rose-800 uppercase tracking-widest mb-1">GAGAL</span>
                          <span className="text-xl font-black tabular-nums text-rose-600">{dashboard.summary.failed_today}</span>
                       </div>
                    </div>
                 </div>
              </section>

              {/* MANUAL TRIGGER */}
              <section className="bg-white border-2 border-emerald-50 rounded-[2.5rem] p-8 shadow-sm">
                 <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest mb-6">Operasi Manual</h3>
                 <div className="space-y-3">
                   {['mahasiswa', 'dosen'].map((type) => (
                     <button
                       key={type}
                       onClick={() => handleManualSync(type)}
                       disabled={isSyncing}
                       className="w-full h-14 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-2 border-emerald-100 hover:border-emerald-600 rounded-2xl flex items-center justify-between px-6 transition-all text-[10px] font-black uppercase tracking-widest group disabled:opacity-50"
                     >
                       <span>SYNC {type} GLOBAL</span>
                       <Zap size={14} className="group-hover:animate-pulse" />
                     </button>
                   ))}
                 </div>
              </section>
           </div>

           {/* --- RIGHT COL: LOGS DATA TABLE --- */}
           <div className="lg:col-span-2">
              <section className="bg-white border-2 border-emerald-50 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full">
                 <div className="px-10 py-8 bg-emerald-50/20 border-b-2 border-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 bg-white rounded-[1.25rem] border-2 border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                          <History size={24} strokeWidth={2.5} />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1">Transmisi Terakhir</h3>
                          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Riwayat Logging Sinkronisasi</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-4 w-full sm:w-auto">
                       <select 
                         value={filters.entity_type} 
                         onChange={e => handleFilterChange('entity_type', e.target.value)}
                         className="h-12 px-5 bg-white border-2 border-emerald-50 rounded-xl text-[10px] font-black text-emerald-950 uppercase tracking-widest focus:border-emerald-500 outline-none shadow-sm"
                       >
                          <option value="all">SEMUA ENTITAS</option>
                          <option value="mahasiswa">MAHASISWA</option>
                          <option value="dosen">DOSEN</option>
                       </select>
                       <select 
                         value={filters.period} 
                         onChange={e => handleFilterChange('period', e.target.value)}
                         className="h-12 px-5 bg-white border-2 border-emerald-50 rounded-xl text-[10px] font-black text-emerald-950 uppercase tracking-widest focus:border-emerald-500 outline-none shadow-sm"
                       >
                          <option value="1">1 HARI</option>
                          <option value="7">7 HARI</option>
                          <option value="30">30 HARI</option>
                       </select>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                   <table className="min-w-full text-left whitespace-nowrap">
                     <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                       <tr>
                         <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Log ID / Entitas</th>
                         <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Status</th>
                         <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest">Catatan Sistem</th>
                         <th className="px-8 py-5 text-right text-[9px] font-black uppercase tracking-widest">Detail</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-emerald-50">
                       {logs.data.length === 0 ? (
                         <tr>
                            <td colSpan={4} className="py-24 text-center">
                               <div className="flex flex-col items-center justify-center gap-4">
                                 <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-200">
                                   <SearchCode size={32} />
                                 </div>
                                 <span className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Data Transmisi Nihil</span>
                               </div>
                            </td>
                         </tr>
                       ) : logs.data.map(log => (
                         <tr key={log.id} className="group hover:bg-emerald-50/30 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex flex-col gap-1.5">
                                  <span className="text-[12px] font-black text-emerald-950 uppercase tracking-tight">{log.entity_type}</span>
                                  <span className="text-[10px] font-black text-emerald-700 font-mono tracking-tighter">#{log.id.toString().padStart(6, '0')}</span>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                               <div className={clsx(
                                  "inline-flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm",
                                  log.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                                  log.status === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                               )}>
                                  {log.status}
                               </div>
                            </td>
                            <td className="px-6 py-6 scrollbar-hide max-w-[200px]">
                               <p className="text-[10px] font-bold text-emerald-800 truncate uppercase mt-1">
                                  {log.error_message || 'Sinkronisasi berhasil tanpa hambatan.'}
                               </p>
                               <span className="text-[9px] font-black text-emerald-600 font-mono tracking-widest mt-1.5 block opacity-60">{log.created_at}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Link href={`/admin/database-sync/logs/${log.id}`} className="h-9 px-4 inline-flex items-center gap-2 bg-white border-2 border-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm group-hover:border-emerald-200">
                                  AUDIT <ArrowRight size={12} />
                               </Link>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 <div className="px-8 py-6 bg-emerald-50/30 border-t-2 border-emerald-50 mt-auto flex justify-between items-center">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                       Hal. {logs.meta.current_page} Dari {logs.meta.last_page}
                    </span>
                    <Pagination meta={logs.meta} />
                 </div>
              </section>
           </div>
        </div>

      </div>
    </AppLayout>
  );
}

function StatusCard({ label, status, latency, icon: Icon }: { label: string, status: string, latency: number | null, icon: any }) {
  const isOk = status.toLowerCase() === 'connected' || status.toLowerCase() === 'up';

  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className="flex items-center justify-between relative z-10">
        <div className={clsx(
           "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform shadow-sm group-hover:scale-110",
           isOk ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-500"
        )}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className={clsx(
           "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2",
           isOk ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-500"
        )}>
          {status}
        </div>
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[12px] font-black text-emerald-950 uppercase tracking-tight mb-2 leading-none">{label}</span>
        {latency !== null && (
          <span className="text-[10px] font-black text-emerald-700 font-mono tracking-widest uppercase">Latensi: {latency}ms</span>
        )}
      </div>
    </div>
  );
}
