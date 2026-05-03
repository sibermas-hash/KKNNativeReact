import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, FormSelect } from '@/Components/UI';
import { getCurrentCoordinates } from '@/lib/geolocation';
import { capturePhotoFile, isNativeCameraAvailable } from '@/lib/native-camera';
import {
  listPendingDailyReports,
  queueDailyReport,
  syncPendingDailyReports,
} from '@/lib/offline-daily-reports';
import {
  ChevronLeft,
  Wifi,
  WifiOff,
  CloudUpload,
  Camera,
  Zap,
  Navigation,
} from 'lucide-react';
import { clsx } from 'clsx';

interface GroupData {
  id: number;
  name: string;
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
const DEFAULT_LOCATION_LABEL = 'Lokasi GPS terkini';

function shouldAutofillLocationName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length <= 2) return true;
  return trimmed.toLowerCase().includes('lokasi gps');
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function StudentDailyReportCreate({ group, geoPolicy }: Props) {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [, setIsSyncingPending] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [locationFeedback, setLocationFeedback] = useState<{
    msg: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [, setSyncFeedback] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [mediaFeedback, setMediaFeedback] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const hasNativeCamera = isNativeCameraAvailable();

  const form = useForm({
    date: new Date().toISOString().split('T')[0],
    title: '',
    abcd_stage: '',
    activity: '',
    reflection: '',
    social_media_link: '',
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
      accuracy: form.data.gps_accuracy
        ? `${Math.round(Number(form.data.gps_accuracy))} meter`
        : '-',
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
    if (!form.data.captured_at) return false;
    const capturedAt = new Date(form.data.captured_at).getTime();
    return !Number.isNaN(capturedAt) && Date.now() - capturedAt <= LOCATION_FRESHNESS_WINDOW_MS;
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
      setLocationFeedback({
        msg: `GPS Terkunci: Akurasi ±${Math.round(coords.accuracy ?? 0)} meter.`,
        type: 'success',
      });
      return true;
    } catch (error) {
      setLocationFeedback({
        msg: error instanceof Error ? error.message : 'Gagal mengakses sensor GPS.',
        type: 'error',
      });
      return false;
    } finally {
      setIsFetchingLocation(false);
    }
  }, [form]);

  const updateSelectedFiles = useCallback(
    (files: File[]) => {
      form.setData('files', files);
      form.clearErrors('files');
      setMediaFeedback(
        files.length > 0
          ? {
              msg: `${files.length} foto siap diunggah.`,
              type: 'success',
            }
          : null,
      );
    },
    [form],
  );

  const handleNativePhotoCapture = useCallback(async () => {
    setIsCapturingPhoto(true);
    setMediaFeedback(null);

    try {
      const file = await capturePhotoFile({
        direction: 'rear',
        fileNamePrefix: 'daily-report',
      });

      if (!file) {
        return;
      }

      updateSelectedFiles([...form.data.files, file]);
    } catch (error) {
      setMediaFeedback({
        msg: error instanceof Error ? error.message : 'Gagal membuka kamera perangkat.',
        type: 'error',
      });
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [form.data.files, updateSelectedFiles]);

  const handlePendingSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncFeedback('Perangkat masih luring (Offline).');
      return;
    }
    setIsSyncingPending(true);
    try {
      const summary = await syncPendingDailyReports();
      await refreshPendingCount();
      setSyncFeedback(
        summary.synced > 0
          ? `${summary.synced} data berhasil diunggah.`
          : 'Semua data sudah tersinkron.',
      );
    } catch {
      setSyncFeedback('Gagal membaca antrean lokal.');
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
      setSyncFeedback('Mode Offline aktif.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handlePendingSync, refreshPendingCount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.data.latitude || !isCapturedLocationFresh()) {
      const ok = await handleUseCurrentLocation();
      if (!ok) return;
    }

    if (!navigator.onLine) {
      try {
        await queueDailyReport({ ...form.data });
        form.reset();
        await refreshPendingCount();
        setLocationFeedback({
          msg: 'Laporan disimpan di memori perangkat (Offline).',
          type: 'info',
        });
      } catch {
        setLocationFeedback({ msg: 'Gagal menyimpan data lokal.', type: 'error' });
      }
      return;
    }

    form.post(route('student.laporan-harian.store'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  return (
    <AppLayout title="Tulis Logbook">
      <Head title="Tulis Logbook | SIBERMAS" />

      <div className="mx-auto max-w-5xl space-y-10 pb-20">
        {/* --- TOP BAR --- */}
        <section className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-emerald-600 mb-2">
              <Link
                href={route('student.laporan-harian.index')}
                className="p-2 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </Link>
              <span className="text-sm font-bold uppercase tracking-wider text-xs font-semibold opacity-60">
                Riwayat Logbook
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tighter uppercase leading-none">
              Catat Aktivitas
            </h1>
            <p className="text-sm font-medium text-emerald-950">
              Unit: <span className="text-emerald-600 font-bold">{group?.name ?? 'Umum'}</span>
            </p>
          </div>

          <div
            className={clsx(
              'px-6 py-4 rounded-xl border flex items-center gap-4 transition-all',
              isOnline
                ? 'bg-emerald-50 border-emerald-50 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-700',
            )}
          >
            {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
            <div>
              <p className="text-sm font-bold font-semibold uppercase text-xs leading-none mb-1">
                {isOnline ? 'Sistem Online' : 'Sistem Offline'}
              </p>
              <p className="text-xs font-bold leading-none opacity-70">
                {pendingCount} Menunggu Sinkron
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- LEFT: FORM DATA --- */}
          <div className="lg:col-span-2 space-y-10">
            <div className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormInput
                  type="date"
                  label="Tanggal Kegiatan"
                  required
                  value={form.data.date}
                  onChange={(e) => form.setData('date', e.target.value)}
                  error={form.errors.date}
                  className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-bold text-emerald-800"
                />
                <FormInput
                  label="Lokasi (Nama Tempat)"
                  required
                  placeholder="Misal: Kantor Desa, Masjid, dsb"
                  value={form.data.location_name}
                  onChange={(e) => form.setData('location_name', e.target.value)}
                  error={form.errors.location_name}
                  className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-bold text-emerald-800"
                />
              </div>

              <FormInput
                label="Judul Aktivitas"
                required
                placeholder="Tulis judul yang deskriptif..."
                value={form.data.title}
                onChange={(e) => form.setData('title', e.target.value)}
                error={form.errors.title}
                className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-bold text-emerald-800"
              />

              <FormSelect
                label="Metode ABCD (Tahapan)"
                required
                value={form.data.abcd_stage}
                onChange={(e) => form.setData('abcd_stage', e.target.value)}
                error={form.errors.abcd_stage}
                className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-bold text-emerald-800"
              >
                <option value="">-- ILMU & PANDUAN KKN --</option>
                <option value="Discovery">DISCOVERY (Penemuan Aset)</option>
                <option value="Dream">DREAM (Visi Bersama)</option>
                <option value="Design">DESIGN (Perancangan)</option>
                <option value="Define">DEFINE (Aksi Nyata)</option>
                <option value="Destiny">DESTINY (Keberlanjutan)</option>
                <option value="Reflection">REFLECTION (Evaluasi)</option>
              </FormSelect>

              <FormTextarea
                label="Uraian Kegiatan"
                required
                placeholder="Gambarkan apa yang anda lakukan secara detail..."
                value={form.data.activity}
                onChange={(e) => form.setData('activity', e.target.value)}
                error={form.errors.activity}
                className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-medium"
              />

              <FormTextarea
                label="Refleksi Diri (Pelajaran)"
                placeholder="Apa yang anda petik dari kegiatan hari ini?"
                value={form.data.reflection}
                onChange={(e) => form.setData('reflection', e.target.value)}
                className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white py-4 font-medium opacity-80"
              />
            </div>

            {/* --- PHOTO UPLOAD --- */}
            <div className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                  <Camera size={24} />
                </div>
                <h2 className="text-xl font-bold text-emerald-950 font-bold text-center leading-none">
                  Bukti Visual
                </h2>
              </div>

              <div className="relative group">
                <div className="bg-emerald-50/30 border-2 border-dashed border-emerald-50/60 rounded-xl p-12 text-center group-hover:bg-emerald-50/30 transition-all">
                  <CloudUpload
                    size={48}
                    className="mx-auto text-slate-300 mb-4 group-hover:text-[#0d9488]"
                  />
                  <p className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                    {form.data.files.length > 0
                      ? `${form.data.files.length} Foto Terpilih`
                      : 'Klik untuk Unggah Foto'}
                  </p>
                  <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mt-2">
                    {isOnline ? 'JPG, PNG Maks 5MB' : 'Ukuran akan divalidasi saat sinkron'}
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-100">
                      <CloudUpload size={16} />
                      Pilih Foto
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          updateSelectedFiles(Array.from(e.target.files ?? []))
                        }
                        className="hidden"
                      />
                    </label>
                    {hasNativeCamera && (
                      <button
                        type="button"
                        onClick={() => void handleNativePhotoCapture()}
                        disabled={isCapturingPhoto}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Camera size={16} />
                        {isCapturingPhoto ? 'Membuka Kamera...' : 'Ambil Foto'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {mediaFeedback && (
                <p
                  className={clsx(
                    'rounded-xl px-4 py-3 text-sm font-medium',
                    mediaFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-700',
                  )}
                >
                  {mediaFeedback.msg}
                </p>
              )}
              {form.errors.files && (
                <p className="text-sm font-bold text-rose-500 uppercase px-4">
                  {form.errors.files}
                </p>
              )}
            </div>
          </div>

          {/* --- RIGHT: GEO & SUBMIT --- */}
          <div className="lg:col-span-1 space-y-10">
            <section className="rounded-xl border border-emerald-50/60 bg-white p-8 shadow-sm space-y-8 sticky top-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-3 leading-none">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Security & GPS
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <GeoInfoItem label="Lintang" value={coordinateSummary.latitude} />
                  <GeoInfoItem label="Bujur" value={coordinateSummary.longitude} />
                  <GeoInfoItem label="Akurasi" value={coordinateSummary.accuracy} color="emerald" />
                  <GeoInfoItem label="Tersimpan" value={coordinateSummary.capturedAt} />
                </div>

                {locationFeedback && (
                  <div
                    className={clsx(
                      'p-4 rounded-xl text-sm font-bold uppercase tracking-tight border',
                      locationFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-50 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-700',
                    )}
                  >
                    {locationFeedback.msg}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleUseCurrentLocation()}
                disabled={isFetchingLocation}
                className="w-full h-12 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 font-bold text-sm font-semibold uppercase text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Navigation size={14} strokeWidth={3} />{' '}
                {isFetchingLocation ? 'Locking GPS...' : 'Update Titik GPS'}
              </button>

              <div className="pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <Zap size={18} className="text-amber-600 shrink-0" />
                  <p className="text-sm font-bold text-amber-700 uppercase tracking-wider leading-relaxed">
                    Data GPS wajib dikunci dalam radius {geoPolicy.radius_meters}m dari titik acuan
                    unit.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={form.processing || isFetchingLocation}
                  className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider text-xs font-semibold shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {form.processing
                    ? 'Transmitting...'
                    : isOnline
                      ? 'Submit Logbook'
                      : 'Save Offline'}
                  <CloudUpload size={18} />
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function GeoInfoItem({
  label,
  value,
  color = 'slate',
}: {
  label: string;
  value: string;
  color?: 'slate' | 'emerald';
}) {
  return (
    <div className="bg-emerald-50/30 border border-emerald-50/60 p-4 rounded-xl">
      <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs leading-none mb-2">
        {label}
      </p>
      <p
        className={clsx(
          'text-xs font-bold uppercase tracking-tight leading-none',
          color === 'emerald' ? 'text-emerald-600' : 'text-emerald-950',
        )}
      >
        {value}
      </p>
    </div>
  );
}
