import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    ChevronLeft, 
    User, 
    FileText, 
    Info, 
    ShieldCheck, 
    ShieldAlert, 
    Calendar,
    ArrowRight,
    ClipboardCheck,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface RegistrationDocument {
    id: number;
    document_type?: string | null;
    file_name?: string | null;
    file_path?: string | null;
    status?: string | null;
}

interface RegistrationData {
    id: number;
    status: string;
    registration_date?: string | null;
    notes?: string | null;
    rejection_reason?: string | null;
    revision_count?: number | null;
    last_rejected_at?: string | null;
    resubmitted_at?: string | null;
    role?: string | null;
    mahasiswa?: {
        nim?: string | null;
        nama?: string | null;
        gender?: string | null;
        batch_year?: number | null;
        fakultas?: { nama?: string | null } | null;
        prodi?: { nama?: string | null } | null;
    } | null;
    periode?: { name?: string | null } | null;
    kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
    dokumen?: RegistrationDocument[];
}

interface Props extends PageProps {
    registration: RegistrationData;
}

export default function RegistrationShow({ registration }: Props) {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const approveForm = useForm({});
    const rejectForm = useForm({
        notes: registration.rejection_reason ?? '',
    });

    const documents = useMemo(() => registration.dokumen ?? [], [registration.dokumen]);
    const isPending = ['menunggu', 'pending', 'document_submitted'].includes(registration.status);

    return (
        <AppLayout title="Detail Verifikasi Pendaftaran">
            <Head title="Verifikasi Pendaftaran KKN" />

            <div className="space-y-8 pb-20">
                {/* Clean Header Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-4">
                            <Link
                                href="/admin/pendaftaran"
                                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Kembali ke Daftar
                            </Link>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Verifikasi <span className="text-emerald-600">Pendaftaran</span>
                                </h1>
                                <p className="text-xs text-slate-500 font-medium whitespace-nowrap">ID_REG: #{registration.id} • Periode: {registration.periode?.name || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border uppercase shadow-sm",
                                    registration.status === 'disetujui' || registration.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    registration.status === 'ditolak' || registration.status === 'rejected' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                    "bg-amber-50 text-amber-700 border-amber-100"
                                )}>
                                    Status: {registration.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-3">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Student Identity Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/20">
                                <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-emerald-600 shadow-sm">
                                    <User className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Identitas Mahasiswa</h2>
                            </div>
                            <div className="p-8">
                                <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                                    <DetailItem label="Nama Lengkap" value={registration.mahasiswa?.nama} />
                                    <DetailItem label="Nomor Induk Mahasiswa (NIM)" value={registration.mahasiswa?.nim} />
                                    <DetailItem label="Fakultas" value={registration.mahasiswa?.fakultas?.nama} />
                                    <DetailItem label="Program Studi" value={registration.mahasiswa?.prodi?.nama} />
                                    <DetailItem label="Angkatan" value={registration.mahasiswa?.batch_year?.toString()} />
                                    <DetailItem label="Jenis Kelamin" value={registration.mahasiswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                </dl>
                            </div>
                        </div>

                        {/* Document Verification Section */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/20">
                                <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-emerald-600 shadow-sm">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Berkas Persyaratan</h2>
                            </div>
                            <div className="p-8 space-y-4">
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all font-bold text-xs uppercase shadow-sm">
                                                    PDF
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">{doc.document_type || 'Dokumen'}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[200px] md:max-w-md">{doc.file_name || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <StatusBadge status={doc.status || 'menunggu'} />
                                                <button className="p-2 text-slate-300 hover:text-emerald-600 transition-colors">
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center py-10 opacity-30 gap-3">
                                        <ShieldAlert className="w-10 h-10 text-slate-200" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada dokumen yang diunggah</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Registration Stats */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Calendar className="w-24 h-24" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 border-b border-white/10 pb-4">
                                    <Info className="w-4 h-4 text-emerald-400" />
                                    Info Layanan
                                </h2>
                                <div className="space-y-4">
                                    <SummaryItem label="Tgl Pendaftaran" value={registration.registration_date} />
                                    <SummaryItem label="Unit Kelompok" value={registration.kelompok?.nama_kelompok || 'Belum Ditempatkan'} />
                                    <SummaryItem label="Peran Unit" value={registration.role || 'Anggota'} />
                                </div>
                            </div>
                        </div>

                        {/* Admin Decision Card */}
                        <div className={clsx(
                            "rounded-[2.5rem] border p-8 shadow-sm transition-all",
                            isPending ? "bg-white border-emerald-200" : "bg-slate-50 border-slate-200"
                        )}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className={clsx(
                                    "p-2.5 rounded-xl border shadow-sm",
                                    isPending ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-slate-100 text-slate-400"
                                )}>
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Keputusan Admin</h2>
                            </div>

                            {isPending ? (
                                <div className="space-y-3">
                                    {!showRejectForm ? (
                                        <>
                                            <button
                                                onClick={() => approveForm.patch(`/admin/pendaftaran/${registration.id}/setujui`)}
                                                disabled={approveForm.processing}
                                                className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Setujui Pendaftaran
                                            </button>
                                            <button
                                                onClick={() => setShowRejectForm(true)}
                                                className="w-full h-12 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-50 transition-all active:scale-95"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Tolak Berkas
                                            </button>
                                        </>
                                    ) : (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                rejectForm.patch(`/admin/pendaftaran/${registration.id}/tolak`, {
                                                    onSuccess: () => setShowRejectForm(false),
                                                });
                                            }}
                                            className="space-y-4"
                                        >
                                            <FormTextarea
                                                label="Alasan Penolakan"
                                                required
                                                placeholder="Berikan alasan mengapa berkas ditolak..."
                                                value={rejectForm.data.notes}
                                                onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                                error={rejectForm.errors.notes}
                                                className="text-sm font-semibold border-rose-200 focus:ring-rose-500/10 focus:border-rose-500 rounded-2xl"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRejectForm(false)}
                                                    className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={rejectForm.processing}
                                                    className="flex-1 h-10 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    Konfirmasi
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Pendaftaran telah diproses.</p>
                                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 italic">
                                        "{registration.status === 'rejected'
                                            ? (registration.rejection_reason || 'Tidak ada alasan penolakan yang tercatat.')
                                            : (registration.notes || 'Tidak ada catatan khusus.')}"
                                    </div>
                                    {registration.status === 'rejected' ? (
                                        <div className="space-y-1 pt-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
                                                Riwayat pengajuan ulang: {registration.revision_count ?? 0} kali
                                            </p>
                                            {registration.resubmitted_at ? (
                                                <p className="text-[10px] font-semibold text-slate-500">
                                                    Terakhir diajukan ulang: {registration.resubmitted_at}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 text-emerald-600 shadow-sm">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">Integritas Pendaftaran</h4>
                            <p className="text-xs text-slate-500 font-medium">Keputusan verifikasi pendaftaran tercatat secara permanen untuk keperluan audit penjaminan mutu KKN.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-xl border border-slate-100 text-[10px] font-bold text-emerald-600 uppercase tracking-widest shadow-sm">
                        Verification_Audit_OK
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-2">
            <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {label}
            </dt>
            <dd className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-tight">
                {value || '-'}
            </dd>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-sm font-bold uppercase tracking-tight text-white">{value || '-'}</span>
        </div>
    );
}
