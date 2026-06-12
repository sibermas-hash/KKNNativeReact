'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BackButton, PageHeader } from '@/components/ui/shared';

type Group = { id: number; name: string; code: string };

export default function CreateMonitoringPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: groupsData } = useQuery({
    queryKey: ['dpl', 'groups'],
    queryFn: async () => {
      const res = await dplApi.groups.index() as unknown as { groups?: Group[]; data?: { groups?: Group[] } };
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
      <BackButton href="/dosen/monitoring" label="Kembali ke Monitoring" />
      <PageHeader title="Catat Kunjungan Monitoring" />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--profile-text)]">Kelompok</label>
          <select
            name="kelompok_id"
            required
            className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-3 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]"
          >
            <option value="" className="bg-[color:var(--profile-surface)] text-[color:var(--profile-text)]">-- Pilih Kelompok --</option>
            {(groupsData ?? []).map((g) => (
              <option key={g.id} value={g.id} className="bg-[color:var(--profile-surface)] text-[color:var(--profile-text)]">
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--profile-text)]">Tanggal Kunjungan</label>
          <input
            name="visit_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-3 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--profile-text)]">Catatan</label>
          <textarea
            name="notes"
            rows={5}
            required
            placeholder="Jelaskan hasil kunjungan..."
            className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-3 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--profile-text)]">Foto (opsional)</label>
          <input
            name="photo"
            type="file"
            accept=".jpg,.jpeg,.png"
            className="w-full text-sm text-[color:var(--profile-muted)] file:mr-4 file:rounded-xl file:border file:border-[color:var(--profile-border)] file:bg-[color:var(--profile-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--profile-text)] file:hover:bg-[color:var(--profile-soft)]/85 file:transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-[color:var(--profile-primary)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Kunjungan'}
        </button>
      </form>
    </div>
  );
}
