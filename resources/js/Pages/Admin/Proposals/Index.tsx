import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    DocumentCheckIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Props {
    proposals: {
        data: any[];
        links: any[];
    };
}

declare function route(name: string, params?: any): string;

export default function AdminProposalsIndex({ proposals }: Props) {
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        status: '',
        feedback: '',
    });

    const openReview = (proposal: any) => {
        setSelectedProposal(proposal);
        setData({
            status: proposal.status,
            feedback: proposal.feedback || '',
        });
        setShowReviewModal(true);
    };

    const submitReview = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.proposals.review', selectedProposal.id), {
            onSuccess: () => {
                setShowReviewModal(false);
                reset();
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700';
            case 'rejected': return 'bg-rose-100 text-rose-700';
            case 'revision_required': return 'bg-amber-100 text-amber-700';
            case 'submitted': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <AppLayout title="Kelola Proposal KKN">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Review Proposal Program Kerja</h1>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari proposal..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary w-full md:w-64"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Judul & Kelompok</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Program Utama</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Anggaran</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {proposals.data.map((proposal) => (
                                <tr key={proposal.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{proposal.title}</p>
                                        <p className="text-xs text-slate-500">{proposal.group?.name} • Oleh: {proposal.user?.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700">{proposal.program_title}</p>
                                        <p className="text-xs text-slate-400">{proposal.program_department}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Rp {new Intl.NumberFormat('id-ID').format(proposal.budget || 0)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(proposal.status)}`}>
                                            {proposal.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openReview(proposal)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                                            title="Review"
                                        >
                                            <DocumentCheckIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Review Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-800">Review Proposal</h3>
                                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                            </div>
                            <form onSubmit={submitReview} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Judul</label>
                                        <p className="font-semibold text-slate-900">{selectedProposal?.title}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Kelompok</label>
                                        <p className="font-semibold text-slate-900">{selectedProposal?.group?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Tentukan Status</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['approved', 'revision_required', 'rejected'].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setData('status', s)}
                                                className={`py-3 px-4 rounded-xl border-2 text-xs font-bold uppercase transition-all ${data.status === s
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {s.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Catatan / Feedback</label>
                                    <textarea
                                        value={data.feedback}
                                        onChange={(e) => setData('feedback', e.target.value)}
                                        className="w-full h-32 rounded-2xl border-slate-200 focus:ring-primary focus:border-primary text-sm p-4"
                                        placeholder="Berikan alasan atau instruksi revisi..."
                                    />
                                    {errors.feedback && <p className="text-rose-500 text-xs">{errors.feedback}</p>}
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.status}
                                        className="flex-[2] py-4 bg-primary text-white font-extrabold rounded-3xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50"
                                    >
                                        SIMPAN HASIL REVIEW
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
