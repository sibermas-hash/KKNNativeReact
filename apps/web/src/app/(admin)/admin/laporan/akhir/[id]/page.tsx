'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Archive, FileText, Video, Newspaper, Image as ImageIcon,
  User, Users, CheckCircle, XCircle, Calendar, ShieldCheck, AlertTriangle,
  ExternalLink, ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/shared';
import { useState } from 'react';

interface LaporanAkhir {
  id: number;
  title?: string;
  abstract?: string | null;
  status?: string;
  video_link?: string | null;
  news_link?: string | null;
  file_path?: string;
  file_name?: string;
  article_1_path?: string | null;
  article_2_path?: string | null;
  poster_1_path?: string | null;
  poster_2_path?: string | null;
  poster_3_path?: string | null;
  submitted_at?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  mahasiswa?: { nama?: string; nim?: string };
  kelompok?: { nama_kelompok?: string; dpl?: { user?: { name?: string } } };
  reviewer?: { name?: string };
}

export default function AdminLaporanAkhirDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'laporan-akhir', id],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        laporanAkhir: { show: (id: number) => Promise<unknown> };
      }).laporanAkhir.show(Number(id));
      return (res as { data?: LaporanAkhir }).data ?? (res as LaporanAkhir);
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (status: 'approved' | 'revision') => {
      return (adminApi as unknown as {
        laporanAkhir: { updateStatus: (id: number, d: Record<string, unknown>) => Promise<unknown> };
      }).laporanAkhir.updateStatus(Number(id), { status, review_notes: notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'laporan-akhir', id] });
      router.push('/admin/laporan/akhir');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-slate-500">Laporan tidak ditemukan</div>;

  const isFinalized = data.status === 'approved';

  const artifacts = [
    { label: 'Laporan Utama', path: data.file_path, icon: FileText },
    { label: 'Artikel Ilmiah 1', path: data.article_1_path, icon: FileText },
    { label: 'Artikel Ilmiah 2', path: data.article_2_path, icon: FileText },
    { label: 'Poster Peta 1', path: data.poster_1_path, icon: ImageIcon },
    { label: 'Poster Peta 2', path: data.poster_2_path, icon: ImageIcon },
    { label: 'Poster Peta 3', path: data.poster_3_path, icon: ImageIcon },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/laporan/akhir" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Audit Laporan Akhir</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={data.status ?? 'pending'} />
              <span className="text-xs text-slate-400">{data.submitted_at ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Abstract */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Judul & Abstrak
            </h2>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{data.title ?? '-'}</h3>
            {data.abstract && (
              <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">{data.abstract}</p>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Dokumentasi Video', value: data.video_link, icon: Video },
              { label: 'Publikasi Berita', value: data.news_link, icon: Newspaper },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <item.icon size={14} /> {item.label}
                </h2>
                {item.value ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 truncate">
                    <ExternalLink size={12} /> {item.value}
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose-500">
                    <AlertTriangle size={12} /> Belum diisi
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Artifacts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Berkas & Dokumen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artifacts.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border-2 flex flex-col gap-3 ${item.path ? 'border-slate-100 bg-white hover:border-emerald-300' : 'border-dashed border-slate-100 bg-slate-50 opacity-50'}`}>
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className={item.path ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.label}</span>
                  </div>
                  {item.path ? (
                    <a href={`/api/v1/admin/laporan/akhir/${id}/unduh?asset=${item.path}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1 h-8 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-black transition-colors">
                      Lihat <ArrowRight size={10} />
                    </a>
                  ) : (
                    <div className="h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">N/A</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Audit Action */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Keputusan Audit</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isFinalized}
              placeholder="Catatan review untuk mahasiswa..."
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            {!isFinalized ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateMutation.mutate('revision')}
                  disabled={updateMutation.isPending}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-rose-600 text-white text-xs font-black uppercase hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  <XCircle size={14} /> Revisi
                </button>
                <button
                  onClick={() => updateMutation.mutate('approved')}
                  disabled={updateMutation.isPending}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-200"
                >
                  <CheckCircle size={14} /> Setujui
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-black text-emerald-700 uppercase">Audit Selesai</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi</h2>
            {[
              { label: 'Mahasiswa', value: data.mahasiswa?.nama, icon: User },
              { label: 'NIM', value: data.mahasiswa?.nim, icon: User },
              { label: 'Kelompok', value: data.kelompok?.nama_kelompok, icon: Users },
              { label: 'DPL', value: data.kelompok?.dpl?.user?.name, icon: ShieldCheck },
              { label: 'Dikirim', value: data.submitted_at, icon: Calendar },
              { label: 'Reviewer', value: data.reviewer?.name ?? 'Belum direview', icon: ShieldCheck },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <item.icon size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-slate-700 text-right truncate max-w-[140px]">{item.value ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
