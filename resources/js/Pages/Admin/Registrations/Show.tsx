import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormTextarea, StatusBadge, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    User, 
    FileText, 
    Info, 
    ShieldCheck, 
    ShieldAlert, 
    ArrowRight,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Fingerprint,
    Database,
    Binary,
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
    periode?: {
        name?: string | null;
        governance?: {
            program_type_label?: string | null;
            program_subtype_label?: string | null;
            registration_mode_label?: string | null;
            placement_mode_label?: string | null;
        } | null;
        guide?: {
            requirements?: string[];
            governance_notes?: string[];
        } | null;
    } | null;
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
        <AppLayout title="Verifikasi Pendaftaran">
            <Head title={`Verifikasi: ${registration.mahasiswa?.nama || '-'}`} />

            <div className="min-h-screen bg-white pb-32">
                {/* EMERALD SYSTEM HEADER */}
                <div className="bg-white border-b border-emerald-50 px-8 py-10">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60">
                                    Otoritas Verifikasi Registrasi
                                </span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter text-emerald-950 uppercase italic flex items-center gap-4">
                                DETAIL <span className="text-emerald-500">PENDAFTARAN</span>
                            </h1>
                            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-1">
                                NO. REGISTRASI: #{registration.id} • PERIODE: {registration.periode?.name || '-'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link 
                                href="/admin/pendaftaran" 
                                className="h-14 px-8 bg-white border border-emerald-100 flex items-center gap-4 group hover:border-emerald-500 transition-all text-[11px] font-black text-emerald-900 uppercase tracking-widest"
                            >
                                <ArrowLeft className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                                Kembali ke Daftar
                            </Link>

                            <div className="h-14 px-8 bg-emerald-950 flex items-center gap-8 shadow-xl border border-emerald-900">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest leading-none mb-1.5 text-center">Status Verifikasi</span>
                                    <StatusBadge status={registration.status} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid gap-8 xl:grid-cols-12 items-start">
                    <div className="xl:col-span-8 space-y-8">
                        {/* STUDENT IDENTITY */}
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-emerald-50 overflow-hidden shadow-sm"
                        >
                            <div className="px-8 py-6 border-b border-emerald-50 flex items-center gap-6 bg-emerald-50/10">
                                <div className="p-3 bg-emerald-600 text-white shadow-lg">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Identitas Mahasiswa</h2>
                                    <p className="text-[9px] font-bold text-emerald-300 mt-1 uppercase tracking-widest italic">Data terverifikasi sistem pangkalan data perguruan tinggi</p>
                                </div>
                            </div>
                            <div className="p-10">
                                <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                                    <DetailItem label="Nama Lengkap" value={registration.mahasiswa?.nama} />
                                    <DetailItem label="Nomor Induk Mahasiswa (NIM)" value={registration.mahasiswa?.nim} />
                                    <DetailItem label="Fakultas" value={registration.mahasiswa?.fakultas?.nama} />
                                    <DetailItem label="Program Studi" value={registration.mahasiswa?.prodi?.nama} />
                                    <DetailItem label="Angkatan" value={registration.mahasiswa?.batch_year?.toString()} />
                                    <DetailItem label="Jenis Kelamin" value={registration.mahasiswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                </dl>
                            </div>
                        </motion.section>

                        {/* DOCUMENT VERIFICATION */}
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white border border-emerald-50 overflow-hidden shadow-sm"
                        >
                            <div className="px-8 py-6 border-b border-emerald-50 flex items-center gap-6 bg-emerald-50/10">
                                <div className="p-3 bg-emerald-600 text-white shadow-lg">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Dokumen Persyaratan</h2>
                                    <p className="text-[9px] font-bold text-emerald-300 mt-1 uppercase tracking-widest italic">Berkas administrasi yang diunggah oleh pendaftar</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="group flex items-center justify-between p-6 bg-white border border-emerald-50 hover:border-emerald-500 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[10px] italic shadow-sm group-hover:scale-105 transition-transform uppercase">
                                                    PDF
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-emerald-950 uppercase italic tracking-tight">{doc.document_type || 'Dokumen'}</span>
                                                    <span className="text-[9px] font-bold text-emerald-300 truncate max-w-[200px] md:max-w-md uppercase tracking-tight">{doc.file_name || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <StatusBadge status={doc.status || 'menunggu'} />
                                                <Link 
                                                    href={doc.file_path || '#'} 
                                                    target="_blank"
                                                    className="h-10 w-10 bg-white border border-emerald-50 text-emerald-100 hover:text-emerald-600 hover:border-emerald-500 transition-all flex items-center justify-center active:scale-90 shadow-sm"
                                                >
                                                    <ArrowRight size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] italic opacity-20 border-2 border-dashed border-emerald-50">
                                        <ShieldAlert size={32} className="mx-auto mb-4" />
                                        Berkas pendaftaran nihil
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        {/* REGISTRATION STATS */}
                        <motion.section 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-950 p-8 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-white">
                                <Database size={120} className="-rotate-12" />
                            </div>
                            <div className="relative z-10 space-y-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 shadow-xl">
                                        <Info size={18} className="text-emerald-950" />
                                    </div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-emerald-400 leading-none">Informasi Layanan</h2>
                                </div>
                                <div className="space-y-6">
                                    <SummaryItem label="Tgl Pendaftaran" value={registration.registration_date} />
                                    <SummaryItem
                                        label="Jenis Program"
                                        value={registration.periode?.governance?.program_subtype_label || registration.periode?.governance?.program_type_label || registration.periode?.name}
                                    />
                                    <SummaryItem
                                        label="Mode Pendaftaran"
                                        value={registration.periode?.governance?.registration_mode_label || '-'}
                                    />
                                    <SummaryItem
                                        label="Mode Penempatan"
                                        value={registration.periode?.governance?.placement_mode_label || '-'}
                                    />
                                    <SummaryItem label="Unit Kelompok" value={registration.kelompok?.nama_kelompok || 'Belum Ditempatkan'} />
                                    <SummaryItem label="Peran Unit" value={registration.role || 'Anggota'} />
                                </div>
                            </div>
                        </motion.section>

                        {registration.periode?.guide ? (
                            <motion.section
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 }}
                                className="bg-white border border-emerald-50 overflow-hidden shadow-sm"
                            >
                                <div className="px-8 py-6 border-b border-emerald-50 flex items-center gap-6 bg-emerald-50/10">
                                    <div className="p-3 bg-emerald-600 text-white shadow-lg">
                                        <Fingerprint size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Panduan Skema Program</h2>
                                        <p className="text-[9px] font-bold text-emerald-300 mt-1 uppercase tracking-widest italic">Ringkasan tata kelola dan syarat dasar sesuai skema KKN</p>
                                    </div>
                                </div>
                                <div className="grid gap-6 p-8 md:grid-cols-2">
                                    <GuideList
                                        title="Syarat Dasar"
                                        items={registration.periode.guide.requirements || []}
                                    />
                                    <GuideList
                                        title="Tata Kelola"
                                        items={registration.periode.guide.governance_notes || []}
                                    />
                                </div>
                            </motion.section>
                        ) : null}

                        {/* ADMIN DECISION CARD */}
                        <motion.section 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className={clsx(
                                "border p-8 shadow-sm transition-all",
                                isPending ? "bg-white border-emerald-200" : "bg-emerald-50/10 border-emerald-50"
                            )}
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className={clsx(
                                    "p-3 shadow-lg",
                                    isPending ? "bg-emerald-600 text-white" : "bg-white border border-emerald-50 text-emerald-200"
                                )}>
                                    <ClipboardCheck size={18} />
                                </div>
                                <h2 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em] italic leading-none">Protokol Verifikasi</h2>
                            </div>

                            {isPending ? (
                                <div className="space-y-4">
                                    {!showRejectForm ? (
                                        <>
                                            <Button
                                                onClick={() => approveForm.patch(`/admin/pendaftaran/${registration.id}/setujui`)}
                                                disabled={approveForm.processing}
                                                className="w-full h-14 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 border-none"
                                            >
                                                <CheckCircle2 size={16} />
                                                Setujui Pendaftaran
                                            </Button>
                                            <Button
                                                onClick={() => setShowRejectForm(true)}
                                                variant="outline"
                                                className="w-full h-14 bg-white border border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 hover:bg-rose-50 transition-all active:scale-95"
                                            >
                                                <XCircle size={16} />
                                                Tolak Berkas
                                            </Button>
                                        </>
                                    ) : (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                rejectForm.patch(`/admin/pendaftaran/${registration.id}/tolak`, {
                                                    onSuccess: () => setShowRejectForm(false),
                                                });
                                            }}
                                            className="space-y-6"
                                        >
                                            <FormTextarea
                                                label="Alasan Penolakan"
                                                required
                                                placeholder="Sebutkan alasan diskualifikasi berkas..."
                                                value={rejectForm.data.notes}
                                                onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                                error={rejectForm.errors.notes}
                                                className="text-[11px] font-black border-rose-50 focus:ring-rose-50 focus:border-rose-300 uppercase italic placeholder:lowercase placeholder:font-bold"
                                            />
                                            <div className="flex gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={() => setShowRejectForm(false)}
                                                    variant="secondary"
                                                    className="flex-1 h-12 bg-emerald-50 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em] italic transition-all border-none"
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={rejectForm.processing}
                                                    className="flex-1 h-12 bg-rose-600 text-white font-black text-[9px] uppercase tracking-[0.2em] italic transition-all shadow-xl active:scale-95 disabled:opacity-50 border-none"
                                                >
                                                    Konfirmasi
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 bg-emerald-300 rounded-full" />
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest italic">Riwayat Keputusan Akhir:</p>
                                    </div>
                                    <div className="p-6 bg-white border border-emerald-50 text-[11px] font-black text-emerald-950 italic uppercase tracking-tight leading-relaxed">
                                        "{registration.status === 'rejected'
                                            ? (registration.rejection_reason || 'Tidak ada alasan penolakan yang tercatat.')
                                            : (registration.notes || 'Pendaftaran disetujui tanpa catatan khusus.')}"
                                    </div>
                                    {registration.status === 'rejected' && (
                                        <div className="space-y-2 pt-2 border-t border-emerald-50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 italic">
                                                Total Revisi: {registration.revision_count ?? 0} Kali
                                            </p>
                                            {registration.resubmitted_at && (
                                                <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest italic">
                                                    Resubmisi Terakhir: {registration.resubmitted_at}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.section>

                        <div className="pt-4 text-center">
                             <div className="inline-flex items-center justify-center gap-4 font-black text-[9px] uppercase tracking-[0.5em] italic text-emerald-100 opacity-30 hover:opacity-100 transition-opacity duration-1000">
                                 <Binary size={12} className="text-emerald-500" />
                                 Audit Verifikasi KKN • {new Date().getFullYear()}
                             </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER AUDIT */}
                <div className="mx-8 mt-8 bg-emerald-50/20 border border-emerald-50 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-600 text-white shadow-xl">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-emerald-950 uppercase italic tracking-widest leading-none mb-2">Integritas Pendaftaran Lapangan</h4>
                            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-tight italic">Keputusan verifikasi pendaftaran bersifat final dan tercatat secara permanen dalam log audit mutu.</p>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-white border border-emerald-100 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] italic shadow-sm italic tabular-nums">
                        Log audit #{registration.id} tervalidasi
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-lg border border-emerald-50 bg-emerald-50/10 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-900 italic">{title}</p>
            <ul className="mt-4 space-y-2 text-[11px] font-semibold text-emerald-900">
                {items.map((item) => (
                    <li key={item} className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-3">
            <dt className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest italic leading-none border-l-2 border-emerald-50 pl-3">
                {label}
            </dt>
            <dd className="text-[11px] font-black text-emerald-950 uppercase italic tracking-tight leading-tight">
                {value || '-'}
            </dd>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.3em] italic">{label}</span>
            <span className="text-[11px] font-black uppercase italic tracking-tight text-white">{value || '-'}</span>
        </div>
    );
}
