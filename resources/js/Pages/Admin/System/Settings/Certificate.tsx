import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
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
  FileText
} from 'lucide-react';


interface ConfigItem { id: number; config_key: string; label: string; value: string | null; type: 'text' | 'longtext' | 'image'; }
interface Props { configs: ConfigItem[]; }

export default function CertificateSettings({ configs = [] }: Props) {
  const form = useForm({ configs: (configs || []).map((c) => ({ id: c.id, value: c.value ?? '' })) });
  
  const updateValue = (id: number, value: string) => { 
    form.setData('configs', (form.data.configs || []).map((item) => (item.id === id ? { ...item, value } : item))); 
  };
  
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    form.patch('/admin/pengaturan/sertifikat', { preserveScroll: true, onSuccess: () => { } }); 
  };
  
  const getValue = (id: number) => form.data.configs.find((item) => item.id === id)?.value ?? '';

  const textConfigs = (configs || []).filter((c) => c.type !== 'image');
  const imageConfigs = (configs || []).filter((c) => c.type === 'image');

  return (
    <AppLayout title="Konfigurasi Sertifikat">
      <Head title="Konfigurasi Sertifikat | KKN UIN SAIZU"/>

      <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        
        {/* --- STANDARD HEADER STYLE --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
          <div className="space-y-4">
            <div className="h-10 w-10 bg-[#e8f5ee] text-[#1a7a4a] rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
              <Award size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Konfigurasi Sertifikat.
              </h1>
              <p className="text-sm font-medium text-gray-700">
                Otorisasi aset visual, narasi resmi, dan pemetaan metadata dasar untuk penerbitan sertifikat.
              </p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm shadow-emerald-900/5">
             <div className="h-12 w-12 rounded-xl bg-[#e8f5ee] flex items-center justify-center text-[#1a7a4a]">
                <FileText size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider">Total Atribut</p>
                <h4 className="text-xl font-bold text-gray-900 tabular-nums">{configs?.length} Node</h4>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN: NARRATIVE CONFIG (1/3 Width) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-[#1a7a4a] border border-gray-200">
                  <PenTool size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Form Narasi</h3>
                  <p className="text-xs font-bold text-gray-700">OFFICIAL NARRATIVE SCRIPT</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                {/* Dynamic Injectors */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Binary size={16} className="text-[#1a7a4a]" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Metadata Tags Tersedia</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['[Nama]', '[NIM]', '[Fakultas]', '[Kelompok]', '[Lokasi]']).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white border border-gray-200 text-[#1a7a4a] rounded text-[9px] font-bold shadow-sm">{tag}</span>
                    ))}
                  </div>
                </div>

                {textConfigs.map((config) => (
                  <div key={config.id} className="space-y-2">
                    <label htmlFor={`cert-config-${config.id}`} className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
                      {config.label}
                    </label>
                    {config.type === 'longtext' ? (
                      <textarea
                        id={`cert-config-${config.id}`}
                        rows={6}
                        value={getValue(config.id)}
                        onChange={(e) => updateValue(config.id, e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all placeholder:text-gray-400 resize-none"
                        placeholder="Masukkan narasi resmi..."
                      />
                    ) : (
                      <input 
                        id={`cert-config-${config.id}`}
                        type="text"
                        value={getValue(config.id)} 
                        onChange={(e) => updateValue(config.id, e.target.value)} 
                        className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all placeholder:text-gray-400"
                        placeholder="Masukkan teks..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-950 rounded-xl p-6 text-white relative overflow-hidden">
               <ShieldCheck className="absolute -right-4 -bottom-4 h-32 w-32 text-gray-900 opacity-30 rotate-12" />
               <div className="relative z-10 space-y-2">
                  <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-widest">Informasi Keamanan</p>
                  <p className="text-xs font-semibold leading-relaxed opacity-80">
                    Pembaruan template akan mempengaruhi seluruh sertifikat yang akan dicetak/diunduh. Pastikan narasi telah resmi disetujui.
                  </p>
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: VISUAL IDENTITY (2/3 Width) --- */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
              
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-[#1a7a4a] border border-gray-200">
                  <Palette size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Identitas Visual</h3>
                  <p className="text-xs font-bold text-gray-700">GRAPHIC ASSETS & RESOURCES</p>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1">
                <div className="grid grid-cols-1 gap-6">
                  {imageConfigs.map((config) => (
                    <div key={config.id} className="space-y-2">
                      <label htmlFor={`cert-img-${config.id}`} className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
                        {config.label}
                      </label>
                      <div className="relative">
                        <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600"/>
                        <input
                          id={`cert-img-${config.id}`}
                          type="text"
                          value={getValue(config.id)}
                          onChange={(e) => updateValue(config.id, e.target.value)}
                          placeholder="https://... atau path/lokal.png"
                          className="w-full h-12 pl-12 pr-5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all font-mono placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="py-6 flex justify-center">
                   <div className="w-full max-w-sm aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center gap-4 relative">
                     <Target size={40} className="text-gray-600" strokeWidth={1.5} />
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-widest">Preview Dinonaktifkan</p>
                        <p className="text-xs font-bold text-gray-700 opacity-80 max-w-[200px]">Asset akan dimuat dan disusun secara runtime saat file PDF di-generate oleh backend.</p>
                     </div>
                   </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#f3f4f6] bg-gray-50/50">
                <button 
                  type="submit"
                  disabled={form.processing} 
                  className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-none transition-all flex items-center justify-center gap-3 text-xs active:scale-95 disabled:opacity-50"
                >
                  {form.processing ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
                  {form.processing ? 'MENYIMPAN KONFIGURASI...' : 'SIMPAN KONFIGURASI SERTIFIKAT'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
