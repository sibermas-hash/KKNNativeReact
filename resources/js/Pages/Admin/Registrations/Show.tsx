import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { useState } from 'react';
import {
    UserIcon,
    IdentificationIcon,
    AcademicCapIcon,
    CalendarIcon,
    DocumentIcon,
    ShieldCheckIcon,
    XCircleIcon,
    ArrowLeftIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

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
        <AppLayout title="Candidate Profile Inspector">
            <div className="space-y-10 pb-16 animate-in fade-in duration-1000">
                {/* Header Sub-Navigation */}
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <Link href="/admin/registrations" className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-accent-gold transition-colors">
                        <ArrowLeftIcon className="w-3 h-3" />
                        Back to Registry
                    </Link>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={registration.status} className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                    {/* Primary Data Panel (Left) */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Student Core Profile */}
                        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl p-10 relative overflow-hidden group backdrop-blur-xxl">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                <UserIcon className="w-64 h-64 text-white" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-4xl font-black shadow-2xl border border-white/10">
                                        {registration.student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{registration.student.name}</h2>
                                        <p className="text-accent-gold font-black text-sm tracking-[0.3em] uppercase mt-2">Verified Scholar Participant</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <ProfileItem icon={IdentificationIcon} label="Identification NIM" value={registration.student.nim} mono />
                                    <ProfileItem icon={AcademicCapIcon} label="Academic Faculty" value={registration.student.faculty?.name || 'GENERIC'} />
                                    <ProfileItem icon={ShieldCheckIcon} label="Degree Program" value={registration.student.program?.name || 'UNDERGRADUATE'} />
                                    <ProfileItem icon={CalendarIcon} label="Batch Cohort" value={registration.student.batch_year.toString()} />
                                </div>
                            </div>
                        </div>

                        {/* Documents & Assets */}
                        <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 shadow-xl p-10 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                    <DocumentIcon className="w-7 h-7 text-accent-gold" />
                                    Evidence Ledger
                                </h3>
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">IMMUTABLE SUBMISSIONS</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {registration.documents.map((doc) => (
                                    <div key={doc.id} className="group relative bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:border-primary/50 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                                <DocumentIcon className="w-5 h-5 text-primary-light" />
                                            </div>
                                            <StatusBadge status={doc.status} className="text-[8px]" />
                                        </div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{doc.document_type}</p>
                                        <p className="text-xs font-bold text-white truncate max-w-full italic">{doc.file_name}</p>

                                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                                            <button className="px-6 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
                                                AUDIT DOCUMENT
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Intel Panel (Right) */}
                    <div className="space-y-10">
                        {/* Enrolment Metadata */}
                        <div className="bg-gradient-to-br from-surface-panel to-black rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-8 border-b border-white/10 pb-4">Lifecycle Intel</h3>
                                <div className="space-y-8">
                                    <IntelRow label="Cycle Period" value={registration.period.name} />
                                    <IntelRow label="Entry Date" value={registration.registration_date} />
                                    <IntelRow label="Brigade Signal" value={registration.group?.name || 'NOT ASSIGNED'} color={registration.group ? 'text-accent-gold' : 'text-white/20'} />
                                </div>
                            </div>
                        </div>

                        {/* Decision Nexus (Actions) */}
                        {isPending && (
                            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <ShieldCheckIcon className="w-20 h-20 text-accent-gold" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-8">Authorisation</h3>

                                    {!showReject ? (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => approveForm.patch(`/admin/registrations/${registration.id}/approve`)}
                                                disabled={approveForm.processing}
                                                className="w-full py-5 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
                                            >
                                                <CheckBadgeIcon className="w-5 h-5" />
                                                GRANT ACCESS
                                            </button>
                                            <button
                                                onClick={() => setShowReject(true)}
                                                className="w-full py-5 bg-white/5 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/10 hover:border-rose-500/50 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <XCircleIcon className="w-5 h-5" />
                                                REJECT PROTOCOL
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                            <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl">
                                                <FormTextarea
                                                    label="REJECTION JUSTIFICATION"
                                                    value={rejectForm.data.notes}
                                                    onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                                    error={rejectForm.errors.notes}
                                                    required
                                                    className="bg-black/40 border-white/10 text-white text-xs"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => rejectForm.patch(`/admin/registrations/${registration.id}/reject`)}
                                                    disabled={rejectForm.processing}
                                                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                                                >
                                                    CONFIRM REJECTION
                                                </button>
                                                <button
                                                    onClick={() => setShowReject(false)}
                                                    className="w-full py-4 text-white/30 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                                >
                                                    CANCEL ACTION
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ProfileItem({ icon: Icon, label, value, mono = false }: any) {
    return (
        <div className="group/item">
            <div className="flex items-center gap-3 mb-3">
                <Icon className="w-4 h-4 text-accent-gold" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/item:text-accent-gold transition-colors">{label}</span>
            </div>
            <p className={`text-sm font-black text-white uppercase tracking-tight ${mono ? 'font-mono' : ''}`}>
                {value}
            </p>
        </div>
    );
}

function IntelRow({ label, value, color = 'text-white' }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</span>
            <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{value}</span>
        </div>
    );
}
