import { useEffect, useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination } from '@/Components/ui';
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
  Zap,
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

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
    form.reset();
    form.clearErrors();
  };

  const openCreateForm = () => {
    cancelForm();
    setShowForm(true);
  };

  const handleExport = () => {
    window.location.href = '/admin/periode/ekspor';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.clearErrors();
    if (editing) {
      form.put(`/admin/periode/${editing.id}`, { onSuccess: () => cancelForm() });
    } else {
      form.post('/admin/periode', { onSuccess: () => cancelForm() });
    }
  };

  const startEdit = (period: PeriodData) => {
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
  };

  return (
    <AppLayout title="Siklus Periode KKN">
      <Head title="Periode | POS-KKN" />

      <div className="space-y-8 font-sans antialiased">
        {/* SYSTEM HEADER */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">SIKLUS PERIODE KKN</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    TOTAL: {periods.meta?.total || 0} SIKLUS TERDAFTAR
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleExport}
                    className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <Download size={14} />
                    EXCEL
                </button>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="h-10 px-6 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={14} />
                        TAMBAH SIKLUS
                    </button>
                )}
            </div>
        </div>

        {/* ENTRY FORM */}
        {showForm && (
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-black text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                    <span>{editing ? 'EDIT DATA SIKLUS' : 'ENTRY DATA BARU'}</span>
                    <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TAHUN AKADEMIK</label>
                            <FormSelect
                                options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                                value={form.data.academic_year_id}
                                onChange={(e) => form.setData('academic_year_id', e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200 rounded font-bold text-xs uppercase"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VOL/PERIODE</label>
                            <FormInput
                                type="number"
                                placeholder="EX: 53"
                                value={form.data.periode}
                                onChange={(e) => form.setData('periode', e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200 rounded font-bold text-xs uppercase"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">JENIS KKN</label>
                            <FormInput
                                placeholder="EX: REGULER"
                                value={form.data.jenis}
                                onChange={(e) => form.setData('jenis', e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200 rounded font-bold text-xs uppercase"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KUOTA PESERTA</label>
                            <FormInput
                                type="number"
                                value={form.data.kuota}
                                onChange={(e) => form.setData('kuota', e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200 rounded font-bold text-xs uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-white">
                                <Calendar size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">REGISTRASI MAHASISWA</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required className="bg-white border-slate-200 rounded text-xs font-bold" />
                                <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required className="bg-white border-slate-200 rounded text-xs font-bold" />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border border-slate-200 rounded space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-white">
                                <Zap size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">PELAKSANAAN LAPANGAN</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required className="bg-white border-slate-200 rounded text-xs font-bold" />
                                <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required className="bg-white border-slate-200 rounded text-xs font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => form.setData('is_active', !form.data.is_active)}>
                            <div className={clsx(
                                "w-10 h-5 rounded relative transition-colors duration-200",
                                form.data.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                            )}>
                                <div className={clsx(
                                    "absolute top-1 left-1 w-3 h-3 bg-white rounded transition-transform duration-200",
                                    form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SIKLUS UTAMA (AKTIF)</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button type="button" onClick={cancelForm} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">BATAL</button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-11 px-8 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                            >
                                {form.processing ? 'SAVING...' : 'SIMPAN DATA'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* SEARCH BAR */}
        {!showForm && (
            <div className="bg-white border border-slate-200 p-4">
                <div className="relative max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="CARI NAMA PERIODE ATAU TAHUN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wider focus:bg-white focus:border-emerald-500 transition-all outline-none"
                    />
                </div>
            </div>
        )}

        {/* DATA GRID */}
        {!showForm && (
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SIKLUS / VOL</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TAHUN</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">DURASI</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">KAPASITAS</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">STATUS</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">INSTRUMEN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {periods.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">TIDAK ADA DATA</td>
                                </tr>
                            ) : (
                                periods.data.map((period) => (
                                    <tr key={period.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex flex-col items-center justify-center rounded bg-slate-900 text-emerald-500 font-black border border-slate-800">
                                                    <span className="text-[7px] leading-none mb-0.5 opacity-60">VOL</span>
                                                    <span className="text-sm">{period.periode ?? '-'}</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{period.jenis ?? 'UNSET'}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{period.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                {period.academic_year?.year || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="text-[10px] font-black text-slate-800 uppercase">{period.duration_days} HARI KKN</div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                {period.start_date ? new Date(period.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} - {period.end_date ? new Date(period.end_date).toLocaleDateString('id-ID', { year: 'numeric' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="text-[9px] font-black text-slate-700 uppercase">{period.participants_count} / {period.kuota || '∞'}</div>
                                                <div className="w-16 h-1 bg-slate-100 rounded overflow-hidden">
                                                    <div 
                                                        className={clsx(
                                                            "h-full transition-all duration-500",
                                                            period.capacity_percentage > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                                                        )}
                                                        style={{ width: `${Math.min(period.capacity_percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {period.is_active ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-200">ACTIVE</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200">ARCHIVED</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right pr-6">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => setDuplicating(period)} className="h-8 w-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm" title="COPY"><Copy size={12} /></button>
                                                <button onClick={() => startEdit(period)} className="h-8 w-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm" title="EDIT"><Edit2 size={12} /></button>
                                                <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className={clsx("h-8 w-8 flex items-center justify-center rounded transition-all", period.can_delete ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm" : "bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed")} title="DELETE"><Trash2 size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>

                {periods.meta && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-widest">TOTAL: {periods.meta.total} SIKLUS</span>
                        <Pagination meta={periods.meta} />
                    </div>
                )}
            </div>
        )}

        <ConfirmDialog
            open={!!duplicating}
            onClose={() => !duplicateForm.processing && setDuplicating(null)}
            onConfirm={() => duplicating && duplicateForm.post(`/admin/periode/${duplicating.id}/duplikasi`, { onSuccess: () => setDuplicating(null) })}
            title="DUPLIKASI DATA"
            message={`DUPLIKAT DATA PERIODE "${duplicating?.name}"?`}
            processing={duplicateForm.processing}
            confirmLabel="PROCESS"
        />

        <ConfirmDialog
            open={!!deleting}
            onClose={() => !deleteForm.processing && setDeleting(null)}
            onConfirm={() => deleting && deleteForm.delete(`/admin/periode/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
            title="HAPUS DATA"
            message={deleting?.can_delete ? `HAPUS PERMANEN DATA PERIODE "${deleting.name}"?` : (deleting?.delete_blocker ?? 'DATA TIDAK DAPAT DIHAPUS.')}
            processing={deleteForm.processing}
            confirmLabel="DELETE"
        />
      </div>
    </AppLayout>
  );
}
