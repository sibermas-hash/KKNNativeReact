import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Settings,
  ShieldCheck,
  Database,
  Cpu,
  Eye,
  EyeOff,
  Save,
  Layers,
  Globe,
  Server,
  Cloud,
  Info,
  Zap,
  Fingerprint,
  Target,
  Activity,
  Binary,
  Lock,
  Unlock,
  RefreshCw,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface Setting {
  id: number;
  config_key: string;
  label: string;
  value: string | null;
  masked_value?: string | null;
  type: string;
  group: string;
  is_secret?: boolean;
}

interface Props {
  settings: Record<string, Setting[]>;
  title: string;
}

const GROUP_TITLES: Record<string, string> = {
  master_api: 'Integration_SIKAD',
  general: 'Portal_Foundation',
  ai_settings: 'Intelligence_Kernel',
  storage_settings: 'Vault_Storage',
  registration_rules: 'Compliance_Governance',
  content_settings: 'Public_Interface',
};

const GROUP_ICONS: Record<string, any> = {
  master_api: Server,
  general: Settings,
  ai_settings: Cpu,
  storage_settings: Cloud,
  registration_rules: ShieldCheck,
  content_settings: Globe,
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
  master_api: 'Pengaturan jalur pertukaran data dengan sistem internal universitas.',
  general: 'Pengaturan utama yang mempengaruhi cara kerja website secara keseluruhan.',
  ai_settings: 'Konfigurasi teknologi kecerdasan buatan untuk membantu proses verifikasi.',
  storage_settings: 'Aturan tempat penyimpanan dokumen dan foto kegiatan.',
  registration_rules: 'Kriteria kelayakan mahasiswa dan aturan pemilihan kelompok.',
  content_settings: 'Mengubah kata-kata dan informasi yang tampil di halaman depan.',
};

const LABEL_OVERRIDE: Record<string, string> = {
  cooling_period_hours: 'Masa Tunggu Pendaftaran (Jam)',
  daily_report_geo_max_accuracy_meters: 'Akurasi GPS Minimum (Meter)',
  daily_report_geo_radius_meters: 'Batas Jarak Laporan (Meter)',
  enable_gpa_requirement: 'Aktifkan Syarat IPK',
  group_leave_penalty_points: 'Denda Keluar Kelompok (Poin)',
  group_lock_days_before_start: 'Kunci Kelompok Sebelum Mulai (Hari)',
  group_male_min_ratio: 'Minimal Laki-laki per Kelompok',
  group_male_target_ratio: 'Target Ideal Laki-laki',
  max_group_moves: 'Batas Pindah Kelompok (Kali)',
  min_gpa_registration: 'Batas IPK Minimal',
  min_sks_registration: 'Batas SKS Lulus Minimal',
  registration_lock_ttl_seconds: 'Waktu Reservasi Slot (Detik)',
  registration_lock_wait_seconds: 'Waktu Tunggu Antrean (Detik)',
  registration_snapshot_cache_seconds: 'Cache Data Pendaftaran (Detik)',
  site_about: 'Tentang LPPM',
  site_about_title: 'Judul Profil LPPM',
  site_misi: 'Misi LPPM',
  site_schemes_intro: 'Kata Pengantar Skema KKN',
  site_schemes_items: 'Daftar Skema (Data Teknis)',
  site_schemes_title: 'Judul Halaman Skema',
  site_visi: 'Visi LPPM',
  support_contact_label: 'Nama Narahubung Bantuan',
  support_whatsapp_number: 'Nomor WhatsApp Admin',
};

const SETTING_HELPERS: Record<string, string> = {
  support_contact_label: 'Nama personil yang bisa dihubungi jika mahasiswa kesulitan.',
  support_whatsapp_number: 'Gunakan angka saja, contoh: 6281234567890.',
  daily_report_geo_radius_meters:
    'Mahasiswa hanya bisa absen jika dalam jarak ini dari lokasi posko.',
  daily_report_geo_max_accuracy_meters:
    'Membatasi penggunaan dummy GPS/GPS palsu yang tidak akurat.',
  registration_lock_ttl_seconds:
    'Berapa lama slot "dikunci" saat mahasiswa sedang mengisi formulir.',
  min_sks_registration: 'Syarat minimal total SKS yang sudah ditempuh mahasiswa.',
  cooling_period_hours:
    'Waktu jeda yang dibutuhkan sebelum pendaftaran ulang jika sebelumnya dibatalkan.',
  group_male_min_ratio: 'Minimal jumlah mahasiswa pria agar pembagian dalam tim seimbang.',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function SystemSettings({ settings = {} }: Props) {
  const form = useForm({
    settings: Object.values(settings || {})
      .flat()
      .map((setting) => ({
        id: setting.id,
        value: setting.value ?? '',
      })),
  });

  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const flattened = useMemo(() => Object.values(settings || {}).flat(), [settings]);

  const updateValue = (id: number, value: string) => {
    form.setData(
      'settings',
      form.data.settings.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const getValue = (id: number) => form.data.settings.find((item) => item.id === id)?.value ?? '';

  const getError = (id: number) => {
    const index = form.data.settings.findIndex((item) => item.id === id);
    return index >= 0 ? form.errors[`settings.${index}.value`] : undefined;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.patch(route('admin.pengaturan.sistem.update'));
  };

  const groupCount = Object.keys(settings || {}).length;

  return (
    <AppLayout title="Global Governance Controller">
      <Head title="Pengaturan Sistem | SIKKKN" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16 font-sans"
      >
        {/* --- COMMAND HEADER --- */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-emerald-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">
                Security Node / Global Governance Controller
              </span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 tracking-tight leading-tight flex flex-col">
              System <span>Kernel.</span>
            </h1>
            <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed max-w-2xl opacity-80">
              Pusat konfigurasi parameter operasional. <br />
              <span className="text-emerald-950 not-italic">
                Penetapan ambang batas teknis, integrasi API, dan kebijakan tata kelola sistem pada
                level root.
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="h-12 px-6 bg-emerald-900 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Settings size={80} strokeWidth={1} />
              </div>
              <div className="flex flex-col justify-center border-r border-white/10 pr-10">
                <span className="text-sm font-bold text-emerald-500 font-semibold text-xs leading-none mb-2">
                  Registry Load
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-white tracking-tight leading-none">
                    {flattened.length}
                  </span>
                  <span className="text-sm font-bold text-emerald-950 font-semibold text-xs">
                    Params
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-white/40 font-semibold text-xs leading-none mb-2">
                  Grip Clusters
                </span>
                <span className="text-2xl font-bold text-white font-semibold text-xs">
                  {groupCount}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- ANALYTICS BENTO BOARD --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard
            label="System Integrity"
            value="OPTIMIZED"
            icon={ShieldCheck}
            color="emerald"
            desc="Global policies authenticated"
          />
          <MetricCard
            label="Kernel Status"
            value="SYNCHRONIZED"
            icon={Activity}
            color="emerald"
            desc="Operational parameters nominal"
          />
          <MetricCard
            label="Registry Density"
            value={`${flattened.length} NODES`}
            icon={Database}
            color="emerald"
            desc="Active configuration vectors"
          />
          <MetricCard
            label="Logic Engine"
            value="ENFORCED"
            icon={Binary}
            color="emerald"
            desc="Runtime constraints active"
          />
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-16">
          <AnimatePresence>
            {Object.entries(settings || {}).map(([group, items]) => {
              const GroupIcon = GROUP_ICONS[group] || Layers;
              return (
                <motion.section
                  key={group}
                  variants={itemVariants}
                  className="bg-white border border-emerald-100/60 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/section"
                >
                  {/* Section Header */}
                  <div className="px-6 py-6 bg-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                      <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                        <GroupIcon size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold">
                          Sub-Registry Cluster
                        </h3>
                        <p className="text-2xl font-bold text-white font-bold text-center leading-none">
                          {GROUP_TITLES[group] ?? group.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <span className="text-sm font-bold font-semibold text-xs text-white/40">
                        Process Scope
                      </span>
                      <p className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-relaxed max-w-sm md:text-right">
                        {GROUP_DESCRIPTIONS[group]}
                      </p>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="p-12 grid gap-6 md:grid-cols-2">
                    {items.map((setting) => {
                      const isSecret = setting.type === 'password';
                      const isLongText = setting.type === 'textarea';

                      return (
                        <div
                          key={setting.id}
                          className={clsx('space-y-4', isLongText && 'md:col-span-2')}
                        >
                          <div className="flex items-center justify-between px-2">
                            <label className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold">
                              {LABEL_OVERRIDE[setting.config_key] || setting.label}
                            </label>
                            <span className="text-sm font-mono text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 font-bold font-semibold text-xs leading-none">
                              {setting.config_key}
                            </span>
                          </div>

                          <div className="relative group/input">
                            {isLongText ? (
                              <textarea
                                value={getValue(setting.id)}
                                onChange={(event) => updateValue(setting.id, event.target.value)}
                                rows={4}
                                className="w-full px-6 py-6 rounded-xl bg-emerald-50/30 border-none text-sm font-bold text-emerald-950 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-200 min-h-[160px] leading-relaxed"
                              />
                            ) : (
                              <div className="relative">
                                <input
                                  type={
                                    isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'
                                  }
                                  value={getValue(setting.id)}
                                  onChange={(event) => updateValue(setting.id, event.target.value)}
                                  className={clsx(
                                    'w-full h-18 px-6 rounded-xl bg-emerald-50/30 border-none text-[14px] font-bold text-emerald-950 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-200',
                                    isSecret && 'pr-20 font-mono tracking-normal',
                                    getError(setting.id) && 'ring-4 ring-rose-500/10',
                                  )}
                                />
                                {isSecret && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVisiblePasswords((prev) => ({
                                        ...prev,
                                        [setting.id]: !prev[setting.id],
                                      }))
                                    }
                                    className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
                                  >
                                    {visiblePasswords[setting.id] ? (
                                      <EyeOff size={18} strokeWidth={2.5} />
                                    ) : (
                                      <Eye size={18} strokeWidth={2.5} />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <AnimatePresence>
                            {SETTING_HELPERS[setting.config_key] && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 items-start px-2 text-emerald-950"
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <p className="text-sm font-bold leading-relaxed text-emerald-950 tracking-tight">
                                  {SETTING_HELPERS[setting.config_key]}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {getError(setting.id) && (
                            <p className="text-sm font-bold text-rose-500 font-semibold text-xs ml-4">
                              PROTOCOL_ERROR: {getError(setting.id)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>

          {/* --- DEPLOYMENT CONTROL BAR --- */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[3.5rem] border border-emerald-100/60 shadow-2xl p-12 flex flex-col md:flex-row items-center justify-between gap-6 sticky bottom-10 z-50 backdrop-blur-3xl bg-white/95 border-emerald-500/20"
          >
            <div className="flex items-center gap-6">
              <div className="h-10 w-20 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <ShieldCheck size={36} strokeWidth={2.5} />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-2xl font-bold font-bold text-center text-bg-emerald-100">
                  Commit Configuration Buffer
                </h4>
                <div className="flex items-center gap-3">
                  <Fingerprint size={12} className="text-slate-300" />
                  <p className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold leading-none">
                    Authorized parameter injection authorized for{' '}
                    <span className="text-emerald-600 font-bold">{flattened.length} NODES</span>
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={form.processing}
              className="bg-emerald-900 text-white hover:bg-emerald-600 px-16 h-10 rounded-[2.5rem] font-bold text-sm transition-all shadow-sm flex items-center gap-6 active:scale-95 disabled:opacity-20 group duration-500 tracking-wider text-xs font-semibold"
            >
              <AnimatePresence mode="wait">
                {form.processing ? (
                  <motion.div
                    key="loading"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <RefreshCw size={24} />
                  </motion.div>
                ) : (
                  <motion.div key="default">
                    <Save size={24} strokeWidth={3} className="group-hover:animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
              {form.processing ? 'COMMITING_CHANGES...' : 'DEPLOY_PARAMETERS'}
            </Button>
          </motion.div>
        </form>

        {/* --- FOOTER GOVERNANCE --- */}
        <motion.div
          variants={itemVariants}
          className="bg-emerald-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
            <Target size={300} strokeWidth={1} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-5">
                <Lock className="text-emerald-500" size={32} />
                <div className="space-y-1">
                  <span className="text-sm font-bold tracking-wider text-xs font-semibold text-emerald-500">
                    Kernel Integrity
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight leading-none">
                    Global System Parameterization
                  </h3>
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed max-w-2xl opacity-80">
                Pengaturan sistem adalah jantung dari operasional platform. Perubahan pada parameter
                fundamental ini akan berdampak langsung pada seluruh alur pendaftaran, verifikasi,
                dan pelaporan KKN di seluruh unit.
              </p>
            </div>
            <div className="px-6 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
              <Activity size={28} className="text-emerald-500" />
              <span className="text-sm font-bold text-white/40 tracking-wider text-xs font-semibold">
                Governance Loop Active
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  desc,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'emerald' | 'amber';
  desc: string;
}) {
  return (
    <div className="bg-white border border-emerald-100/60 rounded-xl p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Icon size={140} strokeWidth={1} />
      </div>
      <div
        className={clsx(
          'h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6',
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
        )}
      >
        <Icon size={30} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold mb-2 leading-none">
          {label}
        </p>
        <p className="text-3xl font-bold tracking-tight text-emerald-950 group-hover:text-emerald-600 transition-colors leading-none">
          {value}
        </p>
        <p className="mt-6 text-sm font-bold text-slate-300 tracking-wider text-xs font-semibold">
          {desc}
        </p>
      </div>
    </div>
  );
}
