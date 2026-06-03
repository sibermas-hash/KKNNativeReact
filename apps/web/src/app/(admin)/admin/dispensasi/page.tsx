'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { FileX, Plus, X, Shield } from 'lucide-react';
import { ConfirmDialog, EmptyState } from '@/components/ui/shared';

const REQUIREMENT_OPTIONS = [
  { value: 'min_sks', label: 'Minimal SKS' },
  { value: 'min_gpa', label: 'Minimal IPK' },
  { value: 'bta_ppi', label: 'BTA/PPI' },
  { value: 'documents', label: 'Kelengkapan Dokumen' },
  { value: 'personal_status', label: 'Status Mahasiswa' },
  { value: 'program_prodi', label: 'Program Studi' },
];

type Dispensasi = {
  id: number;
  nim: string;
  alasan: string;
  bypassed_requirements: string[] | null;
  is_active: boolean;
  periode?: { id: number; name?: string; periode?: number };
  granted_by_user?: { id: number; name?: string };
  created_at?: string;
};

type Period = { id: number; name: string; periode: number };

export default function DispensasiPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nim: '', periode_id: '', alasan: '', bypassed_requirements: [] as string[] });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dispensasi'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/dispensasi');
      return ((res.data as { data?: unknown }).data ?? res.data) as { dispensasi: { data: Dispensasi[] }; periods: Period[] };
    },
  });

  const storeMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      await rawApi.post('/admin/dispensasi', {
        ...payload,
        periode_id: payload.periode_id ? Number(payload.periode_id) : null,
        bypassed_requirements: payload.bypassed_requirements.length > 0 ? payload.bypassed_requirements : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispensasi'] });
      toast.success('Dispensasi berhasil ditambahkan');
      setShowForm(false);
      setForm({ nim: '', periode_id: '', alasan: '', bypassed_requirements: [] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menambahkan dispensasi';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rawApi.delete(`/admin/dispensasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispensasi'] });
      toast.success('Dispensasi dicabut');
      setConfirmId(null);
    },
  });

  const dispensasi = data?.dispensasi?.data ?? [];
  const periods = data?.periods ?? [];

  const toggleReq = (val: string) => {
    setForm(prev => ({
      ...prev,
      bypassed_requirements: prev.bypassed_requirements.includes(val)
        ? prev.bypassed_requirements.filter(v => v !== val)
        : [...prev.bypassed_requirements, val],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Dispensasi KKN</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{dispensasi.length.toLocaleString('id-ID')} Dispensasi Aktif</h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">Bebaskan mahasiswa dari persyaratan tertentu dan pantau riwayat dispensasi dalam satu layar.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/25 hover:bg-white/20">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteMutation.mutate(confirmId)}
        title="Cabut Dispensasi"
        description="Dispensasi akan dinonaktifkan. Mahasiswa kembali terkena syarat normal."
        confirmText="Cabut"
        variant="danger"
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Tambah Dispensasi</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">NIM Mahasiswa *</label>
                <input value={form.nim} onChange={e => setForm(p => ({ ...p, nim: e.target.value }))} placeholder="Masukkan NIM" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Periode (opsional)</label>
                <select value={form.periode_id} onChange={e => setForm(p => ({ ...p, periode_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
                  <option value="">Semua Periode</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name} (Angkatan {p.periode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alasan *</label>
                <textarea value={form.alasan} onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} rows={3} placeholder="Alasan pemberian dispensasi..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Syarat yang Dibebaskan</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {REQUIREMENT_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggleReq(opt.value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${form.bypassed_requirements.includes(opt.value) ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => storeMutation.mutate(form)} disabled={!form.nim || !form.alasan || storeMutation.isPending} className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : dispensasi.length === 0 ? (
        <EmptyState icon={<FileX size={40} />} title="Belum ada dispensasi" description="Klik Tambah untuk memberikan dispensasi kepada mahasiswa." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">NIM</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Periode</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Alasan</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Syarat Dibebaskan</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Oleh</th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dispensasi.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{d.nim}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{d.periode?.name ?? 'Semua'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px] truncate">{d.alasan}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(d.bypassed_requirements ?? []).map(r => (
                        <span key={r} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Shield size={10} />{REQUIREMENT_OPTIONS.find(o => o.value === r)?.label ?? r}
                        </span>
                      ))}
                      {(!d.bypassed_requirements || d.bypassed_requirements.length === 0) && <span className="text-xs text-slate-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.granted_by_user?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {d.is_active ? (
                      <button onClick={() => setConfirmId(d.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100">Cabut</button>
                    ) : (
                      <span className="text-xs text-slate-400">Dicabut</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
