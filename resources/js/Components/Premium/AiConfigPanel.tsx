import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import { clsx } from 'clsx';
import { Eye, EyeOff, Save, RefreshCw, CheckCircle2, XCircle, Info, Plug } from 'lucide-react';
import { useToast } from '@/Hooks/useToast';

interface AiConfigPanelProps {
  settings: any[];
}

export default function AiConfigPanel({ settings }: AiConfigPanelProps) {
  const toast = useToast();
  const apiKeySetting = settings.find((s) => s.config_key === 'gemini_api_key');
  const enabledSetting = settings.find((s) => s.config_key === 'ai_enabled');

  const [apiKey, setApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(enabledSetting?.config_value === '1' || enabledSetting?.config_value === 'true');
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
    if (!apiKey && !apiKeySetting?.config_value) return;
    
    setValidationStatus('loading');
    setValidationMessage(null);

    try {
      const response = await axios.post(route('admin.pengaturan.sistem.ai.test'), {
        gemini_api_key: apiKey || apiKeySetting?.config_value
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
    <div className="space-y-8">
      {/* Toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Aktifkan Bantuan AI</h4>
          <p className="text-xs text-gray-600 mt-1">Nyalakan ini agar sistem dapat memberikan rekomendasi dan saran perbaikan otomatis.</p>
        </div>
        <button
          type="button"
          onClick={() => setAiEnabled(!aiEnabled)}
          className={clsx(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2",
            aiEnabled ? "bg-[#16a34a]" : "bg-gray-200"
          )}
        >
          <span
            className={clsx(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              aiEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {!aiEnabled && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Fitur AI sedang dimatikan. Mahasiswa dan DPL tidak akan menerima panduan otomatis dari sistem.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">Kunci Akses (API Key) Gemini</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeySetting?.config_value ? '•••••••••••••••••••••••••••• (Tersimpan)' : 'Masukkan Kunci Akses (API Key) Gemini Anda...'}
              className={clsx(
                "block w-full rounded-lg sm:text-sm transition-all",
                validationStatus === 'error' ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500" :
                validationStatus === 'success' ? "border-emerald-500 text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500" :
                "border-gray-300 focus:border-[#1a7a4a] focus:ring-[#1a7a4a]",
                "pr-10 font-mono shadow-sm"
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={testConnection}
            disabled={validationStatus === 'loading' || (!apiKey && !apiKeySetting?.config_value)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 disabled:opacity-50"
          >
            {validationStatus === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin text-gray-500" /> : <Plug className="h-4 w-4 text-emerald-600" />}
            Cek Sambungan
          </button>
        </div>

        {/* Validation Badge */}
        {validationStatus === 'success' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {validationMessage}
          </div>
        )}
        {validationStatus === 'error' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            {validationMessage}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Kunci rahasia Anda akan disandikan dengan aman sebelum disimpan. Tidak ada yang bisa melihatnya secara langsung.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-between">
        {apiKeySetting?.config_value ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Anda yakin ingin menghapus Kunci Akses (API Key) ini secara permanen? Fitur AI tidak akan bekerja sampai Anda memasukkan kunci baru.')) {
                setIsSaving(true);
                router.delete(route('admin.pengaturan.sistem.ai.remove'), {
                  onFinish: () => setIsSaving(false),
                  onSuccess: () => toast.success('API Key berhasil dihapus.')
                });
              }
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-bold text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Hapus Kunci ✕
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 justify-center rounded-lg border border-transparent bg-[#16a34a] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
        </button>
      </div>
    </div>
  );
}
