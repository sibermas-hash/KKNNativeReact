import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    DocumentCheckIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    XMarkIcon
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
            case 'approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'rejected': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'revision_required': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'submitted': return 'text-primary-light bg-primary/10 border-primary/20';
            default: return 'text-white/20 bg-white/5 border-white/10';
        }
    };

    return (
        <AppLayout title="Mission Blueprint Review">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">STRATEGIC PLANNING</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Mission <span className="text-accent-gold text-glow-gold">Blueprints</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Validation of tactical programs and fiscal resource allocations.</p>
                    </div>

                    <div className="flex items-center gap-6 px-8 py-5 glass rounded-[2rem] group hover:border-accent-gold/20 transition-all">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">PENDING REVIEWS</span>
                            <span className="text-[9px] font-bold text-accent-gold mt-1 tracking-widest uppercase">CRITICAL PATH ANALYSIS</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <ShieldCheckIcon className="h-6 w-6 text-accent-gold" />
                    </div>
                </div>

                {/* Filter / Search Row */}
                <div className="flex items-center justify-between p-4 glass rounded-[2.5rem]">
                    <div className="relative group max-w-lg flex-1">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN BLUEPRINTS FOR IDENTIFIERS..."
                            className="w-full pl-14 pr-8 py-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/50 transition-all"
                        />
                    </div>
                </div>

                {/* Registry Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Blueprint & Brigade</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Primary Objective</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Fiscal Reserve</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Phase</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Command</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {proposals.data.map((proposal) => (
                                    <tr key={proposal.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-8 py-10">
                                            <div className="flex flex-col max-w-xs">
                                                <span className="text-base font-black text-white tracking-tight uppercase italic group-hover:text-accent-gold transition-colors leading-none">{proposal.title}</span>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <UserGroupIcon className="h-3 w-3 text-white/20" />
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{proposal.group?.name} • {proposal.user?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white/60 uppercase tracking-tighter leading-none italic">{proposal.program_title}</span>
                                                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">{proposal.program_department}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl w-fit">
                                                <CurrencyDollarIcon className="h-4 w-4 text-emerald-500" />
                                                <span className="text-[11px] font-black text-white tabular-nums">
                                                    IDR {new Intl.NumberFormat('id-ID').format(proposal.budget || 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className={`inline-flex px-4 py-1.5 rounded-xl border text-[8px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md ${getStatusColor(proposal.status)}`}>
                                                {proposal.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-right">
                                            <button
                                                onClick={() => openReview(proposal)}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/20 hover:text-accent-gold hover:bg-white/10 transition-all active:scale-90 shadow-2xl"
                                                title="EXECUTE REVIEW"
                                            >
                                                <DocumentCheckIcon className="h-6 w-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Review Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="glass rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-white/10 relative">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                    <DocumentCheckIcon className="h-7 w-7 text-accent-gold" />
                                    Blueprint Validation
                                </h3>
                                <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-white transition-colors">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={submitReview} className="p-10 space-y-10 relative z-10">
                                <div className="grid grid-cols-2 gap-6 text-[10px] font-black uppercase tracking-widest">
                                    <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5">
                                        <label className="text-white/20 block mb-2">IDENTIFICATION</label>
                                        <p className="text-white italic line-clamp-1">{selectedProposal?.title}</p>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5">
                                        <label className="text-white/20 block mb-2">BRIGADE HUB</label>
                                        <p className="text-white italic line-clamp-1">{selectedProposal?.group?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">PHASE DETERMINATION</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'approved', label: 'CERTIFY', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' },
                                            { id: 'revision_required', label: 'REVISE', color: 'border-amber-500/20 text-amber-400 bg-amber-500/10' },
                                            { id: 'rejected', label: 'TERMINATE', color: 'border-rose-500/20 text-rose-400 bg-rose-500/10' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setData('status', s.id)}
                                                className={`py-5 px-4 rounded-2xl border transition-all duration-300 text-[10px] font-black tracking-widest uppercase italic shadow-2xl ${data.status === s.id
                                                    ? `${s.color} border-current scale-105 shadow-glow`
                                                    : 'border-white/5 bg-white/5 text-white/20 hover:border-white/20'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 italic">FEEDBACK TELEMETRY</label>
                                    <textarea
                                        value={data.feedback}
                                        onChange={(e) => setData('feedback', e.target.value)}
                                        className="w-full h-40 bg-black/40 rounded-[2rem] border-white/10 focus:border-accent-gold/50 text-xs font-medium tracking-widest text-white/60 p-8 shadow-2xl placeholder:text-white/5"
                                        placeholder="INPUT STRATEGIC FEEDBACK OR REVISION REQUIREMENTS..."
                                    />
                                    {errors.feedback && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest ml-1">{errors.feedback}</p>}
                                </div>

                                <div className="flex items-center gap-6 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 py-5 text-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-[2rem] transition-all"
                                    >
                                        ABORT
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.status}
                                        className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 border border-white/10"
                                    >
                                        COMMIT VALIDATION
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
