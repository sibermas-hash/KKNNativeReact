'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDailyReportSchema, type CreateDailyReportFormData } from '@sibermas/schemas';
import { useCreateDailyReport } from '@sibermas/hooks';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateDailyReportPage() {
  const router = useRouter();
  const mutation = useCreateDailyReport(api);
  const [files, setFiles] = useState<File[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateDailyReportFormData>({
    resolver: zodResolver(createDailyReportSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], captured_at: new Date().toISOString() },
  });

  const getGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        setValue('gps_accuracy', pos.coords.accuracy);
        setValue('captured_at', new Date().toISOString());
        setGpsLoading(false);
        toast.success(`GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        setGpsLoading(false);
        toast.error('Gagal mendapatkan lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const onSubmit = (data: CreateDailyReportFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });
    files.forEach((file) => formData.append('files[]', file));

    mutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Laporan harian berhasil dikirim!');
        router.push('/mahasiswa/laporan-harian');
      },
      onError: () => toast.error('Gagal mengirim laporan'),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Buat Laporan Harian</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal</label>
          <input {...register('date')} type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul Kegiatan</label>
          <input {...register('title')} type="text" placeholder="Judul kegiatan hari ini" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi Kegiatan</label>
          <textarea {...register('activity')} rows={5} placeholder="Jelaskan kegiatan yang dilakukan..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          {errors.activity && <p className="mt-1 text-xs text-red-500">{errors.activity.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Refleksi</label>
          <textarea {...register('reflection')} rows={3} placeholder="Apa yang dipelajari hari ini?" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Lokasi GPS</label>
          <button type="button" onClick={getGPS} disabled={gpsLoading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {gpsLoading ? 'Mengambil lokasi...' : '📍 Ambil Lokasi GPS'}
          </button>
          <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('gps_accuracy', { valueAsNumber: true })} />
          <input type="hidden" {...register('captured_at')} />
          {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Lampiran</label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {mutation.isPending ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
