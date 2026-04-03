import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Flag,
    Users,
    MapPin,
    Calendar,
    Search,
    Filter,
    FileText,
    Info,
    Activity,
    Briefcase,
    Fingerprint,
    ShieldCheck,
} from 'lucide-react';
import { Head } from '@inertiajs/react';

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    group: { name: string; location?: { name: string } };
}

interface Props extends PageProps {
    workPrograms: { data: WorkProgramData[] };
    filters: { status?: string };
}

export default function AdminWorkProgramsIndex({ workPrograms, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/work-programs?status=${value}` : '/admin/reports/work-programs';
        window.location.href = next;
    };

    return (
        <AppLayout title="Arsip Program Kerja">
            <Head title="Repositori Program Kerja" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Briefcase className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                INITIATIVE_HUB_ORCHESTRATOR_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Arsip <span className="text-emerald-300 text-glow-emerald italic">Program Kerja</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Repositori inisiatif strategis, manajemen pelaporan draf, dan orkestrasi program pengabdian mahasiswa dalam ekosistem KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6 transition-all">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Inisiatif</span>
                                <span className="text-xl font-black text-white uppercase  italic leading-none">{workPrograms.data?.length || 0} PROGJA</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="relative group max-w-lg w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari program kerja, judul, atau kelompok..."
                            className="w-full h-15 pl-14 pr-8 py-4.5 bg-white border border-slate-100 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-primary/50 transition-all italic
                        />
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg group flex items-center gap-4">
                            <Filter className="h-4.5 w-4.5 group-hover:text-primary transition-colors" />
                        </div>
                        <FormSelect
                            options={[
                                { value: '', label: 'Semua Status Program' },
                                { value: 'submitted', label: 'Status: Diajukan' },
                                { value: 'approved', label: 'Status: Terverifikasi' },
                                { value: 'revision', label: 'Status: Perlu Revisi' },
                                { value: 'draft', label: 'Status: Draft' },
                            ]}
                            value={filters.status ?? ''}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="bg-white border-slate-100 text-[10px] font-bold uppercase  text-slate-600 w-64 h-15 rounded-lg focus:border-primary/50 px-6 italic cursor-pointer"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Nama Program & ID</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Unit Kelompok</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Lokasi Penugasan</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase  text-slate-400 italic">Waktu Pengajuan</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-bold uppercase  text-slate-400 italic">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {workPrograms.data?.length > 0 ? workPrograms.data?.map((p) => (
                                    <tr key={p.id} className="group/row hover:bg-slate-50/20 transition-all">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-primary group-hover/row:text-white transition-all italic font-black">
                                                    <Flag className="h-5.5 w-5.5" />
                                                </div>
                                                <div className="flex flex-col gap-1.5 truncate max-w-sm">
                                                    <span className="text-[14px] font-black text-slate-900 group-hover/row:text-primary transition-colors italic uppercase leading-tight truncate">{p.title}</span>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase  italic leading-none opacity-60">Entry ID: #{p.id.toString().padStart(4, '0')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover/row:bg-primary/10 group-hover/row:text-primary transition-all">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 uppercase  italic">{p.group?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase  italic group-hover/row:text-slate-600 transition-colors">
                                                <MapPin className="h-3.5 w-3.5 opacity-40 group-hover/row:opacity-100 transition-opacity" />
                                                <span className="truncate max-w-[150px]">{p.group?.location?.name ?? 'Belum Diatur'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-700 italic tabular-nums leading-none">{p.submitted_at ?? '--'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7 text-right">
                                            <StatusBadge status={p.status} className="px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase  italic border-none />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-30">
                                                <div className="p-10 bg-slate-50 rounded-full border border-slate-100
                                                     <FileText className="h-12 w-12 text-slate-200" />
                                                </div>
                                                <p className="text-[11px] font-bold uppercase  text-slate-400 italic">Belum ada program kerja yang diajukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Footer Monitor */}
                <div className="p-10 bg-slate-900 rounded-[3rem] border border-slate-800 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">TATA_KELOLA_INISIATIF_STRATEGIS</h4>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-70">
                                Seluruh Program Kerja (PROGJA) yang terdaftar merepresentasikan rencana aksi strategis unit KKN. 
                                Setiap pengajuan wajib divalidasi oleh Dosen Pembimbing Lapangan (DPL) sebelum diarsipkan sebagai basis 
                                evaluasi integritas pengabdian mahasiswa dalam ekosistem KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 border-l border-slate-800 pl-10">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse />
                                <span className="text-[10px] font-black text-slate-100 uppercase  italic">DATA_INTEGRITY_VERIFIED</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600 transition-colors hover:text-primary
                                    <Info className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600 transition-colors hover:text-primary
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        Strategic Initiative Archive • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
