import { useEffect, useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { 
    Plus, 
    Search, 
    Calendar, 
    Edit2,
    Trash2,
    ShieldCheck,
    Database,
    Info,
    Copy,
    Map,
    Activity,
    Zap
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
                router.get('/admin/periods', { search }, { preserveState: true, replace: true });
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.clearErrors();

        if (editing) {
            form.put(`/admin/periods/${editing.id}`, {
                onSuccess: () => cancelForm(),
            });
            return;
        }

        form.post('/admin/periods', {
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
        <AppLayout title="Protokol Siklus KKN">
            <Head title="Manajemen Periode KKN" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                CYCLE_ORCHESTRATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Manajemen <span className="text-emerald-300 text-glow-emerald italic">Periode</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Konfigurasi jadwal strategis, audit pendaftaran, dan orkestrasi timeline pengabdian masyarakat untuk seluruh unit KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Sesi</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{periods.data.length} Entri</span>
                            </div>
                        </div>
                        {!showForm && (
                            <button
                                onClick={openCreateForm}
                                className="flex items-center gap-4 px-10 py-5.5 bg-white hover:bg-emerald-50 text-primary rounded-[1.5rem] font-black text-xs uppercase  transition-all hover:-translate-y-1 active:scale-95 italic"
                            >
                                <Plus className="w-5 h-5" />
                                Inisiasi Periode
                            </button>
                        )}
                    </div>
                </div>

                {/* Entry Form */}
                {showForm && (
                    <div className="animate-in rounded-[3rem] border border-slate-100 bg-white p-10 relative overflow-hidden group mb-10 mx-2">
                        <div className="mb-10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="rounded-[1.25rem] bg-primary/10 p-4 text-primary
                                    {editing ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6 stroke-[3px]" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase  italic leading-none">
                                        {editing ? 'Perbarui Data Periode' : 'Tambah Periode Baru'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase  italic opacity-70">Parameter operasional siklus KKN</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Tahun Akademik</label>
                                    <FormSelect
                                        options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                                        value={form.data.academic_year_id}
                                        onChange={(e) => form.setData('academic_year_id', e.target.value)}
                                        required
                                        className="h-15 bg-slate-50 border-slate-100 rounded-lg text-[11px] font-black uppercase  text-slate-500 focus:border-primary/30 transition-all italic"
                                    />
                                </div>
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Nomor Periode</label>
                                    <FormInput
                                        type="number"
                                        placeholder="Misal: 53"
                                        value={form.data.periode}
                                        onChange={(e) => form.setData('periode', e.target.value)}
                                        required
                                        className="h-15 px-8 bg-slate-50 border-slate-100 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:border-primary/30 transition-all outline-none italic
                                    />
                                </div>
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Jenis KKN</label>
                                    <FormInput
                                        placeholder="Misal: KKN REGULER"
                                        value={form.data.jenis}
                                        onChange={(e) => form.setData('jenis', e.target.value)}
                                        required
                                        className="h-15 px-8 bg-slate-50 border-slate-100 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:border-primary/30 transition-all outline-none italic uppercase"
                                    />
                                </div>
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Kuota Mahasiswa</label>
                                    <FormInput
                                        type="number"
                                        min={1}
                                        placeholder="Misal: 2000"
                                        value={form.data.kuota}
                                        onChange={(e) => form.setData('kuota', e.target.value)}
                                        required
                                        className="h-15 px-8 bg-slate-50 border-slate-100 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:border-primary/30 transition-all outline-none italic
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                                <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-8">
                                    <div className="flex items-center gap-4 pb-4 border-b border-white">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <h3 className="text-[11px] font-black uppercase  text-slate-400 italic">Jadwal Pendaftaran</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase  italic ml-1">Mulai</label>
                                            <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required className="h-14 bg-white" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase  italic ml-1">Selesai</label>
                                            <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required className="h-14 bg-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-8">
                                    <div className="flex items-center gap-4 pb-4 border-b border-white">
                                        <Map className="h-5 w-5 text-primary" />
                                        <h3 className="text-[11px] font-black uppercase  text-slate-400 italic">Pelaksanaan Lapangan</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase  italic ml-1">Mulai</label>
                                            <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required className="h-14 bg-white" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase  italic ml-1">Selesai</label>
                                            <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required className="h-14 bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-10 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                    className="flex items-center gap-6 group"
                                >
                                    <div className={clsx(
                                        "w-16 h-8 rounded-full p-1.5 transition-all",
                                        form.data.is_active ? 'bg-primary : 'bg-slate-200'
                                    )}>
                                        <div className={clsx(
                                            "w-5 h-5 bg-white rounded-full transition-all transform
                                            form.data.is_active ? 'translate-x-8' : 'translate-x-0'
                                        )} />
                                    </div>
                                    <div className="flex flex-col">
                                         <span className={clsx("text-[10px] font-black uppercase  italic leading-none transition-colors", form.data.is_active ? 'text-primary' : 'text-slate-400')}>
                                            Status: {form.data.is_active ? 'OPERASIONAL' : 'DRAFT_SISTEM'}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase  mt-1 italic">Tampilkan ke profil mahasiswa</span>
                                    </div>
                                </button>
                                <div className="flex gap-4">
                                    <button type="button" onClick={cancelForm} className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase  hover:text-slate-600 transition-colors italic">Batal</button>
                                    <button 
                                        type="submit" 
                                        disabled={form.processing}
                                        className="px-12 py-5 bg-primary text-white rounded-lg font-black text-[11px] uppercase  hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 italic"
                                    >
                                        {editing ? 'Simpan Perubahan' : 'Luncurkan Periode'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Operations Table */}
                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden mb-10 mx-2">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative group max-w-md w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-all z-10" />
                            <input
                                placeholder="Cari nama atau jenis..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-lg focus:border-primary/50 transition-all font-black text-[13px] text-slate-700 outline-none italic uppercase"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="w-full border-collapse divide-y divide-slate-50">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Identitas Periode</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Thn Akademik</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Kapasitas Mahasiswa</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Pendaftaran</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Pelaksanaan</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap">Status</th>
                                    <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase  italic whitespace-nowrap pr-12">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/50">
                                {periods.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="p-8 bg-slate-50 rounded-full border border-slate-100">
                                                     <Info className="h-16 w-16 text-slate-200" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase  italic">Belum ada data periode terekam</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    periods.data.map((period) => (
                                        <tr key={period.id} className="group transition-all hover:bg-slate-50/50 cursor-default">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-lg font-black text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all italic leading-none">
                                                        {period.periode ?? '--'}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[15px] font-black text-slate-900 group-hover:text-primary transition-colors italic uppercase leading-tight">{period.jenis ?? 'N/A'}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase  italic leading-none opacity-60 group-hover:opacity-100 transition-all">{period.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center whitespace-nowrap">
                                                <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 border border-slate-100 uppercase italic 
                                                    {period.academic_year?.year || '--'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[16px] font-black text-slate-900 tabular-nums italic leading-none">{period.kuota ?? '--'}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase  italic opacity-50 px-2.5 py-0.5 bg-slate-100 rounded-lg">
                                                        Reg: {period.participants_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[11px] font-black text-emerald-600 italic px-3 py-1 bg-emerald-50 rounded-lg">{period.registration_start}</span>
                                                    <div className="h-2 w-[2px] bg-slate-100" />
                                                    <span className="text-[10px] font-bold text-slate-400 italic">{period.registration_end}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[11px] font-black text-primary italic px-3 py-1 bg-primary/5 rounded-lg">{period.start_date}</span>
                                                    <div className="h-2 w-[2px] bg-slate-100" />
                                                    <span className="text-[10px] font-bold text-slate-400 italic">{period.end_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <Badge
                                                    variant={period.is_active ? 'success' : 'default'}
                                                    className="px-5 py-2 rounded-xl text-[10px] font-black uppercase  italic border-none
                                                >
                                                    {period.is_active ? 'OPERASIONAL' : 'NON-AKTIF'}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => setDuplicating(period)}
                                                        className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 rounded-lg transition-all
                                                        title="Duplikasi Periode"
                                                    >
                                                        <Copy className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => startEdit(period)}
                                                        className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 rounded-lg transition-all
                                                        title="Edit Periode"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleting(period)}
                                                        disabled={!period.can_delete}
                                                        className={clsx(
                                                            "p-3.5 bg-white border border-slate-100 rounded-lg transition-all
                                                            period.can_delete ? "text-slate-400 hover:text-rose-500 hover:border-rose-200" : "opacity-20 cursor-not-allowed"
                                                        )}
                                                        title={period.can_delete ? 'Hapus Periode' : (period.delete_blocker ?? 'Sedang digunakan')}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {periods.meta && (
                        <div className="border-t border-slate-50 bg-slate-50/30 px-10 py-8">
                            <Pagination meta={periods.meta} />
                        </div>
                    )}
                </div>

                {/* Tactical Emerald Footer */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-4">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">CYCLE_GOVERNANCE_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: SECURE_CORE_SYNC_OK</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Petunjuk Strategis: Periode KKN merupakan unit waktu utama yang mengatur penugasan mahasiswa dan DPL secara nasional. 
                                Mengaktifkan status <span className="text-primary font-black uppercase">Operasional</span> akan membuka gerbang pendaftaran bagi audiens eksternal. 
                                Seluruh parameter temporal telah direkam dalam audit sistem UIN SAIZU demi integritas data akademik tertinggi.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-2 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">REALTIME_LEDGER_SYNC</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Database className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Zap className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!duplicating}
                onClose={() => !duplicateForm.processing && setDuplicating(null)}
                onConfirm={() => duplicating && duplicateForm.post(`/admin/periods/${duplicating.id}/duplicate`, { onSuccess: () => setDuplicating(null) })}
                title="Konfirmasi Duplikasi"
                message={`Apakah Anda yakin ingin menduplikasi periode "${duplicating?.name}"? Ini akan membuat periode baru berbasis data ini.`}
                processing={duplicateForm.processing}
                confirmLabel="Ya, Duplikasikan"
                confirmVariant="primary"
            />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => !deleteForm.processing && setDeleting(null)}
                onConfirm={() => deleting && deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
                title="Konfirmasi Penghapusan"
                message={deleting?.can_delete
                    ? `Apakah Anda yakin ingin menghapus periode "${deleting.name}"? Tindakan ini tidak dapat dibatalkan.`
                    : (deleting?.delete_blocker ?? 'Data tidak dapat dihapus karena masih digunakan.')}
                processing={deleteForm.processing}
                confirmLabel="Ya, Hapus"
            />
        </AppLayout>
    );
}

function Badge({ variant, className, children }: any) {
    const variants: Record<string, string> = {
        success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        danger: 'bg-rose-50 text-rose-600 border border-rose-100',
        default: 'bg-slate-50 text-slate-400 border border-slate-100'
    };
    return (
        <span className={clsx("px-4 py-1 rounded-xl text-[9px] font-black uppercase  italic leading-none whitespace-nowrap", variants[variant] || variants.default, className)}>
            {children}
        </span>
    );
}
