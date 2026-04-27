import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  BookOpenText,
  Save,
  Zap,
  Target,
  Activity,
  ShieldCheck,
  RefreshCw,
  FileText,
  Dna,
  LayoutGrid,
} from 'lucide-react';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';

interface Props {
  content: { about: string; visi: string; misi: string };
}

export default function ProfileContentPage({ content }: Props) {
  const { data, setData, patch, processing, errors } = useForm({
    about: content.about,
    visi: content.visi,
    misi: content.misi,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    patch('/admin/konten-publik/profil');
  };

  return (
    <AppLayout title="Profil Lembaga">
      <Head title="Manajemen Identitas Lembaga | SIBERMAS" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Profil Lembaga."
          subtitle="Manajemen narasi institusional, visi, dan misi strategis LPPM UIN SAIZU."
          icon={BookOpenText}
          groupLabel="Konten Publik & Identitas"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Narrative State" value="VALIDATED" icon={FileText} variant="success" />
          <StatCard label="Vision Vector" value="STRATEGIC" icon={Target} variant="info" />
          <StatCard label="Mission Flow" value="NOMINAL" icon={Activity} variant="gray" />
          <StatCard label="Sync Status" value="LOCKED" icon={ShieldCheck} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <form onSubmit={submit} className="space-y-6">
          <ContentPanel
            title="Official Branding Repository"
            description="Konfigurasi narasi publik yang akan ditampilkan pada halaman profil utama website."
            icon={LayoutGrid}
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest leading-none">
                    Identity Control Matrix Active
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="h-12 px-10 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
                >
                  {processing ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Komit Narasi
                </button>
              </div>
            }
          >
            <div className="space-y-8 py-4">
              {/* ABOUT SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 ml-1">
                  <Dna size={14} className="text-emerald-600" />
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                    Deskripsi Lembaga (Tentang)
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={data.about}
                  onChange={(e) => setData('about', e.target.value)}
                  className="w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-8 py-8 text-[13px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed placeholder:text-emerald-200"
                  placeholder="Tuliskan deskripsi lengkap mengenai LPPM..."
                />
                {errors.about && (
                  <p className="text-[10px] font-black text-rose-500 ml-1 uppercase tracking-tighter italic">
                    Error: {errors.about}
                  </p>
                )}
              </div>

              {/* VISI MISI GRID */}
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 ml-1">
                    <Target size={14} className="text-emerald-600" />
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                      Visi Strategis
                    </label>
                  </div>
                  <textarea
                    rows={6}
                    value={data.visi}
                    onChange={(e) => setData('visi', e.target.value)}
                    className="w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-8 py-8 text-[13px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed"
                    placeholder="Visi lembaga..."
                  />
                  {errors.visi && (
                    <p className="text-[10px] font-black text-rose-500 ml-1 uppercase tracking-tighter italic">
                      Error: {errors.visi}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 ml-1">
                    <Activity size={14} className="text-emerald-600" />
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                      Misi Operasional
                    </label>
                  </div>
                  <textarea
                    rows={6}
                    value={data.misi}
                    onChange={(e) => setData('misi', e.target.value)}
                    className="w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-8 py-8 text-[13px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed"
                    placeholder="Misi lembaga..."
                  />
                  {errors.misi && (
                    <p className="text-[10px] font-black text-rose-500 ml-1 uppercase tracking-tighter italic">
                      Error: {errors.misi}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ContentPanel>
        </form>

        {/* INFO FOOTER */}
        <div className="flex justify-center pt-8">
          <div className="h-10 px-6 bg-emerald-50 rounded-full flex items-center gap-3 border border-emerald-100/50">
            <Zap size={14} className="text-emerald-600 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest">
              Governance Loop Active &bull; Identity Control Matrix
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
