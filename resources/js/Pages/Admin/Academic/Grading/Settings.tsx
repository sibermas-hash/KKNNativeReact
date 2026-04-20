import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  LayoutGrid, 
  Binary,
  Activity,
  Zap,
  ShieldCheck,
  ListChecks,
  ChevronDown,
  Scale
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';
import PageHeader from '@/Components/Premium/PageHeader';

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

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;

  return (
    <AppLayout title="Bobot Penilaian">
      <Head title="Bobot Penilaian KKN" />

      <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
        
        <PageHeader
          title="Matriks Penilaian."
          subtitle="Distribusi bobot komponen nilai KKN UIN SAIZU untuk kalkulasi yudisium otomatis."
          icon={Scale}
          groupLabel="Akademik & Penilaian"
          stats={{
            label: 'Engine Status',
            value: allGroupsValid ? 'STABIL' : 'ERROR',
            icon: Activity
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={filters.kkn_type} 
                onChange={(e) => handleTypeChange(e.target.value)} 
                className="h-10 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-xs font-black text-emerald-950 uppercase tracking-widest outline-none focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] appearance-none cursor-pointer shadow-sm transition-all"
              >
                {programOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={processing || !allGroupsValid} 
              className={clsx(
                "h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2",
                allGroupsValid 
                  ? "bg-[#16a34a] text-white hover:bg-[#15803d] shadow-emerald-200" 
                  : "bg-rose-500 text-white shadow-rose-200"
              )}
            >
              {processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {recentlySuccessful ? 'TERSAVE' : 'SIMPAN PERUBAHAN'}
            </button>
          </div>
        </PageHeader>

        {/* Statistik Minimalis */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat 
            icon={ShieldCheck} 
            label="INTEGRITAS" 
            value={allGroupsValid ? "VALID" : "INVALID"} 
            variant={allGroupsValid ? 'success' : 'danger'} 
          />
          <MiniStat icon={Binary} label="MATRIKS" value="CALCULATED" />
          <MiniStat icon={ListChecks} label="PERIODE AKADEMIK" value={academicYear} />
          <MiniStat icon={Zap} label="OTORITAS" value="SUPERADMIN" />
        </div>

        {/* --- CONFIGURATION PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(sections || []).map((section) => {
            const groupTotal = getGroupTotal(section.group);
            const isValid = isGroupValid(section.group);
            return (
              <div key={section.group} className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-emerald-200 transition-colors">
                {/* Panel Header */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-emerald-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-widest mb-0.5">{section.title}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Grup: {section.group}</span>
                  </div>
                  <div className={clsx(
                    "flex flex-col items-end px-3 py-1 rounded-lg border transition-all",
                    isValid ? "bg-white border-emerald-100 text-emerald-950 shadow-inner" : "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                  )}>
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 leading-none mb-0.5">Kumulatif</span>
                    <span className="text-sm font-black tabular-nums leading-none">{groupTotal}%</span>
                  </div>
                </div>

                {/* Table Look */}
                <div className="flex-1">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100">
                      {(section.items || []).map((item) => (
                        <tr key={item.id} className="group hover:bg-emerald-50/20 transition-all duration-300">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-emerald-950 uppercase tracking-tight leading-none">{item.label}</span>
                              <span className="text-[10px] font-medium text-emerald-800/60 leading-tight">
                                {item.description}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 w-28 border-l border-gray-50 bg-gray-50/30">
                            <div className="relative">
                              <input 
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={data.configs?.find(c => c.id === item.id)?.percentage ?? 0} 
                                onChange={e => updatePercentage(item.id, e.target.value)} 
                                className={clsx(
                                  "w-full h-9 bg-white border rounded-lg text-center text-sm font-black text-emerald-950 outline-none transition-all tabular-nums shadow-sm",
                                  isValid ? "border-emerald-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" : "border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                )}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section Footer */}
                <div className="px-6 py-2.5 bg-gray-50/30 border-t border-gray-100">
                   <p className="text-[9px] font-bold text-emerald-800/30 uppercase tracking-widest flex items-center gap-1.5">
                     <Activity size={10} /> Parameter Penilaian Aktif
                   </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Footer Notes */}
        <div className="mt-8 p-6 bg-emerald-900 rounded-2xl flex items-start gap-6 relative overflow-hidden shadow-xl shadow-emerald-950/20">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <ShieldCheck size={140} />
          </div>
          <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-emerald-100 shrink-0 border border-white/10">
            <Zap size={24} />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Otoritas Validasi Akademik</h4>
            <p className="text-xs font-bold text-emerald-100/60 uppercase leading-relaxed max-w-4xl">
              Matriks konfigurasi ini merupakan basis logika inti kalkulasi nilai otomatis pada sistem KKN UIN SAIZU. 
              Segala penyesuaian akan berdampak langsung pada seluruh data pendaftaran aktif. 
              <span className="text-white ml-1">PASTIKAN TOTAL SETIAP GRUP ADALAH 100% UNTUK MENJAGA INTEGRITAS DATA PENILAIAN.</span>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value, variant = 'default' }: { icon: any, label: string, value: string | number, variant?: 'default' | 'success' | 'danger' }) {
  return (
    <div className="p-4 bg-white border border-emerald-50 rounded-xl flex items-center gap-4 shadow-sm group hover:border-emerald-300 transition-all">
      <div className={clsx(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
        variant === 'success' ? 'bg-[#e8f5ee] text-[#1a7a4a]' : 
        variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-emerald-800'
      )}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <span className={clsx(
          "text-sm font-black tabular-nums leading-none tracking-wider uppercase",
          variant === 'danger' ? 'text-rose-600' : 'text-emerald-950'
        )}>{value}</span>
      </div>
    </div>
  );
}
