import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, ConfirmDialog, Badge, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    CalendarIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    StopIcon
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    academicYears: {
        data: AcademicYear[];
        links: any[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [deleting, setDeleting] = useState<AcademicYear | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({ year: '', is_active: false });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/academic-years', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/academic-years/${editing.id}`, {
                onSuccess: () => { setEditing(null); form.reset(); },
            });
        } else {
            form.post('/admin/academic-years', {
                onSuccess: () => form.reset(),
            });
        }
    }

    function startEdit(ay: AcademicYear) {
        setEditing(ay);
        form.setData({ year: ay.year, is_active: ay.is_active });
    }

    function cancelEdit() {
        setEditing(null);
        form.reset();
    }

    const deleteForm = useForm({});

    function handleDelete() {
        if (!deleting) return;
        deleteForm.delete(`/admin/academic-years/${deleting.id}`, {
            onSuccess: () => setDeleting(null),
        });
    }

    return (
        <AppLayout title="Temporal Cycle Registry">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">CHRONOS MANAGEMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Temporal <span className="text-accent-gold text-glow-gold">Cycles</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrating academic year boundaries and operational timelines.</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6 group hover:border-accent-gold/20 transition-all">
                        <ArrowPathIcon className="h-6 w-6 text-accent-gold group-hover:rotate-180 transition-all duration-1000" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">IDENTIFIED CYCLES</span>
                            <span className="text-xl font-black text-white mt-1 tabular-nums">{academicYears.meta?.total || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Command Console (Form) */}
                    <div className="lg:col-span-1">
                        <div className="glass rounded-[2.5rem] p-10 border-white/10 shadow-2xl sticky top-8">
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-8 flex items-center gap-4">
                                {editing ? <PencilSquareIcon className="h-6 w-6 text-accent-gold" /> : <PlusIcon className="h-6 w-6 text-primary-light" />}
                                {editing ? 'Modify Cycle' : 'Initialize Cycle'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">CYBERNETIC YEAR</label>
                                    <FormInput
                                        placeholder="E.G. 2024/2025"
                                        value={form.data.year}
                                        onChange={(e) => form.setData('year', e.target.value)}
                                        error={form.errors.year}
                                        className="bg-black/40 border-white/10 text-xs font-bold tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-2xl group cursor-pointer" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.data.is_active ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-white/10'}`}>
                                        {form.data.is_active && <div className="w-2 h-2 rounded-sm bg-white" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${form.data.is_active ? 'text-primary-light' : 'text-white/20'}`}>OPERATIONAL STATUS: ACTIVE</span>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" disabled={form.processing} className="flex-1 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                                        {editing ? 'COMMIT CHANGES' : 'DEPLOY CYCLE'}
                                    </button>
                                    {editing && (
                                        <button type="button" onClick={cancelEdit} className="px-8 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                            ABORT
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Registry Ledger (Table) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                            <input
                                placeholder="SCAN CYCLES..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                            />
                        </div>

                        <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <CalendarIcon className="h-64 w-64 text-white" />
                            </div>
                            <div className="overflow-x-auto relative z-10">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporal Identity</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Status</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Operational Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {academicYears.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-24 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <StopIcon className="h-12 w-12 text-white/5 mb-4" />
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No temporal cycles detected in scans.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            academicYears.data.map((ay) => (
                                                <tr key={ay.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                    <td className="px-8 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-accent-gold group-hover:scale-110 group-hover:rotate-12 transition-all shadow-xl italic">
                                                                {ay.year.split('/')[0].slice(-2)}
                                                            </div>
                                                            <span className="text-lg font-black text-white tracking-widest tabular-nums uppercase italic group-hover:text-accent-gold transition-colors">{ay.year}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-8 text-center">
                                                        <Badge variant={ay.is_active ? 'success' : 'default'} className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                            {ay.is_active ? 'OPERATIONAL' : 'INERT'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-8 text-right">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                            <button onClick={() => startEdit(ay)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-accent-gold hover:bg-white/10 transition-all">
                                                                <PencilSquareIcon className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => setDeleting(ay)} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all">
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {academicYears.meta && (
                                <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5">
                                    <Pagination meta={academicYears.meta} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-8 text-white/10 font-black uppercase tracking-[0.5em] text-[9px]">
                    <p>QUANTUM TIME ENGINE VER: 2.0.26</p>
                    <p>UTC SYNCED: TRUE</p>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="TERMINATE CYCLE"
                message={`YOU ARE ABOUT TO PERMANENTLY WIPE TEMPORAL CYCLE "${deleting?.year}" FROM THE CENTRAL REGISTRY. CONFIRM AUTHORIZATION?`}
                confirmLabel="CONFIRM WIPE"
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
