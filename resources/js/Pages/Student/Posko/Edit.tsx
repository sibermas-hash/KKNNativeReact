import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import {
 Camera,
 MapPin,
 Image as ImageIcon,
 Users,
 ShieldCheck,
 ChevronLeft,
 UploadCloud,
 Settings2,
 Map,
 Navigation,
 Lock,
 MapIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props extends PageProps {
 isLeader: boolean;
 group: {
 id: number;
 code: string;
 name: string;
 location: {
 id: number;
 village_name: string;
 district_name: string | null;
 regency_name: string | null;
 full_name: string;
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
 const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'locked' | 'error'>('idle');

 const form = useForm({
 latitude: posko?.latitude?.toString() ?? '',
 longitude: posko?.longitude?.toString() ?? '',
 gmaps_link: posko?.gmaps_link ?? '',
 photo: null as File | null,
 });

 const detectLocation = useCallback(() => {
 if (!navigator.geolocation) {
 setGeoStatus('error');
 return;
 }

 setGeoStatus('detecting');
 navigator.geolocation.getCurrentPosition(
 (pos) => {
 form.setData(data => ({
 ...data,
 latitude: pos.coords.latitude.toString(),
 longitude: pos.coords.longitude.toString()
 }));
 setGeoStatus('locked');
 },
 () => setGeoStatus('error'),
 { enableHighAccuracy: true }
 );
 }, [form]);

 useEffect(() => {
 if (isLeader && !posko?.latitude) {
 detectLocation();
 }
 }, [detectLocation, isLeader, posko?.latitude]);

 function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
 const file = event.target.files?.[0] ?? null;
 form.setData('photo', file);
 setSelectedFileName(file?.name ?? null);
 }

 function handleSubmit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault();
 form.post('/student/posko', { forceFormData: true });
 }

 return (
 <AppLayout title="Lokasi Posko">
 <Head title="Pengaturan Lokasi Posko" />

 <div className="max-w-6xl mx-auto space-y-6 pb-24">
 <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-10 gap-8">
 <div className="space-y-5">
 <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-primarygroup">
 <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
 Dasbor
 </Link>
 <h1 className="text-4xl font-extrabold text-slate-900 ">
 Lokasi <span className="text-primary">Posko</span>
 </h1>
 <p className="text-slate-500 text-sm font-medium opacity-50 flex items-center gap-2">
 <Navigation className="h-4 w-4 text-primary/40" />
 {isLeader ? 'Kelola titik koordinat dan dokumentasi unit kelompok.' : 'Akses informasi lokasi unit (Baca Saja).'}
 </p>
 </div>
 
 <div className="bg-white border border-slate-200 p-6rounded-lg flex items-center gap-6 group hover:border-primary">
 <div className={clsx("h-14 w-14 rounded-lg flex items-center justify-center isLeader ? "bg-primary text-white" : "bg-slate-900 text-primary")}>
 {isLeader ? <ShieldCheck className="h-7 w-7" /> : <Users className="h-7 w-7" />}
 </div>
 <div>
 <span className="text-[9px] text-sm text-slate-400 block mb-1">Status Otoritas</span>
 <p className="text-base font-semibold text-slate-900 ">
 {isLeader ? 'Ketua Terverifikasi' : 'Anggota Unit'}
 </p>
 </div>
 </div>
 </header>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-1 space-y-6">
 <section className="bg-white rounded-lg border border-slate-100 p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <Map className="h-64 w-64" />
 </div>
 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-4 border-b border-slate-200 pb-8">
 <div className="p-3.5 bg-primary/10 text-primary rounded-lg border border-primary">
 <MapPin className="h-6 w-6" />
 </div>
 <div>
 <h3 className="text-xs font-semibold text-slate-900">Wilayah Penempatan</h3>
 <p className="text-[9px] text-sm text-slate-400 mt-1.5">{group.location?.village_name}</p>
 </div>
 </div>
 <div className="p-7 bg-slate-50 border border-slate-200 rounded-lg
 <p className="text-[10px] font-semibold text-slate-400 mb-3">Koordinat Saat Ini</p>
 <div className="space-y-2">
 <p className="text-xs font-semibold text-slate-900">LAT: {posko?.latitude ?? '---'}</p>
 <p className="text-xs font-semibold text-slate-900">LNG: {posko?.longitude ?? '---'}</p>
 </div>
 {posko?.gmaps_link && (
 <a href={posko.gmaps_link} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-primary hover:bg-primary hover:text-white
 <MapIcon className="w-3.5 h-3.5" /> Buka Peta
 </a>
 )}
 </div>
 </div>
 </section>

 <section className="bg-white rounded-lg p-10 border border-slate-200 overflow-hidden group">
 <div className="flex items-center gap-4 mb-8">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-emerald-500">
 <Camera className="h-6 w-6" />
 </div>
 <h3 className="text-xs font-semibold text-slate-900">Arsip Visual</h3>
 </div>
 {posko?.photo_url ? (
 <div className="relative aspect-videorounded-lg overflow-hidden border border-slate-200">
 <img src={posko.photo_url} alt={posko.photo_name ?? 'Foto posko kelompok'} className="w-full h-full object-cover" />
 <div className="absolute inset-0  flex-col justify-end p-6">
 <p className="text-[10px] font-semibold text-white/80 truncate">{posko.photo_name}</p>
 </div>
 </div>
 ) : (
 <div className="py-12 border-2 border-dashed border-slate-200 rounded-lg text-center">
 <ImageIcon className="w-10 h-10 text-slate-100 mx-auto mb-4" />
 <p className="text-[9px] text-sm text-slate-300 ada dokumentasi</p>
 </div>
 )}
 </section>
 </div>

 <div className="lg:col-span-2">
 {isLeader ? (
 <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-100 p-12 space-y-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-16 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <Settings2 className="h-96 w-full" />
 </div>

 <div className="relative z-10 flex items-center justify-between gap-5 border-b border-slate-200 pb-8">
 <div className="flex items-center gap-5">
 <div className="p-4 bg-slate-900 text-primary rounded-lg
 <Settings2 className="h-7 w-7" />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-slate-900 Lokasi</h3>
 <p className="text-[10px] font-semibold text-slate-400 mt-1.5">Panel Ketua Kelompok</p>
 </div>
 </div>
 <button type="button" onClick={detectLocation} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-semibold border border-emerald-100 hover:bg-emerald-600 hover:text-white">
 <Navigation className={clsx("w-3.5 h-3.5", geoStatus === 'detecting' && )} />
 {geoStatus === 'detecting' ? 'Mendeteksi...' : 'Deteksi Otomatis'}
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
 <div className="space-y-4">
 <label className="text-[10px] font-semibold text-slate-400 ml-2">Latitude</label>
 <input type="number" step="any" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-6 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none" required />
 </div>
 <div className="space-y-4">
 <label className="text-[10px] font-semibold text-slate-400 ml-2">Longitude</label>
 <input type="number" step="any" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-6 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none" required />
 </div>
 </div>

 <div className="space-y-4 relative z-10">
 <label className="text-[10px] font-semibold text-slate-400 ml-2">Tautan Google Maps</label>
 <input type="url" value={form.data.gmaps_link} onChange={(e) => form.setData('gmaps_link', e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-6 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none" placeholder="https://maps.google.com/..." />
 </div>

 <div className="space-y-6 relative z-10">
 <label className="text-[10px] font-semibold text-slate-400 ml-2">Dokumentasi Foto</label>
 <div className="relative h-48 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 hover:bg-whitecursor-pointer overflow-hidden group/upload">
 <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
 <ImageIcon className="w-8 h-8 text-slate-200 group-hover/upload:text-primary transition-colors" />
 <p className="text-[10px] font-semibold text-slate-400 mt-4">
 {selectedFileName || 'Klik untuk mengunggah foto posko'}
 </p>
 </div>
 </div>
 </div>

 <button type="submit" disabled={form.processing} className="w-full md:w-auto px-16 py-6 bg-slate-900 text-whiterounded-lg text-xs font-semibold hover:bg-blackactive:flex items-center justify-center gap-4">
 <UploadCloud className={clsx("w-5 h-5 text-primary", form.processing && )} />
 {form.processing ? 'Menyinkronkan...' : 'Komit Perubahan Data Posko'}
 </button>
 </form>
 ) : (
 <section className="bg-white rounded-lg border border-slate-100 p-20 text-center relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <Lock className="h-64 w-64" />
 </div>
 <div className="relative z-10 flex flex-col items-center">
 <div className="p-10 bg-amber-50 rounded-lg border border-amber-100 mb-8">
 <Lock className="h-16 w-16 text-amber-200" />
 </div>
 <h3 className="text-3xl font-semibold text-slate-900 mb-4">Akses Terbatas</h3>
 <p className="text-slate-400 text-sm text-xs max-w-md mx-auto leading-normal opacity-50">
 Hanya <span className="text-primary">Ketua Kelompok</span> yang diizinkan melakukan pembaruan data koordinat dan dokumentasi posko. Silakan hubungi ketua unit Anda untuk melakukan sinkronisasi lokasi.
 </p>
 </div>
 </section>
 )}
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
