import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Home,
  Globe2,
  Save,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';

interface DomisiliData {
  lat: number | null;
  lng: number | null;
  address: string | null;
  village: string | null;
  district: string | null;
  regency: string | null;
  province: string | null;
  postal_code: string | null;
  registered_at: string | null;
}

interface Props {
  domisili: DomisiliData | null;
  hasDomisili: boolean;
  message?: string;
}

export default function DomisiliEdit({ domisili, hasDomisili, message }: Props) {
  const { auth } = usePage<PageProps>().props;
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);

  const form = useForm({
    lat: domisili?.lat ?? 0,
    lng: domisili?.lng ?? 0,
    address: domisili?.address ?? '',
    village: domisili?.village ?? '',
    district: domisili?.district ?? '',
    regency: domisili?.regency ?? '',
    province: domisili?.province ?? '',
    postal_code: domisili?.postal_code ?? '',
  });

  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS. Gunakan browser modern.');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('loading');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setData({
          ...form.data,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus('success');
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Izin lokasi ditolak. Aktifkan GPS di pengaturan browser.',
          2: 'Lokasi tidak tersedia. Pastikan GPS aktif.',
          3: 'Timeout saat mengambil lokasi. Coba lagi.',
        };
        setGpsError(messages[error.code] || 'Gagal mengambil lokasi.');
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post('/mahasiswa/domisili', {
      preserveScroll: true,
    });
  };

  if (message) {
    return (
      <AppLayout title="Lokasi Domisili">
        <Head title="Lokasi Domisili" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
            Tidak Tersedia
          </h2>
          <p className="text-sm text-slate-500 font-medium">{message}</p>
        </div>
      </AppLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <AppLayout title="Lokasi Domisili">
      <Head title="Registrasi Lokasi Domisili" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 space-y-8"
      >
        {/* HEADER */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
              KKN Mandiri / Berkebutuhan Khusus
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Registrasi Lokasi Domisili
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl">
            Daftarkan koordinat GPS rumah Anda sebagai rujukan absensi harian.
            Lokasi ini akan digunakan untuk validasi geofencing saat KKN.
          </p>
        </motion.div>

        {/* STATUS CARD */}
        {hasDomisili && (
          <motion.div
            variants={itemVariants}
            className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-5 flex items-start gap-4"
          >
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">
                Lokasi Terdaftar
              </p>
              <p className="text-sm font-semibold text-emerald-800">
                {domisili?.address || 'Koordinat tersimpan'}
              </p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">
                {domisili?.lat?.toFixed(6)}, {domisili?.lng?.toFixed(6)}
                {domisili?.registered_at && ` • Diregistrasi: ${new Date(domisili.registered_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            </div>
          </motion.div>
        )}

        {/* INFO CARD */}
        <motion.div
          variants={itemVariants}
          className="bg-blue-50/50 ring-1 ring-blue-100 rounded-xl p-5 flex items-start gap-4"
        >
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black text-blue-900 uppercase tracking-widest">
              Cara Penggunaan
            </p>
            <ul className="space-y-1 text-xs text-blue-800 font-medium leading-relaxed">
              <li>1. Klik tombol <strong>"Ambil Lokasi GPS"</strong> saat berada di rumah Anda.</li>
              <li>2. Izinkan browser mengakses lokasi perangkat Anda.</li>
              <li>3. Lengkapi alamat, lalu klik <strong>"Simpan Lokasi Domisili"</strong>.</li>
            </ul>
          </div>
        </motion.div>

        {/* FORM */}
        <motion.div variants={itemVariants}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GPS BUTTON */}
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Globe2 size={16} className="text-emerald-600" /> Koordinat GPS
              </h3>

              <button
                type="button"
                onClick={getGPSLocation}
                disabled={gpsStatus === 'loading'}
                className={clsx(
                  'w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.98]',
                  gpsStatus === 'loading'
                    ? 'bg-slate-200 text-slate-500 cursor-wait'
                    : gpsStatus === 'success'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                )}
              >
                {gpsStatus === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Mengambil Lokasi...
                  </>
                ) : gpsStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={20} /> Lokasi Berhasil Ditangkap
                  </>
                ) : (
                  <>
                    <Navigation size={20} /> Ambil Lokasi GPS Sekarang
                  </>
                )}
              </button>

              <AnimatePresence>
                {gpsError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 ring-1 ring-rose-200 rounded-lg p-3 flex items-start gap-2"
                  >
                    <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-700">{gpsError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.data.lat}
                    onChange={(e) => form.setData('lat', parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 outline-none bg-slate-50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.data.lng}
                    onChange={(e) => form.setData('lng', parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 outline-none bg-slate-50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ADDRESS FIELDS */}
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Home size={16} className="text-emerald-600" /> Detail Alamat
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Alamat Lengkap *
                </label>
                <textarea
                  value={form.data.address}
                  onChange={(e) => form.setData('address', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-600 outline-none min-h-[80px] bg-slate-50"
                  placeholder="Jl. Contoh No. 123, RT 01/RW 02"
                  required
                />
                {form.errors.address && (
                  <p className="text-[10px] font-bold text-rose-600">{form.errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    value={form.data.village}
                    onChange={(e) => form.setData('village', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-600 outline-none bg-slate-50"
                    placeholder="Kelurahan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={form.data.district}
                    onChange={(e) => form.setData('district', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-600 outline-none bg-slate-50"
                    placeholder="Kecamatan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    value={form.data.regency}
                    onChange={(e) => form.setData('regency', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-600 outline-none bg-slate-50"
                    placeholder="Kabupaten"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={form.data.province}
                    onChange={(e) => form.setData('province', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-600 outline-none bg-slate-50"
                    placeholder="Jawa Tengah"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={form.data.postal_code}
                    onChange={(e) => form.setData('postal_code', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 outline-none bg-slate-50"
                    placeholder="53115"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={form.processing || form.data.lat === 0}
              className={clsx(
                'w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]',
                form.processing
                  ? 'bg-slate-300 text-slate-500 cursor-wait'
                  : form.data.lat !== 0
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              {form.processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> {hasDomisili ? 'Perbarui Lokasi Domisili' : 'Simpan Lokasi Domisili'}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
