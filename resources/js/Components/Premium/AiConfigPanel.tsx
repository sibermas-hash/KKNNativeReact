import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import { clsx } from 'clsx';
import { Eye, EyeOff, Save, RefreshCw, CheckCircle2, XCircle, Info, Plug, Zap } from 'lucide-react';
import { useToast } from '@/Hooks/useToast';
import { motion } from 'framer-motion';

interface AiConfigPanelProps {
  settings: any[];
}

export default function AiConfigPanel({ settings }: AiConfigPanelProps) {
  const toast = useToast();
  const apiKeySetting = settings.find((s) => s.config_key === 'gemini_api_key');
  const enabledSetting = settings.find((s) => s.config_key === 'ai_enabled');

  const [apiKey, setApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(enabledSetting?.value === '1' || enabledSetting?.value === 'true');
  const [showKey, setShowKey] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setValidationMessage(null);
    }
  }, [apiKey]);

  const testConnection = async () => {
    if (!apiKey && !apiKeySetting?.value) return;
    
    setValidationStatus('loading');
    setValidationMessage(null);

    try {
      const response = await axios.post(route('admin.pengaturan.sistem.ai.test'), {
        gemini_api_key: apiKey || apiKeySetting?.value
      });

      if (response.data.success) {
        setValidationStatus('success');
        setValidationMessage(`Berhasil terhubung ke model: ${response.data.model}`);
      } else {
        setValidationStatus('error');
        setValidationMessage(response.data.message || 'Koneksi gagal.');
      }
    } catch (error: any) {
      setValidationStatus('error');
      setValidationMessage(error.response?.data?.message || 'Gagal menghubungi server. Periksa koneksi jaringan Anda.');
    }
  };

  const handleSave = () => {
    if (validationStatus === 'error') {
      if (!window.confirm('API Key ini gagal divalidasi. Menyimpan key ini mungkin mematikan fungsi AI. Tetap lanjutkan?')) {
        return;
      }
    }

    setIsSaving(true);
    router.patch(route('admin.pengaturan.sistem.ai.update'), {
      gemini_api_key: apiKey,
      ai_enabled: aiEnabled ? '1' : '0'
    }, {
      onFinish: () => setIsSaving(false),
      onSuccess: () => {
        toast.success('Pengaturan AI berhasil disimpan.');
        setApiKey(''); // Clear input, show placeholder again
      }
    });
  };

  return (
    <div className="space-y-10">
      {/* Toggle */}
      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner">
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Aktifkan Bantuan AI</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Nyalakan ini agar sistem dapat memberikan rekomendasi otomatis.</p>
        </div>
        <button
          type="button"
          onClick={() => setAiEnabled(!aiEnabled)}
          className={clsx(
            "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-emerald-500/20",
            aiEnabled ? "bg-emerald-600" : "bg-slate-200"
          )}
        >
          <span
            className={clsx(
              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out",
              aiEnabled ? "translate-x-6" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {!aiEnabled && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border-2 border-amber-100 p-5 rounded-[2rem] flex gap-4 items-center shadow-sm"
        >
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
            <Info size={20} />
          </div>
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight leading-relaxed">
            Fitur AI sedang dimatikan. Mahasiswa dan DPL tidak akan menerima panduan otomatis dari sistem.
          </p>
        </motion.div>
      )}

      {/* API Key */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Kunci Akses (API Key) Gemini</label>
           <Zap size={14} className={clsx(aiEnabled ? "text-emerald-500" : "text-slate-300")} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeySetting?.value ? '•••••••••••••••••••••••••••• (Tersimpan)' : 'Masukkan Kunci Akses Gemini...'}
              className={clsx(
                "block w-full h-14 px-6 rounded-2xl border-2 transition-all shadow-inner outline-none text-xs font-bold font-mono tracking-widest",
                validationStatus === 'error' ? "border-rose-100 bg-rose-50 text-rose-900 focus:border-rose-600" :
                validationStatus === 'success' ? "border-emerald-100 bg-emerald-50 text-emerald-900 focus:border-emerald-600" :
                "border-slate-50 bg-[#F8FAF9] text-emerald-950 focus:border-emerald-600 focus:bg-white"
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-300 hover:text-emerald-600 transition-colors"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="button"
            onClick={testConnection}
            disabled={validationStatus === 'loading' || (!apiKey && !apiKeySetting?.value)}
            className="h-14 px-8 bg-white border-2 border-slate-50 text-emerald-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {validationStatus === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <Plug size={18} />}
            Cek Sambungan
          </button>
        </div>

        {/* Validation Result */}
        <AnimatePresence>
          {validationStatus !== 'idle' && validationStatus !== 'loading' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={clsx(
                "flex items-center gap-3 p-4 rounded-2xl border-2",
                validationStatus === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
              )}
            >
              {validationStatus === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{validationMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2 pl-1">
          Kunci rahasia Anda akan disandikan dengan aman secara asimetris sebelum disimpan ke basis data.
        </p>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-50">
        {apiKeySetting?.value ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Hapus Kunci Akses secara permanen? Fitur AI tidak akan bekerja sampai Anda memasukkan kunci baru.')) {
                setIsSaving(true);
                router.delete(route('admin.pengaturan.sistem.ai.remove'), {
                  onFinish: () => setIsSaving(false),
                  onSuccess: () => toast.success('API Key berhasil dihapus.')
                });
              }
            }}
            disabled={isSaving}
            className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors"
          >
            Hapus Kunci Permanen ✕
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-16 px-10 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-200 active:scale-[0.98] uppercase tracking-[0.2em] disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi AI'}
        </button>
      </div>
    </div>
  );
}
