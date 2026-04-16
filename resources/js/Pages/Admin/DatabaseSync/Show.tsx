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
  Globe
} from 'lucide-react';

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

  return (
    <AppLayout title={`Detail Log Sync #${log.id}`}>
      <Head title={`Audit Log: ${log.entity_type}`} />

      <div className="max-w-[1200px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <Link href="/admin/database-sync" className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-emerald-950 uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} strokeWidth={3} /> KEMBALI KE MONITORING
           </Link>
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-emerald-950 tracking-tighter leading-none">
                  Inspeksi <span className="text-emerald-500">Transmisi.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Audit detail paket transmisi data sinkronisasi sistem KKN dengan master node institusi UIN SAIZU.
                </p>
              </div>
              <div className="shrink-0">
                  <div className={clsx(
                    "h-16 px-8 border-2 rounded-[1.5rem] flex items-center gap-6 shadow-xl",
                    isSuccess ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-200" :
                    isFailed ? "bg-rose-600 border-rose-500 text-white shadow-rose-200" :
                    "bg-amber-500 border-amber-400 text-white shadow-amber-200"
                  )}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/80 uppercase tracking-widest leading-none mb-2">Status Node</span>
                      <span className="text-lg font-black text-white tabular-nums leading-none tracking-tight uppercase">
                        {log.status}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    {isSuccess ? <CheckCircle2 size={24} className="text-white drop-shadow-lg" /> : 
                     isFailed ? <XCircle size={24} className="text-white drop-shadow-lg" /> : 
                     <RefreshCw size={24} className="text-white animate-spin drop-shadow-lg" />}
                  </div>
              </div>
           </div>
        </div>

        {/* --- METADATA CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-50 shrink-0"><Database size={16} /></div>
                 <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase leading-none">Entitas Target</span>
              </div>
              <span className="text-xl font-black text-emerald-950 uppercase">{log.entity_type}</span>
              <span className="block text-[10px] font-black text-emerald-950 font-mono mt-1">ID: {log.entity_id || 'GLOBAL_SYNC'}</span>
           </div>
           
           <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-50 shrink-0"><Clock size={16} /></div>
                 <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase leading-none">Waktu Inisiasi</span>
              </div>
              <span className="text-sm font-black text-emerald-950 font-mono">{log.created_at}</span>
           </div>

           <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-50 shrink-0"><CheckCircle2 size={16} /></div>
                 <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase leading-none">Waktu Finalisasi</span>
              </div>
              <span className="text-sm font-black text-emerald-950 font-mono">{log.synced_at || 'PENDING'}</span>
           </div>

           <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-50 shrink-0"><User size={16} /></div>
                 <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase leading-none">Eksekutor</span>
              </div>
              <span className="text-sm font-black text-emerald-950 tracking-tight uppercase">{log.synced_by?.name || 'SYSTEM_DAEMON'}</span>
           </div>
        </div>

        {/* --- ERROR DETAILS (IF FAILED) --- */}
        {isFailed && (
           <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-rose-600 text-white rounded-[1.25rem] flex items-center justify-center border border-rose-500 shrink-0 shadow-lg shadow-rose-200">
                       <XCircle size={24} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-lg font-black text-rose-950 uppercase tracking-tight leading-none mb-2">Error Transmisi Ditemukan</h3>
                       <p className="text-[11px] font-bold text-rose-700 tracking-tight max-w-3xl leading-relaxed">
                         {log.error_message || 'Terjadi kesalahan sistem yang tidak diketahui saat melakukan sinkronisasi dengan master node.'}
                       </p>
                    </div>
                 </div>
                 <button 
                   onClick={handleRetry} 
                   className="shrink-0 h-12 w-full sm:w-auto px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-200 active:scale-95 flex items-center justify-center gap-3"
                 >
                   <RefreshCw size={14} /> JALANKAN ULANG
                 </button>
              </div>
           </div>
        )}

        {/* --- PAYLOAD INSPECTOR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <section className="bg-emerald-950 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative group/terminal">
              <div className="px-8 py-6 bg-emerald-900 border-b border-emerald-800 flex items-center gap-4">
                 <Terminal size={18} className="text-emerald-400" />
                 <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">REQUEST_PAYLOAD</h3>
              </div>
              <div className="p-8 bg-black/50 flex-1 overflow-x-auto min-h-[300px]">
                 <pre className="text-[12px] text-emerald-300 font-mono leading-relaxed">
                   {log.request_data ? JSON.stringify(log.request_data, null, 2) : '// No request payload recorded'}
                 </pre>
              </div>
           </section>

           <section className="bg-emerald-950 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative group/terminal">
              <div className="px-8 py-6 bg-emerald-900 border-b border-emerald-800 flex items-center gap-4">
                 <Terminal size={18} className="text-emerald-400" />
                 <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">RESPONSE_PAYLOAD</h3>
              </div>
              <div className="p-8 bg-black/50 flex-1 overflow-x-auto min-h-[300px]">
                 <pre className="text-[12px] text-emerald-300 font-mono leading-relaxed">
                   {log.response_data ? JSON.stringify(log.response_data, null, 2) : '// No response payload recorded'}
                 </pre>
              </div>
           </section>
        </div>

      </div>
    </AppLayout>
  );
}
