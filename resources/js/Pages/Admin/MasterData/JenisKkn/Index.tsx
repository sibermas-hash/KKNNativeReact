import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Plus, Trash2, Eye, Edit2, Search, X, Layers, CheckCircle2, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '@/Components/ui/Modal';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatusTag from '@/Components/Premium/StatusTag';

interface JenisKkn {
  id: number;
  code: string;
  name: string;
  description: string | null;
  registration_mode: string;
  placement_mode: string;
  registration_mode_label: string;
  placement_mode_label: string;
  min_sks: number;
  min_gpa: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  periodes_count: number;
}

interface Props {
  jenisKkn: JenisKkn[];
  filters: { search?: string };
  registrationModes: { value: string; label: string }[];
  placementModes: { value: string; label: string }[];
}

export default function JenisKknIndex({ jenisKkn, filters, registrationModes, placementModes }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJenis, setEditingJenis] = useState<JenisKkn | null>(null);

  const { data, setData, post, patch, processing, reset, errors } = useForm({
    code: '',
    name: '',
    description: '',
    registration_mode: 'open',
    placement_mode: 'automatic_after_approval',
    min_sks: 100,
    min_gpa: '0.00',
    color: 'emerald',
    is_active: true,
    sort_order: 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/jenis-kkn', { search }, { preserveState: true, replace: true });
  };

  const openCreateForm = () => {
    setEditingJenis(null);
    reset();
    setIsFormOpen(true);
  };

  const openEditForm = (jenis: JenisKkn) => {
    setEditingJenis(jenis);
    setData({
      code: jenis.code,
      name: jenis.name,
      description: jenis.description || '',
      registration_mode: jenis.registration_mode,
      placement_mode: jenis.placement_mode,
      min_sks: jenis.min_sks,
      min_gpa: jenis.min_gpa,
      color: jenis.color,
      is_active: jenis.is_active,
      sort_order: jenis.sort_order,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus jenis KKN ini? Data terkait mungkin akan terpengaruh.')) {
      router.delete(`/admin/jenis-kkn/${id}`);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJenis) {
      patch(`/admin/jenis-kkn/${editingJenis.id}`, { onSuccess: () => setIsFormOpen(false) });
    } else {
      post('/admin/jenis-kkn', { onSuccess: () => { setIsFormOpen(false); reset(); } });
    }
  };

  return (
    <AppLayout title="Jenis Program KKN">
      <Head title="Jenis Program KKN" />

      <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
        {/* PAGE HEADER */}
        <PageHeader
          title="Jenis Program KKN"
          subtitle="Pengaturan skema program, kualifikasi peserta, dan mode pendaftaran KKN."
          icon={Layers}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Jenis Terdaftar',
            value: `${jenisKkn.length} Jenis Terdaftar`,
            icon: Layers,
          }}
        >
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors"
          >
            <Plus size={16} /> Tambah Jenis KKN
          </button>
        </PageHeader>

        {/* TABLE CONTENT */}
        <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden">
          {/* Search bar */}
          <div className="px-5 py-4 border-b border-emerald-50">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800" />
              <input
                type="text"
                placeholder="Cari nama atau kode jenis KKN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all placeholder:text-black"
              />
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-emerald-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Nama & Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kualifikasi Peserta</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Mode Operasional</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {jenisKkn.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Layers className="mx-auto h-10 w-10 text-[#e5e7eb] mb-3" strokeWidth={1} />
                      <p className="text-sm text-emerald-800">Data jenis KKN tidak ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  jenisKkn.map((jenis) => (
                    <tr key={jenis.id} className="hover:bg-gray-50 transition-colors">
                      {/* NAMA & KODE */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-semibold text-emerald-950">{jenis.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-gray-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              Kode: {jenis.code}
                            </span>
                          </div>
                          <Link
                            href={`/admin/jenis-kkn/${jenis.id}`}
                            className="text-xs text-[#16a34a] font-medium hover:underline"
                          >
                            {jenis.periodes_count} Periode Terkait
                          </Link>
                        </div>
                      </td>

                      {/* KUALIFIKASI PESERTA */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]">
                            Min. {jenis.min_sks} SKS
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]">
                            IPK Min: {jenis.min_gpa}
                          </span>
                        </div>
                      </td>

                      {/* MODE OPERASIONAL */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-emerald-950">{jenis.registration_mode_label}</span>
                          <span className="text-xs text-emerald-800">{jenis.placement_mode_label}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4 text-center">
                        <StatusTag status={jenis.is_active ? 'Aktif' : 'Nonaktif'} />
                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/jenis-kkn/${jenis.id}`}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-sm font-medium border border-gray-300 text-emerald-950 bg-white hover:bg-gray-50 transition-colors"
                          >
                            Detail
                          </Link>
                          <button
                            onClick={() => openEditForm(jenis)}
                            className="h-8 w-8 flex items-center justify-center text-emerald-800 hover:text-emerald-950 hover:bg-gray-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(jenis.id)}
                            disabled={jenis.periodes_count > 0}
                            className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={jenis.periodes_count > 0 ? "Tidak dapat dihapus (Memiliki Periode)" : "Hapus"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="2xl">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-emerald-950">
              {editingJenis ? 'Edit Jenis KKN' : 'Tambah Jenis KKN Baru'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-emerald-800 hover:text-emerald-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Nama Jenis KKN <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none placeholder:text-black"
                  placeholder="Misal: KKN Reguler"
                />
                {errors.name && <p className="text-xs text-[#ef4444] mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Kode <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  disabled={!!editingJenis}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none placeholder:text-black disabled:bg-gray-100 disabled:text-emerald-800"
                  placeholder="Misal: REGULER"
                />
                {errors.code && <p className="text-xs text-[#ef4444] mt-1">{errors.code}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-950 mb-1.5">Deskripsi</label>
              <textarea
                rows={3}
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none placeholder:text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg border border-emerald-50">
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Minimal SKS <span className="text-[#ef4444]">*</span></label>
                <input
                  type="number"
                  value={data.min_sks}
                  onChange={(e) => setData('min_sks', parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Minimal IPK <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={data.min_gpa}
                  onChange={(e) => setData('min_gpa', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Mode Pendaftaran</label>
                <select
                  value={data.registration_mode}
                  onChange={(e) => setData('registration_mode', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none bg-white"
                >
                  {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1.5">Mode Penempatan</label>
                <select
                  value={data.placement_mode}
                  onChange={(e) => setData('placement_mode', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none bg-white"
                >
                  {placementModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center h-5 pt-0.5">
                <input
                  id="modal_is_active"
                  type="checkbox"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="w-4 h-4 text-[#16a34a] border-gray-300 rounded focus:ring-[#16a34a]"
                />
              </div>
              <div>
                <label htmlFor="modal_is_active" className="text-sm font-medium text-emerald-950 cursor-pointer">Aktifkan Skema</label>
                <p className="text-xs text-emerald-800 mt-0.5">Skema aktif akan tersedia untuk dipilih saat pembuatan periode KKN.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-emerald-950 bg-white hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50"
              >
                {processing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {editingJenis ? 'Simpan Perubahan' : 'Tambah Jenis KKN'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AppLayout>
  );
}
