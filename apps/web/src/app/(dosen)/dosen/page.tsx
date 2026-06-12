'use client';
import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dosenApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { StatCard, NavButton } from '@/components/ui/shared';
import Link from 'next/link';
import { Users, ClipboardList, MapPin, FileText, Star, BookOpen, Calendar, UserCheck } from 'lucide-react';

export default function DosenDashboard(): React.JSX.Element {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dosen.dashboard,
    queryFn: async () => {
      const res = await dosenApi.dashboard();
      return res as unknown as Record<string, unknown>;
    },
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-[color:var(--profile-soft)]" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-[color:var(--profile-soft)]" />)}
      </div>
    </div>
  );

  const isDpl = ((data as unknown as { is_dpl?: boolean })?.is_dpl as boolean) || false;
  const periods = ((data as unknown as { dpl_periods?: Record<string, unknown>[] })?.dpl_periods as Record<string, unknown>[]) || [];
  const workshops = ((data as unknown as { workshops?: Record<string, unknown>[] })?.workshops as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[color:var(--profile-primary)] to-[color:var(--profile-accent)] p-6 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Selamat datang</p>
        <h1 className="text-2xl font-black tracking-tight">{user?.name ?? 'Dosen'}</h1>
        <p className="text-sm opacity-95 mt-1">{isDpl ? 'Dosen Pembimbing Lapangan (DPL)' : 'Dosen'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Calendar} label="Periode DPL" value={periods.length} color="emerald" />
        <StatCard icon={BookOpen} label="Workshop" value={workshops.length} color="indigo" />
      </div>

      {isDpl && (
        <Link href="/dosen/beranda-dpl" className="flex items-center justify-between rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-5 hover:bg-[color:var(--profile-surface-strong)] transition-colors group">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[color:var(--profile-soft-text)] mb-0.5">Mode DPL Aktif</p>
            <p className="text-sm font-bold text-[color:var(--profile-text)]">Buka Dashboard DPL →</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[color:var(--profile-primary)] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Users size={20} />
          </div>
        </Link>
      )}

      {periods.length > 0 && (
        <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
          <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-3">Penugasan DPL</p>
          <div className="space-y-2">
            {periods.map((p) => (
              <div key={p.id as number} className="flex items-center justify-between rounded-xl border border-[color:var(--profile-border)]/45 px-4 py-3">
                <p className="text-sm font-bold text-[color:var(--profile-text)]">{((p.periode as Record<string, unknown>)?.name as string) || '-'}</p>
                <span className="text-[10px] font-black text-[color:var(--profile-soft-text)] bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded px-2 py-0.5 uppercase tracking-wider">
                  {String(p.status || 'pending')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
        <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-3">Menu</p>
        <div className="space-y-1">
          <NavButton href="/dosen/workshops" icon={BookOpen} label="Workshop" />
          <NavButton href="/dosen/daftar-dpl" icon={UserCheck} label="Daftar DPL" />
          {isDpl && (
            <>
              <NavButton href="/dosen/beranda-dpl" icon={MapPin} label="Beranda DPL" />
              <NavButton href="/dosen/laporan-harian" icon={ClipboardList} label="Review Laporan Harian" />
              <NavButton href="/dosen/laporan-akhir" icon={FileText} label="Laporan Akhir" />
              <NavButton href="/dosen/evaluasi" icon={Star} label="Evaluasi" />
              <NavButton href="/dosen/monitoring" icon={Users} label="Monitoring" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
