'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Users, Search, Download, RefreshCcw } from 'lucide-react';

type Peserta = {
  id: number;
  status: string;
  role?: string;
  mahasiswa?: { nama?: string; nim?: string; external_nim?: string; origin_type?: string; external_faculty_name?: string; external_prodi_name?: string; prodi?: { nama?: string }; fakultas?: { nama?: string }; external_university?: { name?: string; code?: string } };
  periode?: { id?: number; name?: string; periode?: number; academic_year?: { name?: string; tahun?: string; label?: string }; tahun_akademik?: { name?: string; tahun?: string; label?: string }; jenis_kkn?: { name?: string } };
  kelompok?: { code?: string; nama_kelompok?: string };
};

type Meta = { current_page: number; last_page: number; total: number; per_page: number };
type Faculty = { id: number; nama: string; code?: string };
type Prodi = { id: number; nama: string; code?: string; fakultas_id?: number };
type JenisKkn = { id: number; name: string; code?: string };
type Period = { id: number; name?: string; periode?: number; is_active?: boolean; jenis_kkn_id?: number; academic_year_id?: number; academic_year?: { name?: string; tahun?: string; label?: string } };
type AcademicYear = { id: number; name?: string; tahun?: string; label?: string; year?: string; academic_year?: string; semester?: string; is_active?: boolean };
type ExternalUniversity = { id: number; name: string; code?: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
  interview_passed: { label: 'Lulus Wawancara', color: 'bg-cyan-100 text-cyan-700' },
  completed: { label: 'Selesai', color: 'bg-slate-100 text-slate-700' },
};

export default function PesertaKknPage(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [prodiId, setProdiId] = useState('');
  const [jenisKknId, setJenisKknId] = useState('');
  const [periodeId, setPeriodeId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [externalUniversityId, setExternalUniversityId] = useState('');
  const [originType, setOriginType] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{ data: Peserta[]; meta: Meta }>({
    queryKey: ['admin', 'peserta-kkn', page, search, angkatan, fakultasId, prodiId, jenisKknId, periodeId, academicYearId, externalUniversityId, originType],
    queryFn: async () => {
      const res = await rawApi.get('/admin/peserta-kkn', {
        params: { page, search: search || undefined, angkatan: angkatan || undefined, fakultas_id: fakultasId || undefined, prodi_id: prodiId || undefined, jenis_kkn_id: jenisKknId || undefined, periode_id: periodeId || undefined, academic_year_id: academicYearId || undefined, external_university_id: externalUniversityId || undefined, origin_type: originType || undefined, per_page: 25 },
      });
      return ((res.data as { data?: unknown }).data ?? res.data) as { data: Peserta[]; meta: Meta };
    },
  });

  const { data: faculties = [] } = useQuery<Faculty[]>({
    queryKey: ['admin', 'fakultas', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas', { params: { per_page: 100 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Faculty[];
    },
    staleTime: 300000,
  });

  const { data: prodiOptions = [] } = useQuery<Prodi[]>({
    queryKey: ['admin', 'prodi', 'peserta-kkn-filter', fakultasId],
    queryFn: async () => {
      const res = await rawApi.get('/admin/prodi', { params: { per_page: 500, fakultas_id: fakultasId || undefined } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Prodi[];
    },
    staleTime: 300000,
  });

  const { data: periodOptions = [] } = useQuery<Period[]>({
    queryKey: ['admin', 'periode', 'peserta-kkn-filter', jenisKknId, academicYearId],
    queryFn: async () => {
      const res = await rawApi.get('/admin/periode', { params: { per_page: 100, active: 1, jenis_kkn_id: jenisKknId || undefined, academic_year_id: academicYearId || undefined } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return ((Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Period[]).filter((p) => p.is_active === true);
    },
    staleTime: 300000,
  });

  const activePeriodIds = useMemo(() => new Set(periodOptions.map((p) => String(p.id))), [periodOptions]);
  useEffect(() => {
    if (!periodeId && periodOptions[0]?.id) setPeriodeId(String(periodOptions[0].id));
    if (periodeId && periodOptions.length > 0 && !activePeriodIds.has(periodeId)) setPeriodeId(String(periodOptions[0]?.id ?? ''));
  }, [periodeId, periodOptions, activePeriodIds]);

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['admin', 'tahun-akademik', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/tahun-akademik', { params: { per_page: 100, active: 1 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return ((Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as AcademicYear[]).filter((y) => y.is_active !== false);
    },
    staleTime: 300000,
  });

  const { data: externalUniversities = [] } = useQuery<ExternalUniversity[]>({
    queryKey: ['admin', 'external-universities', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/external-universities', { params: { per_page: 200 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as ExternalUniversity[];
    },
    staleTime: 300000,
  });

  const { data: jenisKknOptions = [] } = useQuery<JenisKkn[]>({
    queryKey: ['admin', 'jenis-kkn', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/jenis-kkn', { params: { per_page: 100 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as JenisKkn[];
    },
    staleTime: 300000,
  });

  const peserta = data?.data ?? [];
  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 25 };

  const resetFilters = () => { setSearch(''); setAngkatan(''); setFakultasId(''); setProdiId(''); setJenisKknId(''); setPeriodeId(''); setAcademicYearId(''); setExternalUniversityId(''); setOriginType(''); setPage(1); };
  const originLabel = (p: Peserta) => (p.mahasiswa?.origin_type === 'external' ? 'Eksternal' : 'Internal');
  const prodiLabel = (p: Peserta) => p.mahasiswa?.origin_type === 'external' ? (p.mahasiswa?.external_prodi_name || '-') : (p.mahasiswa?.prodi?.nama || '-');
  const facultyLabel = (p: Peserta) => p.mahasiswa?.origin_type === 'external' ? (p.mahasiswa?.external_faculty_name || '-') : (p.mahasiswa?.fakultas?.nama || '-');
  const campusLabel = (p: Peserta) => p.mahasiswa?.origin_type === 'external' ? (p.mahasiswa?.external_university?.name || 'Kampus eksternal') : 'UIN Saizu';
  const academicYearLabel = (p: Peserta) => p.periode?.academic_year?.name || p.periode?.academic_year?.tahun || p.periode?.academic_year?.label || p.periode?.tahun_akademik?.name || p.periode?.tahun_akademik?.tahun || p.periode?.tahun_akademik?.label || '-';
  const academicYearOptionLabel = (y: AcademicYear) => y.name || y.tahun || y.academic_year || y.year || y.label || [y.year, y.semester].filter(Boolean).join(' ') || 'Tahun #' + y.id;

  const exportXlsx = async () => {
    try {
      const res = await rawApi.get('/admin/peserta-kkn/export', {
        params: { angkatan: angkatan || undefined, fakultas_id: fakultasId || undefined, prodi_id: prodiId || undefined, jenis_kkn_id: jenisKknId || undefined, periode_id: periodeId || undefined, academic_year_id: academicYearId || undefined, external_university_id: externalUniversityId || undefined, origin_type: originType || undefined, limit: 50000 },
        responseType: 'blob',
      });
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peserta-kkn-${angkatan || 'semua'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export gagal');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peserta KKN"
        subtitle={`Total ${meta.total} peserta aktif.`}
        actions={(
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20">
              <RefreshCcw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={exportXlsx} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20">
              <Download size={14} /> Export
            </button>
          </div>
        )}
      />

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">Filter lengkap peserta final: tahun ajaran, periode, jenis KKN, asal internal/eksternal, fakultas/prodi/kampus.</p>
          <button onClick={resetFilters} className="rounded-lg px-3 py-1.5 text-xs font-black text-cyan-700 ring-1 ring-cyan-100 hover:bg-cyan-50">Reset filter</button>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari NIM/Nama..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
        </div>
          <select value={originType} onChange={e => { setOriginType(e.target.value); setFakultasId(''); setProdiId(''); setExternalUniversityId(''); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Asal</option>
          <option value="internal">Mahasiswa Internal</option>
          <option value="external">Mahasiswa Eksternal</option>
        </select>
          {originType === 'external' && (
          <select value={externalUniversityId} onChange={e => { setExternalUniversityId(e.target.value); setPage(1); }} className="h-10 min-w-[240px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
            <option value="">Semua Kampus Eksternal</option>
            {externalUniversities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
          {originType === 'internal' && (
          <>
            <select value={fakultasId} onChange={e => { setFakultasId(e.target.value); setProdiId(''); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
              <option value="">Semua Fakultas</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
            </select>
            <select value={prodiId} onChange={e => { setProdiId(e.target.value); setPage(1); }} className="h-10 min-w-[240px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
              <option value="">Semua Prodi</option>
              {prodiOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </>
        )}
          <select value={jenisKknId} onChange={e => { setJenisKknId(e.target.value); setPeriodeId(''); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Jenis KKN</option>
          {jenisKknOptions.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
          <select value={academicYearId} onChange={e => { setAcademicYearId(e.target.value); setPeriodeId(''); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          {academicYears.map((y) => <option key={y.id} value={y.id}>{academicYearOptionLabel(y)}</option>)}
        </select>
          <select value={periodeId} onChange={e => { setPeriodeId(e.target.value); setPage(1); }} className="h-10 min-w-[240px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          {periodOptions.map((p) => <option key={p.id} value={p.id}>{p.name || 'Periode #' + p.id}</option>)}
        </select>
          <select value={angkatan} onChange={e => { setAngkatan(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="58">Angkatan 58</option>
          <option value="59">Angkatan 59</option>
        </select>
        </div>
      </div>

      {/* Table */}
      {isError ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-rose-100">
          <p className="text-sm font-bold text-rose-600">Gagal memuat peserta KKN.</p>
          <button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Coba lagi</button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : peserta.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada peserta KKN ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Peserta</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Asal / Profil</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Tahun / Periode</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Jenis KKN</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Kelompok</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Role</th>
              </tr>
            </thead>
            <tbody>
              {peserta.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{(meta.current_page - 1) * meta.per_page + i + 1}</td>
                  <td className="px-4 py-3"><p className="font-black text-slate-800">{p.mahasiswa?.nama ?? '-'}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{p.mahasiswa?.nim || p.mahasiswa?.external_nim || '-'}</p></td>
                  <td className="px-4 py-3 text-xs text-slate-600"><span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${p.mahasiswa?.origin_type === 'external' ? 'bg-violet-50 text-violet-700' : 'bg-cyan-50 text-cyan-700'}`}>{originLabel(p)}</span><p className="font-bold text-slate-700">{campusLabel(p)}</p><p>{facultyLabel(p)} • {prodiLabel(p)}</p></td>
                  <td className="px-4 py-3 text-xs text-slate-600"><p className="font-bold text-slate-700">{academicYearLabel(p)}</p><p>{p.periode?.name ?? '-'}</p><p className="text-[10px] text-slate-400">Angkatan {p.periode?.periode ?? '-'}</p></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.periode?.jenis_kkn?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{p.kelompok?.code ?? <span className="text-slate-400">Belum</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_LABELS[p.status]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{p.role ?? 'Anggota'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
          <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page}</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
