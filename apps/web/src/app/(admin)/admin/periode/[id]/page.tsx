'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import { ArrowLeft, Users, Layers, MapPin, CalendarDays, Lock, FileText, Settings } from 'lucide-react';

type PeriodDetail = Record<string, unknown> & {
  id?: number;
  name?: string;
  periode?: number;
  kuota?: number;
  theme?: string | null;
  current_phase?: string;
  phase_label?: string;
  is_active?: boolean;
  is_locked?: boolean;
  start_date?: string;
  end_date?: string;
  registration_start?: string;
  registration_end?: string;
  grading_start?: string | null;
  grading_end?: string | null;
  participants_count?: number;
  academic_year?: { year?: string };
  jenis_kkn?: { name?: string; code?: string };
  document_templates?: Array<{ id: number; requirement_id?: number; template_id?: number }>;
  settings_override?: unknown;
};

function fmt(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

export default function PeriodDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'period', Number(id)],
    queryFn: async () => {
      const res = await adminApi.periods.show(Number(id));
      return res as unknown as PeriodDetail;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Periode tidak ditemukan</div>;

  const periodId = String(data.id ?? id);
  const periodName = String(data.name || 'Detail Periode');
  const phase = String(data.current_phase || 'upcoming');
  const periodQuery = { periode_id: periodId, periode_name: periodName };
  const docs = data.document_templates ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
        <Link href="/admin/periode" className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/20">
          <ArrowLeft size={14} /> Kembali
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Detail Periode</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{periodName}</h1>
            <p className="mt-2 text-sm text-cyan-50">{data.theme || 'Tema belum diisi'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase">Angkatan {String(data.periode || '-')}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase">{data.is_active ? 'Aktif' : 'Draft'}</span>
            {data.is_locked && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase text-amber-950"><Lock size={12} /> Terkunci</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info label="Fase" value={String(data.phase_label || PHASE_LABELS[phase] || phase)} />
        <Info label="Kuota" value={String(data.kuota || '-')} />
        <Info label="Peserta" value={String(data.participants_count ?? '-')} />
        <Info label="Jenis KKN" value={String(data.jenis_kkn?.name || '-')} />
        <Info label="Tahun Akademik" value={String(data.academic_year?.year || '-')} />
        <Info label="Kode Jenis" value={String(data.jenis_kkn?.code || '-')} />
        <Info label="Template Dokumen" value={String(docs.length)} />
        <Info label="Override Config" value={data.settings_override ? 'Ada' : 'Tidak ada'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-cyan-600" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Timeline Operasional</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Info label="Pendaftaran" value={`${fmt(data.registration_start)} → ${fmt(data.registration_end)}`} />
            <Info label="Pelaksanaan" value={`${fmt(data.start_date)} → ${fmt(data.end_date)}`} />
            <Info label="Penilaian" value={`${fmt(data.grading_start)} → ${fmt(data.grading_end)}`} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Dokumen</h2>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400">Belum ada template khusus periode.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => <div key={doc.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Template #{doc.template_id ?? doc.id}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href={{ pathname: '/admin/kelompok', query: periodQuery }} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200">
          <Users size={20} className="text-cyan-600" /><div><p className="text-sm font-bold text-slate-800">Kelompok</p><p className="text-xs text-slate-500">Kelola kelompok periode ini</p></div>
        </Link>
        <Link href={{ pathname: '/admin/pendaftaran', query: periodQuery }} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200">
          <Layers size={20} className="text-emerald-600" /><div><p className="text-sm font-bold text-slate-800">Pendaftaran</p><p className="text-xs text-slate-500">Review pendaftaran mahasiswa</p></div>
        </Link>
        <Link href={{ pathname: '/admin/dosen/penugasan', query: periodQuery }} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:ring-cyan-200">
          <MapPin size={20} className="text-amber-600" /><div><p className="text-sm font-bold text-slate-800">Penugasan DPL</p><p className="text-xs text-slate-500">Assign DPL ke kelompok</p></div>
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2"><Settings size={18} className="text-slate-500" /><h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Catatan Konfigurasi</h2></div>
        <p className="text-sm text-slate-500">Periode terhubung ke jenis KKN, tahun akademik, pendaftaran, kelompok, dokumen, dan fase operasional. Perubahan pada periode aktif berdampak ke alur mahasiswa.</p>
      </div>
    </div>
  );
}
