import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Layers3,
  Plus,
  Save,
  Trash2,
  Palette,
  Zap,
  Activity,
  ShieldCheck,
  RefreshCw,
  Target,
  Box,
  Globe,
  LayoutGrid,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';
interface SchemeItem {
  title: string;
  description: string;
  color: SchemeColor;
}
interface Props {
  content: { title: string; intro: string; items: SchemeItem[] };
}

const colorOptions: Array<{ value: SchemeColor; label: string; dot: string }> = [
  { value: 'emerald', label: 'Hijau (Emerald)', dot: 'bg-emerald-500' },
  { value: 'blue', label: 'Biru (Blue)', dot: 'bg-blue-500' },
  { value: 'amber', label: 'Kuning (Amber)', dot: 'bg-amber-500' },
  { value: 'slate', label: 'Abu-abu (Slate)', dot: 'bg-slate-400' },
];

export default function SchemeContentPage({
  content = { title: '', intro: '', items: [] },
}: Props) {
  const { data, setData, patch, processing, errors } = useForm({
    title: content?.title || '',
    intro: content?.intro || '',
    schemes: content?.items || [],
  });

  const updateScheme = <K extends keyof SchemeItem>(
    index: number,
    field: K,
    value: SchemeItem[K],
  ) => {
    const nextSchemes = [...data.schemes];
    nextSchemes[index] = { ...nextSchemes[index], [field]: value };
    setData('schemes', nextSchemes);
  };

  const addScheme = () =>
    setData('schemes', [...data.schemes, { title: '', description: '', color: 'emerald' }]);
  const removeScheme = (index: number) =>
    setData(
      'schemes',
      data.schemes.filter((_, i) => i !== index),
    );
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch('/admin/konten-publik/skema');
  };

  return (
    <AppLayout title="Skema KKN">
      <Head title="Manajemen Skema Operasional | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Skema KKN."
          subtitle="Manajemen parameter operasional dan klastering skema Kuliah Kerja Nyata Terpadu."
          icon={Layers3}
          groupLabel="Konten Publik & Operasional"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addScheme}
              disabled={data.schemes.length >= 8}
              className="h-12 px-6 bg-white border-2 border-emerald-100 text-emerald-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 transition-all flex items-center gap-3 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.5} /> Tambah Skema
            </button>
            <button
              type="submit"
              disabled={processing}
              form="schemes-form"
              className="h-12 px-8 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              {processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Komit Skema
            </button>
          </div>
        </PageHeader>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Clusters"
            value={data.schemes.length}
            icon={Box}
            variant="success"
          />
          <StatCard label="Visual State" value="ENFORCED" icon={Palette} variant="info" />
          <StatCard label="Metadata flow" value="NOMINAL" icon={Activity} variant="gray" />
          <StatCard label="Sync Protocol" value="PUBLIC" icon={Globe} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <form id="schemes-form" onSubmit={submit} className="space-y-8">
          <ContentPanel
            title="Interface Global Parameters"
            description="Konfigurasi judul dan introduksi narasi skema yang tampil pada portal publik."
            icon={LayoutGrid}
          >
            <div className="grid gap-8 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                  Judul Tampilan Skema
                </label>
                <input
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full h-14 bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-6 text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all"
                  placeholder="Skema KKN UIN SAIZU"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                  Introduksi Narasi
                </label>
                <textarea
                  rows={3}
                  value={data.intro}
                  onChange={(e) => setData('intro', e.target.value)}
                  className="w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-6 py-6 text-sm font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed"
                  placeholder="Introduksi skema..."
                  required
                />
              </div>
            </div>
          </ContentPanel>

          {/* SCHEME CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {data.schemes.map((s, idx) => (
                <motion.div
                  key={`scheme-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group"
                >
                  <div className="px-8 py-4 bg-gray-50/50 border-b border-emerald-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-600 text-white flex items-center justify-center rounded-xl text-[12px] font-black shadow-lg shadow-emerald-600/10 uppercase tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">
                        Cluster_Node #{idx + 1}
                      </span>
                    </div>
                    {data.schemes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheme(idx)}
                        className="h-10 w-10 flex items-center justify-center bg-white border border-emerald-50 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                        Identifier
                      </label>
                      <input
                        value={s.title}
                        onChange={(e) => updateScheme(idx, 'title', e.target.value)}
                        className="w-full h-12 bg-[#F8FAF9] border-2 border-slate-50 rounded-xl px-4 text-[13px] font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all uppercase tracking-tight"
                        placeholder="NAMA SKEMA"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={s.description}
                        onChange={(e) => updateScheme(idx, 'description', e.target.value)}
                        className="w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-xl px-4 py-3 text-[12px] font-bold text-emerald-950/70 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed"
                        placeholder="Deskripsi skema operasional..."
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between gap-6 pt-2">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                          Proxy Color
                        </label>
                        <div className="relative h-12">
                          <select
                            value={s.color}
                            onChange={(e) =>
                              updateScheme(idx, 'color', e.target.value as SchemeColor)
                            }
                            className="w-full h-full bg-[#F8FAF9] border-2 border-slate-50 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-emerald-600"
                          >
                            {colorOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <div
                            className={clsx(
                              'absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm',
                              colorOptions.find((c) => c.value === s.color)?.dot,
                            )}
                          />
                        </div>
                      </div>
                      <div
                        className={clsx(
                          'h-20 w-20 rounded-[1.5rem] border-2 border-dashed flex items-center justify-center transition-all shrink-0 group-hover:rotate-6',
                          s.color === 'emerald'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : s.color === 'blue'
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : s.color === 'amber'
                                ? 'bg-amber-50 border-amber-200 text-amber-600'
                                : 'bg-slate-50 border-slate-200 text-slate-600',
                        )}
                      >
                        <Box size={32} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
