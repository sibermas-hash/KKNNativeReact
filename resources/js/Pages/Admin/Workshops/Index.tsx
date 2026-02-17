import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import {
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    PlusIcon,
    AcademicCapIcon,
    PresentationChartLineIcon,
    ClockIcon,
    CheckBadgeIcon,
    XMarkIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Workshop {
    id: number;
    title: string;
    description: string;
    methodology: string;
    date: string;
    time: string;
    location: string;
    registered: number;
    max_participants: number;
    is_full: boolean;
}

interface Props {
    workshops: Workshop[];
}

declare function route(name: string, params?: any): string;

export default function WorkshopIndex({ workshops }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        workshop_date: '',
        methodology: '',
        location: '',
    });

    const [showForm, setShowForm] = React.useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = React.useState<Workshop | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = React.useState(false);

    const attendForm = useForm({
        user_ids: [] as number[],
    });

    const openAttendance = (workshop: Workshop) => {
        setSelectedWorkshop(workshop);
        setShowAttendanceModal(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.workshops.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const submitAttendance = (e: React.FormEvent) => {
        e.preventDefault();
        attendForm.post(route('admin.mark-attendance', selectedWorkshop?.id), {
            onSuccess: () => {
                setShowAttendanceModal(false);
                attendForm.reset();
            },
        });
    };

    return (
        <AppLayout title="Tactical Training Hub">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">SCHOLAR PREPARATION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Training <span className="text-accent-gold text-glow-gold">Modules</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Strategic preparation modules and tactical briefing sessions for field deployment.</p>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="group flex items-center gap-4 px-10 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <PlusIcon className="h-6 w-6 text-accent-gold" />
                        <span className="text-xs font-black uppercase tracking-widest italic">{showForm ? 'CLOSE CONSOLE' : 'INITIALIZE MODULE'}</span>
                    </button>
                </div>

                {showForm && (
                    <div className="p-10 glass rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden border-white/10">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-white">
                            <AcademicCapIcon className="h-48 w-48 rotate-12" />
                        </div>

                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 rounded-2xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-xl">
                                <PresentationChartLineIcon className="h-7 w-7" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Module Specification</h2>
                        </div>

                        <form onSubmit={submit} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">MODULE NOMENCLATURE</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full bg-black/40 border-white/10 text-sm font-black tracking-widest text-white h-16 rounded-2xl focus:border-accent-gold/50 shadow-2xl px-6"
                                        placeholder="E.G. METODOLOGI ABCD DALAM KKN"
                                    />
                                    {errors.title && <p className="text-rose-500 text-[9px] font-black tracking-widest uppercase ml-1">{errors.title}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 italic">TEMPORAL COORDINATE (DATE)</label>
                                    <input
                                        type="date"
                                        value={data.workshop_date}
                                        onChange={e => setData('workshop_date', e.target.value)}
                                        className="w-full bg-black/40 border-white/10 text-xs font-black tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50 shadow-2xl px-6"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 italic">GEOGRAPHICAL HUB (LOCATION)</label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={e => setData('location', e.target.value)}
                                        className="w-full bg-black/40 border-white/10 text-xs font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50 shadow-2xl px-6"
                                        placeholder="E.G. AULA GEDUNG C"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">STRATEGIC SYNOPSIS</label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={4}
                                        className="w-full bg-black/40 border-white/10 text-xs font-medium tracking-widest text-white/60 p-8 rounded-[2rem] focus:border-accent-gold/50 shadow-2xl"
                                        placeholder="INPUT MODULE OBJECTIVES AND SYNOPSIS..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-10 py-5 bg-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all italic"
                                >
                                    ABORT
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-12 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 italic"
                                >
                                    INITIALIZE MODULE
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Modules Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {workshops.map((workshop) => (
                        <div key={workshop.id} className="group glass rounded-[3rem] border-white/10 shadow-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 relative">
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity pointer-events-none text-white">
                                <PresentationChartLineIcon className="h-32 w-32 rotate-12" />
                            </div>

                            <div className="p-10 border-b border-white/5">
                                <div className="flex items-start justify-between gap-6 mb-6">
                                    <h3 className="text-xl font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{workshop.title}</h3>
                                    <div className={`px-4 py-1.5 rounded-xl border text-[8px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md ${workshop.is_full ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                                        {workshop.is_full ? 'MODULE FULL' : 'CAPACITY AVAIL'}
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-relaxed line-clamp-3 italic mb-8 border-l-2 border-primary/20 pl-4">{workshop.description}</p>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-primary-light">
                                            <CalendarIcon className="h-3 w-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">TEMPORAL</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white/60 tracking-tighter uppercase italic">{workshop.date}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-accent-gold">
                                            <MapPinIcon className="h-3 w-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">SECTOR</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white/60 tracking-tighter uppercase italic truncate">{workshop.location}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <UsersIcon className="h-3 w-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">UNITS</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white/60 tracking-tighter uppercase italic tabular-nums">{workshop.registered} / {workshop.max_participants || '∞'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/[0.01] flex gap-4">
                                <button className="flex-1 py-4 bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5 italic">
                                    ANALYZE ENROLMENTS
                                </button>
                                <button
                                    onClick={() => openAttendance(workshop)}
                                    className="flex-1 py-4 bg-primary text-[9px] font-black text-white uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 italic"
                                >
                                    INGEST ATTENDANCE
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Attendance Modal */}
                {showAttendanceModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="glass rounded-[3rem] w-full max-w-lg shadow-2xl p-12 border-white/10 relative animate-in zoom-in-95 duration-500 overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-gold/10 blur-[60px] rounded-full pointer-events-none" />

                            <div className="flex items-center justify-between mb-8">
                                <div className="p-4 rounded-2xl bg-primary/10 text-primary-light border border-primary/20 shadow-xl">
                                    <CheckBadgeIcon className="h-7 w-7" />
                                </div>
                                <button onClick={() => setShowAttendanceModal(false)} className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-white transition-colors">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-4">Ingest Attendance</h3>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-10 leading-relaxed italic">{selectedWorkshop?.title}</p>

                            <form onSubmit={submitAttendance} className="space-y-10 relative z-10">
                                <div className="p-6 bg-accent-gold/5 rounded-2xl border border-accent-gold/10 flex gap-4">
                                    <InformationCircleIcon className="h-6 w-6 text-accent-gold shrink-0" />
                                    <p className="text-[10px] font-bold text-accent-gold/60 uppercase tracking-widest leading-relaxed">
                                        REAL-TIME ATTENDANCE PIPELINE WILL BE ESTABLISHED WITH REGISTERED SCHOLARS. PROCEED WITH ANALYTICAL INGESTION?
                                    </p>
                                </div>

                                <div className="flex gap-6">
                                    <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all italic">ABORT</button>
                                    <button type="submit" className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 italic">AUTHORIZE INGESTION</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
