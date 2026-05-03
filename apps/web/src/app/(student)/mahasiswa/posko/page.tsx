'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PoskoPage() {
  const endpoints = studentEndpoints(api);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.posko,
    queryFn: async () => {
      const res = await api.get('/student/posko');
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/student/posko', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'posko'] }); toast.success('Data posko berhasil diperbarui'); },
    onError: () => toast.error('Gagal memperbarui data posko'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(new FormData(e.currentTarget));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Posko Kelompok</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nama Posko</label>
          <input name="nama_posko" defaultValue={String(data?.nama_posko || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Alamat</label>
          <textarea name="address" rows={3} defaultValue={String(data?.address || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Latitude</label>
            <input name="latitude" type="number" step="any" defaultValue={String(data?.latitude || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Longitude</label>
            <input name="longitude" type="number" step="any" defaultValue={String(data?.longitude || '')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
