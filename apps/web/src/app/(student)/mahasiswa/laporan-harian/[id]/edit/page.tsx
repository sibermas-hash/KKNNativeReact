'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editDailyReportSchema, type EditDailyReportFormData } from '@sibermas/schemas';
import { ChevronLeft, Navigation } from 'lucide-react';
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

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">Laporan tidak ditemukan</div>;

  const onSubmit = (formData: EditDailyReportFormData) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => { if (value !== undefined && value !== null) fd.append(key, String(value)); });
    updateMutation.mutate(fd);
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 mb-6">
        <ChevronLeft size={16} /> Kembali
      </button>

      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
        <h1 className="text-2xl font-black text-emerald-950 tracking-tight uppercase mb-8">Edit Laporan Harian</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Tanggal</label>
            <input {...register('date')} type="date" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" />
          </div>
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Judul</label>
            <input {...register('title')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" />
          </div>
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kegiatan</label>
            <textarea {...register('activity')} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2" />
          </div>
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Refleksi</label>
            <textarea {...register('reflection')} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2" />
          </div>
          <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('captured_at')} />
          <div className="flex gap-3">
            <button type="submit" disabled={updateMutation.isPending} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50">
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button type="button" onClick={() => router.back()} className="h-12 px-6 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
