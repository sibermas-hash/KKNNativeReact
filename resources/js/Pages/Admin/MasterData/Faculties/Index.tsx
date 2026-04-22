import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Search,
  Database,
  Activity,
  Building2,
  ShieldCheck,
  Layers,
  RefreshCw,
  Globe,
  Info,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';

interface Faculty { 
  id: number; 
  name: string; 
  code: string; 
  students_count?: number; 
  programs_count?: number; 
}

interface SyncInfo {
  mode: string;
  source: string;
  last_synced_at: string | null;
}

interface Props { 
  faculties: { data: Faculty[]; meta: PaginationMeta; }; 
  filters: { search?: string; }; 
  syncInfo: SyncInfo;
}

export default function FacultiesIndex({ faculties, filters, syncInfo }: Props) {
  const [search, setSearch] = useState(filters?.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get('/admin/fakultas', { search }, { preserveState: true, replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout title="Direktori Fakultas">
      <Head title="Direktori Fakultas" />

      <div className="space-y-8 pb-24 text-emerald-950 font-sans">
        
        <PageHeader 
          title="Basis Struktural."
          subtitle="Manajemen arsitektur fakultas dan protokol pemetaan akademis institusional UIN SAIZU."
          icon={Building2}
          groupLabel="Data Master Institusi"
          stats={{
            label: 'Total Unit',
            value: `${(faculties?.meta?.total ?? 0).toLocaleString()} Fakultas`,
            icon: Database
          }}
        >
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center bg-white border border-emerald-100 rounded-xl px-4 py-2">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Status Sinkronisasi</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                        <Globe size={10} className="text-emerald-600" />
                        Terhubung ke Master
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- LEFT COLUMN: Sync Info & Stats --- */}
          <div className="lg:col-span-1 space-y-6">
            <ContentPanel title="Status Integrasi" icon={RefreshCw} padding={true}>
              <div className="space-y-6">
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Mode Operasi</span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase">Sync Only</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                        <Database size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-emerald-800/60 uppercase">Sumber Data</span>
                        <span className="text-xs font-black text-emerald-950 uppercase">{syncInfo.source}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                        <Clock size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-emerald-800/60 uppercase">Terakhir Update</span>
                        <span className="text-xs font-black text-emerald-950 uppercase">{syncInfo.last_synced_at || 'Belum pernah'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                    Data fakultas dikelola secara terpusat melalui sinkronisasi master mahasiswa. Perubahan manual dinonaktifkan untuk menjaga integritas relasi data.
                  </p>
                </div>

                <div className="space-y-3">
                  <StatCard label="Total Fakultas" value={faculties.meta.total} icon={Layers} variant="success" className="w-full" />
                </div>
              </div>
            </ContentPanel>
          </div>

          {/* --- RIGHT COLUMN: Faculty List --- */}
          <div className="lg:col-span-2">
            <ContentPanel 
              title="Direktori Basis Unit" 
              icon={Layers} 
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="CARI FAKULTAS..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-64"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Data Sistem &middot; {faculties.meta.total} Terdaftar
                  </span>
                  <Pagination meta={faculties.meta} />
                </div>
              }
            >
              <PremiumTable
                headers={['Kode', 'Nomenklatur Fakultas', 'Distribusi', 'Status']}
                isEmpty={faculties.data.length === 0}
                emptyText="Data fakultas tidak ditemukan."
              >
                {faculties.data.map((faculty) => (
                  <PremiumTableRow key={faculty.id} className="group">
                    <PremiumTableCell>
                      <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-emerald-900 text-[10px] font-black rounded-lg tabular-nums">
                        {faculty.code || 'SYS_NONE'}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 leading-none group-hover:text-emerald-700 transition-colors">{faculty.name}</span>
                        <span className="text-[9px] font-bold text-emerald-800/40 mt-1.5 uppercase tracking-widest">ID: #{faculty.id}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-emerald-950 tabular-nums uppercase">
                          {faculty.programs_count || 0} Program Studi
                        </span>
                         <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-tighter mt-0.5">Terintegrasi Master</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Synchronized</span>
                       </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl border-b-4 border-emerald-950">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-16 -mt-16 pointer-events-none"><ShieldCheck size={250} /></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner shrink-0 backdrop-blur-sm">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight">Aturan Integritas Struktural</h2>
              <p className="text-[11px] font-medium text-emerald-400/60 uppercase tracking-widest leading-relaxed max-w-3xl">
                Fondasi segmentasi akademis merupakan pilar validitas data. Akurasi basis mahasiswa dan alokasi program studi bergantung pada stabilitas arsitektur fakultas yang terdaftar dalam master sistem.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
