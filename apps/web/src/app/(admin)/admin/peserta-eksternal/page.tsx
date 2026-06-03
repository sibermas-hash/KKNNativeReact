'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Users } from 'lucide-react';

type Batch = { id:number; home_university:string; program_name?:string; target_regency?:string|null; students_count?:number; periode?:{ name?:string; periode?:number } };
type Period = { id:number; name?:string; periode?:number };
type Row = { id:number; external_nim:string; home_university:string; external_faculty?:string|null; external_study_program?:string|null; mahasiswa?:{ nama?:string; nim?:string; peserta?:Array<{ status:string; kelompok?:{ nama_kelompok?:string; lokasi?:{ regency_name?:string } } }> } };

function unwrap<T>(res: any): T {
  const body = res?.data ?? res;
  return (body?.data ?? body) as T;
}
function asArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  return [];
}

export default function PesertaEksternalPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [batchForm, setBatchForm] = useState({ periode_id:'', home_university:'', program_name:'KKN Kolaborasi PTKIN', letter_number:'', letter_date:'', expected_participants:'', target_regency:'Kebumen' });
  const [batchId, setBatchId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const batchesQ = useQuery<Batch[]>({
    queryKey:['external-batches'],
    queryFn: async()=> asArray<Batch>(unwrap(await rawApi.get('/admin/peserta-eksternal/batches'))),
    placeholderData: [],
  });
  const periodsQ = useQuery<Period[]>({
    queryKey:['periods-external'],
    queryFn: async()=> asArray<Period>(unwrap(await rawApi.get('/admin/periode', { params:{ per_page:100 } }))),
    placeholderData: [],
  });
  const listQ = useQuery<any>({
    queryKey:['external-participants', batchId],
    queryFn: async()=> unwrap<any>(await rawApi.get('/admin/peserta-eksternal', { params:{ batch_id: batchId || undefined, per_page:50 } })),
    placeholderData: { data: [] },
  });
  const batches = batchesQ.data ?? [];
  const periods = periodsQ.data ?? [];
  const rows: Row[] = asArray<Row>(listQ.data);
  const hasError = batchesQ.isError || periodsQ.isError || listQ.isError;

  const createBatch = useMutation({
    mutationFn: async()=> rawApi.post('/admin/peserta-eksternal/batches', { ...batchForm, periode_id:Number(batchForm.periode_id), expected_participants: batchForm.expected_participants ? Number(batchForm.expected_participants) : undefined }),
    onSuccess:()=>{ toast.success('Batch dibuat'); qc.invalidateQueries({queryKey:['external-batches']}); },
    onError:()=> toast.error('Gagal membuat batch'),
  });
  const importCsv = useMutation({
    mutationFn: async()=> { const fd=new FormData(); fd.append('batch_id', batchId); if(file) fd.append('file', file); return rawApi.post('/admin/peserta-eksternal/import', fd); },
    onSuccess:(res)=>{ const d=unwrap<any>(res); toast.success(`Import selesai: ${d.created ?? 0} dibuat, ${d.skipped ?? 0} dilewati`); qc.invalidateQueries({queryKey:['external-participants']}); qc.invalidateQueries({queryKey:['external-batches']}); },
    onError:()=> toast.error('Import gagal'),
  });

  return <main className="space-y-6 p-1">
    <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-slate-900 p-6 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">KKN Reguler</p>
      <h1 className="mt-2 text-2xl font-black">Peserta Eksternal</h1>
      <p className="mt-1 text-sm text-cyan-50">Import mahasiswa mitra/kolaborasi sebagai peserta KKN Reguler. Status tetap peserta KKN, dengan penanda eksternal.</p>
    </div>

    {hasError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Sebagian data belum bisa dimuat. Cek akses role admin/API, lalu refresh.</div>}

    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 font-bold text-slate-800">Batch Kolaborasi</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <select value={batchForm.periode_id} onChange={e=>setBatchForm({...batchForm, periode_id:e.target.value})} className="rounded-xl border px-3 py-2 text-sm"><option value="">Pilih periode KKN Reguler</option>{periods.map(p=><option key={p.id} value={p.id}>{p.name ?? `Periode ${p.id}`} {p.periode ? `- Angkatan ${p.periode}` : ''}</option>)}</select>
        <input value={batchForm.home_university} onChange={e=>setBatchForm({...batchForm, home_university:e.target.value})} placeholder="Kampus asal" className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.target_regency} onChange={e=>setBatchForm({...batchForm, target_regency:e.target.value})} placeholder="Target kabupaten" className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.letter_number} onChange={e=>setBatchForm({...batchForm, letter_number:e.target.value})} placeholder="Nomor surat" className="rounded-xl border px-3 py-2 text-sm" />
        <input type="date" value={batchForm.letter_date} onChange={e=>setBatchForm({...batchForm, letter_date:e.target.value})} className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.expected_participants} onChange={e=>setBatchForm({...batchForm, expected_participants:e.target.value})} placeholder="Jumlah estimasi" className="rounded-xl border px-3 py-2 text-sm" />
      </div>
      <button disabled={!batchForm.periode_id || !batchForm.home_university || createBatch.isPending} onClick={()=>createBatch.mutate()} className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Buat Batch</button>
    </section>

    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold text-slate-800">Import CSV</h2><a className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white" href="/api/v1/admin/peserta-eksternal/template">Download Template CSV</a></div>
      <p className="mb-3 text-xs text-slate-500">Kolom: nama,nim,kampus_asal,fakultas_asal,prodi_asal,jenis_kelamin,email,no_hp,tanggal_lahir,alamat</p>
      <div className="flex flex-wrap gap-3">
        <select value={batchId} onChange={e=>setBatchId(e.target.value)} className="min-w-[280px] rounded-xl border px-3 py-2 text-sm"><option value="">Pilih batch</option>{batches.map(b=><option key={b.id} value={b.id}>{b.home_university} · {b.target_regency ?? '-'} · {b.students_count ?? 0} peserta</option>)}</select>
        <input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="rounded-xl border px-3 py-2 text-sm" />
        <button disabled={!batchId || !file || importCsv.isPending} onClick={()=>importCsv.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Upload size={14}/> Import</button>
      </div>
    </section>

    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b p-4 font-bold text-slate-800"><Users size={18}/> Daftar Peserta Eksternal</div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIM Asal</th><th className="px-4 py-3">Kampus</th><th className="px-4 py-3">Fak/Prodi Asal</th><th className="px-4 py-3">Kelompok</th></tr></thead><tbody>{rows.length === 0 ? <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>Belum ada peserta eksternal.</td></tr> : rows.map(r=>{const p=r.mahasiswa?.peserta?.[0]; return <tr key={r.id} className="border-t"><td className="px-4 py-3 font-medium">{r.mahasiswa?.nama ?? '-'}</td><td className="px-4 py-3">{r.external_nim}</td><td className="px-4 py-3">{r.home_university}</td><td className="px-4 py-3">{r.external_faculty ?? '-'} / {r.external_study_program ?? '-'}</td><td className="px-4 py-3">{p?.kelompok?.nama_kelompok ?? 'Belum ditempatkan'} {p?.kelompok?.lokasi?.regency_name ? `(${p.kelompok.lokasi.regency_name})` : ''}</td></tr>})}</tbody></table></div>
    </section>
  </main>;
}
