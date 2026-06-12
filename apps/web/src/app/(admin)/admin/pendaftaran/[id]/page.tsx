'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/ui/shared';
import { ArrowLeft, CheckCircle2, Download, Mail, Phone, XCircle, AlertTriangle } from 'lucide-react';

const REVIEWABLE = ['pending', 'document_submitted', 'document_verified'];
type Doc = { id:number; document_type?:string; file_path?:string; file_name?:string; status?:string; notes?:string; is_verified?:boolean; verified_at?:string; uploaded_at?:string };
type SummaryItem = { field?:string; label?:string; required?:boolean; uploaded?:boolean; file_name?:string; file_path?:string; is_verified?:boolean };
type Registration = { id:number; periode_id?:number; status?:string; role?:string; notes?:string|null; rejection_reason?:string|null; registration_date?:string; approved_at?:string|null; revision_count?:number; joined_group_at?:string|null; mahasiswa?: { nama?:string; nim?:string; external_nim?:string; nik?:string; mother_name?:string; gender?:string; birth_place?:string; birth_date?:string; marital_status?:string; batch_year?:number; semester?:number; sks_completed?:number; gpa?:number; status_bta_ppi?:string; is_paid_ukt?:boolean; status_aktif?:string; shirt_size?:string; phone?:string; alamat?:string; profile_completion?:number; external_faculty_name?:string; external_prodi_name?:string; external_university?:{name?:string; code?:string}; fakultas?:{nama?:string; code?:string}; faculty?:{nama?:string; code?:string}; prodi?:{nama?:string; code?:string}; user?:{avatar_url?:string; avatar?:string; email?:string; is_active?:boolean; password_changed_at?:string; last_login_at?:string|null} }; periode?: { name?:string; periode?:number; start_date?:string; end_date?:string; registration_start?:string; registration_end?:string; phase_label?:string; kuota?:number; jenis_kkn?: { name?:string; code?:string; registration_mode_label?:string; placement_mode_label?:string; description?:string; requirements_config?:Record<string,unknown> } }; kelompok?: { nama_kelompok?:string }; documents?:Doc[]; document_summary?:{uploaded_count?:number; required_count?:number; missing_required_count?:number; items?:SummaryItem[]} };

const fmt = (v?:string|null) => v ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium', timeStyle:'short'}).format(new Date(v)) : '-';
const dateOnly = (v?:string|null) => v ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(new Date(v)) : '-';
const yn = (v?:boolean) => v ? 'Ya' : 'Tidak';
const gender = (v?:string) => v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : (v || '-');
const docLabel = (field?: string, label?: string) => field === 'health_certificate' || label === 'health_certificate' ? 'Surat Keterangan Sehat' : field === 'parent_permission' || label === 'parent_permission' ? 'Surat Izin Orang Tua/Wali' : (label || field || 'Dokumen');
const labelDoc = (d:Doc) => docLabel(d.document_type, d.file_name);
function Info({label,value,wide=false}:{label:string; value?:unknown; wide?:boolean}){ return <div className={`rounded-xl bg-slate-50 p-3 ${wide?'md:col-span-2 xl:col-span-3':''}`}><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{String(value ?? '-')}</p></div>; }

function extractBlob(payload: Blob | { data?: Blob }): Blob {
  if (payload instanceof Blob) {
    return payload;
  }

  if (payload.data instanceof Blob) {
    return payload.data;
  }

  throw new Error('Dokumen tidak berbentuk blob.');
}

export default function RegistrationDetailPage(): React.JSX.Element {
  const params = useParams(); const router = useRouter(); const id = Number(params?.id); const qc = useQueryClient();
  const [rejectOpen,setRejectOpen]=useState(false); const [reason,setReason]=useState('');
  const [previewUrl,setPreviewUrl]=useState<string|null>(null);
  const [previewName,setPreviewName]=useState('');
  const {data,isLoading,isError,refetch}=useQuery<Registration>({queryKey:['admin','pendaftaran',id], queryFn:async()=>{const res=await adminApi.registrations.show(id); return res as unknown as Registration;}, enabled:Number.isFinite(id)&&id>0});
  const approveMutation=useMutation({mutationFn:()=>adminApi.registrations.approve(id), onSuccess:()=>{qc.invalidateQueries({queryKey:['admin','pendaftaran',id]}); toast.success('Pendaftaran disetujui');}, onError:(e:unknown)=>toast.error((e as {response?:{data?:{error?:{message?:string}}}})?.response?.data?.error?.message ?? 'Gagal menyetujui')});
  const rejectMutation=useMutation({mutationFn:()=>adminApi.registrations.reject(id,{rejection_reason:reason}), onSuccess:()=>{setRejectOpen(false); setReason(''); qc.invalidateQueries({queryKey:['admin','pendaftaran',id]}); toast.success('Pendaftaran ditolak');}, onError:(e:unknown)=>toast.error((e as {response?:{data?:{error?:{message?:string}}}})?.response?.data?.error?.message ?? 'Gagal menolak')});
  const downloadDoc=async(doc:Doc)=>{ if(!doc.file_path) return; try{const res=await adminApi.registrations.downloadDocument(doc.file_path); const url=URL.createObjectURL(extractBlob(res as Blob | {data?:Blob})); const a=document.createElement('a'); a.href=url; a.download=doc.file_name || doc.file_path.split('/').pop() || 'dokumen'; a.click(); URL.revokeObjectURL(url);}catch{toast.error('Gagal mengunduh dokumen');}};
  const previewDoc=async(doc:Doc)=>{ if(!doc.file_path) return; try{const res=await adminApi.registrations.downloadDocument(doc.file_path); const blob=extractBlob(res as Blob | {data?:Blob}); if(previewUrl) URL.revokeObjectURL(previewUrl); const url=URL.createObjectURL(blob); setPreviewUrl(url); setPreviewName(doc.file_name || labelDoc(doc));}catch{toast.error('Gagal memuat preview');}};
  const closePreview=()=>{ if(previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewName(''); };
  if(isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200"/>;
  if(isError) return <div className="space-y-3 text-center"><p className="font-bold text-rose-600">Gagal memuat detail</p><button onClick={()=>refetch()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Coba Lagi</button></div>;
  if(!data) return <div className="text-center text-slate-500">Pendaftaran tidak ditemukan</div>;
  const m=data.mahasiswa; const p=data.periode;
  const displayNim = m?.external_nim || m?.nim || '-';
  const displayFaculty = m?.external_faculty_name || m?.fakultas?.nama || m?.faculty?.nama || '-';
  const displayProdi = m?.external_prodi_name || m?.prodi?.nama || '-';
  const avatarSrc = m?.user?.avatar_url || (m?.user?.avatar ? `/storage/${m.user.avatar}` : '/images/Logo_SIBERMAS.png'); const docs=data.documents??[]; const reviewable=REVIEWABLE.includes(data.status||'');
  const requiredDocs = data.document_summary?.items?.filter((i) => i.required) ?? [];
  const unverifiedRequired = requiredDocs.filter((i) => i.uploaded && !i.is_verified);
  const missingRequired = data.document_summary?.missing_required_count ?? 0;
  const isApproved = data.status === 'approved';
  return <div className="space-y-5">
    <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-800 p-6 text-white shadow-sm">
      <button onClick={()=>router.push('/admin/pendaftaran')} className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-100 hover:text-white"><ArrowLeft size={14}/> Kembali</button>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <img src={avatarSrc} alt="Foto profil mahasiswa" className="h-24 w-24 rounded-3xl object-cover shadow-xl ring-4 ring-white/15"/>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">Audit Pendaftaran #{data.id}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{m?.nama||'-'}</h1>
            <p className="mt-1 font-mono text-sm text-cyan-50">{displayNim} • {displayFaculty}</p>
            <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={data.status||'-'}/><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-white/15">{p?.jenis_kkn?.name||'Jenis KKN -'}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-white/15">{data.kelompok?.nama_kelompok || 'Belum Kelompok'}</span></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{reviewable&&<><button onClick={()=>approveMutation.mutate()} disabled={approveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-400 disabled:opacity-50"><CheckCircle2 size={16}/> Setujui</button><button onClick={()=>setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-black text-white hover:bg-rose-400"><XCircle size={16}/> Tolak</button></>}</div>
      </div>
    </div>

    {(isApproved && (missingRequired > 0 || unverifiedRequired.length > 0)) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><div><p className="font-black">Perhatian dokumen</p><p className="mt-1">Approved, tetapi dokumen wajib masih bermasalah: {missingRequired} kurang, {unverifiedRequired.length} belum verified.</p></div></div></div>}
    {(isApproved && !data.kelompok) && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><div><p className="font-black">Belum ditempatkan</p><p className="mt-1">Peserta sudah approved tetapi belum masuk kelompok. Lanjutkan ke proses penempatan.</p><Link href={`/admin/kelompok?periode_id=${data.periode_id}`} className="mt-3 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-cyan-700">Buka Penempatan</Link></div></div></div>}

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-900">Profil & Akademik</h2><p className="text-sm text-slate-500">Identitas, kontak dasar, syarat akademik.</p></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">Profil {m?.profile_completion ?? '-'}%</span></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Info label="NIK" value={m?.nik}/><Info label="Ibu Kandung" value={m?.mother_name}/><Info label="Gender" value={gender(m?.gender)}/><Info label="TTL" value={`${m?.birth_place||'-'}, ${dateOnly(m?.birth_date)}`}/><Info label="Status Nikah" value={m?.marital_status}/><Info label="Ukuran Baju" value={m?.shirt_size}/><Info label="Angkatan" value={m?.batch_year}/><Info label="Prodi" value={displayProdi}/><Info label="Universitas Asal" value={m?.external_university?.name}/><Info label="Semester" value={m?.semester}/><Info label="SKS" value={m?.sks_completed}/><Info label="IPK" value={m?.gpa}/><Info label="BTA/PPI" value={m?.status_bta_ppi}/><Info label="UKT Lunas" value={yn(m?.is_paid_ukt)}/><Info label="Status Akademik" value={m?.status_aktif}/><Info label="Akun Aktif" value={yn(m?.user?.is_active)}/><Info label="Alamat" value={m?.alamat} wide/></div></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-black text-slate-900">Program KKN</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Info label="Periode" value={p?.name}/><Info label="Jenis" value={`${p?.jenis_kkn?.name||'-'} (${p?.jenis_kkn?.code||'-'})`}/><Info label="Fase" value={p?.phase_label}/><Info label="Jadwal KKN" value={`${dateOnly(p?.start_date)} - ${dateOnly(p?.end_date)}`}/><Info label="Pendaftaran" value={`${fmt(p?.registration_start)} - ${fmt(p?.registration_end)}`}/><Info label="Kuota" value={p?.kuota}/><Info label="Mode Daftar" value={p?.jenis_kkn?.registration_mode_label}/><Info label="Penempatan" value={p?.jenis_kkn?.placement_mode_label}/><Info label="Role" value={data.role || 'Anggota'}/></div></div>
        {(data.notes||data.rejection_reason||data.approved_at)&&<div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="font-black text-slate-900">Riwayat/Catatan</h2><div className="mt-3 grid gap-3 md:grid-cols-3"><Info label="Diajukan" value={fmt(data.registration_date)}/><Info label="Disetujui" value={fmt(data.approved_at)}/><Info label="Revisi" value={data.revision_count ?? 0}/><Info label="Alasan Tolak" value={data.rejection_reason||'-'}/><Info label="Catatan" value={data.notes||'-'} wide/></div></div>}
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-black text-slate-900">Kontak</h2><p className="mt-3 flex items-center gap-2 text-sm"><Mail size={16} className="text-slate-400"/> {m?.user?.email||'-'}</p><p className="mt-2 flex items-center gap-2 text-sm"><Phone size={16} className="text-slate-400"/> {m?.phone||'-'}</p></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-900">Dokumen</h2><p className="text-sm text-slate-500">{data.document_summary?.uploaded_count??docs.length}/{data.document_summary?.required_count??docs.length} uploaded • {data.document_summary?.missing_required_count??0} kurang</p></div></div>{data.document_summary?.items?.length?<div className="mt-4 space-y-3">{data.document_summary.items.map(i=>{ const matchDoc = docs.find(d => d.document_type === i.field || d.file_name === i.file_name || d.file_path === i.file_path) || (i.file_path ? { id: -1, document_type: i.field, file_path: i.file_path, file_name: i.file_name } : undefined); return <button key={i.field||i.label} type="button" onClick={() => matchDoc && previewDoc(matchDoc)} disabled={!i.uploaded || !matchDoc} className={`w-full rounded-xl border p-4 text-left transition ${i.uploaded && matchDoc ? 'border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-800">{docLabel(i.field, i.label)}</p><p className="mt-1 text-xs text-slate-500">{i.file_name || (i.uploaded ? 'File tersedia' : 'Belum upload')}</p></div><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${i.is_verified ? 'bg-cyan-50 text-cyan-700' : i.uploaded ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{i.is_verified?'Verified':i.uploaded?'Pending':'Missing'}</span></div>{i.uploaded&&matchDoc&&<p className="mt-3 text-[10px] font-black uppercase tracking-wider text-cyan-600">Klik untuk preview</p>}</button>; })}</div>:<p className="mt-4 text-sm text-slate-500">Belum ada ringkasan dokumen.</p>}{docs.length>0&&<div className="mt-4 space-y-2 border-t border-slate-100 pt-4">{docs.map(doc=><div key={`${doc.id}-${doc.file_path||doc.document_type||'dokumen'}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-xs font-black text-slate-700">{labelDoc(doc)}</p><p className="truncate text-[10px] text-slate-500">{doc.file_name||doc.file_path}</p></div><div className="flex gap-1"><button onClick={()=>previewDoc(doc)} disabled={!doc.file_path} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40">Preview</button><button onClick={()=>downloadDoc(doc)} disabled={!doc.file_path} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40"><Download size={12}/></button></div></div>)}</div>}</div>
      </aside>
    </section>

    {rejectOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 className="font-black text-slate-900">Tolak Pendaftaran</h3><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} placeholder="Alasan penolakan..." className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"/><div className="mt-4 flex gap-3"><button onClick={()=>setRejectOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-black">Batal</button><button onClick={()=>rejectMutation.mutate()} disabled={!reason.trim()||rejectMutation.isPending} className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-black text-white disabled:opacity-50">Tolak</button></div></div></div>}
    {previewUrl&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" onClick={closePreview}><div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3 className="truncate text-sm font-black text-slate-900">{previewName}</h3><button onClick={closePreview} className="rounded-lg px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">&times; Tutup</button></div><div className="flex-1 overflow-hidden p-2">{previewUrl.includes('.pdf') || previewName.toLowerCase().endsWith('.pdf') ? <iframe src={previewUrl} className="h-full w-full rounded-lg" title="Preview"/> : <img src={previewUrl} alt={previewName} className="h-full w-full object-contain rounded-lg"/>}</div></div></div>}
  </div>;
}
