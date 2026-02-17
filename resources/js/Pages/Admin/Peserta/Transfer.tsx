import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, FormSelect, FormTextarea, Modal } from '@/Components/ui';
import {
    ArrowsRightLeftIcon,
    MagnifyingGlassIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

interface Student {
    id: number;
    mahasiswa: {
        nama: string;
        nim: string;
    };
    status: string;
    kelompok?: {
        id: number;
        nama_kelompok: string;
        code: string;
    } | null;
    periode: {
        id: number;
        name: string;
        angkatan: number;
        jenis: string;
    };
}

interface PeriodOption {
    id: number;
    name: string;
    angkatan: number;
    jenis: string;
    kuota: number | null;
}

interface GroupOption {
    id: number;
    nama: string;
    capacity: number | null;
    current_count: number;
    available: number | null;
}

interface Props {
    students: Student[];
    targetPeriods: PeriodOption[];
}

export default function StudentTransfer({ students, targetPeriods }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroups, setTargetGroups] = useState<GroupOption[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [search, setSearch] = useState('');

    const transferForm = useForm({
        peserta_kkn_id: '',
        target_period_id: '',
        target_group_id: '',
        reason: '',
    });

    const openTransfer = (student: Student) => {
        setSelectedStudent(student);
        transferForm.setData('peserta_kkn_id', String(student.id));
        transferForm.setData('target_period_id', '');
        transferForm.setData('target_group_id', '');
        transferForm.setData('reason', '');
        setTargetGroups([]);
        setShowModal(true);
    };

    const handlePeriodChange = async (value: string) => {
        transferForm.setData('target_period_id', value);
        transferForm.setData('target_group_id', '');
        setTargetGroups([]);

        if (value) {
            setLoadingGroups(true);
            try {
                const res = await fetch(`/admin/api/transfer-targets?current_period_id=${selectedStudent?.periode.id}&target_period_id=${value}`);
                const data = await res.json();
                setTargetGroups(data.groups || []);
            } catch {
                setTargetGroups([]);
            } finally {
                setLoadingGroups(false);
            }
        }
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        transferForm.post('/admin/peserta/transfer', {
            onSuccess: () => {
                setShowModal(false);
                setSelectedStudent(null);
                transferForm.reset();
            },
        });
    };

    const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
        pending: { variant: 'warning', label: 'PENDING' },
        approved: { variant: 'success', label: 'AUTHORIZED' },
        rejected: { variant: 'danger', label: 'DENIED' },
        transferred: { variant: 'info', label: 'RE-DEPLOYED' },
        completed: { variant: 'success', label: 'FINALIZED' },
    };

    const filtered = students.filter(s =>
        !search ||
        s.mahasiswa.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.mahasiswa.nim.includes(search)
    );

    const transferableStudents = filtered.filter(s => s.status !== 'completed' && s.status !== 'rejected');

    const periodOptions = targetPeriods.map(p => ({
        value: p.id,
        label: `COHORT ${p.angkatan} // ${p.jenis} [${p.name}]${p.kuota ? ` (CAP: ${p.kuota})` : ''}`,
    }));

    const groupOptions = targetGroups.map(g => ({
        value: g.id,
        label: `BRIGADE ${g.nama} (${g.current_count}/${g.capacity ?? '∞'})${g.available !== null ? ` - REM: ${g.available}` : ''}`,
    }));

    return (
        <AppLayout title="Re-Deployment Nexus">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">SCHOLAR RE-DEPLOYMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Operational <span className="text-accent-gold text-glow-gold">Transfer</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrating unit assignments and cross-cohort re-deployment.</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6 group hover:border-accent-gold/20 transition-all">
                        <ArrowsRightLeftIcon className="h-6 w-6 text-accent-gold group-hover:rotate-180 transition-all duration-1000" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">MOBILIZATION READY</span>
                            <span className="text-xl font-black text-white mt-1 tabular-nums">{transferableStudents.length} UNITS</span>
                        </div>
                    </div>
                </div>

                {/* Registry Ledger (Table) */}
                <div className="space-y-8">
                    <div className="relative group max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN SCHOLAR IDENTIFIERS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                        />
                    </div>

                    <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                        <div className="overflow-x-auto relative z-10">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/[0.02]">
                                    <tr>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scholar Asset</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Cycle Period</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Current Brigade</th>
                                        <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Status</th>
                                        <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Mobilization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-32 text-center text-white/20">
                                                <div className="flex flex-col items-center gap-6">
                                                    <ArrowsRightLeftIcon className="h-16 w-16 opacity-10" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">No scholar assets detected in current sweep.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((s) => {
                                            const status = statusMap[s.status] || { variant: 'warning' as const, label: s.status.toUpperCase() };
                                            const canTransfer = s.status !== 'completed' && s.status !== 'rejected';
                                            return (
                                                <tr key={s.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                    <td className="px-10 py-10">
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{s.mahasiswa.nama}</span>
                                                            <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase mt-2 font-mono">NIM // {s.mahasiswa.nim}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-10">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{s.periode.name}</span>
                                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 italic">COHORT {s.periode.angkatan} • {s.periode.jenis}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-10">
                                                        {s.kelompok ? (
                                                            <span className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-light text-[9px] font-black uppercase tracking-widest">
                                                                {s.kelompok.nama_kelompok || s.kelompok.code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic tracking-[0.2em]">UNASSIGNED</span>
                                                        )}
                                                    </td>
                                                    <td className="px-10 py-10 text-center">
                                                        <Badge variant={status.variant} className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                            {status.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-10 py-10 text-right">
                                                        {canTransfer && (
                                                            <button
                                                                onClick={() => openTransfer(s)}
                                                                className="px-6 py-3 bg-white/5 border border-white/5 text-white/40 hover:text-accent-gold hover:bg-white/10 hover:border-accent-gold/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all group-hover:px-8"
                                                            >
                                                                RE-DEPLOY
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* System Ledger Note */}
                <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <MapPinIcon className="h-24 w-24" />
                    </div>
                    <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        Mobilization Protocols
                    </h4>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8 max-w-4xl">
                        TRANSFERS ARE LOGGED IN THE CENTRAL REGISTRY. ALL ASSOCIATED DATA VECTORS (REPORTS, EVALUATIONS) WILL BE MIGRATED TO THE TARGET HUB. AUTHORIZATION IS REQUIRED FOR ALL CROSS-PERIOD REDEPLOYMENTS.
                    </p>
                </div>
            </div>

            {/* Transfer Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <div className="bg-gradient-to-br from-surface-panel to-black p-10 space-y-10 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.05] text-accent-gold">
                        <ArrowsRightLeftIcon className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-2">Re-Deployment</h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">INITIATING SCHOLAR TRANSFER PROTOCOL</p>
                    </div>

                    {selectedStudent && (
                        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl relative z-10 flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                                {selectedStudent.mahasiswa.nama.charAt(0)}
                            </div>
                            <div>
                                <p className="text-lg font-black text-white tracking-widest uppercase italic leading-none">{selectedStudent.mahasiswa.nama}</p>
                                <p className="text-[9px] font-black text-accent-gold tracking-[0.4em] uppercase mt-3">TARGET IDENTIFIER: {selectedStudent.mahasiswa.nim}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleTransfer} className="space-y-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">TARGET TEMPORAL CYCLE</label>
                            <FormSelect
                                placeholder="SELECT TARGET CYCLE..."
                                options={periodOptions}
                                value={transferForm.data.target_period_id}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                error={transferForm.errors.target_period_id}
                                className="bg-black/40 border-white/10 text-white text-[10px] font-black h-14 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">TARGET BRIGADE HUB (OPTIONAL)</label>
                            <FormSelect
                                placeholder={loadingGroups ? 'SCANNING HUBS...' : 'SELECT TARGET HUB (OPTIONAL)...'}
                                options={groupOptions}
                                value={transferForm.data.target_group_id}
                                onChange={(e) => transferForm.setData('target_group_id', e.target.value)}
                                disabled={loadingGroups || targetGroups.length === 0}
                                error={transferForm.errors.target_group_id}
                                className="bg-black/40 border-white/10 text-white text-[10px] font-black h-14 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">RE-DEPLOYMENT JUSTIFICATION</label>
                            <FormTextarea
                                value={transferForm.data.reason}
                                onChange={(e) => transferForm.setData('reason', e.target.value)}
                                placeholder="JELASKAN ALASAN PEMASUKAN DATA HUB BARU..."
                                rows={3}
                                error={transferForm.errors.reason}
                                required
                                className="bg-black/40 border-white/10 text-white text-xs h-32 rounded-3xl"
                            />
                        </div>

                        <div className="pt-6 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                            >
                                ABORT
                            </button>
                            <button
                                type="submit"
                                disabled={transferForm.processing}
                                className="flex-[2] py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <ArrowsRightLeftIcon className="w-5 h-5" />
                                EXECUTE RE-DEPLOYMENT
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}

