import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import { getCurrentCoordinates } from '@/lib/geolocation';

interface ReportFile {
    id: number;
    file_name?: string | null;
}

interface ReportData {
    id: number;
    date: string;
    title: string;
    activity: string;
    reflection?: string | null;
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
const DEFAULT_LOCATION_LABEL = 'Lokasi GPS terkini';

function shouldAutofillLocationName(value: string): boolean {
    const trimmed = value.trim();

    if (!trimmed) {
        return true;
    }

    if (trimmed.length <= 2) {
        return true;
    }

    return trimmed.toLowerCase().includes('lokasi gps');
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function StudentDailyReportEdit({ report, geoPolicy }: Props) {
    const files = report.file_kegiatan ?? report.fileKegiatan ?? [];
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

    const form = useForm({
        date: report.date ?? '',
        title: report.title ?? '',
        activity: report.activity ?? '',
        reflection: report.reflection ?? '',
        output: report.output ?? '',
        location_name: report.location_name ?? '',
        latitude: report.latitude ? String(report.latitude) : '',
        longitude: report.longitude ? String(report.longitude) : '',
        gps_accuracy: report.gps_accuracy ? String(report.gps_accuracy) : '',
        captured_at: report.captured_at ?? '',
        location_source: 'gps' as const,
    });

    const coordinateSummary = useMemo(
        () => ({
            latitude: form.data.latitude || '-',
            longitude: form.data.longitude || '-',
            accuracy: form.data.gps_accuracy ? `${Math.round(Number(form.data.gps_accuracy))} meter` : '-',
            capturedAt: formatDateTime(form.data.captured_at),
        }),
        [form.data.captured_at, form.data.gps_accuracy, form.data.latitude, form.data.longitude],
    );

    const isCapturedLocationFresh = useCallback((): boolean => {
        if (!form.data.captured_at) {
            return false;
        }

        const capturedAt = new Date(form.data.captured_at).getTime();

        if (Number.isNaN(capturedAt)) {
            return false;
        }

        return Date.now() - capturedAt <= LOCATION_FRESHNESS_WINDOW_MS;
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
                location_name: shouldAutofillLocationName(current.location_name)
                    ? DEFAULT_LOCATION_LABEL
                    : current.location_name,
            }));

            form.clearErrors('latitude', 'longitude', 'gps_accuracy', 'captured_at', 'location_source');
            setLocationFeedback(
                coords.accuracy
                    ? `Koordinat berhasil diperbarui dari GPS perangkat. Perkiraan akurasi ${Math.round(coords.accuracy)} meter.`
                    : 'Koordinat berhasil diperbarui dari GPS perangkat.',
            );

            return true;
        } catch (error) {
            setLocationFeedback(error instanceof Error ? error.message : 'Lokasi GPS gagal diambil.');
            return false;
        } finally {
            setIsFetchingLocation(false);
        }
    }, [form]);

    const ensureCurrentLocation = useCallback(async (): Promise<boolean> => {
        if (form.data.latitude && form.data.longitude && isCapturedLocationFresh()) {
            return true;
        }

        return handleUseCurrentLocation();
    }, [form.data.latitude, form.data.longitude, handleUseCurrentLocation, isCapturedLocationFresh]);

    const validateRequiredFields = (): boolean => {
        let hasError = false;
        form.clearErrors();

        if (!form.data.date) {
            form.setError('date', 'Tanggal kegiatan wajib diisi.');
            hasError = true;
        }

        if (!form.data.location_name.trim()) {
            form.setError('location_name', 'Lokasi kegiatan wajib diisi.');
            hasError = true;
        }

        if (!form.data.title.trim()) {
            form.setError('title', 'Judul kegiatan wajib diisi.');
            hasError = true;
        }

        if (!form.data.activity.trim()) {
            form.setError('activity', 'Uraian kegiatan wajib diisi.');
            hasError = true;
        }

        return !hasError;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateRequiredFields()) {
            return;
        }

        const isLocationReady = await ensureCurrentLocation();
        if (!isLocationReady) {
            return;
        }

        form.put(route('student.laporan-harian.update', report.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Ubah Laporan Harian">
            <Head title="Ubah Laporan Harian" />

            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-8">
                    <Link
                        href={route('student.laporan-harian.index')}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
                    >
                        Kembali ke laporan
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">Ubah Laporan Harian</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Perbarui data laporan dan kirim ulang untuk ditinjau DPL.
                    </p>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="space-y-2 text-sm text-slate-600">
                        <p>
                            Radius validasi GPS: <span className="font-semibold text-slate-900">{geoPolicy.radius_meters.toLocaleString('id-ID')} meter</span>
                        </p>
                        <p>
                            Batas akurasi GPS: <span className="font-semibold text-slate-900">{geoPolicy.max_accuracy_meters.toLocaleString('id-ID')} meter</span>
                        </p>
                        <p>
                            Titik acuan: <span className="font-semibold text-slate-900">{geoPolicy.reference?.label ?? 'Belum ada koordinat acuan kelompok'}</span>
                        </p>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <FormInput
                            type="date"
                            label="Tanggal kegiatan"
                            required
                            value={form.data.date}
                            onChange={(event) => form.setData('date', event.target.value)}
                            error={form.errors.date}
                            hint="Gunakan tanggal kegiatan yang benar-benar diperbarui."
                        />
                        <FormInput
                            label="Lokasi kegiatan"
                            required
                            value={form.data.location_name}
                            onChange={(event) => form.setData('location_name', event.target.value)}
                            error={form.errors.location_name}
                            placeholder="Contoh: Balai Desa Karangsari atau Posko Kelompok"
                            hint="Isi nama tempat kegiatan. Koordinat GPS tetap diperbarui otomatis dari perangkat."
                        />

                        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-800">Perbarui lokasi GPS terkini</p>
                                    <p className="text-xs text-slate-500">
                                        Koordinat laporan akan diambil ulang dari perangkat saat Anda menekan tombol berikut. Jika data GPS yang tersimpan sudah lebih dari dua menit, sistem juga akan meminta lokasi terbaru saat Anda menyimpan perubahan.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleUseCurrentLocation()}
                                    disabled={isFetchingLocation}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isFetchingLocation ? 'Mengambil lokasi...' : 'Gunakan lokasi saat ini'}
                                </button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Latitude</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{coordinateSummary.latitude}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Longitude</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{coordinateSummary.longitude}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Akurasi GPS</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{coordinateSummary.accuracy}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Waktu diambil</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{coordinateSummary.capturedAt}</p>
                                </div>
                            </div>

                            {locationFeedback ? (
                                <p className={`mt-4 text-sm ${locationFeedback.includes('berhasil') ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {locationFeedback}
                                </p>
                            ) : null}
                            {form.data.captured_at && !isCapturedLocationFresh() ? (
                                <p className="mt-2 text-sm text-amber-700">
                                    Data GPS ini sudah lebih dari dua menit. Sistem akan mengambil ulang lokasi terbaru saat Anda menyimpan perubahan.
                                </p>
                            ) : null}
                            {form.errors.latitude ? <p className="mt-2 text-sm text-red-600">{form.errors.latitude}</p> : null}
                            {form.errors.gps_accuracy ? <p className="mt-2 text-sm text-red-600">{form.errors.gps_accuracy}</p> : null}
                            {form.errors.captured_at ? <p className="mt-2 text-sm text-red-600">{form.errors.captured_at}</p> : null}
                        </div>

                        <div className="md:col-span-2">
                            <FormInput
                                label="Judul kegiatan"
                                required
                                value={form.data.title}
                                onChange={(event) => form.setData('title', event.target.value)}
                                error={form.errors.title}
                                placeholder="Contoh: Pendampingan posyandu balita"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Uraian kegiatan"
                                required
                                value={form.data.activity}
                                onChange={(event) => form.setData('activity', event.target.value)}
                                error={form.errors.activity}
                                placeholder="Jelaskan kegiatan yang dilakukan, pihak yang terlibat, dan hasil utamanya."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Refleksi"
                                value={form.data.reflection}
                                onChange={(event) => form.setData('reflection', event.target.value)}
                                error={form.errors.reflection}
                                placeholder="Tuliskan evaluasi singkat, hambatan, atau pembelajaran dari kegiatan hari ini."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Luaran"
                                value={form.data.output}
                                onChange={(event) => form.setData('output', event.target.value)}
                                error={form.errors.output}
                                placeholder="Contoh: daftar hadir, dokumentasi kegiatan, notula, atau hasil pendataan."
                            />
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <h2 className="text-sm font-semibold text-slate-900">Lampiran yang sudah tersimpan</h2>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {files.map((file) => (
                                    <li key={file.id}>{file.file_name || `Lampiran #${file.id}`}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <Link
                            href={route('student.laporan-harian.index')}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing || isFetchingLocation}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                        >
                            {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
