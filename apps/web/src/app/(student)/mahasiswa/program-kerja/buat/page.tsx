'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, FolderPlus, Lock, Target, Users, Wallet, Paperclip, CheckCircle2 } from 'lucide-react';

const KATEGORI_OPTIONS = [
  { value: 'utama', label: 'Program Utama' },
  { value: 'pendukung', label: 'Program Pendukung' },
  { value: 'tambahan', label: 'Program Tambahan' },
];

export default function WorkProgramCreatePage(): React.JSX.Element {
  const router = useRouter();
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
  const { data: readinessData, isLoading: readinessLoading } = useQuery({ queryKey: ['student','work-programs','readiness'], queryFn: async () => studentApi.workPrograms.index() });
  const readiness = (readinessData as unknown as { readiness?: { can_create?: boolean; message?: string } })?.readiness;
  const canCreate = readiness?.can_create === true;

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

  if (!readinessLoading && !canCreate) {
    return <div className="max-w-[800px] mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6"><Link href="/mahasiswa/program-kerja" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ChevronLeft size={16}/> Kembali</Link><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800"><div className="flex items-center gap-3"><Lock size={22}/><h1 className="font-black uppercase">Program Kerja Belum Dibuka</h1></div><p className="mt-3 text-sm font-semibold">{readiness?.message || 'Menunggu proses administrasi KKN selesai.'}</p></div></div>;
  }

  return (
    <div className="max-w-[800px] mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/mahasiswa/program-kerja" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ChevronLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <FolderPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Ajukan Program Kerja</h1>
            <p className="text-xs text-slate-400">Isi detail program kerja kelompok</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-6"
      >
        {/* Judul */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
            Judul Program <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="Contoh: Pelatihan Budidaya Sayuran Organik"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
            Kategori <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.kategori}
            onChange={set('kategori')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {KATEGORI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
            <Target size={12} className="inline mr-1" />Deskripsi Program <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            placeholder="Jelaskan program kerja secara singkat dan jelas..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
          {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
        </div>

        {/* Tujuan */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
            Tujuan & Sasaran
          </label>
          <textarea
            value={form.objectives}
            onChange={set('objectives')}
            rows={3}
            placeholder="Tujuan yang ingin dicapai dari program ini..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        {/* Target & Anggaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
              <Users size={12} className="inline mr-1" />Target Peserta
            </label>
            <input
              value={form.target_participants}
              onChange={set('target_participants')}
              placeholder="Contoh: Ibu-ibu PKK, 30 orang"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
              <Wallet size={12} className="inline mr-1" />Estimasi Anggaran
            </label>
            <input
              value={form.budget}
              onChange={set('budget')}
              placeholder="Contoh: Rp 500.000"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Upload Proposal */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
            <Paperclip size={12} className="inline mr-1" />Upload Proposal (Opsional)
          </label>
          <label className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-slate-200 px-4 py-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
            <Paperclip size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 truncate">
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
            className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 sm:px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
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
