'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editDailyReportSchema, type EditDailyReportFormData } from '@sibermas/schemas';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS, FIELD_CLASS } from '@/lib/theme-config';

export default function EditDailyReportPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'daily-reports', Number(id)],
    queryFn: async () => {
      const res = await studentApi.dailyReports.show(Number(id));
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => studentApi.dailyReports.update(Number(id), formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'daily-reports'] });
      toast.success('Laporan berhasil diperbarui');
      router.push('/mahasiswa-v2/laporan-harian');
    },
    onError: () => toast.error('Gagal memperbarui laporan'),
  });

  const { register, handleSubmit } = useForm<EditDailyReportFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editDailyReportSchema) as any,
    values: data ? { date: String(data.date || ''), title: String(data.title || ''), activity: String(data.activity || ''), reflection: String(data.reflection || ''), latitude: Number(data.latitude || 0), longitude: Number(data.longitude || 0), captured_at: String(data.captured_at || '') } as unknown as EditDailyReportFormData : undefined,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--profile-primary)] border-t-transparent" /></div>;
  if (!data) return <div className="text-center py-20 text-[color:var(--profile-muted)] font-medium">Laporan tidak ditemukan</div>;

  const onSubmit = (formData: EditDailyReportFormData) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => { if (value !== undefined && value !== null) fd.append(key, String(value)); });
    updateMutation.mutate(fd);
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-[color:var(--profile-muted)] hover:text-[color:var(--profile-primary)] mb-6 transition-colors">
        <ChevronLeft size={16} /> Kembali
      </button>

      <div 
        className={`p-8 border border-[color:var(--profile-border)] ${surfaceClass} ${themeConfig.shadow}`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase mb-8">Edit Laporan Harian</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest ml-1">Tanggal</label>
            <input {...register('date')} type="date" className={`w-full h-12 rounded-xl px-4 text-sm font-bold mt-2 border ${FIELD_CLASS}`} />
          </div>
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest ml-1">Judul</label>
            <input {...register('title')} className={`w-full h-12 rounded-xl px-4 text-sm font-bold mt-2 border ${FIELD_CLASS}`} />
          </div>
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest ml-1">Kegiatan</label>
            <textarea {...register('activity')} rows={5} className={`w-full rounded-xl px-4 py-3 text-sm font-bold mt-2 border ${FIELD_CLASS}`} />
          </div>
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest ml-1">Refleksi</label>
            <textarea {...register('reflection')} rows={3} className={`w-full rounded-xl px-4 py-3 text-sm font-bold mt-2 border ${FIELD_CLASS}`} />
          </div>
          <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('captured_at')} />
          <div className="flex gap-3">
            <button type="submit" disabled={updateMutation.isPending} className={`flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50 ${PRIMARY_CLASS}`}>
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button type="button" onClick={() => router.back()} className={`h-12 px-6 rounded-xl font-bold text-sm border ${SOFT_CLASS}`}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

