'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editDailyReportSchema, type EditDailyReportFormData } from '@sibermas/schemas';
import toast from 'react-hot-toast';

export default function EditDailyReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const endpoints = studentEndpoints(api);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'daily-report', Number(id)],
    queryFn: async () => {
      const res = await endpoints.dailyReports.show(Number(id));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => endpoints.dailyReports.update(Number(id), formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'daily-reports'] }); toast.success('Laporan berhasil diperbarui'); router.push('/mahasiswa/laporan-harian'); },
    onError: () => toast.error('Gagal memperbarui laporan'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<EditDailyReportFormData>({
    resolver: zodResolver(editDailyReportSchema),
    values: data ? { date: String(data.date || ''), title: String(data.title || ''), activity: String(data.activity || ''), reflection: String(data.reflection || ''), latitude: Number(data.latitude || 0), longitude: Number(data.longitude || 0), captured_at: String(data.captured_at || '') } : undefined,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Laporan tidak ditemukan</div>;

  const onSubmit = (formData: EditDailyReportFormData) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => { if (value !== undefined && value !== null) fd.append(key, String(value)); });
    updateMutation.mutate(fd);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Edit Laporan Harian</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div><label className="mb-1.5 block text-sm font-medium">Tanggal</label><input {...register('date')} type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />{errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}</div>
        <div><label className="mb-1.5 block text-sm font-medium">Judul</label><input {...register('title')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />{errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}</div>
        <div><label className="mb-1.5 block text-sm font-medium">Kegiatan</label><textarea {...register('activity')} rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />{errors.activity && <p className="mt-1 text-xs text-red-500">{errors.activity.message}</p>}</div>
        <div><label className="mb-1.5 block text-sm font-medium">Refleksi</label><textarea {...register('reflection')} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></div>
        <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
        <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
        <input type="hidden" {...register('captured_at')} />
        <div className="flex gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50">{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700">Batal</button>
        </div>
      </form>
    </div>
  );
}
