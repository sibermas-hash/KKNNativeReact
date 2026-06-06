'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { FileCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Letter = { id:number; letter_number?:string; subject?:string; status:string; notes?:string; external_university?: { name:string }; participants_count?:number };

export default function AdminCollaborationLettersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({ queryKey:['admin','collaboration-letters',status], queryFn: async () => ((await api.get('/admin/collaboration-letters', { params: { status: status || undefined } })) as Letter[]) ?? [] });

  const action = useMutation({
    mutationFn: ({ id, kind }: { id:number; kind:'verify'|'reject' }) => api.post(`/admin/collaboration-letters/${id}/${kind}`, kind === 'reject' ? { notes: prompt('Alasan penolakan') || 'Ditolak' } : {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['admin','collaboration-letters'] }); toast.success('Status surat diperbarui'); },
    onError: () => toast.error('Gagal memperbarui status'),
  });

  const rows = data ?? [];
  return <div className="space-y-6">
    <PageHeader title="Surat Kolaborasi" subtitle="Verifikasi surat permohonan KKN kampus luar" />
    <div><select value={status} onChange={(e)=>setStatus(e.target.value)} className="h-10 rounded-xl border px-3 bg-transparent text-sm"><option value="">Semua status</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></div>
    <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] overflow-hidden">
      <table className="w-full text-sm"><thead className="bg-[color:var(--profile-soft)]"><tr><th className="p-3 text-left">Surat</th><th className="p-3 text-left">Kampus</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Peserta</th><th className="p-3"/></tr></thead><tbody>
        {isLoading ? <tr><td className="p-4" colSpan={5}>Loading...</td></tr> : rows.map((l) => <tr key={l.id} className="border-t border-[color:var(--profile-border)]"><td className="p-3"><div className="font-bold flex gap-2"><FileCheck size={16}/>{l.letter_number || `#${l.id}`}</div><div className="text-xs opacity-70">{l.subject || '-'}</div>{l.notes && <div className="text-xs text-red-500">{l.notes}</div>}</td><td className="p-3">{l.external_university?.name || '-'}</td><td className="p-3 font-bold">{l.status}</td><td className="p-3">{l.participants_count ?? 0}</td><td className="p-3 text-right"><button onClick={()=>action.mutate({ id:l.id, kind:'verify' })} className="p-2 text-green-600"><CheckCircle2 size={18}/></button><button onClick={()=>action.mutate({ id:l.id, kind:'reject' })} className="p-2 text-red-600"><XCircle size={18}/></button></td></tr>)}
      </tbody></table>
    </div>
  </div>;
}
