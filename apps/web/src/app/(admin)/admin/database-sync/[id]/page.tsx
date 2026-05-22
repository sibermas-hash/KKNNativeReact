'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, CheckCircle2, XCircle, Clock, Terminal, RefreshCw, User, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/shared';

const ENTITY_LABELS: Record<string, string> = {
  mahasiswa: 'Data Mahasiswa',
  dosen: 'Data Dosen',
  faculty: 'Data Fakultas',
  program: 'Data Program Studi',
  all: 'Semua Data',
};

export default function DatabaseSyncDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'database-sync', id],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        databaseSync: { show: (id: number) => Promise<unknown> };
      }).databaseSync.show(Number(id));
      return (res as { data?: unknown }).data ?? res;
    },
    enabled: !!id,
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      return (adminApi as unknown as {
        databaseSync: { retry: (id: number) => Promise<unknown> };
      }).databaseSync.retry(Number(id));
    },
    onSuccess: () => router.push('/admin/database-sync'),
  });

  const log = data as {
    status?: string;
    entity_type?: string;
    entity_id?: string | null;
    created_at?: string;
    synced_at?: string | null;
    error_message?: string | null;
    request_data?: unknown;
    response_data?: unknown;
    synced_by?: { name?: string } | null;
  } | null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  if (!log) return <div className="text-center py-20 text-slate-500">Log tidak ditemukan</div>;

  const isFailed = log.status === 'failed';
  const isSuccess = log.status === 'success';
  const entityType = String(log.entity_type ?? '');
  const syncedBy = log.synced_by;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/database-sync" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isSuccess ? 'bg-emerald-600' : isFailed ? 'bg-rose-600' : 'bg-amber-500'}`}>
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {ENTITY_LABELS[entityType.toLowerCase()] ?? entityType}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={log.status ?? 'pending'} />
              <span className="text-xs text-slate-400">{log.created_at ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status Banner */}
          <div className={`rounded-2xl p-5 flex items-start gap-4 ${isSuccess ? 'bg-emerald-50 border border-emerald-100' : isFailed ? 'bg-rose-50 border border-rose-100' : 'bg-amber-50 border border-amber-100'}`}>
            {isSuccess ? <CheckCircle2 size={24} className="text-emerald-600 shrink-0" /> : isFailed ? <XCircle size={24} className="text-rose-600 shrink-0" /> : <Clock size={24} className="text-amber-600 shrink-0" />}
            <div>
              <p className={`text-sm font-black ${isSuccess ? 'text-emerald-800' : isFailed ? 'text-rose-800' : 'text-amber-800'}`}>
                {isSuccess ? 'Sinkronisasi Berhasil' : isFailed ? 'Sinkronisasi Gagal' : 'Sedang Diproses'}
              </p>
              {!!log.synced_at && <p className="text-xs text-slate-500 mt-0.5">Selesai: {log.synced_at}</p>}
            </div>
          </div>

          {/* Error Message */}
          {isFailed && !!log.error_message && (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Pesan Error
              </h2>
              <pre className="text-xs text-rose-700 bg-rose-50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                {log.error_message as string}
              </pre>
            </div>
          )}

          {/* Request Data */}
          {!!log.request_data && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} /> Data Request
              </h2>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto font-mono max-h-48">
                {JSON.stringify(log.request_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Data */}
          {!!log.response_data && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} /> Data Response
              </h2>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto font-mono max-h-48">
                {JSON.stringify(log.response_data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Entitas</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{ENTITY_LABELS[entityType.toLowerCase()] ?? entityType}</p>
              </div>
              {log.entity_id && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity ID</p>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">{log.entity_id}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibuat</p>
                <p className="text-sm text-slate-700 mt-0.5">{log.created_at ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Synced By */}
          {syncedBy && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> Disinkronkan Oleh
              </h2>
              <p className="text-sm font-bold text-slate-900">{syncedBy?.name ?? '-'}</p>
            </div>
          )}

          {/* Retry */}
          {isFailed && (
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-60 shadow-lg shadow-rose-200"
            >
              {retryMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw size={14} />
              )}
              Coba Ulang Sinkronisasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
