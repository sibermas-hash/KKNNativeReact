import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import { getCurrentCoordinates } from '@/lib/geolocation';
import { listPendingDailyReports, queueDailyReport, syncPendingDailyReports } from '@/lib/offline-daily-reports';

interface GroupData {
    id: number;
    nama_kelompok?: string | null;
    name?: string | null;
}

interface GeoPolicy {
    requires_gps: boolean;
    offline_sync_enabled: boolean;
    radius_meters: number;
    max_accuracy_meters: number;
    reference?: {
        label: string;
        latitude: number;
        longitude: number;
    } | null;
}

interface Props {
    group: GroupData | null;
    geoPolicy: GeoPolicy;
}

const LOCATION_FRESHNESS_WINDOW_MS = 2 * 60 * 1000;

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function StudentDailyReportCreate({ group, geoPolicy }: Props) {
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isSyncingPending, setIsSyncingPending] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
    const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
    const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    const form = useForm({
        date: '',
        title: '',
        activity: '',
        reflection: '',
        output: '',
        location_name: '',
        latitude: '',
        longitude: '',
        gps_accuracy: '',
        captured_at: '',
        location_source: 'gps' as const,
        files: [] as File[],
    });

    const coordinateSummary = useMemo(
        () => ({
            latitude: form.data.latitude || '-',
            longitude: form.data.longitude || '-',
            accuracy: form.data.gps_accuracy ? `${Math.round(Number(form.data.gps_accuracy))} meter` : '-',
            capturedAt: formatDateTime(form.data.captured_at || null),
        }),
        [form.data.captured_at, form.data.gps_accuracy, form.data.latitude, form.data.longitude],
    );

    const refreshPendingCount = useCallback(async () => {
        try {
            const records = await listPendingDailyReports();
            setPendingCount(records.length);
        } catch {
            setPendingCount(0);
        }
    }, []);

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
                location_name: current.location_name.trim() ? current.location_name : 'Lokasi GPS terkini',
            }));

            form.clearErrors('latitude', 'longitude', 'gps_accuracy', 'captured_at', 'location_source');
            setLocationFeedback(
                coords.accuracy
                    ? `Koordinat berhasil diambil dari GPS perangkat. Perkiraan akurasi ${Math.round(coords.accuracy)} meter.`
                    : 'Koordinat berhasil diambil dari GPS perangkat.',
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

    const handlePendingSync = useCallback(async () => {
        if (!navigator.onLine) {
            setSyncFeedback('Perangkat masih offline. Sinkronisasi akan dicoba lagi saat koneksi kembali.');
            return;
        }

        setIsSyncingPending(true);
        setSyncFeedback(null);

        try {
            const summary = await syncPendingDailyReports();
            await refreshPendingCount();

            if (summary.synced > 0) {
                setSyncFeedback(`${summary.synced} laporan offline berhasil disinkronkan ke server.`);
            } else if (summary.lastError) {
                setSyncFeedback(summary.lastError);
            } else {
                setSyncFeedback('Tidak ada laporan offline yang perlu disinkronkan.');
            }
        } catch {
            setSyncFeedback('Antrean offline belum bisa dibaca pada perangkat ini.');
        } finally {
            setIsSyncingPending(false);
        }
    }, [refreshPendingCount]);

    useEffect(() => {
        void refreshPendingCount();

        const handleOnline = () => {
            setIsOnline(true);
            void handlePendingSync();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setSyncFeedback('Koneksi internet terputus. Laporan baru akan disimpan dulu di perangkat.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handlePendingSync, refreshPendingCount]);

    const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        form.setData('files', Array.from(event.target.files ?? []));
    };

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
        setSyncFeedback(null);

        if (!validateRequiredFields()) {
            return;
        }

        const isLocationReady = await ensureCurrentLocation();
        if (!isLocationReady) {
            return;
        }

        if (!navigator.onLine) {
            try {
                await queueDailyReport({
                    date: form.data.date,
                    title: form.data.title,
                    activity: form.data.activity,
                    reflection: form.data.reflection,
                    output: form.data.output,
                    location_name: form.data.location_name,
                    latitude: form.data.latitude,
                    longitude: form.data.longitude,
                    gps_accuracy: form.data.gps_accuracy,
                    captured_at: form.data.captured_at,
                    location_source: 'gps',
                    files: form.data.files,
                });
            } catch {
                setLocationFeedback('Perangkat sedang offline dan penyimpanan lokal tidak tersedia. Sambungkan internet untuk mengirim laporan.');
                return;
            }

            form.reset();
            await refreshPendingCount();
            setLocationFeedback('Laporan disimpan offline di perangkat. Sistem akan mengirimkannya otomatis saat koneksi kembali.');
            return;
        }

        form.post(route('student.laporan-harian.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Buat Laporan Harian">
            <Head title="Buat Laporan Harian" />

            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <Link
                                href={route('student.laporan-harian.index')}
                                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
                            >
                                Kembali ke laporan
                            </Link>
                            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Buat Laporan Harian</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {group ? `Kelompok aktif: ${group.name || group.nama_kelompok}` : 'Isi aktivitas harian kelompok Anda.'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
                    Koordinat laporan diambil langsung dari GPS perangkat. Pengisian manual latitude dan longitude dinonaktifkan.
                    {!isOnline ? ' Saat offline, laporan akan disimpan dulu di perangkat lalu disinkronkan otomatis.' : ''}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">Aturan Validasi Lokasi</h2>
                            <p className="text-sm text-slate-600">
                                Radius validasi GPS: <span className="font-semibold text-slate-900">{geoPolicy.radius_meters.toLocaleString('id-ID')} meter</span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Batas akurasi GPS: <span className="font-semibold text-slate-900">{geoPolicy.max_accuracy_meters.toLocaleString('id-ID')} meter</span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Titik acuan:{' '}
                                <span className="font-semibold text-slate-900">
                                    {geoPolicy.reference?.label ?? 'Belum ada koordinat acuan kelompok'}
                                </span>
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p>Mode koneksi: <span className="font-semibold text-slate-900">{isOnline ? 'Online' : 'Offline'}</span></p>
                            <p className="mt-1">
                                Antrean offline: <span className="font-semibold text-slate-900">{pendingCount}</span> laporan
                            </p>
                            <button
                                type="button"
                                onClick={handlePendingSync}
                                disabled={!isOnline || isSyncingPending || pendingCount === 0}
                                className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSyncingPending ? 'Menyinkronkan...' : 'Sinkronkan antrean'}
                            </button>
                        </div>
                    </div>

                    {syncFeedback ? (
                        <p className={`mt-4 text-sm ${syncFeedback.includes('berhasil') ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {syncFeedback}
                        </p>
                    ) : null}
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
                        />
                        <FormInput
                            label="Lokasi kegiatan"
                            required
                            value={form.data.location_name}
                            onChange={(event) => form.setData('location_name', event.target.value)}
                            error={form.errors.location_name}
                        />

                        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-800">Ambil lokasi GPS terkini</p>
                                    <p className="text-xs text-slate-500">
                                        Sistem akan mengunci koordinat dari perangkat Anda sebelum laporan dikirim atau disimpan offline. Jika data GPS sudah lebih dari dua menit, sistem akan mengambil ulang lokasi terbaru saat submit.
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
                                <p className={`mt-4 text-sm ${locationFeedback.includes('berhasil') || locationFeedback.includes('offline') ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {locationFeedback}
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
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Uraian kegiatan"
                                required
                                value={form.data.activity}
                                onChange={(event) => form.setData('activity', event.target.value)}
                                error={form.errors.activity}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Refleksi"
                                value={form.data.reflection}
                                onChange={(event) => form.setData('reflection', event.target.value)}
                                error={form.errors.reflection}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Luaran"
                                value={form.data.output}
                                onChange={(event) => form.setData('output', event.target.value)}
                                error={form.errors.output}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Lampiran</label>
                            <input
                                type="file"
                                multiple
                                onChange={handleFilesChange}
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
                            />
                            {form.errors.files && <p className="text-xs text-red-600">{form.errors.files}</p>}
                        </div>
                    </div>

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
                            {form.processing ? 'Menyimpan...' : isOnline ? 'Kirim laporan' : 'Simpan offline'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
