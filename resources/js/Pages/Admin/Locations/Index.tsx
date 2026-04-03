import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    UploadCloud,
    Map,
    MapPin,
    Users,
    Trash2,
    Search,
    Globe2,
    FileSpreadsheet,
    ShieldCheck,
    Info,
    FileCheck,
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
                router.get('/admin/locations', { search }, { preserveState: true, replace: true });
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

        importForm.post('/admin/locations/import', {
            forceFormData: true,
            onSuccess: () => importForm.reset(),
        });
    }

    return (
        <AppLayout title="Pengaturan Wilayah KKN">
            <Head title="Master Wilayah KKN" />
            
            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <Globe2 className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                GEOGRAPHIC_ORCHESTRATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Master <span className="text-emerald-300 text-glow-emerald">Wilayah</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Pusat pengelolaan basis data wilayah administratif untuk penempatan dan koordinasi unit pengabdian mahasiswa di seluruh sektor geografis KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Total Sektor</span>
                                <span className="text-2xl font-semibold text-white">{summary.total_locations} Desa</span>
                            </div>
                        </div>

                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Plotting Unit</span>
                                <span className="text-2xl font-semibold text-white">{summary.assigned_groups} Kelompok</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-5">
                    {/* Import Area */}
                    <form onSubmit={handleImport} className="xl:col-span-3 rounded-lg border border-slate-200 bg-white p-10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-hover:rotate-6 transition-transform">
                            <Globe2 className="h-48 w-48" />
                        </div>
                        
                        <div className="flex items-start justify-between gap-4 relative z-10">
                            <div>
                                <h2 className="text-xl text-sm text-slate-900 ">Impor Data Wilayah</h2>
                                <p className="mt-2 text-xs text-slate-400 text-sm  opacity-50">
                                    Format berkas: <span className="text-primary">.xlsx, .xls, .csv</span>
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-900 p-4 text-primary
                                <UploadCloud className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="mt-10 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 hover:border-primary/30group/dropzone">
                            <label className="block text-xs text-sm text-slate-400  mb-4">
                                Pilih Berkas Excel/CSV
                            </label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-sm text-slate-500 file:mr-6 file:rounded-xl file:border-0 file:bg-primary file:px-6 file:py-3 file:text-[10px] file:font-black file:uppercase file: file:text-white hover:file:bg-slate-900cursor-pointer"
                            />
                            {importForm.errors.file && (
                                <p className="mt-4 text-xs text-sm text-rose-500 ">{importForm.errors.file}</p>
                            )}
                            {importForm.data.file && (
                                <div className="mt-6 flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                                        <FileCheck className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] text-sm text-slate-600 ">{importForm.data.file.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 rounded-lg bg-slate-900 p-6 flex items-start gap-4 border border-slate-800">
                            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-white">Panduan Format Kolom:</p>
                                <p className="text-[10px] text-sm text-slate-400  leading-normal opacity-50">
                                    Pilar Utama: `desa`, `kecamatan`, `kabupaten` <br/>
                                    Opsional: `kode_desa`
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button
                                type="submit"
                                disabled={importForm.processing || !importForm.data.file}
                                className="inline-flex items-center gap-3 rounded-lg bg-slate-900 px-6 py-5 text-xs font-semibold text-white  hover:bg-slate-800disabled:opacity-50"
                            >
                                <UploadCloud className="h-4 w-4" />
                                {importForm.processing ? 'Sedang Mengunggah...' : 'Proses Impor Data'}
                            </button>
                        </div>
                    </form>

                    {/* SOP Area */}
                    <div className="xl:col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-10 overflow-hidden relative group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                                    <Info className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold  text-slate-900">Prosedur Wilayah</h2>
                                    <p className="text-[10px] text-sm text-slate-400  mt-1.5">Siklus Manajemen Geografis</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <SOPStep step="01" text="Administrator mendefinisikan daftar desa/kelurahan yang menjadi target lokasi pengabdian." />
                                <SOPStep step="02" text="Mahasiswa yang sudah terdaftar mengunggah rincian koordinat dan bukti visual posko." />
                                <SOPStep step="03" text="Koordinator KKN memverifikasi integritas lokasi dan memantau perkembangan setiap unit." />
                            </div>
                            
                            <div className="mt-12 p-6 bg-white border border-slate-200 rounded-lg flex items-center gap-4">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <p className="text-[11px] text-sm text-slate-500 leading-normal  wilayah yang telah memiliki riwayat plotting tidak dapat dihapus demi integritas arsip.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="space-y-6">
                    <div className="relative group max-w-lg">
                        <Search className="absolute left-6 top-1/2/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="Cari berdasarkan nama desa atau kode..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-14 pr-8 text-sm text-sm text-slate-900  outline-none focus:border-primary/50
                        />
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-slate-50">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Identitas Wilayah</th>
                                        <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Kode Desa</th>
                                        <th className="px-6 py-6 text-center text-xs text-sm  text-slate-400">Kelompok Terdaftar</th>
                                        <th className="px-6 py-6 text-center text-xs text-sm  text-slate-400">Bukti Posko</th>
                                        <th className="px-6 py-6 text-right text-xs text-sm  text-slate-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {locations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-50">
                                                    <MapPin className="h-14 w-14 text-slate-200" />
                                                    <p className="text-[10px] text-sm text-slate-400 ">Belum ada data wilayah di sektor ini</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.data.map((location) => (
                                            <tr key={location.id} className="group/row hover:bg-slate-50/50">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-start gap-5">
                                                        <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary
                                                            <Map className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <p className="text-[15px] font-semibold text-slate-900 ">{location.village_name}</p>
                                                            <p className="text-[9px] text-sm text-slate-400  line-clamp-1 opacity-50">{location.full_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-sm text-slate-500 font-mono ">
                                                    {location.village_code || '---'}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="inline-flex rounded-xl bg-slate-900 border border-slate-800 text-primary px-3.5 py-1.5 text-xs font-semibold
                                                            {location.groups_count} Kelompok
                                                        </span>
                                                        {location.delete_blocker && (
                                                            <p className="text-[8px] text-sm text-amber-500 ">{location.delete_blocker}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={clsx(
                                                        "inline-flex rounded-xl px-4 py-1.5 text-xs font-semibold",
                                                        location.posko_count > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-300"
                                                    )}>
                                                        {location.posko_count} Berkas
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex justify-endx-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleting(location)}
                                                            disabled={!location.can_delete}
                                                            className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xldisabled:opacity-20 disabled:grayscale"
                                                        >
                                                            <Trash2 className="h-4.5 w-4.5" />
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
                            <div className="border-t border-slate-200 px-6 py-6 bg-slate-50/30">
                                <Pagination meta={locations.meta} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => {
                    if (!deleting) return;
                    deleteForm.delete(`/admin/locations/${deleting.id}`, {
                        onSuccess: () => setDeleting(null),
                    });
                }}
                title="Hapus Wilayah"
                message={`Apakah Anda yakin ingin menghapus data wilayah "${deleting?.full_name}" secara permanen?`}
                confirmLabel="Hapus Data"
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}



function SOPStep({ step, text }: { step: string; text: string }) {
    return (
        <div className="flex gap-5 group">
            <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-white">
                    {step}
                </div>
                <div className="w-[1px] h-full bg-slate-200 group-last:hidden" />
            </div>
            <div className="pb-6">
                <p className="text-xs text-sm text-slate-500 leading-normal  pt-2">{text}</p>
            </div>
        </div>
    )
}
