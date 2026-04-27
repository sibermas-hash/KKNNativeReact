import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { clsx } from 'clsx';
import {
  Database,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  User,
  ShieldCheck,
  Zap,
  Globe,
  Code2,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';

interface SyncLog {
  id: number;
  entity_type: string;
  entity_id: string | null;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  created_at: string;
  synced_at: string | null;
  request_data: any;
  response_data: any;
  synced_by?: { name: string } | null;
}

interface Props {
  log: SyncLog;
}

export default function DatabaseSyncShow({ log }: Props) {
  const isFailed = log.status === 'failed';
  const isSuccess = log.status === 'success';

  const handleRetry = () => {
    router.post(`/admin/database-sync/retry/${log.id}`);
  };

  const translateEntityType = (type: string) => {
    const map: Record<string, string> = {
      mahasiswa: 'Data Mahasiswa',
      dosen: 'Data Dosen',
      faculty: 'Data Fakultas',
      program: 'Data Program Studi',
      all: 'Semua Data',
    };
    return map[type.toLowerCase()] || type;
  };

  return (
    <AppLayout title={`Detail Log Sync #${log.id}`}>
      <Head title={`Audit Log: ${log.entity_type}`} />

      <div className="py-8 font-sans transition-all">
        <div className="mb-6">
          <Link
            href="/admin/database-sync"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Kembali ke Monitoring
          </Link>
        </div>

        {/* HEADER SECTION */}
        <PageHeader
          title="Inspeksi Transmisi"
          subtitle="Audit detail paket transmisi data sinkronisasi sistem KKN dengan master node institusi UIN SAIZU."
          icon={Activity}
          groupLabel="Audit Log Sistem"
        >
          <div className="flex items-center gap-3 bg-white border border-emerald-50 p-2 rounded-xl shadow-sm">
            <span className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest ml-2">
              Status Node
            </span>
            <StatusTag status={log.status} size="lg" />
          </div>
        </PageHeader>

        {/* METADATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
          <StatCard
            icon={Database}
            label="Entitas Target"
            value={translateEntityType(log.entity_type)}
            trend={log.entity_id ? `ID: ${log.entity_id}` : 'GLOBAL_SYNC'}
          />
          <StatCard icon={Clock} label="Waktu Inisiasi" value={log.created_at} />
          <StatCard
            icon={CheckCircle2}
            label="Waktu Finalisasi"
            value={log.synced_at || 'PENDING'}
            variant={log.synced_at ? 'success' : 'warning'}
          />
          <StatCard icon={User} label="Eksekutor" value={log.synced_by?.name || 'SYSTEM_DAEMON'} />
        </div>

        {/* ERROR MESSAGE PANEL */}
        {isFailed && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertCircle size={120} className="text-rose-900" />
              </div>

              <div className="flex items-start gap-5 relative z-10">
                <div className="h-12 w-12 bg-rose-600 text-white rounded-xl flex items-center justify-center border border-rose-500 shrink-0 shadow-lg shadow-rose-200">
                  <XCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider mb-1">
                    Kegagalan Transmisi Terdeteksi
                  </h3>
                  <p className="text-xs font-bold text-rose-800 leading-relaxed max-w-2xl bg-white/50 p-3 rounded-lg border border-rose-100">
                    {log.error_message ||
                      'Terjadi kesalahan sistem yang tidak diketahui saat melakukan sinkronisasi.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRetry}
                className="shrink-0 h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-200 active:scale-95 flex items-center justify-center gap-3 relative z-10"
              >
                <RefreshCw size={14} /> Jalankan Ulang
              </button>
            </div>
          </div>
        )}

        {/* PAYLOAD INSPECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContentPanel
            title="Request Payload"
            description="Data yang dikirimkan ke server pusat."
            icon={Terminal}
            padding={false}
          >
            <div className="bg-[#1e1e1e] p-6 min-h-[400px] overflow-auto rounded-b-xl border-t border-emerald-950/20">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed selection:bg-emerald-500/30 selection:text-white">
                {log.request_data
                  ? JSON.stringify(log.request_data, null, 2)
                  : '// Tidak ada data request yang tercatat'}
              </pre>
            </div>
          </ContentPanel>

          <ContentPanel
            title="Response Payload"
            description="Balasan data dari server pusat."
            icon={Code2}
            padding={false}
          >
            <div className="bg-[#1e1e1e] p-6 min-h-[400px] overflow-auto rounded-b-xl border-t border-emerald-950/20">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed selection:bg-emerald-500/30 selection:text-white">
                {log.response_data
                  ? JSON.stringify(log.response_data, null, 2)
                  : '// Tidak ada data response yang tercatat'}
              </pre>
            </div>
          </ContentPanel>
        </div>
      </div>
    </AppLayout>
  );
}
