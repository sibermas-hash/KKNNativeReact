'use client';

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import {
  Users, CheckCircle2, XCircle, Search, Download, ChevronLeft, ChevronRight,
  Filter, BarChart3, AlertTriangle, ChevronDown, ChevronUp, GraduationCap,
  Building2, Percent, FileSpreadsheet, ShieldCheck, ShieldX
} from 'lucide-react';

type Check = { passed: boolean; key: string; message: string; dispensasi?: boolean };
type IssueOption = { value: string; label: string };
type Student = {
  mahasiswa_id: number; nim: string; nama: string;
  prodi_nama?: string; fakultas_nama?: string;
  sks_completed?: number; gpa?: number;
  is_bta_ppi_passed?: boolean; has_health_certificate?: boolean; has_parent_permission?: boolean;
  checks?: Record<string, Check>; is_eligible: boolean;
  issues?: Check[]; issue_count?: number; has_dispensasi?: boolean;
};
type Stats = { total: number; eligible_count: number; not_eligible_count: number; eligibility_rate: number };
type Pagination = { current_page: number; per_page: number; total: number; last_page: number };
type ApiRes = { data?: { students?: Student[]; pagination?: Pagination; stats?: Stats; issue_filters?: IssueOption[] } };

export default function AuditKualifikasiPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showEligible, setShowEligible] = useState(true);
  const [page, setPage] = useState(1);
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [issueFilter, setIssueFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
    setTimer(t);
  };

  // Fetch faculties
  const { data: faculties } = useQuery<{ id: number; nama: string }[]>({
    queryKey: ['admin', 'fakultas-list'],
    queryFn: async () => {
      const res = await api.get('/admin/fakultas');
      const d = res as unknown as Record<string, unknown>;
      return (Array.isArray(d) ? d : Array.isArray((d.data as Record<string, unknown>)?.data) ? (d.data as Record<string, unknown>).data : d.data) as { id: number; nama: string }[];
    },
    staleTime: 60000,
  });

  // Main query
  const { data: raw, isLoading, isFetching } = useQuery<ApiRes>({
    queryKey: ['admin', 'audit-kualifikasi', { search: debouncedSearch, showEligible, page, facultyId, issueFilter }],
    queryFn: async () => {
      return await api.get('/admin/audit-kualifikasi', {
        params: {
          search: debouncedSearch || undefined,
          show_eligible: showEligible,
          page,
          faculty_id: facultyId || undefined,
          issue: issueFilter || undefined,
        },
      }) as unknown as ApiRes;
    },
    placeholderData: keepPreviousData,
  });

  const payload = (raw ?? {}) as Record<string, unknown>;
  const inner = (payload.data ?? payload) as Record<string, unknown>;
  const students: Student[] = (inner.students ?? []) as Student[];
  const pagination: Pagination = (inner.pagination ?? { current_page: 1, per_page: 20, total: 0, last_page: 1 }) as Pagination;
  const stats: Stats = (inner.stats ?? { total: 0, eligible_count: 0, not_eligible_count: 0, eligibility_rate: 0 }) as Stats;
  const apiIssueOptions: IssueOption[] = (inner.issue_filters ?? []) as IssueOption[];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/admin/audit-kualifikasi/export', {
        params: {
          faculty_id: facultyId || undefined,
          search: debouncedSearch || undefined,
          show_eligible: showEligible,
          issue: issueFilter || undefined,
        },
        responseType: 'blob',
      });
      const blob = new Blob([res as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Eligibility_KKN_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal export. Pastikan Anda login sebagai superadmin.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (id: number) => setExpandedId(expandedId === id ? null : id);

  const issueOptions = useMemo<IssueOption[]>(() => {
    const fallback = [
      { value: 'status_aktif', label: 'Status akademik tidak aktif' },
      { value: 'min_sks', label: 'SKS kurang' },
      { value: 'min_semester', label: 'Semester kurang' },
      { value: 'min_gpa', label: 'IPK kurang' },
      { value: 'ukt_payment', label: 'UKT belum lunas' },
      { value: 'bta_ppi', label: 'BTA-PPI belum lulus' },
      { value: 'program_prodi', label: 'Prodi tidak sesuai' },
      { value: 'personal_status', label: 'Syarat personal' },
      { value: 'no_prior_completion', label: 'Sudah pernah KKN' },
    ];

    const source = apiIssueOptions.length > 0 ? apiIssueOptions : fallback;
    return [{ value: '', label: 'Semua Syarat' }, ...source];
  }, [apiIssueOptions]);

  const rate = stats.eligibility_rate ?? 0;
  const rateColor = rate >= 70 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = rate >= 70 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Kualifikasi"
        subtitle="Periksa kelayakan mahasiswa untuk mengikuti KKN berdasarkan persyaratan akademik dan administratif."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5"><Users className="h-5 w-5 text-slate-600" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Mahasiswa</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Eligible</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.eligible_count.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5"><ShieldX className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tidak Eligible</p>
              <p className="text-2xl font-bold text-red-500">{stats.not_eligible_count.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5"><Percent className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tingkat Kelayakan</p>
              <p className={`text-2xl font-bold ${rateColor}`}>{rate}%</p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${rate}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><b>Formula audit:</b> Audit ini menghitung syarat akademik dan syarat khusus jenis KKN dari cache eligibility terbaru. Dokumen pendaftaran diperiksa di tahap approval, bukan di halaman audit ini.</div></div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => { setShowEligible(true); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${showEligible ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Eligible
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${showEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {stats.eligible_count.toLocaleString('id-ID')}
              </span>
            </button>
            <button
              onClick={() => { setShowEligible(false); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${!showEligible ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <XCircle className="h-3.5 w-3.5" />
              Tidak Eligible
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${!showEligible ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-500'}`}>
                {stats.not_eligible_count.toLocaleString('id-ID')}
              </span>
            </button>
          </div>

          {/* Faculty filter */}
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={facultyId ?? ''}
              onChange={(e) => { setFacultyId(e.target.value ? Number(e.target.value) : null); setPage(1); }}
              className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              <option value="">Semua Fakultas</option>
              {(faculties ?? []).map((f) => (
                <option key={f.id} value={f.id}>{f.nama}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={issueFilter}
              onChange={(e) => { setIssueFilter(e.target.value); setPage(1); }}
              className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              {issueOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari NIM/Nama..."
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {isExporting ? 'Mengunduh...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada data mahasiswa {debouncedSearch ? `untuk "${debouncedSearch}"` : ''}</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {isFetching && (
              <div className="h-0.5 w-full overflow-hidden bg-slate-100">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-cyan-500" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">NIM</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Nama</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">Fakultas</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 lg:table-cell">Prodi</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">SKS</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">IPK</th>
                    <th className="hidden px-4 py-3 text-center font-semibold text-slate-600 sm:table-cell">BTA-PPI</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const isExpanded = expandedId === s.mahasiswa_id;
                    const rowNum = (pagination.current_page - 1) * pagination.per_page + i + 1;
                    return (
                      <>
                        <tr
                          key={s.mahasiswa_id}
                          onClick={() => toggleExpand(s.mahasiswa_id)}
                          className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                        >
                          <td className="px-4 py-3 text-slate-400">{rowNum}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.nim}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {s.nama}
                            {s.has_dispensasi && (
                              <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                DISPENSASI
                              </span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{s.fakultas_nama ?? '-'}</td>
                          <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">{s.prodi_nama ?? '-'}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{s.sks_completed ?? '-'}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{s.gpa ? Number(s.gpa).toFixed(2) : '-'}</td>
                          <td className="hidden px-4 py-3 text-center sm:table-cell">
                            {s.is_bta_ppi_passed ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Lulus</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Belum</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.is_eligible ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <XCircle className="h-5 w-5 text-red-400" />
                                {(s.issue_count ?? 0) > 0 && (
                                  <span className="text-xs font-medium text-red-500">{s.issue_count}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.mahasiswa_id}-detail`}>
                            <td colSpan={10} className="bg-slate-50 px-4 py-4">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(s.checks ?? {}).map(([key, check]) => (
                                  <div
                                    key={key}
                                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                                      check.passed
                                        ? check.dispensasi ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                                        : 'bg-red-50 text-red-800'
                                    }`}
                                  >
                                    {check.passed ? (
                                      check.dispensasi ? (
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                      ) : (
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                      )
                                    ) : (
                                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                    )}
                                    <span className="text-xs">{check.message}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Mobile: show fakultas/prodi */}
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 md:hidden">
                                <span>Fakultas: {s.fakultas_nama ?? '-'}</span>
                                <span>•</span>
                                <span>Prodi: {s.prodi_nama ?? '-'}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total.toLocaleString('id-ID')}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Page numbers */}
                {(() => {
                  const pages: number[] = [];
                  const lp = pagination.last_page;
                  const cp = pagination.current_page;
                  if (lp <= 7) {
                    for (let i = 1; i <= lp; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (cp > 3) pages.push(-1);
                    for (let i = Math.max(2, cp - 1); i <= Math.min(lp - 1, cp + 1); i++) pages.push(i);
                    if (cp < lp - 2) pages.push(-2);
                    pages.push(lp);
                  }
                  return pages.map((p, idx) =>
                    p < 0 ? (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-8 min-w-[2rem] rounded-lg text-xs font-medium transition-colors ${
                          p === cp ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
                <button
                  onClick={() => setPage(Math.min(pagination.last_page, page + 1))}
                  disabled={page >= pagination.last_page}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
