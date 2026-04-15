import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Plus, Trash2, Eye, Edit2, Settings2, Search, X, Layers, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '@/Components/ui/Modal';

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
      <Head title="Manajemen Jenis KKN" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-500">Data Master Sistem</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Jenis Program KKN</h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              Pengaturan skema program, kualifikasi peserta, dan mode pendaftaran KKN.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-2 text-sm text-gray-600">
              <Layers size={16} className="text-emerald-600" />
              <span><strong className="text-gray-900">{jenisKkn.length}</strong> Jenis Terdaftar</span>
            </div>
            <button
              onClick={openCreateForm}
              className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Jenis KKN
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau kode jenis KKN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
              />
            </form>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama & Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kualifikasi Peserta</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mode Operasional</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jenisKkn.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      Tidak ada jenis KKN yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  jenisKkn.map((jenis) => (
                    <tr key={jenis.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{jenis.name}</span>
                          <span className="text-xs font-mono text-gray-400 mt-0.5">Kode: {jenis.code}</span>
                          <span className="text-xs text-emerald-600 mt-1">{jenis.periodes_count} Periode Terkait</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded w-fit">
                            Min. {jenis.min_sks} SKS
                          </span>
                          <span className="text-xs text-gray-500">IPK Min: {jenis.min_gpa}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-800">{jenis.registration_mode_label}</span>
                          <span className="text-xs text-gray-500">{jenis.placement_mode_label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          jenis.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        )}>
                          {jenis.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/jenis-kkn/${jenis.id}`}
                            className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors"
                          >
                            Detail
                          </Link>
                          <button
                            onClick={() => openEditForm(jenis)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(jenis.id)}
                            disabled={jenis.periodes_count > 0}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent disabled:opacity-30 disabled:cursor-not-allowed"
                            title={jenis.periodes_count > 0 ? 'Tidak dapat dihapus karena memiliki periode terkait' : 'Hapus'}
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
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="2xl">
        <div className="bg-white rounded-lg font-sans">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {editingJenis ? 'Edit Jenis KKN' : 'Tambah Jenis KKN Baru'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Isi parameter kualifikasi dan mode operasional program.</p>
            </div>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nama Jenis KKN <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Contoh: KKN Reguler"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Kode Unik <span className="text-rose-500">*</span>
                  {editingJenis && <span className="ml-1 text-xs text-gray-400">(tidak dapat diubah)</span>}
                </label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  disabled={!!editingJenis}
                  placeholder="Contoh: REGULER"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                />
                {errors.code && <p className="text-xs text-rose-600">{errors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Minimal SKS <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    value={data.min_sks}
                    onChange={(e) => setData('min_sks', parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900 pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">SKS</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Minimal IPK <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={data.min_gpa}
                    onChange={(e) => setData('min_gpa', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900 pr-24"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">4.00 skala</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Mode Pendaftaran</label>
                <select
                  value={data.registration_mode}
                  onChange={(e) => setData('registration_mode', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                >
                  {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Mode Penempatan</label>
                <select
                  value={data.placement_mode}
                  onChange={(e) => setData('placement_mode', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                >
                  {placementModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative" onClick={() => setData('is_active', !data.is_active)}>
                  <div className={clsx('w-10 h-6 rounded-full transition-colors', data.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
                  <div className={clsx('absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-transform', data.is_active ? 'translate-x-5' : 'translate-x-1')} />
                </div>
                <span className="text-sm font-medium text-gray-700">{data.is_active ? 'Aktif (tersedia untuk periode)' : 'Nonaktif (tersembunyi)'}</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">
                Batal
              </button>
              <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2">
                {processing && <RefreshCw size={14} className="animate-spin" />}
                {editingJenis ? 'Simpan Perubahan' : 'Tambah Jenis KKN'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AppLayout>
  );
}
