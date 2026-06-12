'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

type Letter = { id:number; letter_number?:string; subject?:string; status:string; notes?:string; participants_count?:number };
const EMPTY={letter_number:'',letter_date:'',subject:'',sender_name:'',sender_position:''};
export default function ExternalLettersPage(){
 const qc=useQueryClient(); const [open,setOpen]=useState(false); const [form,setForm]=useState(EMPTY); const [file,setFile]=useState<File|null>(null);
 const {data,isLoading}=useQuery({queryKey:['external','letters'],queryFn:async()=>((await api.get('/external/collaboration-letters')) as Letter[])??[]});
 const save=useMutation({mutationFn:()=>{const fd=new FormData(); Object.entries(form).forEach(([k,v])=>{ if(v) fd.append(k,v); }); if(file) fd.append('file',file); return api.post('/external/collaboration-letters',fd,{headers:{'Content-Type':'multipart/form-data'}});},onSuccess:()=>{qc.invalidateQueries({queryKey:['external','letters']});toast.success('Surat dibuat');setOpen(false);setForm(EMPTY);setFile(null);},onError:()=>toast.error('Gagal membuat surat')});
 const submit=useMutation({mutationFn:(id:number)=>api.post(`/external/collaboration-letters/${id}/submit`),onSuccess:()=>{qc.invalidateQueries({queryKey:['external','letters']});toast.success('Surat disubmit');},onError:()=>toast.error('Gagal submit')});
 return <div className="space-y-6"><PageHeader title="Surat Kolaborasi" subtitle="Ajukan surat kerja sama KKN" actions={<button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/> Buat Surat</button>}/>
 {open&&<div className="rounded-2xl border p-5 space-y-3"><div className="grid md:grid-cols-2 gap-3">{(Object.keys(EMPTY) as (keyof typeof EMPTY)[]).map(k=><input key={k} type={k==='letter_date'?'date':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k.replaceAll('_',' ')} className="h-10 rounded-xl border px-3 bg-transparent text-sm"/> )}<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files?.[0]??null)} className="h-10 rounded-xl border px-3 py-2 bg-transparent text-sm"/></div><button onClick={()=>save.mutate()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Simpan</button></div>}
 <div className="rounded-2xl border overflow-hidden bg-[color:var(--profile-surface)]"><table className="w-full text-sm"><thead><tr className="bg-[color:var(--profile-soft)]"><th className="p-3 text-left">Nomor</th><th className="p-3 text-left">Subjek</th><th className="p-3 text-left">Status</th><th className="p-3"/></tr></thead><tbody>{isLoading?<tr><td className="p-4" colSpan={4}>Loading...</td></tr>:data?.map(l=><tr key={l.id} className="border-t"><td className="p-3 font-bold">{l.letter_number||`#${l.id}`}</td><td className="p-3">{l.subject||'-'}{l.notes&&<div className="text-xs text-red-500">{l.notes}</div>}</td><td className="p-3 font-bold">{l.status}</td><td className="p-3 text-right"><button disabled={!['draft','rejected'].includes(l.status)} onClick={()=>submit.mutate(l.id)} className="p-2 text-cyan-600 disabled:opacity-30"><Send size={16}/></button></td></tr>)}</tbody></table></div></div>;
}
