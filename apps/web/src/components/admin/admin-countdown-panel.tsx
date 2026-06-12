'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Clock, Play, Pause, Lock, Unlock, Zap } from 'lucide-react';
import { RegistrationCountdown } from '@/components/countdown/registration-countdown';

interface PeriodInfo {
  id: number;
  name: string;
  current_phase: string;
  is_locked: boolean;
  jenis: string;
  jenis_code: string;
}

export function AdminCountdownPanel() {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
    select: (res: unknown) => {
      const d = (res as { data?: { available_periods?: Record<string, PeriodInfo[]> } })?.data;
      const grouped = d?.available_periods || {};
      const all: PeriodInfo[] = [];
      Object.values(grouped).forEach(arr => { if (Array.isArray(arr)) all.push(...arr); });
      return all;
    },
  });

  const periods: PeriodInfo[] = data || [];
  const upcomingPeriods = periods.filter(p => p.current_phase === 'upcoming');
  const registrationPeriods = periods.filter(p => p.current_phase === 'registration');

  const targetDate = '2026-05-18T00:00:00.000Z';

  const handleForceOpen = async () => {
    if (!confirm('Switch semua periode upcoming ke registration SEKARANG?')) return;
    setSwitching(true);
    let success = 0;
    try {
      for (const p of upcomingPeriods) {
        try {
          await adminApi.switchPhase({ periode_id: p.id, phase: 'registration' });
          success++;
        } catch { /* skip individual failures */ }
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(success + ' periode berhasil dibuka!');
    } catch {
      toast.error('Gagal mengubah phase');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Countdown Pendaftaran</h3>
            <p className="text-xs text-slate-400">18 Mei 2026, 07:00 WIB</p>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {showPreview ? 'Tutup' : 'Preview'}
        </button>
      </div>

      {showPreview && (
        <div className="rounded-xl overflow-hidden border border-slate-100 p-4 bg-slate-50">
          <RegistrationCountdown targetDate={targetDate} variant="compact" />
          <p className="text-[10px] text-slate-400 mt-2">Countdown aktif 00:01 - 07:00 WIB (18 Mei 2026)</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Pause size={14} className="text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Upcoming</span>
          </div>
          <span className="text-2xl font-black text-amber-900">{upcomingPeriods.length}</span>
          <span className="text-xs text-amber-600 ml-1">periode</span>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Play size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Registration</span>
          </div>
          <span className="text-2xl font-black text-emerald-900">{registrationPeriods.length}</span>
          <span className="text-xs text-emerald-600 ml-1">periode</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleForceOpen}
          disabled={upcomingPeriods.length === 0 || switching}
          className="w-full flex items-center justify-center gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Zap size={14} />
          {switching ? 'Processing...' : 'Force Open Registration Now'}
        </button>
        <p className="text-[10px] text-slate-400 text-center">
          Atau biarkan auto-sync (setiap 5 menit) membuka otomatis jam 07:00 WIB
        </p>
      </div>

      {!isLoading && periods.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {periods.filter(p => p.current_phase === 'upcoming' || p.current_phase === 'registration').map(p => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.jenis_code}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.is_locked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} className="text-slate-300" />}
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  p.current_phase === 'registration' ? 'bg-emerald-100 text-emerald-700' :
                  p.current_phase === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {p.current_phase}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
