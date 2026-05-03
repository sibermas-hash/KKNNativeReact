import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from 'react';
import {
  Settings, ShieldCheck, Database, Cpu, Eye, EyeOff, Save, Layers,
  Server, Cloud, Info, RefreshCw, Zap, Fingerprint, History,
  ChevronRight, AlertCircle, Terminal, Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AiConfigPanel from '@/Components/Premium/AiConfigPanel';
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

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
  ai_status: { provider: string; is_healthy: boolean; model_text: string };
  ai_usage: { successful_heals: number };
}

/* ═══════════════════════════════════════════════════════════════
   KONFIGURASI GRUP
   Sesuai dengan group di SystemSettingController::initializeDefaults()
   ═══════════════════════════════════════════════════════════════ */

const GROUPS: Record<string, { title: string; icon: any; desc: string }> = {
  master_api:         { title: 'Integrasi SIKAD',      icon: Server,      desc: 'Konfigurasi jalur pertukaran data dengan sistem akademik universitas.' },
  general:            { title: 'Sistem Global',        icon: Settings,    desc: 'Preferensi inti yang mengatur perilaku fundamental platform.' },
  ai_settings:        { title: 'Kecerdasan Buatan',    icon: Cpu,         desc: 'Parameter operasional untuk asisten AI.' },
  storage_settings:   { title: 'Penyimpanan Berkas',   icon: Cloud,       desc: 'Pengaturan infrastruktur penyimpanan dokumen dan media.' },
  registration_rules: { title: 'Aturan Pendaftaran',   icon: ShieldCheck, desc: 'Logika bisnis dan batasan kualifikasi pendaftaran mahasiswa.' },
  content_settings:   { title: 'Konten Publik',        icon: History,     desc: 'Manajemen informasi statis dan narasi pada portal publik.' },
};

/* ═══════════════════════════════════════════════════════════════
   LABEL & HELPER
   Label bahasa Indonesia + keterangan singkat per config_key.
   Hanya config_key yang benar-benar ada di backend.
   ═══════════════════════════════════════════════════════════════ */

const LABELS: Record<string, string> = {
  // Integrasi SIKAD
  master_api_url:            'Alamat URL API Kampus',
  master_api_client_id:      'Client ID API Kampus',
  master_api_client_secret:  'Client Secret API Kampus',
  master_api_token:          'Token Statis API Kampus',
  // Sistem Global
  support_contact_label:     'Nama Narahubung Bantuan',
  support_whatsapp_number:   'Nomor WhatsApp Admin',
  // Penyimpanan
  storage_cloud_enabled:     'Aktifkan Cloud Storage',
  storage_key:               'Access Key ID',
  storage_secret:            'Secret Access Key',
  storage_bucket:            'Nama Bucket',
  storage_endpoint:          'Custom Endpoint URL',
  storage_region:            'Region Storage',
  // Aturan Pendaftaran
  cooling_period_hours:                'Masa Tunggu Pendaftaran Ulang (Jam)',
  max_group_moves:                     'Batas Pindah Kelompok (Kali)',
  group_leave_penalty_points:          'Denda Keluar Kelompok (Poin)',
  group_lock_days_before_start:        'Kunci Kelompok Sebelum Mulai (Hari)',
  registration_snapshot_cache_seconds: 'Cache Data Pendaftaran (Detik)',
  registration_lock_ttl_seconds:       'Waktu Reservasi Slot (Detik)',
  registration_lock_wait_seconds:      'Waktu Tunggu Antrean (Detik)',
  group_male_min_ratio:                'Minimal Laki-laki per Kelompok (%)',
  group_male_target_ratio:             'Target Ideal Laki-laki (%)',
  daily_report_geo_radius_meters:      'Batas Jarak Laporan GPS (Meter)',
  daily_report_geo_max_accuracy_meters:'Akurasi GPS Minimum (Meter)',
  // Konten Publik
  site_about:          'Tentang LPPM',
  site_visi:           'Visi LPPM',
  site_misi:           'Misi LPPM',
  site_schemes_title:  'Judul Halaman Skema',
  site_schemes_intro:  'Kata Pengantar Skema KKN',
  site_schemes_items:  'Daftar Skema (Data Teknis)',
  // AI
  gemini_api_key:      'Google Gemini API Key',
  ai_enabled:          'Aktifkan AI Asisten',
};

const HELPERS: Record<string, string> = {
  master_api_url:            'URL endpoint SIAKAD kampus untuk data master (mahasiswa, dosen, fakultas).',
  master_api_client_id:      'ID klien OAuth dari tim IT kampus.',
  master_api_client_secret:  'Kunci rahasia OAuth — disimpan terenkripsi.',
  master_api_token:          'Token statis alternatif jika kampus tidak menggunakan OAuth.',
  support_contact_label:     'Nama personil yang tampil sebagai pusat bantuan.',
  support_whatsapp_number:   'Format internasional tanpa simbol (Cth: 628xxx).',
  storage_cloud_enabled:     'Isi "true" atau "false". Untuk Cloudflare R2 / AWS S3.',
  storage_key:               'Access Key ID dari penyedia cloud.',
  storage_secret:            'Secret key — disimpan terenkripsi.',
  storage_bucket:            'Nama bucket yang sudah dibuat di penyedia cloud.',
  storage_endpoint:          'URL endpoint custom (wajib untuk R2, opsional S3).',
  storage_region:            'Region bucket. Untuk R2 gunakan "auto".',
  cooling_period_hours:                'Durasi blokir pendaftaran ulang setelah pembatalan.',
  max_group_moves:                     'Maksimal pindah kelompok dalam 1 periode.',
  group_leave_penalty_points:          'Potongan poin setiap keluar kelompok.',
  group_lock_days_before_start:        'Hari sebelum pelaksanaan, kelompok dikunci.',
  registration_snapshot_cache_seconds: 'Durasi cache portal. Semakin kecil = real-time, lebih berat.',
  registration_lock_ttl_seconds:       'Durasi kunci kursi saat proses formulir pendaftaran.',
  registration_lock_wait_seconds:      'Lama antrean sebelum giliran berikutnya.',
  group_male_min_ratio:                'Persentase minimum laki-laki (0–100).',
  group_male_target_ratio:             'Target ideal laki-laki. Harus ≥ minimum.',
  daily_report_geo_radius_meters:      'Radius presensi dari titik posko.',
  daily_report_geo_max_accuracy_meters:'Semakin kecil = semakin ketat deteksi manipulasi GPS.',
  site_about:          'Profil LPPM di halaman publik.',
  site_visi:           'Visi LPPM di portal publik.',
  site_misi:           'Misi LPPM di portal publik.',
  ai_enabled:          'Isi "true" untuk mengaktifkan, "false" untuk menonaktifkan.',
};

/* ═══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
   ═══════════════════════════════════════════════════════════════ */

export default function SystemSettings({ settings = {}, ai_status, ai_usage }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'ai'>('settings');
  const [activeGroup, setActiveGroup] = useState('general');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  const form = useForm({
    settings: Object.values(settings || {})
      .flat()
      .map((s) => ({ id: s.id, value: s.value ?? '' })),
  });

  const allSettings = useMemo(() => Object.values(settings || {}).flat(), [settings]);
  const visibleGroups = useMemo(
    () => Object.keys(settings).filter((g) => g !== 'ai_settings'),
    [settings],
  );

  const updateValue = (id: number, value: string) => {
    form.setData('settings', form.data.settings.map((s) => (s.id === id ? { ...s, value } : s)));
  };
  const getValue = (id: number) => form.data.settings.find((s) => s.id === id)?.value ?? '';
  const getError = (id: number) => {
    const idx = form.data.settings.findIndex((s) => s.id === id);
    return idx >= 0 ? form.errors[`settings.${idx}.value`] : undefined;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.patch(route('admin.pengaturan.sistem.update'));
  };
  const scrollToGroup = (group: string) => {
    setActiveGroup(group);
    document.getElementById(`group-${group}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AppLayout title="Pengaturan Sistem">
      <Head title="Pusat Kendali Sistem | SIBERMAS" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-emerald-950">
        {/* ── HEADER ── */}
        <PageHeader
          title="Pusat Kendali."
          subtitle="Konfigurasi parameter operasional, integrasi API, dan pemantauan AI."
          icon={Settings}
          groupLabel="Administrator System"
          stats={{ label: 'Variabel Aktif', value: `${allSettings.length} Konfigurasi`, icon: Database }}
        >
          <AiStatusBadge healthy={ai_status?.is_healthy} />
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ── SIDEBAR: NAVIGASI ── */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <ContentPanel title="Navigasi Menu" description="Pilih kategori pengaturan sistem." icon={Layers} padding={true}>
              <nav className="space-y-2">
                <NavTab active={activeTab === 'settings'} icon={Settings} label="Konfigurasi Sistem" onClick={() => setActiveTab('settings')} />
                <NavTab active={activeTab === 'ai'} icon={Cpu} label="Monitor AI" onClick={() => setActiveTab('ai')} />
              </nav>

              <AnimatePresence>
                {activeTab === 'settings' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Akses Cepat</p>
                      {visibleGroups.map((g) => (
                        <button key={g} onClick={() => scrollToGroup(g)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest',
                            activeGroup === g ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-emerald-950 hover:bg-slate-100',
                          )}
                        >
                          {React.createElement(GROUPS[g]?.icon || Layers, { size: 14 })}
                          {GROUPS[g]?.title ?? g}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContentPanel>

            {/* Tombol Simpan + Peringatan */}
            <ContentPanel padding={true}>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100/30">
                  <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-100">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Peringatan</h4>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight leading-relaxed">
                      Perubahan pada variabel sistem akan langsung berdampak pada alur bisnis aktif. Lakukan dengan hati-hati.
                    </p>
                  </div>
                </div>
                <button id="btn-save-system-settings" type="button" onClick={handleSubmit} disabled={form.processing}
                  className="w-full h-16 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-200 active:scale-[0.98] uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  {form.processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
                  Simpan Perubahan
                </button>
              </div>
            </ContentPanel>
          </div>

          {/* ── KONTEN UTAMA ── */}
          <div className="lg:col-span-2 space-y-10">
            {activeTab === 'settings' ? (
              <div className="space-y-12">
                {Object.entries(settings || {})
                  .filter(([g]) => g !== 'ai_settings')
                  .map(([group, items]) => {
                    const cfg = GROUPS[group] || { title: group, icon: Layers, desc: '' };
                    return (
                      <section key={group} id={`group-${group}`} className="scroll-mt-32">
                        <ContentPanel title={cfg.title} description={cfg.desc} icon={cfg.icon} padding={true}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {items.map((setting) => (
                              <SettingField
                                key={setting.id}
                                setting={setting}
                                value={getValue(setting.id)}
                                error={getError(setting.id)}
                                passwordVisible={!!visiblePasswords[setting.id]}
                                onTogglePassword={() => setVisiblePasswords((p) => ({ ...p, [setting.id]: !p[setting.id] }))}
                                onChange={(v) => updateValue(setting.id, v)}
                              />
                            ))}
                          </div>
                        </ContentPanel>
                      </section>
                    );
                  })}
              </div>
            ) : (
              <AiMonitorTab ai_status={ai_status} ai_usage={ai_usage} aiSettings={settings?.ai_settings || []} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-KOMPONEN
   ═══════════════════════════════════════════════════════════════ */

/** Tombol navigasi sidebar */
function NavTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={clsx(
        'w-full flex items-center justify-between p-4 rounded-2xl transition-all group',
        active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-slate-50 text-emerald-950 hover:bg-emerald-50',
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={active ? 3 : 2} />
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight size={16} className={clsx('transition-transform', active ? 'rotate-90' : 'group-hover:translate-x-1')} />
    </button>
  );
}

/** Badge status AI di header */
function AiStatusBadge({ healthy }: { healthy?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx('hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border-2 transition-all shadow-sm', healthy ? 'border-emerald-100' : 'border-rose-100')}>
        <div className={clsx('h-2 w-2 rounded-full animate-pulse', healthy ? 'bg-emerald-500' : 'bg-rose-500')} />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">AI Service</span>
          <span className="text-xs font-black text-emerald-950 uppercase">{healthy ? 'Operational' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}

/** Input/textarea untuk satu setting */
function SettingField({ setting, value, error, passwordVisible, onTogglePassword, onChange }: {
  setting: Setting; value: string; error?: string; passwordVisible: boolean;
  onTogglePassword: () => void; onChange: (v: string) => void;
}) {
  const isSecret = setting.type === 'password';
  const isLong = setting.type === 'textarea';
  const label = LABELS[setting.config_key] || setting.label;
  const helper = HELPERS[setting.config_key];

  return (
    <div className={clsx('space-y-2.5', isLong && 'md:col-span-2')}>
      {/* Label + config_key badge */}
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">{label}</label>
        <code className="text-[9px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-900 tracking-tighter">{setting.config_key}</code>
      </div>

      {/* Input */}
      {isLong ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5}
          className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 focus:bg-white outline-none transition-all shadow-inner"
          placeholder={`Masukkan ${label}...`}
        />
      ) : (
        <div className="relative">
          <input
            type={isSecret && !passwordVisible ? 'password' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              'w-full h-14 px-5 rounded-2xl border-2 transition-all shadow-inner outline-none text-xs font-bold',
              error ? 'border-rose-100 bg-rose-50 text-rose-900 focus:border-rose-600' : 'border-slate-50 bg-[#F8FAF9] text-emerald-950 focus:border-emerald-600 focus:bg-white',
              isSecret && 'pr-12 font-mono tracking-widest',
            )}
            placeholder={`Entri ${label}...`}
          />
          {isSecret && (
            <button type="button" onClick={onTogglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-colors"
            >
              {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      {helper && (
        <div className="flex gap-2 items-start mt-1 pl-1">
          <Info size={14} className="text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">{helper}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="text-[10px] font-black text-rose-600 mt-1 pl-1 uppercase tracking-widest"
        >{error}</motion.p>
      )}
    </div>
  );
}

/** Tab monitor AI */
function AiMonitorTab({ ai_status, ai_usage, aiSettings }: {
  ai_status: Props['ai_status']; ai_usage: Props['ai_usage']; aiSettings: Setting[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard icon={Zap} label="Provider Engine" value={ai_status.provider} desc={ai_status.model_text} color="emerald" />
        <MetricCard icon={Fingerprint} label="Status Sinyal" value={ai_status.is_healthy ? 'SECURED' : 'OFFLINE'}
          desc={ai_status.is_healthy ? 'API Key Valid & Ready' : 'Memerlukan Konfigurasi'} color={ai_status.is_healthy ? 'emerald' : 'rose'} />
        <MetricCard icon={History} label="Audit Perbaikan" value={ai_usage?.successful_heals?.toLocaleString('id-ID') || '0'} desc="Total Intervensi Berhasil" color="emerald" />
        <MetricCard icon={Activity} label="Latency Status" value="Optimized" desc="Responsivitas Sistem AI" color="emerald" />
      </div>

      <ContentPanel title="Infrastruktur AI" description="Manajemen koneksi ke Large Language Model (LLM) untuk asisten otomatis." icon={Cpu} padding={true}>
        <AiConfigPanel settings={aiSettings} />
      </ContentPanel>

      {/* Banner AI */}
      <div className="bg-emerald-950 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 -mr-10 -mt-10">
          <Terminal size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="h-24 w-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-xl shadow-inner shrink-0 animate-pulse">
            <Cpu size={48} strokeWidth={2.5} />
          </div>
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl font-black text-white uppercase tracking-wider">AI Automated Guard</h3>
            <p className="text-sm font-bold text-emerald-400/70 leading-relaxed uppercase tracking-tight max-w-xl">
              Sistem ini menggunakan Google Gemini untuk menganalisis laporan, mendeteksi inkonsistensi data,
              dan memberikan rekomendasi perbaikan instan kepada mahasiswa.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Kartu metrik AI */
function MetricCard({ icon: Icon, label, value, desc, color }: {
  icon: any; label: string; value: string | number; desc: string; color: 'emerald' | 'rose';
}) {
  return (
    <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-100 transition-all group relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500"><Icon size={80} /></div>
      <div className="space-y-6 relative z-10">
        <div className={clsx('h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg',
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <p className={clsx('text-3xl font-black truncate tracking-tighter leading-none', color === 'emerald' ? 'text-emerald-950' : 'text-rose-950')}>{value}</p>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
          <span className="block text-[11px] font-bold text-emerald-800/40 uppercase tracking-tight mt-1">{desc}</span>
        </div>
      </div>
    </div>
  );
}
