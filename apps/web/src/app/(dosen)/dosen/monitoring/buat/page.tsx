'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/shared';

type Group = { id: number; name: string; code: string };

export default function CreateMonitoringPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: groupsData } = useQuery({
    queryKey: ['dpl', 'groups'],
    queryFn: async () => {
      const res = await dplApi.groups.index() as any;
      return (res?.groups ?? res?.data?.groups ?? []) as Group[];
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => dplApi.monitoring.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dpl', 'monitoring'] });
      toast.success('Kunjungan tercatat');
      router.push('/dosen/monitoring');
    },
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
      <PageHeader title="Catat Kunjungan Monitoring" />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Kelompok</label>
          <select
            name="kelompok_id"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- Pilih Kelompok --</option>
            {(groupsData ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Kunjungan</label>
          <input
            name="visit_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan</label>
          <textarea
            name="notes"
            rows={5}
            required
            placeholder="Jelaskan hasil kunjungan..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Foto (opsional)</label>
          <input
            name="photo"
            type="file"
            accept=".jpg,.jpeg,.png"
            className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Kunjungan'}
        </button>
      </form>
    </div>
  );
}
