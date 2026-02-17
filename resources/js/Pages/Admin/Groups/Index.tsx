import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, StatusBadge, ConfirmDialog } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    UserGroupIcon,
    MapPinIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    AcademicCapIcon,
    ChartBarIcon,
    XMarkIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';

interface DplInput {
    id: string; // Form uses strings for select values
    role: 'Ketua' | 'Anggota';
}

interface GroupData {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    period: { id: number; name: string };
    location: { id: number; village_name: string };
    main_lecturer: { id: number; name: string } | null;
    lecturers: { id: number; name: string; role: string }[];
}

interface Props extends PageProps {
    groups: GroupData[];
    periods: { id: number; name: string }[];
    locations: { id: number; village_name: string }[];
    lecturers: { id: number; name: string }[];
}

export default function GroupsIndex({ groups, periods, locations, lecturers }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<GroupData | null>(null);
    const [deleting, setDeleting] = useState<GroupData | null>(null);

    const { data, setData, post, put, reset, errors, processing } = useForm({
        period_id: '',
        location_id: '',
        name: '',
        capacity: '20',
        status: 'draft',
        lecturers: [] as DplInput[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/admin/groups/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); reset(); },
            });
        } else {
            post('/admin/groups', {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    }

    function startEdit(g: GroupData) {
        setEditing(g);
        setShowForm(true);
        setData({
            period_id: String(g.period.id),
            location_id: String(g.location.id),
            name: g.name,
            capacity: String(g.capacity),
            status: g.status,
            lecturers: g.lecturers.map(l => ({ id: String(l.id), role: l.role as 'Ketua' | 'Anggota' })),
        });
    }

    const addLecturer = () => {
        setData('lecturers', [...data.lecturers, { id: '', role: 'Anggota' }]);
    };

    const removeLecturer = (index: number) => {
        const newLecturers = [...data.lecturers];
        newLecturers.splice(index, 1);
        setData('lecturers', newLecturers);
    };

    const updateLecturer = (index: number, field: keyof DplInput, value: string) => {
        const newLecturers = [...data.lecturers];
        // @ts-ignore
        newLecturers[index][field] = value;
        setData('lecturers', newLecturers);
    };

    const deleteForm = useForm({});

    return (
        <AppLayout title="Brigade Intelligence Hub">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">OPERATIONAL DEPLOYMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Brigade <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Strategic coordination of academic task forces across territorial sectors.</p>
                    </div>

                    {!showForm && (
                        <button
                            onClick={() => { setEditing(null); reset(); setShowForm(true); }}
                            className="group flex items-center gap-4 px-10 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <PlusIcon className="h-6 w-6 text-accent-gold" />
                            <span className="text-xs font-black uppercase tracking-widest italic tracking-[0.2em]">INITIALIZE BRIGADE</span>
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="glass rounded-[3.5rem] border-white/10 shadow-2xl p-12 backdrop-blur-xxl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-16">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                    {editing ? 'Modify' : 'Configure'} <span className="text-accent-gold">Brigade Unit</span>
                                </h2>
                                <button onClick={() => setShowForm(false)} className="p-4 bg-white/5 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-2xl border border-white/5 transition-all active:scale-95">
                                    <XMarkIcon className="h-7 w-7" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-12">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    {/* Left Column: Tactical Parameters */}
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-4">
                                            <div className="p-3 rounded-2xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-xl">
                                                <CpuChipIcon className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] italic">Tactical Parameters</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">BRIGADE NOMENCLATURE</label>
                                            <FormInput
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                error={errors.name}
                                                required
                                                className="bg-black/40 border-white/10 text-white text-[11px] font-black tracking-widest h-14 rounded-2xl focus:border-accent-gold/50"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">MAX CAPACITY</label>
                                                <FormInput id="capacity" type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} error={errors.capacity} required className="bg-black/40 border-white/10 text-white text-[11px] font-black tracking-widest h-14 rounded-2xl focus:border-accent-gold/50" />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">OPS STATUS</label>
                                                <FormSelect id="status" options={[{ value: 'draft', label: 'DRAFT' }, { value: 'active', label: 'ACTIVE' }, { value: 'closed', label: 'CLOSED' }]} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} required className="bg-black/40 border-white/10 text-white text-[10px] font-black tracking-widest h-14 rounded-2xl focus:border-accent-gold/50 uppercase" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">DEPLOYMENT CYCLE</label>
                                            <FormSelect id="period_id" options={periods.map(p => ({ value: p.id, label: p.name }))} value={data.period_id} onChange={(e) => setData('period_id', e.target.value)} error={errors.period_id} required className="bg-black/40 border-white/10 text-white text-[10px] font-black tracking-widest h-14 rounded-2xl focus:border-accent-gold/50 uppercase" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">SECTOR TARGET</label>
                                            <FormSelect id="location_id" options={locations.map(l => ({ value: l.id, label: l.village_name }))} value={data.location_id} onChange={(e) => setData('location_id', e.target.value)} error={errors.location_id} required className="bg-black/40 border-white/10 text-white text-[10px] font-black tracking-widest h-14 rounded-2xl focus:border-accent-gold/50 uppercase" />
                                        </div>
                                    </div>

                                    {/* Right Column: Command Team Allocation */}
                                    <div className="space-y-10">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-primary/10 text-primary-light border border-primary/20 shadow-xl">
                                                    <AcademicCapIcon className="h-6 w-6" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] italic">Command Staff</h3>
                                            </div>
                                            <button type="button" onClick={addLecturer} className="text-[10px] font-black text-accent-gold hover:text-white uppercase tracking-widest border border-accent-gold/20 hover:border-white/40 px-4 py-2 rounded-xl transition-all flex items-center gap-2 italic">
                                                <PlusIcon className="w-4 h-4" />
                                                ALLOCATE OFFICER
                                            </button>
                                        </div>

                                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                            {data.lecturers.length === 0 && (
                                                <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] italic">No command staff allocated.</p>
                                                </div>
                                            )}
                                            {data.lecturers.map((l, index) => (
                                                <div key={index} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] relative group/item transition-all hover:bg-white/[0.08] hover:border-white/10 shadow-2xl">
                                                    <div className="space-y-6">
                                                        <div className="space-y-3">
                                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">STAFF IDENTITY</label>
                                                            <select
                                                                value={l.id}
                                                                onChange={(e) => updateLecturer(index, 'id', e.target.value)}
                                                                className="block w-full bg-black/50 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest px-5 py-4 focus:border-accent-gold/50 focus:ring-2 focus:ring-accent-gold/5 outline-none transition-all cursor-pointer"
                                                                required
                                                            >
                                                                <option value="" className="bg-slate-950">SELECT OFFICER...</option>
                                                                {lecturers.map((lec) => (
                                                                    <option key={lec.id} value={lec.id} className="bg-slate-950">{lec.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-10 px-2">
                                                            <label className="flex items-center gap-4 cursor-pointer group/radio">
                                                                <input
                                                                    type="radio"
                                                                    name={`role-${index}`}
                                                                    checked={l.role === 'Ketua'}
                                                                    onChange={() => updateLecturer(index, 'role', 'Ketua')}
                                                                    className="h-5 w-5 rounded-full border-white/10 bg-black text-accent-gold focus:ring-accent-gold/40 shadow-glow-sm"
                                                                />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${l.role === 'Ketua' ? 'text-white italic' : 'text-white/20 group-hover/radio:text-white/40'}`}>PRIME COMMANDER</span>
                                                            </label>
                                                            <label className="flex items-center gap-4 cursor-pointer group/radio">
                                                                <input
                                                                    type="radio"
                                                                    name={`role-${index}`}
                                                                    checked={l.role === 'Anggota'}
                                                                    onChange={() => updateLecturer(index, 'role', 'Anggota')}
                                                                    className="h-5 w-5 rounded-full border-white/10 bg-black text-primary-light focus:ring-primary/40 shadow-glow-sm"
                                                                />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${l.role === 'Anggota' ? 'text-white italic' : 'text-white/20 group-hover/radio:text-white/40'}`}>SUPPORT OFFICER</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeLecturer(index)} className="absolute top-6 right-6 text-white/10 hover:text-rose-500 transition-all p-2 bg-black/20 rounded-xl hover:bg-rose-500/10">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.lecturers && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">{errors.lecturers}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-8 pt-12 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => { setEditing(null); setShowForm(false); reset(); }}
                                        className="px-10 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all italic"
                                    >
                                        ABORT OPERATION
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-12 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 border border-white/10 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 italic"
                                    >
                                        {processing ? 'SYNCING...' : (editing ? 'COMMENCE MODIFICATION' : 'AUTHORIZE DEPLOYMENT')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Brigade Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {groups.map((g) => (
                        <div key={g.id} className="group glass rounded-[3.5rem] border-white/10 shadow-2xl hover:shadow-primary/20 transition-all duration-700 overflow-hidden relative backdrop-blur-xxl hover:-translate-y-3">
                            <div className={`h-2 w-full shadow-glow-sm ${g.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-700' : (g.status === 'closed' ? 'bg-white/10' : 'bg-gradient-to-r from-accent-gold to-amber-600')}`} />

                            <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-[0.03] transition-all duration-1000 pointer-events-none text-white italic">
                                <IdentificationIcon className="h-48 w-48 rotate-12" />
                            </div>

                            <div className="p-10 space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest italic">
                                            BRGD // {g.code}
                                        </span>
                                        <StatusBadge status={g.status} className="text-[9px] font-black tracking-widest uppercase italic" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic group-hover:text-accent-gold transition-colors duration-500">{g.name}</h3>
                                    <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-widest italic leading-none">
                                        <MapPinIcon className="h-4 w-4 text-accent-gold" />
                                        {g.location?.village_name ?? 'UNKNOWN SECTOR'}
                                    </div>
                                </div>

                                {/* Deployment Metrics */}
                                <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-inner">
                                    <div className="flex justify-between items-end px-2">
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Deployment Density</span>
                                        <span className="text-sm font-black text-white italic tabular-nums group-hover:text-accent-gold transition-colors">{g.registrations_count} <span className="text-white/20 mx-1">/</span> {g.capacity}</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-3 p-1 border border-white/5 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-[2.5s] ease-out shadow-glow-sm ${g.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-accent-gold to-amber-500'}`}
                                            style={{ width: `${Math.min((g.registrations_count / g.capacity) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Staff Details */}
                                <div className="space-y-5">
                                    <p className="px-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Command detail</p>
                                    {g.lecturers.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {g.lecturers.map(l => (
                                                <div key={l.id} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-5 py-3 group/lec hover:bg-white/[0.08] hover:border-accent-gold/30 transition-all shadow-2xl">
                                                    <div className={`w-2 h-2 rounded-full ${l.role === 'Ketua' ? 'bg-accent-gold shadow-glow-sm' : 'bg-white/10'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest italic ${l.role === 'Ketua' ? 'text-white' : 'text-white/30 group-hover/lec:text-white/60'}`}>
                                                        {l.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-2 py-4 border border-rose-500/10 bg-rose-500/[0.02] rounded-2xl flex items-center gap-4">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-rose-500/40" />
                                            <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-widest italic">COMMANDER NOT ASSIGNED</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-black/20 border-t border-white/5 flex justify-between items-center group-hover:bg-black/40 transition-all duration-500">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                                    <ShieldCheckIcon className="h-4 w-4 text-primary-light" />
                                    CYCLE // {g.period?.name ?? 'NULL'}
                                </span>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => startEdit(g)}
                                        className="p-3 bg-white/5 hover:bg-accent-gold/10 text-white/20 hover:text-accent-gold border border-white/5 hover:border-accent-gold/40 rounded-2xl transition-all shadow-2xl active:scale-90"
                                    >
                                        <PencilSquareIcon className="w-5 h-5 shadow-2xl" />
                                    </button>
                                    <button
                                        onClick={() => setDeleting(g)}
                                        className="p-3 bg-white/5 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 border border-white/5 hover:border-rose-500/40 rounded-2xl transition-all shadow-2xl active:scale-90"
                                    >
                                        <TrashIcon className="w-5 h-5 shadow-2xl" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {groups.length === 0 && (
                        <div className="lg:col-span-3 py-48 flex flex-col items-center glass border-white/5 rounded-[4rem] bg-white/[0.01] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                            <UserGroupIcon className="h-24 w-24 text-white/5 mb-8 group-hover:scale-110 group-hover:text-white/[0.08] transition-all duration-1000" />
                            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic text-center leading-relaxed">
                                NO BRIGADE UNITS DEPLOYED<br />
                                <span className="opacity-50 font-medium">STREAMS ARE CLEAR // AWAITING COMMAND SIGNAL</span>
                            </p>
                            <button
                                onClick={() => { setEditing(null); reset(); setShowForm(true); }}
                                className="mt-12 px-12 py-6 bg-white/5 text-accent-gold text-[10px] font-black uppercase tracking-widest rounded-[2rem] border border-white/5 hover:bg-accent-gold hover:text-luxury-dark transition-all shadow-2xl italic tracking-[0.2em]"
                            >
                                COMMENCE INITIALIZATION
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                // @ts-ignore
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/groups/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="TERMINATE BRIGADE UNIT"
                message={`CRITICAL: ARE YOU AUTHORIZED TO DECOMMISSION BRIGADE UNIT "${deleting?.name}"? ALL ASSOCIATED TACTICAL LOGS WILL BE ARCHIVED.`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
