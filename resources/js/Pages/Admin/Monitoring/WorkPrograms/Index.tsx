import { Head, router, Link, Deferred } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
  ClipboardList,
  Filter,
  Globe,
  ShieldCheck,
  MapPin,
  ChevronRight,
  SearchCode,
  Trophy,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface WorkProgramData {
  id: number;
  title: string;
  status: string;
  submitted_at: string | null;
  kelompok?: {
    nama_kelompok?: string | null;
    lokasi?: {
      full_name?: string | null;
      village_name?: string | null;
    } | null;
  } | null;
}

interface Props extends PageProps {
  workPrograms?: { data: WorkProgramData[]; meta: PaginationMeta };
  sdg_distribution?: Array<{ id: number; count: number }>;
  filters: { status?: string; semantic_search?: string };
  semantic_results?: WorkProgramData[] | null;
}

const SDG_COLORS = [
  '#E11D48', '#D97706', '#059669', '#10B981', '#FF3A21', 
  '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367', 
  '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', 
  '#00689D', '#19486A'
];

export default function AdminWorkProgramsIndex({ workPrograms, sdg_distribution, filters, semantic_results }: Props) {
  const [search, setSearch] = useState(filters.semantic_search || '');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== (filters.semantic_search || '')) {
      router.get('/admin/laporan/program-kerja', 
        { ...filters, semantic_search: debouncedSearch || undefined }, 
        { preserveState: true, replace: true }
      );
    }
  }, [debouncedSearch]);

  const handleStatusChange = (value: string) => {
    router.get('/admin/laporan/program-kerja', 
      { ...filters, status: value || undefined }, 
      { preserveState: true, replace: true }
    );
  };

  return (
    <AppLayout title="Audit Monitoring Program Kerja">
      <Head title="Monitoring Proker" />

      <div className="max-w-7xl mx-auto space-y-4 pb-8 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- HEADER COMPACT --- */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
               <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 tracking-tight leading-none uppercase">
                Program <span className="text-emerald-500">Kerja</span>
              </h1>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 italic">Governance & SDG Mapping</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white border border-emerald-100 rounded-lg p-1.5 pr-4 shadow-sm">
             <Deferred data="workPrograms" fallback={<div className="h-8 w-16 bg-emerald-50 animate-pulse rounded-md" />}>
                <div className="h-8 px-3 bg-emerald-50 text-emerald-700 rounded-md flex items-center gap-2 border border-emerald-100/50">
                   <Trophy size={14} className="text-emerald-500" />
                   <span className="text-sm font-black tabular-nums">{workPrograms?.meta.total.toLocaleString('id-ID')}</span>
                </div>
             </Deferred>
             <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Total Inisiatif</span>
          </div>
        </div>

        {/* --- STATS & ANALYTICS BAR --- */}
        <Deferred data="sdg_distribution" fallback={<div className="h-24 w-full bg-emerald-50/50 animate-pulse rounded-xl border border-emerald-100" />}>
          {sdg_distribution && (
            <div className="bg-white border border-emerald-100 rounded-xl shadow-sm p-3 border-l-4 border-l-emerald-500">
               <div className="flex items-center gap-2 mb-3 px-1">
                  <Globe size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.1em]">Distribusi Dampak Global (SDGs)</span>
               </div>
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {sdg_distribution.map((sdg) => (
                     <div key={sdg.id} className="min-w-[80px] bg-white border border-emerald-50 rounded-lg p-2 flex flex-col items-center justify-center group hover:bg-emerald-50 transition-all cursor-help relative shadow-sm">
                        <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: SDG_COLORS[(sdg.id - 1) % SDG_COLORS.length] }} />
                        <span className="text-[9px] font-black text-emerald-600/60 leading-none mb-1">SDG {sdg.id}</span>
                        <span className="text-sm font-black text-emerald-950 tabular-nums leading-none">{sdg.count}</span>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </Deferred>

        {/* --- FILTERS & SEARCH BAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
           <div className="md:col-span-3 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500 group-focus-within:text-emerald-600 transition-colors">
                 <Search size={16} strokeWidth={2.5} />
              </div>
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Judul Program (Fitur AI Semantic Search Aktif)..."
                className="w-full h-10 pl-10 pr-10 bg-white border border-emerald-100 rounded-lg text-xs font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-emerald-300 shadow-sm"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                 <Sparkles size={14} className="text-emerald-400 animate-pulse" />
              </div>
           </div>
           
           <div className="relative">
              <select 
                value={filters.status ?? ''} 
                onChange={(e) => handleStatusChange(e.target.value)} 
                className="w-full h-10 pl-3 pr-10 bg-white border border-emerald-100 rounded-lg text-xs font-bold text-emerald-950 focus:border-emerald-500 outline-none transition-all appearance-none shadow-sm cursor-pointer hover:bg-emerald-50/50"
              >
                <option value="">Semua Status Audit</option>
                <option value="draft">Draft (Proses)</option>
                <option value="submitted">Menunggu Verifikasi</option>
                <option value="approved">Diterima / Aktif</option>
                <option value="revision">Perlu Revisi</option>
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 rotate-90 pointer-events-none" />
           </div>
        </div>

        {/* --- SEMANTIC RESULTS HIGHLIGHT --- */}
        {semantic_results && semantic_results.length > 0 && (
          <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm">
             <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Hasil Pencarian Cerdas (AI)</span>
             </div>
             <div className="space-y-2">
                {semantic_results.map(res => (
                  <Link key={res.id} href={`/admin/laporan/program-kerja/${res.id}`} className="block bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 rounded-lg p-2.5 transition-colors group">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold group-hover:text-emerald-700 truncate text-emerald-950">{res.title}</span>
                        <ArrowRight size={12} className="text-emerald-400 group-hover:text-emerald-600" />
                     </div>
                  </Link>
                ))}
             </div>
          </div>
        )}

        {/* --- MAIN DATA TABLE --- */}
        <section className="bg-white border border-emerald-100 rounded-xl shadow-sm overflow-hidden">
           <Deferred data="workPrograms" fallback={<LoadingState />}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left whitespace-nowrap">
                  <thead className="bg-emerald-50/30 text-emerald-950 border-b border-emerald-100">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest">Judul Inisiatif Program</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Unit Pelaksana</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Wilayah</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest">Status Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/50">
                    {!workPrograms || workPrograms.data.length === 0 ? (
                        <EmptyState />
                    ) : (
                      workPrograms.data.map((p) => (
                        <tr key={p.id} className="group hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-emerald-950 group-hover:text-emerald-700 max-w-[450px] truncate leading-tight" title={p.title}>{p.title}</span>
                              <span className="text-[9px] font-black text-emerald-400 font-mono mt-0.5 tracking-tighter">REGID: {p.id.toString().padStart(6, '0')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2.5 py-1 bg-white border border-emerald-100 text-emerald-900 rounded-md text-[10px] font-black shadow-xs">
                              {p.kelompok?.nama_kelompok || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <MapPin size={10} className="text-emerald-600/50" />
                              <span className="text-xs font-bold text-emerald-900">{p.kelompok?.lokasi?.village_name || '-'}</span>
                              <span className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">({p.kelompok?.lokasi?.district_name || 'Lokasi Terpusat'})</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-3 text-sm">
                              <StatusBadge status={p.status} className="font-black text-[9px] uppercase tracking-wider" />
                              <Link 
                                href={`/admin/laporan/program-kerja/${p.id}`} 
                                className="h-8 w-8 bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-xs group-hover:scale-110"
                              >
                                <ArrowRight size={14} strokeWidth={3} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION COMPACT */}
              <div className="px-5 py-3 border-t border-emerald-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                        Total <strong className="text-emerald-950 font-black">{workPrograms?.meta.total ?? 0}</strong> Entri Terverifikasi
                    </span>
                  </div>
                  {workPrograms && <Pagination meta={workPrograms.meta} />}
              </div>
           </Deferred>
        </section>

        {/* --- MINI GOVERNANCE FOOTER --- */}
        <div className="bg-white rounded-xl p-4 text-emerald-950 flex items-center justify-between gap-4 shadow-sm border border-emerald-100 relative overflow-hidden group/footer">
          <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover/footer:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
             <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
               <ShieldCheck size={20} />
             </div>
             <p className="text-[10px] font-black text-emerald-950 leading-tight uppercase tracking-[0.1em]">
                Sistem Monitoring Program Kerja Institusional. <span className="text-emerald-400">Penjaminan Mutu & Transparansi Berbasis SDGs.</span>
             </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 relative z-10 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">Audit Mode: ACTIVE</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={10} className="px-5 py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-200 border border-emerald-50">
              <SearchCode size={24} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Modul Program Nihil</span>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Tidak ditemukan data untuk parameter filter saat ini.</p>
          </div>
      </td>
    </tr>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white">
       <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
       <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Data Audit...</span>
    </div>
  );
}



