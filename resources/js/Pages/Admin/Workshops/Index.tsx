import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, Badge } from '@/Components/ui';
import { 
    Activity, 
    ShieldCheck, 
    Database, 
    Layers, 
    Search, 
    Zap, 
    ChevronRight, 
    ArrowRight, 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    Plus, 
    X, 
    CheckCircle2, 
    UserPlus, 
    ClipboardCheck, 
    Flame,
    Navigation,
    Globe,
    Cpu,
    Fingerprint,
    SearchCheck,
    Lock,
    Settings,
    Layout,
    Save,
    UploadCloud,
    FileSpreadsheet,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// ... interface definitions tetap sama ...

export default function WorkshopIndex({ workshops }: Props) {
    const workshopForm = useForm(emptyWorkshopForm);
    const attendanceForm = useForm({
        user_ids: [] as number[],
    });
    const importForm = useForm({
        file: null as File | null,
    });

    const [showForm, setShowForm] = useState(false);
    const [editingWorkshopId, setEditingWorkshopId] = useState<number | null>(null);
    const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
    const [modalMode, setModalMode] = useState<'kehadiran' | 'peserta'>('peserta');
    const [isImportMode, setIsImportMode] = useState(false);

    // ... memos and handlers tetap sama ...

    const closeModal = () => {
        setSelectedWorkshop(null);
        attendanceForm.reset();
        importForm.reset();
        setIsImportMode(false);
    };

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkshop || !importForm.data.file) return;

        importForm.post(route('admin.workshop.import-absensi', selectedWorkshop.id), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    // ... submit handlers lainnya ...

    const cancelWorkshop = (workshop: Workshop) => {
        if (!window.confirm(`Batalkan workshop "${workshop.title}"?`)) {
            return;
        }

        router.patch(`/admin/workshops/${workshop.id}/cancel`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Pembekalan & Workshop Taktis">
            <Head title="Manajemen Workshop" />

            <div className="space-y-8 pb-32">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 italic text-slate-950">
                            <Layout className="w-8 h-8 text-emerald-600" />
                            DEPLOYMENT <span className="text-emerald-600">SCHEDULE</span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Tactical Workshop Pipeline Hub
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 shadow-inner group overflow-hidden relative">
                             <div className="absolute inset-0 bg-emerald-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                             <Users className="w-5 h-5 text-emerald-600 relative z-10" />
                             <div className="flex flex-col relative z-10">
                                 <span className="text-xl font-black text-slate-900 italic leading-none">{workshops.length}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Units</span>
                             </div>
                         </div>
                         <button
                            type="button"
                            onClick={() => (showForm ? closeWorkshopForm() : openCreateForm())}
                            className="h-16 w-16 bg-slate-950 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 group border border-slate-800"
                         >
                             {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                         </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.section 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-[3rem] border border-emerald-500/30 p-10 shadow-2xl relative">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                                    <Settings size={200} className="rotate-12" />
                                </div>
                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                        <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg">
                                            <Zap size={20} />
                                        </div>
                                        <h2 className="text-lg font-black text-slate-950 tracking-widest uppercase italic">
                                            {editingWorkshopId ? 'UPDATE_PROTOCOL_DEPLOY' : 'NEW_WORKSHOP_INITIALIZE'}
                                        </h2>
                                    </div>

                                    <form onSubmit={submitWorkshop} className="grid gap-8 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <FormInput
                                                label="Title Descriptor"
                                                required
                                                value={workshopForm.data.title}
                                                onChange={(event) => workshopForm.setData('title', event.target.value)}
                                                error={workshopForm.errors.title}
                                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic"
                                            />
                                        </div>
                                        <FormInput
                                            type="tanggal"
                                            label="Temporal Target (Date)"
                                            required
                                            value={workshopForm.data.workshop_date}
                                            onChange={(event) => workshopForm.setData('workshop_date', event.target.value)}
                                            error={workshopForm.errors.workshop_date}
                                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic"
                                        />
                                        <FormInput
                                            label="GEO_LOCATION_TARGET"
                                            value={workshopForm.data.location}
                                            onChange={(event) => workshopForm.setData('location', event.target.value)}
                                            error={workshopForm.errors.location}
                                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic"
                                        />
                                        <FormInput
                                            type="time"
                                            label="Start Code"
                                            value={workshopForm.data.start_time}
                                            onChange={(event) => workshopForm.setData('start_time', event.target.value)}
                                            error={workshopForm.errors.start_time}
                                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic"
                                        />
                                        <FormInput
                                            type="time"
                                            label="End Code"
                                            value={workshopForm.data.end_time}
                                            onChange={(event) => workshopForm.setData('end_time', event.target.value)}
                                            error={workshopForm.errors.end_time}
                                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic focus:ring-emerald-500/20"
                                        />
                                        <FormInput
                                            type="number"
                                            label="Capacity Mass (Quota)"
                                            value={workshopForm.data.max_participants}
                                            onChange={(event) => workshopForm.setData('max_participants', event.target.value)}
                                            error={workshopForm.errors.max_participants}
                                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 italic focus:ring-emerald-500/20"
                                        />
                                        <div className="md:col-span-2">
                                            <FormTextarea
                                                label="Methodology Framework"
                                                value={workshopForm.data.methodology}
                                                onChange={(event) => workshopForm.setData('methodology', event.target.value)}
                                                error={workshopForm.errors.methodology}
                                                className="bg-slate-50 border-slate-100 rounded-3xl min-h-[120px] italic focus:ring-emerald-500/20"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormTextarea
                                                label="Contextual Description"
                                                value={workshopForm.data.description}
                                                onChange={(event) => workshopForm.setData('description', event.target.value)}
                                                error={workshopForm.errors.description}
                                                className="bg-slate-50 border-slate-100 rounded-3xl min-h-[120px] italic focus:ring-emerald-500/20"
                                            />
                                        </div>

                                        <div className="md:col-span-2 flex justify-end gap-4 pt-6 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={closeWorkshopForm}
                                                className="h-14 px-8 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest italic text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                            >
                                                Abort_Command
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={workshopForm.processing}
                                                className="h-14 px-10 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic flex items-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                            >
                                                {workshopForm.processing ? (
                                                    <Activity size={18} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Deploy_Workshop
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                <section className="grid gap-8 xl:grid-cols-2">
                    {workshops.length > 0 ? (
                        workshops.map((workshop, idx) => (
                            <motion.article 
                                key={workshop.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                    <Globe size={150} className="-rotate-12" />
                                </div>

                                <div className="relative z-10 flex flex-col h-full gap-8">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tight group-hover:text-emerald-700 transition-colors">{workshop.title}</h2>
                                            <p className="text-[10px] font-bold text-slate-400 line-clamp-2 uppercase tracking-wide italic leading-relaxed">{workshop.description || 'TECHNICAL_SPEC_UNDEFINED'}</p>
                                        </div>
                                        <Badge variant={workshop.status === 'cancelled' ? 'danger' : 'success'} className="px-5 py-2 font-black text-[9px] uppercase tracking-widest italic bg-slate-950 text-emerald-500 border-none shrink-0 shadow-lg">
                                            {workshop.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-emerald-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Temporal_Target</span>
                                                    <span className="text-xs font-black text-slate-700 italic tabular-nums">{workshop.date}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-emerald-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sync_Time</span>
                                                    <span className="text-xs font-black text-slate-700 italic tabular-nums">{workshop.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-emerald-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Geo_Station</span>
                                                    <span className="text-xs font-black text-slate-700 italic uppercase truncate max-w-[120px]">{workshop.location || 'STATION_NULL'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-emerald-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Unit_Mass</span>
                                                    <span className="text-xs font-black text-slate-700 italic tabular-nums">{workshop.registered} / {workshop.max_participants || 'UNLIMITED'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                                        <button
                                            type="button"
                                            onClick={() => openParticipants(workshop)}
                                            className="flex-1 min-w-[140px] h-12 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-slate-500 hover:text-emerald-700 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                                        >
                                            <Users size={14} />
                                            View_Squad
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openAttendance(workshop)}
                                            disabled={workshop.participants.length === 0 || workshop.status === 'cancelled'}
                                            className="flex-1 min-w-[140px] h-12 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-slate-500 hover:text-emerald-700 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 disabled:opacity-40"
                                        >
                                            <ClipboardCheck size={14} />
                                            Input_Clearance
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(workshop)}
                                            disabled={!workshop.can_edit}
                                            className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-xl text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-40 group/btn"
                                        >
                                            <Settings size={18} className="group-hover/btn:rotate-90 transition-transform" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => cancelWorkshop(workshop)}
                                            disabled={!workshop.can_cancel}
                                            className="h-12 w-12 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-40"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        ))
                    ) : (
                        <div className="py-40 text-center relative overflow-hidden bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed xl:col-span-2">
                            <Activity className="h-24 w-24 text-slate-200 mx-auto mb-8 animate-pulse" />
                            <h4 className="text-lg font-black text-slate-400 uppercase tracking-[0.3em] italic">No active workshop deployments detected</h4>
                            <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-widest italic">SQUAD_DATABASE_STATUS: EMPTY</p>
                        </div>
                    )}
                </section>

                <AnimatePresence>
                    {selectedWorkshop && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeModal}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-slate-200"
                            >
                                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                                    <div className="space-y-1">
                                        <h2 className="text-sm font-black text-slate-950 tracking-widest uppercase italic flex items-center gap-4">
                                            {modalMode === 'kehadiran' ? <ClipboardCheck className="text-emerald-600" /> : <Users className="text-emerald-600" />}
                                            {modalMode === 'kehadiran' ? (isImportMode ? 'BULK_IMPORT_PROTOCOL' : 'CLEARANCE_PROTOCOL') : 'UNIT_SQUAD_ROSTER'}
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{selectedWorkshop.title}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {modalMode === 'kehadiran' && (
                                            <button 
                                                onClick={() => setIsImportMode(!isImportMode)}
                                                className="px-6 py-2 bg-slate-950 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-800 hover:bg-emerald-600 hover:text-white transition-all shadow-lg italic flex items-center gap-2"
                                            >
                                                {isImportMode ? <Settings size={12} /> : <FileSpreadsheet size={12} />}
                                                {isImportMode ? 'SWITCH_TO_MANUAL' : 'SWITCH_TO_EXCEL'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="h-12 w-12 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center shadow-sm active:scale-90"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-10 space-y-8">
                                    {isImportMode ? (
                                        /* --- IMPORT EXCEL VIEW --- */
                                        <form onSubmit={submitImport} className="space-y-10 py-10">
                                            <div className="max-w-xl mx-auto">
                                                <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-[3rem] p-16 text-center group hover:border-emerald-500 transition-all relative overflow-hidden">
                                                    <input 
                                                        type="file" 
                                                        accept=".xlsx,.xls,.csv"
                                                        onChange={e => importForm.setData('file', e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="relative z-20 space-y-6">
                                                        <div className="h-24 w-24 bg-white rounded-3xl shadow-xl shadow-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                                                            <UploadCloud size={40} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-sm font-black text-slate-900 uppercase italic">UPLOAD_ATTENDANCE_XLSX</h4>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                                                                {importForm.data.file ? importForm.data.file.name : 'Click to browse or drag & drop attendance file'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-8 flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                                    <Info size={20} className="text-emerald-500 shrink-0" />
                                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                                                        System will identify students by <span className="text-emerald-600 underline underline-offset-2">NIM Column</span>. Ensure your Excel header has a 'NIM' field.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-center gap-4">
                                                <button
                                                    type="submit"
                                                    disabled={importForm.processing || !importForm.data.file}
                                                    className="h-16 px-12 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 disabled:opacity-40"
                                                >
                                                    {importForm.processing ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}
                                                    EXECUTE_BULK_IMPORT
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        /* --- MANUAL CHECKLIST VIEW --- */
                                        <>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Total Unit', value: selectedParticipants.length, icon: Users },
                                                    { label: 'Attended', value: totalAttended, icon: CheckCircle2 },
                                                    { label: 'Certificate', value: selectedParticipants.filter(p => p.certificate_generated).length, icon: ShieldCheck },
                                                    { label: 'Capacity', value: selectedWorkshop.max_participants || 'MAX', icon: Database }
                                                ].map((m, i) => (
                                                    <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner group">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <m.icon size={12} className="text-emerald-500" />
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{m.label}</span>
                                                        </div>
                                                        <span className="text-lg font-black text-slate-900 tabular-nums italic leading-none">{m.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <form onSubmit={submitAttendance} className="space-y-8">
                                                <div className="max-h-[380px] overflow-y-auto rounded-[2rem] border border-slate-100 bg-white shadow-inner">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50 sticky top-0 z-20">
                                                            <tr>
                                                                {modalMode === 'kehadiran' && (
                                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Clear</th>
                                                                )}
                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Identity_Descriptor</th>
                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Connectivity</th>
                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Protocol_Status</th>
                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right pr-8">Audit_Pass</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {selectedParticipants.length > 0 ? (
                                                                selectedParticipants.map((participant) => {
                                                                    const checked = attendanceForm.data.user_ids.includes(participant.user_id);

                                                                    return (
                                                                        <tr key={participant.id} className="group/row hover:bg-slate-50/50 transition-all">
                                                                            {modalMode === 'kehadiran' && (
                                                                                <td className="px-6 py-4">
                                                                                    <div className="relative h-6 w-6">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={checked}
                                                                                            onChange={() => toggleAttendance(participant.user_id)}
                                                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                                                        />
                                                                                        <div className={clsx(
                                                                                            "absolute inset-0 rounded-lg border-2 transition-all flex items-center justify-center",
                                                                                            checked ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200 group-hover/row:border-emerald-400"
                                                                                        )}>
                                                                                            {checked && <CheckCircle2 size={12} className="text-white" />}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            )}
                                                                            <td className="px-6 py-4">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-black text-slate-900 group-hover/row:text-emerald-700 transition-colors italic uppercase">{participant.name}</span>
                                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">UNIT_ID: #{participant.user_id}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 italic tabular-nums">{participant.email || 'N_A'}</td>
                                                                            <td className="px-6 py-4 text-center">
                                                                                <Badge variant={participant.attendance_status === 'attended' ? 'success' : 'default'} className="px-3 py-1 font-black text-[8px] uppercase tracking-widest italic shadow-sm">
                                                                                    {participant.attendance_status}
                                                                                </Badge>
                                                                            </td>
                                                                            <td className="px-6 py-4 text-right pr-8">
                                                                                <div className="inline-flex items-center gap-2">
                                                                                    {participant.certificate_generated ? (
                                                                                        <ShieldCheck size={16} className="text-emerald-500" />
                                                                                    ) : (
                                                                                        <Lock size={14} className="text-slate-300" />
                                                                                    )}
                                                                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{participant.certificate_generated ? 'ISSUED' : 'PENDING'}</span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            ) : (
                                                                <tr>
                                                                    <td
                                                                        colSpan={modalMode === 'kehadiran' ? 5 : 4}
                                                                        className="px-6 py-20 text-center"
                                                                    >
                                                                        <div className="flex flex-col items-center gap-4">
                                                                            <Users className="h-12 w-12 text-slate-100" />
                                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No personnel detected in roster</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {modalMode === 'kehadiran' && (
                                                    <div className="flex justify-end gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={closeModal}
                                                            className="h-14 px-8 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest italic text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                                        >
                                                            Abort_Clearance
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={attendanceForm.processing}
                                                            className="h-14 px-10 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic flex items-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                                        >
                                                            {attendanceForm.processing ? (
                                                                <Activity size={18} className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Fingerprint className="w-5 h-5" />
                                                                    Deploy_Attendance_Fix
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Final Tactical Footer */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group shadow-3xl">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.1),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                                    <Cpu className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white italic tracking-[0.2em] uppercase ">Workshop_Squad_Scheduler • V2.4</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic leading-relaxed">
                                        Deployment training logistics synchronized with university academic chain. <br/>
                                        <span className="text-emerald-500 italic">Pre-Deployment Verification Stage: ACTIVE.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-3 text-slate-300 font-bold text-[10px] uppercase tracking-[0.5em] italic opacity-40">
                             <SearchCheck className="w-5 h-5 text-emerald-500" />
                             WORKSHOP_CONTROL_UNIT • MASTER_ADMIN_CLEARED
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
