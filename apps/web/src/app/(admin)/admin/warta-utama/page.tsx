'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Eye, Megaphone, Newspaper, Pin, Power, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminApi, rawApi } from '@/lib/api';
import { ConfirmDialog, PageHeader } from '@/components/ui/shared';

/**
 * Admin — Warta Utama (Berita + Pengumuman).
 *
 * Halaman ini punya 2 mode konten yang dipisah via tab:
 *
 *   • BERITA      — artikel/agenda/press-release/kemitraan/pedoman.
 *                   Form lengkap: kategori, excerpt, konten, gambar,
 *                   optional juga ditampilkan sebagai popup.
 *
 *   • PENGUMUMAN  — info formal singkat yang selalu muncul sebagai popup
 *                   di home publik. Form ringkas: judul + pesan + (opsional)
 *                   gambar + popup settings. Tidak perlu kategori atau
 *                   excerpt — kategori otomatis "PENGUMUMAN" dan excerpt
 *                   diambil dari konten.
 *
 * Backend: keduanya disimpan di tabel yang sama (`announcements`).
 * Pembedanya adalah `category`:
 *   - PENGUMUMAN      → content_type = 'pengumuman'
 *   - selainnya       → content_type = 'berita'
 *
 * Lihat App\Models\KKN\Announcement::TYPE_* constants.
 */

// Kategori untuk berita — PENGUMUMAN dibuang karena dialokasikan ke tab
// Pengumuman. Harus sinkron dengan Announcement::TYPE_BERITA_CATEGORIES.
const BERITA_CATEGORY_OPTIONS = ['BERITA', 'AGENDA', 'PEDOMAN', 'PRESS RELEASE', 'KEMITRAAN'] as const;
type BeritaCategory = (typeof BERITA_CATEGORY_OPTIONS)[number];

type ContentTab = 'berita' | 'pengumuman';

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  category?: string;
  content_type?: ContentTab;
  content?: string;
  excerpt?: string;
  image_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  is_active: boolean;
  show_as_popup: boolean;
  popup_until?: string | null;
  popup_dismissable: boolean;
  published_at?: string | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface AnnouncementsEnvelope {
  data: Announcement[];
  meta?: PaginationMeta;
}

type StatusFilter = 'all' | 'active' | 'draft' | 'popup';

/** Form state unified — sebagian field hanya dipakai di mode tertentu. */
interface FormState {
  title: string;
  content: string;
  excerpt: string;
  category: BeritaCategory; // hanya relevan untuk mode 'berita'
  show_as_popup: boolean;   // hanya relevan untuk mode 'berita'; 'pengumuman' selalu true
  popup_until: string;
  popup_dismissable: boolean;
  is_active: boolean;
  image_file: File | null;
  remove_image: boolean;
}

const INITIAL_FORM: FormState = {
  title: '',
  content: '',
  excerpt: '',
  category: 'BERITA',
  show_as_popup: false,
  popup_until: '',
  popup_dismissable: true,
  is_active: true,
  image_file: null,
  remove_image: false,
};

const EMPTY_ANNOUNCEMENTS: Announcement[] = [];

export default function WartaUtamaPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ContentTab>('berita');

  // Form state + mode. mode berbeda dengan activeTab hanya saat editing item
  // dari tab lain (rare) — secara umum mode mengikuti tab aktif saat create.
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<ContentTab>('berita');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BeritaCategory | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const previewImageUrl = useMemo(
    () => (form.image_file ? URL.createObjectURL(form.image_file) : null),
    [form.image_file],
  );

  useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, category, status]);

  const { data, isLoading, isFetching } = useQuery<AnnouncementsEnvelope>({
    queryKey: ['admin', 'announcements', activeTab, page, search, category, status],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { type: activeTab, page };
      if (search.trim()) params.search = search.trim();
      if (activeTab === 'berita' && category !== 'all') params.category = category;
      if (status === 'active') params.is_active = true;
      if (status === 'draft') params.is_active = false;
      const res = await rawApi.get('/admin/warta-utama', { params });
      const envelope = res.data as { data?: Announcement[]; meta?: PaginationMeta };
      const rows = envelope.data ?? [];
      return {
        data: status === 'popup' ? rows.filter((item) => item.show_as_popup) : rows,
        meta: envelope.meta,
      };
    },
  });

  const announcements = data?.data ?? EMPTY_ANNOUNCEMENTS;
  const pagination = data?.meta;
  const visibleStats = useMemo(() => {
    const total = pagination?.total ?? announcements.length;
    const active = announcements.filter((item) => item.is_active).length;
    const popup = announcements.filter((item) => item.show_as_popup).length;
    const draft = announcements.filter((item) => !item.is_active).length;
    return { total, active, popup, draft };
  }, [announcements, pagination?.total]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = (mode: ContentTab) => {
    setFormMode(mode);
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      // Untuk pengumuman, popup selalu ON
      show_as_popup: mode === 'pengumuman',
    });
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    const mode: ContentTab = a.content_type ?? (a.category === 'PENGUMUMAN' ? 'pengumuman' : 'berita');
    setFormMode(mode);
    setEditingId(a.id);
    const catUpper = (a.category ?? '').toUpperCase();
    const cat: BeritaCategory = (BERITA_CATEGORY_OPTIONS as readonly string[]).includes(catUpper)
      ? (catUpper as BeritaCategory)
      : 'BERITA';
    setForm({
      title: a.title ?? '',
      content: a.content ?? '',
      excerpt: a.excerpt ?? '',
      category: cat,
      show_as_popup: mode === 'pengumuman' ? true : !!a.show_as_popup,
      popup_until: a.popup_until ? a.popup_until.slice(0, 16) : '',
      popup_dismissable: a.popup_dismissable !== false,
      is_active: a.is_active !== false,
      image_file: null,
      remove_image: false,
    });
    setShowForm(true);
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('content', form.content);

    // Excerpt hanya untuk berita (pengumuman auto-ringkas dari content).
    if (formMode === 'berita' && form.excerpt) {
      fd.append('excerpt', form.excerpt);
    }

    // Category: berita ambil dari dropdown, pengumuman selalu PENGUMUMAN.
    fd.append('category', formMode === 'pengumuman' ? 'PENGUMUMAN' : form.category);

    fd.append('is_active', form.is_active ? '1' : '0');

    // Popup: pengumuman SELALU tampil sebagai popup. Berita opsional.
    const showAsPopup = formMode === 'pengumuman' ? true : form.show_as_popup;
    fd.append('show_as_popup', showAsPopup ? '1' : '0');
    fd.append('popup_dismissable', form.popup_dismissable ? '1' : '0');
    if (showAsPopup && form.popup_until) {
      fd.append('popup_until', form.popup_until);
    } else if (!showAsPopup) {
      fd.append('popup_until', '');
    }

    if (form.image_file) {
      fd.append('image', form.image_file);
    }
    if (editingId !== null && form.remove_image && !form.image_file) {
      fd.append('remove_image', '1');
    }
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => adminApi.announcements.storeWithMedia(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success(
        formMode === 'pengumuman' ? 'Pengumuman dipublikasikan' : 'Berita dipublikasikan',
      );
      resetForm();
    },
    onError: (err: unknown) => {
      toast.error(extractError(err) ?? 'Gagal menyimpan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) =>
      adminApi.announcements.updateWithMedia(id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Perubahan disimpan');
      resetForm();
    },
    onError: (err: unknown) => {
      toast.error(extractError(err) ?? 'Gagal memperbarui');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.announcements.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Status diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.announcements.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const submitting = createMutation.isPending || updateMutation.isPending;
  const isPengumumanMode = formMode === 'pengumuman';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = buildFormData();
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warta & Pengumuman"
        subtitle="Kelola berita publik, pengumuman popup home, status publikasi, dan kurasi konten."
      />

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/60 to-amber-50/50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 ring-1 ring-cyan-100">
              <Newspaper size={13} /> Manajemen Konten Publik
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Warta utama SIBERMAS</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                {activeTab === 'berita'
                  ? 'Artikel publik untuk halaman /berita. Berita penting bisa sekaligus dinaikkan sebagai popup home.'
                  : 'Pengumuman formal yang otomatis tampil sebagai popup di home publik selama aktif.'}
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => openCreate(activeTab)}
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${
                activeTab === 'berita'
                  ? 'bg-cyan-600 shadow-cyan-600/20 hover:bg-cyan-700'
                  : 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'
              }`}
            >
              {activeTab === 'berita' ? '+ Tulis Berita' : '+ Buat Pengumuman'}
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total terfilter" value={visibleStats.total} tone="cyan" />
          <StatCard label="Aktif di halaman ini" value={visibleStats.active} tone="emerald" />
          <StatCard label="Popup di halaman ini" value={visibleStats.popup} tone="amber" />
          <StatCard label="Draft di halaman ini" value={visibleStats.draft} tone="slate" />
        </div>
      </section>

      {/* Tab switcher + filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
            <TabButton
              active={activeTab === 'berita'}
              onClick={() => {
                setActiveTab('berita');
                if (showForm && formMode !== 'berita') resetForm();
              }}
              icon={<Newspaper size={14} />}
              label="Berita"
            />
            <TabButton
              active={activeTab === 'pengumuman'}
              onClick={() => {
                setActiveTab('pengumuman');
                setCategory('all');
                if (showForm && formMode !== 'pengumuman') resetForm();
              }}
              icon={<Megaphone size={14} />}
              label="Pengumuman"
            />
          </div>

          <form
            className="grid gap-2 md:grid-cols-12 xl:min-w-[760px]"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <label className="md:col-span-5">
              <span className="sr-only">Cari judul atau konten</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari judul, ringkasan, konten..."
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            {activeTab === 'berita' && (
              <label className="md:col-span-3">
                <span className="sr-only">Kategori</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as BeritaCategory | 'all')}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="all">Semua kategori</option>
                  {BERITA_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            <label className={activeTab === 'berita' ? 'md:col-span-2' : 'md:col-span-4'}>
              <span className="sr-only">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="popup">Popup home</option>
              </select>
            </label>
            <button
              type="submit"
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 md:col-span-2"
            >
              Terapkan
            </button>
          </form>
        </div>

        {(search || category !== 'all' || status !== 'all') && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Filter aktif:</span>
            {search && <span className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-700">“{search}”</span>}
            {category !== 'all' && <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{category}</span>}
            {status !== 'all' && <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">{status}</span>}
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setCategory('all');
                setStatus('all');
              }}
              className="font-bold text-rose-600 hover:text-rose-700"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ${
            isPengumumanMode ? 'ring-amber-200' : 'ring-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {isPengumumanMode ? (
                <Megaphone size={18} className="text-amber-600" />
              ) : (
                <Newspaper size={18} className="text-cyan-600" />
              )}
              <h3 className="text-base font-bold text-slate-800">
                {editingId !== null
                  ? isPengumumanMode
                    ? 'Edit Pengumuman'
                    : 'Edit Berita'
                  : isPengumumanMode
                    ? 'Buat Pengumuman Baru'
                    : 'Tulis Berita Baru'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPreviewItem({
                    id: editingId ?? 0,
                    title: form.title || '(Tanpa judul)',
                    category: isPengumumanMode ? 'PENGUMUMAN' : form.category,
                    content_type: formMode,
                    content: form.content,
                    excerpt: isPengumumanMode ? undefined : form.excerpt,
                    is_active: form.is_active,
                    show_as_popup: isPengumumanMode ? true : form.show_as_popup,
                    popup_until: form.popup_until || null,
                    popup_dismissable: form.popup_dismissable,
                    image_url: previewImageUrl,
                  })
                }
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1.5"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </div>

          {isPengumumanMode && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <strong>Pengumuman otomatis muncul sebagai popup di home publik.</strong>
              &nbsp;Gunakan untuk pesan penting yang wajib dilihat pengunjung — seperti info jadwal,
              peringatan, atau perubahan kebijakan. Tidak tampil di halaman &ldquo;Berita&rdquo;.
            </div>
          )}

          {/* Title + Category (berita) atau Title only (pengumuman) */}
          {isPengumumanMode ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Judul *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
                maxLength={255}
                placeholder="Contoh: Jadwal UTS Ditunda"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Judul *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as BeritaCategory })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  {BERITA_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Excerpt — hanya berita */}
          {!isPengumumanMode && (
            <div>
              <label className="mb-1 block text-sm font-medium">Ringkasan</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Kalimat pembuka yang muncul di list berita (maks 500 karakter)"
              />
            </div>
          )}

          {/* Content — berbeda label & placeholder antar mode */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {isPengumumanMode ? 'Pesan Pengumuman *' : 'Konten *'}
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={isPengumumanMode ? 4 : 8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
              maxLength={isPengumumanMode ? 600 : undefined}
              placeholder={
                isPengumumanMode
                  ? 'Pesan singkat yang ditampilkan di popup (maks ~600 karakter).'
                  : 'Tulis konten berita lengkap di sini.'
              }
            />
            {isPengumumanMode && (
              <p className="mt-1 text-[11px] text-slate-400">
                Tampil langsung di popup home. Singkat, jelas, action-oriented.
              </p>
            )}
          </div>

          {/* Image upload — optional untuk keduanya */}
          <div className="rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Gambar {isPengumumanMode ? '(opsional, untuk popup)' : '(opsional)'}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm cursor-pointer hover:bg-slate-200">
                <Upload size={14} />
                <span>Pilih gambar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm({ ...form, image_file: file, remove_image: false });
                  }}
                />
              </label>
              {form.image_file && (
                <span className="text-xs text-slate-600">
                  {form.image_file.name} · {(form.image_file.size / 1024).toFixed(0)} KB
                </span>
              )}
              {editingId !== null && !form.image_file && (
                <label className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={form.remove_image}
                    onChange={(e) => setForm({ ...form, remove_image: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  Hapus gambar existing
                </label>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Format JPG/PNG/WEBP, maks 2 MB.</p>
          </div>

          {/* Active toggle */}
          <div className="rounded-xl border border-slate-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm">
                <span className="font-semibold text-slate-800">Terbitkan (aktifkan)</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {isPengumumanMode
                    ? 'Matikan kalau ingin simpan sebagai draf. Pengumuman non-aktif tidak muncul sebagai popup.'
                    : 'Matikan kalau ingin simpan sebagai draf. Berita non-aktif tidak muncul di halaman publik.'}
                </span>
              </span>
            </label>
          </div>

          {/* Popup settings — berita optional toggle, pengumuman hanya sub-opsi */}
          {isPengumumanMode ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <div className="text-xs font-semibold text-amber-800">Pengaturan popup</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Tampilkan sampai (opsional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.popup_until}
                    onChange={(e) => setForm({ ...form, popup_until: e.target.value })}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Kosongkan untuk tampil selamanya (selama aktif).
                  </span>
                </label>
                <label className="flex items-start gap-2 pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.popup_dismissable}
                    onChange={(e) => setForm({ ...form, popup_dismissable: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-700">
                    Izinkan &ldquo;Jangan ingatkan lagi&rdquo;
                    <span className="block text-[10px] text-slate-400">
                      Matikan untuk pengumuman darurat.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_as_popup}
                  onChange={(e) => setForm({ ...form, show_as_popup: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm">
                  <span className="font-semibold text-slate-800">
                    Tampilkan juga sebagai popup di home
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Berita tetap muncul di halaman /berita. Centang ini supaya juga muncul sebagai
                    popup home (untuk berita penting yang ingin disorot).
                  </span>
                </span>
              </label>

              {form.show_as_popup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Popup tampil sampai (opsional)
                    </span>
                    <input
                      type="datetime-local"
                      value={form.popup_until}
                      onChange={(e) => setForm({ ...form, popup_until: e.target.value })}
                      className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
                    />
                  </label>
                  <label className="flex items-start gap-2 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.popup_dismissable}
                      onChange={(e) => setForm({ ...form, popup_dismissable: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-xs text-slate-700">
                      Izinkan &ldquo;Jangan ingatkan lagi&rdquo;
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                isPengumumanMode
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {submitting
                ? 'Menyimpan…'
                : editingId !== null
                  ? 'Simpan perubahan'
                  : isPengumumanMode
                    ? 'Publikasikan Pengumuman'
                    : 'Publikasikan Berita'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className={`space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
          {announcements.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              {search || category !== 'all' || status !== 'all'
                ? 'Tidak ada konten yang cocok dengan filter.'
                : activeTab === 'berita'
                  ? 'Belum ada berita yang ditulis.'
                  : 'Belum ada pengumuman yang ditulis.'}
            </div>
          )}

          {announcements.map((a) => (
            <AnnouncementListItem
              key={a.id}
              item={a}
              tabMode={activeTab}
              onPreview={() => setPreviewItem(a)}
              onToggle={() => toggleActiveMutation.mutate({ id: a.id, is_active: !a.is_active })}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteId(a.id)}
              togglePending={toggleActiveMutation.isPending}
            />
          ))}

          {pagination && pagination.last_page > 1 && (
            <PaginationBar meta={pagination} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Preview dialog */}
      {previewItem && (
        <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title={activeTab === 'pengumuman' ? 'Hapus Pengumuman' : 'Hapus Berita'}
        description="Data akan dihapus permanen. Lanjutkan?"
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}

// ─── Sub components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'cyan' | 'emerald' | 'amber' | 'slate';
}): React.JSX.Element {
  const tones = {
    cyan: { dot: 'from-cyan-500 to-sky-600', soft: 'bg-cyan-50' },
    emerald: { dot: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50' },
    amber: { dot: 'from-amber-500 to-orange-600', soft: 'bg-amber-50' },
    slate: { dot: 'from-slate-600 to-slate-900', soft: 'bg-slate-50' },
  }[tone];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${tones.dot}`} />
      </div>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <div className={`mt-3 h-1.5 rounded-full ${tones.soft}`}>
        <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${tones.dot}`} />
      </div>
    </div>
  );
}

function PaginationBar({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        Menampilkan <strong>{meta.from ?? 0}</strong>-<strong>{meta.to ?? 0}</strong> dari{' '}
        <strong>{meta.total}</strong> konten
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
          {meta.current_page}/{meta.last_page}
        </span>
        <button
          type="button"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AnnouncementListItem({
  item,
  tabMode,
  onPreview,
  onToggle,
  onEdit,
  onDelete,
  togglePending,
}: {
  item: Announcement;
  tabMode: ContentTab;
  onPreview: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  togglePending: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-800 truncate">{item.title}</p>
          {tabMode === 'berita' && item.show_as_popup && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
              <Pin size={10} /> JUGA POPUP
            </span>
          )}
          {!item.is_active && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
              DRAF
            </span>
          )}
          {tabMode === 'berita' && item.category && (
            <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item.category}
            </span>
          )}
        </div>
        {item.excerpt && (
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.excerpt}</p>
        )}
        {!item.excerpt && tabMode === 'pengumuman' && item.content && (
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.content}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          {item.published_at
            ? new Date(item.published_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Belum terbit'}
          {item.popup_until && (
            <>
              {' · '}
              Popup sampai{' '}
              {new Date(item.popup_until).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          title="Preview"
          className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          title={item.is_active ? 'Non-aktifkan' : 'Aktifkan'}
          disabled={togglePending}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${
            item.is_active
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Power size={14} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          <Edit2 size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Hapus"
          className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function PreviewDialog({
  item,
  onClose,
}: {
  item: Announcement;
  onClose: () => void;
}): React.JSX.Element {
  const isPengumuman = item.content_type === 'pengumuman';
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.image_url && (
          <div className="h-48 w-full overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${
                isPengumuman ? 'bg-amber-100 text-amber-600' : 'bg-cyan-100 text-cyan-600'
              }`}
            >
              {isPengumuman ? <Megaphone size={18} /> : <Newspaper size={18} />}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isPengumuman ? 'text-amber-700' : 'text-cyan-700'
                }`}
              >
                {isPengumuman ? 'PENGUMUMAN (POPUP HOME)' : item.category}
              </p>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.title}</h3>
            </div>
          </div>

          {item.excerpt && (
            <p className="text-sm text-slate-600 leading-relaxed">{item.excerpt}</p>
          )}

          {item.content && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100 pt-3">
              {item.content}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>
              Status: <strong>{item.is_active ? 'Aktif' : 'Draf'}</strong>
            </span>
            {item.show_as_popup && (
              <span>
                · Popup home{' '}
                {item.popup_until
                  ? `sampai ${new Date(item.popup_until).toLocaleDateString('id-ID')}`
                  : '(selamanya)'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Tutup preview
          </button>
        </div>
      </div>
    </div>
  );
}

function extractError(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const anyErr = err as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    anyErr.response?.data?.error?.message ??
    anyErr.response?.data?.message ??
    anyErr.message ??
    null
  );
}
