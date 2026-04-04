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
 
 <div className="space-y-8 pb-16">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-xs font-semibold text-emerald-600">
 GEOGRAPHIC_ENTITY_DATABASE
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <MapPin className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 ">
 Master <span className="text-primary">Wilayah</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-6 transition-all hover:border-slate-200">
 <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Globe2 className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-xs font-semibold text-slate-400  mb-0.5">Sektor</span>
 <span className="text-xs font-semibold text-slate-900 ">
 {summary.total_locations} DESA
 </span>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
 <Users className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-xs font-semibold text-slate-400  mb-0.5">Plotting</span>
 <span className="text-xs font-semibold text-slate-900 ">
 {summary.assigned_groups} UNIT
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="grid gap-8 xl:grid-cols-5">
 {/* Import Area */}
 <div className="xl:col-span-2">
 <form onSubmit={handleImport} className="bg-white p-6 border border-slate-100 rounded-lg space-y-6 relative overflow-hidden group">
 <div className="absolute -top-4 -right-4 p-8 text-emerald-500/5 ">
 <UploadCloud className="h-32 w-32" />
 </div>
 
 <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
 <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
 <FileSpreadsheet className="h-4 w-4" />
 </div>
 <h3 className="text-sm font-semibold text-slate-900">BATCH_GEOGRAPHIC_INGESTION</h3>
 </div>

 <div className="space-y-4 relative z-10">
 <div className="p-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 hover:border-primary/20 transition-all group/drop text-center relative">
 <input
 type="file"
 onChange={handleFileChange}
 accept=".xlsx,.xls,.csv"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 disabled={importForm.processing}
 />
 <div className="space-y-2">
 <div className="h-8 w-8 text-slate-200 mx-auto group-hover/drop:text-primary transition-colors flex items-center justify-center">
 <UploadCloud className="h-6 w-6" />
 </div>
 <p className="text-sm font-semibold text-slate-400 group-hover/drop:text-primary transition-colors">
 {importForm.data.file ? importForm.data.file.name : 'SELECT_DATABASE_FILE'}
 </p>
 <span className="text-xs font-semibold text-slate-200">.XLSX, .XLS, .CSV ONLY</span>
 </div>
 </div>

 <button
 type="submit"
 disabled={!importForm.data.file || importForm.processing}
 className="w-full py-4 bg-primary text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
 >
 {importForm.processing ? 'UPLOADING...' : ''}
 </button>
 </div>

 <div className="p-4 bg-emerald-50 rounded-lg flex gap-3 border border-emerald-100">
 <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
 <p className="text-xs font-semibold text-emerald-800 ">
 PROSES: Pastikan struktur kolom sesuai dengan template standar (Desa, Kecamatan, Kabupaten).
 </p>
 </div>
 </form>
 </div>

 {/* Operations Database Table */}
 <div className="xl:col-span-3 space-y-6">
 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_LOCATION_DATABASE..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>

 <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full border-collapse divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-5 text-left text-xs font-semibold text-slate-400">IDENTITAS_WILAYAH</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">INFO_UNIT</th>
 <th className="px-8 py-5 text-right text-xs font-semibold text-slate-400 pr-12">AKSI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50/50">
 {locations.data.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-8 py-24 text-center">
 <div className="flex flex-col items-center gap-4 opacity-30">
 <Globe2 className="h-10 w-10 text-slate-300" />
 <p className="text-xs font-semibold text-slate-400">GEODATA_KOSONG</p>
 </div>
 </td>
 </tr>
 ) : (
 locations.data.map((loc) => (
 <tr key={loc.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary transition-all">
 <MapPin className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-slate-900 group-hover/row:text-primary transition-colors">{loc.village_name}</span>
 <span className="text-xs font-semibold text-slate-300">KEC. {loc.district_name} • {loc.regency_name}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-col items-center gap-1">
 <span className="text-xs font-semibold text-slate-900 border-b border-primary/20 pb-0.5">{loc.groups_count} UNIT</span>
 <span className="text-xs font-semibold text-slate-300">POSKO: {loc.posko_count}</span>
 </div>
 </td>
 <td className="px-8 py-6 text-right pr-12">
 <div className="flex justify-end gap-2 opacity-30 group-hover/row:opacity-100 transition-opacity">
 <button
 onClick={() => setDeleting(loc)}
 disabled={!loc.can_delete}
 className={clsx(
 "p-2.5 border border-slate-100 rounded-lg transition-all",
 loc.can_delete ? "text-slate-400 hover:text-rose-500 hover:border-rose-100" : "opacity-10 cursor-not-allowed"
 )}
 title={loc.can_delete ? 'Hapus Wilayah' : (loc.delete_blocker ?? 'Sedang digunakan')}
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
 </div>

 {locations.meta && (
 <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
 <Pagination meta={locations.meta} />
 </div>
 )}
 </div>
 </div>

 {/* Tactical Resource Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-white"></h4>
 <p className="text-xs font-semibold text-slate-500 mt-1  max-w-2xl">
 Data wilayah disinkronkan langsung dengan repositori pusat KKN. <br/>
 STATUS: SECURE_
 </p>
 </div>
 </div>
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
 title="EKSEKUSI_PENGHAPUSAN_WILAYAH"
 message={deleting?.can_delete 
 ? `Apakah Anda yakin ingin menghapus "${deleting.full_name}"?` 
 : (deleting?.delete_blocker ?? 'Wilayah ini terikat dengan entitas aktif.')}
 processing={deleteForm.processing}
 confirmLabel="HAPUS_DATA"
 />
 </AppLayout>
 );
}

function SOPStep({ step, text }: { step: string; text: string }) {
 return (
 <div className="flex gap-5 group">
 <div className="flex flex-col items-center gap-2">
 <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-semibold text-primary   {step}
 </div>
 <div className="w-[1px] h-full bg-slate-200 group-last:hidden" />
 </div>
 <div className="pb-6">
 <p className="text-xs text-sm text-slate-500 leading-normal pt-2">{text}</p>
 </div>
 </div>
 )
}
