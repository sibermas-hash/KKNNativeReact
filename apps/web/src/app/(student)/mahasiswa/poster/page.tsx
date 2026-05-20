'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { Upload, FileImage, FileText, AlertCircle, CheckCircle, ArrowLeft, Image as ImageIcon, ExternalLink } from 'lucide-react';

export default function StudentPosterPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'poster'],
    queryFn: async () => {
      const res = await studentApi.poster.index();
      return (res as { data?: unknown }).data ?? res;
    },
  });

  const poster = data as {
    kelompok?: { nama_kelompok?: string; poster_potensi_desa_path?: string | null; poster_potensi_desa_name?: string | null; poster_url?: string | null };
    allowed_types?: string[];
    max_size?: string;
  } | null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Pilih file terlebih dahulu');
      const fd = new FormData();
      fd.append('poster', file);
      return studentApi.poster.store(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'poster'] });
      setFile(null);
    },
  });

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(name);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  const existing = poster?.kelompok;
  const posterUrl = existing?.poster_url || existing?.poster_potensi_desa_path || undefined;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ImageIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Poster Peta Potensi Desa</h1>
              <p className="text-xs text-slate-400">Sesuai Lampiran 10 Panduan KKN</p>
            </div>
          </div>
          <Link href="/mahasiswa" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </div>

      {/* Existing Poster */}
      {existing?.poster_potensi_desa_path && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900">Poster Sudah Diunggah</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{existing.poster_potensi_desa_name}</p>
            </div>
            {existing.poster_potensi_desa_name && isImage(existing.poster_potensi_desa_name) ? (
              <a
                href={posterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors shrink-0"
              >
                <ExternalLink size={12} /> Lihat
              </a>
            ) : (
              <a
                href={posterUrl}
                download
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors shrink-0"
              >
                <FileText size={12} /> Unduh
              </a>
            )}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-slate-400" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {existing?.poster_potensi_desa_path ? 'Ganti Poster' : 'Upload Poster'}
          </h2>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 space-y-1">
            <p className="font-bold">Format yang diterima: {poster?.allowed_types?.join(', ') || 'JPG, PNG, PDF'}</p>
            <p>Ukuran maksimal: {(poster as Record<string, unknown>)?.max_size_mb ? `${(poster as Record<string, unknown>).max_size_mb}MB` : '5MB'}</p>
          </div>
        </div>

        {/* Drop Zone */}
        <label
          className={`flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed px-4 sm:px-6 py-6 sm:py-10 cursor-pointer transition-all ${
            dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <>
              {file.type.startsWith('image/') ? (
                <FileImage size={36} className="text-emerald-500" />
              ) : (
                <FileText size={36} className="text-emerald-500" />
              )}
              <p className="text-sm font-bold text-slate-700 text-center">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload size={36} className="text-slate-300" />
              <p className="text-sm font-bold text-slate-500">Drag & drop atau klik untuk pilih file</p>
              <p className="text-xs text-slate-400">Poster peta potensi desa kelompok</p>
            </>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {mutation.isError && (
          <p className="text-xs text-rose-500 font-bold">
            {(mutation.error as Error)?.message || 'Gagal mengunggah poster'}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!file || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 sm:px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
          >
            {mutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Upload size={14} />
            )}
            {mutation.isPending ? 'Mengunggah...' : 'Upload Poster'}
          </button>
        </div>
      </div>
    </div>
  );
}
