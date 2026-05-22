'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Calendar className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Belum ada jadwal wawancara untuk Anda.</p>
          <p className="mt-1 text-xs text-slate-400">Jadwal akan muncul setelah admin menjadwalkan wawancara.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const s = item.schedule;
            const isPast = new Date(s.interview_date) < new Date(new Date().toDateString());
            return (
              <div key={item.id} className={`rounded-2xl bg-white p-6 shadow-sm ring-1 transition-all ${item.result === 'passed' ? 'ring-emerald-200 bg-emerald-50/30' : item.result === 'failed' ? 'ring-rose-200 bg-rose-50/30' : 'ring-slate-200'}`}>
                {/* Result Badge */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-sm font-black text-slate-900">{fmtDate(s.interview_date)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" />{s.interview_time_start} - {s.interview_time_end}</span>
                      {s.location && <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" />{s.location}</span>}
                    </div>
                    <p className="text-xs text-slate-500">{s.periode?.jenis_kkn ?? s.periode?.name ?? '-'}</p>
                    {s.notes && <p className="text-xs text-slate-500 italic">📝 {s.notes}</p>}
                  </div>

                  <div>
                    {item.result === 'passed' && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <div>
                          <p className="text-sm font-black text-emerald-700">LULUS</p>
                        </div>
                      </div>
                    )}
                    {item.result === 'failed' && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2">
                        <XCircle size={18} className="text-rose-600" />
                        <div>
                          <p className="text-sm font-black text-rose-700">TIDAK LULUS</p>
                        </div>
                      </div>
                    )}
                    {item.result === 'pending' && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2">
                        <AlertCircle size={18} className="text-amber-600" />
                        <div>
                          <p className="text-sm font-black text-amber-700">{isPast ? 'MENUNGGU HASIL' : 'TERJADWAL'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes from interviewer */}
                {item.notes && item.result !== 'pending' && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-500">Catatan Pewawancara:</p>
                    <p className="mt-1 text-sm text-slate-700">{item.notes}</p>
                  </div>
                )}

                {item.processed_at && (
                  <p className="mt-2 text-[10px] text-slate-400">Dinilai: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.processed_at))}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
