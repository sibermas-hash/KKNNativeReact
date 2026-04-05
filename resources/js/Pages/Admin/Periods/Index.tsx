import { useEffect, useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Download,
  CheckCircle2,
  Zap,
  ArrowRight,
  MoreVertical,
  X
} from "lucide-react";
import { clsx } from 'clsx';

interface AcademicYearOption {
  id: number;
  year: string;
}

interface PeriodData {
  id: number;
  academic_year: AcademicYearOption | null;
  periode: number | null;
  jenis: string | null;
  name: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  grading_start: string | null;
  grading_end: string | null;
  kuota: number | null;
  is_active: boolean;
  groups_count: number;
  participants_count: number;
  dpl_periods_count: number;
  can_delete: boolean;
  delete_blocker: string | null;
  duration_days: number;
  registration_duration_days: number;
  capacity_percentage: number;
}

interface Props extends PageProps {
  periods: {
    data: PeriodData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  academicYears: AcademicYearOption[];
  filters: {
    search?: string;
  };
}

const initialFormData = {
  academic_year_id: '',
  periode: '',
  jenis: '',
  name: '',
  start_date: '',
  end_date: '',
  registration_start: '',
  registration_end: '',
  grading_start: '',
  grading_end: '',
  kuota: '2000',
  is_active: false,
};

export default function PeriodsIndex({ periods, academicYears, filters }: Props) {
  const [editing, setEditing] = useState<PeriodData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<PeriodData | null>(null);
  const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const form = useForm(initialFormData);
  const deleteForm = useForm({});
  const duplicateForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get('/admin/periode', { search }, { preserveState: true, replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters.search]);

  useEffect(() => {
    if (!editing && form.data.periode && form.data.jenis) {
      const name = `Periode ${form.data.periode} - ${form.data.jenis}`;
      form.setData('name', name);
    }
  }, [form, form.data.periode, form.data.jenis, editing]);

  function cancelForm() {
    setEditing(null);
    setShowForm(false);
    form.reset();
    form.clearErrors();
  }

  function openCreateForm() {
    cancelForm();
    setShowForm(true);
  }

  function handleExport() {
    window.location.href = '/admin/periode/ekspor';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    form.clearErrors();

    if (editing) {
      form.put(`/admin/periode/${editing.id}`, {
        onSuccess: () => cancelForm(),
      });
      return;
    }

    form.post('/admin/periode', {
      onSuccess: () => cancelForm(),
    });
  }

  function startEdit(period: PeriodData) {
    setEditing(period);
    setShowForm(true);
    form.clearErrors();
    form.setData({
      academic_year_id: period.academic_year ? String(period.academic_year.id) : '',
      periode: period.periode?.toString() ?? '',
      jenis: period.jenis ?? '',
      name: period.name,
      start_date: period.start_date,
      end_date: period.end_date,
      registration_start: period.registration_start,
      registration_end: period.registration_end,
      grading_start: period.grading_start ?? '',
      grading_end: period.grading_end ?? '',
      kuota: period.kuota?.toString() ?? '',
      is_active: period.is_active,
    });
  }

  return (
    <AppLayout title="PERIODE KKN">
      <Head title="Periode KKN | KKN UIN SAIZU" />

      <div className="space-y-6">
        
        {/* --- COMPACT HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Zap size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Siklus Periode KKN</h2>
                    <p className="text-sm text-slate-500 font-medium">Total: {periods.meta?.total || 0} siklus | Aktif: {periods.data.find(p => p.is_active)?.name || '-'}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <button
                    onClick={handleExport}
                    className="h-11 px-6 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 inline-flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Ekspor Excel
                </button>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="h-11 px-6 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-95 inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Periode
                    </button>
                )}
            </div>
        </div>

        {/* --- SEARCH BAR --- */}
        {!showForm && (
            <div className="relative w-full max-w-lg group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    placeholder="Cari nama periode atau tahun..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                />
            </div>
        )}

        {/* --- ENTRY FORM --- */}
        {showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-900 rounded-lg text-white flex items-center justify-center">
                            {editing ? <Edit2 size={16} /> : <Plus size={16} />}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{editing ? 'Edit Periode' : 'Tambah Periode Baru'}</h3>
                    </div>
                    <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tahun Akademik</label>
                            <FormSelect
                                options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                                value={form.data.academic_year_id}
                                onChange={(e) => form.setData('academic_year_id', e.target.value)}
                                required
                                className="bg-slate-50/50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nomor Periode</label>
                            <FormInput
                                type="number"
                                placeholder="E.G. 53"
                                value={form.data.periode}
                                onChange={(e) => form.setData('periode', e.target.value)}
                                required
                                className="bg-slate-50/50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Jenis KKN</label>
                            <FormInput
                                placeholder="E.G. REGULER"
                                value={form.data.jenis}
                                onChange={(e) => form.setData('jenis', e.target.value)}
                                required
                                className="bg-slate-50/50 border-slate-200 rounded-xl uppercase font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kuota Peserta</label>
                            <FormInput
                                type="number"
                                value={form.data.kuota}
                                onChange={(e) => form.setData('kuota', e.target.value)}
                                required
                                className="bg-slate-50/50 border-slate-200 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col gap-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-white">
                                <Calendar size={16} className="text-emerald-600" />
                                <span className="text-xs font-bold text-slate-700">Jadwal Registrasi</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mulai</label>
                                    <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required className="bg-white rounded-lg text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</label>
                                    <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required className="bg-white rounded-lg text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-50 flex flex-col gap-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-white">
                                <Zap size={16} className="text-emerald-600" />
                                <span className="text-xs font-bold text-slate-700">Pelaksanaan Lapangan</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mulai</label>
                                    <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required className="bg-white border-emerald-100 rounded-lg text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</label>
                                    <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required className="bg-white border-emerald-100 rounded-lg text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => form.setData('is_active', !form.data.is_active)}>
                            <div className={clsx(
                                "w-10 h-5 rounded-full relative transition-colors duration-200",
                                form.data.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                            )}>
                                <div className={clsx(
                                    "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                                    form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Set Sebagai Siklus Utama</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button type="button" onClick={cancelForm} className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex-1 sm:flex-none h-11 px-10 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                            >
                                {form.processing ? 'Menyimpan...' : 'Simpan Siklus'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* --- DATA TABLE --- */}
        {!showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identitas Siklus</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tahun</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Durasi</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Peserta</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Opsi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {periods.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-sm text-slate-400 italic">
                                        Tidak ada siklus periode ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                periods.data.map((period) => (
                                    <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <span className="text-[8px] font-bold opacity-60 leading-none">VOL</span>
                                                    <span className="text-base font-bold">{period.periode ?? '-'}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">{period.jenis ?? 'UNSET'}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{period.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                {period.academic_year?.year || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="text-xs font-bold text-slate-800">{period.duration_days} Hari</div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {period.start_date ? new Date(period.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} - {period.end_date ? new Date(period.end_date).toLocaleDateString('id-ID', { year: 'numeric' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="text-xs font-bold text-slate-700">{period.participants_count} / {period.kuota || '∞'}</div>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={clsx(
                                                            "h-full rounded-full transition-all duration-500",
                                                            period.capacity_percentage > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        )}
                                                        style={{ width: `${Math.min(period.capacity_percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {period.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">
                                                    Arsip
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setDuplicating(period)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm" title="Duplikasi">
                                                    <Copy size={16} />
                                                </button>
                                                <button onClick={() => startEdit(period)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className={clsx("h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 transition-all shadow-sm", period.can_delete ? "text-slate-400 hover:text-rose-500 hover:border-rose-200" : "opacity-20 cursor-not-allowed")} title="Hapus">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>

                {periods.meta && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <Pagination meta={periods.meta} />
                    </div>
                )}
            </div>
        )}

        {/* --- SIMPLE FOOTER INFO --- */}
        {!showForm && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sistem Manajemen Siklus KKN Terverifikasi</span>
            </div>
        )}

        <ConfirmDialog
            open={!!duplicating}
            onClose={() => !duplicateForm.processing && setDuplicating(null)}
            onConfirm={() => duplicating && duplicateForm.post(`/admin/periode/${duplicating.id}/duplikasi`, { onSuccess: () => setDuplicating(null) })}
            title="DUPLIKASI PERIODE"
            message={`Buat salinan data periode dari "${duplicating?.name}"?`}
            processing={duplicateForm.processing}
            confirmLabel="Ya, Duplikat"
        />

        <ConfirmDialog
            open={!!deleting}
            onClose={() => !deleteForm.processing && setDeleting(null)}
            onConfirm={() => deleting && deleteForm.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
            title="HAPUS PERIODE"
            message={deleting?.can_delete ? `Apakah Anda yakin ingin menghapus periode "${deleting.name}"?` : (deleting?.delete_blocker ?? 'Data tidak dapat dihapus.')}
            processing={deleteForm.processing}
            confirmLabel="Hapus Data"
        />
      </div>
    </AppLayout>
  );
}
