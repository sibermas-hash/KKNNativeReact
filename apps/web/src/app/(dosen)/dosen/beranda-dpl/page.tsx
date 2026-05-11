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

function StatBox({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20',
    amber: 'bg-amber-50 text-amber-600 ring-amber-500/20',
    blue: 'bg-blue-50 text-blue-600 ring-blue-500/20',
    rose: 'bg-rose-50 text-rose-600 ring-rose-500/20',
  };
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}><Icon size={18} /></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

export default function DplDashboardPage(): React.JSX.Element {
  const { user } = useAuthStore();
  

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.dashboard,
    queryFn: async () => {
      const res = await dplApi.dashboard();
      // dplApi.dashboard() already returns the unwrapped data (interceptor handles this)
      return res as unknown as Record<string, unknown>;
    },
  });

  // API client interceptor unwraps to response.data.data, so data is already the inner object
  const dashboardData = data as Record<string, unknown> || {};
  
  const groups = (dashboardData.groups as Record<string, unknown>[]) || [];
  const pendingReports = (dashboardData.pending_reports as number) || 0;
  const gradingProgress = (dashboardData.grading_progress as string) || '0%';
  const atRiskStudents = (dashboardData.at_risk_students as Record<string, unknown>[]) || [];
  const coordinatorAreas = (dashboardData.coordinator_areas as unknown[]) || [];

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Sistem Monitoring DPL</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Selamat Datang, {user?.name?.split(',')[0] || 'DPL'}. 👋
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex flex-col border-r border-slate-100 pr-4 text-right">
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Perlu Validasi</span>
            <span className="text-xs font-black text-rose-600">{pendingReports} Laporan</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Role Akses</span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Dosen Pembimbing</span>
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
        <div className="lg:col-span-8 bg-white ring-1 ring-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-600/20"><LayoutGrid size={16} /></div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Kelompok Bimbingan Aktif</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{groups.length} Kelompok Terdata</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode Unit</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Kelompok</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Lokasi Desa</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groups.length > 0 ? groups.map((group) => (
                  <tr key={String(group.id)} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-wider">#{String(group.code)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{String(group.name)}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">{String(group.period_name)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                        <MapPin size={12} className="text-rose-500" />{String(group.village_name)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/dosen/kelompok/${group.id}`} className="inline-flex h-9 items-center gap-2 px-4 bg-white ring-1 ring-slate-200 text-[10px] font-black text-slate-900 hover:bg-slate-900 hover:text-white hover:ring-slate-900 rounded-lg transition-all uppercase tracking-widest active:scale-95">
                        Kelola Unit <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-8 py-20 text-center">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Users size={24} /></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Belum ada unit bimbingan yang ditugaskan.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          {/* ATENSI KHUSUS */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={16} /></div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Atensi Khusus</h2>
              </div>
              <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black rounded uppercase">Urgensi Tinggi</span>
            </div>
            <div className="space-y-2">
              {atRiskStudents.length > 0 ? atRiskStudents.map((student) => (
                <div key={String(student.id)} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg group transition-all hover:bg-rose-50 hover:border-rose-100">
                  <div className="h-9 w-9 bg-white ring-1 ring-slate-200 text-slate-400 group-hover:text-rose-600 rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                    {String(student.name || '?').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{String(student.name)}</p>
                    <p className="text-[10px] font-bold text-slate-400">NIM {String(student.nim)} • Unit #{String(student.group_code)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Semua mahasiswa aktif</p>
                </div>
              )}
            </div>
          </div>

          {/* NAVIGASI CEPAT */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} className="text-emerald-600" /> Menu DPL
            </h3>
            <div className="grid gap-2">
              {[
                { href: '/dosen/laporan-harian', icon: FileText, label: 'Review Laporan' },
                { href: '/dosen/evaluasi', icon: CheckCircle2, label: 'Input Nilai' },
                { href: '/dosen/monitoring', icon: MapPin, label: 'Monitoring' },
                { href: '/dosen/izin', icon: AlertTriangle, label: 'Persetujuan Izin' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
                  <div className="p-2 bg-slate-50 text-slate-400 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-all"><item.icon size={16} /></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-900 transition-colors uppercase tracking-tight">{item.label}</span>
                  <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
