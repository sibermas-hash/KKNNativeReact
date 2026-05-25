'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Presentation, Loader2, Target, Globe, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type WorkProgram = {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  kategori?: string;
  abcd_stage?: string;
  sdg_goals?: number[];
  target_participants?: number;
  budget?: number;
  submitted_at?: string;
  approved_at?: string;
};

export default function WorkProgramsPage(): React.JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: async () => {
      const res = await studentApi.workPrograms.index();
      const body = (res as { data?: unknown }).data ?? res;
      return body as { programs?: WorkProgram[]; data?: WorkProgram[]; message?: string };
    },
    retry: false,
  });

  const programs: WorkProgram[] = useMemo(() => {
    if (!data) return [];
    return (data.programs ?? data.data ?? []) as WorkProgram[];
  }, [data]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = { approved: 0, pending: 0, revision: 0, rejected: 0 };
    programs.forEach((p) => {
      const s = (p.status ?? 'pending').toLowerCase();
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return byStatus;
  }, [programs]);

  // Phase-blocked: if 403 with PHASE_BLOCKED
  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Presentation size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Program Kerja</h1>
            <p className="text-sm text-slate-500">
              Kelola program kerja kelompok Anda
              {programs.length > 0 ? ` • ${programs.length} program` : ''}
            </p>
          </div>
        </div>
        {!isPhaseBlocked && (
          <Link
            href="/mahasiswa/program-kerja/buat"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow"
          >
            <Plus size={16} /> Buat Program
          </Link>
        )}
      </div>

      {/* Phase blocked */}
      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-black text-amber-900">Belum Bisa Mengakses Program Kerja</h2>
          <p className="text-sm text-amber-800">{phaseMessage ?? 'Fitur ini hanya tersedia saat fase pelaksanaan KKN.'}</p>
        </div>
      )}

      {/* Stats */}
      {!isPhaseBlocked && programs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Disetujui" value={stats.approved ?? 0} icon={<CheckCircle2 size={16} />} color="emerald" />
          <StatCard label="Menunggu" value={stats.pending ?? 0} icon={<Clock size={16} />} color="amber" />
          <StatCard label="Revisi" value={stats.revision ?? 0} icon={<AlertCircle size={16} />} color="rose" />
          <StatCard label="Total" value={programs.length} icon={<Target size={16} />} color="blue" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isPhaseBlocked && programs.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <Presentation className="h-14 w-14 text-slate-300 mx-auto" />
          <p className="font-black text-slate-900 text-lg">Belum Ada Program Kerja</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Mulai rancang program kerja KKN kelompok Anda. Setiap program harus selaras dengan SDGs dan tahap ABCD.
          </p>
          <Link
            href="/mahasiswa/program-kerja/buat"
            className="inline-flex items-center gap-2 mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow"
          >
            <Plus size={14} /> Buat Program Kerja Pertama
          </Link>
        </div>
      )}

      {/* List */}
      {programs.length > 0 && (
        <div className="space-y-3">
          {programs.map((p) => (
            <Link
              key={p.id}
              href={`/mahasiswa/program-kerja/${p.id}`}
              className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 truncate">
                    {p.title ?? 'Tanpa judul'}
                  </h3>
                  {p.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.kategori && (
                      <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold capitalize">
                        {p.kategori}
                      </span>
                    )}
                    {p.abcd_stage && (
                      <span className="rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-bold border border-purple-100 capitalize">
                        {p.abcd_stage}
                      </span>
                    )}
                    {Array.isArray(p.sdg_goals) && p.sdg_goals.length > 0 && (
                      <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-black border border-blue-100 inline-flex items-center gap-1">
                        <Globe size={10} /> SDG {p.sdg_goals.slice(0, 3).join(', ')}
                        {p.sdg_goals.length > 3 && ` +${p.sdg_goals.length - 3}`}
                      </span>
                    )}
                    {p.target_participants && (
                      <span className="rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5 text-xs font-bold border border-cyan-100">
                        Target {p.target_participants}
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill status={p.status ?? 'pending'} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'emerald' | 'amber' | 'rose' | 'blue' }) {
  const cl = {
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
    blue: 'text-blue-700 bg-blue-50',
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
      : s === 'pending' || s === 'submitted'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'revision'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : s === 'rejected'
      ? 'bg-slate-200 text-slate-700 border-slate-300'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const text =
    s === 'approved' ? 'Disetujui' :
    s === 'pending' || s === 'submitted' ? 'Menunggu' :
    s === 'revision' ? 'Revisi' :
    s === 'rejected' ? 'Ditolak' :
    s === 'draft' ? 'Draft' : status;
  return <span className={'shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ' + cls}>{text}</span>;
}
