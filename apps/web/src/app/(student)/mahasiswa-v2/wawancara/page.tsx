'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';

type Interview = {
  id: number;
  result: 'pending' | 'passed' | 'failed';
  notes?: string;
  processed_at?: string;
  schedule: {
    id: number;
    interview_date: string;
    interview_time_start: string;
    interview_time_end: string;
    location?: string;
    notes?: string;
    periode?: { name?: string; jenis_kkn?: string };
  };
};

const fmtDate = (v?: string) => v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(v)) : '-';

export default function MahasiswaWawancaraPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const { data, isLoading } = useQuery<{ interviews: Interview[] }>({
    queryKey: ['student', 'wawancara'],
    queryFn: async () => {
      const res = await api.get('/student/wawancara');
      return ((res as { data?: unknown }).data ?? res) as { interviews: Interview[] };
    },
  });

  const interviews = data?.interviews ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Wawancara KKN" subtitle="Jadwal dan hasil wawancara Anda." />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div 
              key={i} 
              className={`h-28 animate-pulse border bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]`} 
              style={{ borderRadius: 'var(--profile-radius)' }}
            />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div 
          className={`flex flex-col items-center justify-center border p-12 text-center ${surfaceClass} ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <Calendar className="mb-3 h-10 w-10 text-[color:var(--profile-muted)]" />
          <p className="text-sm font-bold text-[color:var(--profile-text)]">Belum ada jadwal wawancara untuk Anda.</p>
          <p className="mt-1 text-xs text-[color:var(--profile-muted)] font-medium">Jadwal akan muncul setelah admin menjadwalkan wawancara.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const s = item.schedule;
            const isPast = new Date(s.interview_date) < new Date(new Date().toDateString());
            return (
              <div 
                key={item.id} 
                className={`p-6 border transition-all ${surfaceClass} ${themeConfig.shadow} ${
                  item.result === 'passed' 
                    ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10' 
                    : item.result === 'failed' 
                      ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10' 
                      : 'border-[color:var(--profile-border)]'
                }`}
                style={{ borderRadius: 'var(--profile-radius)' }}
              >
                {/* Result Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[color:var(--profile-muted)]" />
                      <span className="text-sm font-black text-[color:var(--profile-text)]">{fmtDate(s.interview_date)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[color:var(--profile-text)] opacity-90 font-medium">
                      <span className="flex items-center gap-1"><Clock size={14} className="text-[color:var(--profile-muted)]" />{s.interview_time_start} - {s.interview_time_end}</span>
                      {s.location && <span className="flex items-center gap-1"><MapPin size={14} className="text-[color:var(--profile-muted)]" />{s.location}</span>}
                    </div>
                    <p className="text-xs text-[color:var(--profile-muted)] font-semibold">{s.periode?.jenis_kkn ?? s.periode?.name ?? '-'}</p>
                    {s.notes && <p className="text-xs text-[color:var(--profile-muted)] italic">📝 {s.notes}</p>}
                  </div>

                  <div className="self-start sm:self-auto">
                    {item.result === 'passed' && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 size={18} />
                        <div>
                          <p className="text-sm font-black tracking-wider">LULUS</p>
                        </div>
                      </div>
                    )}
                    {item.result === 'failed' && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-4 py-2 border border-rose-200 dark:border-rose-800/40">
                        <XCircle size={18} />
                        <div>
                          <p className="text-sm font-black tracking-wider">TIDAK LULUS</p>
                        </div>
                      </div>
                    )}
                    {item.result === 'pending' && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-4 py-2 border border-amber-200 dark:border-amber-800/40">
                        <AlertCircle size={18} />
                        <div>
                          <p className="text-sm font-black tracking-wider">{isPast ? 'MENUNGGU HASIL' : 'TERJADWAL'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes from interviewer */}
                {item.notes && item.result !== 'pending' && (
                  <div className="mt-4 rounded-xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-4">
                    <p className="text-xs font-black text-[color:var(--profile-muted)] uppercase tracking-wider">Catatan Pewawancara:</p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--profile-text)] leading-relaxed">{item.notes}</p>
                  </div>
                )}

                {item.processed_at && (
                  <p className="mt-3 text-[10px] text-[color:var(--profile-muted)] font-medium">Dinilai: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.processed_at))}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
