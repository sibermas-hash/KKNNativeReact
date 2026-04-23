import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Settings, ShieldCheck, Database, Cpu, Eye, EyeOff, Save, Layers, Server, Cloud, Info, RefreshCw, Zap, Fingerprint, History,
  ChevronRight, AlertCircle, Terminal, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AiConfigPanel from '@/Components/Premium/AiConfigPanel';
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';

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

interface AiStatusProps {
  provider: string;
  is_healthy: boolean;
  model_text: string;
}

interface AiUsageProps {
  successful_heals: number;
}

interface Props {
  settings: Record<string, Setting[]>;
  title: string;
  ai_status: AiStatusProps;
  ai_usage: AiUsageProps;
}

const GROUP_TITLES: Record<string, string> = {
  master_api: 'Integrasi SIKAD',
  general: 'Sistem Global',
  ai_settings: 'Kecerdasan Buatan (AI)',
  storage_settings: 'Penyimpanan Berkas',
  registration_rules: 'Aturan Pendaftaran',
  content_settings: 'Konten Publik',
};

const GROUP_ICONS: Record<string, any> = {
  master_api: Server,
  general: Settings,
  ai_settings: Cpu,
  storage_settings: Cloud,
  registration_rules: ShieldCheck,
  content_settings: History,
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
  master_api: 'Konfigurasi jalur pertukaran data dengan sistem akademik universitas.',
  general: 'Preferensi inti yang mengatur perilaku fundamental platform.',
  ai_settings: 'Parameter operasional untuk asisten intelegensi buatan.',
  storage_settings: 'Pengaturan infrastruktur penyimpanan dokumen dan media.',
  registration_rules: 'Logika bisnis dan batasan kualifikasi pendaftaran mahasiswa.',
  content_settings: 'Manajemen informasi statis dan narasi pada portal publik.',
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
  support_contact_label: 'Nama personil yang akan ditampilkan sebagai pusat bantuan.',
  support_whatsapp_number: 'Pastikan menggunakan format internasional tanpa simbol (Cth: 628xxx).',
  daily_report_geo_radius_meters: 'Radius maksimal mahasiswa diizinkan melakukan presensi dari titik posko.',
  daily_report_geo_max_accuracy_meters: 'Semakin kecil nilainya, semakin ketat sistem mendeteksi manipulasi lokasi.',
  registration_lock_ttl_seconds: 'Durasi waktu kunci kursi saat mahasiswa memproses formulir pendaftaran.',
  min_sks_registration: 'Kredit semester minimum yang wajib ditempuh untuk syarat eligibility.',
  cooling_period_hours: 'Durasi pemblokiran pendaftaran ulang setelah pembatalan oleh sistem.',
};

export default function SystemSettings({ settings = {}, ai_status, ai_usage }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'ai'>('settings');
  const [activeGroup, setActiveGroup] = useState<string>('general');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  const form = useForm({
    settings: Object.values(settings || {}).flat().map((setting) => ({
      id: setting.id,
      value: setting.value ?? '',
    })),
  });

  const flattened = useMemo(() => Object.values(settings || {}).flat(), [settings]);
  const settingGroups = useMemo(() => Object.keys(settings).filter(g => g !== 'ai_settings'), [settings]);

  const updateValue = (id: number, value: string) => {
    form.setData('settings', form.data.settings.map((item) => (item.id === id ? { ...item, value } : item)));
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

  // Auto-scroll to group if settings tab is active
  const scrollToGroup = (group: string) => {
    setActiveGroup(group);
    const element = document.getElementById(`group-${group}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AppLayout title="Pengaturan Sistem">
      <Head title="Pusat Kendali Sistem | SIBERDAYA" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-emerald-950">
        
        <PageHeader 
          title="Pusat Kendali."
          subtitle="Konfigurasi parameter operasional, integrasi API, dan pemantauan intelegensi buatan."
          icon={Settings}
          groupLabel="Administrator System"
          stats={{
            label: 'Variabel Aktif',
            value: `${flattened.length} Konfigurasi`,
            icon: Database
          }}
        >
          <div className="flex items-center gap-3">
             <div className={clsx(
                "hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border-2 transition-all shadow-sm",
                ai_status?.is_healthy ? "border-emerald-100" : "border-rose-100"
              )}>
                <div className={clsx("h-2 w-2 rounded-full animate-pulse", ai_status?.is_healthy ? "bg-emerald-500" : "bg-rose-500")} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">AI Service</span>
                  <span className="text-xs font-black text-emerald-950 uppercase">{ai_status?.is_healthy ? 'Operational' : 'Disconnected'}</span>
                </div>
              </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* COLUMN 1: NAVIGATION & ACTIONS (1/3) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            <ContentPanel title="Navigasi Menu" description="Pilih kategori pengaturan sistem." icon={Layers} padding={true}>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                    activeTab === 'settings' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200" : "bg-slate-50 text-emerald-950 hover:bg-emerald-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} strokeWidth={activeTab === 'settings' ? 3 : 2} />
                    <span className="text-xs font-black uppercase tracking-widest">Konfigurasi Sistem</span>
                  </div>
                  <ChevronRight size={16} className={clsx("transition-transform", activeTab === 'settings' ? "rotate-90" : "group-hover:translate-x-1")} />
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                    activeTab === 'ai' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200" : "bg-slate-50 text-emerald-950 hover:bg-emerald-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Cpu size={18} strokeWidth={activeTab === 'ai' ? 3 : 2} />
                    <span className="text-xs font-black uppercase tracking-widest">Monitor AI</span>
                  </div>
                  <ChevronRight size={16} className={clsx("transition-transform", activeTab === 'ai' ? "rotate-90" : "group-hover:translate-x-1")} />
                </button>
              </nav>

              <AnimatePresence>
                {activeTab === 'settings' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Quick Access</p>
                      {settingGroups.map(group => (
                        <button
                          key={group}
                          onClick={() => scrollToGroup(group)}
                          className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                            activeGroup === group ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "text-emerald-950 hover:bg-slate-100"
                          )}
                        >
                          {React.createElement(GROUP_ICONS[group] || Layers, { size: 14 })}
                          {GROUP_TITLES[group]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ContentPanel>

            <ContentPanel padding={true}>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100/30">
                    <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-100">
                      <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Peringatan</h4>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight leading-relaxed">
                        Perubahan pada variabel sistem akan langsung berdampak pada alur bisnis aktif. Lakukan perubahan dengan hati-hati.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-save-system-settings"
                    type="button"
                    onClick={handleSubmit}
                    disabled={form.processing}
                    className="w-full h-16 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-200 active:scale-[0.98] uppercase tracking-[0.2em] disabled:opacity-50"
                  >
                    {form.processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
                    Simpan Perubahan
                  </button>
                </div>
            </ContentPanel>
          </div>

          {/* COLUMN 2: SETTINGS CONTENT (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            
            {activeTab === 'settings' ? (
              <div className="space-y-12">
                {Object.entries(settings || {}).filter(([g]) => g !== 'ai_settings').map(([group, items]) => {
                  const GroupIcon = GROUP_ICONS[group] || Layers;
                  return (
                    <section key={group} id={`group-${group}`} className="scroll-mt-32">
                      <ContentPanel
                        title={GROUP_TITLES[group] ?? group.toUpperCase()}
                        description={GROUP_DESCRIPTIONS[group]}
                        icon={GroupIcon}
                        padding={true}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {items.map((setting) => {
                            const isSecret = setting.type === 'password';
                            const isLongText = setting.type === 'textarea';

                            return (
                              <div key={setting.id} className={clsx('space-y-2.5', isLongText && 'md:col-span-2')}>
                                <div className="flex items-center justify-between px-1">
                                  <label className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">{LABEL_OVERRIDE[setting.config_key] || setting.label}</label>
                                  <code className="text-[9px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-900 tracking-tighter">{setting.config_key}</code>
                                </div>

                                <div className="relative group">
                                  {isLongText ? (
                                    <textarea
                                      value={getValue(setting.id)}
                                      onChange={(event) => updateValue(setting.id, event.target.value)}
                                      rows={5}
                                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 bg-[#F8FAF9] text-xs font-bold text-emerald-950 focus:border-emerald-600 focus:bg-white outline-none transition-all shadow-inner"
                                      placeholder={`Masukkan ${setting.label}...`}
                                    />
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type={isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'}
                                        value={getValue(setting.id)}
                                        onChange={(event) => updateValue(setting.id, event.target.value)}
                                        className={clsx(
                                          'w-full h-14 px-5 rounded-2xl border-2 transition-all shadow-inner outline-none text-xs font-bold',
                                          getError(setting.id) ? 'border-rose-100 bg-rose-50 text-rose-900 focus:border-rose-600' : 'border-slate-50 bg-[#F8FAF9] text-emerald-950 focus:border-emerald-600 focus:bg-white',
                                          isSecret && 'pr-12 font-mono tracking-widest'
                                        )}
                                        placeholder={`Entri ${setting.label}...`}
                                      />
                                      {isSecret && (
                                        <button 
                                          type="button" 
                                          onClick={() => setVisiblePasswords((prev) => ({ ...prev, [setting.id]: !prev[setting.id] }))} 
                                          className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-colors"
                                        >
                                          {visiblePasswords[setting.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {SETTING_HELPERS[setting.config_key] && (
                                  <div className="flex gap-2 items-start mt-1 pl-1">
                                    <Info size={14} className="text-emerald-300 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">{SETTING_HELPERS[setting.config_key]}</p>
                                  </div>
                                )}

                                {getError(setting.id) && (
                                  <motion.p 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[10px] font-black text-rose-600 mt-1 pl-1 uppercase tracking-widest"
                                  >
                                    {getError(setting.id)}
                                  </motion.p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ContentPanel>
                    </section>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MetricCore icon={Zap} label="Provider Engine" value={ai_status.provider} desc={ai_status.model_text} color="emerald" />
                  <MetricCore icon={Fingerprint} label="Status Sinyal" value={ai_status.is_healthy ? "SECURED" : "OFFLINE"} desc={ai_status.is_healthy ? "API Key Valid & Ready" : "Memerlukan Konfigurasi"} color={ai_status.is_healthy ? "emerald" : "rose"} />
                  <MetricCore icon={History} label="Audit Perbaikan" value={ai_usage?.successful_heals?.toLocaleString('id-ID') || '0'} desc="Total Intervensi Berhasil" color="emerald" />
                  <MetricCore icon={Activity} label="Latency Status" value="Optimized" desc="Responsivitas Sistem AI" color="emerald" />
                </div>

                <ContentPanel
                  title="Infrastruktur Intelegensi"
                  description="Manajemen koneksi ke Large Language Model (LLM) untuk asisten otomatis."
                  icon={Cpu}
                  padding={true}
                >
                   <AiConfigPanel settings={settings?.ai_settings || []} />
                </ContentPanel>

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
                        Sistem ini menggunakan Google Gemini untuk menganalisis laporan, mendeteksi inkonsistensi data, dan memberikan rekomendasi perbaikan instan kepada mahasiswa.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCore({ icon: Icon, label, value, desc, color }: { icon: any, label: string, value: string | number, desc: string, color: 'emerald' | 'rose' }) {
  return (
    <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-100 transition-all group relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500">
        <Icon size={80} />
      </div>
      <div className="space-y-6 relative z-10">
        <div className={clsx(
          "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
          color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <p className={clsx(
            "text-3xl font-black truncate tracking-tighter leading-none",
            color === 'emerald' ? "text-emerald-950" : "text-rose-950"
          )}>{value}</p>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-[11px] font-bold text-emerald-800/40 uppercase tracking-tight mt-1">{desc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
