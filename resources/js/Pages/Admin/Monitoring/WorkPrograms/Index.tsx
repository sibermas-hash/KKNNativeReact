import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/UI';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Activity,
  MapPin,
  Target,
  ChevronRight,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Award,
  Eye,
  Globe,
} from 'lucide-react';
import type { PaginationMeta } from '@/Components/UI/Pagination';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

interface WorkProgram {
  id: number;
  title: string;
  group_name: string;
  location: string;
  status: 'approved' | 'pending' | 'revision';
  sdg_target: number;
  created_at: string;
  proker_id: string;
}

interface Props {
  workPrograms: { data: WorkProgram[]; meta: PaginationMeta };
  sdg_distribution: Record<number, number>;
  filters: { search: string; status: string };
  totalStats: { total: number; approved: number; pending: number };
}

const sdgNames: Record<string, string> = {
  '1': 'Tanpa Kemiskinan',
  '2': 'Tanpa Kelaparan',
  '3': 'Kehidupan Sehat dan Sejahtera',
  '4': 'Pendidikan Berkualitas',
  '5': 'Kesetaraan Gender',
  '6': 'Air Bersih dan Sanitasi Layak',
  '7': 'Energi Bersih dan Terjangkau',
  '8': 'Pekerjaan Layak dan Pertumbuhan Ekonomi',
  '9': 'Industri, Inovasi dan Infrastruktur',
  '10': 'Berkurangnya Kesenjangan',
  '11': 'Kota dan Pemukiman yang Berkelanjutan',
  '12': 'Konsumsi dan Produksi yang Bertanggung Jawab',
  '13': 'Penanganan Perubahan Iklim',
  '14': 'Ekosistem Laut',
  '15': 'Ekosistem Daratan',
  '16': 'Perdamaian, Keadilan dan Kelembagaan yang Tangguh',
  '17': 'Kemitraan untuk Mencapai Tujuan',
};

const sdgThemes: Record<string, { bg: string, border: string, text: string, hoverBg: string, hoverBorder: string, bar: string }> = {
  '1': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', hoverBg: 'group-hover:bg-red-500', hoverBorder: 'group-hover:border-red-500', bar: 'bg-red-400' },
  '2': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', hoverBg: 'group-hover:bg-orange-500', hoverBorder: 'group-hover:border-orange-500', bar: 'bg-orange-400' },
  '3': { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', hoverBg: 'group-hover:bg-green-500', hoverBorder: 'group-hover:border-green-500', bar: 'bg-green-400' },
  '4': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', hoverBg: 'group-hover:bg-rose-500', hoverBorder: 'group-hover:border-rose-500', bar: 'bg-rose-400' },
  '5': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', hoverBg: 'group-hover:bg-orange-600', hoverBorder: 'group-hover:border-orange-600', bar: 'bg-orange-500' },
  '6': { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', hoverBg: 'group-hover:bg-cyan-500', hoverBorder: 'group-hover:border-cyan-500', bar: 'bg-cyan-400' },
  '7': { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', hoverBg: 'group-hover:bg-yellow-500', hoverBorder: 'group-hover:border-yellow-500', bar: 'bg-yellow-400' },
  '8': { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', hoverBg: 'group-hover:bg-pink-500', hoverBorder: 'group-hover:border-pink-500', bar: 'bg-pink-400' },
  '9': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', hoverBg: 'group-hover:bg-orange-500', hoverBorder: 'group-hover:border-orange-500', bar: 'bg-orange-400' },
  '10': { bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', text: 'text-fuchsia-600', hoverBg: 'group-hover:bg-fuchsia-500', hoverBorder: 'group-hover:border-fuchsia-500', bar: 'bg-fuchsia-400' },
  '11': { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-500', hoverBorder: 'group-hover:border-amber-500', bar: 'bg-amber-400' },
  '12': { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', hoverBg: 'group-hover:bg-yellow-600', hoverBorder: 'group-hover:border-yellow-600', bar: 'bg-yellow-500' },
  '13': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-500', hoverBorder: 'group-hover:border-emerald-500', bar: 'bg-emerald-400' },
  '14': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-500', hoverBorder: 'group-hover:border-blue-500', bar: 'bg-blue-400' },
  '15': { bg: 'bg-lime-50', border: 'border-lime-100', text: 'text-lime-600', hoverBg: 'group-hover:bg-lime-500', hoverBorder: 'group-hover:border-lime-500', bar: 'bg-lime-400' },
  '16': { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', hoverBg: 'group-hover:bg-sky-500', hoverBorder: 'group-hover:border-sky-500', bar: 'bg-sky-400' },
  '17': { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-500', hoverBorder: 'group-hover:border-indigo-500', bar: 'bg-indigo-400' },
};

export default function AdminWorkProgramsIndex({
  workPrograms,
  sdg_distribution,
  filters,
  totalStats,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleFilterChange = (key: string, value: string) => {
    router.get(
      '/admin/laporan/program-kerja',
      { ...filters, [key]: value },
      { preserveState: true, replace: true },
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  return (
    <AppLayout title="Program Kerja Mahasiswa">
      <Head title="Manajemen Program Kerja | SIBERMAS" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Program Kerja."
          subtitle="Pusat pemantauan, validasi, dan analisis distribusi target SDGs kegiatan pengabdian mahasiswa."
          icon={LayoutGrid}
          groupLabel="Monitoring & Evaluasi"
        />

        {/* VIBRANT STATS GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Blue Stat */}
          <div className="bg-white border border-sky-100 rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-sky-900/5 hover:border-sky-200 transition-all shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
            <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white relative z-10">
              <FileText size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black text-sky-800 uppercase tracking-[0.2em] leading-none mb-2">Total Program</span>
              <span className="text-2xl font-black text-sky-950 tabular-nums leading-none">{workPrograms.meta.total}</span>
            </div>
          </div>

          {/* Green Stat */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white relative z-10">
              <Award size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] leading-none mb-2">Disetujui</span>
              <span className="text-2xl font-black text-emerald-950 tabular-nums leading-none">{totalStats?.approved ?? 0}</span>
            </div>
          </div>

          {/* Orange Stat */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-amber-900/5 hover:border-amber-200 transition-all shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white relative z-10">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] leading-none mb-2">Menunggu Audit</span>
              <span className="text-2xl font-black text-amber-950 tabular-nums leading-none">{totalStats?.pending ?? 0}</span>
            </div>
          </div>

          {/* Purple Stat */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-indigo-900/5 hover:border-indigo-200 transition-all shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white relative z-10">
              <Globe size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em] leading-none mb-2">Peta SDGs Global</span>
              <span className="text-2xl font-black text-indigo-950 tabular-nums leading-none tracking-widest text-lg mt-1">AKTIF</span>
            </div>
          </div>

        </motion.div>

        {/* SDG DISTRIBUTION PANEL */}
        <motion.div variants={itemVariants}>
          <ContentPanel
            title="Distribusi Peta SDGs Global"
            description="Visualisasi sebaran fokus program kerja berdasarkan 17 tujuan pembangunan berkelanjutan."
            icon={Target}
          >
            <div className="py-4">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {Array.from({ length: 17 }, (_, i) => String(i + 1)).map((sdg) => {
                  const count = sdg_distribution
                    ? Number(sdg_distribution[sdg as keyof typeof sdg_distribution] || 0)
                    : 0;
                  
                  const theme = sdgThemes[sdg] || sdgThemes['13']; // Fallback to emerald if missing

                  return (
                    <motion.div
                      key={sdg}
                      whileHover={{ y: -5 }}
                      className="relative flex flex-col items-center group shrink-0"
                    >
                      <div className={clsx("w-20 h-24 border-2 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm", theme.bg, theme.border, theme.hoverBg, theme.hoverBorder)}>
                        <div className={clsx("h-1.5 w-full rounded-full group-hover:bg-white/40", theme.bar)} />
                        <div className="text-center">
                          <span className={clsx("text-[10px] font-black uppercase tracking-tighter block group-hover:text-white/60", theme.text, "opacity-50")}>
                            SDG {sdg}
                          </span>
                          <span className={clsx("text-xl font-black tabular-nums leading-none group-hover:text-white", theme.text)}>
                            {count}
                          </span>
                        </div>
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                        <div className="bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl flex flex-col items-center border border-white/10 uppercase tracking-widest">
                          <span className={clsx("mb-1", theme.text)}>SDG {sdg}</span>
                          <span className="text-white/90">{sdgNames[sdg]}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ContentPanel>
        </motion.div>

        {/* MAIN DATA TABLE */}
        <motion.div variants={itemVariants}>
<ContentPanel
          title="Daftar Program Kerja"
          description="Daftar lengkap rencana dan pelaksanaan program kerja mahasiswa di lokasi pengabdian."
          icon={FileText}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', search)}
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 border-2 border-slate-50 rounded-xl text-[12px] font-bold text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-950/20"
                  placeholder="CARI PROGRAM CERDAS..."
                  aria-label="Cari Program Kerja"
                  title="Cari Program Kerja"
                />
              </div>
              <div className="relative min-w-[200px]">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-gray-50 border-2 border-slate-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
                  aria-label="Filter Status Program"
                  title="Filter Status Program"
                >
                  <option value="all">SEMUA KONDISI</option>
                  <option value="approved">DISETUJUI (VERIFIED)</option>
                  <option value="pending">DIAJUKAN (PENDING)</option>
                  <option value="revision">REVISI (NEED FIX)</option>
                </select>
                <ChevronRight
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-950/20 rotate-90 pointer-events-none"
                />
              </div>
              <button
                onClick={() => handleFilterChange('search', search)}
                className="h-11 px-6 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-950/10"
              >
                <Filter size={16} /> Filter
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  Sistem Aktif &middot; {workPrograms.meta.total} Program Ditemukan
                </span>
              </div>
              <Pagination meta={workPrograms.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Judul Program', 'Unit / Lokasi', 'Status Laporan', 'Aksi']}
            isEmpty={workPrograms.data.length === 0}
            emptyText="Tidak ada program kerja yang ditemukan."
          >
            {workPrograms.data.map((proker) => (
              <PremiumTableRow key={proker.id} className="group">
                <PremiumTableCell>
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {proker.title}
                    </span>
                    <span className="text-[9px] font-black text-emerald-950/40 font-mono tracking-tighter uppercase">
                      ID: #{proker.proker_id}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">
                      {proker.group_name}
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-600/50">
                      <MapPin size={10} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[150px]">
                        {proker.location}
                      </span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <StatusTag
                    status={
                      proker.status === 'approved'
                        ? 'active'
                        : proker.status === 'revision'
                          ? 'error'
                          : 'pending'
                    }
                    label={
                      proker.status === 'approved'
                        ? 'DISETUJUI'
                        : proker.status === 'pending'
                          ? 'MENUNGGU'
                          : 'REVISI'
                    }
                    size="sm"
                  />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <Link href={`/admin/laporan/program-kerja/${proker.id}`} className="h-9 px-4 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                    <Eye size={14} /> Detail
                  </Link>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>
</motion.div>
      </motion.div>
    </AppLayout>
  );
}
