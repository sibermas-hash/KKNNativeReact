import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { useMemo, useState } from 'react';
import {
  Settings, ShieldCheck, Database, Cpu, Eye, EyeOff, Save, Layers, Server, Cloud, Info, RefreshCw, Zap, Fingerprint, History
} from 'lucide-react';
import { clsx } from 'clsx';
import AiConfigPanel from '@/Components/Premium/AiConfigPanel';
import PageHeader from '@/Components/Premium/PageHeader';

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
  daily_report_geo_radius_meters: 'Mahasiswa hanya bisa absen jika dalam jarak ini dari lokasi posko.',
  daily_report_geo_max_accuracy_meters: 'Membatasi penggunaan dummy GPS/GPS palsu yang tidak akurat.',
  registration_lock_ttl_seconds: 'Berapa lama slot "dikunci" saat mahasiswa sedang mengisi formulir.',
  min_sks_registration: 'Syarat minimal total SKS yang sudah ditempuh mahasiswa.',
  cooling_period_hours: 'Waktu jeda yang dibutuhkan sebelum pendaftaran ulang jika sebelumnya dibatalkan.',
  group_male_min_ratio: 'Minimal jumlah mahasiswa pria agar pembagian dalam tim seimbang.',
};

export default function SystemSettings({ settings = {}, ai_status, ai_usage }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'ai'>('settings');
  const form = useForm({
    settings: Object.values(settings || {}).flat().map((setting) => ({
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

  return (
    <AppLayout title="Pengaturan Sistem">
      <Head title="Pengaturan & Monitor AI" />

      <div className="space-y-6 font-sans pb-12">
        <PageHeader
          title="Pengaturan & Monitor AI"
          subtitle="Pusat kendali parameter operasional KKN dan pemantauan intelegensi buatan secara real-time."
          icon={Settings}
          groupLabel="Manajemen Sistem"
          stats={{
            label: 'Total Konfigurasi',
            value: flattened.length,
            icon: Database
          }}
        >
           <div className={clsx(
              "px-4 py-2 bg-white border rounded-lg shadow-sm flex items-center gap-3 transition-colors",
              ai_status?.is_healthy ? "border-green-200" : "border-red-200"
            )}>
              <Cpu size={18} className={ai_status?.is_healthy ? "text-[#16a34a]" : "text-red-600"} />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-emerald-800 leading-none mb-0.5">Status AI</span>
                <span className={clsx("text-sm font-bold leading-none", ai_status?.is_healthy ? "text-[#15803d]" : "text-red-700")}>
                  {ai_status?.is_healthy ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
        </PageHeader>

        {/* TABS */}
        <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-emerald-50">
          <button
            onClick={() => setActiveTab('settings')}
            className={clsx(
              "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'settings' 
                ? "bg-white text-[#1a7a4a] shadow-sm ring-1 ring-gray-900/5" 
                : "text-emerald-800 hover:text-emerald-950 hover:bg-gray-200/50"
            )}
          >
            <Settings size={16} />
            Konfigurasi Sistem
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={clsx(
              "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'ai' 
                ? "bg-white text-[#1a7a4a] shadow-sm ring-1 ring-gray-900/5" 
                : "text-emerald-800 hover:text-emerald-950 hover:bg-gray-200/50"
            )}
          >
            <Cpu size={16} />
            Monitor Intelegensi
          </button>
        </div>

        {/* TAB CONTENT: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {Object.entries(settings || {}).filter(([g]) => g !== 'ai_settings').map(([group, items]) => {
                const GroupIcon = GROUP_ICONS[group] || Layers;
                return (
                  <div key={group} className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-emerald-50 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 w-full md:w-1/3 shrink-0">
                        <div className="h-10 w-10 bg-white border border-emerald-50 text-emerald-800 rounded flex items-center justify-center shadow-sm">
                          <GroupIcon size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-emerald-950">{GROUP_TITLES[group] ?? group.toUpperCase()}</h3>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{items.length} pengaturan</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-800">{GROUP_DESCRIPTIONS[group]}</p>
                      </div>
                    </div>

                    <div className="p-6 grid gap-6 md:grid-cols-2">
                      {items.map((setting) => {
                        const isSecret = setting.type === 'password';
                        const isLongText = setting.type === 'textarea';

                        return (
                          <div key={setting.id} className={clsx('space-y-2', isLongText && 'md:col-span-2')}>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-emerald-900">{LABEL_OVERRIDE[setting.config_key] || setting.label}</label>
                              <code className="text-[10px] font-bold text-emerald-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{setting.config_key}</code>
                            </div>

                            <div className="relative">
                              {isLongText ? (
                                <textarea
                                  value={getValue(setting.id)}
                                  onChange={(event) => updateValue(setting.id, event.target.value)}
                                  rows={4}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1a7a4a] focus:ring-[#1a7a4a] sm:text-sm text-emerald-950 font-medium"
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type={isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'}
                                    value={getValue(setting.id)}
                                    onChange={(event) => updateValue(setting.id, event.target.value)}
                                    className={clsx(
                                      'w-full rounded-lg shadow-sm sm:text-sm transition-all',
                                      getError(setting.id) ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-300 text-emerald-950 focus:ring-[#1a7a4a] focus:border-[#1a7a4a]',
                                      isSecret && 'pr-10 font-mono ',
                                      'font-medium'
                                    )}
                                  />
                                  {isSecret && (
                                    <button type="button" onClick={() => setVisiblePasswords((prev) => ({ ...prev, [setting.id]: !prev[setting.id] }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-500 hover:text-emerald-800 rounded transition-colors">
                                      {visiblePasswords[setting.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {SETTING_HELPERS[setting.config_key] && (
                              <div className="flex gap-1.5 items-start mt-1 pl-1">
                                <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-emerald-700/80">{SETTING_HELPERS[setting.config_key]}</p>
                              </div>
                            )}

                            {getError(setting.id) && <p className="text-xs font-bold text-rose-600 mt-1 pl-1">{getError(setting.id)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-white border border-emerald-100 px-6 py-5 flex items-center justify-between rounded-xl shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-950 uppercase tracking-tight">Perhatian Perubahan</p>
                  <p className="text-xs font-medium text-emerald-700 leading-none">Perubahan pengaturan dapat memengaruhi alur sistem secara langsung.</p>
                </div>
                <button type="submit" disabled={form.processing} className="inline-flex items-center gap-2 justify-center rounded-lg border border-transparent bg-[#16a34a] px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200 hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-95">
                  {form.processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB CONTENT: AI MONITOR */}
        {activeTab === 'ai' && ai_status && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCore icon={Zap} label="Teknologi AI" value={ai_status.provider} desc={ai_status.model_text} />
              <MetricCore icon={Fingerprint} label="Status Koneksi" value={ai_status.is_healthy ? "TERHUBUNG" : "BELUM DIATUR"} desc={ai_status.is_healthy ? "Siap digunakan" : "Masukkan API Key"} />
              <MetricCore icon={History} label="Tindakan Bantuan" value={ai_usage?.successful_heals?.toLocaleString('id-ID') || '0'} desc="Bantuan Otomatis Berhasil" />
            </div>

            <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-emerald-50 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-1/3 shrink-0">
                  <div className="h-10 w-10 bg-white border border-emerald-50 text-emerald-800 rounded flex items-center justify-center shadow-sm">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Kecerdasan Buatan (AI)</h3>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pengaturan Koneksi AI</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Atur sambungan ke sistem AI Google Gemini untuk membantu pengecekan dan memandu mahasiswa secara otomatis.</p>
                </div>
              </div>
              <div className="p-6">
                 <AiConfigPanel settings={settings?.ai_settings || []} />
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-16 w-16 bg-[#1a7a4a] rounded-2xl flex shrink-0 items-center justify-center border border-[#16a34a] shadow-inner">
                  <Cpu size={32} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Asisten AI Siap Membantu</h3>
                  <p className="text-sm font-medium text-gray-400 max-w-2xl leading-relaxed">
                    Jika diaktifkan, sistem akan otomatis membaca pola laporan KKN, mendeteksi masalah, dan memberikan saran perbaikan untuk mempermudah tugas administrasi Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

function MetricCore({ icon: Icon, label, value, desc }: { icon: any, label: string, value: string | number, desc: string }) {
  return (
    <div className="bg-white border border-emerald-50 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:border-emerald-100 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div className="h-12 w-12 bg-[#e8f5ee] text-[#1a7a4a] rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 mb-5">
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      <div className="space-y-1.5 relative z-10">
        <p className="text-3xl font-black text-emerald-950 truncate tracking-tight leading-none">{value}</p>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{label}</span>
          <span className="text-sm font-bold text-emerald-700/70 truncate mt-0.5">{desc}</span>
        </div>
      </div>
    </div>
  );
}
