import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Filter,
  Users,
  GraduationCap,
  Activity,
  Database,
  Binary,
  ShieldCheck,
  RefreshCw,
  Globe,
  Clock,
  Info,
  Layers,
  ChevronDown,
  Flag
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
}
interface Program {
  id: number;
  name: string;
  code: string;
  faculty_id: number;
  faculty?: Faculty;
  students_count?: number;
}
interface SyncInfo {
  mode: string;
  source: string;
  last_synced_at: string | null;
}
interface Props {
  programs: { data: Program[]; meta: PaginationMeta };
  faculties: Faculty[];
  filters: { search?: string; faculty_id?: string };
  syncInfo: SyncInfo;
}

export default function ProgramsIndex({ programs, faculties = [], filters = {}, syncInfo }: Props) {
  const [search, setSearch] = useState(filters?.search || '');
  const [facultyId, setFacultyId] = useState(filters?.faculty_id || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '') || facultyId !== (filters.faculty_id || '')) {
        router.get(
          '/admin/prodi',
          {
            search: search || undefined,
            faculty_id: facultyId || undefined,
          },
          { preserveState: true, replace: true },
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, facultyId]);

  return (
    <AppLayout title="Direktori Program Studi">
      <Head title="Direktori Program Studi" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans">
        
        <PageHeader 
          title="Matriks Program."
          subtitle="Matriks pemetaan akademis dan basis distribusi peserta KKN institusional UIN SAIZU."
          icon={Binary}
          groupLabel="Data Master Institusi"
          stats={{
            label: 'Total Program',
            value: `${(programs?.meta?.total ?? 0).toLocaleString()} Prodi`,
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
                        Pusat Data Terintegrasi
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- LEFT COLUMN: Sync Info & Filters --- */}
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
                    Data program studi mengikuti sinkronisasi master mahasiswa. Perubahan manual dinonaktifkan untuk menjaga konsistensi pendaftaran.
                  </p>
                </div>
              </div>
            </ContentPanel>

            <ContentPanel title="Filter Unit" icon={Filter} padding={true}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1">Basis Fakultas</label>
                  <div className="relative group">
                    <select 
                      value={facultyId} 
                      onChange={e => setFacultyId(e.target.value)} 
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none"
                    >
                      <option value="">SELURUH FAKULTAS</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                  </div>
                </div>
                
                {facultyId && (
                   <button 
                    onClick={() => setFacultyId('')} 
                    className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors"
                  >
                    Reset Filter Fakultas
                  </button>
                )}
              </div>
            </ContentPanel>

            <div className="space-y-3">
              <StatCard label="Total Program" value={programs.meta.total} icon={Binary} variant="success" className="w-full" />
            </div>
          </div>

          {/* --- RIGHT COLUMN: Program List --- */}
          <div className="lg:col-span-2">
            <ContentPanel 
              title="Indeks Antrean Prodi" 
              icon={Layers} 
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="CARI DATA PRODI / KODE..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-64"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Data Sistem &middot; {programs.meta.total} Data Program
                  </span>
                  <Pagination meta={programs.meta} />
                </div>
              }
            >
              <PremiumTable
                headers={['Identitas', 'Nomenklatur Program', 'Fakultas Terkait', 'Status']}
                isEmpty={programs.data.length === 0}
                emptyText="Data program studi tidak ditemukan."
              >
                {programs.data.map((program) => (
                  <PremiumTableRow key={program.id} className="group">
                    <PremiumTableCell>
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm tabular-nums">
                        {program.code || 'NULL'}
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 leading-none group-hover:text-emerald-700 transition-colors uppercase">
                          {program.name}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800/40 mt-1.5 uppercase tracking-widest">
                          ID Sistem: #{program.id}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Building2 size={12} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">
                          {program.faculty?.name || 'BELUM TEROKUPASI'}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Validated</span>
                       </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>

        {/* --- STRATEGIC INFO --- */}
        <div className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl border-b-4 border-emerald-950">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-16 -mt-16 pointer-events-none"><Database size={350} strokeWidth={0.5} /></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner shrink-0 backdrop-blur-sm">
              <Flag size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight">Aturan Skema Program</h2>
              <p className="text-[11px] font-medium text-emerald-400/60 uppercase tracking-widest leading-relaxed max-w-3xl">
                Parameter program menentukan validitas penugasan dan kriteria mahasiswa di lapangan. Pastikan konfigurasi skema sesuai dengan pedoman akademik LPPM untuk menjamin validitas pendaftaran KKN.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
