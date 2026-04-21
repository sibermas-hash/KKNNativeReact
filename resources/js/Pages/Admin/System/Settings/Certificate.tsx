import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Image as ImageIcon, 
  Save, 
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
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import PageHeader from '@/Components/Premium/PageHeader';

interface ConfigItem { id: number; config_key: string; label: string; value: string | null; type: 'text' | 'longtext' | 'image'; }
interface Props { configs: ConfigItem[]; }

export default function CertificateSettings({ configs = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'kkn' | 'workshop'>('kkn');
  
  const form = useForm({ 
    configs: (configs || []).map((c) => ({ id: c.id, value: c.value ?? '' })) 
  });
  
  const updateValue = (id: number, value: string | File) => { 
    form.setData('configs', (form.data.configs || []).map((item) => (item.id === id ? { ...item, value } : item))); 
  };
  
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    form.post('/admin/pengaturan/sertifikat', { preserveScroll: true }); 
  };
  
  const getValue = (id: number) => form.data.configs.find((item) => item.id === id)?.value ?? '';

  const kknConfigs = configs.filter(c => !c.config_key.startsWith('workshop_'));
  const workshopConfigs = configs.filter(c => c.config_key.startsWith('workshop_'));

  const renderConfigGroup = (groupConfigs: ConfigItem[]) => {
    const textConfigs = groupConfigs.filter((c) => c.type !== 'image');
    const imageConfigs = groupConfigs.filter((c) => c.type === 'image');

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* --- LEFT COLUMN: NARRATIVE CONFIG --- */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/5 relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="p-8 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-transparent flex items-center gap-5">
              <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                <PenTool size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tighter">Isi & Teks Sertifikat</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] opacity-80">Official Narrative & Signatories</p>
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'kkn' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-900 border border-emerald-500/20 rounded-2xl p-6 mb-6 relative overflow-hidden group shadow-lg shadow-emerald-900/20"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                          <Binary size={16} />
                        </div>
                        <h4 className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.3em]">Kata Kunci Otomatis</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['[Nama]', '[NIM]', '[Fakultas]', '[Kelompok]', '[Lokasi]']).map((tag) => (
                          <span key={tag} className="px-3 py-1.5 bg-emerald-900/50 border border-emerald-800 text-emerald-300 rounded-lg text-[10px] font-bold shadow-inner hover:bg-emerald-800 transition-colors cursor-default">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-8">
                {textConfigs.map((config) => (
                  <div key={config.id} className="group space-y-3">
                    <div className="flex items-center justify-between pl-1">
                      <label htmlFor={`cert-config-${config.id}`} className="text-[11px] font-black text-emerald-900 uppercase tracking-widest group-focus-within:text-emerald-600 transition-colors">
                        {config.label}
                      </label>
                      <span className="text-[9px] font-bold text-emerald-700/40 tabular-nums">NODE_ID: {config.id}</span>
                    </div>
                    {config.type === 'longtext' ? (
                      <textarea
                        id={`cert-config-${config.id}`}
                        rows={5}
                        value={getValue(config.id)}
                        onChange={(e) => updateValue(config.id, e.target.value)}
                        className="w-full px-6 py-5 bg-gray-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-300 shadow-inner resize-none leading-relaxed"
                        placeholder="Ketikkan isi teks sertifikat di sini..."
                      />
                    ) : (
                      <input 
                        id={`cert-config-${config.id}`}
                        type="text"
                        value={getValue(config.id)} 
                        onChange={(e) => updateValue(config.id, e.target.value)} 
                        className="w-full h-14 px-6 bg-gray-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-300 shadow-inner"
                        placeholder="Masukkan teks..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: VISUAL IDENTITY --- */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/5 flex flex-col min-h-[600px] relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="p-8 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-transparent flex items-center gap-5">
              <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                <Palette size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tighter">Logo & Gambar</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] opacity-80">Aset Visual & Resource</p>
              </div>
            </div>

            <div className="p-10 space-y-10 flex-1 flex flex-col">
              {imageConfigs.length > 0 ? (
                <div className="space-y-8">
                  {imageConfigs.map((config) => (
                    <div key={config.id} className="space-y-4">
                      <label className="text-[11px] font-black text-emerald-900 uppercase tracking-widest pl-1">
                        {config.label}
                      </label>
                      <div className="flex flex-col gap-3">
                        <div className="relative group">
                          <ImageIcon size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-800 transition-transform group-focus-within:scale-110"/>
                          <input
                            type="text"
                            value={typeof getValue(config.id) === 'string' ? getValue(config.id) : (getValue(config.id) as File).name}
                            readOnly
                            placeholder="Belum ada gambar terpilih"
                            className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none cursor-default shadow-inner"
                          />
                        </div>
                        <label className="group h-16 w-full bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl flex items-center justify-center gap-3 text-emerald-700 text-[11px] font-black uppercase tracking-widest hover:border-emerald-500 hover:bg-emerald-100/50 hover:text-emerald-900 transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                          <CloudUpload size={20} className="group-hover:-translate-y-1 transition-transform duration-300" />
                          UNGGAH GAMBAR BARU
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
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 flex-1">
                  <div className="h-24 w-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-100 rotate-3">
                    <ShieldCheck size={48} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-black text-emerald-900 uppercase tracking-tight">Visual Standar</p>
                    <p className="text-xs font-bold text-emerald-800/60 max-w-[240px] leading-relaxed italic">"Template ini menggunakan identitas grafis resmi universitas yang dikunci oleh sistem."</p>
                  </div>
                </div>
              )}

              <div className="pt-10 flex justify-center mt-auto">
                 <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   <Target size={48} className="text-emerald-300 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-700" strokeWidth={1} />
                   <div className="space-y-2 relative z-10">
                      <p className="text-xs font-black text-emerald-900 uppercase tracking-[0.3em]">Preview Mode</p>
                      <p className="text-[10px] font-bold text-emerald-700/60 max-w-[220px] leading-relaxed">Asset grafis akan dikomposisikan secara instan saat dokumen diterbitkan.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout title="Pengaturan Sertifikat">
      <Head title="Pengaturan Sertifikat | KKN UIN SAIZU"/>

      <div className="max-w-[1400px] mx-auto space-y-10 font-sans pb-24 px-4 sm:px-6">
        
        <PageHeader
          title="Pengaturan Sertifikat"
          subtitle="Modifikasi narasi, tanda tangan pejabat, dan aset visual untuk sertifikasi akademik KKN & Workshop."
          icon={Award}
          groupLabel="Sistem & Otorisasi"
          stats={{
            label: 'Total Atribut',
            value: configs?.length,
            icon: FileText
          }}
        />

        {/* --- PREMIUM TABS --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="p-1.5 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-gray-200/50 flex gap-1">
            <button
              onClick={() => setActiveTab('kkn')}
              className={clsx(
                "relative px-8 py-3.5 text-xs font-black rounded-xl transition-all flex items-center gap-3 overflow-hidden",
                activeTab === 'kkn' 
                  ? "bg-white text-emerald-900 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-500/10" 
                  : "text-emerald-800/60 hover:text-emerald-900 hover:bg-white/50"
              )}
            >
              <UserCheck size={16} strokeWidth={activeTab === 'kkn' ? 3 : 2} />
              SERTIFIKAT MAHASISWA
              {activeTab === 'kkn' && <motion.div layoutId="tab-glow" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
            </button>
            <button
              onClick={() => setActiveTab('workshop')}
              className={clsx(
                "relative px-8 py-3.5 text-xs font-black rounded-xl transition-all flex items-center gap-3 overflow-hidden",
                activeTab === 'workshop' 
                  ? "bg-white text-emerald-900 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-500/10" 
                  : "text-emerald-800/60 hover:text-emerald-900 hover:bg-white/50"
              )}
            >
              <BookOpen size={16} strokeWidth={activeTab === 'workshop' ? 3 : 2} />
              SERTIFIKAT DOSEN
              {activeTab === 'workshop' && <motion.div layoutId="tab-glow" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
            </button>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50/50 px-5 py-3 rounded-full border border-emerald-100">
            <ShieldCheck size={14} className="text-emerald-600" />
            Terproteksi Enkripsi SSL
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'kkn' ? (
              <div key="kkn">{renderConfigGroup(kknConfigs)}</div>
            ) : (
              <div key="workshop">{renderConfigGroup(workshopConfigs)}</div>
            )}
          </AnimatePresence>

          {/* --- FLOATING ACTION BAR --- */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-8 z-40"
          >
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 backdrop-blur-2xl border border-emerald-700/50 px-8 py-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <RefreshCw size={24} className={clsx(form.processing && "animate-spin")} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-white uppercase tracking-tighter">Konfirmasi Perubahan</p>
                  <p className="text-[11px] font-medium text-emerald-400/80 max-w-sm leading-snug">
                    Pembaruan template akan berlaku seketika untuk semua dokumen yang dicetak setelah ini.
                  </p>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={form.processing} 
                className="w-full md:w-auto h-16 px-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group"
              >
                {form.processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
                {form.processing ? 'PROSES DATA...' : 'TERAPKAN PERUBAHAN'}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </AppLayout>
  );
}
