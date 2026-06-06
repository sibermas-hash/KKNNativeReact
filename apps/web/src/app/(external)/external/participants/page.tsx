'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

type Participant = { id:number; status:string; mahasiswa?: { nama:string; external_nim?:string; external_faculty_name?:string; external_prodi_name?:string }; periode?: { name?:string; nama?:string } };
type Period = { id:number; name?:string; periode?:string|number };
type Letter = { id:number; letter_number?:string; subject?:string; status:string };
const EMPTY = { periode_id:'', external_nim:'', nama:'', nik:'', gender:'', phone:'', external_faculty_name:'', external_prodi_name:'', collaboration_letter_id:'' };

export default function ExternalParticipantsPage(){
 const qc=useQueryClient(); const [open,setOpen]=useState(false); const [form,setForm]=useState(EMPTY);
 const {data,isLoading}=useQuery({queryKey:['external','participants'],queryFn:async()=>((await api.get('/external/participants')) as {data?:{data?:Participant[]}})?.data?.data??[]});
 const {data:periods=[]}=useQuery({queryKey:['external','periods'],queryFn:async()=>((await api.get('/external/periodes',{params:{per_page:100}})) as {data?:Period[]|{data?:Period[]}})?.data instanceof Array ? ((await api.get('/external/periodes',{params:{per_page:100}})) as {data?:Period[]}).data ?? [] : (((await api.get('/external/periodes',{params:{per_page:100}})) as {data?:{data?:Period[]}})?.data?.data ?? [])});
 const {data:letters=[]}=useQuery({queryKey:['external','letters','verified'],queryFn:async()=>((await api.get('/external/collaboration-letters',{params:{status:'verified',per_page:100}})) as {data?:{data?:Letter[]}})?.data?.data??[]});
 const save=useMutation({mutationFn:()=>api.post('/external/participants',{...form, periode_id:Number(form.periode_id), collaboration_letter_id: form.collaboration_letter_id ? Number(form.collaboration_letter_id) : null}),onSuccess:()=>{qc.invalidateQueries({queryKey:['external','participants']});toast.success('Peserta ditambahkan');setOpen(false);setForm(EMPTY);},onError:()=>toast.error('Gagal tambah peserta')});
 return <div className="space-y-6"><PageHeader title="Peserta Eksternal" subtitle="Data mahasiswa peserta KKN kolaborasi" actions={<button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/> Tambah</button>}/>
 {open&&<div className="rounded-2xl border p-5 space-y-3"><div className="grid md:grid-cols-2 gap-3">
 <select value={form.periode_id} onChange={e=>setForm({...form,periode_id:e.target.value})} className="h-10 rounded-xl border px-3 bg-transparent text-sm"><option value="">Pilih periode</option>{periods.map(p=><option key={p.id} value={p.id}>{p.name??`Periode ${p.periode??p.id}`}</option>)}</select>
 <select value={form.collaboration_letter_id} onChange={e=>setForm({...form,collaboration_letter_id:e.target.value})} className="h-10 rounded-xl border px-3 bg-transparent text-sm"><option value="">Tanpa surat</option>{letters.map(l=><option key={l.id} value={l.id}>{l.letter_number??`Surat #${l.id}`} — {l.subject??l.status}</option>)}</select>
 {(['external_nim','nama','nik','gender','phone','external_faculty_name','external_prodi_name'] as const).map(k=><input key={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k.replaceAll('_',' ')} className="h-10 rounded-xl border px-3 bg-transparent text-sm"/> )}</div><div className="flex gap-2"><button onClick={()=>save.mutate()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Simpan</button><button onClick={()=>setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">Batal</button></div></div>}
 <div className="rounded-2xl border overflow-hidden bg-[color:var(--profile-surface)]"><table className="w-full text-sm"><thead><tr className="bg-[color:var(--profile-soft)]"><th className="p-3 text-left">Nama</th><th className="p-3 text-left">NIM</th><th className="p-3 text-left">Prodi</th><th className="p-3 text-left">Status</th></tr></thead><tbody>{isLoading?<tr><td className="p-4" colSpan={4}>Loading...</td></tr>:data?.map(p=><tr key={p.id} className="border-t"><td className="p-3 font-bold">{p.mahasiswa?.nama}</td><td className="p-3">{p.mahasiswa?.external_nim}</td><td className="p-3">{p.mahasiswa?.external_prodi_name||'-'}</td><td className="p-3 font-bold">{p.status}</td></tr>)}</tbody></table></div></div>;
}
