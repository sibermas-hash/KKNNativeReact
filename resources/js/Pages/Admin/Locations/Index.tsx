import { useEffect, useState, type FormEvent } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
  MapPin,
  Trash2,
  Search,
  Navigation,
  GitBranch,
  ShieldCheck,
  Pencil,
  Plus,
  Building2,
  MapPinned,
  House,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LocationData {
  id: number;
  village_code: string | null;
  village_name: string;
  district_name: string | null;
  regency_name: string | null;
  capacity: number | null;
  full_name: string;
  groups_count: number;
  posko_count: number;
  can_delete: boolean;
  delete_blocker: string | null;
}

interface Props extends PageProps {
  locations: {
    data: LocationData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  filters: {
    search?: string;
  };
  summary: {
    total_locations: number;
    assigned_groups: number;
    reported_posko: number;
  };
  workflow: {
    primary_source: 'groups_import' | 'manual';
    groups_import_url: string;
  };
}

interface LocationFormData {
  village_name: string;
  district_name: string;
  regency_name: string;
  village_code: string;
  capacity: string;
}

const emptyForm: LocationFormData = {
  village_name: '',
  district_name: '',
  regency_name: '',
  village_code: '',
  capacity: '',
};

export default function LocationsIndex({ locations, filters, summary, workflow }: Props) {
  const [deleting, setDeleting] = useState<LocationData | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  const form = useForm<LocationFormData>(emptyForm);
  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get('/admin/lokasi', { search }, { preserveState: true, replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters.search]);

  function openCreateModal() {
    setEditingLocation(null);
    setIsModalOpen(true);
    form.clearErrors();
    form.setData(emptyForm);
  }

  function openEditModal(location: LocationData) {
    setEditingLocation(location);
    setIsModalOpen(true);
    form.clearErrors();
    form.setData({
      village_name: location.village_name ?? '',
      district_name: location.district_name ?? '',
      regency_name: location.regency_name ?? '',
      village_code: location.village_code ?? '',
      capacity: location.capacity != null ? String(location.capacity) : '',
    });
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingLocation(null);
    form.clearErrors();
    form.reset();
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => closeModal(),
    };

    if (editingLocation) {
      form.put(`/admin/lokasi/${editingLocation.id}`, options);
      return;
    }

    form.post('/admin/lokasi', options);
  }

  return (
    <AppLayout title="MASTER WILAYAH">
      <Head title="Master Wilayah | KKN UIN SAIZU" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Master Wilayah KKN</h2>
              <p className="text-sm font-medium text-slate-500">
                Registri wilayah hasil plotting kelompok dan meja koreksi data administratif.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Cari desa, kecamatan, kabupaten, kode desa..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
              />
            </form>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-900/10"
            >
              <Plus size={16} />
              Tambah Wilayah
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Wilayah</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.total_locations}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPinned size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Kelompok Terplot</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.assigned_groups}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <House size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Posko Tercatat</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.reported_posko}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-bold text-amber-900">Fungsi halaman ini adalah registri dan koreksi wilayah.</p>
              <div className="space-y-1 text-xs font-medium leading-relaxed text-amber-800">
                <p>1. Bulk import utama dilakukan dari halaman kelompok, lalu sistem membentuk wilayah otomatis dari desa, kecamatan, dan kabupaten.</p>
                <p>2. Halaman ini dipakai untuk mengecek hasil wilayah yang terbentuk, menambah data wilayah manual bila ada kebutuhan khusus, dan mengoreksi data yang keliru.</p>
                <p>3. Wilayah hanya bisa dihapus bila belum dipakai oleh kelompok KKN mana pun.</p>
              </div>
            </div>
            {workflow.primary_source === 'groups_import' && (
              <a
                href={workflow.groups_import_url}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-xs font-bold text-amber-900 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Buka Bulk Kelompok
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <GitBranch size={16} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800">Cara Kerja Halaman Lokasi</h3>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Review</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Periksa wilayah hasil bulk kelompok</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                    Pastikan nama desa, kecamatan, kabupaten, dan kode desa sudah sesuai data lapangan sebelum operasional berjalan lebih jauh.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Koreksi</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Tambah atau edit wilayah manual</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                    Gunakan tombol tambah/edit jika ada wilayah yang perlu dibenahi tanpa harus mengulang bulk import kelompok dari awal.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-xs font-semibold leading-relaxed text-emerald-700">
                      Halaman ini tidak lagi menampilkan bulk upload wilayah agar tidak ada dua pintu impor yang membingungkan.
                      Sumber utama data wilayah tetap dari bulk kelompok.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Wilayah</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Kode / Kapasitas</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Statistik</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locations.data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="mx-auto max-w-md space-y-2">
                            <MapPin className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="text-base font-bold text-slate-700">Belum ada data wilayah yang cocok dengan filter.</p>
                            <p className="text-sm text-slate-500">
                              Bulk import kelompok terlebih dahulu, atau tambahkan wilayah manual jika memang perlu koreksi administratif.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      locations.data.map((loc) => (
                        <tr key={loc.id} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                                <Navigation size={18} />
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-slate-800">Desa {loc.village_name}</div>
                                <div className="text-[11px] font-medium text-slate-500">
                                  Kec. {loc.district_name} • {loc.regency_name}
                                </div>
                                {!loc.can_delete && loc.delete_blocker && (
                                  <div className="text-[11px] font-semibold text-amber-600">{loc.delete_blocker}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1 text-xs font-medium text-slate-600">
                              <div>
                                <span className="font-bold text-slate-700">Kode desa:</span>{' '}
                                {loc.village_code || '-'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">Kapasitas wilayah:</span>{' '}
                                {loc.capacity ?? 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-bold text-slate-800">{loc.groups_count} Unit KKN</div>
                              <div className="text-[10px] font-medium text-slate-400">{loc.posko_count} Posko terdata</div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(loc)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
                                title="Edit wilayah"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(loc)}
                                disabled={!loc.can_delete}
                                className={clsx(
                                  'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition',
                                  loc.can_delete
                                    ? 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:text-rose-500'
                                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                                )}
                                title="Hapus wilayah"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {locations.meta && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <Pagination meta={locations.meta} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Sistem registri geospasial UIN SAIZU
          </span>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingLocation ? 'Edit Wilayah' : 'Tambah Wilayah Manual'}
        maxWidth="xl"
      >
        <form onSubmit={submitForm} className="space-y-6">
          <p className="text-sm text-slate-500">
            Gunakan form ini hanya untuk koreksi administratif atau menambahkan wilayah yang memang belum terbentuk dari bulk kelompok.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Desa</label>
              <input
                type="text"
                value={form.data.village_name}
                onChange={(event) => form.setData('village_name', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                placeholder="Nama desa"
              />
              {form.errors.village_name && <p className="text-xs font-semibold text-rose-500">{form.errors.village_name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Kecamatan</label>
              <input
                type="text"
                value={form.data.district_name}
                onChange={(event) => form.setData('district_name', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                placeholder="Nama kecamatan"
              />
              {form.errors.district_name && <p className="text-xs font-semibold text-rose-500">{form.errors.district_name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Kabupaten</label>
              <input
                type="text"
                value={form.data.regency_name}
                onChange={(event) => form.setData('regency_name', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                placeholder="Nama kabupaten"
              />
              {form.errors.regency_name && <p className="text-xs font-semibold text-rose-500">{form.errors.regency_name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Kode Desa</label>
              <input
                type="text"
                value={form.data.village_code}
                onChange={(event) => form.setData('village_code', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                placeholder="Opsional"
              />
              {form.errors.village_code && <p className="text-xs font-semibold text-rose-500">{form.errors.village_code}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Kapasitas Wilayah</label>
              <input
                type="number"
                min="0"
                value={form.data.capacity}
                onChange={(event) => form.setData('capacity', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                placeholder="0"
              />
              {form.errors.capacity && <p className="text-xs font-semibold text-rose-500">{form.errors.capacity}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={form.processing}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
            >
              {form.processing ? 'Menyimpan...' : editingLocation ? 'Simpan Perubahan' : 'Tambah Wilayah'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteForm.delete(`/admin/lokasi/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
          });
        }}
        title="Hapus Wilayah"
        message={
          deleting?.can_delete
            ? `Apakah Anda yakin ingin menghapus data wilayah "${deleting.full_name}"?`
            : (deleting?.delete_blocker ?? 'Wilayah ini masih memiliki dependensi aktif.')
        }
        confirmLabel="Hapus Permanen"
      />
    </AppLayout>
  );
}
