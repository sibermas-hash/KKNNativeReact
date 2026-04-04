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

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-slate-900">Tahun Akademik</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Tambah Tahun</h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-2">Tahun</label>
                                <input
                                    type="text"
                                    placeholder="2024/2025"
                                    value={data.year}
                                    onChange={(e) => setData('year', e.target.value)}
                                    className={clsx(
                                        "w-full px-3 py-2 rounded-lg border text-sm",
                                        errors.year ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"
                                    )}
                                />
                                {errors.year && <p className="text-xs text-rose-500 mt-1">{errors.year}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="search"
                                    placeholder="Cari..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </form>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-2 text-left font-medium text-slate-600">Tahun</th>
                                        <th className="px-6 py-2 text-left font-medium text-slate-600">Status</th>
                                        <th className="px-6 py-2 text-right font-medium text-slate-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {academicYears.map((year) => (
                                        <tr key={year.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3">{year.year}</td>
                                            <td className="px-6 py-3">
                                                <span className={clsx(
                                                    "text-xs px-2 py-1 rounded",
                                                    year.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {year.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right space-x-2">
                                                <button
                                                    onClick={() => toggleStatus(year.id)}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                                <button
                                                    onClick={() => destroy(year.id)}
                                                    className="text-sm text-rose-500 hover:underline"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {academicYears.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Belum ada data</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
