import { useForm, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { useState } from 'react';
import {
    User,
    IdCard,
    GraduationCap,
    Calendar,
    FileText,
    ShieldCheck,
    XCircle,
    ArrowLeft,
    CheckCircle2,
    Download,
    Eye,
    MessageSquare,
    BadgeCheck,
    Zap,
    Cpu,
    Fingerprint,
    X,
    FileSearch,
    ShieldAlert
} from 'lucide-react';

interface Props extends PageProps {
    registration: {
        id: number;
        status: string;
        registration_date: string;
        notes?: string;
        student: {
            nim: string;
            name: string;
            gender: string;
            batch_year: number;
            faculty?: { name: string };
            program?: { name: string };
        };
        period: { name: string };
        group: { name: string; code: string } | null;
        documents: { id: number; document_type: string; file_name: string; file_path: string; status: string }[];
    };
}

export default function RegistrationShow({ registration }: Props) {
    const [showReject, setShowReject] = useState(false);
    const approveForm = useForm({});
    const rejectForm = useForm({ notes: '' });

    const isPending = registration.status === 'pending' || registration.status === 'document_submitted';

    return (
        <AppLayout title="Audit Berkas Mahasiswa">
            <Head title={`Audit: ${registration.student.name}`} />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group transition-all">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <Link href="/admin/registrations" className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-[10px] font-black text-emerald-100 uppercase  hover:bg-white/20 transition-all italic mb-2">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            KEMBALI KE LEDGER
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <FileSearch className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                REGISTRATION_AUDIT_PROTOCOL_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                             Profil <span className="text-emerald-300 text-glow-emerald italic">Entitas Peserta</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Verifikasi identitas akademik, validasi dokumen persyaratan, dan otorisasi delegasi penempatan untuk pendaftaran KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <BadgeCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Status Verifikasi</span>
                                <StatusBadge status={registration.status} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase  italic" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:mx-2">
                    {/* Primary Data Panel (Left) */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Student Core Profile - Tactical Overhaul */}
                        <div className="bg-white rounded-lg border border-slate-100 p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-14 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                <User className="w-80 h-80" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-10 mb-14">
                                    <div className="relative shrink-0">
                                        <div className="h-28 w-28 rounded-lg bg-slate-900 text-primary flex items-center justify-center text-5xl font-black italic leading-none border border-slate-800 relative z-10">
                                            {registration.student.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-lg border-4 border-white z-20">
                                            <Zap className="h-4 w-4 fill-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl md:text-5xl font-black text-slate-900  uppercase italic leading-none">{registration.student.name}</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-black uppercase  italic
                                                <ShieldCheck className="w-3.5 h-3.5" /> ENTITAS_VALID
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase  italic opacity-60">Sistem Identifikasi Terpadu</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-50">
                                    <ProfileItem icon={IdCard} label="Nomor Induk Mahasiswa (NIM)" value={registration.student.nim} />
                                    <ProfileItem icon={GraduationCap} label="Fakultas / Unit Akademik" value={registration.student.faculty?.name || 'DATA_HUB_EMPTY'} />
                                    <ProfileItem icon={FileText} label="Program Studi / Jurusan" value={registration.student.program?.name || 'DATA_HUB_EMPTY'} />
                                    <ProfileItem icon={Calendar} label="Angkatan / Tahun Masuk" value={registration.student.batch_year.toString()} />
                                </div>
                            </div>
                        </div>

                        {/* Documents & Assets - Tactical Grid */}
                        <div className="bg-white rounded-lg border border-slate-100 p-12 relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-primary rotate-12 group-hover:rotate-45 transition-transform">
                                 <FileSearch className="w-48 h-48" />
                            </div>

                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="space-y-2">
                                     <h3 className="text-2xl font-black text-slate-900  uppercase italic leading-none flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
                                            <FileText className="w-6 h-6 stroke-[2.5px]" />
                                        </div>
                                        Persyaratan_Dokumen
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase  italic opacity-70 ml-16">INTEGRITAS BERKAS PERSYARATAN</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                {registration.documents.length > 0 ? registration.documents.map((doc) => (
                                    <div key={doc.id} className="group/doc relative bg-slate-50 border border-slate-100 rounded-lg p-8 hover:bg-white hover:shadow-2xl hover:border-primary/30 transition-all cursor-default">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-3.5 bg-white rounded-lg border border-slate-100 group-hover/doc:bg-slate-900 group-hover/doc:border-slate-800 transition-colors">
                                                <FileText className="w-6 h-6 text-primary" />
                                            </div>
                                            <StatusBadge status={doc.status} className="text-[8px] font-black  uppercase italic />
                                        </div>
                                        <div className="space-y-1.5 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase  italic group-hover/doc:text-primary transition-colors">{doc.document_type}</p>
                                            <p className="text-[15px] font-black text-slate-900 truncate italic leading-tight uppercase group-hover/doc:translate-x-1 transition-transform">{doc.file_name}</p>
                                        </div>

                                        <div className="mt-8 flex gap-4">
                                             <button className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase  rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all italic flex items-center justify-center gap-3 active:scale-95">
                                                <Eye className="w-4 h-4" /> Preview
                                            </button>
                                            <button className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase  rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all italic flex items-center justify-center gap-3 active:scale-95">
                                                <Download className="w-4 h-4" /> Get_File
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="md:col-span-2 py-24 text-center border-[3px] border-dashed border-slate-50 rounded-lg bg-slate-50/30 flex flex-col items-center justify-center gap-6">
                                        <div className="p-6 bg-white rounded-full text-slate-200">
                                            <FileSearch className="h-12 w-12" />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-300 uppercase  italic leading-none">Belum ada dokumen yang diunggah ke gateway</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Intel Panel (Right) */}
                    <div className="space-y-12">
                        {/* Enrolment Metadata - Tactical Dark */}
                        <div className="bg-slate-900 rounded-lg p-12 border border-slate-800 relative overflow-hidden group">
                             {/* Decorative Elements */}
                             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <Fingerprint className="h-6 w-6 text-primary />
                                    </div>
                                    <div>
                                         <h3 className="text-lg font-black text-white  uppercase italic leading-none">Intel_Pendaftaran</h3>
                                         <p className="text-[9px] font-black text-emerald-400 uppercase  mt-2 italic opacity-60">METADATA_STREAM_OK</p>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    <IntelRow label="Periode KKN" value={registration.period.name} />
                                    <IntelRow label="Waktu Sinkronisasi" value={registration.registration_date} />
                                    <IntelRow label="Penempatan Unit" value={registration.group?.name || 'WAITING_ALLOCATION'} color={registration.group ? 'text-primary' : 'text-slate-500'} />
                                </div>
                            </div>
                        </div>

                        {/* Decision Nexus - Emerald Tactical */}
                        {isPending && (
                            <div className="bg-white rounded-lg border border-slate-100 p-12 relative overflow-hidden group/nexus">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover/nexus:scale-110 transition-transform">
                                     <Cpu className="h-40 w-40" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 border-b border-slate-50 pb-8 mb-10">
                                        <div className="p-3.5 bg-emerald-50 text-primary rounded-lg border border-primary/20
                                            <ShieldCheck className="w-6 h-6 stroke-[2.5px]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900  uppercase italic leading-none">Otorisasi_Akses</h3>
                                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase  italic opacity-70">KEPUTUSAN OPERASIONAL</p>
                                        </div>
                                    </div>

                                    {!showReject ? (
                                        <div className="space-y-5">
                                            <button
                                                onClick={() => approveForm.patch(`/admin/registrations/${registration.id}/approve`)}
                                                disabled={approveForm.processing}
                                                className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-black uppercase  active:scale-95 transition-all flex items-center justify-center gap-4 italic disabled:opacity-50 group/approve"
                                            >
                                                <CheckCircle2 className="w-6 h-6 text-primary group-hover/approve:rotate-12 transition-transform" />
                                                SETUJUI_ENTITAS
                                            </button>
                                            <button
                                                onClick={() => setShowReject(true)}
                                                className="w-full py-6 bg-white hover:bg-rose-50 text-rose-500 rounded-lg text-[11px] font-black uppercase  border-2 border-slate-100 hover:border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-4 italic
                                            >
                                                <XCircle className="w-6 h-6" />
                                                TOLAK_PENDAFTARAN
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="p-8 bg-rose-50 rounded-lg border border-rose-100
                                                <FormTextarea
                                                    label="JUSTIFIKASI PENOLAKAN"
                                                    placeholder="Berikan alasan mengapa pendaftaran ini ditolak..."
                                                    value={rejectForm.data.notes}
                                                    onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                                    error={rejectForm.errors.notes}
                                                    required
                                                    className="bg-white border-rose-100 text-slate-900 text-sm italic font-bold h-32 rounded-lg"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <button
                                                    onClick={() => rejectForm.patch(`/admin/registrations/${registration.id}/reject`)}
                                                    disabled={rejectForm.processing}
                                                    className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-black uppercase  active:scale-95 transition-all italic leading-none"
                                                >
                                                    KONFIRMASI_REJECT_AKSI
                                                </button>
                                                <button
                                                    onClick={() => setShowReject(false)}
                                                    className="w-full py-4 text-slate-400 text-[10px] font-black uppercase  hover:text-slate-600 transition-all italic leading-none flex items-center justify-center gap-3"
                                                >
                                                    <X className="h-4 w-4" /> BATALKAN_PROSES
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {registration.notes && (
                             <div className="p-10 bg-amber-50 rounded-lg border border-amber-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-amber-600 pointer-events-none group-hover:rotate-12 transition-transform">
                                     <MessageSquare className="h-40 w-40" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-white rounded-lg text-amber-500 border border-amber-100">
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-amber-600 uppercase  italic leading-none">REJECTION_LOG</h4>
                                            <p className="text-[8px] font-black text-amber-400 uppercase  mt-1.5 italic opacity-60">CATATAN_AUDIT_HISTORIS</p>
                                        </div>
                                    </div>
                                    <p className="text-[14px] font-bold text-amber-900 italic leading-relaxed bg-white/40 p-6 rounded-lg border border-amber-100/50">
                                        "{registration.notes}"
                                    </p>
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ProfileItem({ icon: Icon, label, value }: any) {
    return (
        <div className="group/item space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover/item:bg-primary/20 group-hover/item:border-primary/30 transition-all">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase  group-hover/item:text-primary transition-colors italic">{label}</span>
            </div>
            <p className="text-[15px] font-black text-slate-900 uppercase  italic leading-none pl-1 ml-0.5 group-hover/item:translate-x-1 transition-transform">
                {value}
            </p>
        </div>
    );
}

function IntelRow({ label, value, color = 'text-slate-100' }: any) {
    return (
        <div className="flex flex-col gap-3 group/intel">
            <div className="flex items-center gap-2">
                <div className="h-1 w-3 bg-primary/40 rounded-full group-hover/intel:w-6 transition-all" />
                <span className="text-[9px] font-black text-slate-500 uppercase  italic">{label}</span>
            </div>
            <span className={`text-[15px] font-black uppercase  italic leading-none pl-5 ${color}`}>{value}</span>
        </div>
    );
}
