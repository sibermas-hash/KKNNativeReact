import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, Head, router } from '@inertiajs/react';
import { 
    Calendar,
    Clock3,
    MapPin,
    Users,
    Plus,
    GraduationCap,
    BarChart3,
    BadgeCheck,
    X,
    Sparkles,
    Cpu,
    Fingerprint,
    ShieldCheck,
    
    Globe,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Workshop {
    id: number;
    title: string;
    description: string;
    methodology: string;
    date: string;
    workshop_date_value: string;
    time: string;
    start_time?: string | null;
    end_time?: string | null;
    location: string;
    registered: number;
    max_participants: number | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    is_full: boolean;
    can_edit: boolean;
    can_cancel: boolean;
    participants: WorkshopParticipant[];
}

interface WorkshopParticipant {
    id: number;
    user_id: number;
    name: string;
    email?: string | null;
    attendance_status: 'registered' | 'attended' | 'absent';
    certificate_generated: boolean;
    checked_in_at?: string | null;
}

interface Props {
    workshops: Workshop[];
}

declare function route(name: string, params?: any): string;

export default function WorkshopIndex({ workshops }: Props) {
    const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
        title: '',
        description: '',
        workshop_date: '',
        methodology: '',
        start_time: '',
        end_time: '',
        location: '',
        max_participants: '',
    });

    const [showForm, setShowForm] = React.useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = React.useState<Workshop | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = React.useState(false);
    const [modalMode, setModalMode] = React.useState<'attendance' | 'participants'>('attendance');
    const [editingWorkshopId, setEditingWorkshopId] = React.useState<number | null>(null);

    const attendForm = useForm({
        user_ids: [] as number[],
    });

    const openAttendance = (workshop: Workshop) => {
        setSelectedWorkshop(workshop);
        setModalMode('attendance');
        attendForm.setData(
            'user_ids',
            workshop.participants
                .filter((participant) => participant.attendance_status === 'attended')
                .map((participant) => participant.user_id)
        );
        setShowAttendanceModal(true);
    };

    const openParticipants = (workshop: Workshop) => {
        setSelectedWorkshop(workshop);
        setModalMode('participants');
        setShowAttendanceModal(true);
    };

    const toggleParticipant = (userId: number) => {
        const selected = attendForm.data.user_ids;

        attendForm.setData(
            'user_ids',
            selected.includes(userId)
                ? selected.filter((id) => id !== userId)
                : [...selected, userId]
        );
    };

    const resetWorkshopForm = () => {
        reset();
        clearErrors();
        setEditingWorkshopId(null);
        setShowForm(false);
    };

    const openCreateForm = () => {
        reset();
        clearErrors();
        setEditingWorkshopId(null);
        setShowForm(true);
    };

    const openEditForm = (workshop: Workshop) => {
        setEditingWorkshopId(workshop.id);
        clearErrors();
        setData({
            title: workshop.title,
            description: workshop.description ?? '',
            workshop_date: workshop.workshop_date_value,
            methodology: workshop.methodology ?? '',
            start_time: workshop.start_time ?? '',
            end_time: workshop.end_time ?? '',
            location: workshop.location ?? '',
            max_participants: workshop.max_participants ? String(workshop.max_participants) : '',
        });
        setShowForm(true);
    };

    const cancelWorkshop = (workshop: Workshop) => {
        if (!confirm(`Batalkan pembekalan "${workshop.title}"? Peserta tidak akan bisa lagi mendaftar ke agenda ini.`)) {
            return;
        }

        router.patch(route('admin.workshops.cancel', workshop.id), {}, {
            preserveScroll: true,
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const action = editingWorkshopId !== null
            ? patch
            : post;

        action(editingWorkshopId !== null ? route('admin.workshops.update', editingWorkshopId) : route('admin.workshops.store'), {
            onSuccess: () => {
                resetWorkshopForm();
            },
        });
    };

    const submitAttendance = (e: React.FormEvent) => {
        e.preventDefault();
        attendForm.post(route('admin.workshops.mark-attendance', selectedWorkshop?.id), {
            onSuccess: () => {
                setShowAttendanceModal(false);
                attendForm.reset();
            },
        });
    };

    const participants = selectedWorkshop?.participants ?? [];

    return (
        <AppLayout title="Protokol Pembekalan">
            <Head title="Pusat Pembekalan" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Replacing light header with a premium emerald tactical gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <Zap className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                WORKSHOP_STRATEGY_UNIT_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Pusat <span className="text-emerald-300 text-glow-emerald">Pembekalan</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Pusat pengelolaan pembekalan operasional mahasiswa. Atur agenda taktis, manajemen kuota audiens, dan audit presensi dalam satu modul kontrol.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 relative z-10">
                        <button
                            onClick={() => (showForm ? resetWorkshopForm() : openCreateForm())}
                            className={clsx(
                                "flex items-center gap-4 px-6 py-2 rounded-lg font-semibold text-xs",
                                showForm 
                                    ? "bg-white/20 text-white border border-slate-200 
                                    : "bg-white text-primary hover:bg-emerald-50"
                            )}
                        >
                            {showForm ? <X className="h-5 w-5 stroke-[3px]" /> : <Plus className="h-5 w-5 stroke-[3px]" />}
                            {showForm ? 'BATALKAN INPUT' : 'TAMBAH AGENDA'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden zoom-in-95 relative group mx-2">
                        <div className="absolute top-0 right-0 p-16 text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
                             <GraduationCap className="h-80 w-full" />
                        </div>

                        <div className="px-12 py-8 border-b border-slate-200 bg-slate-50/50 flex items-center gap-6 relative z-10">
                            <div className="p-3 bg-primary rounded-lg text-white
                                <Cpu className="h-6 w-6 stroke-[2px]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 ">
                                    {editingWorkshopId !== null ? 'Perbarui_Data_Pembekalan' : 'Input_Data_Pembekalan'}
                                </h2>
                                <p className="text-[9px] font-semibold text-slate-400 mt-2 ">
                                    {editingWorkshopId !== null ? 'MODE PEMBARUAN AKTIF' : 'SIAP INPUT DATA'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-12 space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Nama_Pembekalan</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none px-6 placeholder:opacity-30"
                                        placeholder="Contoh: Pembekalan KKN Terpadu"
                                    />
                                    {errors.title && <p className="text-rose-500 text-xs font-semibold  ml-1">{errors.title}</p>}
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Tanggal_Kegiatan</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-6 top-1/2/2 h-5 w-5 text-slate-300 group-focus-within/field:text-primary transition-colors z-10" />
                                        <input
                                            type="date"
                                            value={data.workshop_date}
                                            onChange={e => setData('workshop_date', e.target.value)}
                                            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Waktu_Mulai</label>
                                    <div className="relative">
                                        <Clock3 className="absolute left-6 top-1/2/2 h-5 w-5 text-slate-300 group-focus-within/field:text-primary transition-colors z-10" />
                                        <input
                                            type="time"
                                            value={data.start_time}
                                            onChange={e => setData('start_time', e.target.value)}
                                            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none
                                        />
                                    </div>
                                    {errors.start_time && <p className="text-rose-500 text-xs font-semibold  ml-1">{errors.start_time}</p>}
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Waktu_Selesai</label>
                                    <div className="relative">
                                        <Clock3 className="absolute left-6 top-1/2/2 h-5 w-5 text-slate-300 group-focus-within/field:text-primary transition-colors z-10" />
                                        <input
                                            type="time"
                                            value={data.end_time}
                                            onChange={e => setData('end_time', e.target.value)}
                                            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none
                                        />
                                    </div>
                                    {errors.end_time && <p className="text-rose-500 text-xs font-semibold  ml-1">{errors.end_time}</p>}
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Lokasi_Kegiatan</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-1/2/2 h-5 w-5 text-slate-300 group-focus-within/field:text-primary transition-colors z-10" />
                                        <input
                                            type="text"
                                            value={data.location}
                                            onChange={e => setData('location', e.target.value)}
                                            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none placeholder:opacity-30"
                                            placeholder="Contoh: Aula Utama UIN SAIZU"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Kuota_Peserta</label>
                                    <div className="relative">
                                        <Users className="absolute left-6 top-1/2/2 h-5 w-5 text-slate-300 group-focus-within/field:text-primary transition-colors z-10" />
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.max_participants}
                                            onChange={e => setData('max_participants', e.target.value)}
                                            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-primary/50outline-none placeholder:opacity-30"
                                            placeholder="Kosongkan jika tanpa batas"
                                        />
                                    </div>
                                    {errors.max_participants && <p className="text-rose-500 text-xs font-semibold  ml-1">{errors.max_participants}</p>}
                                </div>

                                <div className="md:col-span-2 space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Deskripsi_Pembekalan</label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={4}
                                        className="w-full p-8 bg-slate-50 border border-slate-200rounded-lg text-sm text-sm text-slate-600 focus:bg-white focus:border-primary/50outline-none
                                        placeholder="Tuliskan tujuan kegiatan dan pokok bahasan pembekalan..."
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-10 border-t border-slate-200 relative z-10">
                                <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                        <ShieldCheck className="h-6 w-6 stroke-[2px]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold  text-slate-400 mb-1.5">Validasi_Formulir</span>
                                        <span className="text-[8px] font-semibold text-slate-300 ">Data siap disimpan</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={resetWorkshopForm}
                                        className="px-6 py-5 bg-white border border-slate-200rounded-lg text-xs font-semibold text-slate-400  hover:bg-slate-50"
                                    >
                                        BATAL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-12 py-5 bg-primary text-whiterounded-lg text-xs font-semibold  hover:scale-[1.02]disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'MENYIMPAN...'
                                            : editingWorkshopId !== null
                                                ? 'Simpan Perubahan'
                                                : 'Simpan Pembekalan'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Modules Grid - Tactical Card Engine */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:mx-2">
                    {workshops.length > 0 ? workshops.map((workshop) => (
                        <div key={workshop.id} className="bg-white rounded-lg border border-slate-200 group hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2overflow-hidden relative flex flex-col">
                            <div className={clsx(
                                "h-2 w-full",
                                workshop.is_full ? "bg-rose-500" : "bg-primary"
                            )} />

                            <div className="p-12 border-b border-slate-200/50 flex-grow relative overflow-hidden">
                                <div className="absolute -right-6 -top-4 text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
                                    <Globe className="h-48 w-48" />
                                </div>

                                <div className="flex items-start justify-between gap-8 mb-8 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="h-2 w-2 rounded-lg bg-primary />
                                            <span className="text-[10px] font-semibold text-slate-300  pt-0.5">Kode: {workshop.id.toString().padStart(4, '0')}</span>
                                        </div>
                                        <h3 className="text-3xl font-semibold text-slate-900  group-hover:text-primary transition-colors">{workshop.title}</h3>
                                    </div>
                                    <div className={clsx(
                                        "px-5 py-2 rounded-xl border text-[9px] font-semibold  shrink-0",
                                        workshop.status === 'cancelled'
                                            ? "bg-slate-200 text-slate-600 border-slate-300"
                                            : workshop.status === 'completed'
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                : workshop.is_full
                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {workshop.status === 'cancelled'
                                            ? 'STATUS: DIBATALKAN'
                                            : workshop.status === 'completed'
                                                ? 'STATUS: SELESAI'
                                                : workshop.is_full
                                                    ? 'STATUS: PENUH'
                                                    : 'STATUS: TERSEDIA'}
                                    </div>
                                </div>
                                
                                <p className="text-[13px] text-sm text-slate-400 leading-normal max-w-xl mb-10 line-clamp-3 opacity-75">
                                    {workshop.description}
                                </p>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-slate-200 relative z-10">
                                    <InfoItem icon={Calendar} label="Tanggal" value={workshop.date} color="text-slate-900" />
                                    <InfoItem icon={Clock3} label="Waktu" value={workshop.time} color="text-slate-900" />
                                    <InfoItem icon={MapPin} label="Lokasi" value={workshop.location} color="text-primary" />
                                    <InfoItem icon={Users} label="Kapasitas" value={`${workshop.registered} / ${workshop.max_participants || '\u221E'}`} color="text-slate-900" />
                                </div>
                            </div>

                            <div className="px-6 py-6 bg-slate-50/50 grid grid-cols-2 gap-4 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => openParticipants(workshop)}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-xs font-semibold text-slate-400  rounded-lg hover:text-primary hover:border-primaryhover:scale-105"
                                >
                                    LIHAT DAFTAR PESERTA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openAttendance(workshop)}
                                    disabled={workshop.participants.length === 0 || workshop.status === 'cancelled'}
                                    className="flex-1 py-4 bg-primary text-white text-xs font-semibold  rounded-lg hover:bg-primary-darkhover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    INPUT PRESENSI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openEditForm(workshop)}
                                    disabled={!workshop.can_edit}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-xs font-semibold text-slate-400  rounded-lg hover:text-primary hover:border-primaryhover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    UBAH DATA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => cancelWorkshop(workshop)}
                                    disabled={!workshop.can_cancel}
                                    className="flex-1 py-4 bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-500  rounded-lg hover:bg-rose-100hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    BATALKAN KEGIATAN
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-6 group">
                            <div className="p-10 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
                                <Sparkles className="h-20 w-20 text-slate-200" />
                            </div>
                            <p className="text-[12px] font-semibold text-slate-300  text-center leading-normal">
                                Belum ada pembekalan tersedia<br />
                                <span className="text-primary opacity-50  mt-2 block lowercase">Siap untuk ditambahkan</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Tactical Emerald Footer */}
                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-4">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-semibold text-white ">STRATEGIC_PREP_PROTOCOL_V3</h4>
                                <p className="text-[10px] text-emerald-400 text-sm  mt-2 whitespace-nowrap">STATUS: SECURE_DATA_TRANSMISSION</p>
                            </div>
                            <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
                                Pembekalan menjadi gerbang persiapan mahasiswa sebelum terjun ke lapangan. 
                                Data presensi akan langsung memengaruhi sertifikat kegiatan dan komponen nilai pembekalan. 
                                Pastikan tanggal, waktu, dan lokasi kegiatan telah diisi dengan benar agar tidak menimbulkan benturan jadwal operasional KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-2 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
                                <span className="text-[11px] font-semibold text-slate-100 ">MONITOR_VERIFIED</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Ingestion Modal */}
                {showAttendanceModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60">
                        <div className="bg-white rounded-lg w-full max-w-xl p-12 border border-slate-200 relative zoom-in-95 overflow-hidden group/modal">
                            <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-hover/modal:rotate-12 transition-transform">
                                 <BadgeCheck className="h-40 w-40" />
                            </div>

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="p-4 rounded-lg bg-primary text-white
                                    <Zap className="h-8 w-8 stroke-[2.5px]" />
                                </div>
                                <button onClick={() => setShowAttendanceModal(false)} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-rose-500hover:rotate-90">
                                    <X className="h-7 w-7 stroke-[2.5px]" />
                                </button>
                            </div>

                            <div className="relative z-10 space-y-3 mb-12">
                                <h3 className="text-3xl font-semibold text-slate-900 ">
                                    {modalMode === 'attendance' ? 'Input Presensi' : 'Daftar Peserta'}
                                </h3>
                                <p className="text-[12px] font-semibold text-primary  border-l-4 border-primary pl-4">{selectedWorkshop?.title}</p>
                            </div>

                            <form onSubmit={submitAttendance} className="space-y-10 relative z-10">
                                <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 flex gap-6 group hover:border-primary/30">
                                    <div className="p-3 bg-white/5 rounded-lg text-primary shrink-0 group-hover:scale-110 transition-transform">
                                         <Fingerprint className="h-8 w-8 stroke-[2px]" />
                                    </div>
                                    <p className="text-[12px] text-sm text-slate-400  leading-normal pt-1">
                                        {modalMode === 'attendance'
                                            ? 'Protokol operasional: data presensi pada kegiatan ini akan memperbarui sertifikat dan komponen nilai pembekalan sesuai status kehadiran peserta.'
                                            : 'Daftar peserta: tinjau peserta pembekalan, status hadir, dan status sertifikat sebelum melakukan perubahan presensi.'}
                                    </p>
                                </div>

                                <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2 custom-scrollbar">
                                    {participants.length > 0 ? participants.map((participant) => {
                                        const selected = attendForm.data.user_ids.includes(participant.user_id);

                                        return (
                                            <div
                                                key={participant.id}
                                                className="flex items-center justify-between gap-6rounded-lg border border-slate-200 bg-slate-50 px-6 py-5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-semibold  text-slate-900">
                                                        {participant.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-sm  text-slate-400">
                                                        {participant.email ?? 'Email tidak tersedia'}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <span className={clsx(
                                                            'rounded-lg px-3 py-1 text-[9px] font-semibold ',
                                                            participant.attendance_status === 'attended'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : participant.attendance_status === 'absent'
                                                                    ? 'bg-rose-50 text-rose-600'
                                                                    : 'bg-amber-50 text-amber-600'
                                                        )}>
                                                            {formatAttendanceStatus(participant.attendance_status)}
                                                        </span>
                                                        <span className={clsx(
                                                            'rounded-lg px-3 py-1 text-[9px] font-semibold ',
                                                            participant.certificate_generated
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'bg-slate-200 text-slate-500'
                                                        )}>
                                                            {participant.certificate_generated ? 'sertifikat siap' : 'sertifikat belum terbit'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {modalMode === 'attendance' ? (
                                                    <label className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 cursor-pointer group/check">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => toggleParticipant(participant.user_id)}
                                                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[10px] font-semibold  text-slate-500 group-hover/check:text-primary transition-colors">
                                                            Hadir
                                                        </span>
                                                    </label>
                                                ) : (
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-[9px] font-semibold  text-slate-300">Check In</p>
                                                        <p className="mt-1 text-xs text-sm  text-slate-500">
                                                            {participant.checked_in_at ?? 'Belum tercatat'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-6 text-center">
                                            <p className="text-[11px] font-semibold  text-slate-400">
                                                Belum ada peserta terdaftar pada pembekalan ini.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-6">
                                    <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 py-5 text-xs font-semibold text-slate-400  hover:bg-slate-50 border border-slate-200rounded-lg">TUTUP</button>
                                    {modalMode === 'attendance' && (
                                        <button
                                            type="submit"
                                            disabled={participants.length === 0}
                                            className="flex-[2] py-5 bg-primary text-white text-xs font-semibold rounded-lg hover:scale-[1.03]disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            SIMPAN PRESENSI
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function formatAttendanceStatus(status: WorkshopParticipant['attendance_status']) {
    switch (status) {
        case 'attended':
            return 'hadir';
        case 'absent':
            return 'tidak hadir';
        default:
            return 'terdaftar';
    }
}

function InfoItem({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex flex-col gap-2 min-w-0 group/info">
            <div className={clsx("flex items-center gap-2.5", color)}>
                <Icon className="h-3.5 w-3.5 stroke-[2.5px]" />
                <span className="text-[10px] font-semibold  pt-0.5"> {label}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-900 truncate opacity-75 group-hover/info:opacity-100">{value}</span>
        </div>
    );
}
