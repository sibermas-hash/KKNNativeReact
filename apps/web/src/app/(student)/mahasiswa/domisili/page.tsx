'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

export default function DomisiliPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'domisili'],
    queryFn: async () => { const res = await api.get('/student/domisili'); return (res.data as { success: boolean; data: Record<string, unknown> }).data; },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/student/domisili', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'domisili'] }); toast.success('Data domisili berhasil diperbarui'); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10">
      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><MapPin size={24} /></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Domisili</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }} className="space-y-6">
          <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Alamat Lengkap</label><textarea name="domisili_address" rows={3} defaultValue={String(data?.domisili_address || '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Desa/Kelurahan</label><input name="domisili_village" defaultValue={String(data?.domisili_village || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kecamatan</label><input name="domisili_district" defaultValue={String(data?.domisili_district || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kabupaten/Kota</label><input name="domisili_regency" defaultValue={String(data?.domisili_regency || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Provinsi</label><input name="domisili_province" defaultValue={String(data?.domisili_province || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50">{mutation.isPending ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      </div>
    </div>
  );
}
