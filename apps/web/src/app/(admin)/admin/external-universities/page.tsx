'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ExternalUniversity = { id: number; name: string; code: string; city?: string; province?: string; contact_name?: string; contact_phone?: string; contact_email?: string; is_active: boolean };
const EMPTY = { name: '', code: '', city: '', province: '', contact_name: '', contact_phone: '', contact_email: '', is_active: true };

export default function ExternalUniversitiesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'external-universities'],
    queryFn: async () => ((await api.get('/admin/external-universities')) as { data?: ExternalUniversity[] })?.data ?? [],
  });

  const save = useMutation({
    mutationFn: () => editingId ? api.patch(`/admin/external-universities/${editingId}`, form) : api.post('/admin/external-universities', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'external-universities'] }); toast.success('Kampus luar tersimpan'); setOpen(false); setEditingId(null); setForm(EMPTY); },
    onError: () => toast.error('Gagal menyimpan kampus luar'),
  });

  const destroy = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/external-universities/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'external-universities'] }); toast.success('Kampus luar dihapus'); },
    onError: () => toast.error('Gagal menghapus'),
  });

  const rows = data ?? [];

  return <div className="space-y-6">
    <PageHeader title="Kampus Luar" subtitle="Master kampus mitra untuk KKN kolaborasi" actions={<button onClick={() => { setForm(EMPTY); setEditingId(null); setOpen(true); }} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/> Tambah</button>} />

    {open && <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {(['name','code','city','province','contact_name','contact_phone','contact_email'] as const).map((k) => <input key={k} value={String(form[k] ?? '')} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k.replaceAll('_',' ')} className="h-10 rounded-xl border px-3 text-sm bg-transparent" />)}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}/> Aktif</label>
      <div className="flex gap-2"><button onClick={() => save.mutate()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Simpan</button><button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">Batal</button></div>
    </div>}

    <div className="rounded-2xl border border-[color:var(--profile-border)] overflow-hidden bg-[color:var(--profile-surface)]">
      <table className="w-full text-sm"><thead className="bg-[color:var(--profile-soft)]"><tr><th className="p-3 text-left">Kampus</th><th className="p-3 text-left">Kontak</th><th className="p-3 text-left">Status</th><th className="p-3"/></tr></thead><tbody>
        {isLoading ? <tr><td className="p-4" colSpan={4}>Loading...</td></tr> : rows.map((u) => <tr key={u.id} className="border-t border-[color:var(--profile-border)]"><td className="p-3"><div className="font-bold flex gap-2"><Building2 size={16}/>{u.name}</div><div className="text-xs opacity-70">{u.code} · {u.city || '-'}</div></td><td className="p-3 text-xs">{u.contact_name || '-'}<br/>{u.contact_email || u.contact_phone || '-'}</td><td className="p-3">{u.is_active ? 'Aktif' : 'Nonaktif'}</td><td className="p-3 text-right"><button onClick={() => { setEditingId(u.id); setForm({ name: u.name, code: u.code, city: u.city ?? '', province: u.province ?? '', contact_name: u.contact_name ?? '', contact_phone: u.contact_phone ?? '', contact_email: u.contact_email ?? '', is_active: u.is_active }); setOpen(true); }} className="p-2"><Pencil size={16}/></button><button onClick={() => confirm('Hapus kampus?') && destroy.mutate(u.id)} className="p-2 text-red-600"><Trash2 size={16}/></button></td></tr>)}
      </tbody></table>
    </div>
  </div>;
}
