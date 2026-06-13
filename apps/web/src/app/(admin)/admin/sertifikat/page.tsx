'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiUrl } from '@/lib/api';
import { Award, Download, Eye, RefreshCw, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

type Config = { config_key: string; label: string; value: string; type: string };
type CertIndex = {
  periode: { id: number; name: string; current_phase?: string; jenis?: string };
  stats: { total: number; active: number; revoked: number; with_token: number };
  configs: Config[];
  sample?: { id: number; nama_mahasiswa?: string; nim?: string; certificate_number?: string; verification_token?: string } | null;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSertifikatPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [periodeId, setPeriodeId] = useState('');
  const [configs, setConfigs] = useState<Config[]>([]);
  const [uploadKey, setUploadKey] = useState('cert_background');

  const q = useQuery({
    queryKey: ['admin-sertifikat', periodeId],
    queryFn: async () => {
      const data = await api.get('/admin/sertifikat', { params: periodeId ? { periode_id: periodeId } : undefined }) as CertIndex;
      setConfigs(data.configs ?? []);
      if (!periodeId && data.periode?.id) setPeriodeId(String(data.periode.id));
      return data;
    },
  });

  const saveM = useMutation({
    mutationFn: () => api.post('/admin/sertifikat', { periode_id: Number(periodeId), configs }),
    onSuccess: () => { toast.success('Konfigurasi tersimpan'); qc.invalidateQueries({ queryKey: ['admin-sertifikat'] }); },
    onError: () => toast.error('Gagal menyimpan konfigurasi'),
  });

  const regenM = useMutation({
    mutationFn: () => api.post('/admin/sertifikat/regenerate', { periode_id: Number(periodeId), force: false }),
    onSuccess: () => { toast.success('Nomor/token sertifikat dilengkapi'); qc.invalidateQueries({ queryKey: ['admin-sertifikat'] }); },
    onError: () => toast.error('Gagal regenerate sertifikat'),
  });

  async function upload(file?: File) {
    if (!file) return;
    const fd = new FormData();
    fd.append('periode_id', periodeId);
    fd.append('key', uploadKey);
    fd.append('file', file);
    try {
      await api.post('/admin/sertifikat/upload-background', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Asset diunggah');
      qc.invalidateQueries({ queryKey: ['admin-sertifikat'] });
    } catch { toast.error('Gagal upload asset'); }
  }

  async function binary(path: string, filename: string, method: 'get' | 'post' = 'get') {
    try {
      const blob = method === 'post'
        ? await api.post(path, { periode_id: Number(periodeId) }, { responseType: 'blob' }) as Blob
        : await api.get(path, { responseType: 'blob' }) as Blob;
      downloadBlob(blob, filename);
    } catch { toast.error('Gagal mengunduh'); }
  }

  const data = q.data;
  const sampleId = data?.sample?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-600 p-3 text-white"><Award size={24} /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manajemen Sertifikat</h1>
          <p className="text-sm text-slate-500">Konfigurasi, preview, download, regenerate, dan ZIP sertifikat KKN</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Periode ID</span>
            <input value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="mt-1 rounded-xl border px-3 py-2 text-sm" placeholder="auto/default" />
          </label>
          <button onClick={() => q.refetch()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Muat</button>
        </div>
        {q.isLoading && <p className="text-sm text-slate-500">Memuat...</p>}
        {data && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              {[['Total', data.stats.total], ['Aktif', data.stats.active], ['Dicabut', data.stats.revoked], ['Dengan Token', data.stats.with_token]].map(([k, v]) => (
                <div key={k} className="rounded-xl border bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{k}</p><p className="text-2xl font-black">{v}</p></div>
              ))}
            </div>
            <p className="text-sm text-slate-600">Periode: <b>{data.periode.name}</b>{data.periode.jenis ? ` • ${data.periode.jenis}` : ''}</p>
          </>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-black">Aksi Cetak</h2>
        <div className="flex flex-wrap gap-2">
          <button disabled={!sampleId} onClick={() => window.open(apiUrl(`/admin/sertifikat/${sampleId}/preview`), '_blank')} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40"><Eye size={16}/>Preview Sample</button>
          <button disabled={!sampleId} onClick={() => binary(`/admin/sertifikat/${sampleId}/download`, `Sertifikat_${data?.sample?.nim ?? sampleId}.pdf`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40"><Download size={16}/>Download Sample</button>
          <button disabled={!periodeId} onClick={() => regenM.mutate()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40"><RefreshCw size={16}/>Lengkapi Nomor/Token</button>
          <button disabled={!periodeId} onClick={() => binary('/admin/sertifikat/zip', `Sertifikat_Periode_${periodeId}.zip`, 'post')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Download size={16}/>ZIP Semua Aktif</button>
        </div>
        {data?.sample ? <p className="text-xs text-slate-500">Sample: {data.sample.nama_mahasiswa} • {data.sample.nim}</p> : <p className="text-xs text-amber-600">Belum ada sample sertifikat aktif pada periode ini.</p>}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between"><h2 className="font-black">Konfigurasi Tampilan</h2><button onClick={() => saveM.mutate()} disabled={!periodeId} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Save size={16}/>Simpan</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {configs.filter(c => c.type !== 'image').map((c, idx) => (
            <label key={c.config_key} className="block">
              <span className="text-xs font-bold text-slate-500">{c.label}</span>
              {c.type === 'textarea' ? (
                <textarea value={c.value ?? ''} onChange={(e) => setConfigs(prev => prev.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} className="mt-1 min-h-28 w-full rounded-xl border px-3 py-2 text-sm" />
              ) : (
                <input value={c.value ?? ''} onChange={(e) => setConfigs(prev => prev.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-black">Upload Asset Sertifikat</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select value={uploadKey} onChange={(e) => setUploadKey(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="cert_background">Background</option>
            <option value="cert_signer_right_signature">TTD Sertifikat</option>
            <option value="cert_stamp">Stempel</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"><Upload size={16}/>Pilih File<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])}/></label>
        </div>
        <p className="text-xs text-slate-500">Format: jpg/png/webp, maks 4MB. Placeholder body: [Nama], [NIM], [Fakultas], [Prodi], [Kelompok], [Lokasi], [Periode].</p>
      </div>
    </div>
  );
}
