import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import dayjs from 'dayjs';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import Pagination, { PageInfo, type PaginationMeta } from '@/Components/ui/Pagination';
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import SearchInput from '@/Components/Premium/SearchInput';
import StatCard from '@/Components/Premium/StatCard';
import StatusTag from '@/Components/Premium/StatusTag';
import AnnouncementEditor from '@/Components/Admin/AnnouncementEditor';
import {
  CalendarClock,
  Eye,
  FileImage,
  FileSearch,
  Newspaper,
  Paperclip,
  PenSquare,
  Plus,
  Save,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';

type AnnouncementStatus = 'draft' | 'scheduled' | 'published';

interface AnnouncementRecord {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  is_active: boolean;
  published_at: string;
  image?: string | null;
  image_url?: string | null;
  file_name?: string | null;
  attachment_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  status: AnnouncementStatus;
  reading_time: number;
  word_count: number;
  public_url: string;
  preview_url: string;
  updated_at?: string | null;
}

interface Props extends PageProps {
  announcements: {
    data: AnnouncementRecord[];
    meta: PaginationMeta;
  };
  summary: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
  filters: {
    search?: string;
    status?: string;
    category?: string;
  };
  categories: string[];
}

interface AnnouncementFormData {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image: File | null;
  attachment: File | null;
  is_active: boolean;
  published_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  remove_image: boolean;
  remove_attachment: boolean;
}

const defaultCategory = 'BERITA';

const emptyForm = (): AnnouncementFormData => ({
  title: '',
  slug: '',
  category: defaultCategory,
  excerpt: '',
  content: '<p></p>',
  image: null,
  attachment: null,
  is_active: true,
  published_at: dayjs().format('YYYY-MM-DDTHH:mm'),
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  remove_image: false,
  remove_attachment: false,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function excerptFromContent(html: string, maxLength = 220) {
  const text = plainText(html);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function wordCount(html: string) {
  const text = plainText(html);

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).length;
}

function readingTime(wordTotal: number) {
  return Math.max(1, Math.ceil(wordTotal / 180));
}

function humanStatus(status: AnnouncementStatus) {
  if (status === 'published') return 'Terbit';
  if (status === 'scheduled') return 'Terjadwal';
  return 'Draft';
}

function statusVariant(status: AnnouncementStatus): 'success' | 'warning' | 'gray' {
  if (status === 'published') return 'success';
  if (status === 'scheduled') return 'warning';
  return 'gray';
}

function deriveStatus(isActive: boolean, publishedAt: string): AnnouncementStatus {
  if (!isActive) {
    return 'draft';
  }

  if (dayjs(publishedAt).isAfter(dayjs())) {
    return 'scheduled';
  }

  return 'published';
}

function seoScore(form: AnnouncementFormData) {
  let score = 0;

  if (form.title.trim().length >= 12) score += 1;
  if ((form.excerpt.trim() || excerptFromContent(form.content)).length >= 90) score += 1;
  if (form.meta_title.trim() && form.meta_description.trim()) score += 1;
  if (form.meta_keywords.trim()) score += 1;

  return score;
}

function formatDateTime(value: string) {
  return dayjs(value).format('DD MMM YYYY, HH:mm');
}

export default function AnnouncementIndex({ announcements, summary, filters, categories }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
  const [categoryFilter, setCategoryFilter] = useState(filters.category ?? '');
  const [selectedId, setSelectedId] = useState<number | null>(announcements.data[0]?.id ?? null);

  const form = useForm<AnnouncementFormData>(emptyForm());

  const selectedAnnouncement = useMemo(
    () => announcements.data.find((announcement) => announcement.id === selectedId) ?? null,
    [announcements.data, selectedId],
  );

  const previewExcerpt = form.data.excerpt.trim() || excerptFromContent(form.data.content);
  const previewStatus = deriveStatus(form.data.is_active, form.data.published_at);
  const previewPublicPath = form.data.slug.trim() ? `/berita/${form.data.slug}` : '/berita';
  const currentSeoScore = seoScore(form.data);
  const previewWordCount = wordCount(form.data.content);
  const previewReadingTime = readingTime(previewWordCount);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        search !== (filters.search ?? '') ||
        statusFilter !== (filters.status ?? '') ||
        categoryFilter !== (filters.category ?? '')
      ) {
        router.get(
          route('admin.warta-utama.index'),
          {
            search: search || undefined,
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
          },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [categoryFilter, filters.category, filters.search, filters.status, search, statusFilter]);

  useEffect(() => {
    if (selectedAnnouncement) {
      form.setData({
        title: selectedAnnouncement.title,
        slug: selectedAnnouncement.slug,
        category: selectedAnnouncement.category,
        excerpt: selectedAnnouncement.excerpt ?? '',
        content: selectedAnnouncement.content || '<p></p>',
        image: null,
        attachment: null,
        is_active: selectedAnnouncement.is_active,
        published_at: dayjs(selectedAnnouncement.published_at).format('YYYY-MM-DDTHH:mm'),
        meta_title: selectedAnnouncement.meta_title || '',
        meta_description: selectedAnnouncement.meta_description || '',
        meta_keywords: selectedAnnouncement.meta_keywords || '',
        remove_image: false,
        remove_attachment: false,
      });
      form.clearErrors();
      return;
    }

    form.setData(emptyForm());
    form.clearErrors();
  }, [form, selectedAnnouncement]);

  useEffect(() => {
    if (selectedId && !announcements.data.some((announcement) => announcement.id === selectedId)) {
      setSelectedId(announcements.data[0]?.id ?? null);
    }
  }, [announcements.data, selectedId]);

  const resetComposer = () => {
    form.setData(emptyForm());
    form.clearErrors();
  };

  const startCreate = () => {
    setSelectedId(null);
    resetComposer();
  };

  const handleTitleChange = (value: string) => {
    form.setData('title', value);

    if (!selectedAnnouncement) {
      form.setData('slug', slugify(value));

      if (!form.data.meta_title.trim()) {
        form.setData('meta_title', value.slice(0, 255));
      }
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const endpoint = selectedAnnouncement
      ? route('admin.warta-utama.update', { announcement: selectedAnnouncement.id })
      : route('admin.warta-utama.store');

    form
      .transform((data) => ({
        ...data,
        _method: selectedAnnouncement ? 'PATCH' : 'POST',
      }))
      .post(endpoint, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          if (!selectedAnnouncement) {
            resetComposer();
          }

          form.setData('image', null);
          form.setData('attachment', null);
        },
      });
  };

  const destroy = (announcement: AnnouncementRecord) => {
    if (!window.confirm(`Berita "${announcement.title}" akan dihapus. Lanjutkan?`)) {
      return;
    }

    router.delete(route('admin.warta-utama.destroy', { announcement: announcement.id }), {
      preserveScroll: true,
      onSuccess: () => {
        if (selectedId === announcement.id) {
          setSelectedId(null);
        }
      },
    });
  };

  return (
    <AppLayout title="Manajemen Berita">
      <Head title="Manajemen Berita | SIBERMAS" />

      <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-10 font-sans text-emerald-950 sm:px-6 lg:px-8">
        <PageHeader
          title="Berita."
          subtitle="Kelola artikel publik di /berita dengan workflow editorial yang lebih lengkap: penulisan, media, penjadwalan, SEO, dan preview publik."
          icon={Newspaper}
          groupLabel="Portal Publik"
          stats={{
            label: 'Publikasi Aktif',
            value: `${summary.published} Terbit`,
            icon: Eye,
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex h-12 items-center gap-3 rounded-2xl bg-emerald-600 px-6 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} />
              Artikel Baru
            </button>
          </div>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Artikel" value={summary.total} icon={FileSearch} variant="gray" />
          <StatCard label="Sudah Terbit" value={summary.published} icon={ShieldCheck} variant="success" />
          <StatCard label="Terjadwal" value={summary.scheduled} icon={CalendarClock} variant="warning" />
          <StatCard label="Draft" value={summary.draft} icon={PenSquare} variant="info" />
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)]">
          <div className="space-y-6 lg:sticky lg:top-24">
            <ContentPanel
              title={selectedAnnouncement ? 'Editor Berita' : 'Tulis Berita Baru'}
              description="Panel komposer untuk artikel publik. Perubahan akan muncul di /berita setelah disimpan dan statusnya memenuhi publikasi."
              icon={PenSquare}
            >
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="news-title" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                    Judul Artikel
                  </label>
                  <input
                    id="news-title"
                    value={form.data.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Masukkan judul berita"
                    className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-5 py-4 text-lg font-semibold text-emerald-950"
                  />
                  {form.errors.title && (
                    <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.title}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_12rem]">
                  <div className="space-y-2">
                    <label htmlFor="news-slug" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                      Slug Publik
                    </label>
                    <div className="rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">/berita/</div>
                      <input
                        id="news-slug"
                        value={form.data.slug}
                        onChange={(event) => form.setData('slug', slugify(event.target.value))}
                        placeholder="slug-berita"
                        className="w-full border-none bg-transparent px-0 py-0 text-sm font-semibold text-emerald-950 shadow-none focus:ring-0"
                      />
                    </div>
                    {form.errors.slug && <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.slug}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="news-category" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                      Kategori
                    </label>
                    <input
                      id="news-category"
                      list="news-category-options"
                      value={form.data.category}
                      onChange={(event) => form.setData('category', event.target.value.toUpperCase())}
                      placeholder="BERITA"
                      className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-emerald-950"
                    />
                    <datalist id="news-category-options">
                      {categories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    <p className="pl-1 text-xs text-slate-500">
                      Gunakan kategori yang paling relevan. Anda tetap bisa membuat kategori baru jika diperlukan.
                    </p>
                    {form.errors.category && (
                      <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.category}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="news-excerpt" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                    Ringkasan / Excerpt
                  </label>
                  <textarea
                    id="news-excerpt"
                    rows={4}
                    value={form.data.excerpt}
                    onChange={(event) => form.setData('excerpt', event.target.value)}
                    placeholder="Ringkasan ini dipakai di listing /berita dan kartu berita homepage."
                    className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-5 py-4 text-sm leading-7 text-emerald-950"
                  />
                  <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                    <span>Jika kosong, sistem akan mengambil ringkasan otomatis dari isi artikel.</span>
                    <span>{previewExcerpt.length}/220</span>
                  </div>
                  {form.errors.excerpt && (
                    <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.excerpt}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="news-content" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                    Isi Artikel
                  </label>
                  <AnnouncementEditor
                    id="news-content"
                    value={form.data.content}
                    onChange={(value) => form.setData('content', value)}
                    placeholder="Tulis isi berita lengkap di sini..."
                  />
                  {form.errors.content && (
                    <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.content}</p>
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <ContentPanel
                    title="Publikasi & Media"
                    description="Atur status publikasi, featured image, dan lampiran dokumen pendukung."
                    icon={Upload}
                  >
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="published-at" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Jadwal Tayang
                        </label>
                        <input
                          id="published-at"
                          type="datetime-local"
                          value={form.data.published_at}
                          onChange={(event) => form.setData('published_at', event.target.value)}
                          className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-emerald-950"
                        />
                        {form.errors.published_at && (
                          <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.published_at}</p>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                        <div>
                          <p className="text-sm font-semibold text-emerald-950">Status publik</p>
                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            Nonaktif berarti tetap tersimpan tetapi tidak muncul di /berita.
                          </p>
                        </div>
                        <label className="mt-1 flex items-center gap-2 text-xs font-semibold normal-case tracking-normal text-emerald-950">
                          <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600"
                          />
                          Aktif
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="news-image" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Featured Image
                        </label>
                        <input
                          id="news-image"
                          type="file"
                          accept="image/*"
                          onChange={(event) => form.setData('image', event.target.files?.[0] || null)}
                          className="w-full rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm"
                        />
                        {(selectedAnnouncement?.image_url || form.data.image) && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                              <FileImage size={18} className="text-emerald-600" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-emerald-950">
                                  {form.data.image?.name || selectedAnnouncement?.image?.split('/').pop() || 'featured-image'}
                                </p>
                                <p className="text-xs text-slate-500">Gambar utama untuk listing berita dan artikel detail.</p>
                              </div>
                            </div>
                            {selectedAnnouncement?.image_url && (
                              <label className="mt-3 flex items-center gap-2 text-xs font-medium normal-case tracking-normal text-rose-700">
                                <input
                                  type="checkbox"
                                  checked={form.data.remove_image}
                                  onChange={(event) => form.setData('remove_image', event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-rose-600"
                                />
                                Hapus gambar lama saat menyimpan
                              </label>
                            )}
                          </div>
                        )}
                        {form.errors.image && <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.image}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="news-attachment" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Lampiran Artikel
                        </label>
                        <input
                          id="news-attachment"
                          type="file"
                          onChange={(event) => form.setData('attachment', event.target.files?.[0] || null)}
                          className="w-full rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm"
                        />
                        {(selectedAnnouncement?.file_name || form.data.attachment) && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                              <Paperclip size={18} className="text-emerald-600" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-emerald-950">
                                  {form.data.attachment?.name || selectedAnnouncement?.file_name}
                                </p>
                                <p className="text-xs text-slate-500">Lampiran bisa ditampilkan di artikel detail untuk diunduh publik.</p>
                              </div>
                            </div>
                            {selectedAnnouncement?.file_name && (
                              <label className="mt-3 flex items-center gap-2 text-xs font-medium normal-case tracking-normal text-rose-700">
                                <input
                                  type="checkbox"
                                  checked={form.data.remove_attachment}
                                  onChange={(event) => form.setData('remove_attachment', event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-rose-600"
                                />
                                Hapus lampiran lama saat menyimpan
                              </label>
                            )}
                          </div>
                        )}
                        {form.errors.attachment && (
                          <p className="pl-1 text-xs font-semibold text-rose-600">{form.errors.attachment}</p>
                        )}
                      </div>
                    </div>
                  </ContentPanel>

                  <ContentPanel
                    title="SEO & Preview"
                    description="Siapkan meta dan cek bagaimana artikel akan terlihat di publik."
                    icon={Sparkles}
                  >
                    <div className="space-y-5">
                      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-emerald-950">Skor kesiapan SEO</p>
                            <p className="mt-1 text-xs leading-6 text-emerald-700">
                              Ukuran sederhana berdasarkan judul, ringkasan, dan metadata.
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                            <p className="text-2xl font-black font-display uppercase tracking-tighter text-emerald-950">{currentSeoScore}/4</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Kata</p>
                          <p className="mt-3 text-2xl font-black font-display uppercase tracking-tighter text-emerald-950">{previewWordCount}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Estimasi Baca</p>
                          <p className="mt-3 text-2xl font-black font-display uppercase tracking-tighter text-emerald-950">{previewReadingTime} menit</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Status</p>
                          <p className="mt-3 text-base font-semibold text-emerald-950">{humanStatus(previewStatus)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="meta-title" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Meta Title
                        </label>
                        <input
                          id="meta-title"
                          value={form.data.meta_title}
                          onChange={(event) => form.setData('meta_title', event.target.value)}
                          placeholder="Judul SEO untuk mesin pencari"
                          className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-emerald-950"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="meta-description" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Meta Description
                        </label>
                        <textarea
                          id="meta-description"
                          rows={4}
                          value={form.data.meta_description}
                          onChange={(event) => form.setData('meta_description', event.target.value)}
                          placeholder="Deskripsi singkat untuk hasil pencarian"
                          className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3 text-sm leading-7 text-emerald-950"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="meta-keywords" className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                          Meta Keywords
                        </label>
                        <input
                          id="meta-keywords"
                          value={form.data.meta_keywords}
                          onChange={(event) => form.setData('meta_keywords', event.target.value)}
                          placeholder="kkn, lppm, berita, pengabdian"
                          className="w-full rounded-2xl border-2 border-slate-100 bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-emerald-950"
                        />
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
                          Preview publik
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{previewPublicPath}</p>
                        <h3 className="mt-3 text-lg font-semibold leading-tight text-emerald-950">
                          {form.data.meta_title || form.data.title || 'Judul berita akan tampil di sini'}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {form.data.meta_description || previewExcerpt || 'Ringkasan artikel akan muncul pada preview publik.'}
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <StatusTag
                            status={previewStatus}
                            label={humanStatus(previewStatus)}
                            variant={statusVariant(previewStatus)}
                            size="sm"
                          />
                          <span className="text-xs font-medium text-slate-500">
                            {form.data.published_at ? formatDateTime(form.data.published_at) : 'Jadwal belum diisi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ContentPanel>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex h-12 items-center gap-3 rounded-2xl bg-emerald-950 px-6 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-900 disabled:opacity-60"
                  >
                    <Save size={16} />
                    {selectedAnnouncement ? 'Perbarui Berita' : 'Simpan Berita'}
                  </button>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex h-12 items-center gap-3 rounded-2xl border border-slate-200 px-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <Plus size={16} />
                    Reset Composer
                  </button>
                  {selectedAnnouncement && (
                    <a
                      href={selectedAnnouncement.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 items-center gap-3 rounded-2xl border border-emerald-200 px-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <Eye size={16} />
                      Preview Admin
                    </a>
                  )}
                  {selectedAnnouncement?.status === 'published' && (
                    <a
                      href={selectedAnnouncement.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 items-center gap-3 rounded-2xl border border-slate-200 px-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <Eye size={16} />
                      Buka Live
                    </a>
                  )}
                </div>
              </form>
            </ContentPanel>
          </div>

          <div className="space-y-6">
            <ContentPanel
              title="Arsip Berita /berita"
              description="Cari, filter, dan pilih artikel untuk diedit. Panel ini menjadi pusat navigasi editorial."
              icon={SearchCheck}
              headerAction={
                <div className="flex flex-col gap-3 lg:flex-row">
                  <SearchInput
                    placeholder="Cari judul, slug, atau isi berita..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full lg:w-72"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-w-40 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-emerald-950"
                  >
                    <option value="">Semua status</option>
                    <option value="published">Terbit</option>
                    <option value="scheduled">Terjadwal</option>
                    <option value="draft">Draft</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="min-w-44 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-emerald-950"
                  >
                    <option value="">Semua kategori</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              }
              footer={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <PageInfo meta={announcements.meta} />
                  <Pagination meta={announcements.meta} />
                </div>
              }
            >
              <div className="space-y-4">
                {announcements.data.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-[#fbfdfc] px-6 py-12 text-center">
                    <h3 className="text-lg font-semibold text-emerald-950">Belum ada artikel pada hasil filter ini.</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Ubah pencarian atau mulai tulis artikel baru dari panel composer.
                    </p>
                  </div>
                )}

                {announcements.data.map((announcement) => {
                  const isSelected = announcement.id === selectedId;

                  return (
                    <div
                      key={announcement.id}
                      className={clsx(
                        'overflow-hidden rounded-[1.75rem] border bg-white shadow-sm transition',
                        isSelected
                          ? 'border-emerald-300 shadow-[0_18px_45px_rgba(6,95,70,0.10)]'
                          : 'border-slate-200 hover:border-emerald-200',
                      )}
                    >
                      <div className="grid gap-5 p-5 xl:grid-cols-[9rem_minmax(0,1fr)_auto] xl:items-start">
                        <button
                          type="button"
                          onClick={() => setSelectedId(announcement.id)}
                          className="overflow-hidden rounded-[1.25rem] bg-emerald-50 text-left"
                        >
                          {announcement.image_url ? (
                            <img src={announcement.image_url} alt={announcement.title} className="aspect-[4/3] h-full w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[4/3] h-full w-full items-end bg-[linear-gradient(145deg,#ecfdf5_0%,#eff6ff_100%)] p-4">
                              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                /berita
                              </span>
                            </div>
                          )}
                        </button>

                        <button type="button" onClick={() => setSelectedId(announcement.id)} className="space-y-3 text-left">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusTag
                              status={announcement.status}
                              label={humanStatus(announcement.status)}
                              variant={statusVariant(announcement.status)}
                              size="sm"
                            />
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              {announcement.category}
                            </span>
                            <span className="text-xs font-medium text-slate-500">{formatDateTime(announcement.published_at)}</span>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold leading-tight text-emerald-950">{announcement.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{announcement.excerpt}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                              /berita/{announcement.slug}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                              {announcement.word_count} kata
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                              {announcement.reading_time} menit baca
                            </span>
                            {announcement.file_name && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                                <Paperclip size={14} />
                                {announcement.file_name}
                              </span>
                            )}
                            {(announcement.meta_title || announcement.meta_description) && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                                <Sparkles size={14} />
                                SEO siap
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex flex-col gap-2 xl:items-end">
                          <a
                            href={announcement.preview_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <Eye size={14} />
                            Preview
                          </a>
                          {announcement.status === 'published' && (
                            <a
                              href={announcement.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-50"
                            >
                              <Eye size={14} />
                              Live
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => destroy(announcement)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
