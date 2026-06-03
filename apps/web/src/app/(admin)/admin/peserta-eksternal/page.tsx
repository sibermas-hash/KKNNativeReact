'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Upload, Users } from 'lucide-react';

type Batch = { id:number; home_university:string; program_name:string; target_regency?:string; students_count?:number; periode?:{ name?:string; periode?:number } };
type Period = { id:number; name?:string; periode?:number };
type Row = { id:number; external_nim:string; home_university:string; external_faculty?:string; external_study_program?:string; mahasiswa?:{ nama?:string; nim?:string; peserta?:Array<{ status:string; kelompok?:{ nama_kelompok?:string; lokasi?:{ regency_name?:string } } }> } };

function unwrap<T>(res: any): T { return ((res.data?.data ?? res.data) as T); }

export default function PesertaEksternalPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [batchForm, setBatchForm] = useState({ periode_id:'', home_university:'', program_name:'KKN Kolaborasi PTKIN', letter_number:'', letter_date:'', expected_participants:'', target_regency:'Kebumen' });
  const [batchId, setBatchId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: batches=[] } = useQuery<Batch[]>({ queryKey:['external-batches'], queryFn: async()=> unwrap<Batch[]>(await rawApi.get('/admin/peserta-eksternal/batches')) });
  const { data: periods=[] } = useQuery<Period[]>({ queryKey:['periods-external'], queryFn: async()=> {
    const p=unwrap<any>(await rawApi.get('/admin/periode', { params:{ per_page:100 } }));
    return Array.isArray(p) ? p : (p.data ?? []);
  }});
  const { data: list } = useQuery<any>({ queryKey:['external-participants', batchId], queryFn: async()=> unwrap<any>(await rawApi.get('/admin/peserta-eksternal', { params:{ batch_id: batchId || undefined, per_page:50 } })) });
  const rows: Row[] = list?.data ?? [];

  const createBatch = useMutation({
    mutationFn: async()=> rawApi.post('/admin/peserta-eksternal/batches', { ...batchForm, periode_id:Number(batchForm.periode_id), expected_participants: batchForm.expected_participants ? Number(batchForm.expected_participants) : undefined }),
    onSuccess:()=>{ toast.success('Batch dibuat'); qc.invalidateQueries({queryKey:['external-batches']}); },
    onError:()=> toast.error('Gagal membuat batch'),
  });
  const importCsv = useMutation({
    mutationFn: async()=> { const fd=new FormData(); fd.append('batch_id', batchId); if(file) fd.append('file', file); return rawApi.post('/admin/peserta-eksternal/import', fd); },
    onSuccess:(res)=>{ const d=(res.data?.data ?? res.data); toast.success(`Import selesai: ${d.created ?? 0} dibuat, ${d.skipped ?? 0} dilewati`); qc.invalidateQueries({queryKey:['external-participants']}); qc.invalidateQueries({queryKey:['external-batches']}); },
    onError:()=> toast.error('Import gagal'),
  });

  return <div className="space-y-6">
    <PageHeader title="Peserta Eksternal" subtitle="Import mahasiswa mitra/kolaborasi ke KKN Reguler tanpa SIAKAD." />

    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 font-bold text-slate-800">Batch Kolaborasi</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <select value={batchForm.periode_id} onChange={e=>setBatchForm({...batchForm, periode_id:e.target.value})} className="rounded-xl border px-3 py-2 text-sm"><option value="">Pilih periode</option>{periods.map(p=><option key={p.id} value={p.id}>{p.name ?? `Periode ${p.id}`} {p.periode ? `- Angkatan ${p.periode}` : ''}</option>)}</select>
        <input value={batchForm.home_university} onChange={e=>setBatchForm({...batchForm, home_university:e.target.value})} placeholder="Kampus asal" className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.target_regency} onChange={e=>setBatchForm({...batchForm, target_regency:e.target.value})} placeholder="Target kabupaten" className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.letter_number} onChange={e=>setBatchForm({...batchForm, letter_number:e.target.value})} placeholder="Nomor surat" className="rounded-xl border px-3 py-2 text-sm" />
        <input type="date" value={batchForm.letter_date} onChange={e=>setBatchForm({...batchForm, letter_date:e.target.value})} className="rounded-xl border px-3 py-2 text-sm" />
        <input value={batchForm.expected_participants} onChange={e=>setBatchForm({...batchForm, expected_participants:e.target.value})} placeholder="Jumlah estimasi" className="rounded-xl border px-3 py-2 text-sm" />
      </div>
      <button disabled={!batchForm.periode_id || !batchForm.home_university || createBatch.isPending} onClick={()=>createBatch.mutate()} className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Buat Batch</button>
    </section>

    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 font-bold text-slate-800">Import CSV</h2>
      <p className="mb-3 text-xs text-slate-500">Kolom: nama,nim,kampus_asal,fakultas_asal,prodi_asal,jenis_kelamin,email,no_hp,tanggal_lahir,alamat</p>
      <div className="flex flex-wrap gap-3">
        <select value={batchId} onChange={e=>setBatchId(e.target.value)} className="min-w-[280px] rounded-xl border px-3 py-2 text-sm"><option value="">Pilih batch</option>{batches.map(b=><option key={b.id} value={b.id}>{b.home_university} · {b.target_regency ?? '-'} · {b.students_count ?? 0} peserta</option>)}</select>
        <input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="rounded-xl border px-3 py-2 text-sm" />
        <button disabled={!batchId || !file || importCsv.isPending} onClick={()=>importCsv.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Upload size={14}/> Import</button>
      </div>
    </section>

    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b p-4 font-bold text-slate-800"><Users size={18}/> Daftar Peserta Eksternal</div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIM Asal</th><th className="px-4 py-3">Kampus</th><th className="px-4 py-3">Fak/Prodi Asal</th><th className="px-4 py-3">Kelompok</th></tr></thead><tbody>{rows.map(r=>{const p=r.mahasiswa?.peserta?.[0]; return <tr key={r.id} className="border-t"><td className="px-4 py-3 font-medium">{r.mahasiswa?.nama}</td><td className="px-4 py-3">{r.external_nim}</td><td className="px-4 py-3">{r.home_university}</td><td className="px-4 py-3">{r.external_faculty ?? '-'} / {r.external_study_program ?? '-'}</td><td className="px-4 py-3">{p?.kelompok?.nama_kelompok ?? 'Belum ditempatkan'} {p?.kelompok?.lokasi?.regency_name ? `(${p.kelompok.lokasi.regency_name})` : ''}</td></tr>})}</tbody></table></div>
    </section>
  </div>;
}
