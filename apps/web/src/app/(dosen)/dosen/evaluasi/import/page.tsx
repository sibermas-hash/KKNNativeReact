'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
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
  READY: { label: 'Siap diimpor', cls: 'bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border-[color:var(--profile-border)]' },
  NOT_IN_GROUP: { label: 'Bukan anggota', cls: 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)] border-[color:var(--profile-border)]' },
  NOT_FOUND: { label: 'NIM tidak ditemukan', cls: 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border-[color:var(--profile-border)]' },
};

function ImportPreviewContent() {
  const router = useRouter();
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
        <Link href="/dosen/evaluasi" className="p-2 rounded-xl hover:bg-[color:var(--profile-soft)] transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-[color:var(--profile-text)]" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[color:var(--profile-text)] tracking-tight">Import Evaluasi</h1>
          <p className="text-xs text-[color:var(--profile-muted)]">Upload file CSV untuk import nilai evaluasi mahasiswa</p>
        </div>
      </div>

      {/* Upload Step */}
      {!preview && (
        <div className="bg-[color:var(--profile-surface)] rounded-2xl border border-[color:var(--profile-border)] shadow-sm p-6 space-y-5">
          <h2 className="text-xs font-black text-[color:var(--profile-muted)] uppercase tracking-widest">Upload File CSV</h2>

          <div className="bg-[color:var(--profile-warning)] border border-[color:var(--profile-border)] rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-[color:var(--profile-warning-text)] shrink-0 mt-0.5" />
            <div className="text-xs text-[color:var(--profile-warning-text)] space-y-1">
              <p className="font-bold">Format kolom CSV yang diperlukan:</p>
              <p className="font-mono">nim, name, final_report_score, execution_score, article_score</p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed border-[color:var(--profile-border)] px-6 py-10 cursor-pointer hover:border-[color:var(--profile-primary)] hover:bg-[color:var(--profile-soft)]/30 transition-all">
            <Upload size={36} className="text-[color:var(--profile-muted)]" />
            <p className="text-sm font-bold text-[color:var(--profile-text)]">
              {file ? file.name : 'Klik atau drag & drop file CSV'}
            </p>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          {validateMutation.isError && (
            <p className="text-xs text-[color:var(--profile-danger-text)] font-bold">{(validateMutation.error as Error)?.message}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => validateMutation.mutate()}
              disabled={!file || validateMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-[color:var(--profile-primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
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
          <div className="bg-[color:var(--profile-surface)] rounded-2xl border border-[color:var(--profile-border)] shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-black text-[color:var(--profile-muted)] uppercase tracking-widest">Ringkasan</h2>
            <p className="text-sm font-bold text-[color:var(--profile-text)]">Kelompok: {preview.group.name} · {preview.group.period_name}</p>
            <p className="text-sm text-[color:var(--profile-text)]">
              <span className="font-black text-[color:var(--profile-primary)]">{readyCount}</span> dari {preview.preview.length} baris siap diimpor
            </p>
            <div className="flex items-center gap-4 text-xs text-[color:var(--profile-muted)]">
              <span>Laporan Akhir: <strong>{preview.dpl_weights.final_report}%</strong></span>
              <span>Pelaksanaan: <strong>{preview.dpl_weights.execution}%</strong></span>
              <span>Artikel: <strong>{preview.dpl_weights.article}%</strong></span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[color:var(--profile-surface)] rounded-2xl border border-[color:var(--profile-border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--profile-border)] text-left text-xs text-[color:var(--profile-muted)]">
                    {['Mahasiswa', 'Laporan Akhir', 'Pelaksanaan', 'Artikel', 'Status'].map((col) => (
                      <th key={col} className="p-4 font-black uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((item, i) => {
                    const sc = STATUS_CONFIG[item.status];
                    return (
                      <tr key={i} className="border-b border-[color:var(--profile-border)] hover:bg-[color:var(--profile-soft)]/30">
                        <td className="p-4">
                          <p className="font-bold text-[color:var(--profile-text)]">{item.name}</p>
                          <p className="text-xs text-[color:var(--profile-muted)]">{item.nim}</p>
                        </td>
                        <td className="p-4 font-mono text-[color:var(--profile-text)]">{item.final_report_score}</td>
                        <td className="p-4 font-mono text-[color:var(--profile-text)]">{item.execution_score}</td>
                        <td className="p-4 font-mono text-[color:var(--profile-text)]">{item.article_score}</td>
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
              className="px-6 py-3 rounded-xl border border-[color:var(--profile-border)] text-xs font-black text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)] transition-colors uppercase tracking-wider bg-[color:var(--profile-surface)]"
            >
              ← Ganti File
            </button>
            <button
              onClick={() => importMutation.mutate()}
              disabled={readyCount === 0 || importMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-[color:var(--profile-primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
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
