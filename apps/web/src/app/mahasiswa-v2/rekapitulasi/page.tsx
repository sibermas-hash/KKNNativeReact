'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { BarChart3, Plus, MapPin } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS, FIELD_CLASS } from '@/lib/theme-config';

interface RekapItem {
  id: number;
  uraian_kegiatan: string;
  volume: number | null;
  satuan: string | null;
  swadaya_mhs: number | null;
  swadaya_masyarakat: number | null;
  bantuan_pemerintah: number | null;
  donatur_lain: number | null;
  jumlah: number | null;
  keterangan: string | null;
}

export default function MahasiswaRekapitulasiPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { surfaceClass } = useTheme();
  const [form, setForm] = useState({
    uraian_kegiatan: '', volume: '', satuan: '', swadaya_mhs: '', swadaya_masyarakat: '',
    bantuan_pemerintah: '', donatur_lain: '', jumlah: '', keterangan: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.rekapitulasi,
    queryFn: async () => {
      const res = await api.get('/student/rekapitulasi');
      return res as unknown as Record<string, unknown>;
    },
  });

  const saveMut = useMutation({
    mutationFn: () => api.post('/student/rekapitulasi', {
      ...form,
      volume: form.volume ? Number(form.volume) : null,
      swadaya_mhs: form.swadaya_mhs ? Number(form.swadaya_mhs) : null,
      swadaya_masyarakat: form.swadaya_masyarakat ? Number(form.swadaya_masyarakat) : null,
      bantuan_pemerintah: form.bantuan_pemerintah ? Number(form.bantuan_pemerintah) : null,
      donatur_lain: form.donatur_lain ? Number(form.donatur_lain) : null,
      jumlah: form.jumlah ? Number(form.jumlah) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.student.rekapitulasi });
      toast.success('Rekapitulasi berhasil disimpan');
      setShowForm(false);
      setForm({ uraian_kegiatan: '', volume: '', satuan: '', swadaya_mhs: '', swadaya_masyarakat: '', bantuan_pemerintah: '', donatur_lain: '', jumlah: '', keterangan: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal menyimpan');
    },
  });

  const kelompok = data?.kelompok as { nama_kelompok?: string; lokasi?: { village_name?: string; district_name?: string; regency_name?: string }; periode?: string } | null;
  const items = (data?.rekapitulasi as RekapItem[]) || [];

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--profile-primary)] border-t-transparent" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-[color:var(--profile-primary)] rounded-2xl flex items-center justify-center text-white shadow-lg"><BarChart3 size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Rekapitulasi Kegiatan</h1>
            {kelompok && (
              <p className="text-sm text-[color:var(--profile-muted)] flex items-center gap-1 mt-0.5 font-medium">
                <MapPin size={12} /> {kelompok.nama_kelompok} — {kelompok.lokasi?.village_name}, {kelompok.lokasi?.district_name}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${PRIMARY_CLASS}`}>
          <Plus size={15} /> Tambah Kegiatan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form 
          onSubmit={e => { e.preventDefault(); saveMut.mutate(); }} 
          className={`rounded-2xl p-6 border border-[color:var(--profile-border)] shadow-sm space-y-4 ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Uraian Kegiatan *</label>
              <input value={form.uraian_kegiatan} onChange={e => setForm(f => ({ ...f, uraian_kegiatan: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Volume</label>
              <input type="number" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Satuan</label>
              <input value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} placeholder="unit, orang, paket, dll" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Swadaya Mahasiswa (Rp)</label>
              <input type="number" value={form.swadaya_mhs} onChange={e => setForm(f => ({ ...f, swadaya_mhs: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Swadaya Masyarakat (Rp)</label>
              <input type="number" value={form.swadaya_masyarakat} onChange={e => setForm(f => ({ ...f, swadaya_masyarakat: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Bantuan Pemerintah (Rp)</label>
              <input type="number" value={form.bantuan_pemerintah} onChange={e => setForm(f => ({ ...f, bantuan_pemerintah: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Donatur Lain (Rp)</label>
              <input type="number" value={form.donatur_lain} onChange={e => setForm(f => ({ ...f, donatur_lain: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Jumlah Total (Rp)</label>
              <input type="number" value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[color:var(--profile-muted)] uppercase tracking-wider">Keterangan</label>
              <input value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${FIELD_CLASS}`} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${SOFT_CLASS}`}>Batal</button>
            <button type="submit" disabled={saveMut.isPending} className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${PRIMARY_CLASS}`}>
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div 
          className={`rounded-2xl p-12 text-center border border-[color:var(--profile-border)] ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <BarChart3 size={40} className="mx-auto text-[color:var(--profile-muted)] mb-3 opacity-60" />
          <p className="text-sm font-semibold text-[color:var(--profile-text)]">Belum ada data rekapitulasi</p>
          <p className="text-xs text-[color:var(--profile-muted)] mt-1 font-medium">Klik &quot;Tambah Kegiatan&quot; untuk mulai mencatat.</p>
        </div>
      ) : (
        <div 
          className={`overflow-x-auto rounded-2xl shadow-sm border border-[color:var(--profile-border)] ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--profile-border)] text-left text-xs text-[color:var(--profile-muted)]">
                {['Uraian Kegiatan', 'Vol', 'Satuan', 'Swadaya Mhs', 'Swadaya Masy', 'Pemerintah', 'Donatur', 'Jumlah', 'Ket'].map(col => (
                  <th key={col} className="p-3 font-bold uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--profile-border)]">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-[color:var(--profile-soft)]/20 transition-colors">
                  <td className="p-3 font-semibold text-[color:var(--profile-text)] max-w-[200px] truncate">{item.uraian_kegiatan}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90 tabular-nums">{item.volume ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90">{item.satuan ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90 tabular-nums">{item.swadaya_mhs?.toLocaleString('id-ID') ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90 tabular-nums">{item.swadaya_masyarakat?.toLocaleString('id-ID') ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90 tabular-nums">{item.bantuan_pemerintah?.toLocaleString('id-ID') ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-text)] opacity-90 tabular-nums">{item.donatur_lain?.toLocaleString('id-ID') ?? '-'}</td>
                  <td className="p-3 font-bold text-[color:var(--profile-text)] tabular-nums">{item.jumlah?.toLocaleString('id-ID') ?? '-'}</td>
                  <td className="p-3 text-[color:var(--profile-muted)] max-w-[120px] truncate">{item.keterangan ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
