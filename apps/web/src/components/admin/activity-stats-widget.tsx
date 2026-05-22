'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, Users, Key, Camera, AlertTriangle, ArrowRight } from 'lucide-react';

type ActivityStats = {
  login: {
    successful_today: number;
    failed_today: number;
    unique_users_today: number;
  };
  by_role: Record<string, { total: number; logged_in: number; never_logged_in: number; percent: number }>;
  password: { changed_today: number; changed_this_week: number };
  profile: { updated_today: number; avatar_uploaded_today: number; avatar_rejected_today: number };
  suspicious: { suspect_ip_count_today: number };
  recent_activity: Array<{
    user: string;
    username?: string;
    action: string;
    status: string;
    ip?: string;
    time?: string;
  }>;
};

const ROLE_LABELS: Record<string, string> = {
  student: 'Mahasiswa',
  dosen: 'Dosen',
  dpl: 'DPL',
  admin: 'Admin',
  faculty_admin: 'Faculty Admin',
  superadmin: 'Superadmin',
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  password_change: 'Ganti Password',
  password_reset: 'Reset Password',
  profile_update: 'Update Profil',
  avatar_upload: 'Upload Avatar',
  avatar_rejected: 'Avatar Ditolak',
  registration: 'Pendaftaran KKN',
  ai_playground: 'AI Playground',
};

function formatTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  return d.toLocaleDateString('id-ID');
}

export function ActivityStatsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/activity-log/stats');
      return ((res as unknown as { data?: ActivityStats })?.data ?? res) as ActivityStats;
    },
    refetchInterval: 60_000, // 1 minute
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  if (!data) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Aktivitas Sistem</h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring login, password, dan aktivitas pengguna hari ini.</p>
        </div>
        <Link href="/admin/activity-log" className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
          Lihat Semua <ArrowRight size={12} />
        </Link>
      </header>

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={CheckCircle2} color="emerald" label="Login OK" value={data.login.successful_today} />
        <StatCard icon={XCircle} color="rose" label="Login Gagal" value={data.login.failed_today} />
        <StatCard icon={Users} color="blue" label="User Unik" value={data.login.unique_users_today} />
        <StatCard icon={Key} color="amber" label="Ganti Password" value={data.password.changed_today} />
        <StatCard icon={Camera} color="cyan" label="Upload Avatar" value={data.profile.avatar_uploaded_today} />
        <StatCard icon={AlertTriangle} color="orange" label="Suspect IP" value={data.suspicious.suspect_ip_count_today} warn />
      </div>

      {/* Login per role */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Login per Role</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(data.by_role)
            .filter(([, v]) => v.total > 0)
            .map(([role, v]) => (
              <div key={role} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">{ROLE_LABELS[role] || role}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                  {v.logged_in} <span className="text-sm font-medium text-slate-400">/ {v.total}</span>
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all ${v.percent >= 80 ? 'bg-emerald-500' : v.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, v.percent)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-500 tabular-nums">{v.percent}%</p>
              </div>
            ))}
        </div>
      </div>

      {/* Recent activity feed */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Aktivitas Terbaru</p>
        {data.recent_activity.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada aktivitas.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {data.recent_activity.slice(0, 6).map((a, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={a.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}>
                    {a.status === 'success' ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-slate-700 truncate">{a.user}</span>
                  <span className="text-slate-400">—</span>
                  <span className="text-slate-500">{ACTION_LABELS[a.action] || a.action}</span>
                  {a.ip && a.status === 'failed' && (
                    <span className="text-slate-400 text-[10px] ml-1">({a.ip})</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(a.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, color, label, value, warn }: { icon: React.ElementType; color: string; label: string; value: number; warn?: boolean }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`rounded-xl p-3 ${colorMap[color] || 'bg-slate-50 text-slate-700'} ${warn && value > 0 ? 'ring-2 ring-orange-300' : ''}`}>
      <Icon size={16} />
      <p className="mt-1.5 text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}
