import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Plus, 
  Trash2, 
  Eye, 
  Edit2, 
  Search, 
  X, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Database,
  Info,
  Settings2,
  ChevronRight,
  Target
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';
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
  const [editingJenis, setEditingJenis] = useState<JenisKkn | null>(null);

  const form = useForm({
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

  const startEdit = (jenis: JenisKkn) => {
    setEditingJenis(jenis);
    form.setData({
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
  };

  const cancelEdit = () => {
    setEditingJenis(null);
    form.reset();
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus jenis KKN ini? Data terkait mungkin akan terpengaruh.')) {
      router.delete(`/admin/jenis-kkn/${id}`);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJenis) {
      form.patch(`/admin/jenis-kkn/${editingJenis.id}`, { 
        onSuccess: () => {
          setEditingJenis(null);
          form.reset();
        }
      });
    } else {
      form.post('/admin/jenis-kkn', { 
        onSuccess: () => form.reset() 
      });
    }
  };

  return (
    <AppLayout title="Jenis Program KKN">
      <Head title="Jenis Program KKN" />

      <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
        <PageHeader
          title="Skema Program."
          subtitle="Pengaturan skema program, kualifikasi peserta, dan mode pendaftaran KKN institusional."
          icon={Layers}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Skema Aktif',
            value: `${jenisKkn.filter(j => j.is_active).length} Skema`,
            icon: Target,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- FORM PANEL (Left 1/3) --- */}
          <div className="lg:col-span-1">
            <ContentPanel 
              title={editingJenis ? 'Koreksi Skema' : 'Registrasi Skema'} 
              description={editingJenis ? `Memperbarui parameter skema ${editingJenis.code}` : 'Daftarkan skema pelaksanaan KKN baru.'}
              icon={editingJenis ? Edit2 : Plus}
              padding={true}
            >
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Nama Jenis KKN</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Misal: KKN Reguler"
                    />
                    {form.errors.name && <p className="text-xs font-medium text-rose-600 mt-1">{form.errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Kode Skema</label>
                    <input
                      type="text"
                      value={form.data.code}
                      onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                      disabled={!!editingJenis}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-emerald-800/40"
                      placeholder="Misal: REGULER"
                    />
                    {form.errors.code && <p className="text-xs font-medium text-rose-600 mt-1">{form.errors.code}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider pl-1">Min. SKS</label>
                      <input
                        type="number"
                        value={form.data.min_sks}
                        onChange={(e) => form.setData('min_sks', parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider pl-1">Min. IPK</label>
                      <input
                        type="text"
                        value={form.data.min_gpa}
                        onChange={(e) => form.setData('min_gpa', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-100 bg-white text-sm font-semibold text-emerald-950 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider pl-1">Mode Pendaftaran</label>
                    <select
                      value={form.data.registration_mode}
                      onChange={(e) => form.setData('registration_mode', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none bg-white appearance-none"
                    >
                      {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/30">
                    <div className="flex items-center h-5 pt-0.5">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={form.data.is_active}
                        onChange={(e) => form.setData('is_active', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="is_active" className="text-sm font-bold text-emerald-950 cursor-pointer uppercase tracking-wider">Aktifkan Skema</label>
                      <p className="text-xs font-medium text-emerald-800 mt-0.5">Skema akan tersedia untuk pembuatan periode.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={form.processing}
                    className="w-full h-11 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] uppercase tracking-wider disabled:opacity-50"
                  >
                    {form.processing ? <RefreshCw size={14} className="animate-spin" /> : editingJenis ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                    {editingJenis ? 'Simpan Perubahan' : 'Daftarkan Skema'}
                  </button>
                  {editingJenis && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full h-11 bg-white border border-gray-200 text-emerald-900 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-wider"
                    >
                      Batal Koreksi
                    </button>
                  )}
                </div>
              </form>
            </ContentPanel>
          </div>

          {/* --- DATA LIST PANEL (Right 2/3) --- */}
          <div className="lg:col-span-2 space-y-6">
            <ContentPanel 
              title="Daftar Skema KKN" 
              icon={Layers} 
              padding={false}
              headerAction={
                <form onSubmit={handleSearch}>
                  <SearchInput 
                    placeholder="CARI SKEMA..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                </form>
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Data Sistem &middot; {jenisKkn.length} Jenis Terdaftar
                  </span>
                </div>
              }
            >
              <PremiumTable
                headers={['Nama & Kode', 'Kualifikasi', 'Mode', 'Status', 'Aksi']}
                isEmpty={jenisKkn.length === 0}
                emptyText="Data skema pendaftaran tidak ditemukan."
              >
                {jenisKkn.map((jenis) => (
                  <PremiumTableRow key={jenis.id} className="group">
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">{jenis.name}</span>
                        <span className="text-xs font-medium text-emerald-800/60 mt-0.5">KODE: {jenis.code}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                           Min. {jenis.min_sks} SKS
                        </span>
                        <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                           IPK Min: {jenis.min_gpa}
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-emerald-950 leading-tight">{jenis.registration_mode_label}</span>
                        <span className="text-xs font-medium text-emerald-800/60 leading-tight">{jenis.placement_mode_label}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <StatusTag status={jenis.is_active ? 'Aktif' : 'Nonaktif'} />
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/jenis-kkn/${jenis.id}`}
                          className="h-8 w-8 flex items-center justify-center bg-gray-50 border border-gray-100 text-emerald-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                          title="Detail"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => startEdit(jenis)}
                          className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-emerald-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(jenis.id)}
                          disabled={jenis.periodes_count > 0}
                          className="h-8 w-8 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm disabled:opacity-30"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>

            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50 flex items-center gap-6">
               <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
                  <Info size={24} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Kemandirian Skema</h4>
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    Setiap skema memiliki kriteria validasi unik. Pastikan ambang batas SKS dan IPK telah sesuai dengan standar akademik untuk menjamin objektivitas pendaftaran.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
