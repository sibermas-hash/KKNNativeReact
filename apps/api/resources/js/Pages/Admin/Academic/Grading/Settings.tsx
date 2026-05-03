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
  Scale,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/UI';
import { PageHeader, StatCard, ContentPanel } from '@/Components/Premium';

interface GradingItem {
  id: number;
  config_key: string;
  label: string;
  percentage: number;
  description: string;
}
interface Section {
  group: string;
  title: string;
  description: string;
  enforce_total: boolean;
  total: number;
  items: GradingItem[];
}
interface Props {
  sections: Section[];
  programOptions: Array<{ value: string; label: string }>;
  filters: { kkn_type: string };
}

export default function GradingSettings({ sections = [], programOptions = [], filters }: Props) {
  const { data, setData, patch, processing, recentlySuccessful } = useForm({
    configs: (sections || [])
      .flatMap((s) => s.items || [])
      .map((item) => ({ id: item.id, percentage: item.percentage })),
  });

  const handleTypeChange = (type: string) => {
    router.get(
      route('admin.konfigurasi-penilaian.index'),
      { kkn_type: type },
      { preserveState: true, preserveScroll: true },
    );
  };

  const updatePercentage = (id: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(
      'configs',
      data.configs.map((c) => (c.id === id ? { ...c, percentage: numValue } : c)),
    );
  };

  const getGroupTotal = (group: string) => {
    const groupItems = sections.find((s) => s.group === group)?.items || [];
    const itemIds = groupItems.map((i) => i.id);
    return data.configs
      .filter((c) => itemIds.includes(c.id))
      .reduce((sum, c) => sum + c.percentage, 0);
  };

  const isGroupValid = (group: string) => {
    const section = sections.find((s) => s.group === group);
    if (!section || !section.enforce_total) return true;
    return Math.abs(getGroupTotal(group) - 100) < 0.01;
  };

  const allGroupsValid = sections.every((s) => isGroupValid(s.group));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allGroupsValid) {
      return;
    }
    patch(route('admin.konfigurasi-penilaian.update'));
  };

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;

  return (
    <AppLayout title="Bobot Penilaian">
      <Head title="Bobot Penilaian KKN" />

      <div className="space-y-6 font-sans pb-12">
        <PageHeader
          title="Matriks Penilaian."
          subtitle={
            <>
              Distribusi bobot komponen nilai <span className="text-sky-600">SIBER</span>
              <span className="text-emerald-600">MAS</span> untuk kalkulasi yudisium otomatis.
            </>
          }
          icon={Scale}
          groupLabel="Akademik & Penilaian"
          stats={{
            label: 'Engine Status',
            value: allGroupsValid ? 'STABIL' : 'ERROR',
            icon: Activity,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filters.kkn_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-10 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-xs font-black text-emerald-950 uppercase tracking-widest outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] appearance-none cursor-pointer shadow-sm transition-all"
              >
                {programOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={processing || !allGroupsValid}
              className={clsx(
                'h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2',
                allGroupsValid
                  ? 'bg-[#0d9488] text-white hover:bg-[#0f766e] shadow-emerald-200'
                  : 'bg-rose-500 text-white shadow-rose-200',
              )}
            >
              {processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {recentlySuccessful ? 'TERSAVE' : 'SIMPAN PERUBAHAN'}
            </button>
          </div>
        </PageHeader>

        {/* Statistik Minimalis */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ShieldCheck}
            label="Integritas Matriks"
            value={allGroupsValid ? 'VALID' : 'INVALID'}
            variant={allGroupsValid ? 'success' : 'danger'}
          />
          <StatCard icon={Binary} label="Mode Kalkulasi" value="OTOMATIS" variant="info" />
          <StatCard icon={ListChecks} label="Tahun Akademik" value={academicYear} variant="gray" />
          <StatCard icon={Zap} label="Otoritas Akses" value="SUPERADMIN" variant="success" />
        </div>

        {/* --- CONFIGURATION PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(sections || []).map((section) => {
            const groupTotal = getGroupTotal(section.group);
            const isValid = isGroupValid(section.group);
            return (
              <ContentPanel
                key={section.group}
                title={section.title}
                description={`Grup: ${section.group}`}
                icon={LayoutGrid}
                padding={false}
                headerAction={
                  <div
                    className={clsx(
                      'flex flex-col items-end px-5 py-2 rounded-2xl border-2 transition-all shadow-sm',
                      isValid
                        ? 'bg-white border-emerald-50 text-emerald-950'
                        : 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse',
                    )}
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1.5 font-display">
                      Kumulatif
                    </span>
                    <span className="text-xl font-black tabular-nums leading-none font-display">
                      {groupTotal}%
                    </span>
                  </div>
                }
                footer={
                  <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-[0.2em] flex items-center gap-2.5 font-display">
                    <Activity size={12} strokeWidth={3} /> Parameter Penilaian Aktif
                  </p>
                }
              >
                <table className="w-full text-left">
                  <tbody className="divide-y divide-emerald-50/50">
                    {(section.items || []).map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50 transition-all duration-300"
                      >
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider leading-none font-display">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase max-w-sm">
                              {item.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 w-32 bg-slate-50/30 border-l border-emerald-50/50">
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={data.configs?.find((c) => c.id === item.id)?.percentage ?? 0}
                              onChange={(e) => updatePercentage(item.id, e.target.value)}
                              className={clsx(
                                'w-full h-11 bg-white border-2 rounded-xl text-center text-sm font-black text-emerald-950 outline-none transition-all tabular-nums shadow-sm font-display',
                                isValid
                                  ? 'border-emerald-50 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5'
                                  : 'border-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5',
                              )}
                            />
                            <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-800/20">
                              %
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ContentPanel>
            );
          })}
        </div>

        {/* Global Footer Notes */}
        <div className="mt-8 p-10 bg-emerald-950 rounded-[2.5rem] flex items-start gap-10 relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <ShieldCheck size={280} />
          </div>
          <div className="h-16 w-16 bg-emerald-900 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-800 shadow-inner">
            <Zap size={32} strokeWidth={3} />
          </div>
          <div className="space-y-4 relative z-10">
            <h4 className="text-xl font-black text-white uppercase tracking-tight font-display">
              Otoritas Validasi Akademik.
            </h4>
            <p className="text-sm font-bold text-emerald-300 leading-relaxed max-w-4xl font-display opacity-80 uppercase tracking-wide">
              Matriks konfigurasi ini merupakan basis logika inti kalkulasi nilai otomatis pada
              sistem <span className="text-sky-600">SIBER</span>
              <span className="text-emerald-600">MAS</span>. Segala penyesuaian akan berdampak
              langsung pada seluruh data pendaftaran aktif di periode ini.
              <span className="text-white block mt-4 border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-900/50 rounded-r-lg">
                PASTIKAN TOTAL SETIAP GRUP ADALAH 100% UNTUK MENJAGA INTEGRITAS DATA PENILAIAN.
              </span>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
