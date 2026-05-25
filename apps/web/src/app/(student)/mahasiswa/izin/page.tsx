'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Plane, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Calendar, MapPin } from 'lucide-react';

type LeaveRequest = {
  id: number;
  type?: string;
  reason?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at?: string;
};

export default function IzinPage(): React.JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.leaveRequests,
    queryFn: async () => {
      const res = await studentApi.leaveRequests.index();
      const body = ((res as { data?: unknown }).data ?? res) as { izin?: LeaveRequest[]; data?: LeaveRequest[]; message?: string };
      return body;
    },
    retry: false,
  });

  const list: LeaveRequest[] = useMemo(() => {
    if (!data) return [];
    return (data.izin ?? data.data ?? []) as LeaveRequest[];
  }, [data]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = { approved: 0, pending: 0, rejected: 0 };
    list.forEach((i) => {
      const s = (i.status ?? 'pending').toLowerCase();
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return byStatus;
  }, [list]);

  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Plane size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Izin Meninggalkan Lokasi</h1>
            <p className="text-sm text-slate-500">
              Pengajuan izin meninggalkan posko KKN
              {list.length > 0 ? ` • ${list.length} pengajuan` : ''}
            </p>
          </div>
        </div>
        {!isPhaseBlocked && (
          <Link
            href="/mahasiswa/izin/buat"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow"
          >
            <Plus size={16} /> Ajukan Izin
          </Link>
        )}
      </div>

      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-black text-amber-900">Belum Bisa Mengajukan Izin</h2>
          <p className="text-sm text-amber-800">{phaseMessage ?? 'Pengajuan izin hanya tersedia saat fase pelaksanaan KKN.'}</p>
        </div>
      )}

      {!isPhaseBlocked && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Disetujui" value={stats.approved ?? 0} icon={<CheckCircle2 size={16} />} color="emerald" />
          <StatCard label="Menunggu" value={stats.pending ?? 0} icon={<Clock size={16} />} color="amber" />
          <StatCard label="Ditolak" value={stats.rejected ?? 0} icon={<XCircle size={16} />} color="rose" />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      )}

      {!isLoading && !isPhaseBlocked && list.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <Plane className="h-14 w-14 text-slate-300 mx-auto" />
          <p className="font-black text-slate-900 text-lg">Belum Ada Pengajuan Izin</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Ajukan izin jika perlu meninggalkan lokasi KKN selama lebih dari 24 jam. DPL akan menyetujui pengajuan.
          </p>
          <Link
            href="/mahasiswa/izin/buat"
            className="inline-flex items-center gap-2 mt-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow"
          >
            <Plus size={14} /> Ajukan Izin Pertama
          </Link>
        </div>
      )}

      {list.length > 0 && (
        <div className="space-y-3">
          {list.map((izin) => (
            <div key={izin.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-slate-900 capitalize">{izin.type ?? 'Izin'}</span>
                    {izin.destination && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 inline-flex items-center gap-1">
                        <MapPin size={10} /> {izin.destination}
                      </span>
                    )}
                  </div>
                  {izin.reason && <p className="text-sm text-slate-600">{izin.reason}</p>}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} /> {fmtDate(izin.start_date)} {izin.end_date && izin.end_date !== izin.start_date ? `→ ${fmtDate(izin.end_date)}` : ''}
                    </span>
                    {izin.reviewed_by && <span>Direview oleh: <b className="text-slate-700">{izin.reviewed_by}</b></span>}
                    {izin.created_at && <span>Diajukan: {fmtDate(izin.created_at)}</span>}
                  </div>
                  {izin.review_notes && (
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 italic">
                      Catatan reviewer: &ldquo;{izin.review_notes}&rdquo;
                    </div>
                  )}
                </div>
                <StatusPill status={izin.status ?? 'pending'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'emerald' | 'amber' | 'rose' }) {
  const cl = {
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
  }[color];
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
        <div className={'rounded-lg p-1.5 ' + cl}>{icon}</div>
      </div>
      <p className="text-2xl font-black mt-1 text-slate-900">{value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'pending'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'rejected'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const text =
    s === 'approved' ? 'Disetujui' :
    s === 'pending' ? 'Menunggu' :
    s === 'rejected' ? 'Ditolak' : status;
  return <span className={'shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ' + cls}>{text}</span>;
}
