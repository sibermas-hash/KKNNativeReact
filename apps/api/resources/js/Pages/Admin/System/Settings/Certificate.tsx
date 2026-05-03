import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Award,
  Image as ImageIcon,
  PenTool,
  Palette,
  ShieldCheck,
  RefreshCw,
  Binary,
  Target,
  FileText,
  UserCheck,
  BookOpen,
  CloudUpload,
  Sparkles,
  CalendarDays,
  ChevronDown,
  Activity,
  Zap,
  Settings2,
} from 'lucide-react';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import {
  buildCertificateFormConfigs,
  normalizeAvailablePeriods,
  normalizeCertificateConfigs,
  normalizeCertificateFormConfigs,
  type CertificateConfigFormItem,
  type CertificateConfigItem,
} from './certificateFormUtils';

interface Props {
  configs: unknown;
  currentPeriodId: number;
}

export default function CertificateSettings({ configs = [], currentPeriodId }: Props) {
  const { availablePeriods = {} } = usePage().props as any;

  const normalizedConfigs = useMemo(() => normalizeCertificateConfigs(configs), [configs]);
  const flatPeriods = useMemo(
    () => normalizeAvailablePeriods(availablePeriods),
    [availablePeriods],
  );
  const initialFormConfigs = useMemo(
    () => buildCertificateFormConfigs(normalizedConfigs),
    [normalizedConfigs],
  );

  const [activeTab, setActiveTab] = useState<'kkn' | 'workshop'>('kkn');
  const [selectedPeriodId, setSelectedPeriodId] = useState(currentPeriodId);

  const form = useForm<{
    period_id: number;
    configs: CertificateConfigFormItem[] | Record<string, CertificateConfigFormItem>;
  }>({
    period_id: currentPeriodId,
    configs: initialFormConfigs,
  });
  const { data, post, processing, setData } = form;
  const formConfigs = useMemo(() => normalizeCertificateFormConfigs(data.configs), [data.configs]);

  const currentPeriodName =
    flatPeriods.find((period) => period.id === selectedPeriodId)?.name || 'Global Settings';

  useEffect(() => {
    setData('period_id', currentPeriodId);
    setData('configs', initialFormConfigs);
    setSelectedPeriodId(currentPeriodId);
  }, [currentPeriodId, initialFormConfigs, setData]);

  const updateValue = (id: number | null, value: string | File) => {
    setData(
      'configs',
      formConfigs.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number.parseInt(e.target.value, 10);
    const safePeriodId = Number.isNaN(newId) ? 0 : newId;
    setSelectedPeriodId(safePeriodId);
    router.get(
      '/admin/pengaturan/sertifikat',
      { period_id: safePeriodId },
      {
        preserveState: true,
        preserveScroll: true,
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/pengaturan/sertifikat', {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  const getValue = (id: number | null) => formConfigs.find((item) => item.id === id)?.value ?? '';

  const kknConfigs = normalizedConfigs.filter((c) => !c.config_key.startsWith('workshop_'));
  const workshopConfigs = normalizedConfigs.filter((c) => c.config_key.startsWith('workshop_'));

  const renderTextConfigs = (groupConfigs: CertificateConfigItem[]) => {
    const textConfigs = groupConfigs.filter((c) => c.type !== 'image');
    return (
      <ContentPanel
        title="Narasi & Otoritas"
        description="Konfigurasi teks isi sertifikat dan nama pejabat penandatangan."
        icon={PenTool}
        padding={true}
      >
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'kkn' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden group shadow-sm"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-emerald-600">
                  <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                      <Binary size={16} />
                    </div>
                    <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">
                      Placeholder Otomatis
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '[Nama]',
                      '[NIM]',
                      '[Fakultas]',
                      '[Prodi]',
                      '[Kelompok]',
                      '[Lokasi]',
                      '[Periode]',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-white border border-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm hover:border-emerald-500 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-y-8">
            {textConfigs.map((config) => (
              <div key={config.id ?? config.config_key} className="group space-y-2.5">
                <div className="flex items-center justify-between pl-1">
                  <label
                    htmlFor={`cert-config-${config.id ?? config.config_key}`}
                    className="text-[10px] font-black text-emerald-900 uppercase tracking-widest group-focus-within:text-emerald-600 transition-colors"
                  >
                    {config.label}
                  </label>
                  <span className="text-[9px] font-bold text-emerald-800/30 tabular-nums uppercase">
                    KEY: {config.config_key}
                  </span>
                </div>
                {config.type === 'longtext' ? (
                  <textarea
                    id={`cert-config-${config.id ?? config.config_key}`}
                    rows={5}
                    value={getValue(config.id)}
                    onChange={(e) => updateValue(config.id, e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-300 shadow-sm resize-none leading-relaxed"
                    placeholder="Ketikkan isi teks sertifikat..."
                  />
                ) : (
                  <input
                    id={`cert-config-${config.id ?? config.config_key}`}
                    type="text"
                    value={getValue(config.id)}
                    onChange={(e) => updateValue(config.id, e.target.value)}
                    className="w-full h-11 px-5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="Masukkan teks..."
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ContentPanel>
    );
  };

  const renderImageConfigs = (groupConfigs: CertificateConfigItem[]) => {
    const imageConfigs = groupConfigs.filter((c) => c.type === 'image');
    return (
      <ContentPanel
        title="Visual & Aset"
        description="Manajemen gambar latar belakang dan logo sertifikat."
        icon={Palette}
        padding={true}
      >
        <div className="space-y-8">
          {imageConfigs.length > 0 ? (
            <div className="space-y-6">
              {imageConfigs.map((config) => (
                <div key={config.id ?? config.config_key} className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">
                    {config.label}
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="relative group">
                      <ImageIcon
                        size={18}
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-800/40 transition-transform group-focus-within:scale-110"
                      />
                      <input
                        type="text"
                        value={
                          typeof getValue(config.id) === 'string'
                            ? getValue(config.id)
                            : (getValue(config.id) as File).name
                        }
                        readOnly
                        placeholder="Belum ada aset terpilih"
                        className="w-full h-11 pl-12 pr-6 bg-gray-50/50 border border-gray-200 rounded-xl text-[11px] font-bold text-emerald-950 outline-none cursor-default shadow-sm overflow-hidden text-ellipsis"
                      />
                    </div>
                    <label className="group h-12 w-full bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-xl flex items-center justify-center gap-3 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 hover:bg-emerald-100/50 hover:text-emerald-900 transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                      <CloudUpload
                        size={18}
                        className="group-hover:-translate-y-0.5 transition-transform duration-300"
                      />
                      UNGGAH ASSET BARU
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) updateValue(config.id, file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">
                  Visual Standar Sistem
                </p>
                <p className="text-[10px] font-bold text-emerald-800/60 max-w-[200px] leading-relaxed italic">
                  Template ini menggunakan identitas grafis resmi yang dikunci sistem.
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <div className="w-full aspect-[16/9] bg-white rounded-xl border border-gray-200 shadow-inner flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(#e1f5fe_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="absolute inset-4 border border-emerald-100/50 rounded-lg pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all duration-700">
                  <Target size={24} strokeWidth={1.5} />
                </div>
                <div className="space-y-1 px-6">
                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">
                    Live Simulation
                  </p>
                  <p className="text-[9px] font-bold text-emerald-800/40 leading-relaxed uppercase max-w-[200px]">
                    Asset & narasi akan dikomposisikan secara instan ke dokumen fisik PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentPanel>
    );
  };

  return (
    <AppLayout title="Pengaturan Sertifikat">
      <Head title="Pengaturan Sertifikat | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-24 font-sans">
        <PageHeader
          title="Konfigurasi Sertifikat."
          subtitle="Modifikasi narasi, tanda tangan pejabat, dan aset visual untuk sertifikasi akademik KKN & Workshop."
          icon={Award}
          groupLabel="Sistem & Otorisasi"
        >
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col shadow-sm">
              <span className="text-[8px] font-black text-emerald-800/60 uppercase tracking-[0.3em] leading-none mb-1">
                Target Konfigurasi
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-tight truncate max-w-[150px]">
                  {selectedPeriodId === 0 ? 'GLOBAL SYSTEM' : currentPeriodName}
                </span>
              </div>
            </div>
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Atribut" value={configs?.length} icon={FileText} variant="gray" />
          <StatCard
            label="Otoritas"
            value={activeTab === 'kkn' ? 'KKN' : 'Workshop'}
            icon={activeTab === 'kkn' ? UserCheck : BookOpen}
            variant="info"
          />
          <StatCard
            label="Status Enkripsi"
            value="SSL Aktif"
            icon={ShieldCheck}
            variant="success"
          />
          <StatCard label="Sinkronisasi" value="Otomatis" icon={Activity} variant="success" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* --- TOP: CONTROL PANEL (FULL WIDTH) --- */}
          <ContentPanel
            title="Parameter Utama"
            description="Pilih target periode dan jenis sertifikat yang akan dikonfigurasi."
            icon={Settings2}
            padding={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                  Periode Target
                </label>
                <div className="relative group">
                  <select
                    value={selectedPeriodId}
                    onChange={handlePeriodChange}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase"
                  >
                    <option value={0}>GLOBAL SYSTEM</option>
                    {flatPeriods.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                  Tujuan Sertifikat
                </label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('kkn')}
                    className={clsx(
                      'flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                      activeTab === 'kkn'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-gray-500 hover:text-emerald-700',
                    )}
                  >
                    KKN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('workshop')}
                    className={clsx(
                      'flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                      activeTab === 'workshop'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-gray-500 hover:text-emerald-700',
                    )}
                  >
                    Workshop
                  </button>
                </div>
              </div>
            </div>
          </ContentPanel>

          {/* --- MIDDLE: NARRATIVE & CONTENT (FULL WIDTH) --- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {renderTextConfigs(activeTab === 'kkn' ? kknConfigs : workshopConfigs)}

              {/* --- BOTTOM: ASSETS & PREVIEW (FULL WIDTH) --- */}
              {renderImageConfigs(activeTab === 'kkn' ? kknConfigs : workshopConfigs)}
            </motion.div>
          </AnimatePresence>

          {/* --- FLOATING ACTION BAR (SOFT VERSION) --- */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-8 z-40"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 px-8 py-5 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-emerald-500/5">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <RefreshCw size={20} className={clsx(processing && 'animate-spin')} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-emerald-950 uppercase tracking-tight tabular-nums">
                    {selectedPeriodId === 0
                      ? 'Mode Konfigurasi Global'
                      : `Target: ${currentPeriodName}`}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-widest">
                    Sinkronisasi otomatis ke basis data pusat.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full md:w-auto h-12 px-10 bg-emerald-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
              >
                {processing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} className="group-hover:text-emerald-400 transition-colors" />
                )}
                {processing ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </AppLayout>
  );
}
