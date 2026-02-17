import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, Badge, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear, Period } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    ClockIcon,
    CalendarDaysIcon,
    QueueListIcon,
    PlusIcon,
    DocumentDuplicateIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    MapIcon,
    UsersIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface PeriodData extends Omit<Period, 'academic_year'> {
    academic_year: AcademicYear;
}

interface Props extends PageProps {
    periods: {
        data: PeriodData[];
        links: any[];
        meta: PaginationMeta;
    };
    academicYears: AcademicYear[];
    filters: {
        search?: string;
    };
}

export default function PeriodsIndex({ periods, academicYears, filters }: Props) {
    const [editing, setEditing] = useState<PeriodData | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<PeriodData | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({
        academic_year_id: '',
        angkatan: '',
        jenis: '',
        name: '',
        start_date: '',
        end_date: '',
        registration_start: '',
        registration_end: '',
        kuota: '2000',
        is_active: false,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/periods', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!editing) {
            const name = `[Angkatan ${form.data.angkatan}] ${form.data.jenis}`;
            if (form.data.angkatan && form.data.jenis && form.data.name !== name) {
                form.setData('name', name);
            }
        }
    }, [form.data.angkatan, form.data.jenis]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/periods/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); form.reset(); },
            });
        } else {
            form.post('/admin/periods', {
                onSuccess: () => { setShowForm(false); form.reset(); },
            });
        }
    }

    function startEdit(p: PeriodData) {
        setEditing(p);
        setShowForm(true);
        form.setData({
            academic_year_id: String(p.academic_year.id),
            angkatan: String(p.angkatan),
            jenis: p.jenis,
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            registration_start: p.registration_start,
            registration_end: p.registration_end,
            kuota: String(p.kuota),
            is_active: p.is_active,
        });
    }

    function cancelForm() {
        setEditing(null);
        setShowForm(false);
        form.reset();
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Operational Deployment HUB">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">DEPLOYMENT SCHEDULER</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Operational <span className="text-accent-gold text-glow-gold">Cycles</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Configuring tactical windows for student registration and field operations.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">TOTAL CYCLES</span>
                            <span className="text-xl font-black text-white mt-1">{periods.meta?.total || 0}</span>
                        </div>
                        {!showForm && (
                            <button onClick={() => setShowForm(true)} className="group flex items-center gap-3 px-8 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <PlusIcon className="w-5 h-5 text-accent-gold" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">INITIALIZE CYCLE</span>
                            </button>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="p-10 glass rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden border-accent-gold/20">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-gold/5 blur-[80px] rounded-full pointer-events-none" />

                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-xl">
                                    {editing ? <PencilSquareIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
                                </div>
                                {editing ? 'Modify Deployment Protocol' : 'New Deployment Strategy'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">TEMPORAL SOURCE</label>
                                    <FormSelect
                                        options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                                        placeholder="SELECT TEMPORAL YEAR"
                                        value={form.data.academic_year_id}
                                        onChange={(e) => form.setData('academic_year_id', e.target.value)}
                                        className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">BRIGADE BATCH</label>
                                    <FormInput
                                        type="number"
                                        placeholder="E.G. 57"
                                        value={form.data.angkatan}
                                        onChange={(e) => form.setData('angkatan', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-bold tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">MISSION TYPE</label>
                                    <FormInput
                                        placeholder="KKN REGULER"
                                        value={form.data.jenis}
                                        onChange={(e) => form.setData('jenis', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-bold tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">STRATEGIC IDENTIFIER (AUTO-GEN)</label>
                                    <FormInput
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        className="bg-white/5 border-white/5 text-[11px] font-black italic tracking-widest text-white/60 h-14 rounded-2xl cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">SCHOLAR CAPACITY</label>
                                    <FormInput
                                        type="number"
                                        value={form.data.kuota}
                                        onChange={(e) => form.setData('kuota', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-bold tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-white/[0.01] border border-white/5 rounded-[2.5rem]">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-primary-light rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">REGISTRATION PROTOCOL</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">UPLINK OPEN</label>
                                            <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} className="bg-black/40 border-white/10 text-[10px] text-white h-12 rounded-xl" required />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">UPLINK CLOSE</label>
                                            <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} className="bg-black/40 border-white/10 text-[10px] text-white h-12 rounded-xl" required />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-accent-gold rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">TACTICAL EXECUTION</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">MISSION START</label>
                                            <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} className="bg-black/40 border-white/10 text-[10px] text-white h-12 rounded-xl" required />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">MISSION END</label>
                                            <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} className="bg-black/40 border-white/10 text-[10px] text-white h-12 rounded-xl" required />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-6 group cursor-pointer" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                    <div className={`w-14 h-7 rounded-full transition-all duration-500 relative flex items-center p-1 border border-white/10 ${form.data.is_active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/5'}`}>
                                        <div className={`w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-xl ${form.data.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${form.data.is_active ? 'text-primary-light' : 'text-white/20'}`}>OPERATIONAL DEPLOYMENT STATUS: ACTIVE</span>
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" disabled={form.processing} className="px-12 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                                        {editing ? 'COMMIT DEPLOYMENT' : 'INITIALIZE MISSION'}
                                    </button>
                                    <button type="button" onClick={cancelForm} className="px-8 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                        ABORT
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Registry Ledger (Table) */}
                <div className="space-y-8">
                    <div className="relative group max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN MISSION CYCLES..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                        />
                    </div>

                    <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <QueueListIcon className="h-64 w-64 text-white" />
                        </div>
                        <div className="overflow-x-auto relative z-10">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/[0.02]">
                                    <tr>
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Msn Identity</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporal Source</th>
                                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-x border-white/5">Enrolment Phase</th>
                                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-r border-white/5">Active Mission</th>
                                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-8">Scholar Qty</th>
                                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Protocol</th>
                                        <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {periods.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center">
                                                    <MapIcon className="h-12 w-12 text-white/5 mb-4" />
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No active deployment cycles located in scans.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        periods.data.map((p, idx) => (
                                            <tr key={p.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                <td className="px-6 py-8">
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="text-base font-black text-white tracking-tight leading-none italic group-hover:text-accent-gold transition-colors">{p.name}</span>
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">ANGKATAN: {p.angkatan}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-accent-gold">
                                                            {p.academic_year?.year.split('/')[0].slice(-2)}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white/60 tracking-widest">{p.academic_year?.year || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 border-x border-white/5 bg-white/[0.01]">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-primary-light" />
                                                            <span className="text-[9px] font-mono font-bold text-white/40">{p.registration_start}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-rose-500" />
                                                            <span className="text-[9px] font-mono font-bold text-white/40">{p.registration_end}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 border-r border-white/5">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-2 text-primary-light">
                                                            <ClockIcon className="h-3 w-3" />
                                                            <span className="text-[9px] font-mono font-bold">{p.start_date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-white/20">
                                                            <StopIcon className="h-3 w-3" />
                                                            <span className="text-[9px] font-mono font-bold">{p.end_date}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center bg-white/[0.01]">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-black text-accent-gold shadow-xl italic tracking-tighter">
                                                        <UsersIcon className="h-4 w-4 text-white/10" />
                                                        {p.kuota}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center">
                                                    <Badge variant={p.is_active ? 'success' : 'default'} className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                        {p.is_active ? 'OPERATIONAL' : 'INERT'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-8 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => { if (confirm(`AUTHORIZE STRUCTURAL DUPLICATION FOR "${p.name}"?`)) router.post(`/admin/periods/${p.id}/duplicate`) }}
                                                            className="p-2.5 rounded-xl bg-primary/10 border border-primary/10 text-primary-light hover:bg-primary/20 transition-all"
                                                            title="PROTOCOL DUPLICATION"
                                                        >
                                                            <DocumentDuplicateIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => startEdit(p)} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-accent-gold hover:bg-white/10 transition-all" title="MODIFY">
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => setDeleting(p)} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all" title="TERMINATE">
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
                        {periods.meta && (
                            <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5 font-black uppercase text-[10px] tracking-widest text-white/20">
                                <Pagination meta={periods.meta} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between px-8 text-white/5 font-black uppercase tracking-[0.5em] text-[9px]">
                    <div className="flex items-center gap-4">
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>TACTICAL SCHEDULER ACTIVE</span>
                    </div>
                    <p>ENCRYPTION: QUANTUM-D-LEDGER</p>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="TERMINATE MISSION CYCLE"
                message={`CRITICAL: YOU ARE ABOUT TO ERASE THE DEPLOYMENT DATA FOR "${deleting?.name}". THIS ACTION PERSISTS ACROSS THE CENTRAL NEXUS. CONFIRM?`}
                processing={deleteForm.processing}
                confirmLabel="CONFIRM WIPE"
            />
        </AppLayout>
    );
}
