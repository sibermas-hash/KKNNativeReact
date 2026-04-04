import { useState } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Calendar,
    Plus,
    Search,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Trash2,
    CalendarCheck,
    History,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AcademicYear {
    id: number;
    year: string;
    is_active: boolean;
}

interface Props {
    academicYears: AcademicYear[];
    filters: { search?: string };
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { data, setData, post, processing, errors, reset } = useForm({
        year: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.academic-years.index'), { search }, { preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.academic-years.store'), {
            onSuccess: () => reset(),
        });
    };

    const toggleStatus = (id: number) => {
        if (confirm('Apakah Anda yakin ingin mengubah status aktivasi tahun akademik ini?')) {
            router.patch(route('admin.academic-years.toggle', id));
        }
    };

    const destroy = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(route('admin.academic-years.destroy', id));
        }
    };

    return (
        <AppLayout title="Tahun Akademik">
            <Head title="Manajemen Tahun Akademik" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tahun Akademik</h1>
                        <p className="text-sm text-slate-500 mt-1">Kelola siklus tahun ajaran aktif untuk operasional KKN.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
                            <CalendarCheck className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">
                                {academicYears.filter(y => y.is_active).length} Tahun Aktif
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section - Side Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900">Tambah Tahun</h3>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Identitas Tahun
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 2024/2025"
                                        value={data.year}
                                        onChange={(e) => setData('year', e.target.value)}
                                        className={clsx(
                                            "w-full px-4 py-3 rounded-lg bg-slate-50 border transition-all focus:ring-4 focus:ring-emerald-500/10",
                                            errors.year ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-emerald-500"
                                        )}
                                    />
                                    {errors.year && <p className="mt-2 text-xs text-rose-500 italic font-medium">{errors.year}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                                >
                                    {processing ? 'Menyimpan...' : 'Inisialisasi Tahun'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-xl text-white relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10">
                               <AlertCircle className="w-16 h-16" />
                           </div>
                           <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Informasi</h4>
                           <p className="text-xs text-slate-400 leading-relaxed font-medium">
                               Aktivasi tahun akademik baru secara otomatis akan menonaktifkan tahun akademik sebelumnya jika sistem diatur demikian. Pastikan data sudah valid sebelum aktivasi.
                           </p>
                        </div>
                    </div>

                    {/* Table Section - Main Column */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50">
                                <form onSubmit={handleSearch} className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="search"
                                        placeholder="Cari tahun akademik..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    />
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Identitas Tahun</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {academicYears.map((year) => (
                                            <tr key={year.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex items-center justify-center bg-slate-900 rounded-lg text-emerald-400 font-bold text-sm">
                                                            {year.year.split('/')[0].slice(-2)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{year.year}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase">ACADEMIC_ID: {year.id.toString().padStart(4, '0')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={clsx(
                                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                                        year.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {year.is_active ? 'Operasional Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => toggleStatus(year.id)}
                                                            className={clsx(
                                                                "p-2 rounded-lg border transition-all",
                                                                year.is_active ? "text-slate-400 border-slate-100 hover:bg-slate-100" : "text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                                                            )}
                                                            title={year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                        >
                                                            {year.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => destroy(year.id)}
                                                            className="p-2 text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-50 transition-all"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {academicYears.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center opacity-20">
                                                        <Calendar className="w-12 h-12 mb-4" />
                                                        <p className="font-bold text-slate-900 uppercase tracking-[0.2em]">Belum Ada Data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
