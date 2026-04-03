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

            <div className="max-w-6xl mx-auto space-y-12 pb-24">
                <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-10 gap-8">
                    <div className="space-y-5">
                        <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase  hover:text-primary transition-all group italic">
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Dasbor
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                            Lokasi <span className="text-primary italic">Posko</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium italic opacity-70 flex items-center gap-2">
                             <Navigation className="h-4 w-4 text-primary/40" />
                             {isLeader ? 'Kelola titik koordinat dan dokumentasi unit kelompok.' : 'Akses informasi lokasi unit (Baca Saja).'}
                        </p>
                    </div>
                    
                    <div className="bg-white border border-slate-100 p-6rounded-lg flex items-center gap-6 group hover:border-primary/20 transition-all">
                        <div className={clsx("h-14 w-14 rounded-lg flex items-center justify-center isLeader ? "bg-primary text-white" : "bg-slate-900 text-primary")}>
                            {isLeader ? <ShieldCheck className="h-7 w-7" /> : <Users className="h-7 w-7" />}
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase  block mb-1 italic">Status Otoritas</span>
                            <p className="text-base font-black text-slate-900 uppercase italic  leading-none">
                                {isLeader ? 'Ketua Terverifikasi' : 'Anggota Unit'}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-10">
                        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                                <Map className="h-64 w-64" />
                            </div>
                            <div className="relative z-10 space-y-10 italic">
                                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                                    <div className="p-3.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase  text-slate-900 leading-none">Wilayah Penempatan</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase  mt-1.5">{group.location?.village_name}</p>
                                    </div>
                                </div>
                                <div className="p-7 bg-slate-50 border border-slate-100 rounded-lg
                                    <p className="text-[10px] font-black text-slate-400 uppercase  mb-3 italic leading-none">Koordinat Saat Ini</p>
                                    <div className="space-y-2 tabular-nums">
                                        <p className="text-xs font-black text-slate-900">LAT: {posko?.latitude ?? '---'}</p>
                                        <p className="text-xs font-black text-slate-900">LNG: {posko?.longitude ?? '---'}</p>
                                    </div>
                                    {posko?.gmaps_link && (
                                        <a href={posko.gmaps_link} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase 
                                            <MapIcon className="w-3.5 h-3.5" /> Buka Peta
                                        </a>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 overflow-hidden group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-emerald-500">
                                    <Camera className="h-6 w-6" />
                                </div>
                                <h3 className="text-xs font-black uppercase  italic text-slate-900 leading-none">Arsip Visual</h3>
                            </div>
                            {posko?.photo_url ? (
                                <div className="relative aspect-videorounded-lg overflow-hidden border border-slate-100">
                                    <img src={posko.photo_url} alt={posko.photo_name ?? 'Foto posko kelompok'} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                        <p className="text-[10px] font-black text-white/80 uppercase italic truncate">{posko.photo_name}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 border-2 border-dashed border-slate-100 rounded-lg text-center italic">
                                    <ImageIcon className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                    <p className="text-[9px] font-bold text-slate-300 uppercase  ada dokumentasi</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="lg:col-span-2">
                        {isLeader ? (
                            <form onSubmit={handleSubmit} className="bg-white rounded-[3.5rem] border border-slate-100 p-12 space-y-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                                    <Settings2 className="h-96 w-96" />
                                </div>

                                <div className="relative z-10 flex items-center justify-between gap-5 border-b border-slate-50 pb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-slate-900 text-primary rounded-lg
                                            <Settings2 className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase italic  Lokasi</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase  mt-1.5 italic">Panel Ketua Kelompok</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={detectLocation} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase  border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all italic">
                                        <Navigation className={clsx("w-3.5 h-3.5", geoStatus === 'detecting' && "animate-spin")} />
                                        {geoStatus === 'detecting' ? 'Mendeteksi...' : 'Deteksi Otomatis'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic">Latitude</label>
                                        <input type="number" step="any" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-lg px-8 py-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none italic" required />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic">Longitude</label>
                                        <input type="number" step="any" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-lg px-8 py-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none italic" required />
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic">Tautan Google Maps</label>
                                    <input type="url" value={form.data.gmaps_link} onChange={(e) => form.setData('gmaps_link', e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-lg px-8 py-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none italic" placeholder="https://maps.google.com/..." />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic">Dokumentasi Foto</label>
                                    <div className="relative h-48 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 hover:bg-white transition-all cursor-pointer overflow-hidden group/upload">
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <ImageIcon className="w-8 h-8 text-slate-200 group-hover/upload:text-primary transition-colors" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase  mt-4 italic">
                                                {selectedFileName || 'Klik untuk mengunggah foto posko'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={form.processing} className="w-full md:w-auto px-16 py-6 bg-slate-900 text-whiterounded-lg text-[10px] font-black uppercase  hover:bg-black transition-all active:scale-95 italic flex items-center justify-center gap-4">
                                    <UploadCloud className={clsx("w-5 h-5 text-primary", form.processing && "animate-bounce")} />
                                    {form.processing ? 'Menyinkronkan...' : 'Komit Perubahan Data Posko'}
                                </button>
                            </form>
                        ) : (
                            <section className="bg-white rounded-[3.5rem] border border-slate-100 p-20 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                                    <Lock className="h-64 w-64" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="p-10 bg-amber-50 rounded-full border border-amber-100 mb-8 italic">
                                        <Lock className="h-16 w-16 text-amber-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900  uppercase italic mb-4">Akses Terbatas</h3>
                                    <p className="text-slate-400 font-bold uppercase  text-[11px] max-w-md mx-auto leading-relaxed opacity-70 italic">
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
