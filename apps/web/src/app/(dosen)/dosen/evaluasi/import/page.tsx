'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

interface PreviewItem {
  id: number | null;
  nim: string;
  name: string;
  final_report_score: number;
  execution_score: number;
  article_score: number;
  status: 'READY' | 'NOT_IN_GROUP' | 'NOT_FOUND';
}

interface PreviewData {
  preview: PreviewItem[];
  group: { id: number; name: string; period_name: string };
  dpl_weights: { final_report: number; execution: number; article: number };
}

const STATUS_CONFIG = {
  READY: { label: 'Siap diimpor', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  NOT_IN_GROUP: { label: 'Bukan anggota', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  NOT_FOUND: { label: 'NIM tidak ditemukan', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function ImportPreviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Pilih file CSV terlebih dahulu');
      const fd = new FormData();
      fd.append('file', file);
      const res = await (dplApi as unknown as {
        evaluations: { validateImport: (d: FormData) => Promise<unknown> };
      }).evaluations.validateImport(fd);
      return (res as { data?: PreviewData }).data ?? (res as PreviewData);
    },
    onSuccess: (data) => setPreview(data),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error('Tidak ada data preview');
      return (dplApi as unknown as {
        evaluations: { import: (d: Record<string, unknown>) => Promise<unknown> };
      }).evaluations.import({
        group_id: preview.group.id,
        data: preview.preview,
      });
    },
    onSuccess: () => router.push('/dosen/evaluasi'),
  });

  const readyCount = preview?.preview.filter((i) => i.status === 'READY').length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dosen/evaluasi" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Import Evaluasi</h1>
          <p className="text-xs text-slate-400">Upload file CSV untuk import nilai evaluasi mahasiswa</p>
        </div>
      </div>

      {/* Upload Step */}
      {!preview && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload File CSV</h2>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-1">
              <p className="font-bold">Format kolom CSV yang diperlukan:</p>
              <p className="font-mono">nim, name, final_report_score, execution_score, article_score</p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
            <Upload size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-500">
              {file ? file.name : 'Klik atau drag & drop file CSV'}
            </p>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          {validateMutation.isError && (
            <p className="text-xs text-rose-500 font-bold">{(validateMutation.error as Error)?.message}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => validateMutation.mutate()}
              disabled={!file || validateMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
              {validateMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Upload size={14} />}
              {validateMutation.isPending ? 'Memvalidasi...' : 'Validasi File'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {preview && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ringkasan</h2>
            <p className="text-sm font-bold text-slate-900">Kelompok: {preview.group.name} · {preview.group.period_name}</p>
            <p className="text-sm text-slate-600">
              <span className="font-black text-emerald-700">{readyCount}</span> dari {preview.preview.length} baris siap diimpor
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Laporan Akhir: <strong>{preview.dpl_weights.final_report}%</strong></span>
              <span>Pelaksanaan: <strong>{preview.dpl_weights.execution}%</strong></span>
              <span>Artikel: <strong>{preview.dpl_weights.article}%</strong></span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    {['Mahasiswa', 'Laporan Akhir', 'Pelaksanaan', 'Artikel', 'Status'].map((col) => (
                      <th key={col} className="p-4 font-black uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((item, i) => {
                    const sc = STATUS_CONFIG[item.status];
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.nim}</p>
                        </td>
                        <td className="p-4 font-mono text-slate-700">{item.final_report_score}</td>
                        <td className="p-4 font-mono text-slate-700">{item.execution_score}</td>
                        <td className="p-4 font-mono text-slate-700">{item.article_score}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${sc.cls}`}>
                            {item.status === 'READY' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
            >
              ← Ganti File
            </button>
            <button
              onClick={() => importMutation.mutate()}
              disabled={readyCount === 0 || importMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
              {importMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 size={14} />}
              {importMutation.isPending ? 'Mengimpor...' : `Impor ${readyCount} Data`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DplEvaluasiImportPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}>
      <ImportPreviewContent />
    </Suspense>
  );
}
