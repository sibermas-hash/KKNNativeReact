'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ExternalUniversity = {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  pic_name?: string | null;
  pic_phone?: string | null;
  pic_email?: string | null;
  status: 'active' | 'inactive';
  admins_count?: number;
};

const EMPTY = {
  name: '',
  code: '',
  address: '',
  pic_name: '',
  pic_phone: '',
  pic_email: '',
  status: 'active' as 'active' | 'inactive',
};

export default function ExternalUniversitiesPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'external-universities'],
    queryFn: async () => ((await api.get('/admin/external-universities', { params: { per_page: 100 } })) as ExternalUniversity[]) ?? [],
  });

  const save = useMutation({
    mutationFn: () => editingId ? api.patch(`/admin/external-universities/${editingId}`, form) : api.post('/admin/external-universities', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'external-universities'] });
      toast.success('Kampus eksternal tersimpan');
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY);
    },
    onError: () => toast.error('Gagal menyimpan kampus eksternal'),
  });

  const destroy = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/external-universities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'external-universities'] });
      toast.success('Kampus eksternal dihapus');
    },
    onError: () => toast.error('Gagal menghapus kampus eksternal'),
  });

  const rows = data ?? [];

  const startCreate = () => {
    setForm(EMPTY);
    setEditingId(null);
    setOpen(true);
  };

  const startEdit = (u: ExternalUniversity) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      code: u.code,
      address: u.address ?? '',
      pic_name: u.pic_name ?? '',
      pic_phone: u.pic_phone ?? '',
      pic_email: u.pic_email ?? '',
      status: u.status ?? 'active',
    });
    setOpen(true);
  };

  return <div className="space-y-6">
    <PageHeader
      title="Kampus Eksternal"
      subtitle="Master kampus mitra untuk admin eksternal, batch, dan peserta eksternal"
      actions={<button onClick={startCreate} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/> Tambah</button>}
    />

    {open && <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nama Kampus" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Kode Kampus" required value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
        <Field label="Nama PIC" value={form.pic_name} onChange={(v) => setForm({ ...form, pic_name: v })} />
        <Field label="Email PIC" type="email" value={form.pic_email} onChange={(v) => setForm({ ...form, pic_email: v })} />
        <Field label="Nomor PIC" value={form.pic_phone} onChange={(v) => setForm({ ...form, pic_phone: v })} />
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="h-10 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm">
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Alamat</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{save.isPending ? 'Menyimpan...' : 'Simpan'}</button>
        <button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">Batal</button>
      </div>
    </div>}

    <div className="overflow-hidden rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[color:var(--profile-soft)]">
            <tr><th className="p-3 text-left">Kampus</th><th className="p-3 text-left">PIC</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td className="p-4" colSpan={4}>Loading...</td></tr> : rows.length === 0 ? <tr><td className="p-4 text-center text-slate-500" colSpan={4}>Belum ada kampus eksternal.</td></tr> : rows.map((u) => <tr key={u.id} className="border-t border-[color:var(--profile-border)]">
              <td className="p-3"><div className="flex gap-2 font-bold"><Building2 size={16}/>{u.name}</div><div className="text-xs opacity-70">{u.code} · {u.address || '-'}</div></td>
              <td className="p-3 text-xs">{u.pic_name || '-'}<br/>{u.pic_email || u.pic_phone || '-'}</td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
              <td className="p-3 text-right"><button onClick={() => startEdit(u)} className="p-2"><Pencil size={16}/></button><button onClick={() => confirm('Hapus kampus eksternal?') && destroy.mutate(u.id)} className="p-2 text-red-600"><Trash2 size={16}/></button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div><label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">{label} {required && <span className="text-rose-500">*</span>}</label><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm" /></div>;
}
