import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, StatusBadge, ConfirmDialog } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Users,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    GraduationCap,
    AlertTriangle,
    X,
    ShieldCheck,
    Cpu,
    Fingerprint,
    Globe2,
    Scale,
    Search,
    Users2,
    Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

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
    location: { id: number; village_name: string; full_name?: string };
    main_lecturer: { id: number; name: string } | null;
    lecturers: { id: number; name: string; role: string }[];
}

interface Props extends PageProps {
    groups: GroupData[];
    periods: { id: number; name: string }[];
    locations: { id: number; village_name: string; full_name?: string }[];
    lecturers: { id: number; name: string }[];
}

export default function GroupsIndex({ groups, periods, locations, lecturers }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<GroupData | null>(null);
    const [deleting, setDeleting] = useState<GroupData | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, reset, errors, processing } = useForm({
        period_id: '',
        location_id: '',
        name: '',
        capacity: '20',
        status: 'draft',
        lecturers: [] as DplInput[],
    });

    const filteredGroups = groups.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) || 
        g.code.toLowerCase().includes(search.toLowerCase()) ||
        g.location.village_name.toLowerCase().includes(search.toLowerCase())
    );

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
        const lecturer = newLecturers[index];

        if (!lecturer) return;

        if (field === 'role') {
            lecturer.role = value as DplInput['role'];
        } else {
            lecturer.id = value;
        }

        setData('lecturers', newLecturers);
    };

    const deleteForm = useForm({});

    return (
        <AppLayout title="Protokol Unit KKN">
            <Head title="Manajemen Kelompok KKN" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Users2 className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                UNIT_ORCHESTRATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Arsip <span className="text-emerald-300 text-glow-emerald italic">Kelompok</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Manajemen pembagian unit operasional, penugasan DPL eksekutif, dan sinkronisasi daerah pengabdian KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Unit</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{groups.length} Sektor</span>
                            </div>
                        </div>
                        {!showForm && (
                            <button
                                onClick={() => { setEditing(null); reset(); setShowForm(true); }}
                                className="flex items-center gap-4 px-10 py-5.5 bg-white hover:bg-emerald-50 text-primary rounded-[1.5rem] font-black text-xs uppercase  transition-all hover:-translate-y-1 active:scale-95 italic"
                            >
                                <Plus className="w-5 h-5 stroke-[2px]" />
                                Inisialisasi Kelompok
                            </button>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="bg-white rounded-[3rem] border border-slate-100 p-10 overflow-hidden relative group zoom-in-95 mx-2">
                         <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-6 transition-transform">
                             <Users className="h-64 w-64" />
                         </div>

                        <div className="flex items-center justify-between mb-10 relative z-10 px-2">
                            <div className="flex items-center gap-6">
                                <div className="rounded-[1.25rem] bg-primary p-4 text-white
                                    {editing ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6 stroke-[3px]" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase  italic leading-none">
                                        {editing ? 'Ubah Data Kelompok' : 'Tambah Kelompok Baru'}
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase  italic opacity-70">Formulir pendaftaran unit operasional</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowForm(false)} 
                                className="h-12 w-12 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-300 hover:text-rose-500 rounded-lg hover:rotate-90 transition-all"
                            >
                                <X className="h-6 w-6 stroke-[3px]" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-12 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                {/* Left Column: Dasar Kelompok */}
                                <div className="space-y-10">
                                    <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                            <Cpu className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase  italic leading-none">Parameter Kelompok</h3>
                                    </div>

                                    <div className="space-y-3 group/field">
                                        <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Identitas Kelompok</label>
                                        <FormInput
                                            id="name"
                                            placeholder="Misal: Kelompok 1 - Purwokerto"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            required
                                            className="h-16 px-8 bg-slate-50 border-slate-100 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:border-primary/30 transition-all outline-none italic uppercase"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Kapasitas</label>
                                            <FormInput id="capacity" type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} error={errors.capacity} required className="h-14 font-black bg-slate-50 border-slate-100 rounded-lg" />
                                        </div>
                                        <div className="space-y-3 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Status Awal</label>
                                            <FormSelect id="status" options={[{ value: 'draft', label: 'Draf' }, { value: 'active', label: 'Aktif' }, { value: 'closed', label: 'Ditutup' }]} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} required className="h-14 font-black bg-slate-50 border-slate-100 rounded-lg uppercase  italic text-[11px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-8 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                                        <div className="space-y-3 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Periode KKN</label>
                                            <FormSelect id="period_id" options={periods.map(p => ({ value: p.id, label: p.name }))} value={data.period_id} onChange={(e) => setData('period_id', e.target.value)} error={errors.period_id} required className="h-14 font-black bg-white" />
                                        </div>
                                        <div className="space-y-3 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors">Lokasi Penugasan</label>
                                            <FormSelect id="location_id" options={locations.map(l => ({ value: l.id, label: l.full_name || l.village_name }))} value={data.location_id} onChange={(e) => setData('location_id', e.target.value)} error={errors.location_id} required className="h-14 font-black bg-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Penugasan DPL */}
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-slate-900 text-primary
                                                <GraduationCap className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase  italic leading-none">Penugasan DPL</h3>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={addLecturer} 
                                            className="h-11 px-6 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all text-[11px] font-black italic rounded-xl uppercase  active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 mr-2 inline-block -mt-0.5" />
                                            Tambah DPL
                                        </button>
                                    </div>

                                    <div className="space-y-6 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                                        {data.lecturers.length === 0 && (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 group/empty hover:border-primary/20 transition-all">
                                                 <p className="text-[11px] font-black text-slate-300 group-hover:text-primary/40 transition-colors uppercase  italic leading-none">Belum ada Dosen ditugaskan</p>
                                            </div>
                                        )}
                                        {data.lecturers.map((l, index) => (
                                            <div key={index} className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] relative group/item transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                                                <div className="space-y-6">
                                                    <div className="space-y-2 group/field">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase  ml-1 italic group-focus-within/field:text-primary transition-colors">Identitas Akademik Dosen</label>
                                                        <select
                                                            value={l.id}
                                                            onChange={(e) => updateLecturer(index, 'id', e.target.value)}
                                                            className="block w-full bg-white border border-slate-100 rounded-lg text-sm font-black text-slate-900 px-6 py-4 focus:border-primary/50 outline-none transition-all italic
                                                            required
                                                        >
                                                            <option value="">-- PILIH PERSONEL --</option>
                                                            {lecturers.map((lec) => (
                                                                <option key={lec.id} value={lec.id}>{lec.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center gap-10 px-2">
                                                        <label className="flex items-center gap-3 cursor-pointer group/radio">
                                                            <div className="relative flex items-center justify-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`role-${index}`}
                                                                    checked={l.role === 'Ketua'}
                                                                    onChange={() => updateLecturer(index, 'role', 'Ketua')}
                                                                    className="h-5 w-5 border-2 border-slate-200 text-primary focus:ring-primary/20 appearance-none rounded-full transition-all checked:border-primary"
                                                                />
                                                                <div className={clsx("absolute h-2.5 w-2.5 rounded-full bg-primary transition-all scale-0", l.role === 'Ketua' && 'scale-100')} />
                                                            </div>
                                                            <span className={clsx("text-[11px] font-black uppercase  italic transition-colors leading-none", l.role === 'Ketua' ? 'text-primary' : 'text-slate-400')}>KETUA_PENGAWAS</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer group/radio">
                                                            <div className="relative flex items-center justify-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`role-${index}`}
                                                                    checked={l.role === 'Anggota'}
                                                                    onChange={() => updateLecturer(index, 'role', 'Anggota')}
                                                                    className="h-5 w-5 border-2 border-slate-200 text-primary focus:ring-primary/20 appearance-none rounded-full transition-all checked:border-primary"
                                                                />
                                                                <div className={clsx("absolute h-2.5 w-2.5 rounded-full bg-primary transition-all scale-0", l.role === 'Anggota' && 'scale-100')} />
                                                            </div>
                                                            <span className={clsx("text-[11px] font-black uppercase  italic transition-colors leading-none", l.role === 'Anggota' ? 'text-primary' : 'text-slate-400')}>ANGGOTA_UNIT</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeLecturer(index)} 
                                                    className="absolute top-6 right-6 text-slate-200 hover:text-rose-500 transition-all p-2.5 hover:bg-rose-50 rounded-xl"
                                                >
                                                    <Trash2 className="h-5 w-5 stroke-[2.5px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.lecturers && <p className="text-[10px] font-black text-rose-500 uppercase  italic px-4 py-2 bg-rose-50 rounded-lg">{errors.lecturers}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-12 border-t border-slate-50 mx-2">
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                                        <ShieldCheck className="h-7 w-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase  text-slate-400 italic leading-none mb-1.5">Protokol_Data_Secure</span>
                                        <span className="text-[8px] font-black text-slate-300 uppercase  italic leading-none">Record disinkronisasi ke pusat komando</span>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <button
                                        type="button"
                                        onClick={() => { setEditing(null); setShowForm(false); reset(); }}
                                        className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase  hover:text-slate-900 rounded-lg transition-all italic leading-none"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-14 py-5.5 bg-primary text-white rounded-lg text-[11px] font-black uppercase  hover:bg-primary-dark hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 italic leading-none"
                                    >
                                        {processing ? 'Menyimpan...' : (editing ? 'Perbarui Data Sektor' : 'Simpan Unit Kelompok')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filter Search Area */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 mx-2">
                    <div className="relative flex-1 w-full max-w-2xl group">
                         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                         <input
                            placeholder="Cari berdasarkan nama, kode, atau destinasi lokasi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5.5 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 italic  outline-none focus:border-primary/50 transition-all uppercase placeholder:italic placeholder:opacity-30"
                        />
                    </div>
                    <div className="flex items-center gap-5 text-slate-400 italic shrink-0">
                         <div className="h-1 w-12 bg-slate-100 rounded-full" />
                        <span className="text-[10px] font-black uppercase ">Payload: <span className="text-primary italic">{filteredGroups.length}</span> Unit_Terdeteksi</span>
                    </div>
                </div>

                {/* Group Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mx-2">
                    {filteredGroups.map((g) => (
                        <div key={g.id} className="group bg-white rounded-[3.5rem] border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all overflow-hidden relative flex flex-col">
                            <div className={clsx(
                                "h-2 w-full",
                                g.status === 'active' ? 'bg-primary' : (g.status === 'closed' ? 'bg-slate-300' : 'bg-amber-400')
                            )} />

                            <div className="p-10 pb-8 space-y-10 flex-grow relative overflow-hidden">
                                <div className="absolute -right-8 -top-6 opacity-[0.03] text-slate-900 pointer-events-none group-hover:rotate-12 group-hover:scale-110 transition-transform">
                                    <Globe2 className="h-48 w-48" />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-2">
                                             <span className="px-3 py-1 bg-slate-900 text-primary text-[10px] font-black uppercase  rounded-xl italic w-fit
                                                #{g.code}
                                            </span>
                                             <span className="text-[9px] font-black text-slate-300 uppercase  italic opacity-50">UNIT_RECON_ID: {g.id.toString().padStart(4, '0')}</span>
                                        </div>
                                        <StatusBadge status={g.status} className="text-[9px] font-black  uppercase italic border-none px-5 py-2 rounded-lg" />
                                    </div>
                                    
                                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors italic leading-[0.9] uppercase  pr-4">{g.name}</h3>
                                    
                                    <div className="flex items-center gap-4 py-2 border-y border-slate-50 bg-slate-50/30 px-4 rounded-lg">
                                        <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-primary
                                            <MapPin className="h-5 h-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                             <span className="text-[12px] font-black text-slate-900 uppercase  italic leading-none truncate">
                                                {g.location?.village_name ?? 'LOKASI_PUSAT'}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase mt-1.5  italic opacity-60">Wilayah_Penugasan</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity Metric */}
                                <div className="bg-slate-50/50 border border-slate-100rounded-lg p-7 space-y-6 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase  italic leading-none">Mahasiswa Terdaftar</span>
                                            <span className="text-[9px] font-black text-primary uppercase  italic leading-none opacity-60">Mobilisasi Personel</span>
                                        </div>
                                        <div className="text-right flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-900 tabular-nums italic leading-none">{g.registrations_count}</span>
                                            <span className="text-sm font-black text-slate-300 italic">/</span>
                                             <span className="text-[16px] font-black text-slate-400 italic leading-none opacity-60">{g.capacity}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3.5 overflow-hidden flex p-0.5 border border-slate-100/50 relative">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all relative z-10",
                                                g.status === 'active' ? 'bg-primary' : 'bg-slate-200'
                                            )}
                                            style={{ width: `${Math.min((g.registrations_count / g.capacity) * 100, 100)}%` }}
                                        />
                                        <div className="absolute inset-0 bg-slate-50 opacity-10" />
                                    </div>
                                </div>

                                {/* DPL Structure */}
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                         <div className="p-2 bg-slate-100 rounded-xl">
                                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase  italic">Dpl_Executive_Orch</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3.5">
                                        {g.lecturers.length > 0 ? (
                                            g.lecturers.map(l => (
                                                <div key={l.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4 group/officer hover:border-primary/40 hover:bg-emerald-50/10 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={clsx("w-2.5 h-2.5 rounded-full", l.role === 'Ketua' ? 'bg-primary : 'bg-slate-200')} />
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-black text-slate-900 uppercase italic leading-none 
                                                                {l.name}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2  italic leading-none opacity-70">{l.role}</span>
                                                        </div>
                                                    </div>
                                                    <GraduationCap className="h-4 w-4 text-slate-200 group-hover/officer:text-primary group-hover/officer:scale-110 transition-all" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 border-2 border-dashed border-amber-100 bg-amber-50/10rounded-lg flex flex-col items-center gap-4 group/alert">
                                                <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-amber-600 uppercase  italic text-center leading-relaxed">PERSONEL_DPL_UNASSIGNED<br/><span className="text-[8px] opacity-60">Segera lakukan plotting</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-slate-50/40 border-t border-slate-50 flex justify-between items-center relative z-10">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <span className="text-[11px] font-black text-slate-900 uppercase  italic leading-none">
                                            {g.period?.name ?? 'PERIODE_UNDEFINED'}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase  italic ml-7 leading-none opacity-60">Status_Temporal</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => startEdit(g)}
                                        className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40 rounded-lg transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <Edit2 className="w-5 h-5 stroke-[2.5px]" />
                                    </button>
                                    <button
                                        onClick={() => setDeleting(g)}
                                        className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <Trash2 className="w-5 h-5 stroke-[2.5px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {filteredGroups.length === 0 && (
                        <div className="lg:col-span-3 py-48 flex flex-col items-center bg-white border-2 border-dashed border-slate-100 rounded-[4rem] group">
                            <div className="p-10 bg-slate-50 rounded-full mb-10 group-hover:scale-110 transition-transform">
                                <Users className="h-20 w-20 text-slate-100" />
                            </div>
                            <p className="text-[13px] font-black text-slate-300 uppercase  text-center leading-relaxed italic pr-4">
                                Tidak ada data kelompok yang terdeteksi<br />
                                <span className="text-primary  opacity-40 lowercase pt-2 block px-10">Sistem siaga penuh: Menunggu input record kelompok baru</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Tactical Emerald Footer */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-4">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <Scale className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">UNIT_STRATEGY_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: SECTOR_DATA_SYNC_OK</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Pedoman Strategis: Kelompok KKN berfungsi sebagai unit operasional terkecil dalam pelaksanaan pengabdian. 
                                Setiap sektor wajib memiliki struktur eksekutif (DPL), penugasan wilayah yang divalidasi, dan unit temporal yang aktif. 
                                Status <span className="text-primary font-black uppercase">Aktif</span> membuka jalur mobilisasi mahasiswa secara langsung melalui portal resmi KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-2 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">REALTIME_UNIT_SYNC</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/groups/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Kelompok"
                message={`Apakah Anda yakin ingin menghapus kelompok "${deleting?.name}"? Tindakan ini akan membatalkan seluruh pendaftaran mahasiswa yang terkait dengan kelompok ini.`}
                confirmLabel="Ya, Hapus Kelompok"
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
