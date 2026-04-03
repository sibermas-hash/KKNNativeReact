import { useState, useEffect } from 'react';
import {
    RefreshCw,
    Calendar,
    ChevronLeft,
    UploadCloud,
    FileText,
    MapPin,
    Sparkles,
    AlertTriangle,
    Info,
    CheckCircle2,
    Activity,
    Image as ImageIcon,
    FileUp,
} from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    group: { name: string; location?: { village_name: string } } | null;
}

export default function StudentDailyReportCreate({ group }: Props) {
    const [locationStatus, setLocationStatus] = useState<'requesting' | 'acquired' | 'denied' | 'error'>('requesting');
    
    const form = useForm({
        date: new Date().toISOString().split('T')[0],
        title: '',
        activity: '',
        output: '',
        latitude: null as number | null,
        longitude: null as number | null,
        location_name: '',
        files: [] as File[],
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                form.setData(data => ({
                    ...data,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                setLocationStatus('acquired');
            },
            (error) => {
                console.error('Geolocation Error:', error);
                setLocationStatus(error.code === 1 ? 'denied' : 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount - form.setData is stable reference

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/student/daily-reports', {
            forceFormData: true,
        });
    }

    if (!group) {
        return (
            <AppLayout title="Akses Ditolak">
                <Head title="Error - Laporan Harian" />
                <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
                    <div className="p-12 bg-rose-50 border-2 border-dashed border-rose-100 rounded-[3.5rem] text-center max-w-sm shadow-inner-sm">
                        <AlertTriangle className="w-16 h-16 text-rose-300 mx-auto mb-8 shadow-sm" />
                        <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tighter mb-4 italic leading-none">Akses Terkunci</h2>
                        <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest leading-relaxed opacity-70 italic shadow-inner-sm p-4 bg-white/50 rounded-2xl">Identitas Anda belum terhubung dengan kelompok manapun. Hubungi Admin untuk aktivasi unit.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Buat Laporan">
            <Head title="Entri Laporan Harian Baru" />
            
            <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Clean Professional Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-10 gap-8">
                    <div className="space-y-5">
                        <Link 
                            href="/student/daily-reports" 
                            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-all group italic"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Riwayat
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">
                            Entri <span className="text-primary italic">Laporan</span> Baru
                        </h1>
                        <p className="text-slate-500 text-sm font-medium italic opacity-70 flex items-center gap-2">
                             <Activity className="h-4 w-4 text-primary/40" />
                             Dokumentasikan aktivitas lapangan Anda secara real-time disertai koordinat GPS.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-5 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm group hover:border-primary/20 transition-all">
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 text-primary flex items-center justify-center shadow-lg shadow-slate-900/10">
                            <MapPin className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 italic">Wilayah Pengabdian</span>
                            <p className="text-base font-black text-slate-900 uppercase italic tracking-tight leading-none">{group.location?.village_name || 'PENDING'}</p>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5 leading-none">{group.name}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Geotagging Status Bar */}
                        <div className={clsx(
                            "p-6 rounded-[2rem] border flex items-center gap-6 transition-all duration-700 shadow-sm",
                            locationStatus === 'acquired' ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 shadow-emerald-500/5" :
                            locationStatus === 'requesting' ? "bg-primary/5 border-primary/10 text-primary animate-pulse" :
                            "bg-rose-50 border-rose-100 text-rose-700 shadow-inner-sm"
                        )}>
                            <div className={clsx(
                                "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm text-white italic",
                                locationStatus === 'acquired' ? "bg-emerald-500" : 
                                locationStatus === 'requesting' ? "bg-primary" : 
                                "bg-rose-500"
                            )}>
                                {locationStatus === 'acquired' ? <CheckCircle2 className="w-6 h-6" /> : 
                                 locationStatus === 'requesting' ? <RefreshCw className="w-6 h-6 animate-spin" /> : 
                                 <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 italic">Status Lokasi (GPS)</p>
                                <p className="text-[11px] font-bold uppercase italic leading-none truncate opacity-80">
                                    {locationStatus === 'acquired' ? `Koordinat Terdeteksi: ${form.data.latitude?.toFixed(6)}, ${form.data.longitude?.toFixed(6)}` :
                                     locationStatus === 'requesting' ? 'Mencari Titik Lokasi...' :
                                     'Gagal Mendeteksi Lokasi. Pastikan GPS Aktif.'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                                <FileText className="h-96 w-96" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none block mb-1">Tanggal Kegiatan</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-primary transition-colors">
                                            <Calendar className="w-5 h-5 italic" />
                                        </div>
                                        <input 
                                            type="date"
                                            value={form.data.date}
                                            onChange={(e) => form.setData('date', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-16 py-5 text-sm font-black text-slate-900 tabular-nums focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all uppercase italic shadow-inner-sm outline-none"
                                            required
                                        />
                                    </div>
                                    {form.errors.date && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 italic">{form.errors.date}</p>}
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none block mb-1">Judul Aktivitas</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-primary transition-colors">
                                            <Sparkles className="w-5 h-5 italic" />
                                        </div>
                                        <input 
                                            placeholder="CONTOH: PENYULUHAN KESEHATAN..."
                                            value={form.data.title}
                                            onChange={(e) => form.setData('title', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-16 py-5 text-sm font-black text-slate-900 placeholder:text-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all uppercase italic shadow-inner-sm outline-none"
                                            required
                                        />
                                    </div>
                                    {form.errors.title && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 italic">{form.errors.title}</p>}
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none block mb-1">Deskripsi Kegiatan Lengkap</label>
                                <textarea 
                                    rows={8}
                                    placeholder="Jelaskan secara detail proses, rintangan, dan pencapaian hari ini..."
                                    value={form.data.activity}
                                    onChange={(e) => form.setData('activity', e.target.value)}
                                    className="w-full bg-slate-50 border-slate-100 rounded-[2.5rem] p-8 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all italic leading-relaxed shadow-inner-sm outline-none"
                                    required
                                />
                                {form.errors.activity && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 italic">{form.errors.activity}</p>}
                            </div>

                            <div className="space-y-4 relative z-10">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none block mb-1">Luaran / Hasil (Opsional)</label>
                                <input 
                                    placeholder="CONTOH: 1 DRAF MODUL, 2 FOTO KEGIATAN..."
                                    value={form.data.output}
                                    onChange={(e) => form.setData('output', e.target.value)}
                                    className="w-full bg-slate-50 border-slate-100 rounded-2xl px-8 py-5 text-sm font-black text-slate-900 placeholder:text-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all uppercase italic shadow-inner-sm outline-none"
                                />
                                {form.errors.output && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 italic">{form.errors.output}</p>}
                            </div>

                            <div className="flex pt-8 relative z-10 border-t border-slate-50">
                                <button 
                                    type="submit"
                                    disabled={form.processing || locationStatus === 'requesting'}
                                    className="h-20 px-16 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-5 italic group group/submit"
                                >
                                    <UploadCloud className={clsx("w-6 h-6 text-primary transition-all", form.processing ? "animate-bounce" : "group-hover/submit:translate-y-[-3px]")} />
                                    {form.processing ? 'Sedang Mengirim...' : 'Kirim Laporan Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <aside className="space-y-12">
                        <section className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm h-fit">
                            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-50">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm text-slate-400 italic">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest italic text-slate-900 leading-none">Dokumentasi Visual</h3>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic opacity-60">Lampiran Bukti Lapangan</p>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="relative group/dropzone">
                                    <div className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer shadow-inner-sm">
                                        <input 
                                            type="file" 
                                            multiple
                                            onChange={(e) => form.setData('files', Array.from(e.target.files ?? []))}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="flex flex-col items-center text-center relative z-10 group-hover/dropzone:scale-105 transition-transform duration-500 italic">
                                            <div className="h-16 w-16 bg-white rounded-2xl border border-slate-100 shadow-lg flex items-center justify-center text-slate-200 group-hover/dropzone:text-primary mb-6 transition-colors group-hover/dropzone:rotate-6">
                                                <FileUp className="w-8 h-8" />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none mb-2 shadow-inner-sm">Pilih File</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[120px] opacity-60">JPG, PNG, ATAU PDF (MAKS. 5 FILE)</p>
                                        </div>
                                    </div>
                                </div>

                                {form.data.files.length > 0 && (
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-900 animate-in zoom-in shadow-2xl relative overflow-hidden italic">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-primary">
                                            <Activity className="h-16 w-16" />
                                        </div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                                            Daftar Antrian File
                                        </p>
                                        <div className="space-y-4 relative z-10">
                                            {form.data.files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                                    <p className="text-[10px] font-black text-white/50 truncate uppercase italic decoration-primary flex-1">{file.name}</p>
                                                    <span className="text-[9px] font-bold text-slate-500 tabular-nums shrink-0 italic">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="p-10 bg-slate-950 rounded-[3rem] text-white relative overflow-hidden border border-slate-900 shadow-xl italic">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-primary pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <Sparkles className="w-40 h-40" />
                             </div>
                             <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                                 <Info className="h-4 w-4 text-primary" />
                                 Panduan Pelaporan
                             </h4>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-70 italic shadow-inner-sm">
                                Catat setiap progres dengan jujur dan detail. Pastikan dokumentasi visual yang diunggah relevan dengan judul laporan harian Anda.
                             </p>
                        </section>
                    </aside>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] italic leading-none">
                        Activity Hub • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
