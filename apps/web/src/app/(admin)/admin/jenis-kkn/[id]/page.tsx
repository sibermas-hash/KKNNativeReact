'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, FileText, MapPin, ShieldCheck } from 'lucide-react';

interface ReqConfig {
  min_sks?: number;
  min_gpa?: number;
  min_semester?: number;
  require_bta_ppi?: boolean;
  require_not_married?: boolean;
  require_parent_permission?: boolean;
  require_health_cert?: boolean;
}

interface AttConfig {
  geofence_enabled?: boolean;
  radius_meters?: number;
  location_source?: string;
  require_photo?: boolean;
  allow_offline_sync?: boolean;
}

interface DocumentRequirement {
  id: number;
  document_key: string;
  document_label: string;
  description?: string;
  is_required: boolean;
  sort_order: number;
  default_template?: { name: string; file_name: string; download_url?: string } | null;
}

interface JenisKknDetail {
  id: number;
  code: string;
  name: string;
  description?: string;
  registration_mode_label: string;
  placement_mode_label: string;
  color?: string;
  is_active: boolean;
  requires_interview?: boolean;
  sort_order?: number;
  requirements_config?: ReqConfig;
  attendance_config?: AttConfig;
  document_requirements?: DocumentRequirement[];
}

function BoolBadge({ value }: { value?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{value ? 'Ya' : 'Tidak'}</span>;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>;
}

export default function JenisKknDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const numericId = id && /^\d+$/.test(String(id)) ? Number(id) : null;

  useEffect(() => {
    if (!numericId) router.replace('/admin/jenis-kkn');
  }, [numericId, router]);

  const { data, isLoading, isError, error } = useQuery<JenisKknDetail>({
    queryKey: ['admin', 'jenis-kkn', numericId],
    queryFn: async () => {
      const res = await api.get(`/admin/jenis-kkn/${numericId}`);
      return res as unknown as JenisKknDetail;
    },
    enabled: !!numericId,
  });

  if (!numericId || isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  if (isError) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm"><p className="text-sm font-bold">Detail jenis KKN belum bisa dimuat.</p><p className="mt-1 text-sm text-amber-800">{mutationErrorHandler(error)}</p></div>;
  }
  if (!data) return <div className="text-center text-slate-500 py-12">Jenis KKN tidak ditemukan</div>;

  const req = data.requirements_config ?? {};
  const att = data.attendance_config ?? {};
  const docs = data.document_requirements ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/admin/jenis-kkn" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"><ArrowLeft size={18} /></Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">Detail Jenis KKN</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${data.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{data.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{data.name}</h1>
              <p className="mt-1 font-mono text-xs text-slate-500">{data.code}</p>
              {data.description && <p className="mt-3 max-w-3xl text-sm text-slate-600">{data.description}</p>}
            </div>
          </div>
          <Link href={`/admin/jenis-kkn/${id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Pencil size={15} /> Edit</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Mode Pendaftaran" value={data.registration_mode_label} />
        <InfoItem label="Mode Penempatan" value={data.placement_mode_label} />
        <InfoItem label="Wajib Wawancara" value={<BoolBadge value={data.requires_interview} />} />
        <InfoItem label="Urutan" value={data.sort_order ?? 0} />
        <InfoItem label="Warna" value={<span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color ?? '#10b981' }} />{data.color ?? '—'}</span>} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck size={16} /> Syarat & Validasi Pendaftaran</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoItem label="Minimal SKS" value={req.min_sks ?? '—'} />
          <InfoItem label="Minimal IPK" value={req.min_gpa ? Number(req.min_gpa).toFixed(2) : '—'} />
          <InfoItem label="Minimal Semester" value={req.min_semester ?? '—'} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="BTA-PPI" value={<BoolBadge value={req.require_bta_ppi} />} />
          <InfoItem label="Belum Menikah" value={<BoolBadge value={req.require_not_married} />} />
          <InfoItem label="Surat Sehat" value={<BoolBadge value={req.require_health_cert} />} />
          <InfoItem label="Izin Orang Tua/Suami" value={<BoolBadge value={req.require_parent_permission} />} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><MapPin size={16} /> Konfigurasi Absensi</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InfoItem label="Geofence" value={<BoolBadge value={att.geofence_enabled} />} />
          <InfoItem label="Radius" value={att.radius_meters ? `${Number(att.radius_meters).toLocaleString('id-ID')} meter` : '—'} />
          <InfoItem label="Sumber Lokasi" value={att.location_source ?? '—'} />
          <InfoItem label="Wajib Foto" value={<BoolBadge value={att.require_photo} />} />
          <InfoItem label="Offline Sync" value={<BoolBadge value={att.allow_offline_sync} />} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileText size={16} /> Requirement Dokumen Dinamis</h2>
        <div className="mt-4 space-y-3">
          {docs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Belum ada requirement dokumen dinamis.</p> : docs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-slate-800">{doc.document_label}</p>
                  <p className="font-mono text-xs text-slate-500">{doc.document_key}</p>
                  {doc.description && <p className="mt-1 text-sm text-slate-600">{doc.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">Urutan {doc.sort_order}</span>
                  <span className={`rounded-full px-2.5 py-1 ${doc.is_required ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{doc.is_required ? 'Wajib' : 'Opsional'}</span>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                Template: {doc.default_template ? `${doc.default_template.name} (${doc.default_template.file_name})` : 'Belum diatur'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
