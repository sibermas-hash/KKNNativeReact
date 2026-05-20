"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Step = { key:string; label:string; enabled:boolean; required:boolean; actor?:string; mode?:string; depends_on?:string[] };
type Payload = { workflow?: { steps?: Step[] } | null; base_workflow?: { steps?: Step[] }; effective?: Record<string, unknown>; name?: string; jenis_kkn?: { name?: string; code?: string } };
const DEFAULT: Step[] = [
  {key:'registration',label:'Pendaftaran',enabled:true,required:true,actor:'student',mode:'open'},
  {key:'documents',label:'Upload Dokumen',enabled:true,required:true,actor:'student'},
  {key:'approval',label:'Review Admin',enabled:true,required:true,actor:'admin'},
  {key:'placement',label:'Plotting Kelompok/Lokasi',enabled:true,required:true,actor:'admin',mode:'manual_admin'},
  {key:'leader',label:'Penetapan Ketua',enabled:true,required:true,actor:'admin'},
  {key:'dpl',label:'Penetapan DPL',enabled:true,required:true,actor:'admin'},
  {key:'work_program',label:'Program Kerja',enabled:true,required:false,actor:'leader'},
  {key:'daily_report',label:'Laporan Harian',enabled:true,required:true,actor:'member'},
  {key:'certificate',label:'Sertifikat',enabled:true,required:true,actor:'system'},
];

export default function PeriodWorkflowPage(){
  const params=useParams(); const id=Number(params.id); const qc=useQueryClient();
  const {data,isLoading}=useQuery({queryKey:['admin','periode',id,'workflow'],queryFn:async()=>{const r=await api.get(`/admin/periode/${id}/workflow`); return (r.data?.data??r.data) as Payload;},enabled:!!id});
  const steps=(data?.workflow?.steps?.length?data.workflow.steps:data?.base_workflow?.steps?.length?data.base_workflow.steps:DEFAULT) as Step[];
  const save=useMutation({mutationFn:(workflow:{steps:Step[]})=>api.put(`/admin/periode/${id}/workflow`,{workflow:{version:1,steps:workflow.steps}}),onSuccess:()=>{toast.success('Workflow periode tersimpan');qc.invalidateQueries({queryKey:['admin','periode',id,'workflow']});},onError:()=>toast.error('Gagal simpan workflow')});
  const reset=useMutation({mutationFn:()=>api.delete(`/admin/periode/${id}/workflow`),onSuccess:()=>{toast.success('Override periode direset');qc.invalidateQueries({queryKey:['admin','periode',id,'workflow']});},onError:()=>toast.error('Gagal reset workflow')});
  const update=(idx:number,patch:Partial<Step>)=>{const next=steps.map((s,i)=>i===idx?{...s,...patch}:s); save.mutate({steps:next});};
  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Link href={`/admin/periode/${id}`} className="rounded-xl border p-2"><ArrowLeft size={18}/></Link><div><h1 className="text-2xl font-black text-slate-900">Workflow Builder Periode</h1><p className="text-sm text-slate-500">{data?.name||`Periode #${id}`} • {data?.jenis_kkn?.name||'-'}</p></div></div>
      <button onClick={()=>reset.mutate()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-slate-600"><RotateCcw size={16}/> Reset Override</button>
    </div>
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Step-based workflow, bukan node bebas</p></div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">Tahap</th><th>Aktif</th><th>Wajib</th><th>Actor</th><th>Mode</th><th className="px-4">Aksi</th></tr></thead><tbody>{isLoading?<tr><td className="p-6" colSpan={6}>Loading...</td></tr>:steps.map((s,i)=><tr key={s.key} className="border-t"><td className="px-4 py-3"><p className="font-black text-slate-800">{s.label}</p><p className="text-xs text-slate-400">{s.key}</p></td><td><input type="checkbox" checked={!!s.enabled} onChange={e=>update(i,{enabled:e.target.checked})}/></td><td><input type="checkbox" checked={!!s.required} onChange={e=>update(i,{required:e.target.checked})}/></td><td><input className="w-28 rounded-lg border px-2 py-1" value={s.actor||''} onChange={e=>update(i,{actor:e.target.value})}/></td><td><input className="w-44 rounded-lg border px-2 py-1" value={s.mode||''} onChange={e=>update(i,{mode:e.target.value})}/></td><td className="px-4"><span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><Save size={12}/> auto-save</span></td></tr>)}</tbody></table></div>
    </section>
    <section className="rounded-2xl border bg-slate-950 p-4 text-xs text-slate-100"><p className="mb-2 font-black uppercase">Effective config</p><pre className="overflow-auto">{JSON.stringify(data?.effective??{},null,2)}</pre></section>
  </main>;
}
