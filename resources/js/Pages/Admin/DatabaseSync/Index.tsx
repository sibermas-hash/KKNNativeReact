import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
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
  ArrowUpRight
} from 'lucide-react';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { Button } from '@/Components/ui';

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-all">
        
        {/* HEADER SECTION (Gold Standard) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-gray-200/50 pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Monitoring Database.</h1>
            <p className="text-xs text-gray-900/40 font-black uppercase tracking-widest">
              Pusat sinkronisasi data dari sistem utama UIN SAIZU
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={clsx(
               "px-4 py-2 bg-white border rounded-lg flex items-center gap-3",
               isHealthy ? "border-gray-200" : "border-rose-100"
             )}>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-900/20 uppercase tracking-widest mb-0.5">Kondisi Sistem</span>
                  <span className={clsx("text-xs font-black uppercase leading-none", isHealthy ? "text-[#1a7a4a]" : "text-rose-600")}>
                    {isHealthy ? 'Normal' : 'Gangguan'}
                  </span>
                </div>
                {isHealthy ? <CheckCircle2 size={18} className="text-[#1a7a4a] opacity-40 ml-1" /> : <ShieldAlert size={18} className="text-rose-500 opacity-40 ml-1" />}
             </div>
          </div>
        </div>

        {/* CONNECTION STATUS GRID (MiniStats) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MiniStat 
            icon={HardDrive} 
            label="Data Aplikasi" 
            value={health.kkn.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            ping={health.kkn.latency_ms} 
          />
          <MiniStat 
            icon={Server} 
            label="Data Pusat (SIKAD)" 
            value={health.master.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            ping={health.master.latency_ms} 
          />
          <MiniStat 
            icon={Cpu} 
            label="Kecepatan Sistem" 
            value={health.redis.status === 'connected' ? 'AKTIF' : 'TERPUTUS'} 
            ping={health.redis.latency_ms} 
          />
          <MiniStat 
            icon={Network} 
            label="Layanan Koneksi" 
            value={apiHealth.api_status === 'OK' ? 'AKTIF' : 'NONAKTIF'} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (Actions) */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Terminal size={16} className="text-[#1a7a4a]" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Perbarui Data Mandiri</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-gray-900/50 leading-relaxed font-medium">
                  Gunakan tombol di bawah untuk menyegarkan data langsung dari sistem pusat jika ada perubahan terbaru di SIKAD.
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  {['Mahasiswa', 'Dosen', 'Faculty', 'Program'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => handleManualSync(type.toLowerCase())}
                      disabled={isSyncing !== null}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-[#16a34a] hover:text-white border border-gray-200 text-gray-900 transition-all rounded-xl group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw size={14} className={clsx(isSyncing === type.toLowerCase() ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                        <span className="text-xs font-black uppercase tracking-widest">Segarkan {translateEntityType(type)}</span>
                      </div>
                      {isSyncing === type.toLowerCase() ? (
                        <RefreshCw size={14} className="animate-spin text-gray-600" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-emerald-950 text-white rounded-xl p-6 relative overflow-hidden shadow-lg shadow-emerald-900/20">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Zap size={100} />
              </div>
              <div className="relative z-10 space-y-4">
               <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Activity size={18} className="text-gray-600" />
               </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#1a7a4a]">Statistik Hari Ini</h4>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold tabular-nums leading-none">{dashboard.summary.success_rate_today}%</span>
                    <span className="text-xs font-black uppercase tracking-widest text-[#1a7a4a] mb-1">Berhasil</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Pembaruan</span>
                    <span className="text-sm font-bold tabular-nums">{dashboard.summary.total_today} Kali</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Gagal</span>
                    <span className={clsx("text-sm font-bold tabular-nums", dashboard.summary.failed_today > 0 ? "text-rose-400" : "text-[#1a7a4a]")}>
                      {dashboard.summary.failed_today} Sesi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Logs) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-6 py-4 border-b border-[#f3f4f6]/50 bg-emerald-50/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#1a7a4a]" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Riwayat Pembaruan Data</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={filters.entity_type} 
                    onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                    className="h-8 px-3 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-gray-900 uppercase tracking-widest outline-none focus:border-[#f3f4f6]0 shadow-sm"
                  >
                    <option value="all">Semua Data</option>
                    {entityTypes.map(et => (
                      <option key={et.entity_type} value={et.entity_type}>
                        {translateEntityType(et.entity_type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/20 border-b border-gray-200/50">
                      <th className="px-8 py-4 text-xs font-black text-gray-900 uppercase tracking-widest">Jenis Data & Kode</th>
                      <th className="px-8 py-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center">Hasil</th>
                      <th className="px-8 py-4 text-xs font-black text-gray-900 uppercase tracking-widest">Keterangan Perubahan</th>
                      <th className="px-8 py-4 text-xs font-black text-gray-900 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]/60">
                    {logs.data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-32 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-20">
                             <SearchCode size={40} className="text-gray-900" />
                             <span className="text-xs font-black uppercase tracking-widest">Data Sinkronisasi Bersih</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.data.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/20 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 uppercase leading-none mb-1.5">{translateEntityType(log.entity_type)}</span>
                              <span className="text-xs text-gray-900/40 font-black tabular-nums tracking-widest uppercase leading-none">ID: {log.entity_id || '-'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={clsx(
                              "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase border transition-all",
                              log.status === 'success' ? "bg-[#e8f5ee] text-[#1a7a4a] border-emerald-200" : 
                              log.status === 'failed' ? "bg-rose-50 text-rose-600 border-rose-200" : 
                              "bg-amber-50 text-amber-600 border-amber-200"
                            )}>
                              {log.status === 'success' ? 'Berhasil' : log.status === 'failed' ? 'Gagal' : 'Proses'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col max-w-xs">
                              <span className="text-xs font-bold text-gray-900/70 line-clamp-1 leading-normal">
                                {log.error_message || 'Data berhasil disinkronkan tanpa kendala.'}
                              </span>
                              <span className="text-[9px] text-gray-900/30 font-black uppercase tabular-nums tracking-wider mt-1.5">{log.created_at}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <Link 
                                href={route('admin.database-sync.show', log.id)} 
                                className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-[#1a7a4a] hover:bg-[#16a34a] hover:text-white transition-all ml-auto opacity-0 group-hover:opacity-100"
                              >
                               <ArrowUpRight size={14} />
                             </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-8 py-4 border-t border-[#f3f4f6]/50 bg-emerald-50/10 flex items-center justify-between">
                <span className="text-xs font-black text-gray-900/20 uppercase tracking-widest leading-none">
                  Catatan Sistem | Total {logs.meta.total} Sesi Log Terdaftar
                </span>
                <Pagination meta={logs.meta} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value, ping }: { icon: any, label: string, value: string, ping?: number | null }) {
  const isOk = value === 'AKTIF';
  
  return (
    <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl flex items-center gap-4 transition-all hover:border-emerald-300 group">
      <div className={clsx(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6",
        isOk ? "bg-[#e8f5ee] text-[#1a7a4a]" : "bg-rose-50 text-rose-600"
      )}>
        <Icon size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black text-gray-900/30 uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <div className="flex items-center gap-2 mb-1">
           <span className={clsx(
             "h-1.5 w-1.5 rounded-full",
             isOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
           )} />
           <span className={clsx("text-sm font-black tabular-nums leading-none uppercase", isOk ? "text-gray-900" : "text-rose-600")}>
             {value}
           </span>
        </div>
        {ping !== undefined && (
          <span className="text-[8px] font-black text-gray-900/20 uppercase tracking-tighter">Ping: {ping ? `${ping}ms` : 'N/A'}</span>
        )}
      </div>
    </div>
  );
}
