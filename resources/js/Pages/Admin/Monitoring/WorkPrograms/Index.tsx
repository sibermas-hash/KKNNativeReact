import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Sparkles,
  Target,
  BarChart3,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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

// Mapping SDG Names
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

      <div className="py-8 font-sans transition-all pb-20">
        
        {/* HEADER SECTION (Gold Standard) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-emerald-50/50 pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-emerald-950">Program Kerja Mahasiswa.</h1>
            <p className="text-xs text-emerald-950/40 font-black uppercase tracking-widest">
              Pusat pemantauan kegiatan pengabdian mahasiswa di lapangan
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#e8f5ee] border border-emerald-50/60 rounded-lg flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-emerald-950/20 uppercase tracking-widest mb-0.5">Jumlah Data</span>
                <span className="text-xs font-black text-emerald-950 uppercase leading-none">
                  {workPrograms.meta.total.toLocaleString('id-ID')} Data
                </span>
              </div>
              <Award size={18} className="text-[#1a7a4a] opacity-40 ml-2" />
            </div>
          </div>
        </div>

        {/* --- SDG DISTRIBUTION PANEL (Premium Edition) --- */}
        <div className="bg-white border border-emerald-50 rounded-xl mb-8 p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Target size={120} />
          </div>
          
          <div className="flex items-center gap-2 mb-6 border-b border-[#f3f4f6] pb-4">
             <div className="h-6 w-1 bg-emerald-500 rounded-full" />
             <div className="flex flex-col">
               <span className="text-xs font-black text-emerald-950 uppercase tracking-widest">Distribusi Peta SDGs Global</span>
               <span className="text-[10px] text-emerald-700 mt-0.5">Arahkan kursor (hover) ke nomor SDG untuk melihat detail tujuan</span>
             </div>
          </div>

          <div className="relative overflow-x-auto pb-6">
            <div className="flex gap-3 pb-2 min-w-max">
              {Array.from({ length: 17 }, (_, i) => String(i + 1)).map((sdg) => {
                const count = sdg_distribution ? Number(sdg_distribution[sdg as keyof typeof sdg_distribution] || 0) : 0;
                return (
                  <div key={sdg} className="relative flex flex-col items-center group">
                    <div className="w-16 h-20 bg-gray-50 border border-emerald-50/60 rounded-xl p-3 flex flex-col justify-between transition-all group-hover:bg-[#16a34a] group-hover:border-emerald-600">
                      <div className="h-1 bg-rose-500 w-full rounded-full" />
                      <div className="text-center">
                        <span className="text-[8px] font-black text-emerald-950/30 uppercase tracking-tighter block group-hover:text-emerald-100">SDG {sdg}</span>
                        <span className="text-sm font-bold text-emerald-950 group-hover:text-white">{count}</span>
                      </div>
                    </div>
                    
                    {/* Real Tooltip Element */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 pointer-events-none z-50">
                      <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex flex-col items-center">
                        <span className="text-emerald-400">SDG {sdg}</span>
                        <span>{sdgNames[sdg]}</span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- DATA TABLE CARD (Gold Standard) --- */}
        <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* TOOLBAR Sederhana */}
          <div className="px-6 py-4 border-b border-[#f3f4f6]/50 bg-emerald-50/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#1a7a4a]" />
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest">Daftar Kegiatan Mahasiswa</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a7a4a] animate-pulse" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', search)}
                  placeholder="Cari program cerdas (AI) ..." 
                  className="w-full md:w-64 h-9 pl-9 pr-8 bg-white border border-emerald-50/60 rounded-lg text-xs font-bold text-emerald-950 placeholder:text-black/20 focus:border-[#f3f4f6]0 outline-none transition-all shadow-sm"
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700" />
              </div>
              
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="h-9 px-3 bg-white border border-emerald-50 rounded-lg text-[9px] font-black text-emerald-950 uppercase tracking-widest outline-none focus:border-[#f3f4f6]0 shadow-sm"
              >
                <option value="all">Semua Kondisi</option>
                <option value="approved">Disetujui</option>
                <option value="pending">Menunggu</option>
                <option value="revision">Revisi</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/20 border-b border-emerald-50/50">
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">Judul Program & ID</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">Unit / Kelompok</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">Kondisi</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]/60 font-sans">
                {workPrograms.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center text-emerald-950/10">
                      <div className="flex flex-col items-center gap-2">
                        <Activity size={40} />
                        <span className="text-xs font-black uppercase tracking-widest">Data laporan tidak ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  workPrograms.data.map((proker) => (
                    <tr key={proker.id} className="hover:bg-gray-50/20 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-950 uppercase leading-normal line-clamp-1 mb-1">{proker.title}</span>
                          <span className="text-[9px] text-emerald-950/40 font-black tabular-nums tracking-wider uppercase">PROKER: #{proker.proker_id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-950 leading-none mb-1.5 uppercase">{proker.group_name}</span>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-[#1a7a4a] opacity-40 shrink-0" />
                            <span className="text-xs text-emerald-950/40 font-black uppercase tracking-tight truncate">{proker.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={clsx(
                          "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase border transition-all",
                          proker.status === 'approved' ? "bg-[#e8f5ee] text-[#1a7a4a] border-emerald-200" : 
                          proker.status === 'pending' ? "bg-white text-emerald-950/20 border-[#f3f4f6]" : 
                          "bg-rose-50 text-rose-600 border-rose-200"
                        )}>
                          {proker.status === 'approved' ? 'Disetujui' : proker.status === 'pending' ? 'Diajukan' : 'Revisi'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="h-8 w-8 rounded-lg border border-emerald-50 flex items-center justify-center text-[#1a7a4a] hover:bg-[#16a34a] hover:text-white transition-all ml-auto opacity-0 group-hover:opacity-100 shadow-sm translate-x-2 group-hover:translate-x-0">
                           <ChevronRight size={14} />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 border-t border-[#f3f4f6]/50 bg-emerald-50/10 flex items-center justify-between mt-auto">
            <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest">
              Laporan Real-Time | Informasi Kegiatan Terkini
            </span>
            <Pagination meta={workPrograms.meta} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
