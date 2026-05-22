'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDailyReportSchema, type CreateDailyReportFormData } from '@sibermas/schemas';
import { useCreateDailyReport } from '@sibermas/hooks';
import { api } from '@/lib/api';
import { ChevronLeft, Navigation, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateDailyReportPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateDailyReport(api);
  const [files, setFiles] = useState<File[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateDailyReportFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createDailyReportSchema) as any,
    defaultValues: { 
      date: new Date().toISOString().split('T')[0], 
      captured_at: new Date().toISOString(),
      location_source: 'manual' 
    },
  });

  const getGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation tidak tersedia di browser ini');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        setValue('gps_accuracy', pos.coords.accuracy);
        setValue('captured_at', new Date().toISOString());
        setValue('location_source', 'gps');
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success(`GPS Berhasil: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => { setGpsLoading(false); toast.error('Gagal mendapatkan lokasi: ' + err.message); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const onSubmit = (data: CreateDailyReportFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined && value !== null) formData.append(key, String(value)); });
    files.forEach((file) => formData.append('files', file));
    mutation.mutate(formData, {
      onSuccess: () => {
        // Invalidate list & student dashboard caches so the new report
        // appears immediately when user navigates back. FE-Q1 re-audit fix.
        queryClient.invalidateQueries({ queryKey: ['student', 'daily-reports'] });
        queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
        toast.success('Laporan harian berhasil dikirim!');
        router.push('/mahasiswa/laporan-harian');
      },
      onError: () => toast.error('Gagal mengirim laporan'),
    });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 mb-6">
        <ChevronLeft size={16} /> Kembali
      </button>

      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><CloudUpload size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight uppercase">Buat Laporan Harian</h1>
            <p className="text-sm text-slate-400">Isi kegiatan hari ini</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Tanggal</label>
            <input {...register('date')} type="date" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
            {errors.date && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Judul Kegiatan</label>
            <input {...register('title')} placeholder="Judul kegiatan hari ini" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
            {errors.title && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kategori Kegiatan</label>
              <select {...register('category')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500">
                <option value="">-- Pilih Kategori --</option>
                <option value="shilaturrahmi">Shilaturrahmi</option>
                <option value="program_unggulan">Program Unggulan</option>
                <option value="program_pendukung">Program Pendukung</option>
                <option value="administrasi">Administrasi</option>
              </select>
              {errors.category && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Tahap ABCD</label>
              <select {...register('abcd_stage')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500">
                <option value="">-- Pilih Tahap ABCD --</option>
                <option value="discovery">Discovery (Menemukan)</option>
                <option value="dream">Dream (Mimpi)</option>
                <option value="design">Design (Merancang)</option>
                <option value="define">Define (Menentukan)</option>
                <option value="destiny">Destiny (Melakukan)</option>
                <option value="reflection">Reflection (Refleksi)</option>
              </select>
              {errors.abcd_stage && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.abcd_stage.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Deskripsi Kegiatan</label>
            <textarea {...register('activity')} rows={5} placeholder="Jelaskan kegiatan yang dilakukan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
            {errors.activity && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.activity.message}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Refleksi</label>
            <textarea {...register('reflection')} rows={3} placeholder="Apa yang dipelajari hari ini?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
          </div>

          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Lokasi GPS</label>
            <button type="button" onClick={getGPS} disabled={gpsLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold mt-2 disabled:opacity-50">
              <Navigation size={16} /> {gpsLoading ? 'Mengambil lokasi...' : gpsCoords ? `📍 ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}` : '📍 Gunakan Lokasi Saya'}
            </button>
            <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
            <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
            <input type="hidden" {...register('gps_accuracy', { valueAsNumber: true })} />
            <input type="hidden" {...register('captured_at')} />
            {errors.latitude && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.latitude.message}</p>}
          </div>
          
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Nama Tempat/Lokasi</label>
            <input {...register('location_name')} placeholder="Contoh: Balai Desa, Posko, SD Negeri 1" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
            {errors.location_name && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.location_name.message}</p>}
          </div>

          <input type="hidden" {...register('location_source')} />

          <div>
            <label htmlFor="attachments" className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Lampiran</label>
            <input 
              id="attachments"
              title="Pilih file lampiran"
              type="file" 
              multiple 
              accept=".jpg,.jpeg,.png,.pdf" 
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 10) { toast.error('Maksimal 10 file'); e.target.value = ''; return; }
                if (selected.some(f => f.size > 10 * 1024 * 1024)) { toast.error('Setiap file maksimal 10MB'); e.target.value = ''; return; }
                setFiles(selected);
              }} 
              className="w-full text-sm text-slate-500 mt-2 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-700" 
            />
          </div>

          <button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-50">
            {mutation.isPending ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
}
