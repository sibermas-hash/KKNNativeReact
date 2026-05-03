'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS, PHASE_LABELS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useAuthStore, usePeriodStore } from '@/stores';
import {
  Users, LayoutGrid, FileText, ClipboardList, AlertTriangle,
  MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { StatCard, StatusBadge, PageHeader } from '@/components/ui/shared';

const PHASES = [
  { id: 'registration', label: 'Pendaftaran' },
  { id: 'placement', label: 'Penempatan' },
  { id: 'execution', label: 'Pelaksanaan' },
  { id: 'grading', label: 'Penilaian' },
];

function MetricCard({ title, value, icon: Icon, color, alert, href }: {
  title: string; value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: string; alert?: boolean; href?: string;
}) {
  const content = (
    <div className={clsx('bg-white rounded-2xl border-2 shadow-sm p-5 relative overflow-hidden transition-all hover:shadow-md', alert ? 'border-amber-200' : 'border-cyan-100')}>
      {alert && <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-amber-500 animate-pulse" />}
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('p-2 rounded-lg', color === 'amber' ? 'bg-amber-50 text-amber-600' : color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-600')}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { activePeriod, currentPhase, availablePeriods } = usePeriodStore();
  const queryClient = useQueryClient();
  const endpoints = adminEndpoints(api);

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(
    activePeriod?.id as number | undefined,
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', { periode_id: selectedPeriodId }],
    queryFn: async () => {
      const res = await endpoints.dashboard({ periode_id: selectedPeriodId });
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const phaseMutation = useMutation({
    mutationFn: (payload: { periode_id: number; phase: string }) => endpoints.switchPhase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['period-context'] });
    },
  });

  const stats = data?.stats as Record<string, unknown> | undefined;
  const period = data?.period as Record<string, unknown> | undefined;
  const phaseKey = (period?.current_phase as string) || currentPhase || 'upcoming';

  const pendingCount = (stats?.pending_registrations as number) || 0;
  const unassignedCount = (stats?.unassigned_students as number) || 0;

  const handlePhaseChange = (newPhase: string) => {
    if (period?.id && newPhase !== phaseKey) {
      phaseMutation.mutate({ periode_id: period.id as number, phase: newPhase });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border-2 border-cyan-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-lime-500 to-amber-500" />
          <div>
            <h1 className="text-4xl font-extrabold text-cyan-950 leading-none tracking-tight">
              Dashboard <span className="text-amber-500">Admin.</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-2 tracking-wide">
              Ringkasan operasional & status pendaftaran real-time
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
            <div className="w-full sm:w-56">
              <label className="block text-[11px] font-semibold text-cyan-900 uppercase tracking-wider mb-1.5">Fase Saat Ini</label>
              <select
                value={phaseKey}
                onChange={(e) => handlePhaseChange(e.target.value)}
                className="w-full h-11 text-xs font-semibold rounded-xl border-2 bg-cyan-600 border-cyan-500 text-white focus:ring-cyan-400 py-2 px-4 shadow-sm"
              >
                {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                <option value="finished">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Pendaftar" value={(stats?.total_students as number) || 0} icon={Users} />
          <MetricCard title="Menunggu Review" value={pendingCount} icon={Clock} alert={pendingCount > 0} color="amber" href="/admin/pendaftaran" />
          <MetricCard title="Belum Ditempatkan" value={unassignedCount} icon={AlertTriangle} alert={unassignedCount > 0} color="rose" />
          <MetricCard title="Total Kelompok" value={(stats?.total_groups as number) || 0} icon={LayoutGrid} />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* REGISTRATION QUEUE */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-cyan-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-cyan-100 flex justify-between items-center">
              <h2 className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider flex items-center gap-3">
                <ClipboardList size={16} className="text-cyan-600" /> Antrian Pendaftaran
              </h2>
              <Link href="/admin/pendaftaran" className="text-[11px] font-semibold tracking-wide text-cyan-600 hover:text-cyan-800 transition-colors">
                Lihat Semua &rarr;
              </Link>
            </div>
            <div className="flex-1">
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Antrian Kosong</p>
                <p className="text-xs text-slate-500">Semua pendaftaran telah divalidasi.</p>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border-2 border-cyan-100 shadow-sm p-6">
              <h2 className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider mb-6 flex items-center gap-3">
                <MapPin size={16} className="text-cyan-600" /> Progres Penempatan
              </h2>
              <div className="space-y-4">
                <CompactProgress label="Verifikasi Posko" current={(stats?.reported_posko as number) || 0} total={(stats?.total_groups as number) || 1} />
                <CompactProgress label="Alokasi Mahasiswa" current={(stats?.assigned_students as number) || 0} total={(stats?.total_students as number) || 1} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-cyan-100 shadow-sm p-6">
              <h2 className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider mb-4 flex items-center gap-3">
                <LayoutGrid size={16} className="text-cyan-600" /> Pintasan Cepat
              </h2>
              <div className="grid gap-2">
                {[
                  { href: '/admin/pendaftaran', icon: ClipboardList, label: 'Pendaftaran' },
                  { href: '/admin/kelompok', icon: Users, label: 'Kelompok' },
                  { href: '/admin/nilai', icon: FileText, label: 'Nilai' },
                  { href: '/admin/pengguna', icon: Users, label: 'Pengguna' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-cyan-100 hover:bg-cyan-50 transition-all group">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-md group-hover:bg-cyan-600 group-hover:text-white transition-all"><item.icon size={16} /></div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-900 transition-colors uppercase tracking-tight">{item.label}</span>
                    <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactProgress({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-black text-cyan-600">{current}/{total}</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className="bg-cyan-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
