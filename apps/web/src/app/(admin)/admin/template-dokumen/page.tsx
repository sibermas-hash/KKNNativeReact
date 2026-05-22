'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Trash2, FileText, Search, AlertTriangle, Pencil, ShieldCheck } from 'lucide-react';

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
  requirement_defaults_count?: number;
  period_assignments_count?: number;
  is_deletable?: boolean;
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

// Label kategori dokumen yang mudah dipahami
const DOCUMENT_KEY_LABELS: Record<string, string> = {
  parent_permission: 'Surat Izin Orang Tua/Suami',
  surat_izin_ortu: 'Surat Izin Orang Tua',
  surat_keterangan_sehat: 'Surat Keterangan Sehat',
  proposal_kkn: 'Proposal KKN',
  laporan_akhir: 'Laporan Akhir',
  surat_tugas: 'Surat Tugas',
  sertifikat: 'Sertifikat',
  berita_acara: 'Berita Acara',
  surat_kesediaan: 'Surat Kesediaan',
  surat_kesediaan_kampung_zakat: 'Surat Kesediaan Kampung Zakat',
  surat_kesediaan_biaya_mandiri: 'Surat Kesediaan Biaya Mandiri',
  surat_kesediaan_ketentuan_khusus: 'Surat Kesediaan Ketentuan Khusus',
  surat_kesediaan_kolaboratif: 'Surat Kesediaan Kolaboratif',
};

function keyLabel(key: string): string {
  return DOCUMENT_KEY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function TemplateDokumenPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState({ document_key: '', name: '', description: '', file: null as File | null });
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<TemplateItem | null>(null);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [editForm, setEditForm] = useState({ document_key: '', name: '', description: '' });

  const { data, isLoading } = useQuery<{ templates: TemplateItem[] }>({
    queryKey: ['admin', 'document-templates', 'library'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/document-templates');
      return ((res.data as { data?: unknown }).data ?? res.data) as { templates: TemplateItem[] };
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!form.file) throw new Error('File belum dipilih');
      const body = new FormData();
      body.append('document_key', form.document_key);
      body.append('name', form.name);
      body.append('description', form.description);
      body.append('file', form.file);
      return rawApi.post('/admin/document-templates', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates', 'library'] });
      toast.success('Template berhasil diunggah');
      setForm({ document_key: '', name: '', description: '', file: null });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal mengunggah template'),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('Template belum dipilih');
      return rawApi.patch(`/admin/document-templates/${editing.id}`, editForm);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates', 'library'] });
      toast.success('Metadata template diperbarui');
      setEditing(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal memperbarui metadata'),
  });

  const destroy = useMutation({
    mutationFn: (id: number) => rawApi.delete(`/admin/document-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates', 'library'] });
      toast.success('Template berhasil dihapus');
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menghapus. Template mungkin masih digunakan.'),
  });

  const allTemplates = data?.templates ?? [];
  const templates = search
    ? allTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.document_key.toLowerCase().includes(search.toLowerCase()) || t.file_name.toLowerCase().includes(search.toLowerCase()))
    : allTemplates;

  const suggestedKeys = [...new Set([...Object.keys(DOCUMENT_KEY_LABELS), ...allTemplates.map(t => t.document_key)])];

  const INPUT = 'h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Dokumen"
        subtitle="Kelola template surat dan dokumen KKN. Upload file baru atau unduh template yang sudah ada."
      />

      {/* Form Upload */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800">Unggah Template Baru</h2>
        <p className="text-xs text-slate-500">Format: DOC, DOCX, PDF, XLS, XLSX. Maksimal 10 MB. Pastikan kategori sama dengan requirement dokumen.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Kategori Dokumen</label>
            <input value={form.document_key} onChange={e => setForm(f => ({ ...f, document_key: e.target.value }))} className={INPUT} placeholder="Contoh: surat_izin_ortu" list="key-suggestions" />
            <datalist id="key-suggestions">
              {suggestedKeys.map(key => <option key={key} value={key}>{keyLabel(key)}</option>)}
            </datalist>
            <p className="text-[10px] text-slate-400">Gunakan kategori yang sama untuk mengelompokkan template sejenis</p>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Template</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} placeholder="Contoh: Surat Izin Orang Tua Angkatan 58" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Keterangan (opsional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={INPUT} placeholder="Catatan tambahan tentang template ini" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Pilih File</label>
            <input type="file" accept=".doc,.docx,.pdf,.xls,.xlsx" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-50 file:px-4 file:py-2.5 file:font-semibold file:text-cyan-700 hover:file:bg-cyan-100" />
          </div>
        </div>
        <button onClick={() => upload.mutate()} disabled={upload.isPending || !form.document_key || !form.name || !form.file} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50">
          <Upload size={16} /> {upload.isPending ? 'Mengunggah...' : 'Unggah Template'}
        </button>
      </div>

      {/* Daftar Template */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800">Daftar Template</h2>
            <p className="text-xs text-slate-500">{allTemplates.length} template tersimpan</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm focus:border-cyan-500 outline-none" placeholder="Cari template..." />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-6">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : templates.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            {search ? 'Tidak ditemukan template yang cocok.' : 'Belum ada template. Silakan unggah template pertama di atas.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map(template => (
              <div key={template.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{mimeLabel(template.mime_type)}</span>
                    <p className="font-bold text-slate-800 truncate">{template.name}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="rounded bg-slate-50 px-1.5 py-0.5 font-medium">{keyLabel(template.document_key)}</span>
                    <span>{template.file_name}</span>
                    <span>{formatFileSize(template.file_size)}</span>
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  {template.description && <p className="mt-1 text-xs text-slate-400 truncate">{template.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600"><ShieldCheck size={11} /> Requirement: {template.requirement_defaults_count ?? 0}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Periode: {template.period_assignments_count ?? 0}</span>
                    <span className={`rounded-full px-2 py-1 ${(template.is_deletable ?? true) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{(template.is_deletable ?? true) ? 'Aman hapus' : 'Sedang dipakai'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {template.download_url && (
                    <a href={template.download_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100">
                      <Download size={14} /> Unduh
                    </a>
                  )}
                  <button onClick={() => { setEditing(template); setEditForm({ document_key: template.document_key, name: template.name, description: template.description ?? '' }); }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(template)} disabled={destroy.isPending || !(template.is_deletable ?? true)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Metadata */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Edit Metadata Template</h3>
            <div className="mt-4 space-y-3">
              <input value={editForm.document_key} onChange={e => setEditForm(f => ({ ...f, document_key: e.target.value }))} className={INPUT} list="key-suggestions" placeholder="Kategori dokumen" />
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={INPUT} placeholder="Nama template" />
              <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={INPUT} placeholder="Keterangan" />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => update.mutate()} disabled={update.isPending || !editForm.document_key || !editForm.name} className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Hapus Template?</h3>
            <p className="mt-2 text-sm text-slate-600">Template <strong>{deleteConfirm.name}</strong> akan dihapus permanen dari database dan storage. Lanjut hanya jika template tidak dipakai requirement/periode.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => destroy.mutate(deleteConfirm.id)} disabled={destroy.isPending} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-xs text-amber-800">
          <p className="font-bold">Catatan</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            <li>Template yang masih dipakai oleh persyaratan dokumen tidak bisa dihapus.</li>
            <li>Untuk mengganti template di periode tertentu, buka halaman Periode lalu pilih template baru.</li>
            <li>Template lama tetap tersimpan sebagai arsip.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
