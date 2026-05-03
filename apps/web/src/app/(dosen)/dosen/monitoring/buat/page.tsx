'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateMonitoringPage() {
  const router = useRouter();
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FormData) => endpoints.monitoring.store(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'monitoring'] }); toast.success('Kunjungan tercatat'); router.push('/dosen/monitoring'); },
    onError: () => toast.error('Gagal mencatat kunjungan'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        formData.append('latitude', String(pos.coords.latitude));
        formData.append('longitude', String(pos.coords.longitude));
        mutation.mutate(formData);
      },
      () => mutation.mutate(formData),
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Catat Kunjungan Monitoring</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Kunjungan</label>
          <input name="visit_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan</label>
          <textarea name="notes" rows={5} required placeholder="Jelaskan hasil kunjungan..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Foto (opsional)</label>
          <input name="photo" type="file" accept=".jpg,.jpeg,.png" className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Kunjungan'}
        </button>
      </form>
    </div>
  );
}
