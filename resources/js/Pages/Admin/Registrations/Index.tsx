import { Link, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    Filter,
    IdCard,
    ShieldCheck,
    Zap,
    Cpu,
    Fingerprint,
    ChevronRight,
    Activity,
} from 'lucide-react';

interface RegData {
    id: number;
    status: string;
    registration_date: string;
    student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string } };
    period: { name: string };
    group: { name: string } | null;
}

interface PaginatedData {
    data: RegData[];
    meta?: PaginationMeta;
    links?: { prev: string | null; next: string | null };
}

interface Props extends PageProps {
    registrations: PaginatedData;
    filters: { status?: string };
}

export default function RegistrationsIndex({ registrations, filters }: Props) {
    const statusFilter = useForm({ status: filters.status ?? '' });
    const statuses = [
        { value: '', label: 'Semua Status' },
        { value: 'pending', label: 'Menunggu Verifikasi' },
        { value: 'document_submitted', label: 'Dokumen Terkirim' },
        { value: 'approved', label: 'Disetujui' },
        { value: 'rejected', label: 'Ditolak' },
    ];

    function handleFilter(status: string) {
        statusFilter.setData('status', status);
        statusFilter.get('/admin/registrations', { preserveState: true });
    }

    return (
        <AppLayout title="Verifikasi Pendaftaran KKN">
            <Head title="Manajemen Pendaftaran" />
            
            <div className="space-y-10 pb-16">
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
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                REGISTRATION_GATEWAY_AUDIT_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Audit <span className="text-emerald-300 text-glow-emerald italic">Registrasi</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Filter utama otorisasi permohonan pendaftaran mahasiswa peserta KKN berdasarkan validasi dokumen akademik yang telah diunggah dalam sistem integrasi UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6 transition-all">
                                <IdCard className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Antrean Masuk</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{registrations.meta?.total || 0} Records</span>
                            </div>
                        </div>
                        
                        <div className="relative group w-64">
                             <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
                                <Filter className="h-4 w-4 text-emerald-300" />
                            </div>
                            <FormSelect
                                options={statuses}
                                value={filters.status ?? ''}
                                onChange={(e) => handleFilter(e.target.value)}
                                label=""
                                className="pl-14 pr-6 py-5.5 bg-white border border-transparent rounded-[1.5rem] text-[10px] font-black uppercase  text-slate-900 focus:border-emerald-500/50 focus:ring-0 transition-all cursor-pointer italic appearance-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden relative group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Identitas Mahasiswa</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Program Studi</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase  text-slate-400 italic whitespace-nowrap">Periode</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase  text-slate-400 italic">Status Verifikasi</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-bold uppercase  text-slate-400 italic">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {(registrations.data ?? []).map((reg) => (
                                    <tr key={reg.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all italic leading-none">
                                                    {reg.student.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-900 group-hover:text-primary transition-colors  uppercase italic leading-none">
                                                        {reg.student.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] font-medium text-slate-400  uppercase italic leading-none">
                                                            NIM: {reg.student.nim}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-1 bg-primary/30 rounded-full" />
                                                    <span className="text-[11px] font-bold text-slate-700 uppercase  italic leading-none">
                                                        {reg.student.program?.name ?? 'Prodi Belum Diatur'}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase  italic ml-3 leading-none truncate max-w-[200px]">
                                                    {reg.student.faculty?.name || 'Fakultas Belum Diatur'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="inline-flex px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-white transition-all
                                                <span className="text-[10px] font-bold text-slate-600 uppercase  italic leading-none">
                                                    {reg.period.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <StatusBadge status={reg.status} className="px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase  italic" />
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end translate-x-2 group-hover:translate-x-0 transition-all">
                                                <Link
                                                    href={`/admin/registrations/${reg.id}`}
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-primary/50 hover:text-primary text-slate-400 rounded-xl text-[10px] font-bold uppercase  transition-all italic group/btn"
                                                >
                                                    Detail
                                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(registrations.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="p-8 bg-slate-50 rounded-full">
                                                     <ShieldCheck className="h-12 w-12 text-slate-200" />
                                                </div>
                                                <p className="text-[10px] font-bold uppercase  text-slate-500 italic">Tidak ada antrean pendaftaran saat ini</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {registrations.meta && (
                        <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/50">
                            <Pagination meta={registrations.meta} />
                        </div>
                    )}
                </div>

                {/* Professional Governance Footer */}
                <div className="p-10 bg-slate-900 rounded-[3rem] border border-slate-800 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-bold text-slate-300 uppercase  italic leading-none">Pedoman Verifikasi Pendaftaran</h4>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-60">
                                Verifikasi pendaftaran mahasiswa merupakan filter utama dalam ekosistem KKN. 
                                Setiap pendaftaran yang telah disetujui akan secara otomatis dialokasikan ke dalam pembentukan kelompok dan unit posko strategis. 
                                Pastikan validasi NIM dan Prodi telah sesuai dengan basis data akademik universitas sebelum melakukan persetujuan final.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-4 shrink-0 border-l border-slate-800 pl-10">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-100 uppercase  italic">Status: Sinkron Aktif</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600">
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
