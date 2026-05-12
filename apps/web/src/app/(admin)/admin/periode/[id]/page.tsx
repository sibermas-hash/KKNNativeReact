'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import { ArrowLeft, Users, Layers, MapPin } from 'lucide-react';

export default function PeriodDetailPage(): React.JSX.Element {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'period', Number(id)],
    queryFn: async () => {
      const res = await adminApi.periods.show(Number(id));
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Periode tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/periode" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{String(data.name || 'Detail Periode')}</h1>
      </div>

      {/* Info Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Angkatan</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{String(data.periode || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fase</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{PHASE_LABELS[data.current_phase as string] || String(data.current_phase || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kuota</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{String(data.kuota || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
            <p className={`mt-1 text-lg font-bold ${data.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{data.is_active ? 'Aktif' : 'Draft'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis KKN</p>
            <p className="mt-1 font-semibold text-slate-700">{String(((data.jenis_kkn as { name?: string })?.name) || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahun Akademik</p>
            <p className="mt-1 font-semibold text-slate-700">{String(((data.academic_year as { year?: string })?.year) || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendaftaran</p>
            <p className="mt-1 text-sm text-slate-600">{String(data.registration_start || '-')} — {String(data.registration_end || '-')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pelaksanaan</p>
            <p className="mt-1 text-sm text-slate-600">{String(data.start_date || '-')} — {String(data.end_date || '-')}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/kelompok" className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200 transition-all">
          <Users size={20} className="text-cyan-600" />
          <div>
            <p className="text-sm font-bold text-slate-800">Kelompok</p>
            <p className="text-xs text-slate-500">Kelola kelompok periode ini</p>
          </div>
        </Link>
        <Link href="/admin/pendaftaran" className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200 transition-all">
          <Layers size={20} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-slate-800">Pendaftaran</p>
            <p className="text-xs text-slate-500">Review pendaftaran mahasiswa</p>
          </div>
        </Link>
        <Link href="/admin/dosen/penugasan" className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200 transition-all">
          <MapPin size={20} className="text-amber-600" />
          <div>
            <p className="text-sm font-bold text-slate-800">Penugasan DPL</p>
            <p className="text-xs text-slate-500">Assign DPL ke kelompok</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
