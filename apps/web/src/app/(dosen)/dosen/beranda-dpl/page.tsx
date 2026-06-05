'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import {
  Users, FileText, CheckCircle2, MapPin, AlertTriangle,
  ArrowRight, LayoutGrid, ChevronRight, User,
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS } from '@/lib/theme-config';

function StatBox({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const colorClasses: Record<string, string> = {
    emerald: 'bg-[color:var(--profile-primary)]/10 text-[color:var(--profile-primary)] border border-[color:var(--profile-primary)]/20',
    amber: 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)] border border-[color:var(--profile-border)]',
    blue: 'bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]',
    rose: 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border border-[color:var(--profile-border)]',
  };

  return (
    <div 
      className={`${surfaceClass} border border-[color:var(--profile-border)] p-5 ${themeConfig.shadow}`}
      style={{ borderRadius: 'var(--profile-radius)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}><Icon size={18} /></div>
        <span className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-[color:var(--profile-text)] tabular-nums">{value}</p>
    </div>
  );
}

export default function DplDashboardPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.dashboard,
    queryFn: async () => {
      const res = await dplApi.dashboard();
      return res as unknown as Record<string, unknown>;
    },
  });

  const dashboardData = data as Record<string, unknown> || {};
  const groups = (dashboardData.groups as Record<string, unknown>[]) || [];
  const pendingReports = (dashboardData.pending_reports as number) || 0;
  const gradingProgress = (dashboardData.grading_progress as string) || '0%';
  const atRiskStudents = (dashboardData.at_risk_students as Record<string, unknown>[]) || [];
  const coordinatorAreas = (dashboardData.coordinator_areas as unknown[]) || [];

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--profile-border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[color:var(--profile-primary)] animate-pulse" />
            <span className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-[0.2em]">Sistem Monitoring DPL</span>
          </div>
          <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight">
            Selamat Datang, {user?.name?.split(',')[0] || 'DPL'}.
          </h1>
        </div>
        <div className={`flex items-center gap-4 border border-[color:var(--profile-border)] rounded-lg px-4 py-3 ${surfaceClass} ${themeConfig.shadow}`}>
          <div className="flex flex-col border-r border-[color:var(--profile-border)] pr-4 text-right">
            <span className="text-[8px] font-black text-[color:var(--profile-muted)] uppercase mb-0.5">Perlu Validasi</span>
            <span className="text-xs font-black text-[color:var(--profile-danger-text)]">{pendingReports} Laporan</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-[color:var(--profile-muted)] uppercase mb-0.5">Role Akses</span>
            <span className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-tight">Dosen Pembimbing</span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Unit Bimbingan" value={groups.length} icon={Users} color="emerald" />
        <StatBox label="Laporan Masuk" value={pendingReports} icon={FileText} color="amber" />
        <StatBox label="Progres Nilai" value={gradingProgress} icon={CheckCircle2} color="blue" />
        <StatBox label="Wilayah Tugas" value={(coordinatorAreas.length as number) || '—'} icon={MapPin} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* GROUPS TABLE */}
        <div 
          className={`${surfaceClass} border border-[color:var(--profile-border)] ${themeConfig.shadow} overflow-hidden`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="p-5 border-b border-[color:var(--profile-border)] flex items-center justify-between bg-[color:var(--profile-soft)]/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[color:var(--profile-primary)] text-white rounded-lg shadow-lg"><LayoutGrid size={16} /></div>
              <h2 className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-widest">Kelompok Bimbingan Aktif</h2>
            </div>
            <span className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-tighter">{groups.length} Kelompok Terdata</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--profile-border)] bg-[color:var(--profile-soft)]/10">
                  <th className="px-6 py-4 text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-[0.2em]">Kode Unit</th>
                  <th className="px-6 py-4 text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-[0.2em]">Identitas Kelompok</th>
                  <th className="px-6 py-4 text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-[0.2em]">Lokasi Desa</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-[0.2em]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--profile-border)]">
                {groups.length > 0 ? groups.map((group) => (
                  <tr key={String(group.id)} className="hover:bg-[color:var(--profile-soft)]/30 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-[color:var(--profile-primary)] text-white text-[10px] font-black rounded uppercase tracking-wider">#{String(group.code)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-black text-[color:var(--profile-text)] uppercase tracking-tight">{String(group.name)}</div>
                      <div className="text-[10px] font-bold text-[color:var(--profile-accent)] uppercase tracking-tighter mt-0.5">{String(group.period_name)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--profile-text)] opacity-90 uppercase">
                        <MapPin size={12} className="text-[color:var(--profile-danger-text)]" />{String(group.village_name)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/dosen/kelompok/${group.id}`} className="inline-flex h-9 items-center gap-2 px-4 bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] text-[10px] font-black text-[color:var(--profile-text)] hover:bg-[color:var(--profile-primary)] hover:text-white hover:border-[color:var(--profile-primary)] rounded-lg transition-all uppercase tracking-widest active:scale-95">
                        Kelola Unit <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-8 py-20 text-center">
                    <div className="h-12 w-12 bg-[color:var(--profile-soft)] rounded-full flex items-center justify-center mx-auto mb-4 text-[color:var(--profile-muted)]"><Users size={24} /></div>
                    <p className="text-xs font-black text-[color:var(--profile-muted)] uppercase tracking-widest italic">Belum ada unit bimbingan yang ditugaskan.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          {/* ATENSI KHUSUS */}
          <div 
            className={`${surfaceClass} border border-[color:var(--profile-border)] ${themeConfig.shadow} p-6`}
            style={{ borderRadius: 'var(--profile-radius)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border border-[color:var(--profile-border)] rounded-lg"><AlertTriangle size={16} /></div>
                <h2 className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-widest">Atensi Khusus</h2>
              </div>
              <span className="px-2 py-0.5 bg-[color:var(--profile-danger-text)] text-white text-[8px] font-black rounded uppercase">Urgensi Tinggi</span>
            </div>
            <div className="space-y-2">
              {atRiskStudents.length > 0 ? atRiskStudents.map((student) => (
                <div key={String(student.id)} className="flex items-center gap-4 p-4 bg-[color:var(--profile-soft)]/50 border border-[color:var(--profile-border)] rounded-lg group transition-all hover:bg-[color:var(--profile-danger)] hover:border-[color:var(--profile-danger-text)]/30">
                  <div className="h-9 w-9 bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] text-[color:var(--profile-text)] group-hover:text-[color:var(--profile-danger-text)] rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                    {String(student.name || '?').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-tight truncate">{String(student.name)}</p>
                    <p className="text-[10px] font-bold text-[color:var(--profile-muted)]">NIM {String(student.nim)} • Unit #{String(student.group_code)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle2 size={24} className="text-[color:var(--profile-primary)] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[color:var(--profile-muted)]">Semua mahasiswa aktif</p>
                </div>
              )}
            </div>
          </div>

          {/* NAVIGASI CEPAT */}
          <div 
            className={`${surfaceClass} border border-[color:var(--profile-border)] ${themeConfig.shadow} p-6`}
            style={{ borderRadius: 'var(--profile-radius)' }}
          >
            <h3 className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} className="text-[color:var(--profile-primary)]" /> Menu DPL
            </h3>
            <div className="grid gap-2">
              {[
                { href: '/dosen/laporan-harian', icon: FileText, label: 'Review Laporan' },
                { href: '/dosen/evaluasi', icon: CheckCircle2, label: 'Input Nilai' },
                { href: '/dosen/monitoring', icon: MapPin, label: 'Monitoring' },
                { href: '/dosen/izin', icon: AlertTriangle, label: 'Persetujuan Izin' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-[color:var(--profile-border)] hover:bg-[color:var(--profile-soft)] transition-all group">
                  <div className="p-2 bg-[color:var(--profile-soft)] text-[color:var(--profile-muted)] rounded-md group-hover:bg-[color:var(--profile-primary)] group-hover:text-white transition-all"><item.icon size={16} /></div>
                  <span className="text-xs font-bold text-[color:var(--profile-text)] group-hover:text-[color:var(--profile-primary)] transition-colors uppercase tracking-tight">{item.label}</span>
                  <ArrowRight size={14} className="ml-auto text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-primary)] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

