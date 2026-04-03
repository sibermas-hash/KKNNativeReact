import { useState, useEffect } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { 
    Calendar, 
    Plus, 
    Edit2, 
    Trash2, 
    Search, 
    RotateCcw, 
    CheckCircle, 
    Info
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props extends PageProps {
    academicYears: {
        data: AcademicYear[];
        links: { url: string | null; label: string; active: boolean }[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [deleting, setDeleting] = useState<AcademicYear | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({ year: '', is_active: false });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/academic-years', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/academic-years/${editing.id}`, {
                onSuccess: () => { setEditing(null); form.reset(); },
            });
        } else {
            form.post('/admin/academic-years', {
                onSuccess: () => form.reset(),
            });
        }
    }

    function startEdit(ay: AcademicYear) {
        setEditing(ay);
        form.setData({ year: ay.year, is_active: ay.is_active });
    }

    function cancelEdit() {
        setEditing(null);
        form.reset();
    }

    const deleteForm = useForm({});

    function handleDelete() {
        if (!deleting) return;
        deleteForm.delete(`/admin/academic-years/${deleting.id}`, {
            onSuccess: () => setDeleting(null),
        });
    }

    return (
        <AppLayout title="Tahun Akademik">
            <Head title="Manajemen Tahun Akademik" />

            <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none italic">
                                ACADEMIC_CYCLE_MANAGEMENT_V1
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter uppercase italic leading-none">
                            Kalender <span className="text-primary italic">Akademik</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-2xl">
                            Konfigurasi siklus tahun ajaran aktif sebagai basis pendaftaran dan operasional unit KKN.
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 min-w-[200px] group hover:border-primary/30 transition-all">
                            <div className="p-3 bg-slate-900 rounded-2xl text-primary shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform">
                                <RotateCcw className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 italic">Total Archive</span>
                                <span className="text-2xl font-black text-slate-900 tabular-nums italic leading-none">{academicYears.meta?.total || 0} Records</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm sticky top-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    {editing ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                                </div>
                                {editing ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Nama Tahun Akademik</label>
                                    <FormInput
                                        placeholder="Contoh: 2024/2025"
                                        value={form.data.year}
                                        onChange={(e) => form.setData('year', e.target.value)}
                                        error={form.errors.year}
                                        label=""
                                        className="bg-slate-50 border-slate-200 text-sm font-medium rounded-2xl focus:bg-white transition-all h-12"
                                        required
                                    />
                                </div>

                                <div 
                                    className={clsx(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                        form.data.is_active ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200 hover:bg-white'
                                    )} 
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        form.data.is_active ? 'bg-primary border-primary' : 'bg-white border-slate-300'
                                    )}>
                                        {form.data.is_active && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div>
                                        <span className={clsx("text-xs font-bold block", form.data.is_active ? 'text-primary' : 'text-slate-600')}>
                                            {form.data.is_active ? 'Status Aktif' : 'Status Tidak Aktif'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">Beralih status aktif/nonaktif</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={form.processing} 
                                        className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        {editing ? 'Simpan Perubahan' : 'Tambah Data'}
                                    </button>
                                    {editing && (
                                        <button 
                                            type="button" 
                                            onClick={cancelEdit} 
                                            className="w-full py-3.5 bg-white text-slate-500 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Cari tahun akademik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-primary/50 shadow-sm transition-all"
                            />
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Tahun Akademik</th>
                                            <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                            <th className="px-8 py-5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {academicYears.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                        <Calendar className="h-12 w-12 text-slate-300" />
                                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Data Kosong</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            academicYears.data.map((ay) => (
                                                <tr key={ay.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                                                                {ay.year.split('/')[0].slice(-2)}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">{ay.year}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={clsx(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                            ay.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {ay.is_active ? (
                                                                <>
                                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Aktif
                                                                </>
                                                            ) : 'Nonaktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => startEdit(ay)} 
                                                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleting(ay)} 
                                                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {academicYears.meta && (
                                <div className="px-8 py-5 bg-slate-50/30 border-t border-slate-100">
                                    <Pagination meta={academicYears.meta} />
                                </div>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex gap-5 items-start">
                             <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500 border border-blue-100 shrink-0">
                                 <Info className="w-5 h-5" />
                             </div>
                             <div>
                                 <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1.5">Informasi Sistem</h4>
                                 <p className="text-xs text-blue-700/70 leading-relaxed font-medium">
                                     Tahun akademik yang berstatus <strong className="text-blue-900 italic">"Aktif"</strong> akan digunakan sebagai referensi utama 
                                     saat mahasiswa melakukan pendaftaran KKN. Pastikan hanya ada satu tahun akademik aktif pada satu periode pelaksanaan.
                                 </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus Data?"
                message={`Apakah Anda yakin ingin menghapus data tahun akademik "${deleting?.year}"? Perubahan ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
