'use client';

import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { Download, Loader2, Search, Users, Plus, Upload, ChevronLeft, ChevronRight, X, FileUp, Building2, MapPin } from 'lucide-react';
import { useState, useRef } from 'react';

type Periode = { id: number; name?: string; periode?: number; is_active?: boolean };
type Batch = { id: number; home_university: string; program_name?: string; target_regency?: string|null; students_count?: number; periode?: Periode; letter_number?: string|null; letter_date?: string|null; expected_participants?: number|null };
type Row = { id: number; external_nim: string; home_university: string; external_faculty?: string|null; external_study_program?: string|null; mahasiswa?: { nama?: string; nim?: string; phone?: string|null; user?: { username?: string }; peserta?: Array<{ status: string; kelompok?: { nama_kelompok?: string; lokasi?: { regency_name?: string } } }> } };
type Paginated<T> = { data?: T[]; current_page?: number; per_page?: number; total?: number; last_page?: number };
type ImportPreviewRow = { row: number; nama: string; nim: string; kampus_asal?: string; fakultas_asal?: string|null; prodi_asal?: string|null; valid: boolean; errors?: string[] };
type ImportPreview = { rows: ImportPreviewRow[]; total_rows: number; valid_rows: number; invalid_rows: number };

function unwrap<T>(res: unknown): T {
  const body = typeof res === 'object' && res !== null && 'data' in res ? (res as { data?: unknown }).data : res;
  return (typeof body === 'object' && body !== null && 'data' in body ? (body as { data?: unknown }).data : body) as T;
}
function asArray<T>(v: T[] | Paginated<T> | null | undefined): T[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  return [];
}

export default function PesertaEksternalPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number|null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview|null>(null);
  const [toast, setToast] = useState<{ type: 'ok'|'err'; msg: string }|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLInputElement>(null);

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>|null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
    setTimer(t);
  };

  // Fetch periodes for batch form
  const periodesQ = useQuery<Periode[]>({
    queryKey: ['periodes-list', 'active-only'],
    queryFn: async () => {
      const rows = unwrap<Periode[]>(await rawApi.get('/admin/periode', { params: { active: 1, per_page: 200 } }));
      return (rows ?? []).filter((p) => p.is_active === true);
    },
    staleTime: 60000,
  });

  // Batches
  const batchesQ = useQuery<Batch[]>({
    queryKey: ['external-batches', 'active-only'],
    queryFn: async () => asArray<Batch>(unwrap(await rawApi.get('/admin/peserta-eksternal/batches'))),
    placeholderData: [],
  });

  // Participants with pagination
  const listQ = useQuery({
    queryKey: ['external-participants', debouncedSearch, page],
    queryFn: async () => {
      const params: Record<string, string|number> = { page, per_page: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await rawApi.get('/admin/peserta-eksternal', { params });
      return unwrap<Paginated<Row>>(res);
    },
    placeholderData: keepPreviousData,
  });

  const batches = batchesQ.data ?? [];
  const pagination: Paginated<Row> = listQ.data ?? { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1 };
  const rows: Row[] = Array.isArray(pagination.data) ? pagination.data : [];
  const totalParticipants = batches.reduce((sum, b) => sum + (b.students_count ?? 0), 0);
  const hasError = batchesQ.isError || listQ.isError;

  // Create batch mutation
  const createBatchM = useMutation({
    mutationFn: async (fd: FormData) => {
      await rawApi.post('/admin/peserta-eksternal/batches', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-batches'] });
      setShowBatchModal(false);
      setToast({ type: 'ok', msg: 'Batch berhasil dibuat!' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => {
      setToast({ type: 'err', msg: 'Gagal membuat batch: ' + (e.message || 'Unknown error') });
      setTimeout(() => setToast(null), 5000);
    },
  });

  // Import mutation
  const importM = useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await rawApi.post('/admin/peserta-eksternal/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: (data) => {
      // Preview only: no DB write, no close before review.
      const d = data?.data ?? data;
      setImportPreview(d as ImportPreview);
      setToast({ type: 'ok', msg: `Preview berhasil: ${d?.valid_rows ?? 0}/${d?.total_rows ?? 0} baris valid. Periksa lalu klik Import Final.` });
      setTimeout(() => setToast(null), 5000);
    },
    onError: (e: Error) => {
      setToast({ type: 'err', msg: 'Gagal import: ' + (e.message || 'Unknown error') });
      setTimeout(() => setToast(null), 5000);
    },
  });

  const confirmImportM = useMutation({
    mutationFn: async () => {
      const res = await rawApi.post('/admin/peserta-eksternal/import/confirm', { batch_id: selectedBatchId, rows: importPreview?.rows ?? [] });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['external-batches'] });
      queryClient.invalidateQueries({ queryKey: ['external-participants'] });
      setShowImportModal(false);
      setSelectedBatchId(null);
      setImportPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      const d = data?.data ?? data;
      setToast({ type: 'ok', msg: `Import selesai! ${d?.created ?? 0} ditambah, ${d?.skipped ?? 0} dilewati.` });
      setTimeout(() => setToast(null), 5000);
    },
    onError: (e: Error) => {
      setToast({ type: 'err', msg: 'Gagal import final: ' + (e.message || 'Unknown error') });
      setTimeout(() => setToast(null), 5000);
    },
  });

  const handleCreateBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    createBatchM.mutate(fd);
  };

  const handleImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    const fd = new FormData();
    fd.append('batch_id', String(selectedBatchId));
    const file = fileRef.current?.files?.[0];
    if (file) fd.append('file', file);
    importM.mutate(fd);
  };

  return <main className="space-y-6 p-1">
    {/* Toast */}
    {toast && (
      <div className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 ${toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-800 ring-rose-200'}`}>
        {toast.msg}
      </div>
    )}

    {/* Header */}
    <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">KKN Reguler</p>
      <h1 className="mt-2 text-2xl font-black">Peserta Eksternal</h1>
      <p className="mt-1 text-sm text-cyan-50">Import mahasiswa mitra/kolaborasi sebagai peserta KKN Reguler.</p>
    </div>

    {hasError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Sebagian data belum bisa dimuat. Cek akses role admin/API, lalu refresh.</div>}

    {/* Stats */}
    <section className="grid gap-4 md:grid-cols-3">
      <div className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Peserta</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">{totalParticipants}</h2>
        <p className="mt-1 text-sm text-slate-500">Dari {batches.length} batch kampus</p>
      </div>
      {batches.slice(0, 5).map(b => <div key={b.id} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Batch Kampus</p>
        <h2 className="mt-1 font-bold text-slate-900">{b.home_university}</h2>
        <p className="mt-1 text-sm text-slate-500">{b.target_regency ?? 'Target belum diisi'} · {b.students_count ?? 0} peserta</p>
      </div>)}
    </section>

    {/* Table + toolbar */}
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50 p-4">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Users size={18}/> Daftar Peserta Eksternal {listQ.isFetching && <Loader2 size={14} className="animate-spin text-slate-400" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e)=>handleSearch(e.target.value)} placeholder="Cari nama/NIM/kampus" className="w-56 rounded-xl border border-slate-200 bg-white/80 py-2 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
          </label>
          <button onClick={() => setShowBatchModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-lg">
            <Plus size={14}/> Buat Batch
          </button>
          <button onClick={() => setShowImportModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-cyan-500 hover:shadow-lg">
            <Upload size={14}/> Import Dokumen
          </button>
          <a className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg" href="/api/v1/admin/peserta-eksternal/export">
            <Download size={14}/> Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3 text-center">No</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NIM Asal</th>
              <th className="px-4 py-3">Kampus</th>
              <th className="px-4 py-3">Fak/Prodi Asal</th>
              <th className="px-4 py-3">Kelompok</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>{listQ.isFetching ? 'Memuat...' : 'Tidak ada data ditemukan.'}</td></tr>
            ) : rows.map((r, idx) => {
              const p = r.mahasiswa?.peserta?.[0];
              const rowNum = ((pagination.current_page ?? 1) - 1) * (pagination.per_page ?? 15) + idx + 1;
              return <tr key={r.id} className="border-t transition-colors hover:bg-cyan-50/40">
                <td className="px-4 py-3 text-center text-slate-500">{rowNum}</td>
                <td className="px-4 py-3 font-medium">{r.mahasiswa?.nama ?? '-'}</td>
                <td className="px-4 py-3">{r.external_nim}</td>
                <td className="px-4 py-3">{r.home_university}</td>
                <td className="px-4 py-3">{r.external_faculty ?? '-'} / {r.external_study_program ?? '-'}</td>
                <td className="px-4 py-3">{p?.kelompok?.nama_kelompok ?? 'Belum ditempatkan'} {p?.kelompok?.lokasi?.regency_name ? `(${p.kelompok.lokasi.regency_name})` : ''}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page && pagination.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Menampilkan {((pagination.current_page ?? 1) - 1) * (pagination.per_page ?? 15) + 1}–{Math.min((pagination.current_page ?? 1) * (pagination.per_page ?? 15), pagination.total ?? 0)} dari {(pagination.total ?? 0).toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {(() => {
              const pages: number[] = [];
              const lp = pagination.last_page ?? 1;
              const cp = pagination.current_page ?? 1;
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
                  <button key={p} onClick={() => setPage(p)} className={`h-8 min-w-[2rem] rounded-lg text-xs font-medium transition-colors ${p === cp ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {p}
                  </button>
                )
              );
            })()}
            <button onClick={() => setPage(Math.min(pagination.last_page ?? 1, page + 1))} disabled={page >= (pagination.last_page ?? 1)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>

    {/* Create Batch Modal */}
    {showBatchModal && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowBatchModal(false); }}>
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900">Buat Batch Baru</h2>
            <button onClick={() => setShowBatchModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
          </div>
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Periode KKN *</label>
              <select name="periode_id" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
                <option value="">Pilih periode aktif...</option>
                {(periodesQ.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name ?? `Periode ${p.periode}`}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Kampus Asal *</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input name="home_university" required placeholder="Universitas..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Program</label>
                <input name="program_name" defaultValue="KKN Kolaborasi PTKIN" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Target Kabupaten</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input name="target_regency" placeholder="Kabupaten..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">No. Surat</label>
                <input name="letter_number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Tgl Surat</label>
                <input name="letter_date" type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Jumlah Peserta</label>
                <input name="expected_participants" type="number" min={1} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">File Surat (PDF/Gambar)</label>
                <input ref={letterRef} name="letter_file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-cyan-700" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Catatan</label>
              <textarea name="notes" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowBatchModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Batal</button>
              <button type="submit" disabled={createBatchM.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-50">
                {createBatchM.isPending ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                {createBatchM.isPending ? 'Menyimpan...' : 'Simpan Batch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Import Dokumen Modal */}
    {showImportModal && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false); }}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900">Import Peserta - Preview Wajib</h2>
            <button onClick={() => { setShowImportModal(false); setSelectedBatchId(null); setImportPreview(null); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
          </div>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Batch *</label>
              <select value={selectedBatchId ?? ''} onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : null)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
                <option value="">Pilih batch...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.home_university} ({b.students_count ?? 0} peserta)</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">File PDF/XLSX/CSV/Gambar *</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.txt" required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-cyan-700" />
              <p className="mt-1 text-xs text-slate-400">Semua file wajib preview dulu. PDF/OCR/XLSX/CSV didukung backend.</p>
              <a href="/api/v1/admin/peserta-eksternal/template" className="mt-1 inline-block text-xs font-bold text-cyan-600 hover:underline">Download template CSV</a>
            </div>
            {importPreview && <div className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><b>Preview: {importPreview.valid_rows}/{importPreview.total_rows} valid</b>{importPreview.rows.slice(0,20).map(r => <div key={r.row} className="border-t py-1">{r.nama || '-'} - {r.nim || '-'} - {r.valid ? 'OK' : (r.errors?.join(', ') || 'Invalid')}</div>)}</div>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowImportModal(false); setSelectedBatchId(null); setImportPreview(null); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Batal</button>
              <button type="submit" disabled={importM.isPending || !selectedBatchId} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-cyan-500 disabled:opacity-50">
                {importM.isPending ? <Loader2 size={14} className="animate-spin"/> : <FileUp size={14}/>}
                {importM.isPending ? 'Membaca...' : 'Preview'}
              </button>
              <button type="button" onClick={() => confirmImportM.mutate()} disabled={!importPreview || importPreview.valid_rows === 0 || confirmImportM.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-50">
                {confirmImportM.isPending ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                Import Final
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </main>;
}
