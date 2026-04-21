import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Plus, 
  Trash2, 
  Eye, 
  Edit2, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Database,
  Info,
  Settings2,
  ChevronRight,
  Target,
  ShieldCheck,
  Zap
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-24 font-sans">
        
        <PageHeader
          title="Skema Program."
          subtitle="Pengaturan skema program, kualifikasi peserta, dan mode pendaftaran KKN institusional."
          icon={Layers}
          groupLabel="Data Master Sistem"
        >
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-white border border-emerald-100 rounded-xl px-4 py-2.5 mr-2">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-0.5">Status Skema</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                        <ShieldCheck size={10} className="text-emerald-600 flex-shrink-0" />
                        <span>{jenisKkn.filter(j => j.is_active).length} Aktif</span>
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard label="Total Skema" value={jenisKkn.length} icon={Layers} variant="gray" />
          <StatCard label="Skema Aktif" value={jenisKkn.filter(j => j.is_active).length} icon={Target} variant="success" />
          <StatCard label="Total Periode" value={jenisKkn.reduce((acc, j) => acc + (j.periodes_count || 0), 0)} icon={Database} variant="gray" />
          <StatCard label="Mode Terbuka" value={jenisKkn.filter(j => j.registration_mode === 'open').length} icon={Zap} variant="info" />
        </div>

        {/* --- REGISTRATION FORM (STRUCTURED BY SECTIONS) --- */}
        <ContentPanel 
          title={editingJenis ? 'Koreksi Skema' : 'Registrasi Skema'} 
          description={editingJenis ? `Memperbarui parameter skema ${editingJenis.code}` : 'Daftarkan skema pelaksanaan KKN baru.'}
          icon={editingJenis ? Edit2 : Plus}
          padding={true}
        >
          <form onSubmit={submit} className="space-y-8">
            
            {/* --- SECTION 1: DATA DASAR --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Layers size={16} className="text-emerald-700" />
                </div>
                <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Informasi Dasar Skema</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="field-name" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Nama Jenis KKN</label>
                  <input
                    id="field-name"
                    type="text"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="Contoh: KKN Reguler, KKN Tematik"
                    required
                  />
                  {form.errors.name && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="field-code" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Kode Skema</label>
                  <input
                    id="field-code"
                    type="text"
                    value={form.data.code}
                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                    disabled={!!editingJenis}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-emerald-800/40 shadow-sm"
                    placeholder="Contoh: REG, TEM, INT"
                    required
                  />
                  {form.errors.code && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.code}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="field-sort-order" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Urutan Tampil</label>
                  <input
                    id="field-sort-order"
                    type="number"
                    value={form.data.sort_order}
                    onChange={(e) => form.setData('sort_order', parseInt(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 text-center focus:border-emerald-600 outline-none transition-all shadow-sm"
                    placeholder="0"
                  />
                  {form.errors.sort_order && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.sort_order}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="field-description" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Deskripsi Skema</label>
                <textarea
                  id="field-description"
                  value={form.data.description}
                  onChange={(e) => form.setData('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-300 shadow-sm resize-none"
                  placeholder="Jelaskan karakteristik, tujuan, dan target peserta skema ini (opsional)"
                  rows={3}
                />
                {form.errors.description && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.description}</p>}
              </div>
            </div>

            {/* --- SECTION 2: KUALIFIKASI PESERTA --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Target size={16} className="text-emerald-700" />
                </div>
                <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Kualifikasi Akademik Peserta</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="field-min-sks" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Minimum SKS (Kredit Semester)</label>
                  <input
                    id="field-min-sks"
                    type="number"
                    value={form.data.min_sks}
                    onChange={(e) => form.setData('min_sks', parseInt(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-emerald-50/20 text-xs font-black text-emerald-950 text-center focus:border-emerald-600 outline-none shadow-sm"
                    placeholder="100"
                  />
                  {form.errors.min_sks && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.min_sks}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="field-min-gpa" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Minimum IPK (Indeks Prestasi)</label>
                  <input
                    id="field-min-gpa"
                    type="text"
                    value={form.data.min_gpa}
                    onChange={(e) => form.setData('min_gpa', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-emerald-100 bg-emerald-50/20 text-xs font-black text-emerald-950 text-center focus:border-emerald-600 outline-none shadow-sm"
                    placeholder="0.00"
                  />
                  {form.errors.min_gpa && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.min_gpa}</p>}
                </div>
              </div>
            </div>

            {/* --- SECTION 3: KONFIGURASI OPERASIONAL --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Settings2 size={16} className="text-emerald-700" />
                </div>
                <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Pengaturan Operasional</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="field-registration-mode" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Mode Pendaftaran</label>
                  <div className="relative group">
                    <select
                      id="field-registration-mode"
                      value={form.data.registration_mode}
                      onChange={(e) => form.setData('registration_mode', e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-[10px] font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase tracking-tight"
                    >
                      {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-90 transition-transform"/>
                  </div>
                  {form.errors.registration_mode && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.registration_mode}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="field-placement-mode" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Mode Penempatan</label>
                  <div className="relative group">
                    <select
                      id="field-placement-mode"
                      value={form.data.placement_mode}
                      onChange={(e) => form.setData('placement_mode', e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-[10px] font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase tracking-tight"
                    >
                      {placementModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-90 transition-transform"/>
                  </div>
                  {form.errors.placement_mode && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.placement_mode}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="field-color" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Warna Identitas Skema</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="field-color"
                      type="color"
                      value={form.data.color}
                      onChange={(e) => form.setData('color', e.target.value)}
                      className="h-11 w-16 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-emerald-700">{form.data.color}</span>
                  </div>
                  {form.errors.color && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">{form.errors.color}</p>}
                </div>
              </div>
            </div>

            {/* --- SECTION 4: AKTIVASI SKEMA --- */}
            <div className="space-y-4 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.data.is_active}
                  onChange={(e) => form.setData('is_active', e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="is_active" className="text-[10px] font-black text-emerald-950 cursor-pointer uppercase tracking-widest">Aktifkan Skema Ini</label>
                  <p className="text-[9px] font-bold text-emerald-700/70 uppercase tracking-tight leading-relaxed">Skema yang aktif akan tersedia dalam proses pembuatan periode dan pendaftaran peserta. Nonaktifkan untuk menyembunyikan skema dari operasional tanpa menghapus data historis.</p>
                </div>
              </div>
            </div>

            {/* --- FORM ACTIONS --- */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
              {editingJenis && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full sm:w-auto h-11 px-6 border border-gray-200 text-emerald-950 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest active:scale-95"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={form.processing}
                className="w-full sm:w-auto h-11 px-8 bg-emerald-900 text-white text-xs font-black rounded-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/10 active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                {form.processing ? <RefreshCw size={14} className="animate-spin" /> : editingJenis ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                {editingJenis ? 'Simpan Perubahan' : 'Daftarkan Skema'}
              </button>
            </div>
          </form>
        </ContentPanel>

        {/* --- DATA LIST PANEL (FULL WIDTH) --- */}
        <div className="space-y-6">
          <ContentPanel 
            title="Daftar Skema KKN" 
            description="Kelola semua skema program KKN yang terdaftar dalam sistem"
            icon={Layers} 
            padding={false}
            headerAction={
              <form onSubmit={handleSearch} className="w-full md:w-auto">
                <SearchInput 
                  placeholder="CARI SKEMA..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-80"
                />
              </form>
            }
            footer={
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Total {jenisKkn.length} Skema Terdaftar
                  </span>
                </div>
                <div className="text-[9px] font-bold text-emerald-700/50 uppercase tracking-tight">
                  Aktif: {jenisKkn.filter(j => j.is_active).length} &middot; Nonaktif: {jenisKkn.filter(j => !j.is_active).length}
                </div>
              </div>
            }
          >
            <PremiumTable
              headers={['Nama & Kode', 'Kualifikasi', 'Mode', 'Status', 'Aksi']}
              isEmpty={jenisKkn.length === 0}
              emptyText="Data skema pendaftaran tidak ditemukan."
            >
              {jenisKkn.map((jenis) => (
                <PremiumTableRow key={jenis.id} className={clsx("group", editingJenis?.id === jenis.id && "bg-emerald-50/50")}>
                  <PremiumTableCell>
                    <div className="flex flex-col py-1 space-y-1">
                      <span className="text-[13px] font-black text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-tight">{jenis.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-wider inline-block px-2 py-1 bg-emerald-50 rounded-md w-fit">KODE: {jenis.code}</span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-black text-emerald-900">Min. {jenis.min_sks} SKS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-black text-emerald-900">IPK: {jenis.min_gpa}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tighter">{jenis.registration_mode_label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings2 size={12} className="text-emerald-700/50 flex-shrink-0" />
                        <span className="text-[9px] font-bold text-emerald-700/50 uppercase tracking-widest">{jenis.placement_mode_label}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <StatusTag status={jenis.is_active ? 'Aktif' : 'Nonaktif'} />
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Link
                        href={`/admin/jenis-kkn/${jenis.id}`}
                        className="h-9 px-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-2 text-[10px] font-black uppercase whitespace-nowrap"
                        title="Lihat detail skema ini"
                      >
                        <Eye size={14} /> Detail
                      </Link>
                      <button
                        onClick={() => startEdit(jenis)}
                        className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 transition-all shadow-sm"
                        title="Edit skema ini"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(jenis.id)}
                        disabled={jenis.periodes_count > 0}
                        className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-100 active:scale-95 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title={jenis.periodes_count > 0 ? `Tidak dapat dihapus (Memiliki ${jenis.periodes_count} periode)` : 'Hapus skema ini'}
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </ContentPanel>

          {/* --- GOVERNANCE FOOTER --- */}
          <div className="bg-emerald-950 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border-b-[6px] border-emerald-900">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 -mr-16 -mt-16 pointer-events-none"><ShieldCheck size={320} /></div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 relative z-10">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner shrink-0 backdrop-blur-sm">
                <Info size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-2 md:space-y-3">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">Integritas Skema Akademik</h2>
                <p className="text-xs font-medium text-emerald-400/70 uppercase tracking-widest leading-relaxed">
                  Setiap skema menentukan ambang batas kualifikasi mahasiswa di seluruh periode. Perubahan parameter akan memengaruhi validasi kelayakan pendaftaran pada semua periode aktif yang menggunakan skema ini. Verifikasi kembali kriteria SKS dan IPK sesuai kebijakan LPPM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
