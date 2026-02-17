import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, Modal } from '@/Components/ui';
import {
    UserGroupIcon,
    PlusIcon,
    ShieldCheckIcon,
    CalendarIcon,
    IdentificationIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    XMarkIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

interface PeriodAssignment {
    id: number;
    dosen_id: number;
    period_id: number;
    max_groups: number;
    is_active: boolean;
    dosen: { id: number; nama: string; nip: string };
    periode: { id: number; name: string; angkatan: number; jenis: string };
    kelompok_count: number;
}

interface DosenOption {
    id: number;
    nama: string;
    nip: string;
}

interface PeriodOption {
    id: number;
    name: string;
    angkatan: number;
    jenis: string;
}

interface Props {
    assignments: PeriodAssignment[];
    allDosen: DosenOption[];
    allPeriods: PeriodOption[];
    title: string;
}

export default function DplAssignment({ assignments, allDosen, allPeriods, title }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    const assignForm = useForm({
        dosen_id: '',
        period_id: '',
        max_groups: '5',
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/admin/dpl/assign-period', {
            onSuccess: () => {
                setShowModal(false);
                assignForm.reset();
            },
        });
    };

    const handleRemove = (dplPeriodId: number) => {
        if (confirm('AUTHORIZATION REQUIRED: DO YOU WISH TO TERMINATE THIS OFFICER DEPLOYMENT?')) {
            assignForm.patch(`/admin/dpl/remove-period/${dplPeriodId}`);
        }
    };

    const filtered = assignments.filter(a =>
        !search ||
        a.dosen.nama.toLowerCase().includes(search.toLowerCase()) ||
        a.dosen.nip.includes(search) ||
        a.periode.name.toLowerCase().includes(search.toLowerCase())
    );

    const dosenOptions = allDosen.map(d => ({ value: d.id, label: `${d.nama} (${d.nip})` }));
    const periodOptions = allPeriods.map(p => ({ value: p.id, label: `Angkatan ${p.angkatan} - ${p.jenis} (${p.name})` }));

    return (
        <AppLayout title="Command Officer Deployment">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">STRATEGIC ASSIGNMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Officer <span className="text-accent-gold text-glow-gold">Deployment</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Assigning Field Command Officers to operational scholastic cycles.</p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="group flex items-center gap-4 px-10 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <PlusIcon className="h-6 w-6 text-accent-gold" />
                        <span className="text-xs font-black uppercase tracking-widest italic">DEPLOY OFFICER</span>
                    </button>
                </div>

                {/* Filter Row */}
                <div className="flex items-center justify-between p-4 glass rounded-[2.5rem]">
                    <div className="relative group max-w-xl flex-1">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN DEPLOYMENTS FOR IDENTIFIERS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-8 py-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/50 transition-all"
                        />
                    </div>
                    <div className="hidden lg:flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <UserGroupIcon className="h-5 w-5 text-accent-gold" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">ACTIVE DEPLOYMENTS: {assignments.length}</span>
                    </div>
                </div>

                {/* Assignment Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Command Officer</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporal Cycle</th>
                                    <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Brigade Load</th>
                                    <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30">System Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Operation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <IdentificationIcon className="h-12 w-12 text-white/5 mb-4" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No active officer deployments detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((a) => (
                                        <tr key={a.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                            <td className="px-8 py-10">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{a.dosen.nama}</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <IdentificationIcon className="h-3 w-3 text-primary-light" />
                                                        <span className="text-[9px] font-black text-white/20 font-mono tracking-widest uppercase">ID // {a.dosen.nip}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-10">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white/60 uppercase tracking-tighter leading-none italic">{a.periode.name}</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <CalendarIcon className="h-3 w-3 text-white/10" />
                                                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest italic">CYCLE {a.periode.angkatan} • {a.periode.jenis}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-10 text-center">
                                                <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                                                    <span className="text-xl font-black text-white italic tabular-nums leading-none">{a.kelompok_count}</span>
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">/ {a.max_groups} LIMIT</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-10 text-center">
                                                <div className={`inline-flex px-4 py-1.5 rounded-xl border text-[8px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md ${a.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                                                    {a.is_active ? 'DEPLOYED' : 'TERMINATED'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-10 text-right">
                                                {a.kelompok_count === 0 && (
                                                    <button
                                                        onClick={() => handleRemove(a.id)}
                                                        className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-90 shadow-2xl"
                                                        title="TERMINATE DEPLOYMENT"
                                                    >
                                                        <TrashIcon className="h-6 w-6" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Deploy Modal */}
                <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                    <div className="glass rounded-[3rem] p-10 border-white/10 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                <UserCircleIcon className="h-8 w-8 text-accent-gold" />
                                Officer Deployment
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAssign} className="space-y-10 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">OFFICER IDENTIFICATION</label>
                                <FormSelect
                                    placeholder="SELECT COMMAND OFFICER..."
                                    options={dosenOptions}
                                    value={assignForm.data.dosen_id}
                                    onChange={(e) => assignForm.setData('dosen_id', e.target.value)}
                                    error={assignForm.errors.dosen_id}
                                    className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">TEMPORAL CYCLE TARGET</label>
                                <FormSelect
                                    placeholder="SELECT DEPLOYMENT CYCLE..."
                                    options={periodOptions}
                                    value={assignForm.data.period_id}
                                    onChange={(e) => assignForm.setData('period_id', e.target.value)}
                                    error={assignForm.errors.period_id}
                                    className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">BRIGADE ALLOCATION LIMIT</label>
                                <FormInput
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={assignForm.data.max_groups}
                                    onChange={(e) => assignForm.setData('max_groups', e.target.value)}
                                    className="bg-black/40 border-white/10 text-xs font-black tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50"
                                />
                                {assignForm.errors.max_groups && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest ml-1">{assignForm.errors.max_groups}</p>}
                            </div>

                            <div className="pt-6 flex gap-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-[2rem] transition-all italic border border-white/5">
                                    ABORT
                                </button>
                                <button type="submit" disabled={assignForm.processing} className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 italic">
                                    AUTHORIZE DEPLOYMENT
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
