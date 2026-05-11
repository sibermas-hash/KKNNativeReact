'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, apiUrl } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, MapPin, User, Users, FileText, MessageSquare,
  CheckCircle, XCircle, Clock, Image as ImageIcon, ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/shared';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminDailyReportDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'daily-report', id],
    queryFn: async () => {
      const res = await adminApi.kknOperations.dailyReports.show(Number(id));
      return (res as { data?: unknown }).data ?? res;
    },
    enabled: !!id,
  });

  const report = data as {
    title?: string;
    activity?: string;
    reflection?: string;
    social_media_link?: string;
    formatted_date?: string;
    date?: string;
    status?: string;
    ai_summary?: string;
    ai_analysis?: { key_points?: string[]; sentiment?: string; flags?: string[] };
    student?: { name?: string; nim?: string; prodi?: string; fakultas?: string };
    group?: { name?: string; location?: string };
    files?: Array<{ id: number; file_path: string; file_type: string; original_name: string }>;
    review?: { reviewer_name?: string; notes?: string; reviewed_at?: string };
    location_metadata?: { latitude?: string; longitude?: string; gps_accuracy?: string; location_name?: string };
  } | null;

  const approveMutation = useMutation({
    mutationFn: async () => adminApi.kknOperations.dailyReports.approve(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'daily-report', id] }); toast.success('Laporan disetujui'); router.push('/admin/laporan/harian'); },
    onError: () => toast.error('Gagal menyetujui laporan'),
  });

  const revisionMutation = useMutation({
    mutationFn: async () => adminApi.kknOperations.dailyReports.revision(Number(id), { review_notes: notes.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'daily-report', id] }); toast.success('Revisi diminta'); router.push('/admin/laporan/harian'); },
    onError: () => toast.error('Gagal meminta revisi'),
  });

  const requestRevision = () => {
    if (!notes.trim()) {
      toast.error('Catatan revisi wajib diisi');
      return;
    }
    revisionMutation.mutate();
  };

  const fileUrl = (file: { id: number; file_path: string }) =>
    file.id ? apiUrl(`/admin/laporan/harian/file/${file.id}/preview`) : apiUrl(file.file_path);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  if (!report) return <div className="text-center py-20 text-slate-500">Laporan tidak ditemukan</div>;

  const student = report.student;
  const group = report.group;
  const files = report.files ?? [];
  const review = report.review;
  const location = report.location_metadata;
  const aiAnalysis = report.ai_analysis;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/laporan/harian" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{report.title ?? 'Detail Laporan'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar size={12} /> {report.formatted_date ?? report.date ?? '-'}
            </span>
            <StatusBadge status={report.status ?? 'pending'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Aktivitas
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{(report.activity ?? '-')}</p>
          </div>

          {/* Reflection */}
          {report.reflection && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Refleksi
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{(report.reflection ?? '')}</p>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Lampiran ({files.length})
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={fileUrl(f)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                  >
                    <ImageIcon size={16} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-600 truncate">{f.original_name ?? 'File'}</span>
                    <ExternalLink size={12} className="ml-auto text-slate-300 group-hover:text-emerald-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 space-y-3">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest">🤖 Analisis AI</h2>
              {report.ai_summary && <p className="text-sm text-indigo-800">{(report.ai_summary ?? '')}</p>}
              {(aiAnalysis.key_points as string[])?.length > 0 && (
                <ul className="space-y-1">
                  {(aiAnalysis.key_points as string[]).map((pt, i) => (
                    <li key={i} className="text-xs text-indigo-700 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span> {pt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Review Action */}
          {report.status === 'submitted' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tindakan Review</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk mahasiswa (opsional)..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={requestRevision}
                  disabled={revisionMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider hover:bg-amber-100 transition-colors disabled:opacity-60"
                >
                  <XCircle size={14} /> Minta Revisi
                </button>
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-200"
                >
                  <CheckCircle size={14} /> Setujui
                </button>
              </div>
            </div>
          )}

          {/* Review Result */}
          {review?.reviewer_name && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-2">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Riwayat Review
              </h2>
              <p className="text-sm font-bold text-slate-700">Oleh: {review.reviewer_name}</p>
              {review.reviewed_at && <p className="text-xs text-slate-400">{review.reviewed_at}</p>}
              {review.notes && <p className="text-sm text-slate-600 italic">&quot;{review.notes}&quot;</p>}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Student Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Mahasiswa
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-900">{student?.name ?? '-'}</p>
              <p className="text-xs text-slate-500">{student?.nim ?? ''}</p>
              <p className="text-xs text-slate-500">{student?.prodi ?? ''}</p>
              <p className="text-xs text-slate-400">{student?.fakultas ?? ''}</p>
            </div>
          </div>

          {/* Group Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Kelompok
            </h2>
            <p className="text-sm font-bold text-slate-900">{group?.name ?? '-'}</p>
            {group?.location && (
              <p className="text-xs text-slate-500 flex items-start gap-1.5">
                <MapPin size={12} className="shrink-0 mt-0.5" /> {group?.location}
              </p>
            )}
          </div>

          {/* GPS */}
          {location?.latitude && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Lokasi GPS
              </h2>
              <p className="text-xs text-slate-600 font-mono">
                {location.latitude}, {location.longitude}
              </p>
              {location.location_name && <p className="text-xs text-slate-500">{location.location_name}</p>}
              {location.gps_accuracy && <p className="text-xs text-slate-400">Akurasi: {location.gps_accuracy}m</p>}
              <a
                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink size={12} /> Buka di Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
