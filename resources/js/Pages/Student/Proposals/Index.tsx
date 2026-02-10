import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    DocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

interface Props {
    proposal: any;
}

declare function route(name: string, params?: any): string;

export default function StudentProposalsIndex({ proposal }: Props) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: proposal?.title || '',
        program_title: proposal?.program_title || '',
        program_department: proposal?.program_department || '',
        team_member_count: proposal?.team_member_count || 1,
        team_members: proposal?.team_members || [{ name: '', role: '' }] as any[],
        budget: proposal?.budget || 0,
        objectives: proposal?.objectives || '',
    });

    const addTeamMember = () => {
        setData('team_members', [...data.team_members, { name: '', role: '' }]);
    };

    const removeTeamMember = (index: number) => {
        const newMembers = [...data.team_members];
        newMembers.splice(index, 1);
        setData('team_members', newMembers);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('student.proposals.store'), {
            onSuccess: () => {
                setShowForm(false);
                reset();
            },
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircleIcon className="h-10 w-10 text-emerald-500" />;
            case 'rejected': return <ExclamationCircleIcon className="h-10 w-10 text-rose-500" />;
            case 'submitted': return <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" />;
            default: return <DocumentIcon className="h-10 w-10 text-slate-300" />;
        }
    };

    const canEdit = !proposal || proposal.status === 'revision_required' || proposal.status === 'draft';

    return (
        <AppLayout title="Proposal Program Kerja">
            <div className="max-w-4xl mx-auto space-y-8">
                {proposal && !showForm ? (
                    <div className="space-y-8">
                        {/* Status Header */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                            {getStatusIcon(proposal.status)}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Status: {proposal.status.replace('_', ' ').toUpperCase()}
                                </h2>
                                <p className="text-slate-500">
                                    Diajukan pada: {new Date(proposal.submitted_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                </p>
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition"
                                >
                                    Edit Proposal
                                </button>
                            )}
                        </div>

                        {proposal.feedback && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                <h4 className="font-bold text-amber-800 mb-2">Feedback Peninjau:</h4>
                                <p className="text-amber-700 text-sm italic">"{proposal.feedback}"</p>
                            </div>
                        )}

                        {/* Proposal Details View */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Judul Proposal</h3>
                                    <p className="text-xl font-bold text-slate-900">{proposal.title}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Program Utama</h3>
                                        <p className="font-semibold text-slate-800">{proposal.program_title}</p>
                                        <p className="text-sm text-slate-500">{proposal.program_department}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Estimasi Anggaran</h3>
                                        <p className="font-bold text-slate-900 text-lg">Rp {new Intl.NumberFormat('id-ID').format(proposal.budget || 0)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Anggota Tim ({proposal.team_member_count})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {proposal.team_members.map((m: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">{m.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tujuan Program</h3>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {proposal.objectives}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-2xl font-bold text-slate-900">Ajukan Proposal Program Kerja</h2>
                            <p className="text-slate-500 text-sm">Lengkapi data proposal kelompok Anda untuk ditinjau oleh LPPM/DPL.</p>
                        </div>
                        <form onSubmit={submit} className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Judul Proposal</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Contoh: Pemberdayaan UMKM Digital Desa Dompet"
                                    className="w-full rounded-2xl border-slate-200 focus:ring-primary focus:border-primary p-4"
                                />
                                {errors.title && <p className="text-rose-500 text-xs font-medium">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Program Utama</label>
                                    <input
                                        type="text"
                                        value={data.program_title}
                                        onChange={(e) => setData('program_title', e.target.value)}
                                        className="w-full rounded-2xl border-slate-200 focus:ring-primary focus:border-primary p-4"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Anggaran Direncanakan (Rp)</label>
                                    <input
                                        type="number"
                                        value={data.budget}
                                        onChange={(e) => setData('budget', Number(e.target.value))}
                                        className="w-full rounded-2xl border-slate-200 focus:ring-primary focus:border-primary p-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700">Anggota Tim Pelaksana</label>
                                    <button
                                        type="button"
                                        onClick={addTeamMember}
                                        className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <PlusIcon className="h-4 w-4" /> Tambah Anggota
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.team_members.map((member: any, index: number) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                                            {data.team_members.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTeamMember(index)}
                                                    className="absolute -right-2 -top-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Lengkap"
                                                    value={member.name}
                                                    onChange={(e) => {
                                                        const newMembers = [...data.team_members];
                                                        newMembers[index].name = e.target.value;
                                                        setData('team_members', newMembers);
                                                    }}
                                                    className="w-full rounded-xl border-slate-100 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Peran (Contoh: Ketua, Sekretaris)"
                                                    value={member.role}
                                                    onChange={(e) => {
                                                        const newMembers = [...data.team_members];
                                                        newMembers[index].role = e.target.value;
                                                        setData('team_members', newMembers);
                                                    }}
                                                    className="w-full rounded-xl border-slate-100 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Tujuan & Outline Program</label>
                                <textarea
                                    value={data.objectives}
                                    onChange={(e) => setData('objectives', e.target.value)}
                                    className="w-full h-40 rounded-2xl border-slate-200 focus:ring-primary focus:border-primary p-4"
                                    placeholder="Jelaskan secara singkat apa yang ingin dicapai melalui program ini..."
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                {proposal && (
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition"
                                    >
                                        Batal
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-[2] py-5 bg-primary text-white font-extrabold rounded-3xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {processing ? 'MENGIRIM...' : 'KIRIM PROPOSAL SEKARANG'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
