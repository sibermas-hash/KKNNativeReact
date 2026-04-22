import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  RefreshCw,
  Info,
  Settings,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

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
  const [search, setSearch] = useState(filters.search ?? '');
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    code: '',
    name: '',
    description: '',
    registration_mode: 'open',
    placement_mode: 'automatic_after_approval',
    min_sks: 0,
    min_gpa: '0.00',
    color: 'emerald',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(
          '/admin/jenis-kkn',
          { search: search || undefined },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [filters.search, search]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      form.put(`/admin/jenis-kkn/${editingId}`, {
        preserveScroll: true,
        onSuccess: () => {
          form.reset();
          setEditingId(null);
        },
      });
    } else {
      form.post('/admin/jenis-kkn', {
        preserveScroll: true,
        onSuccess: () => form.reset(),
      });
    }
  };

  const startEdit = (item: JenisKkn) => {
    setEditingId(item.id);
    form.setData({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      registration_mode: item.registration_mode,
      placement_mode: item.placement_mode,
      min_sks: item.min_sks,
      min_gpa: item.min_gpa,
      color: item.color,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const destroy = (item: JenisKkn) => {
    if (confirm(`Skema "${item.name}" akan dihapus secara permanen. Lanjutkan?`)) {
      router.delete(`/admin/jenis-kkn/${item.id}`, {
        preserveScroll: true,
      });
    }
  };

  return (
    <AppLayout title="Manajemen Jenis KKN">
      <Head title="Konfigurasi Skema KKN" />

      <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-12 px-4 sm:px-6 lg:px-8">
        <PageHeader 
          title="Skema Program."
          subtitle="Konfigurasi parameter akademik dan aturan operasional untuk setiap kategori KKN."
          icon={Layers}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Total Skema',
            value: `${jenisKkn.length} Kategori`,
            icon: Database
          }}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* FORM PANEL */}
          <div className="xl:col-span-1">
            <ContentPanel
              title={editingId ? "Perbarui Skema" : "Tambah Skema Baru"}
              description="Atur parameter kualifikasi dan alur kerja skema."
              icon={editingId ? Settings : Plus}
              padding={true}
            >
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kode Skema</label>
                    <input
                      type="text"
                      value={form.data.code}
                      onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none uppercase"
                      placeholder="REGULER"
                      required
                    />
                    {form.errors.code && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.code}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Nama Program</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none"
                      placeholder="KKN Reguler"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Deskripsi Singkat</label>
                  <textarea
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium text-emerald-950 focus:border-emerald-600 outline-none min-h-[80px]"
                    placeholder="Penjelasan mengenai skema program ini..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Minimal SKS</label>
                    <input
                      type="number"
                      value={form.data.min_sks}
                      onChange={(e) => form.setData('min_sks', parseInt(e.target.value))}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none tabular-nums"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Minimal IPK</label>
                    <input
                      type="text"
                      value={form.data.min_gpa}
                      onChange={(e) => form.setData('min_gpa', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Mode Pendaftaran</label>
                  <select
                    value={form.data.registration_mode}
                    onChange={(e) => form.setData('registration_mode', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none bg-white"
                  >
                    {registrationModes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Mode Penempatan</label>
                  <select
                    value={form.data.placement_mode}
                    onChange={(e) => form.setData('placement_mode', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none bg-white"
                  >
                    {placementModes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 flex-1">
                     <input
                        type="checkbox"
                        id="is_active"
                        checked={form.data.is_active}
                        onChange={(e) => form.setData('is_active', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="is_active" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest cursor-pointer">Skema Aktif</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Urutan</label>
                    <input
                      type="number"
                      value={form.data.sort_order}
                      onChange={(e) => form.setData('sort_order', parseInt(e.target.value))}
                      className="w-16 h-8 text-center rounded-lg border border-gray-200 text-[10px] font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 h-11 border border-gray-200 text-emerald-950 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={form.processing}
                    className="flex-[2] h-11 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest disabled:opacity-50"
                  >
                    {form.processing ? <RefreshCw size={14} className="animate-spin" /> : (editingId ? <Settings size={14} /> : <CheckCircle2 size={14} />)}
                    {editingId ? 'Simpan Perubahan' : 'Daftarkan Skema'}
                  </button>
                </div>
              </form>
            </ContentPanel>
          </div>

          {/* DATA TABLE PANEL */}
          <div className="xl:col-span-2">
            <ContentPanel
              title="Indeks Skema Program"
              icon={LayoutGrid}
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="CARI SKEMA..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
              }
            >
              <PremiumTable
                headers={['Nama & Deskripsi', 'Parameter Syarat', 'Alur Kerja', 'Status', 'Opsi']}
                isEmpty={jenisKkn.length === 0}
                emptyText="Belum ada skema KKN yang terkonfigurasi."
              >
                {jenisKkn.map((item) => (
                  <PremiumTableRow key={item.id} className={clsx("group", editingId === item.id && "bg-emerald-50/50")}>
                    <PremiumTableCell>
                      <div className="flex flex-col py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{item.name}</span>
                          <span className="px-1.5 py-0.5 bg-gray-50 text-emerald-800/40 rounded text-[8px] font-black border border-emerald-50 uppercase tracking-widest">{item.code}</span>
                        </div>
                        <span className="text-[10px] font-medium text-emerald-800/40 mt-1 line-clamp-1 max-w-[200px]">{item.description || 'Tidak ada deskripsi.'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <Database size={10} className="text-emerald-600" />
                           <span className="text-[10px] font-black text-emerald-950 tabular-nums">{item.min_sks} SKS</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <LayoutGrid size={10} className="text-emerald-600" />
                           <span className="text-[10px] font-black text-emerald-950 tabular-nums">IPK {item.min_gpa}</span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                       <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-emerald-950 uppercase tracking-tighter leading-none">{item.registration_mode_label}</span>
                        <span className="text-[9px] font-bold text-emerald-800/30 uppercase tracking-tighter leading-none">{item.placement_mode_label}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <StatusTag status={item.is_active ? 'Aktif' : 'Nonaktif'} />
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/jenis-kkn/${item.id}`}
                          className="h-8 px-3 bg-white border border-gray-100 text-emerald-950 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase no-underline"
                        >
                          <Eye size={14} /> Detail
                        </Link>
                        <button
                          onClick={() => startEdit(item)}
                          className="h-8 w-8 flex items-center justify-center text-emerald-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => destroy(item)}
                          className="h-8 w-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>

            <div className="mt-6 p-6 bg-emerald-950 rounded-2xl text-white relative overflow-hidden shadow-xl border-b-4 border-emerald-900">
               <div className="absolute top-0 right-0 opacity-5 -mr-10 -mt-10 rotate-12 pointer-events-none"><Layers size={200} /></div>
               <div className="flex items-start gap-4 relative z-10">
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 border border-white/10 shrink-0">
                    <Info size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest">Konteks Operasional Skema</h4>
                    <p className="text-[10px] font-medium text-emerald-400/70 uppercase tracking-widest leading-relaxed">
                      Setiap skema KKN memiliki aturan validasi pendaftaran yang berbeda. Pastikan Ambang Batas SKS dan IPK telah sesuai dengan Panduan KKN UIN SAIZU untuk menjamin validitas pendaftar secara otomatis oleh sistem.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}