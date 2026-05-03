'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function WorkProgramDetailPage() {
  const { id } = useParams();
  const endpoints = studentEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'work-program', Number(id)],
    queryFn: async () => { const res = await endpoints.workPrograms.show(Number(id)); return (res.data as { success: boolean; data: Record<string, unknown> }).data; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">Program tidak ditemukan</div>;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <Link href="/mahasiswa/program-kerja" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6"><ChevronLeft size={16} /> Kembali</Link>
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <h1 className="text-2xl font-black text-slate-900">{String(data.title || '')}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Status</p><p className="text-sm font-bold">{String(data.status || '-')}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Kategori</p><p className="text-sm font-bold">{String(data.kategori || '-')}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Target Peserta</p><p className="text-sm font-bold">{String(data.target_participants || '-')}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Anggaran</p><p className="text-sm font-bold">{String(data.budget || '-')}</p></div>
        </div>
        {data.description ? <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Deskripsi</p><p className="text-sm text-slate-700">{String(data.description)}</p></div> : null}
        {data.objectives ? <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Tujuan</p><p className="text-sm text-slate-700">{String(data.objectives)}</p></div> : null}
      </div>
    </div>
  );
}
