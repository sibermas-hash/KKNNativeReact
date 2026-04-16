import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  CheckCircle2, XCircle, Download, Users, Target, Search, RefreshCw,
  ChevronDown, ShieldCheck, AlertTriangle, Activity, Zap, FileSearch, ArrowRight, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import { motion } from 'framer-motion';

interface EligibilityCheck { passed: boolean; key: string; message: string; }
interface Student {
  mahasiswa_id: number; nim: string; nama: string; sks_completed: number; gpa: number | null;
  is_bta_ppi_passed: boolean; has_health_certificate: boolean; has_parent_permission: boolean;
  checks: EligibilityCheck[]; is_eligible: boolean; issues: EligibilityCheck[]; issue_count: number;
  mahasiswa?: { fakultas?: { nama: string }; prodi?: { nama: string } };
}
interface Props {
  students: Student[];
  pagination: { current_page: number; per_page: number; total: number; last_page: number };
  stats: { total: number; eligible_count: number; not_eligible_count: number; eligibility_rate: number; };
  filters: { period_id?: number; faculty_id?: number; show_eligible: boolean };
  periods: Array<{ id: number; name: string }>;
  faculties: Array<{ id: number; name: string }>;
}

export default function EligibilityIndex({ students, pagination, stats, filters, periods, faculties }: Props) {
  const [search, setSearch] = useState('');
  const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
  const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
  const [showEligible, setShowEligible] = useState(filters.show_eligible);

  const handleFilter = () => router.get('/admin/cek-kelayakan', { period_id: periodId || undefined, faculty_id: facultyId || undefined, show_eligible: showEligible, search }, { preserveState: true });
  const handleExport = () => { window.location.href = `/admin/cek-kelayakan/ekspor?period_id=${periodId}&faculty_id=${facultyId}`; };

  return (
    <AppLayout title="Audit Kelayakan Calon Peserta">
      <Head title="Cek Kelayakan KKN" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Audit Kualifikasi Akademik</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Laporan <span className="text-emerald-500">Kelayakan.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Analisis otomatis prasyarat pendaftaran mahasiswa berdasarkan akumulasi SKS, IPK, sertifikasi BTA-PPI, dan validasi dokumen pendukung.
                </p>
              </div>
              <div className="shrink-0">
                  <button
                    onClick={handleExport}
                    className="h-16 px-10 rounded-2xl bg-emerald-950 border-emerald-950 text-white hover:bg-black font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all border-2 flex items-center gap-4 active:scale-95"
                  >
                    <Download size={18} strokeWidth={3} /> EKSPOR LAPARAN AUDIT
                  </button>
              </div>
           </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard label="Total Audit" value={stats.total} icon={FileSearch} desc="Mahasiswa Terdata" />
           <MetricCard label="Lolos Kualifikasi" value={stats.eligible_count} icon={CheckCircle2} type="success" desc="Siap Penempatan" />
           <MetricCard label="Gagal Kualifikasi" value={stats.not_eligible_count} icon={XCircle} type="danger" desc="Perlu Dispensasi" />
           <MetricCard label="Rasio Kelayakan" value={`${stats.eligibility_rate}%`} icon={Activity} desc="Efisiensi Pendaftaran" />
        </div>

        {/* --- CONTROL PANEL --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
           <div className="px-10 py-10 bg-emerald-50/20 border-b-2 border-emerald-50 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-white rounded-2xl border-2 border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Target size={24} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none mb-1">Parameter Filter</h3>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Penyaringan Data Berdasarkan Atribut</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-10">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">Periode Akademik</label>
                   <div className="relative">
                      <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-14 px-6 bg-white border-2 border-emerald-50 rounded-2xl text-[11px] font-black text-emerald-950 focus:border-emerald-500 outline-none transition-all appearance-none uppercase tracking-widest">
                        <option value="">SEMUA PERIODE</option>
                        {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" strokeWidth={3} />
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">Fakultas / Satker</label>
                   <div className="relative">
                      <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full h-14 px-6 bg-white border-2 border-emerald-50 rounded-2xl text-[11px] font-black text-emerald-950 focus:border-emerald-500 outline-none transition-all appearance-none uppercase tracking-widest">
                        <option value="">SEMUA FAKULTAS</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" strokeWidth={3} />
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">Status Kualifikasi</label>
                   <div className="flex h-14 bg-white border-2 border-emerald-50 rounded-2xl overflow-hidden p-1.5 gap-1.5">
                      <button onClick={() => setShowEligible(true)} className={clsx('flex-1 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest', showEligible ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-400 hover:text-emerald-700')}>LOLOS</button>
                      <button onClick={() => setShowEligible(false)} className={clsx('flex-1 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest', !showEligible ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-emerald-400 hover:text-emerald-700')}>GAGAL</button>
                   </div>
                 </div>

                 <div className="flex items-end">
                    <button onClick={handleFilter} className="w-full h-14 bg-emerald-950 hover:bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95">
                      <RefreshCw size={18} strokeWidth={3} /> TERAPKAN FILTER
                    </button>
                 </div>
              </div>
           </div>

           {/* SEARCH BAR */}
           <div className="px-10 py-6 border-b-2 border-emerald-50 bg-white">
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400" strokeWidth={3} />
                <input 
                  type="text" 
                  placeholder="CARI NAMA ATAU NIM..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleFilter()} 
                  className="w-full h-14 pl-14 pr-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-[11px] font-black text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-widest" 
                />
              </div>
           </div>

           {/* DATA TABLE */}
           <div className="overflow-x-auto min-h-[500px]">
             <table className="min-w-full text-left border-collapse whitespace-nowrap">
               <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                 <tr>
                   <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Profil Mahasiswa</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Matrik Akademik</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Otoritas BTA-PPI</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Integrasi Dokumen</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Vonis Kelayakan</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Detail</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-emerald-50">
                 {students.length === 0 ? (
                   <EmptyState />
                 ) : students.map(s => (
                   <tr key={s.mahasiswa_id} className="group hover:bg-emerald-50/30 transition-all">
                     <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                         <div className="h-12 w-12 rounded-[1.25rem] bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black shrink-0 border-2 border-emerald-50 group-hover:bg-white transition-colors">{s.nama.charAt(0)}</div>
                         <div className="flex flex-col">
                           <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-tight mb-2 group-hover:text-emerald-700 transition-colors">{s.nama}</span>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-emerald-500 tracking-widest font-mono uppercase">NIM: {s.nim}</span>
                              <span className="h-1 w-1 rounded-full bg-emerald-200" />
                              <span className="text-[9px] font-black text-emerald-300 tracking-[0.1em] uppercase">{s.mahasiswa?.prodi?.nama || 'PROGRAM STUDI'}</span>
                           </div>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-8 text-center">
                       <div className="flex flex-col items-center gap-2">
                         <span className={clsx("text-[10px] font-black px-4 py-1.5 rounded-lg border-2 tracking-widest uppercase leading-none", s.sks_completed >= 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600')}>
                           {s.sks_completed} SKS
                         </span>
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none font-mono">IPK: {s.gpa ? Number(s.gpa).toFixed(2) : '0.00'}</span>
                       </div>
                     </td>
                     <td className="px-8 py-8 text-center">
                       {s.is_bta_ppi_passed
                         ? <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-700 border-2 border-emerald-100 bg-white px-4 py-2 rounded-xl uppercase tracking-widest"><CheckCircle2 size={14} strokeWidth={3} /> LULUS</span>
                         : <span className="inline-flex items-center gap-2 text-[10px] font-black text-rose-500 border-2 border-rose-100 bg-white px-4 py-2 rounded-xl uppercase tracking-widest"><XCircle size={14} strokeWidth={3} /> BELUM</span>
                       }
                     </td>
                     <td className="px-8 py-8 text-center">
                       <div className="flex items-center justify-center gap-3">
                         <DocumentStatus label="KES" passed={s.has_health_certificate} />
                         <DocumentStatus label="IZN" passed={s.has_parent_permission} />
                       </div>
                     </td>
                     <td className="px-8 py-8 text-center">
                       {s.is_eligible
                         ? <span className="inline-flex items-center px-5 py-2 rounded-xl text-[10px] font-black bg-emerald-600 border border-emerald-500 text-white uppercase tracking-widest shadow-lg shadow-emerald-100">LAYAK</span>
                         : <span className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black bg-rose-500 border border-rose-400 text-white uppercase tracking-widest shadow-lg shadow-rose-100"><AlertTriangle size={12} strokeWidth={3} /> GAGAL ({s.issue_count})</span>
                       }
                     </td>
                     <td className="px-10 py-8 text-right">
                       <Link href={`/admin/mahasiswa/${s.mahasiswa_id}`} className="h-10 px-5 inline-flex items-center justify-center bg-white text-emerald-950 hover:bg-emerald-950 hover:text-white border-2 border-emerald-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 group-hover:shadow-sm">
                          BUKA PROFIL <ArrowRight size={14} className="ml-2" strokeWidth={3} />
                       </Link>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           {/* PAGINATION */}
           <div className="px-10 py-8 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                Terdata <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{pagination.total.toLocaleString()}</strong> Kandidat Peserta Dalam Audit
             </span>
             <Pagination meta={{ current_page: pagination.current_page, last_page: pagination.last_page, per_page: pagination.per_page, total: pagination.total, links: [], from: (pagination.current_page - 1) * pagination.per_page + 1, to: Math.min(pagination.current_page * pagination.per_page, pagination.total), path: '/admin/cek-kelayakan' }} />
           </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
            <Zap size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <ShieldCheck size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Integritas Seleksi KKN</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Kebijakan Kelayakan Akademik</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                 Audit kelayakan peserta merupakan tahapan krusial untuk menjamin bahwa seluruh peserta KKN telah memenuhi kriteria akademik minimum sesuai SOP universitas. Kegagalan dalam parameter pendaftaran secara otomatis akan mengandaskan status pencalonan, kecuali jika terdapat otorisasi dispensasi khusus dari pimpinan LPPM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, type, desc }: { label: string; value: any; icon: any; type?: 'success' | 'danger'; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2", 
        type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
        type === 'danger' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-400 border-emerald-50'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value}</span>
        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}

function DocumentStatus({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div title={label} className={clsx("h-10 px-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all", passed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-300')}>
      <span className="text-[9px] font-black tracking-tighter uppercase">{label}</span>
      {passed ? <CheckCircle2 size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6} className="px-10 py-32 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <FileSearch size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">Data Audit Kosong</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">Tidak ditemukan aktivitas pendaftaran yang memenuhi kriteria filter saat ini.</p>
          </div>
      </td>
    </tr>
  );
}
