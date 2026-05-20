"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type Workflow = { state?:string; message?:string; label?:string; ready_for_activity?:boolean; can?:Record<string,boolean>; next_steps?:string[] };
type Payload = { workflow?: Workflow };

export function WorkflowGate({ capability='ready_for_activity', children, title='Fitur Belum Dibuka' }: { capability?: string; children: React.ReactNode; title?: string }) {
  const { data, isLoading } = useQuery({ queryKey:['student','workflow-status'], queryFn: async()=>{ const r=await api.get('/student/workflow-status'); return (r.data?.data??r.data) as Payload; } });
  const wf=data?.workflow;
  const allowed = capability === 'ready_for_activity' ? wf?.ready_for_activity === true : wf?.can?.[capability] === true;
  if (isLoading) return <div className="p-6 text-sm text-slate-500">Memuat status workflow...</div>;
  if (!allowed) return <main className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-100 p-3"><Lock size={22}/></div><div><h1 className="text-xl font-black uppercase">{title}</h1><p className="mt-1 text-sm font-semibold">{wf?.message || wf?.label || 'Menunggu proses administrasi KKN selesai.'}</p></div></div>{wf?.next_steps?.length ? <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm font-semibold">{wf.next_steps.map((s,i)=><li key={i}>{s}</li>)}</ol> : null}<Link href="/mahasiswa" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white">Dashboard <ArrowRight size={16}/></Link></div></main>;
  return <>{children}</>;
}
