'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DomisiliPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'domisili'],
    queryFn: async () => {
      const res = await api.get('/student/domisili');
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/student/domisili', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'domisili'] }); toast.success('Data domisili berhasil diperbarui'); },
    onError: () => toast.error('Gagal memperbarui data domisili'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(new FormData(e.currentTarget));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Domisili</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Alamat Lengkap</label>
          <textarea name="domisili_address" rows={3} defaultValue={String(data?.domisili_address || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Desa/Kelurahan</label>
            <input name="domisili_village" defaultValue={String(data?.domisili_village || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kecamatan</label>
            <input name="domisili_district" defaultValue={String(data?.domisili_district || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kabupaten/Kota</label>
            <input name="domisili_regency" defaultValue={String(data?.domisili_regency || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Provinsi</label>
            <input name="domisili_province" defaultValue={String(data?.domisili_province || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
