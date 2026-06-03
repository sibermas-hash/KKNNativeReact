'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2,
  MapPin,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

type Lokasi = {
  id: number;
  province_id?: number | null;
  regency_id?: number | null;
  district_id?: number | null;
  regency_name?: string | null;
  district_name?: string | null;
  village_code?: string | null;
  village_name?: string | null;
  full_name?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  capacity?: number | null;
  is_selected_for_kkn?: boolean;
  fakultas_id?: number | null;
  faculty?: { id: number; name?: string; nama?: string } | null;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type Fakultas = { id: number; name?: string; nama?: string };

type LokasiForm = {
  village_name: string;
  district_name: string;
  regency_name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  fakultas_id: string;
};

const EMPTY_FORM: LokasiForm = {
  village_name: '',
  district_name: '',
  regency_name: '',
  address: '',
  latitude: '',
  longitude: '',
  capacity: '',
  fakultas_id: '',
};


export default function AdminLokasiPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterRegency, setFilterRegency] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lokasi | null>(null);
  const [form, setForm] = useState<LokasiForm>(EMPTY_FORM);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openRegencies, setOpenRegencies] = useState<Set<string>>(new Set());
  const [openDistricts, setOpenDistricts] = useState<Set<string>>(new Set());


  const list = useQuery({
    queryKey: ['admin', 'lokasi', { page, perPage, search }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 9999 };
      if (search) params.search = search;
      const res = await rawApi.get('/admin/lokasi', { params });
      const body = res.data as { data?: Lokasi[]; meta?: Pagination };
      return { data: body.data ?? [], meta: body.meta };
    },
  });

  const stats = useQuery({
    queryKey: ['admin', 'lokasi', 'stats'],
    queryFn: async () => {
      // Pull all locations once for stats by fetching biggest page
      const res = await rawApi.get('/admin/lokasi', { params: { per_page: 9999 } });
      const body = res.data as { data?: Lokasi[]; meta?: Pagination };
      const items = body.data ?? [];
      const byRegency: Record<string, number> = {};
      const districtSet: Record<string, Set<string>> = {};
      let withCoord = 0;
      let withCapacity = 0;
      let selectedDesa = 0;
      let selectedCapacity = 0;
      items.forEach((l) => {
        const r = l.regency_name ?? 'Unknown';
        byRegency[r] = (byRegency[r] ?? 0) + 1;
        if (!districtSet[r]) districtSet[r] = new Set();
        if (l.district_name) districtSet[r].add(l.district_name);
        if (l.latitude && l.longitude) withCoord++;
        if ((l.capacity ?? 0) > 0) withCapacity++;
        if (l.is_selected_for_kkn) { selectedDesa++; selectedCapacity += l.capacity ?? 0; }
      });
      return {
        total: body.meta?.total ?? items.length,
        byRegency,
        kecamatanByRegency: Object.fromEntries(Object.entries(districtSet).map(([k, v]) => [k, v.size])),
        regencyCount: Object.keys(byRegency).length,
        withCoord,
        withCapacity,
        selectedDesa,
        selectedCapacity,
        all: items,
      };
    },
  });

  const jenisRegularQ = useQuery({
    queryKey: ['admin', 'jenis-kkn', 'regular-id'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/jenis-kkn');
      const body = (res.data as { data?: unknown }).data ?? res.data;
      const arr = Array.isArray(body) ? body : ((body as { data?: unknown[] })?.data ?? []);
      const found = (arr as Array<{ id: number; code?: string; name?: string }>).find(j => `${j.code ?? ''} ${j.name ?? ''}`.toLowerCase().includes('reguler'));
      return found?.id ?? null;
    },
  });

  const pesertaRealtime = useQuery({
    queryKey: ['admin', 'peserta-kkn', 'regular-capacity-live', jenisRegularQ.data],
    queryFn: async () => {
      const params: Record<string, number> = { per_page: 1 }; if (jenisRegularQ.data) params.jenis_kkn_id = jenisRegularQ.data; const res = await rawApi.get('/admin/peserta-kkn', { params });
      const body = res.data as { data?: { meta?: { total?: number } }; meta?: { total?: number } };
      return Number(body.data?.meta?.total ?? body.meta?.total ?? 0);
    },
    enabled: jenisRegularQ.isSuccess,
    refetchInterval: 10000,
  });

  const fakultas = useQuery({
    queryKey: ['admin', 'fakultas-options'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas', { params: { per_page: 100 } });
      const body = res.data as { data?: Fakultas[] };
      return body.data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        village_name: form.village_name,
        district_name: form.district_name || null,
        regency_name: form.regency_name || null,
        address: form.address || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null,
      };
      if (editing) {
        const res = await rawApi.put(`/admin/lokasi/${editing.id}`, payload);
        return res.data;
      }
      const res = await rawApi.post('/admin/lokasi', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(editing ? 'Lokasi diperbarui' : 'Lokasi ditambahkan');
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['admin', 'lokasi'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = err.response?.data?.message ?? 'Gagal menyimpan';
      toast.error(msg);
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const res = await rawApi.delete(`/admin/lokasi/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lokasi dihapus');
      qc.invalidateQueries({ queryKey: ['admin', 'lokasi'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Gagal menghapus');
    },
  });

  const items = list.data?.data ?? [];

  useEffect(() => {
    setSelected(new Set(items.filter((l) => l.is_selected_for_kkn).map((l) => l.id)));
  }, [items]);
  const meta = list.data?.meta;

  const filtered = useMemo(() => {
    if (!filterRegency) return items;
    return items.filter((l) => l.regency_name === filterRegency);
  }, [items, filterRegency]);

  const regencies = useMemo(() => Object.keys(stats.data?.byRegency ?? {}).sort(), [stats.data]);

  const tree = useMemo(() => {
    const root: Record<string, Record<string, Lokasi[]>> = {};
    filtered.forEach((l) => { const r = l.regency_name ?? 'Tanpa Kabupaten'; const d = l.district_name ?? 'Tanpa Kecamatan'; (root[r] ??= {}); (root[r][d] ??= []).push(l); });
    Object.values(root).forEach(ds => Object.values(ds).forEach(vs => vs.sort((a,b)=>(a.village_name ?? '').localeCompare(b.village_name ?? ''))));
    return root;
  }, [filtered]);
  const setMany = (ids: number[], checked: boolean) => {
    setSelected(prev => { const next = new Set(prev); ids.forEach(id => checked ? next.add(id) : next.delete(id)); return next; });
    rawApi.post('/admin/lokasi/selection', { ids, is_selected_for_kkn: checked })
      .then(() => { qc.invalidateQueries({ queryKey: ['admin', 'lokasi'] }); toast.success(checked ? 'Lokasi dipilih untuk KKN' : 'Lokasi dinonaktifkan dari KKN'); })
      .catch(() => { toast.error('Gagal menyimpan pilihan lokasi'); qc.invalidateQueries({ queryKey: ['admin', 'lokasi'] }); });
  };
  const stateOf = (ids: number[]) => ({ checked: ids.length > 0 && ids.every(id => selected.has(id)), partial: ids.some(id => selected.has(id)) && !ids.every(id => selected.has(id)) });
  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => setter(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const allRegencyKeys = Object.keys(tree);
  const allDistrictKeys = Object.entries(tree).flatMap(([r, ds]) => Object.keys(ds).map((d) => `${r}|${d}`));
  const expandAll = () => { setOpenRegencies(new Set(allRegencyKeys)); setOpenDistricts(new Set(allDistrictKeys)); };
  const collapseAll = () => { setOpenRegencies(new Set()); setOpenDistricts(new Set()); };
  const selectedCapacity = filtered.reduce((sum, l) => sum + (selected.has(l.id) ? (l.capacity ?? 0) : 0), 0);
  const maxGroups = selected.size;
  const totalPesertaRealtime = pesertaRealtime.data ?? 0;
  const kebutuhanKelompok = Math.ceil(totalPesertaRealtime / 15);
  const kurangKelompok = Math.max(0, kebutuhanKelompok - maxGroups);
  const kurangMahasiswa = Math.max(0, totalPesertaRealtime - selectedCapacity);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (l: Lokasi) => {
    setEditing(l);
    setForm({
      village_name: l.village_name ?? '',
      district_name: l.district_name ?? '',
      regency_name: l.regency_name ?? '',
      address: l.address ?? '',
      latitude: l.latitude != null ? String(l.latitude) : '',
      longitude: l.longitude != null ? String(l.longitude) : '',
      capacity: l.capacity != null ? String(l.capacity) : '',
      fakultas_id: l.fakultas_id != null ? String(l.fakultas_id) : '',
    });
    setShowForm(true);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const exportCsv = () => {
    const source = stats.data?.all ?? [];
    const all = filterRegency ? source.filter((l) => l.regency_name === filterRegency) : source;
    if (!all.length) {
      toast.error('Data belum tersedia');
      return;
    }
    const headers = ['id', 'diceklist', 'village_name', 'district_name', 'regency_name', 'address', 'latitude', 'longitude', 'capacity', 'fakultas'];
    const rows = all.map((l) => [
      l.id,
      l.is_selected_for_kkn ? 'YA' : 'TIDAK',
      l.village_name ?? '',
      l.district_name ?? '',
      l.regency_name ?? '',
      (l.address ?? '').replace(/\n/g, ' '),
      l.latitude ?? '',
      l.longitude ?? '',
      l.capacity ?? '',
      l.faculty?.nama ?? l.faculty?.name ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = filterRegency ? filterRegency.toLowerCase().replace(/\s+/g, '-') : 'semua-kabupaten';
    a.download = `lokasi-kkn-reguler-${suffix}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${all.length} lokasi diexport${filterRegency ? ' untuk ' + filterRegency : ''}`);
  };

  return (
    <div className="space-y-6 p-6" data-app-version="20260602">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900">Wilayah Penugasan KKN</h1>
          <p className="text-sm text-slate-500">
            Master data lokasi untuk penempatan KKN. {selected.size} desa dipilih · estimasi {selectedCapacity} mahasiswa · maksimal {maxGroups} kelompok.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!stats.data}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV {filterRegency ? filterRegency : 'Semua Kabupaten'}
          </button>
          <button onClick={openCreate} className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-bold text-white flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah Lokasi
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"><b>Wilayah Reguler.</b> Halaman ini khusus checklist desa kandidat untuk KKN Reguler dan plotting otomatis.</div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Desa" value={stats.data?.total ?? 0} />
        <StatCard label="Kabupaten" value={stats.data?.regencyCount ?? 0} />
        <StatCard label="Desa Diceklist" value={stats.data?.selectedDesa ?? 0} color={(stats.data?.selectedDesa ?? 0) === 0 ? 'amber' : 'emerald'} />
        <StatCard label="Estimasi Mahasiswa" value={stats.data?.selectedCapacity ?? 0} color={(stats.data?.selectedCapacity ?? 0) === 0 ? 'amber' : 'emerald'} />
        <StatCard label="Kurang Kelompok" value={kurangKelompok} color={kurangKelompok > 0 ? 'rose' : 'emerald'} />
        <StatCard label="Mahasiswa Belum Tertampung" value={kurangMahasiswa} color={kurangMahasiswa > 0 ? 'rose' : 'emerald'} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">
        <p className="text-xs text-slate-500">Realtime tiap 10 detik. Acuan: {totalPesertaRealtime.toLocaleString('id-ID')} peserta final · kebutuhan kelompok @15 mahasiswa/kelompok: {kebutuhanKelompok.toLocaleString('id-ID')}.</p>
        {selected.size > 0 && kurangKelompok === 0 && kurangMahasiswa === 0 ? (
          <a href="/admin/plotting-otomatis?jenis_kkn=reguler" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700">Lanjut Plotting Otomatis →</a>
        ) : (
          <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Lengkapi checklist sampai kekurangan = 0 untuk lanjut plotting.</span>
        )}
      </div>

      {/* Per-regency cards */}
      {stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats.data.byRegency)
            .sort(([, a], [, b]) => b - a)
            .map(([reg, count]) => (
              <button
                key={reg}
                onClick={() => {
                  setFilterRegency(filterRegency === reg ? '' : reg);
                  setPage(1);
                }}
                className={
                  'rounded-xl border p-3 text-left transition ' +
                  (filterRegency === reg
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white hover:border-teal-300')
                }
              >
                <p className="text-xs font-bold uppercase text-slate-500 truncate">{reg}</p>
                <p className="text-2xl font-black text-teal-700 mt-1">{count}</p>
                <p className="text-[10px] text-slate-500">
                  {stats.data?.kecamatanByRegency?.[reg] ?? 0} kecamatan
                </p>
              </button>
            ))}
        </div>
      )}

      {/* Filter + search */}
      <p className="text-xs text-slate-500">Export mengikuti filter kabupaten. Pilih kabupaten dulu untuk cek per-kabupaten.</p>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={submitSearch} className="flex gap-2 flex-1 min-w-72">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm"
              placeholder="Cari nama desa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
              className="h-10 rounded-lg border px-3 text-sm text-slate-600"
            >
              Reset
            </button>
          )}
        </form>
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          value={filterRegency}
          onChange={(e) => {
            setFilterRegency(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Kabupaten</option>
          {regencies.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={25}>25/page</option>
          <option value={50}>50/page</option>
          <option value={100}>100/page</option>
        </select>
        {(stats.data?.withCoord ?? 0) === 0 && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠ Semua lokasi belum punya koordinat lat/lng
          </span>
        )}
      </div>

      {/* Tree checklist */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
          <div><h2 className="font-black text-slate-900">Checklist Wilayah</h2><p className="text-xs text-slate-500">Kabupaten → Kecamatan → Desa. Terpilih: {selected.size} desa · estimasi {selectedCapacity} mahasiswa · max {maxGroups} kelompok.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={expandAll} className="rounded border bg-white px-3 py-1.5 text-xs font-bold text-slate-600">Expand All</button><button onClick={collapseAll} className="rounded border bg-white px-3 py-1.5 text-xs font-bold text-slate-600">Collapse All</button><button onClick={() => setMany(filtered.map((l) => l.id), false)} className="rounded border bg-white px-3 py-1.5 text-xs font-bold text-rose-600">Clear All</button></div>
        </div>
        {list.isLoading ? <div className="p-8 text-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Memuat...</div> : (
          <div className="divide-y">
            {Object.entries(tree).sort(([a], [b]) => a.localeCompare(b)).map(([reg, districts]) => {
              const regVillages = Object.values(districts).flat(); const regIds = regVillages.map(v => v.id); const regState = stateOf(regIds); const regOpen = openRegencies.has(reg);
              return <div key={reg}>
                <div className="flex items-center gap-3 bg-teal-50/60 px-4 py-3">
                  <button onClick={() => toggleSet(setOpenRegencies, reg)} className="rounded p-1 hover:bg-white">{regOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                  <input type="checkbox" checked={regState.checked} ref={(el) => { if (el) el.indeterminate = regState.partial; }} onChange={(e) => setMany(regIds, e.target.checked)} className="h-4 w-4" />
                  <div className="flex-1"><div className="font-black text-teal-900">{reg}</div><div className="text-xs text-teal-700">{Object.keys(districts).length} kecamatan · {regVillages.length} desa · {regIds.filter(id => selected.has(id)).length} dipilih</div></div>
                </div>
                {regOpen && <div className="pl-8">{Object.entries(districts).sort(([a], [b]) => a.localeCompare(b)).map(([dist, villages]) => {
                  const key = `${reg}|${dist}`; const ids = villages.map(v => v.id); const st = stateOf(ids); const open = openDistricts.has(key);
                  return <div key={key} className="border-t"><div className="flex items-center gap-3 px-4 py-2 bg-slate-50">
                    <button onClick={() => toggleSet(setOpenDistricts, key)} className="rounded p-1 hover:bg-white">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                    <input type="checkbox" checked={st.checked} ref={(el) => { if (el) el.indeterminate = st.partial; }} onChange={(e) => setMany(ids, e.target.checked)} className="h-4 w-4" />
                    <div className="flex-1 font-bold text-slate-800">{dist}</div><span className="text-xs text-slate-500">{ids.filter(id => selected.has(id)).length}/{villages.length} desa</span></div>
                    {open && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-3 pl-12">{villages.map((l) => <label key={l.id} className="flex items-center gap-2 rounded border border-slate-100 px-2 py-1.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={selected.has(l.id)} onChange={(e) => setMany([l.id], e.target.checked)} className="h-4 w-4" /><span className="flex-1 truncate">{l.village_name ?? '-'}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{l.capacity ?? 0} mhs</span><button type="button" onClick={() => openEdit(l)} className="text-xs font-bold text-teal-700 hover:underline">Edit</button></label>)}</div>}
                  </div>;
                })}</div>}
              </div>;
            })}
          </div>
        )}
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-black text-lg">{editing ? 'Edit Lokasi' : 'Tambah Lokasi'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Nama Desa *">
                  <input
                    required
                    value={form.village_name}
                    onChange={(e) => setForm({ ...form, village_name: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                  />
                </Field>
                <Field label="Kecamatan">
                  <input
                    value={form.district_name}
                    onChange={(e) => setForm({ ...form, district_name: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                  />
                </Field>
                <Field label="Kabupaten">
                  <input
                    list="regency-list"
                    value={form.regency_name}
                    onChange={(e) => setForm({ ...form, regency_name: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                  />
                  <datalist id="regency-list">
                    {regencies.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </Field>
              </div>
              <Field label="Alamat Lengkap">
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Latitude">
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    placeholder="-7.4225"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    placeholder="109.2422"
                  />
                </Field>
                <Field label="Kapasitas (mahasiswa)">
                  <input
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    placeholder="15"
                  />
                </Field>
              </div>
              <Field label="Fakultas (opsional - untuk KKN khusus fakultas)">
                <select
                  value={form.fakultas_id}
                  onChange={(e) => setForm({ ...form, fakultas_id: e.target.value })}
                  className="h-10 w-full rounded-lg border px-3 text-sm"
                >
                  <option value="">— Umum (semua fakultas) —</option>
                  {(fakultas.data ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nama ?? f.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-10 rounded-lg border px-4 text-sm font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'slate' }: { label: string; value: number; color?: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const cl =
    color === 'emerald'
      ? 'text-emerald-700'
      : color === 'amber'
      ? 'text-amber-700'
      : color === 'rose'
      ? 'text-rose-700'
      : 'text-slate-900';
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
      <p className={'text-2xl font-black ' + cl}>{value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}