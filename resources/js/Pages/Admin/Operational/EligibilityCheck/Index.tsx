import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  CheckCircle2, XCircle, Download, Users, Target, Search, RefreshCw,
  ChevronDown, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

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
    <AppLayout title="Cek Kelayakan Peserta">
      <Head title="Cek Kelayakan KKN" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-500">Operasional KKN</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Cek Kelayakan Peserta</h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">Validasi akademis dan prasyarat pendaftaran KKN mahasiswa.</p>
          </div>
          <button onClick={handleExport} className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shrink-0">
            <Download size={15} /> Ekspor Laporan
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"><Users size={18} /></div>
            <div><p className="text-lg font-bold text-gray-900 tabular-nums">{stats.total.toLocaleString()}</p><p className="text-xs text-gray-500">Total Dievaluasi</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={18} /></div>
            <div><p className="text-lg font-bold text-gray-900 tabular-nums">{stats.eligible_count.toLocaleString()}</p><p className="text-xs text-gray-500">Lolos Kualifikasi</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><XCircle size={18} /></div>
            <div><p className="text-lg font-bold text-gray-900 tabular-nums">{stats.not_eligible_count.toLocaleString()}</p><p className="text-xs text-gray-500">Tidak Memenuhi Syarat</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Target size={18} /></div>
            <div><p className="text-lg font-bold text-gray-900 tabular-nums">{stats.eligibility_rate}%</p><p className="text-xs text-gray-500">Rasio Kelayakan</p></div>
          </div>
        </div>

        {/* FILTER & TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Periode KKN</label>
              <div className="relative">
                <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 appearance-none shadow-sm">
                  <option value="">Semua Periode</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Fakultas</label>
              <div className="relative">
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 appearance-none shadow-sm">
                  <option value="">Semua Fakultas</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Tampilkan</label>
              <div className="flex h-10 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <button onClick={() => setShowEligible(true)} className={clsx('flex-1 text-xs font-medium transition-colors', showEligible ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50')}>Lolos</button>
                <button onClick={() => setShowEligible(false)} className={clsx('flex-1 text-xs font-medium transition-colors', !showEligible ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-50')}>Tidak Lolos</button>
              </div>
            </div>
            <button onClick={handleFilter} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
              <RefreshCw size={15} /> Terapkan
            </button>
          </div>

          {/* SEARCH */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/30">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama atau NIM..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFilter()} className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 shadow-sm" />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data Peserta</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Parameter Akademis</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">BTA-PPI</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Dokumen</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status Akhir</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Tidak ada data yang ditemukan.</td></tr>
                ) : students.map(s => (
                  <tr key={s.mahasiswa_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold shrink-0">{s.nama.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{s.nama}</span>
                          <span className="text-xs text-gray-500">NIM: {s.nim}</span>
                          <span className="text-xs text-gray-400">{s.mahasiswa?.prodi?.nama || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded w-fit", s.sks_completed >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                          {s.sks_completed} SKS
                        </span>
                        <span className="text-xs text-gray-500">IPK: {s.gpa ? Number(s.gpa).toFixed(2) : '0.00'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.is_bta_ppi_passed
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={13} /> Lulus</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700"><XCircle size={13} /> Belum</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span title="Surat Kesehatan" className={clsx("h-7 w-7 rounded-full border flex items-center justify-center", s.has_health_certificate ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-400')}>
                          <ShieldCheck size={13} />
                        </span>
                        <span title="Izin Orang Tua" className={clsx("h-7 w-7 rounded-full border flex items-center justify-center", s.has_parent_permission ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-400')}>
                          <ShieldCheck size={13} />
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.is_eligible
                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Lolos</span>
                        : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><AlertTriangle size={11} /> Gagal ({s.issue_count})</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/mahasiswa/${s.mahasiswa_id}`} className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Total <strong>{pagination.total.toLocaleString()}</strong> data peserta</span>
            <Pagination meta={{ current_page: pagination.current_page, last_page: pagination.last_page, per_page: pagination.per_page, total: pagination.total, links: [], from: (pagination.current_page - 1) * pagination.per_page + 1, to: Math.min(pagination.current_page * pagination.per_page, pagination.total), path: '/admin/cek-kelayakan' }} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
