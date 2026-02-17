import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    AcademicCapIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    BuildingLibraryIcon,
    DocumentTextIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface ProgramWithFaculty extends Omit<Program, 'faculty'> {
    faculty: Faculty;
}

interface Props extends PageProps {
    programs: {
        data: ProgramWithFaculty[];
        links: any[];
        meta: PaginationMeta;
    };
    faculties: Faculty[];
    filters: {
        search?: string;
    };
}

export default function ProgramsIndex({ programs, faculties, filters }: Props) {
    const [editing, setEditing] = useState<ProgramWithFaculty | null>(null);
    const [deleting, setDeleting] = useState<ProgramWithFaculty | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({ faculty_id: '', code: '', name: '' });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/programs', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/programs/${editing.id}`, {
                onSuccess: () => { setEditing(null); form.reset(); },
            });
        } else {
            form.post('/admin/programs', { onSuccess: () => form.reset() });
        }
    }

    function startEdit(p: ProgramWithFaculty) {
        setEditing(p);
        form.setData({ faculty_id: String(p.faculty.id), code: p.code, name: p.name });
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Scholastic Stream Registry">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">ACADEMIC SPECIALIZATION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Scholastic <span className="text-accent-gold text-glow-gold">Streams</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrating specific academic specializations and study programs.</p>
                    </div>

                    <div className="flex items-center gap-6 px-8 py-5 glass rounded-[2rem] group hover:border-accent-gold/20 transition-all">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">ACTIVE STREAMS</span>
                            <span className="text-xl font-black text-white mt-1 tabular-nums">{programs.meta?.total || 0}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <AcademicCapIcon className="h-6 w-6 text-accent-gold" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Stream Definition (Form) */}
                    <div className="lg:col-span-1">
                        <div className="glass rounded-[2.5rem] p-10 border-white/10 shadow-2xl sticky top-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none text-white">
                                <DocumentTextIcon className="h-32 w-32 rotate-12" />
                            </div>

                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-10 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-xl">
                                    {editing ? <PencilSquareIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
                                </div>
                                {editing ? 'Modify Stream' : 'Initialize Stream'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1 text-primary-light">PARENT SECTOR</label>
                                    <FormSelect
                                        options={faculties.map((f) => ({ value: f.id, label: f.name }))}
                                        placeholder="SELECT SECTOR"
                                        value={form.data.faculty_id}
                                        onChange={(e) => form.setData('faculty_id', e.target.value)}
                                        error={form.errors.faculty_id}
                                        className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">STREAM VECTOR (CODE)</label>
                                    <FormInput
                                        placeholder="E.G. PAI"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        error={form.errors.code}
                                        className="bg-black/40 border-white/10 text-xs font-black tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">STREAM NOMENCLATURE</label>
                                    <FormInput
                                        placeholder="E.G. PENDIDIKAN AGAMA ISLAM..."
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        error={form.errors.name}
                                        className="bg-black/40 border-white/10 text-xs font-bold tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50 placeholder:text-white/5"
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="submit" disabled={form.processing} className="flex-1 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                                        {editing ? 'COMMIT MODIFICATION' : 'DEPLOY STREAM'}
                                    </button>
                                    {editing && (
                                        <button type="button" onClick={() => { setEditing(null); form.reset(); }} className="px-8 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
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
                                placeholder="SCAN SCHOLASTIC STREAMS..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                            />
                        </div>

                        <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                                <AcademicCapIcon className="h-64 w-64" />
                            </div>
                            <div className="overflow-x-auto relative z-10">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Vector</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Nomenclature</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Parent Sector</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {programs.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-24 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <DocumentTextIcon className="h-12 w-12 text-white/5 mb-4" />
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No scholastic streams found in current scans.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            programs.data.map((p) => (
                                                <tr key={p.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                    <td className="px-8 py-10">
                                                        <div className="px-3 py-1.5 rounded-lg bg-accent-gold/10 border border-accent-gold/20 inline-flex">
                                                            <span className="text-[11px] font-black text-accent-gold uppercase tracking-widest italic">{p.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-10">
                                                        <span className="text-base font-black text-white tracking-tight uppercase italic group-hover:text-accent-gold transition-colors leading-none">{p.name}</span>
                                                    </td>
                                                    <td className="px-8 py-10">
                                                        <div className="flex items-center gap-3">
                                                            <BuildingLibraryIcon className="h-4 w-4 text-white/10" />
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{p.faculty?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-10 text-right">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                            <button onClick={() => startEdit(p)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-accent-gold hover:bg-white/10 transition-all">
                                                                <PencilSquareIcon className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => setDeleting(p)} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all">
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
                            {programs.meta && (
                                <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5">
                                    <Pagination meta={programs.meta} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/programs/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="TERMINATE SCHOLASTIC STREAM"
                message={`AUTHORIZATION REQUIRED: PURGING "${deleting?.name}" FROM THE REGISTRY WILL DISRUPT ASSOCIATED ENROLMENTS. PROCEED?`}
                processing={deleteForm.processing}
                confirmLabel="CONFIRM WIPE"
            />
        </AppLayout>
    );
}
