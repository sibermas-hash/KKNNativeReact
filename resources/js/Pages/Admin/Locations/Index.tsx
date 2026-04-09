import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    Building2, 
    House, 
    MapPin, 
    MapPinned, 
    Pencil, 
    Plus, 
    Search, 
    Trash2, 
    Database,
    X,
    Activity,
    Info,
    Zap,
    Fingerprint,
    Shield,
    ChevronRight,
    type LucideIcon 
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface LocationData {
    id: number;
    village_code: string | null;
    village_name: string;
    district_name: string | null;
    regency_name: string | null;
    capacity: number | null;
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
    workflow: {
        primary_source: 'groups_import' | 'manual';
        groups_import_url: string;
    };
}

interface LocationFormData {
    village_name: string;
    district_name: string;
    regency_name: string;
    village_code: string;
    capacity: string;
}

const emptyForm: LocationFormData = {
    village_name: '',
    district_name: '',
    regency_name: '',
    village_code: '',
    capacity: '',
};

function SummaryCard({
    icon: Icon,
    label,
    value,
    trend
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    trend: string;
}) {
    return (
        <div className="bg-white border border-emerald-100 p-8 shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-emerald-950">
                <Icon size={48} />
            </div>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="p-2.5 bg-emerald-950 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg">
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest italic border border-emerald-100">
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-4xl font-black tracking-tighter text-emerald-950 uppercase italic leading-none tabular-nums">
                    {value.toLocaleString()}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-200 italic mt-2">{label}</p>
            </div>
        </div>
    );
}

export default function LocationsIndex({ locations, filters, summary, workflow }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<LocationData | null>(null);
    const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<LocationFormData>(emptyForm);
    const deleteForm = useForm({});

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/lokasi',
                    { search: search || undefined },
                    { preserveState: true, replace: true, preserveScroll: true },
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, filters.search]);

    function openCreateModal() {
        setEditingLocation(null);
        setShowForm(true);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function openEditModal(location: LocationData) {
        setEditingLocation(location);
        setShowForm(true);
        form.clearErrors();
        form.setData({
            village_name: location.village_name ?? '',
            district_name: location.district_name ?? '',
            regency_name: location.regency_name ?? '',
            village_code: location.village_code ?? '',
            capacity: location.capacity != null ? String(location.capacity) : '',
        });
    }

    function closeModal() {
        setShowForm(false);
        setEditingLocation(null);
        form.clearErrors();
        form.reset();
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        };

        if (editingLocation) {
            form.put(`/admin/lokasi/${editingLocation.id}`, options);
            return;
        }

        form.post('/admin/lokasi', options);
    }

    return (
        <AppLayout title="Komando Wilayah Strategis">
            <Head title="Manajemen Wilayah | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS WILAYAH PENEMPATAN */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Strategic Location Mapping Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            REGISTRY <span className="text-emerald-500">WILAYAH OPERASIONAL</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Manajemen basis data wilayah, desa penempatan, dan kapasitas daya tampung unit.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">TOTAL WILAYAH</span>
                            <span className="text-xl font-black text-emerald-950 italic uppercase tracking-tighter tabular-nums">{summary.total_locations} TITIK</span>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            INPUT WILAYAH BARU
                        </button>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                     {/* STATS STRIP TACTICAL */}
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <SummaryCard icon={Building2} label="DESA TERVERIFIKASI" value={summary.total_locations} trend="CAKUPAN WILAYAH" />
                        <SummaryCard icon={MapPinned} label="PENEMPATAN KELOMPOK" value={summary.assigned_groups} trend="OKUPANSI UNIT" />
                        <SummaryCard icon={House} label="INFRASTRUKTUR POSKO" value={summary.reported_posko} trend="KESIAPAN LAPANGAN" />
                    </div>

                    {/* ALUR KERJA PANEL ( HIGH-CONTRAST ) */}
                    <section className="bg-emerald-950 border border-emerald-900 p-12 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 opacity-[0.03] rounded-full translate-x-32 -translate-y-32 blur-3xl pointer-events-none" />
                         <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                            <div className="flex items-center gap-10">
                                <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700">
                                    <MapPin className="h-10 w-10 animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">ALUR PEMBENTUKAN <span className="text-emerald-500">WILAYAH</span></h2>
                                    <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.3em] italic max-w-xl leading-relaxed">
                                        Data wilayah bersifat operasional. Jalur integrasi utama melalui impor kelompok di sistem pusat komando. 
                                        Gunakan penambahan manual hanya untuk koreksi data darurat atau wilayah khusus.
                                    </p>
                                </div>
                            </div>
                            
                            {workflow.primary_source === 'groups_import' && (
                                <button
                                    onClick={() => router.get(workflow.groups_import_url)}
                                    className="h-18 px-10 bg-white text-emerald-950 text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-6 group/btn"
                                >
                                    BUKA TERMINAL KELOMPOK
                                    <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                            )}
                         </div>
                    </section>

                    {/* SEARCH & FILTERS TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                        <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Search size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Instrument Penelusuran Titik</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Otoritas Pencarian & Pemetaan Geografis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">REALTIME SYNC</span>
                                 <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                        </div>

                        <div className="p-10 bg-white">
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 pointer-events-none" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="CARI DESA, KECAMATAN, KABUPATEN, ATAU KODE WILAYAH..."
                                    className="w-full h-18 pl-16 pr-8 bg-emerald-50/10 border border-emerald-50 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {/* DATA GRID: LOCATION REGISTRY */}
                        <div className="overflow-x-auto border-t border-emerald-50">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/10 border-b border-emerald-100">
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">WILAYAH / DESA TARGET</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">KECAMATAN & KABUPATEN</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">KODE WILAYAH</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">OKUPANSI UNIT</th>
                                        <th className="px-10 py-5 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest italic pr-12">KENDALI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {locations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-56 text-center">
                                                <div className="inline-flex flex-col items-center gap-6 opacity-20 capitalize">
                                                    <Database size={64} strokeWidth={1} className="text-emerald-950" />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                        REGISTRY WILAYAH KOSONG
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.data.map((location) => (
                                            <tr key={location.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[14px] font-black text-emerald-950 uppercase tracking-tighter leading-none italic group-hover/row:text-emerald-600 transition-colors">
                                                            {location.village_name}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <MapPin size={10} className="text-emerald-300" />
                                                            <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest italic leading-none truncate max-w-[300px]">
                                                                {location.full_name}
                                                            </span>
                                                        </div>
                                                        {!location.can_delete && location.delete_blocker && (
                                                            <span className="text-[7px] font-black text-rose-500 uppercase mt-2 tracking-[0.2em] italic border-l border-rose-500 pl-2">
                                                                LOCK: {location.delete_blocker.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight italic leading-none">
                                                            {location.district_name || '-'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest italic">
                                                            {location.regency_name || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className="font-mono text-[11px] font-black text-emerald-950 bg-emerald-50 border border-emerald-100 px-3 py-1 italic tabular-nums shadow-sm group-hover/row:bg-emerald-950 group-hover/row:text-white transition-all">
                                                        {location.village_code || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="px-4 py-1.5 bg-white border border-emerald-100 text-emerald-950 font-black text-[12px] tabular-nums italic shadow-sm">
                                                            {location.groups_count} / {location.capacity ?? 0}
                                                        </div>
                                                        <span className="text-[7px] font-black text-emerald-200 uppercase tracking-[0.3em] italic">CAPACITY LOAD</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                        <button
                                                            onClick={() => openEditModal(location)}
                                                            className="h-10 w-10 bg-white border border-emerald-100 text-emerald-200 hover:text-amber-600 hover:border-amber-500 rounded-none flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                            title="EDIT WILAYAH"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleting(location)}
                                                            disabled={!location.can_delete}
                                                            className={clsx(
                                                                "h-10 w-10 border flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-5",
                                                                location.can_delete ? "bg-white border-emerald-100 text-emerald-100 hover:text-rose-600 hover:border-rose-500" : "bg-emerald-50 border-emerald-50 text-emerald-100"
                                                            )}
                                                            title="TERMINASI REGISTRY"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <button className="h-10 w-10 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-10 py-8 border-t border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4 italic">
                                <div className="p-2 bg-emerald-950 text-emerald-500 shadow-lg">
                                    <Database size={14} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Total Database: {locations.meta.total} Titik Terdistribusi</span>
                            </div>
                            <Pagination meta={locations.meta} />
                        </div>
                    </div>

                    <div className="bg-emerald-950 p-12 flex items-center justify-center gap-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                        <Shield size={24} className="text-emerald-500 relative z-10" />
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] italic relative z-10 leading-relaxed max-w-4xl text-center">
                            SELURUH DATA GEOGRAFIS DAN KAPASITAS PENEMPATAN BERADA DALAM OTORITAS PENUH LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT • INTEGRITAS PEMETAAN ADALAH MUTLAK.
                        </span>
                        <Fingerprint size={24} className="text-emerald-500 relative z-10" />
                    </div>
                </div>
            </div>

            <Modal
                show={showForm}
                onClose={closeModal}
                title={editingLocation ? `Halaman Koreksi Wilayah ID: ${editingLocation.id}` : 'Entri Wilayah Strategis Baru'}
                maxWidth="xl"
            >
                <div className="p-12 space-y-12 font-sans italic font-black">
                    <div className="flex items-center gap-6 p-6 bg-emerald-50/50 border border-emerald-100">
                        <div className="h-14 w-14 bg-emerald-950 text-emerald-400 flex items-center justify-center shadow-xl">
                            <MapPinned size={24} />
                        </div>
                        <div>
                             <p className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] leading-none">Parameter Geografis</p>
                             <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-[0.3em] mt-1.5 italic">INPUT KORDINAT DAN NAMA RESMI WILAYAH</p>
                        </div>
                    </div>

                    <form onSubmit={submitForm} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">Nama Desa / Kelurahan</label>
                                <input
                                    type="text"
                                    value={form.data.village_name}
                                    onChange={(event) => form.setData('village_name', event.target.value)}
                                    className="h-14 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    placeholder="INPUT NAMA DESA..."
                                />
                                {form.errors.village_name && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.village_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">Kecamatan</label>
                                <input
                                    type="text"
                                    value={form.data.district_name}
                                    onChange={(event) => form.setData('district_name', event.target.value)}
                                    className="h-14 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    placeholder="INPUT KECAMATAN..."
                                />
                                {form.errors.district_name && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.district_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">Kabupaten / Kota</label>
                                <input
                                    type="text"
                                    value={form.data.regency_name}
                                    onChange={(event) => form.setData('regency_name', event.target.value)}
                                    className="h-14 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    placeholder="INPUT KABUPATEN..."
                                />
                                {form.errors.regency_name && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.regency_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">Kode Wilayah (BPS)</label>
                                <input
                                    type="text"
                                    value={form.data.village_code}
                                    onChange={(event) => form.setData('village_code', event.target.value)}
                                    className="h-14 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner tabular-nums font-mono"
                                    placeholder="00.00.00.0000"
                                />
                                {form.errors.village_code && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.village_code}</p>}
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em]">Kapasitas Okupansi (Unit Kelompok)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.data.capacity}
                                    onChange={(event) => form.setData('capacity', event.target.value)}
                                    className="h-14 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner tabular-nums"
                                    placeholder="0"
                                />
                                {form.errors.capacity && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.capacity}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 pt-10 border-t border-emerald-50">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="h-14 px-10 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300 hover:text-rose-600 transition-all italic"
                            >
                                BATALKAN OPERASI
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-14 px-12 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group/submit disabled:opacity-30"
                            >
                                <Zap size={18} className="group-submit:animate-pulse" />
                                {form.processing ? 'SEDANG MENULIS DATA...' : editingLocation ? 'SIMPAN PERUBAHAN REGISTRY' : 'TERBITKAN REGISTRY WILAYAH'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => {
                    if (!deleting) return;
                    deleteForm.delete(`/admin/lokasi/${deleting.id}`, {
                        preserveScroll: true,
                        onSuccess: () => setDeleting(null),
                    });
                }}
                title="TERMINASI REGISTRY WILAYAH"
                message={
                    deleting?.can_delete
                        ? `PROTOKOL PENGHAPUSAN AKTIF: Yakin ingin menghapus registry wilayah "${deleting.full_name.toUpperCase()}" secara permanen? Seluruh keterkaitan data akan terputus.`
                        : (deleting?.delete_blocker?.toUpperCase() ?? 'MALFUNCTION: DATA WILAYAH TERKUNCI OLEH RELASI AKTIF.')
                }
                confirmLabel="KONFIRMASI TERMINASI"
            />
        </AppLayout>
    );
}
