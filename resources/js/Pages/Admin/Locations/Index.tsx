import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
  UploadCloud,
  MapPin,
  Trash2,
  Search,
  FileSpreadsheet,
  Download,
  Database,
  Map,
  Navigation,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

interface LocationData {
  id: number;
  village_code: string | null;
  village_name: string;
  district_name: string | null;
  regency_name: string | null;
  full_name: string;
  groups_count: number;
  posko_count: number;
  can_delete: boolean;
  delete_blocker: string | null;
}

interface Props extends PageProps {
  locations: {
    data: LocationData[];
    links: unknown[];
    meta: PaginationMeta;
  };
  filters: {
    search?: string;
  };
  summary: {
    total_locations: number;
    assigned_groups: number;
    reported_posko: number;
  };
}

export default function LocationsIndex({ locations, filters, summary }: Props) {
  const [deleting, setDeleting] = useState<LocationData | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const importForm = useForm<{
    file: File | null;
  }>({
    file: null,
  });

  const deleteForm = useForm({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get('/admin/lokasi', { search }, { preserveState: true, replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters.search]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    importForm.setData('file', event.target.files?.[0] ?? null);
    importForm.clearErrors('file');
  }

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    importForm.post('/admin/lokasi/impor', {
      forceFormData: true,
      onSuccess: () => importForm.reset(),
    });
  }

  return (
    <AppLayout title="MASTER WILAYAH">
      <Head title="Master Wilayah | KKN UIN SAIZU" />
      
      <div className="space-y-6">
        
        {/* --- COMPACT HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                    <MapPin size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Master Wilayah KKN</h2>
                    <p className="text-sm text-slate-500 font-medium">Total: {summary.total_locations} Desa | Terplot: {summary.assigned_groups} Unit</p>
                </div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full lg:w-80 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="search"
                    placeholder="Cari desa atau kecamatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-medium"
                />
            </form>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* --- IMPORT FORM --- */}
            <div className="xl:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UploadCloud size={16} className="text-emerald-500" />
                        Impor Data Wilayah
                    </h3>
                    
                    <form onSubmit={handleImport} className="space-y-4">
                        <div className="border-2 border-dashed border-slate-100 rounded-xl p-6 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all text-center relative group cursor-pointer">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".xlsx,.xls,.csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="space-y-2">
                                <div className="h-10 w-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center mx-auto shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <p className="text-xs font-bold text-slate-500 truncate px-2">
                                    {importForm.data.file ? importForm.data.file.name : 'Pilih file Excel/CSV'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!importForm.data.file || importForm.processing}
                            className="w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            {importForm.processing ? 'Mengimpor...' : 'Unggah Data'}
                        </button>
                    </form>

                    <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                        <Database size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold text-emerald-700 leading-relaxed">
                            Gunakan format standar (Desa, Kecamatan, Kabupaten) untuk memastikan plotting kelompok akurat.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wilayah</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Statistik</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center text-sm text-slate-400 italic">
                                            Tidak ada data wilayah ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    locations.data.map((loc) => (
                                        <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                        <Navigation size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">Desa {loc.village_name}</div>
                                                        <div className="text-[11px] text-slate-500 font-medium">Kec. {loc.district_name} • {loc.regency_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-xs font-bold text-slate-800">{loc.groups_count} Unit KKN</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">{loc.posko_count} Posko Terdata</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setDeleting(loc)}
                                                        disabled={!loc.can_delete}
                                                        className={clsx(
                                                            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-95 shadow-sm",
                                                            loc.can_delete ? "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200" : "opacity-20 cursor-not-allowed"
                                                        )}
                                                        title="Hapus Wilayah"
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

                    {locations.meta && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <Pagination meta={locations.meta} />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- SIMPLE INFO --- */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistem Registri Geospasial UIN SAIZU</span>
        </div>

      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
            if (!deleting) return;
            deleteForm.delete(`/admin/lokasi/${deleting.id}`, {
                onSuccess: () => setDeleting(null),
            });
        }}
        title="HAPUS WILAYAH"
        message={deleting?.can_delete
            ? `Apakah Anda yakin ingin menghapus data wilayah "${deleting.full_name}"?`
            : (deleting?.delete_blocker ?? 'Wilayah ini masih memiliki dependensi aktif.')}
        confirmLabel="Hapus Permanen"
      />
    </AppLayout>
  );
}
