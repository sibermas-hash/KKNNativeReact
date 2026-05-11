'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

export default function PoskoPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'posko'],
    queryFn: async () => { const res = await api.get('/student/posko'); return (res as unknown as { data?: unknown })?.data ?? res; },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/student/posko', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'posko'] }); toast.success('Data posko berhasil diperbarui'); },
    onError: () => toast.error('Gagal menyimpan data posko'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10">
      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><MapPin size={24} /></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Posko Kelompok</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Latitude</label><input name="latitude" type="number" step="any" defaultValue={String(data?.latitude || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Longitude</label><input name="longitude" type="number" step="any" defaultValue={String(data?.longitude || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
          </div>
          <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Link Google Maps</label><input name="gmaps_link" type="url" defaultValue={String(data?.gmaps_link || '')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" /></div>
          <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Foto Posko</label><input name="photo" type="file" accept="image/*" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2" /></div>
          <button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50">{mutation.isPending ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      </div>
    </div>
  );
}
