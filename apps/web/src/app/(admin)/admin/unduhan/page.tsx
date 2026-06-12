'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Download as DownloadIcon, Smartphone, FileText, Trash2, Plus, X } from 'lucide-react';

type DownloadItem = {
  id: number;
  title: string;
  file_name?: string;
  file_type?: string;
  file_url?: string;
  external_url?: string;
  is_active: boolean;
  updated_at?: string;
};

type DownloadsIndex = { data?: DownloadItem[] };

function isDownloadsIndex(v: unknown): v is DownloadsIndex {
  return typeof v === 'object' && v !== null && 'data' in (v as Record<string, unknown>);
}

/**
 * Admin page untuk manage file unduhan publik.
 *
 * Supports:
 *   - List existing downloads
 *   - Upload new file (PDF / DOCX / gambar / APK mobile app)
 *   - Toggle is_active (show/hide di halaman publik)
 *   - Delete
 *
 * Upload APK menggunakan `file_type = 'mobile-app'` sehingga halaman
 * publik `/unduhan` akan menampilkannya di section "Aplikasi Mobile"
 * yang dedicated (card biru) — terpisah dari dokumen biasa.
 */
export default function AdminUnduhanPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<'panduan' | 'formulir' | 'template' | 'mobile-app'>('panduan');
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'downloads'],
    queryFn: async () => {
      const res = await adminApi.downloads.index();
      if (Array.isArray(res)) {
        return res as DownloadItem[];
      }
      return isDownloadsIndex(res) ? res.data ?? [] : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => adminApi.downloads.store(payload as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'downloads'] });
      setShowForm(false);
      setTitle('');
      setFile(null);
      setFileType('panduan');
      toast.success('File berhasil diunggah');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? 'Upload gagal. Cek ukuran & tipe file.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.downloads.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'downloads'] });
      toast.success('File dihapus');
    },
    onError: () => toast.error('Gagal menghapus file'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.downloads.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'downloads'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    if (!file) {
      toast.error('Pilih file yang akan diunggah');
      return;
    }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('file_type', fileType);
    fd.append('file', file);
    fd.append('is_active', '1');
    createMutation.mutate(fd);
  };

  const downloads = (data as DownloadItem[] | undefined) ?? [];
  const mobileApps = downloads.filter((d) => d.file_type === 'mobile-app');
  const documents = downloads.filter((d) => d.file_type !== 'mobile-app');

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pusat Unduhan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola file unduhan publik termasuk dokumen panduan, formulir, dan aplikasi mobile (APK).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700"
        >
          <Plus size={16} />
          Unggah File
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-bold text-slate-800">Unggah File Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Judul</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Panduan KKN 2026, Formulir Proposal, SIBERMAS Android v1.0..."
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipe</span>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as typeof fileType)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="panduan">Panduan</option>
                <option value="formulir">Formulir</option>
                <option value="template">Template</option>
                <option value="mobile-app">Aplikasi Mobile (APK)</option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-400">
                Pilih &quot;Aplikasi Mobile&quot; untuk APK — akan tampil di section khusus di /unduhan publik.
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">File</span>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.apk,.png,.jpg,.jpeg"
                className="mt-1 block w-full text-sm"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Maks 100 MB. Format: PDF, DOCX, XLSX, ZIP, APK, gambar.
              </span>
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Mengunggah...' : 'Unggah'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Memuat file...</div>
      ) : downloads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <DownloadIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada file unduhan</p>
          <p className="mt-1 text-xs text-slate-400">Klik &quot;Unggah File&quot; untuk menambahkan.</p>
        </div>
      ) : (
        <>
          {mobileApps.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-cyan-700">
                <Smartphone size={14} className="mr-1 inline" />
                Aplikasi Mobile ({mobileApps.length})
              </h2>
              <div className="space-y-2">
                {mobileApps.map((d) => (
                  <DownloadRow
                    key={d.id}
                    item={d}
                    onToggle={() => toggleActive.mutate({ id: d.id, is_active: !d.is_active })}
                    onDelete={() => {
                      if (confirm(`Hapus "${d.title}"?`)) deleteMutation.mutate(d.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {documents.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-700">
                <FileText size={14} className="mr-1 inline" />
                Dokumen ({documents.length})
              </h2>
              <div className="space-y-2">
                {documents.map((d) => (
                  <DownloadRow
                    key={d.id}
                    item={d}
                    onToggle={() => toggleActive.mutate({ id: d.id, is_active: !d.is_active })}
                    onDelete={() => {
                      if (confirm(`Hapus "${d.title}"?`)) deleteMutation.mutate(d.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function DownloadRow({
  item,
  onToggle,
  onDelete,
}: {
  item: DownloadItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isApk = item.file_type === 'mobile-app';
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isApk ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700',
          ].join(' ')}
        >
          {isApk ? <Smartphone size={16} /> : <FileText size={16} />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{item.title}</p>
          <p className="text-xs text-slate-400 truncate">
            {item.file_type || 'dokumen'} {item.file_name ? `• ${item.file_name}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input type="checkbox" checked={item.is_active} onChange={onToggle} className="h-4 w-4 rounded" />
          <span className="font-semibold text-slate-600">Aktif</span>
        </label>
        {item.file_url && (
          <a
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Lihat
          </a>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
          title="Hapus"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
