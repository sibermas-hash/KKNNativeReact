'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, FolderPlus, Target, Users, Wallet, Paperclip, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS, FIELD_CLASS } from '@/lib/theme-config';

const KATEGORI_OPTIONS = [
  { value: 'utama', label: 'Program Utama' },
  { value: 'pendukung', label: 'Program Pendukung' },
  { value: 'tambahan', label: 'Program Tambahan' },
];

export default function WorkProgramCreatePage(): React.JSX.Element {
  const router = useRouter();
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    objectives: '',
    target_participants: '',
    budget: '',
    kategori: 'pendukung',
  });
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      // Create work program (JSON)
      const res = await studentApi.workPrograms.store(form);
      const created = ((res as unknown as { data?: { id: number } })?.data ?? res) as { id: number };
      const id = created?.id;

      // Upload proposal file if provided
      if (proposalFile && id) {
        const fd = new FormData();
        fd.append('proposal', proposalFile);
        await studentApi.workPrograms.uploadProposal(id, fd);
      }

      return created;
    },
    onSuccess: () => {
      router.push('/mahasiswa/program-kerja');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { errors?: Record<string, string[]>; error?: { message?: string } } } };
      if (e?.response?.data?.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.response.data.errors).forEach(([k, v]) => { flat[k] = v[0]; });
        setErrors(flat);
      }
    },
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/mahasiswa/program-kerja" 
          className="p-2 rounded-xl hover:bg-[color:var(--profile-soft)] transition-colors" 
          aria-label="Kembali"
        >
          <ChevronLeft size={20} className="text-[color:var(--profile-text)]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-[color:var(--profile-primary)] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <FolderPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Ajukan Program Kerja</h1>
            <p className="text-xs text-[color:var(--profile-muted)] font-semibold">Isi detail program kerja kelompok</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className={`${surfaceClass} border border-[color:var(--profile-border)] p-8 ${themeConfig.shadow} space-y-6`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        {/* Judul */}
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
            Judul Program <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="Contoh: Pelatihan Budidaya Sayuran Organik"
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium border ${FIELD_CLASS}`}
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500 font-bold">{errors.title}</p>}
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
            Kategori <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.kategori}
            onChange={set('kategori')}
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium border ${FIELD_CLASS}`}
          >
            {KATEGORI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[color:var(--profile-surface)] text-[color:var(--profile-text)]">{o.label}</option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
            <Target size={12} className="inline mr-1" />Deskripsi Program <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            placeholder="Jelaskan program kerja secara singkat dan jelas..."
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium border resize-none ${FIELD_CLASS}`}
          />
          {errors.description && <p className="mt-1 text-xs text-rose-500 font-bold">{errors.description}</p>}
        </div>

        {/* Tujuan */}
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
            Tujuan & Sasaran
          </label>
          <textarea
            value={form.objectives}
            onChange={set('objectives')}
            rows={3}
            placeholder="Tujuan yang ingin dicapai dari program ini..."
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium border resize-none ${FIELD_CLASS}`}
          />
        </div>

        {/* Target & Anggaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
              <Users size={12} className="inline mr-1" />Target Peserta
            </label>
            <input
              value={form.target_participants}
              onChange={set('target_participants')}
              placeholder="Contoh: Ibu-ibu PKK, 30 orang"
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border ${FIELD_CLASS}`}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
              <Wallet size={12} className="inline mr-1" />Estimasi Anggaran
            </label>
            <input
              value={form.budget}
              onChange={set('budget')}
              placeholder="Contoh: Rp 500.000"
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border ${FIELD_CLASS}`}
            />
          </div>
        </div>

        {/* Upload Proposal */}
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-primary)] uppercase tracking-widest mb-1.5">
            <Paperclip size={12} className="inline mr-1" />Upload Proposal (Opsional)
          </label>
          <label className={`flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-[color:var(--profile-border)] px-4 py-4 cursor-pointer hover:border-[color:var(--profile-accent)] hover:bg-[color:var(--profile-soft)] transition-all`}>
            <Paperclip size={18} className="text-[color:var(--profile-muted)] shrink-0" />
            <span className="text-sm text-[color:var(--profile-muted)] truncate font-semibold">
              {proposalFile ? proposalFile.name : 'Pilih file PDF/DOC (maks. 10MB)'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setProposalFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/mahasiswa/program-kerja"
            className={`px-6 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-wider ${SOFT_CLASS}`}
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed ${PRIMARY_CLASS}`}
          >
            {mutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {mutation.isPending ? 'Menyimpan...' : 'Ajukan Program'}
          </button>
        </div>
      </form>
    </div>
  );
}
