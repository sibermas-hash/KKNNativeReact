'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader, ConfirmDialog } from '@/components/ui/shared';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Fakultas {
  id: number;
  nama: string;
  code: string;
  prodi_count?: number;
}

const INPUT = 'w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-white';
const EMPTY_FORM = { nama: '', code: '' };

export default function FakultasPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'fakultas'],
    queryFn: async () => {
      const res = await adminApi.master.faculties.index();
      return ((res as { data: unknown })?.data ?? res) as Fakultas[];
    },
  });

  const save = useMutation({
    mutationFn: () => editingId ? adminApi.master.faculties.update(editingId, form) : adminApi.master.faculties.store(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'fakultas'] });
      toast.success(editingId ? 'Fakultas diperbarui' : 'Fakultas ditambahkan');
      setOpen(false); setEditingId(null); setForm(EMPTY_FORM); setFieldErrors({});
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { error?: { errors?: Record<string, string[]> } } } })?.response?.data?.error?.errors;
      if (errors) {
        const mapped: Record<string, string> = {};
        Object.entries(errors).forEach(([k, msgs]) => { mapped[k] = msgs[0]; });
        setFieldErrors(mapped);
        toast.error(Object.values(mapped)[0] || 'Data tidak valid');
      } else {
        toast.error(err?.response?.data?.error?.message || 'Gagal menyimpan');
      }
    },
  });

  const destroy = useMutation({
    mutationFn: (id: number) => adminApi.master.faculties.destroy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fakultas'] }); toast.success('Fakultas dihapus'); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menghapus — masih digunakan'),
  });

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fakultas"
        subtitle="Kelola data fakultas yang terdaftar dalam sistem"
        actions={
          <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setFieldErrors({}); setOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 shadow-sm">
            <Plus size={15} strokeWidth={2.5} /> Tambah Fakultas
          </button>
        }
      />

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900">{editingId ? 'Edit Fakultas' : 'Tambah Fakultas'}</h2>
              </div>
              <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Fakultas *</label>
                  <input value={form.nama} onChange={e => { setForm(f => ({ ...f, nama: e.target.value })); setFieldErrors(e2 => { const n = { ...e2 }; delete n.nama; return n; }); }}
                    className={`${INPUT} ${fieldErrors.nama ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} placeholder="Fakultas Sains dan Teknologi" required />
                  {fieldErrors.nama && <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.nama}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode Fakultas *</label>
                  <input value={form.code} onChange={e => { setForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setFieldErrors(e2 => { const n = { ...e2 }; delete n.code; return n; }); }}
                    className={`${INPUT} ${fieldErrors.code ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} placeholder="FST" required />
                  {fieldErrors.code && <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.code}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={save.isPending} className="flex-[2] h-10 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
                    {save.isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Fakultas'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-12 text-center">
          <Building2 size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Belum ada fakultas</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                {['Nama Fakultas', 'Kode', 'Jumlah Prodi', 'Aksi'].map(col => (
                  <th key={col} className="p-4 font-black uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{f.nama}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{f.code}</td>
                  <td className="p-4 text-slate-600">{f.prodi_count ?? 0} prodi</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(f.id); setForm({ nama: f.nama, code: f.code }); setFieldErrors({}); setOpen(true); }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmId(f.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) destroy.mutate(confirmId); }}
        title="Hapus fakultas ini?"
        description="Fakultas yang masih memiliki prodi atau mahasiswa tidak dapat dihapus."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
