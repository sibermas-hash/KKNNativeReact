import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, FormSelect } from '@/Components/ui';
import { getCurrentCoordinates } from '@/lib/geolocation';
import { 
    ChevronLeft, 
    Navigation, 
    FileText, 
    Save, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Info,
    Calendar,
    MapPin
} from 'lucide-react';
import { clsx } from 'clsx';

interface ReportFile {
    id: number;
    file_name?: string | null;
}

interface ReportData {
    id: number;
    date: string;
    title: string;
    abcd_stage?: string | null;
    activity: string;
    reflection?: string | null;
    social_media_link?: string | null;
    output?: string | null;
    location_name?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    gps_accuracy?: number | string | null;
    captured_at?: string | null;
    file_kegiatan?: ReportFile[];
    fileKegiatan?: ReportFile[];
}

interface GeoPolicy {
    radius_meters: number;
    max_accuracy_meters: number;
    reference?: {
        label: string;
    } | null;
}

interface Props {
    report: ReportData;
    geoPolicy: GeoPolicy;
}

const LOCATION_FRESHNESS_WINDOW_MS = 2 * 60 * 1000;
const DEFAULT_LOCATION_LABEL = 'Lokasi GPS diperbarui';

function shouldAutofillLocationName(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length <= 2) return true;
    return trimmed.toLowerCase().includes('lokasi gps');
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function StudentDailyReportEdit({ report, geoPolicy }: Props) {
    const files = report.file_kegiatan ?? report.fileKegiatan ?? [];
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [locationFeedback, setLocationFeedback] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

    const form = useForm({
        date: report.date ?? '',
        title: report.title ?? '',
        abcd_stage: report.abcd_stage ?? '',
        activity: report.activity ?? '',
        reflection: report.reflection ?? '',
        social_media_link: report.social_media_link ?? '',
        output: report.output ?? '',
        location_name: report.location_name ?? '',
        latitude: report.latitude ? String(report.latitude) : '',
        longitude: report.longitude ? String(report.longitude) : '',
        gps_accuracy: report.gps_accuracy ? String(report.gps_accuracy) : '',
        captured_at: report.captured_at ?? '',
        location_source: 'gps' as const,
        files: [] as File[],
        _method: 'PUT',
    });

    const coordinateSummary = useMemo(() => ({
        latitude: form.data.latitude || '-',
        longitude: form.data.longitude || '-',
        accuracy: form.data.gps_accuracy ? `${Math.round(Number(form.data.gps_accuracy))} meter` : '-',
        capturedAt: formatDateTime(form.data.captured_at),
    }), [form.data.captured_at, form.data.gps_accuracy, form.data.latitude, form.data.longitude]);

    const isCapturedLocationFresh = useCallback((): boolean => {
        if (!form.data.captured_at) return false;
        const capturedAt = new Date(form.data.captured_at).getTime();
        return !Number.isNaN(capturedAt) && (Date.now() - capturedAt <= LOCATION_FRESHNESS_WINDOW_MS);
    }, [form.data.captured_at]);

    const handleUseCurrentLocation = useCallback(async (): Promise<boolean> => {
        setIsFetchingLocation(true);
        setLocationFeedback(null);
        try {
            const coords = await getCurrentCoordinates();
            form.setData((current) => ({
                ...current,
                latitude: coords.latitude.toFixed(8),
                longitude: coords.longitude.toFixed(8),
                gps_accuracy: coords.accuracy ? coords.accuracy.toFixed(2) : '',
                captured_at: coords.capturedAt,
                location_source: 'gps',
                location_name: shouldAutofillLocationName(current.location_name) ? DEFAULT_LOCATION_LABEL : current.location_name,
            }));
            form.clearErrors('latitude', 'longitude', 'gps_accuracy', 'captured_at', 'location_source');
            setLocationFeedback({ msg: 'Sensor GPS Aktif: Titik Koordinat Diperbarui.', type: 'success' });
            return true;
        } catch (error) {
            setLocationFeedback({ msg: error instanceof Error ? error.message : 'Sensor GPS Bermasalah.', type: 'error' });
            return false;
        } finally { setIsFetchingLocation(false); }
    }, [form]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        // Hanya ambil lokasi baru jika data lama sudah basi (> 2 menit)
        if (!form.data.latitude || !isCapturedLocationFresh()) {
            const ok = await handleUseCurrentLocation();
            if (!ok) return;
        }

        form.post(route('student.laporan-harian.update', report.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Revisi Logbook">
            <Head title="Revisi Logbook | SIM-KKN" />

            <div className="mx-auto max-w-5xl space-y-10 pb-20">
                {/* --- HEADER --- */}
                <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-12 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                         <div className="flex items-center gap-4 text-emerald-600 mb-2">
                            <Link href={route('student.laporan-harian.index')} className="p-2 hover:bg-emerald-50 rounded-xl transition-colors">
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </Link>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Kembali ke Daftar</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter uppercase leading-none">Ubah Laporan</h1>
                        <p className="text-sm font-medium text-slate-400">ID Laporan: <span className="text-emerald-600 font-bold">#{report.id}</span></p>
                    </div>

                    <div className="px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center gap-4">
                        <Calendar size={20} className="text-slate-400" />
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{new Date(report.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* --- MAIN FORM --- */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-12 shadow-sm space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormInput
                                    type="date"
                                    label="Tanggal Kegiatan"
                                    required
                                    value={form.data.date}
                                    onChange={(e) => form.setData('date', e.target.value)}
                                    error={form.errors.date}
                                    className="rounded-2xl bg-slate-50/50 border-slate-100 py-4 font-bold text-slate-700"
                                />
                                <FormInput
                                    label="Lokasi Spesifik"
                                    required
                                    value={form.data.location_name}
                                    onChange={(e) => form.setData('location_name', e.target.value)}
                                    error={form.errors.location_name}
                                    className="rounded-2xl bg-slate-50/50 border-slate-100 py-4 font-bold text-slate-700"
                                />
                            </div>

                            <FormInput
                                label="Judul Aktivitas"
                                required
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                error={form.errors.title}
                                className="rounded-2xl bg-slate-50/50 border-slate-100 py-4 font-bold text-slate-700"
                            />

                            <FormSelect
                                label="Tahapan ABCD"
                                required
                                value={form.data.abcd_stage}
                                onChange={(e) => form.setData('abcd_stage', e.target.value)}
                                error={form.errors.abcd_stage}
                                className="rounded-2xl bg-slate-50/50 border-slate-100 py-4 font-bold text-slate-700"
                            >
                                <option value="">-- PILIH TAHAPAN --</option>
                                <option value="Discovery">Discovery</option>
                                <option value="Dream">Dream</option>
                                <option value="Design">Design</option>
                                <option value="Define">Define</option>
                                <option value="Destiny">Destiny</option>
                                <option value="Reflection">Reflection</option>
                            </FormSelect>

                            <FormTextarea
                                label="Detil Aktivitas"
                                required
                                value={form.data.activity}
                                onChange={(e) => form.setData('activity', e.target.value)}
                                error={form.errors.activity}
                                className="rounded-2xl bg-slate-50/50 border-slate-100 py-4 font-medium"
                            />

                            {/* --- FILE INFO --- */}
                            {files.length > 0 && (
                                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-4">
                                    <FileText size={20} className="text-emerald-600 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-3">Dokumentasi Tersimpan</p>
                                        <ul className="space-y-1">
                                            {files.map((file) => (
                                                <li key={file.id} className="text-xs font-bold text-emerald-900/60 truncate max-w-[300px] uppercase tracking-tight">{file.file_name ?? `Lampiran #${file.id}`}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tambah Foto Baru (Opsional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => form.setData('files', Array.from(e.target.files ?? []))}
                                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-xs font-bold text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-[10px] file:font-black file:text-white file:uppercase file:tracking-widest"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">Unggahan baru akan ditambahkan ke dokumentasi sebelumnya.</p>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: GEO & ACTION --- */}
                    <div className="lg:col-span-1 space-y-10">
                        <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm space-y-8 sticky top-6">
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    Geolokasi Presisi
                                </h2>

                                <div className="space-y-3">
                                    <GeoInfoItem label="Latitude" value={coordinateSummary.latitude} />
                                    <GeoInfoItem label="Longitude" value={coordinateSummary.longitude} />
                                    <GeoInfoItem label="Akurasi" value={coordinateSummary.accuracy} color="emerald" />
                                </div>

                                {locationFeedback && (
                                    <div className={clsx(
                                        "p-4 rounded-xl text-[10px] font-bold tracking-tight border",
                                        locationFeedback.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                    )}>
                                        {locationFeedback.msg}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleUseCurrentLocation()}
                                disabled={isFetchingLocation}
                                className="w-full h-12 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Navigation size={14} strokeWidth={3} /> {isFetchingLocation ? 'Locking...' : 'Update Lokasi GPS'}
                            </button>

                            <div className="pt-8 border-t border-slate-50 space-y-4">
                                 <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                                    <Info size={18} className="shrink-0" />
                                    <p className="text-[9px] font-bold uppercase tracking-wider leading-relaxed">
                                        Perubahan data GPS akan disimpan sebagai tanda anda benar-benar melakukan revisi di lokasi.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={form.processing || isFetchingLocation}
                                    className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {form.processing ? 'Saving...' : 'Simpan Revisi'}
                                    <Save size={18} />
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function GeoInfoItem({ label, value, color = 'slate' }: { label: string, value: string, color?: 'slate' | 'emerald' }) {
    return (
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
            <p className={clsx("text-xs font-bold tracking-tight leading-none", color === 'emerald' ? "text-emerald-600" : "text-slate-900")}>
                {value}
            </p>
        </div>
    );
}
