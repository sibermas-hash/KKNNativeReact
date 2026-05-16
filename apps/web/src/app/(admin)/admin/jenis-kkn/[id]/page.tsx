'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

interface JenisKknDetail {
  id: number;
  code: string;
  name: string;
  description?: string;
  registration_mode_label: string;
  placement_mode_label: string;
  is_active: boolean;
}

export default function JenisKknDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const router = useRouter();
  const numericId = id && /^\d+$/.test(String(id)) ? Number(id) : null;

  // Redirect non-numeric segments (e.g. "buat") back to index
  useEffect(() => {
    if (!numericId) router.replace('/admin/jenis-kkn');
  }, [numericId, router]);

  const { data, isLoading, isError, error } = useQuery<JenisKknDetail>({
    queryKey: ['admin', 'jenis-kkn', numericId],
    queryFn: async () => {
      const res = await api.get(`/admin/jenis-kkn/${numericId}`);
      return (res as { data: JenisKknDetail }).data ?? res;
    },
    enabled: !!numericId,
  });

  if (!numericId || isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  if (isError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <p className="text-sm font-bold">Detail jenis KKN belum bisa dimuat.</p>
        <p className="mt-1 text-sm text-amber-800">{mutationErrorHandler(error)}</p>
      </div>
    );
  }
  if (!data) return <div className="text-center text-slate-500 py-12">Jenis KKN tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/jenis-kkn" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{data.name}</h1>
            <p className="text-xs text-slate-400 font-mono">{data.code}</p>
          </div>
        </div>
        <Link href={`/admin/jenis-kkn/${id}/edit`}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Pencil size={15} /> Edit
        </Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">Mode Pendaftaran</p><p className="font-semibold">{data.registration_mode_label}</p></div>
          <div><p className="text-xs text-slate-500">Mode Penempatan</p><p className="font-semibold">{data.placement_mode_label}</p></div>
          <div><p className="text-xs text-slate-500">Status</p><p className="font-semibold">{data.is_active ? 'Aktif' : 'Nonaktif'}</p></div>
          {data.description && <div className="col-span-2"><p className="text-xs text-slate-500">Deskripsi</p><p className="text-sm text-slate-600">{data.description}</p></div>}
        </div>
      </div>
    </div>
  );
}
