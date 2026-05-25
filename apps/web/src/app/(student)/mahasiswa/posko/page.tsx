'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { QUERY_KEYS } from '@sibermas/constants';
import { toast } from 'sonner';
import { MapPin, Save, Camera, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

type PoskoData = {
  id?: number;
  latitude?: string | number;
  longitude?: string | number;
  gmaps_link?: string;
  photo_url?: string;
  alamat?: string;
  contact_person?: string;
  phone?: string;
  updated_at?: string;
  kelompok?: { nama_kelompok?: string; lokasi?: { village_name?: string; full_name?: string } };
  message?: string;
};

export default function PoskoPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.posko ?? ['student', 'posko'],
    queryFn: async () => {
      const res = await studentApi.posko.show();
      const body = ((res as { data?: unknown }).data ?? res) as PoskoData;
      return body;
    },
    retry: false,
  });

  const mut = useMutation({
    mutationFn: (formData: FormData) => studentApi.posko.store(formData as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.student.posko ?? ['student', 'posko'] });
      toast.success('Data posko tersimpan');
      setPreviewSrc(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ?? 'Gagal menyimpan posko';
      toast.error(msg);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreviewSrc(URL.createObjectURL(f));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mut.mutate(new FormData(e.currentTarget));
  };

  const useGeoLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser');
      return;
    }
    toast.loading('Mendapatkan lokasi...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('geo');
        const lat = (document.querySelector('input[name="latitude"]') as HTMLInputElement | null);
        const lng = (document.querySelector('input[name="longitude"]') as HTMLInputElement | null);
        if (lat) lat.value = String(pos.coords.latitude);
        if (lng) lng.value = String(pos.coords.longitude);
        toast.success('Lokasi berhasil diambil');
      },
      () => {
        toast.dismiss('geo');
        toast.error('Gagal mengambil lokasi GPS');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Phase-blocked message
  if (data?.message) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto" />
          <h1 className="text-xl font-black text-amber-900">Posko Belum Tersedia</h1>
          <p className="text-sm text-amber-800">{data.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Posko Kelompok</h1>
            <p className="text-xs text-slate-500">
              {data?.kelompok?.nama_kelompok ?? 'Atur lokasi posko KKN Anda'}
              {data?.kelompok?.lokasi?.village_name ? ` • ${data.kelompok.lokasi.village_name}` : ''}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alamat Posko</label>
            <textarea
              name="alamat"
              defaultValue={data?.alamat ?? ''}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Jalan, RT/RW, dusun..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Latitude</label>
              <input
                name="latitude"
                type="number"
                step="any"
                defaultValue={data?.latitude ? String(data.latitude) : ''}
                className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="-7.4321..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Longitude</label>
              <input
                name="longitude"
                type="number"
                step="any"
                defaultValue={data?.longitude ? String(data.longitude) : ''}
                className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="109.2345..."
              />
            </div>
          </div>

          <button
            type="button"
            onClick={useGeoLocation}
            className="w-full h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center justify-center gap-2"
          >
            <MapPin size={14} /> Gunakan Lokasi GPS Saya
          </button>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link Google Maps</label>
            <input
              name="gmaps_link"
              type="url"
              defaultValue={data?.gmaps_link ?? ''}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="https://maps.app.goo.gl/..."
            />
            {data?.gmaps_link && (
              <a
                href={data.gmaps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold mt-1 inline-flex items-center gap-1"
              >
                <ExternalLink size={10} /> Buka di Google Maps
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Person</label>
              <input
                name="contact_person"
                defaultValue={data?.contact_person ?? ''}
                className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Nama PIC"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">No HP / WA</label>
              <input
                name="phone"
                defaultValue={data?.phone ?? ''}
                className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="08xxx"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Camera size={12} /> Foto Posko
            </label>
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:px-3 file:py-1.5 file:text-xs file:font-bold"
            />
            {(previewSrc || data?.photo_url) && (
              <div className="mt-3">
                <img
                  src={previewSrc ?? data?.photo_url}
                  alt="Foto posko"
                  className="rounded-xl border border-slate-200 max-h-64 object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} />}
            {mut.isPending ? 'Menyimpan...' : 'Simpan Posko'}
          </button>

          {data?.updated_at && (
            <p className="text-xs text-slate-400 text-center">
              Terakhir diupdate {new Date(data.updated_at).toLocaleString('id-ID')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
