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
    Info,
    Zap,
    Cpu,
    Save,
    ShieldCheck
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
        <AppLayout title="Protokol Siklus Akademik">
            <Head title="Manajemen Tahun Akademik" />

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
                                <Calendar className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                ACADEMIC_CYCLE_SYNC_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Kalender <span className="text-emerald-300 text-glow-emerald italic">Akademik</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Konfigurasi siklus tahun ajaran aktif sebagai basis pendaftaran, evaluasi, dan operasional unit KKN UIN SAIZU secara terpadu.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <RotateCcw className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Catatan</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{academicYears.meta?.total || 0} Arsip</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:mx-2">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 sticky top-12 group overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-6 transition-transform">
                                <Calendar className="h-64 w-64" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                    <div className="p-3.5 bg-primary rounded-lg text-white
                                        {editing ? <Edit2 className="h-6 w-6 stroke-[2.5px]" /> : <Plus className="h-6 w-6 stroke-[3px]" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase italic  leading-[0.8]">{editing ? 'Ubah_Siklus' : 'Inisialisasi_Tahun'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase  mt-2 italic opacity-70">{editing ? 'PENYESUAIAN RECORD' : 'INPUT TAHUN BARU'}</p>
                                    </div>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-3 group/field">
                                        <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Identitas Tahun Akademik</label>
                                        <FormInput
                                            placeholder="Contoh: 2024/2025"
                                            value={form.data.year}
                                            onChange={(e) => form.setData('year', e.target.value)}
                                            error={form.errors.year}
                                            label=""
                                            className="bg-slate-50 border-slate-100 text-sm font-black rounded-lg focus:bg-white focus:border-primary/40 transition-all h-16 px-8 italic uppercase placeholder:opacity-30"
                                            required
                                        />
                                    </div>

                                    <div 
                                        className={clsx(
                                            "flex items-center gap-5 p-6rounded-lg border transition-all cursor-pointer group hover:shadow-md",
                                            form.data.is_active ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100 hover:bg-white'
                                        )} 
                                        onClick={() => form.setData('is_active', !form.data.is_active)}
                                    >
                                        <div className={clsx(
                                            "w-7 h-7 rounded-xl border flex items-center justify-center transition-all",
                                            form.data.is_active ? 'bg-primary border-primary : 'bg-white border-slate-200'
                                        )}>
                                            {form.data.is_active && <CheckCircle className="w-4 h-4 text-white stroke-[3px]" />}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className={clsx("text-[11px] font-black uppercase  italic leading-none", form.data.is_active ? 'text-primary' : 'text-slate-400')}>
                                                {form.data.is_active ? 'STATUS: ACTIVE_GATEWAY' : 'STATUS: INACTIVE_SECTOR'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase  italic opacity-60">Matikan pendaftaran temporal</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-4">
                                        <button 
                                            type="submit" 
                                            disabled={form.processing} 
                                            className="w-full py-5.5 bg-primary text-white text-[11px] font-black rounded-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-4 uppercase  hover:-translate-y-1 active:scale-95 italic"
                                        >
                                             {editing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5px]" />}
                                            {editing ? 'TERAPKAN_PERUBAHAN' : 'COMMIT_DATA_TAHUN'}
                                        </button>
                                        {editing && (
                                            <button 
                                                type="button" 
                                                onClick={cancelEdit} 
                                                className="w-full py-4.5 bg-white text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 hover:text-slate-900 transition-all uppercase  italic"
                                            >
                                                Membatalkan_Sesi
                                            </button>
                                        )}
                                    </div>
                                </form>

                                <div className="p-8 bg-slate-50 border border-slate-100rounded-lg flex gap-5 items-start">
                                    <div className="p-3 bg-white rounded-xl text-primary border border-primary/10 shrink-0">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase  mb-1.5 italic leading-none">INTEGRITAS_GLOBAL</h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-bold italic opacity-70">
                                            Hanya diizinkan satu tahun akademik berstatus <strong className="text-primary opacity-100 italic">"ACTIVE"</strong> sebagai referensi orkestrasi pendaftaran.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="relative max-w-2xl group mx-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                            <input
                                placeholder="Cari record tahun akademik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-16 pr-8 py-5.5 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 outline-none focus:border-primary/50 transition-all italic uppercase placeholder:opacity-30"
                            />
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden group mx-1">
                            <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                                <table className="min-w-full divide-y divide-slate-50">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Identitas_Tahun_Akademik</th>
                                            <th className="px-10 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Status_Gateway</th>
                                            <th className="px-10 py-7 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-14">Operasi_Otoritas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {academicYears.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-10 py-40 text-center">
                                                    <div className="flex flex-col items-center gap-10 opacity-30">
                                                        <div className="p-10 bg-slate-50 rounded-full border border-slate-100
                                                             <Calendar className="h-20 w-20 text-slate-200" />
                                                        </div>
                                                        <p className="text-[12px] font-black uppercase  text-slate-400 italic">SYSTEM_INFO: NO_ACADEMIC_RECORDS_DETECTED</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            academicYears.data.map((ay) => (
                                                <tr key={ay.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                                    <td className="px-10 py-9">
                                                        <div className="flex items-center gap-6">
                                                            <div className="h-14 w-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-lg font-black text-primary italic group-hover/row:scale-110 transition-transform">
                                                                {ay.year.split('/')[0].slice(-2)}
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-2xl font-black text-slate-900 group-hover/row:text-primary transition-colors  uppercase italic leading-none">{ay.year}</span>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase  italic opacity-60">ACADEMIC_YEAR_ID: {ay.id.toString().padStart(4, '0')}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-9 text-center">
                                                        <span className={clsx(
                                                            "inline-flex items-center gap-3 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase  italic border transition-all",
                                                            ay.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                                        )}>
                                                            {ay.is_active ? (
                                                                <>
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse />
                                                                    OPERATIONAL_ACTIVE
                                                                </>
                                                            ) : 'IDLE_INACTIVE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-9 text-right pr-14">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all transform group-hover/row:-translate-x-2">
                                                            <button 
                                                                onClick={() => startEdit(ay)} 
                                                                className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40 rounded-lg transition-all hover:-translate-y-1 active:scale-95"
                                                            >
                                                                <Edit2 className="w-5 h-5 stroke-[2.5px]" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleting(ay)} 
                                                                className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all hover:-translate-y-1 active:scale-95"
                                                            >
                                                                <Trash2 className="w-5 h-5 stroke-[2.5px]" />
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
                                <div className="px-10 py-9 bg-slate-50/30 border-t border-slate-100">
                                    <Pagination meta={academicYears.meta} />
                                </div>
                            )}
                        </div>

                         {/* Tactical Emerald Footer Monitor */}
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-1">
                             {/* Decorative Elements */}
                             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                             <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                            <ShieldCheck className="h-7 w-7 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">CALENDAR_GOVERNANCE_PROTOCOL_V3</h4>
                                            <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: CYCLE_DATA_SNC_VERIFIED</p>
                                        </div>
                                    </div>
                                    <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                        Petunjuk Strategis: Kalender akademik merupakan pilar utama dalam orkestrasi linimasa KKN UIN SAIZU. 
                                        Sistem secara otomatis akan mengunci pendaftaran jika tidak terdeteksi tahun akademik dengan status <span className="text-primary font-black uppercase italic">"Active"</span>. 
                                        Pastikan transisi antar siklus tahun akademik dilakukan melalui prosedur otentikasi admin pusat.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                                     <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[11px] font-black text-slate-100 uppercase  italic">TEMPORAL_LOCK_OK</span>
                                     </div>
                                     <div className="flex gap-5">
                                        <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                            <Cpu className="h-7 w-7" />
                                        </div>
                                        <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                            <Zap className="h-7 w-7" />
                                        </div>
                                     </div>
                                </div>
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
