import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  LayoutGrid, 
  AlertTriangle,
  Sliders,
  Binary,
  Activity,
  Zap,
  Target,
  ShieldCheck,
  ChevronRight,
  Settings2,
  ListChecks,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';
import { Button } from '@/Components/ui';

interface GradingItem { id: number; config_key: string; label: string; percentage: number; description: string; }
interface Section { group: string; title: string; description: string; enforce_total: boolean; total: number; items: GradingItem[]; }
interface Props { sections: Section[]; programOptions: Array<{ value: string; label: string }>; filters: { kkn_type: string; }; }

export default function GradingSettings({ sections = [], programOptions = [], filters }: Props) {
  const { data, setData, patch, processing, recentlySuccessful } = useForm({
    configs: (sections || []).flatMap(s => s.items || []).map(item => ({ id: item.id, percentage: item.percentage }))
  });

  const handleTypeChange = (type: string) => {
    router.get(route('admin.konfigurasi-penilaian.index'), { kkn_type: type }, { preserveState: true, preserveScroll: true });
  };

  const updatePercentage = (id: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData('configs', data.configs.map(c => c.id === id ? { ...c, percentage: numValue } : c));
  };

  const getGroupTotal = (group: string) => {
    const groupItems = sections.find(s => s.group === group)?.items || [];
    const itemIds = groupItems.map(i => i.id);
    return data.configs.filter(c => itemIds.includes(c.id)).reduce((sum, c) => sum + c.percentage, 0);
  };

  const isGroupValid = (group: string) => {
    const section = sections.find(s => s.group === group);
    if (!section || !section.enforce_total) return true;
    return Math.abs(getGroupTotal(group) - 100) < 0.01;
  };

  const allGroupsValid = sections.every(s => isGroupValid(s.group));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allGroupsValid) { return; }
    patch(route('admin.konfigurasi-penilaian.update'));
  };

  return (
    <AppLayout title="Bobot Penilaian">
      <Head title="Bobot Penilaian KKN" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-all">
        
        {/* Header Sederhana Sesuai Patokan Gold Standard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-gray-200/50 pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900 uppercase">Matriks Penilaian.</h1>
            <p className="text-xs text-gray-900/40 font-black uppercase tracking-widest">
              Distribusi bobot komponen nilai KKN UIN SAIZU
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select 
                value={filters.kkn_type} 
                onChange={(e) => handleTypeChange(e.target.value)} 
                className="h-9 pl-3 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-900 uppercase tracking-widest outline-none focus:border-[#f3f4f6]0 appearance-none cursor-pointer"
              >
                {programOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-900/20 pointer-events-none" />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={processing || !allGroupsValid} 
              className={clsx(
                "h-9 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                allGroupsValid ? "bg-[#16a34a] text-white hover:bg-[#15803d]" : "bg-rose-500 text-white"
              )}
            >
              {processing ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
              {recentlySuccessful ? 'TERSAVE' : 'SIMPAN'}
            </Button>
          </div>
        </div>

        {/* Statistik Minimalis (Gold Standard) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MiniStat 
            icon={ShieldCheck} 
            label="STATUS MATRIKS" 
            value={allGroupsValid ? "SEIMBANG" : "ERROR"} 
            variant={allGroupsValid ? 'success' : 'danger'} 
          />
          <MiniStat icon={Activity} label="ENGINE" value="STABIL" />
          <MiniStat icon={ListChecks} label="TAHUN" value="2026/2027" />
          <MiniStat icon={Zap} label="AKSES" value="SUPERADMIN" />
        </div>

        {/* --- CONFIGURATION PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(sections || []).map((section) => {
            const groupTotal = getGroupTotal(section.group);
            const isValid = isGroupValid(section.group);
            return (
              <div key={section.group} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                {/* Panel Header */}
                <div className="px-8 py-4 bg-emerald-50/20 border-b border-gray-200/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{section.title}</span>
                    <span className="text-[9px] font-bold text-[#1a7a4a]/60 uppercase">Konfigurasi {section.group}</span>
                  </div>
                  <div className={clsx(
                    "flex flex-col items-end px-3 py-1 rounded-lg border",
                    isValid ? "bg-white border-gray-200 text-gray-900" : "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                  )}>
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 leading-none">Total</span>
                    <span className="text-sm font-black tabular-nums leading-none">{groupTotal}%</span>
                  </div>
                </div>

                {/* Table Look */}
                <div className="flex-1">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-[#f3f4f6]/50">
                      {(section.items || []).filter(item => item.config_key !== 'weight_admin_workshop').map((item) => (
                        <tr key={item.id} className="group hover:bg-gray-50/10 transition-all duration-300">
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold text-gray-900 uppercase leading-none">{item.label}</span>
                              <span className="text-xs font-bold text-gray-900/30 uppercase tracking-tight leading-none truncate max-w-[200px]">
                                {item.description}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 w-32 border-l border-[#f3f4f6]/20 bg-emerald-50/5">
                            <div className="relative">
                              <input 
                                type="number"
                                step="1"
                                value={data.configs?.find(c => c.id === item.id)?.percentage ?? 0} 
                                onChange={e => updatePercentage(item.id, e.target.value)} 
                                className="w-full h-9 bg-white border border-gray-200 rounded-lg text-center text-sm font-black text-gray-900 focus:border-[#f3f4f6]0 outline-none transition-all tabular-nums shadow-sm"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section Footer */}
                <div className="px-8 py-3 bg-emerald-50/10 border-t border-[#f3f4f6]/50">
                   <p className="text-[9px] font-bold text-gray-900/20 uppercase tracking-widest">Parameter Aktif</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Footer Notes Sesuai Standar */}
        <div className="mt-12 p-8 bg-emerald-50/20 border border-gray-200 rounded-xl flex items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={160} className="text-gray-900" />
          </div>
          <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-[#1a7a4a] shrink-0">
            <Zap size={24} />
          </div>
          <div className="space-y-4 relative z-10">
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1.5">Otoritas Validasi Akademik</h4>
              <p className="text-xs font-bold text-gray-900/50 uppercase leading-relaxed max-w-4xl">
                Matriks konfigurasi ini merupakan basis logika inti kalkulasi nilai otomatis pada sistem KKN UIN SAIZU. 
                Segala penyesuaian akan berdampak masif pada seluruh data angkatan aktif. 
                <span className="text-[#1a7a4a] ml-1">PASTIKAN TOTAL KONFIGURASI ADALAH 100% UNTUK MENJAGA INTEGRITAS DATA.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value, variant = 'default' }: { icon: any, label: string, value: string | number, variant?: 'default' | 'success' | 'danger' }) {
  return (
    <div className="p-4 bg-white border border-gray-200/60 rounded-xl flex items-center gap-4 shadow-sm group hover:border-emerald-300 transition-all">
      <div className={clsx(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6",
        variant === 'success' ? 'bg-[#e8f5ee] text-[#1a7a4a]' : 
        variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-[#e8f5ee] text-[#1a7a4a]'
      )}>
        <Icon size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black text-gray-900/30 uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <span className={clsx(
          "text-sm font-black tabular-nums leading-none tracking-wider uppercase",
          variant === 'danger' ? 'text-rose-600' : 'text-gray-900'
        )}>{value}</span>
      </div>
    </div>
  );
}
