'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Trash2, FileText, Search, AlertTriangle } from 'lucide-react';

interface TemplateItem {
  id: number;
  document_key: string;
  name: string;
  description?: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  download_url?: string;
  created_at?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function mimeLabel(mime?: string): string {
  if (!mime) return '-';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word') || mime.includes('docx')) return 'DOCX';
  if (mime.includes('doc')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('xlsx')) return 'XLSX';
  if (mime.includes('xls')) return 'XLS';
  return mime.split('/').pop()?.toUpperCase() ?? '-';
}

export default function DocumentTemplateLibraryPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState({ document_key: '', name: '', description: '', file: null as File | null });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ templates: TemplateItem[] }>({
    queryKey: ['admin', 'document-templates', 'library'],
    queryFn: async () => {
      const res = await api.get('/admin/document-templates');
      return (res as unknown as { templates: TemplateItem[] }) ?? { templates: [] };
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!form.file) throw new Error('File template belum dipilih.');
      const body = new FormData();
      body.append('document_key', form.document_key);
      body.append('name', form.name);
      body.append('description', form.description);
      body.append('file', form.file);
      return api.post('/admin/document-templates', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates'] });
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates', 'library'] });
      toast.success('Template berhasil diunggah');
      setForm({ document_key: '', name: '', description: '', file: null });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal mengunggah template'),
  });

  const destroy = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/document-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates'] });
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates', 'library'] });
      toast.success('Template berhasil dihapus');
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menghapus template'),
  });

  const allTemplates = data?.templates ?? [];
  const templates = search
    ? allTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.document_key.toLowerCase().includes(search.toLowerCase()) || t.file_name.toLowerCase().includes(search.toLowerCase()))
    : allTemplates;

  const uniqueKeys = [...new Set(allTemplates.map(t => t.document_key))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Dokumen"
        subtitle="Kelola semua template dokumen KKN dari sini. Upload, unduh, dan hapus template tanpa akses server."
      />

      {/* Upload Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Upload Template Baru</h2>
        <p className="text-sm text-slate-500">File yang didukung: .doc, .docx, .pdf, .xls, .xlsx (maks 10 MB)</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Document Key</label>
            <input value={form.document_key} onChange={e => setForm(f => ({ ...f, document_key: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 outline-none" placeholder="contoh: surat_izin_ortu" list="document-key-suggestions" />
            <datalist id="document-key-suggestions">
              {uniqueKeys.map(key => <option key={key} value={key} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nama Template</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 outline-none" placeholder="Surat Izin Orang Tua v59" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deskripsi (opsional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 outline-none" placeholder="Template untuk angkatan 59, format baru sesuai edaran LPPM" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">File Template</label>
            <input type="file" accept=".doc,.docx,.pdf,.xls,.xlsx" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-50 file:px-4 file:py-2.5 file:font-semibold file:text-cyan-700 hover:file:bg-cyan-100" />
          </div>
        </div>
        <button onClick={() => upload.mutate()} disabled={upload.isPending || !form.document_key || !form.name || !form.file} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-sm">
          <Upload size={16} /> {upload.isPending ? 'Mengunggah...' : 'Upload Template'}
        </button>
      </div>

      {/* Library Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Library Template</h2>
            <p className="text-sm text-slate-500">{allTemplates.length} template tersimpan</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm font-medium text-slate-800 focus:border-cyan-500 outline-none" placeholder="Cari nama, key, atau file..." />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-6">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : templates.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            {search ? 'Tidak ada template yang cocok dengan pencarian.' : 'Belum ada template dokumen di library.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map(template => (
              <div key={template.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{mimeLabel(template.mime_type)}</span>
                    <p className="font-semibold text-slate-800 truncate">{template.name}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono">{template.document_key}</span>
                    <span>{template.file_name}</span>
                    <span>{formatFileSize(template.file_size)}</span>
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  {template.description && <p className="mt-1 text-sm text-slate-500 truncate">{template.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {template.download_url && (
                    <a href={template.download_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 transition-colors">
                      <Download size={15} /> Unduh
                    </a>
                  )}
                  <button onClick={() => destroy.mutate(template.id)} disabled={destroy.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                    <Trash2 size={15} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Catatan Penting</p>
          <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
            <li>Template yang masih dipakai oleh requirement atau periode tidak bisa dihapus.</li>
            <li>Untuk mengganti template periode, buka halaman detail periode lalu pilih template baru.</li>
            <li>Template lama tetap tersimpan untuk histori dan arsip.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
