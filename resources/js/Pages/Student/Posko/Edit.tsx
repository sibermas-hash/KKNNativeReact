import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type ChangeEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';

interface Props extends PageProps {
 isLeader: boolean;
 group: {
 id: number;
 code: string;
 name: string;
 location: {
 full_name: string;
 village_name: string;
 district_name?: string | null;
 regency_name?: string | null;
 } | null;
 };
 posko: {
 id: number;
 latitude: number | null;
 longitude: number | null;
 gmaps_link: string | null;
 photo_url: string | null;
 photo_name: string | null;
 updated_at: string | null;
 uploaded_by: string | null;
 } | null;
}

export default function StudentPoskoEdit({ isLeader, group, posko }: Props) {
 const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
 const form = useForm({
 latitude: posko?.latitude ? String(posko.latitude) : '',
 longitude: posko?.longitude ? String(posko.longitude) : '',
 gmaps_link: posko?.gmaps_link ?? '',
 photo: null as File | null,
 });

 const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0] ?? null;
 form.setData('photo', file);
 setSelectedFileName(file?.name ?? null);
 };

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post(route('student.posko.store'), {
 forceFormData: true,
 });
 };

 return (
 <AppLayout title="Lokasi Posko">
 <Head title="Lokasi Posko" />

 <div className="mx-auto max-w-5xl space-y-6">
 <section className="rounded-lg border border-gray-200/60 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <Link
 href={route('student.dashboard')}
 className="inline-flex items-center rounded-lg border border-gray-200/60 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
 >
 Kembali ke dasbor
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-black">Data Posko Kelompok</h1>
 <p className="mt-2 text-sm text-gray-900">
 {group.name} · {group.location?.full_name || group.location?.village_name || 'Lokasi belum tersedia'}
 </p>
 </div>
 <span className="inline-flex rounded-full bg-emerald-50/60 px-3 py-1 text-xs font-semibold text-gray-700">
 {isLeader ? 'Ketua kelompok' : 'Anggota kelompok'}
 </span>
 </div>
 </section>

 <div className="grid gap-6 lg:grid-cols-3">
 <section className="space-y-6 lg:col-span-1">
 <div className="rounded-lg border border-gray-200/60 bg-white p-6">
 <h2 className="text-lg font-semibold text-black">Ringkasan Posko</h2>
 <dl className="mt-4 space-y-3">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-gray-900">Latitude</dt>
 <dd className="mt-1 text-sm text-black">{posko?.latitude ?? '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-gray-900">Longitude</dt>
 <dd className="mt-1 text-sm text-black">{posko?.longitude ?? '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-gray-900">Diunggah oleh</dt>
 <dd className="mt-1 text-sm text-black">{posko?.uploaded_by ?? '-'}</dd>
 </div>
 </dl>

 {posko?.gmaps_link && (
 <a
 href={posko.gmaps_link}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-4 inline-flex items-center rounded-lg border border-gray-200/60 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
 >
 Buka Google Maps
 </a>
 )}
 </div>

 <div className="rounded-lg border border-gray-200/60 bg-white p-6">
 <h2 className="text-lg font-semibold text-black">Foto Posko</h2>
 {posko?.photo_url ? (
 <div className="mt-4 overflow-hidden rounded-lg border border-gray-200/60">
 <img
 src={posko.photo_url}
 alt={posko.photo_name || 'Foto posko'}
 className="h-64 w-full object-cover"
 />
 </div>
 ) : (
 <p className="mt-4 text-sm text-gray-900">Belum ada foto posko yang diunggah.</p>
 )}
 </div>
 </section>

 <section className="lg:col-span-2">
 {isLeader ? (
 <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200/60 bg-white p-6">
 <h2 className="text-lg font-semibold text-black">Perbarui Posko</h2>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <FormInput
 type="number"
 step="0.0001"
 label="Latitude"
 required
 value={form.data.latitude}
 onChange={(event) => form.setData('latitude', event.target.value)}
 error={form.errors.latitude}
 />
 <FormInput
 type="number"
 step="0.0001"
 label="Longitude"
 required
 value={form.data.longitude}
 onChange={(event) => form.setData('longitude', event.target.value)}
 error={form.errors.longitude}
 />
 <div className="md:col-span-2">
 <FormInput
 type="url"
 label="Tautan Google Maps"
 placeholder="https://maps.google.com/?q=-7.42412,109.23963"
 value={form.data.gmaps_link}
 onChange={(event) => form.setData('gmaps_link', event.target.value)}
 error={form.errors.gmaps_link}
 />
 <p className="mt-2 text-xs text-gray-900">
  Tautan harus berasal dari Google Maps, koordinat di dalam tautan harus sama dengan latitude serta longitude posko, dan titiknya harus masih berada di wilayah {group.location?.full_name || 'desa penempatan kelompok'}.
 </p>
 </div>
 <div className="md:col-span-2 space-y-2">
   <label htmlFor="posko-photo" className="block text-sm font-medium text-gray-700">Foto posko</label>
   <input
     id="posko-photo"
     type="file"
     accept=".jpg,.jpeg,.png,.webp"
     onChange={handlePhotoChange}
     className="block w-full rounded-lg border border-gray-200/60 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
   />
   {selectedFileName && <p className="text-sm text-gray-900">{selectedFileName}</p>}
   {form.errors.photo && <p className="text-xs text-red-600">{form.errors.photo}</p>}
 </div> </div>

 <div className="mt-6 flex justify-end gap-3">
 <Link
 href={route('student.dashboard')}
 className="rounded-lg border border-gray-200/60 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
 >
 Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan data posko'}
 </button>
 </div>
 </form>
 ) : (
 <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
 Hanya ketua kelompok yang dapat memperbarui lokasi dan foto posko.
 </section>
 )}
 </section>
 </div>
 </div>
 </AppLayout>
 );
}
