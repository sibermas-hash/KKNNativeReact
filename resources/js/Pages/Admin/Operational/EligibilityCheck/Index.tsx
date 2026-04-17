import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  CheckCircle2, XCircle, Download, RefreshCw,
  ChevronDown, ShieldCheck, Activity, FileSearch, ArrowRight,
  Info, Filter, Database, AlertTriangle, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

interface EligibilityCheck { 
  passed: boolean; 
  key: string; 
  message: string; 
}

interface Student {
  mahasiswa_id: number; 
  nim: string; 
  nama: string; 
  sks_completed: number; 
  gpa: number | null;
  is_bta_ppi_passed: boolean; 
  has_health_certificate: boolean; 
  has_parent_permission: boolean;
  checks: EligibilityCheck[]; 
  is_eligible: boolean; 
  issues: EligibilityCheck[]; 
  issue_count: number;
  mahasiswa?: { 
    fakultas?: { nama: string }; 
    prodi?: { nama: string } 
  };
}

interface Props {
  students: Student[];
  pagination: { 
    current_page: number; 
    per_page: number; 
    total: number; 
    last_page: number 
  };
  stats: { 
    total: number; 
    eligible_count: number; 
    not_eligible_count: number; 
    eligibility_rate: number; 
  };
  filters: { 
    period_id?: number; 
    faculty_id?: number; 
    show_eligible: boolean;
    search?: string;
  };
  periods: Array<{ id: number; name: string }>;
  faculties: Array<{ id: number; name: string }>;
}

export default function EligibilityIndex({ students, pagination, stats, filters, periods, faculties }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
  const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
  const [showEligible, setShowEligible] = useState(filters.show_eligible);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = () => {
    router.get('/admin/audit-kualifikasi', { 
      period_id: periodId || undefined, 
      faculty_id: facultyId || undefined, 
      show_eligible: showEligible, 
      search: search || undefined 
    }, { 
      preserveState: true,
      replace: true 
    });
  };

  const resetFilters = () => {
    setSearch('');
    setPeriodId('');
    setFacultyId('');
    setShowEligible(true);
    router.get('/admin/audit-kualifikasi', {}, { replace: true });
  };

  const handleExport = () => { 
    window.location.href = `/admin/audit-kualifikasi/ekspor?period_id=${periodId}&faculty_id=${facultyId}`; 
  };

  return (
    <AppLayout title="Audit Kualifikasi Akademik">
      <Head title="Audit Kualifikasi KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-gray-900">
        
        <PageHeader 
          title="Audit Kualifikasi."
          subtitle="Pemantauan kelaikan mahasiswa berdasarkan SKS, IPK, dan sertifikasi BTA-PPI secara real-time dari database akademik."
          icon={ShieldCheck}
          groupLabel="Sistem Audit Otomatis"
          stats={{
            label: 'Total Mahasiswa',
            value: `${stats.total.toLocaleString()} Jiwa`,
            icon: Database
          }}
        >
          <button
            onClick={handleExport}
            className="h-12 px-6 bg-white border-2 border-gray-200 hover:border-emerald-600 text-gray-900 rounded-xl font-bold text-xs transition-all flex items-center gap-3 active:scale-95 shadow-sm uppercase tracking-wider"
          >
            <Download size={16} strokeWidth={2.5} /> Ekspor Hasil Audit
          </button>
        </PageHeader>

        {/* --- INFO BANNER --- */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex gap-4 items-start shadow-sm mb-6">
          <div className="h-10 w-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 text-[#1a7a4a] shadow-sm">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-900 leading-relaxed uppercase tracking-wide">Kebijakan Kelayakan</p>
            <p className="text-xs font-semibold text-[#1a7a4a]/80 leading-relaxed">
              Status <span className="font-bold">"LAYAK"</span> diberikan jika mahasiswa telah melewati ambang batas: SKS &ge; 100, IPK &ge; 2.0, dan Lulus BTA-PPI. Audit ini dilakukan secara otomatis untuk mempermudah monitoring sebelum pendaftaran dibuka.
            </p>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Audit" value={stats.total} icon={FileSearch} />
          <StatCard label="Lolos Kualifikasi" value={stats.eligible_count} icon={CheckCircle2} variant="success" />
          <StatCard label="Gagal Kualifikasi" value={stats.not_eligible_count} icon={XCircle} variant="danger" />
          <StatCard label="Efisiensi Kelayakan" value={`${stats.eligibility_rate}%`} icon={Activity} variant="info" />
        </div>

        {/* --- CONTENT PANEL --- */}
        <ContentPanel
          title="Daftar Audit Kualifikasi"
          description="Penyaringan Data Berdasarkan Atribut Akademik"
          icon={Activity}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <SearchInput 
                placeholder="Cari NIM atau Nama..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onSearch={handleFilter}
                className="w-64"
              />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  "h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border-2",
                  showFilters ? "bg-[#16a34a] border-emerald-600 text-white" : "bg-white border-gray-200 text-gray-900 hover:border-emerald-600"
                )}
              >
                <Filter size={14} strokeWidth={2.5} />
                {showFilters ? 'TUTUP' : 'FILTER'}
              </button>
              <button 
                onClick={handleFilter}
                className="h-11 px-8 bg-emerald-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 uppercase tracking-widest"
              >
                Filter
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-900/40 uppercase tracking-widest">
                Halaman <strong className="text-gray-900 tabular-nums">{pagination.current_page}</strong> dari {pagination.last_page}
              </span>
              <Pagination meta={{ 
                current_page: pagination.current_page, 
                last_page: pagination.last_page, 
                per_page: pagination.per_page, 
                total: pagination.total, 
                links: [], 
                from: (pagination.current_page - 1) * pagination.per_page + 1, 
                to: Math.min(pagination.current_page * pagination.per_page, pagination.total), 
                path: '/admin/audit-kualifikasi' 
              }} />
            </div>
          }
        >
          {showFilters && (
            <div className="p-6 bg-emerald-50/20 border-b-2 border-[#f3f4f6] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-900 uppercase tracking-widest pl-1">Periode Program</label>
                <div className="relative group">
                  <select 
                    value={periodId} 
                    onChange={e => setPeriodId(e.target.value)} 
                    className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-[#f3f4f6] bg-white text-xs font-bold text-gray-900 focus:border-emerald-600 appearance-none transition-all"
                  >
                    <option value="">SEMUA PERIODE</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none group-focus-within:rotate-180 transition-transform" strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-900 uppercase tracking-widest pl-1">Fakultas / Satker</label>
                <div className="relative group">
                  <select 
                    value={facultyId} 
                    onChange={e => setFacultyId(e.target.value)} 
                    className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-[#f3f4f6] bg-white text-xs font-bold text-gray-900 focus:border-emerald-600 appearance-none transition-all"
                  >
                    <option value="">SEMUA FAKULTAS</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none group-focus-within:rotate-180 transition-transform" strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-900 uppercase tracking-widest pl-1">Status Kelayakan</label>
                <div className="flex h-11 bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setShowEligible(true)} 
                    className={clsx(
                      "flex-1 rounded-lg text-xs font-extrabold transition-all tracking-wider",
                      showEligible ? "bg-white text-[#1a7a4a] shadow-sm" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    LAYAK
                  </button>
                  <button 
                    onClick={() => setShowEligible(false)} 
                    className={clsx(
                      "flex-1 rounded-lg text-xs font-extrabold transition-all tracking-wider",
                      !showEligible ? "bg-white text-rose-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    GAGAL
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button onClick={resetFilters} className="text-xs font-extrabold text-gray-900/30 hover:text-rose-600 uppercase tracking-widest transition-colors">Reset Filter</button>
              </div>
            </div>
          )}

          <PremiumTable
            headers={['Mahasiswa', 'Matrik Akademik', 'BTA-PPI', 'Dokumen', 'Hasil Audit', 'Manual']}
            isEmpty={students.length === 0}
            emptyText="Tidak ditemukan data audit yang sesuai dengan filter."
          >
            {students.map(s => (
              <PremiumTableRow key={s.mahasiswa_id}>
                <PremiumTableCell>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#e8f5ee] text-[#1a7a4a] flex items-center justify-center text-xs font-bold border border-gray-200">
                      {s.nama.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-900 leading-tight uppercase tracking-tight">{s.nama}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1a7a4a] font-mono tracking-wider">{s.nim}</span>
                        <span className="text-xs font-extrabold text-gray-900/30 uppercase tracking-wide truncate max-w-[120px]">{s.mahasiswa?.prodi?.nama || 'PRODI'}</span>
                      </div>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={clsx(
                      "text-xs font-extrabold px-3 py-1 rounded-lg border tabular-nums tracking-wider leading-none", 
                      s.sks_completed >= 100 ? 'bg-[#e8f5ee] border-gray-200 text-[#1a7a4a]' : 'bg-rose-50 border-rose-100 text-rose-600'
                    )}>
                      {s.sks_completed} SKS
                    </span>
                    <span className="text-xs font-bold text-gray-900/30 font-mono leading-none">IPK: {s.gpa ? Number(s.gpa).toFixed(2) : '-'}</span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <StatusTag status={s.is_bta_ppi_passed ? 'success' : 'danger'} label={s.is_bta_ppi_passed ? 'PASSED' : 'BELUM'} size="sm" />
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <div className="flex items-center justify-center gap-2">
                    <div title="KES" className={clsx("h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all", s.has_health_certificate ? 'bg-[#e8f5ee] border-gray-200 text-[#1a7a4a]' : 'bg-gray-50 border-gray-100 text-gray-500')}>
                      {s.has_health_certificate ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
                    </div>
                    <div title="IZIN" className={clsx("h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all", s.has_parent_permission ? 'bg-[#e8f5ee] border-gray-200 text-[#1a7a4a]' : 'bg-gray-50 border-gray-100 text-gray-500')}>
                      {s.has_parent_permission ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <StatusTag status={s.is_eligible ? 'success' : 'danger'} label={s.is_eligible ? 'LAYAK' : `GAGAL (${s.issue_count})`} size="md" />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <Link 
                    href={`/admin/mahasiswa/${s.mahasiswa_id}`} 
                    className="h-9 px-4 inline-flex items-center justify-center bg-white text-gray-900 hover:bg-emerald-900 hover:text-white border-2 border-[#f3f4f6] rounded-xl text-xs font-extrabold transition-all active:scale-95 uppercase tracking-widest shadow-sm shadow-emerald-900/5"
                  >
                    Profil <ArrowRight size={14} className="ml-2" strokeWidth={3} />
                  </Link>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

        {/* --- FOOTER INFO --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
           <div className="flex gap-4 p-6 bg-white border-2 border-[#f3f4f6] rounded-xl shadow-sm">
            <div className="h-10 w-10 bg-[#e8f5ee] rounded-xl flex items-center justify-center shrink-0 text-[#1a7a4a]">
              <RefreshCw size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider leading-none mb-1">Update Real-time</h4>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">Data disinkronkan langsung dari Master Data Akademik.</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-white border-2 border-[#f3f4f6] rounded-xl shadow-sm">
            <div className="h-10 w-10 bg-[#e8f5ee] rounded-xl flex items-center justify-center shrink-0 text-[#1a7a4a]">
              <RefreshCw size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider leading-none mb-1">Integrasi SIAKAD</h4>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">Validasi SKS dan IPK menggunakan data resmi universitas.</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-white border-2 border-[#f3f4f6] rounded-xl shadow-sm">
            <div className="h-10 w-10 bg-[#e8f5ee] rounded-xl flex items-center justify-center shrink-0 text-[#1a7a4a]">
              <RefreshCw size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider leading-none mb-1">SOP Kelayakan</h4>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">Parameter kelaikan sesuai Pedoman KKN 2026/2027.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
