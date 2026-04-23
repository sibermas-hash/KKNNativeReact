import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
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
  Globe
} from 'lucide-react';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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
  '17': 'Kemitraan untuk Mencapai Tujuan'
};

export default function AdminWorkProgramsIndex({ workPrograms, sdg_distribution, filters, totalStats }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleFilterChange = (key: string, value: string) => {
    router.get('/admin/laporan/program-kerja', { ...filters, [key]: value }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout title="Program Kerja Mahasiswa">
      <Head title="Manajemen Program Kerja | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Program Kerja."
          subtitle="Pusat pemantauan, validasi, dan analisis distribusi target SDGs kegiatan pengabdian mahasiswa."
          icon={LayoutGrid}
          groupLabel="Monitoring & Evaluasi"
        />

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Program" value={workPrograms.meta.total} icon={FileText} variant="success" />
          <StatCard label="Disetujui" value={totalStats.approved} icon={Award} variant="info" />
          <StatCard label="Menunggu Audit" value={totalStats.pending} icon={Activity} variant="gray" />
          <StatCard label="SDG Mapping" value="ACTIVE" icon={Globe} variant="gray" />
        </div>

        {/* SDG DISTRIBUTION PANEL */}
        <ContentPanel
          title="Distribusi Peta SDGs Global"
          description="Visualisasi sebaran fokus program kerja berdasarkan 17 tujuan pembangunan berkelanjutan."
          icon={Target}
        >
          <div className="py-4">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 17 }, (_, i) => String(i + 1)).map((sdg) => {
                const count = sdg_distribution ? Number(sdg_distribution[sdg as keyof typeof sdg_distribution] || 0) : 0;
                return (
                  <motion.div 
                    key={sdg} 
                    whileHover={{ y: -5 }}
                    className="relative flex flex-col items-center group shrink-0"
                  >
                    <div className="w-20 h-24 bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl p-4 flex flex-col justify-between transition-all group-hover:bg-emerald-600 group-hover:border-emerald-600 shadow-sm">
                      <div className="h-1.5 bg-emerald-500 w-full rounded-full group-hover:bg-white/30" />
                      <div className="text-center">
                        <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-tighter block group-hover:text-white/40">SDG {sdg}</span>
                        <span className="text-xl font-black text-emerald-950 group-hover:text-white tabular-nums leading-none">{count}</span>
                      </div>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                      <div className="bg-emerald-950 text-white text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl flex flex-col items-center border border-white/10 uppercase tracking-widest">
                        <span className="text-emerald-400 mb-1">SDG {sdg}</span>
                        <span className="text-white/80">{sdgNames[sdg]}</span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-emerald-950" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ContentPanel>

        {/* MAIN DATA TABLE */}
        <ContentPanel
          title="Work Program Transaction Ledger"
          description="Daftar lengkap rencana dan implementasi program kerja mahasiswa di lokasi pengabdian."
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
                />
              </div>
              <div className="relative min-w-[200px]">
                <select 
                  value={filters.status} 
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-gray-50 border-2 border-slate-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">SEMUA KONDISI</option>
                  <option value="approved">DISETUJUI (VERIFIED)</option>
                  <option value="pending">DIAJUKAN (PENDING)</option>
                  <option value="revision">REVISI (NEED FIX)</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-950/20 rotate-90 pointer-events-none" />
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
                  Real-time Monitoring &middot; {workPrograms.meta.total} Program Terdeteksi
                </span>
              </div>
              <Pagination meta={workPrograms.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Judul Program & ID', 'Unit / Lokasi', 'Kondisi Audit', 'Opsi']}
            isEmpty={workPrograms.data.length === 0}
            emptyText="Tidak ada program kerja yang ditemukan."
          >
            {workPrograms.data.map((proker) => (
              <PremiumTableRow key={proker.id} className="group">
                <PremiumTableCell>
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">{proker.title}</span>
                    <span className="text-[9px] font-black text-emerald-950/40 font-mono tracking-tighter uppercase">PROKERID: #{proker.proker_id}</span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-none">{proker.group_name}</span>
                    <div className="flex items-center gap-1.5 text-emerald-600/50">
                      <MapPin size={10} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[150px]">{proker.location}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <StatusTag 
                    status={
                      proker.status === 'approved' ? 'active' : 
                      proker.status === 'revision' ? 'error' : 'pending'
                    } 
                    label={
                      proker.status === 'approved' ? 'VERIFIED' : 
                      proker.status === 'pending' ? 'PENDING' : 'REVISION'
                    } 
                    size="sm" 
                  />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <button 
                    className="h-9 w-9 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center"
                  >
                    <Eye size={14} />
                  </button>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

      </div>
    </AppLayout>
  );
}
