import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Users,
  Target,
  Layers3,
  ChevronRight,
  Database,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Info,
  ChevronDown,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';

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
  mahasiswa?: { fakultas?: { nama: string }; prodi?: { nama: string } };
}
interface Props {
  students: Student[];
  pagination: { current_page: number; per_page: number; total: number; last_page: number };
  stats: {
    total: number;
    eligible_count: number;
    not_eligible_count: number;
    eligibility_rate: number;
  };
  filters: { period_id?: number; faculty_id?: number; show_eligible: boolean };
  periods: Array<{ id: number; name: string }>;
  faculties: Array<{ id: number; name: string }>;
}

export default function EligibilityIndex({
  students,
  pagination,
  stats,
  filters,
  periods,
  faculties,
}: Props) {
  const [search, setSearch] = useState('');
  const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
  const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
  const [showEligible, setShowEligible] = useState(filters.show_eligible);

  const handleFilter = () => {
    router.get(
      '/admin/cek-kelayakan',
      {
        period_id: periodId || undefined,
        faculty_id: facultyId || undefined,
        show_eligible: showEligible,
        search,
      },
      { preserveState: true }
    );
  };

  const handleExport = () => {
    window.location.href = `/admin/cek-kelayakan/ekspor?period_id=${periodId}&faculty_id=${facultyId}`;
  };

  return (
    <AppLayout title="Protokol Kelayakan Peserta">
      <Head title="Kelayakan Peserta" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <ShieldCheck size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Validasi Integritas Akademik</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Kelayakan <span className="text-emerald-500">Peserta.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Protokol Validasi Otomatis Integritas Akademik dan Prasyarat Registrasi KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Activity size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Rasio Kelayakan</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{stats.eligibility_rate}% TERVALIDASI</span>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <Download size={18} />
                        Ekspor Laporan
                    </button>
                </div>
            </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard label="Total Evaluasi" value={stats.total} icon={Users} color="slate" desc="Mahasiswa terproses" />
          <MetricCard label="Layak Daftar" value={stats.eligible_count} icon={CheckCircle2} color="emerald" desc="Memenuhi syarat" />
          <MetricCard label="Belum Layak" value={stats.not_eligible_count} icon={XCircle} color="rose" desc="Terhambat syarat" />
          <MetricCard label="Rasio Kelulusan" value={`${stats.eligibility_rate}%`} icon={Target} color="amber" isText desc="Persentase kelayakan" />
        </div>

        {/* --- FILTER CONTROL --- */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Periode KKN</label>
              <div className="relative">
                <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-10"
                >
                    <option value="">— Pilih Periode —</option>
                    {periods.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Filter Fakultas</label>
              <div className="relative">
                <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none pr-10"
                >
                    <option value="">— Semua Fakultas —</option>
                    {faculties.map((f) => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Status Kelayakan</label>
              <div className="flex h-11 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setShowEligible(true)}
                  className={clsx('flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all', showEligible ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                >
                  Layak
                </button>
                <button
                  onClick={() => setShowEligible(false)}
                  className={clsx('flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all', !showEligible ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                >
                  Gagal
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button onClick={handleFilter} className="w-full h-11 bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-emerald-100">
                <RefreshCw size={16} /> Perbarui Filter
              </button>
            </div>
          </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white border border-slate-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <Layers3 size={20} />
              </div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Daftar Hasil Validasi</h3>
            </div>
            <div className="relative w-full md:w-80 group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan Nama atau NIM..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300"
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-4">Mahasiswa</th>
                  <th className="px-6 py-4 text-center">Data Akademik</th>
                  <th className="px-6 py-4 text-center">BTA-PPI</th>
                  <th className="px-6 py-4 text-center">Kelengkapan Berkas</th>
                  <th className="px-6 py-4 text-center">Hasil Validasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(students && students.length > 0) ? (
                  students.map((s) => (
                    <tr key={s.mahasiswa_id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 bg-white border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                            {s.nama.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-black group-hover:text-emerald-700 transition-colors uppercase leading-tight">{s.nama}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">NIM: {s.nim}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={clsx('px-2.5 py-1 rounded text-[10px] font-bold uppercase border tabular-nums', s.sks_completed >= 100 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100 shadow-sm shadow-red-50')}>
                              {s.sks_completed} SKS
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 tabular-nums">IPK: {s.gpa ? Number(s.gpa).toFixed(2) : '0.00'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center tabular-nums">
                          {s.is_bta_ppi_passed ?
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black italic tracking-widest">
                                <CheckCircle2 size={10} /> LULUS
                            </div> :
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-300 border border-slate-200 rounded-full text-[9px] font-black italic tracking-widest">
                                <XCircle size={10} /> TIDAK LULUS
                            </div>
                          }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <DocStatus active={s.has_health_certificate} title="Surat Kesehatan" />
                          <DocStatus active={s.has_parent_permission} title="Izin Orang Tua" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.is_eligible ? (
                          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider italic shadow-lg shadow-emerald-100">
                             LAYAK DAFTAR
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider italic shadow-lg shadow-red-100">
                             BELUM LAYAK ({s.issue_count})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/mahasiswa/${s.mahasiswa_id}`}
                          className="h-9 px-5 bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-300">
                            <Info size={40} className="mb-2" />
                            <p className="text-sm font-bold uppercase tracking-[0.2em]">Data validasi tidak ditemukan</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Halaman {pagination.current_page} dari {pagination.last_page} | Total {pagination.total.toLocaleString()} Mahasiswa
            </span>
            <Pagination meta={{ current_page: pagination.current_page, last_page: pagination.last_page, per_page: pagination.per_page, total: pagination.total, links: [], from: (pagination.current_page - 1) * pagination.per_page + 1, to: Math.min(pagination.current_page * pagination.per_page, pagination.total), path: '/admin/cek-kelayakan' }} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color, isText = false, desc }: { label: string; value: string | number; icon: LucideIcon; color: 'emerald' | 'rose' | 'amber' | 'slate'; isText?: boolean, desc: string }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-400 border-slate-100'
  };
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
      <div className="flex items-center justify-between relative z-10">
        <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', colorMap[color])}>
          <Icon size={20} />
        </div>
        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{desc}</div>
      </div>
      <div className="mt-6 space-y-1 relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={clsx('font-black text-black tracking-tighter tabular-nums leading-none', isText ? 'text-lg' : 'text-3xl')}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function DocStatus({ active, title }: { active: boolean; title: string }) {
  return (
    <div title={title} className={clsx('h-9 w-9 rounded-xl border flex items-center justify-center transition-all', active ? 'bg-emerald-50 text-emerald-500 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-200 border-slate-100')}>
      <ShieldCheck size={16} />
    </div>
  );
}
