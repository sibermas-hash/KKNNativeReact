'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Activity, AlertTriangle, CheckCircle2, Database, HardDrive, Mail, PlayCircle, RefreshCw, Server, Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { useState } from 'react';

type HealthCheck = {
  status: boolean;
  latency_ms?: number;
  error?: string;
  [key: string]: unknown;
};

type OverviewData = {
  health: {
    status: 'healthy' | 'degraded';
    timestamp: string;
    version: string;
    environment: string;
    checks: Record<string, HealthCheck>;
  };
  queue: {
    pending_jobs: number;
    failed_jobs: number;
  };
  telegram: {
    configured: boolean;
    last_heartbeat: string | null;
    recent_alerts: Record<string, string>;
  };
  server: {
    hostname: string;
    php_version: string;
    app_version: string;
    environment: string;
  };
};

type AlertEntry = {
  component: string;
  type: string;
  severity: string;
  last_sent_at: string;
  source: string;
  details?: string;
  uuid?: string;
};

export default function MonitoringDashboardPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const overviewQuery = useQuery({
    queryKey: ['admin', 'monitoring', 'overview'],
    queryFn: async () => {
      const res = await adminApi.monitoring.overview();
      return res as unknown as OverviewData;
    },
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const alertsQuery = useQuery({
    queryKey: ['admin', 'monitoring', 'alerts'],
    queryFn: async () => {
      const res = await adminApi.monitoring.alerts();
      return (res as unknown as AlertEntry[]) ?? [];
    },
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const triggerMutation = useMutation({
    mutationFn: () => adminApi.monitoring.triggerCheck(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring'] });
      toast.success('Health check berhasil dijalankan');
    },
    onError: () => {
      toast.error('Health check gagal — cek Telegram / log server');
    },
  });

  const data = overviewQuery.data;
  const alerts = alertsQuery.data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Monitoring Sistem"
        subtitle="Health probe real-time dan riwayat alert Telegram"
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Auto-refresh 30s
            </label>
            <button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <PlayCircle size={16} />
              Run Check
            </button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring'] })}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={overviewQuery.isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {overviewQuery.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !data ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-rose-800 ring-1 ring-rose-200">
          Gagal memuat data monitoring.
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div
            className={`rounded-2xl p-5 ring-1 ${
              data.health.status === 'healthy'
                ? 'bg-emerald-50 ring-emerald-200'
                : 'bg-rose-50 ring-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {data.health.status === 'healthy' ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              )}
              <div className="flex-1">
                <p
                  className={`text-lg font-bold ${
                    data.health.status === 'healthy' ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  {data.health.status === 'healthy' ? 'All Systems Operational' : 'Degraded Performance Detected'}
                </p>
                <p className="text-xs text-slate-600">
                  Last check: {new Date(data.health.timestamp).toLocaleString('id-ID')} ·{' '}
                  {data.server.hostname} · {data.server.environment}
                </p>
              </div>
              <div className="flex items-center gap-4 text-right text-xs">
                <div>
                  <p className="font-semibold text-slate-700">PHP</p>
                  <p className="text-slate-500">{data.server.php_version}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">App</p>
                  <p className="text-slate-500">v{data.server.app_version}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Health Checks Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.health.checks).map(([name, check]) => (
              <HealthCheckCard key={name} name={name} check={check} />
            ))}
          </div>

          {/* Queue + Telegram Config */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Job Queue</h3>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{data.queue.pending_jobs}</p>
                  <p className="text-xs text-slate-500">Pending jobs</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-3xl font-bold ${
                      data.queue.failed_jobs > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {data.queue.failed_jobs}
                  </p>
                  <p className="text-xs text-slate-500">Failed jobs</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Telegram Alerts</h3>
              </div>
              {data.telegram.configured ? (
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} /> Configured
                  </p>
                  <p className="text-xs text-slate-600">
                    Last heartbeat:{' '}
                    <span className="font-medium">
                      {data.telegram.last_heartbeat
                        ? new Date(data.telegram.last_heartbeat).toLocaleString('id-ID')
                        : 'Belum pernah'}
                    </span>
                  </p>
                  {Object.keys(data.telegram.recent_alerts).length > 0 ? (
                    <p className="text-xs text-rose-700">
                      {Object.keys(data.telegram.recent_alerts).length} component(s) dengan alert aktif dedup
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Tidak ada alert aktif dalam window dedup.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose-700">
                  Belum terkonfigurasi. Setup: <code className="rounded bg-slate-100 px-1">php artisan monitoring:telegram-setup</code>
                </p>
              )}
            </div>
          </div>

          {/* Alert History */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Recent Alerts</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {alerts.length}
              </span>
            </div>

            {alertsQuery.isLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500" />
                <p className="text-sm">Tidak ada alert aktif. Sistem berjalan normal.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        a.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{a.component}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            a.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {a.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">{a.source}</span>
                      </div>
                      {a.details && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{a.details}</p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(a.last_sent_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function HealthCheckCard({ name, check }: { name: string; check: HealthCheck }): React.JSX.Element {
  const icon =
    name === 'database' ? <Database size={18} /> :
    name === 'storage' ? <HardDrive size={18} /> :
    name === 'redis' || name === 'cache' ? <Server size={18} /> :
    <Activity size={18} />;

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        check.status ? 'bg-white ring-slate-200' : 'bg-rose-50 ring-rose-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={check.status ? 'text-teal-600' : 'text-rose-600'}>{icon}</span>
          <h4 className="text-sm font-bold text-slate-800 capitalize">{name.replace(/_/g, ' ')}</h4>
        </div>
        {check.status ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : (
          <AlertTriangle size={16} className="text-rose-600" />
        )}
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        {check.status ? (
          <>
            {check.latency_ms !== undefined && (
              <p>
                Latency: <span className="font-mono font-semibold">{check.latency_ms}ms</span>
              </p>
            )}
            {Object.entries(check)
              .filter(([k]) => !['status', 'latency_ms', 'error'].includes(k))
              .slice(0, 3)
              .map(([k, v]) => (
                <p key={k}>
                  {k.replace(/_/g, ' ')}: <span className="font-mono">{String(v)}</span>
                </p>
              ))}
          </>
        ) : (
          <p className="text-rose-700">{check.error ?? 'Gagal'}</p>
        )}
      </div>
    </div>
  );
}
