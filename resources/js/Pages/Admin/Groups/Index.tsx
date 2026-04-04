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
 Activity,
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
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 UNIT_ORCHESTRATION_CORE
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Users2 className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Manajemen <span className="text-primary">Kelompok</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Globe2 className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Total_Sektor</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {groups.length} UNIT
 </span>
 </div>
 </div>
 </div>

 {!showForm && (
 <button 
 onClick={() => { setEditing(null); reset(); setShowForm(true); }}
 className="px-6 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3"
 >
 <Plus className="w-3.5 h-3.5 text-emerald-400" />
 INITIALIZE_NEW_UNIT
 </button>
 )}
 </div>
 </div>

 {showForm && (
 <div className="bg-white border border-slate-100 rounded-lg overflow-hidden mb-12 fade-in zoom-in-95 duration-300">
 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary rounded-lg text-white">
 {editing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
 </div>
 <div className="flex flex-col">
 <h2 className="text-sm font-semibold text-slate-900">{editing ? 'UPDATE_UNIT_PARAMETERS' : 'REGISTER_NEW_OPERATIONAL_UNIT'}</h2>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">Operational Protocol Alpha-7</span>
 </div>
 </div>
 <button 
 onClick={() => setShowForm(false)} 
 className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg hover:rotate-90 transition-all"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-10 space-y-10">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
 {/* Left: Unit Config */}
 <div className="space-y-8">
 <div className="flex items-center gap-3 opacity-50 pb-4 border-b border-slate-100">
 <Cpu className="h-4 w-4 text-slate-400" />
 <span className="text-[10px] font-semibold text-slate-400">UNIT_CONFIGURATION</span>
 </div>
 
 <div className="space-y-6">
 <FormInput
 label="IDENTITAS_UNIT"
 placeholder="Ex: Kelompok 1 - Purwokerto..."
 value={data.name}
 onChange={(e) => setData('name', e.target.value)}
 error={errors.name}
 required
 className="h-14 bg-slate-50 border-slate-100 rounded-lg"
 />

 <div className="grid grid-cols-2 gap-6">
 <FormInput 
 label="KAPASITAS" 
 type="number" 
 value={data.capacity} 
 onChange={(e) => setData('capacity', e.target.value)} 
 error={errors.capacity} 
 required 
 className="h-12 bg-slate-50 border-slate-100 rounded-lg" 
 />
 <FormSelect 
 label="STATUS" 
 options={[
 { value: 'draft', label: 'DRAFT_SMODE' }, 
 { value: 'active', label: 'ACTIVE_DEPLOY' }, 
 { value: 'closed', label: 'CLOSED_OP' }
 ]} 
 value={data.status} 
 onChange={(e) => setData('status', e.target.value)} 
 error={errors.status} 
 required 
 className="h-12 bg-slate-50 border-slate-100 rounded-lg" 
 />
 </div>

 <div className="grid grid-cols-2 gap-6">
 <FormSelect 
 label="PERIODE_TEMPORAL" 
 options={periods.map(p => ({ value: p.id, label: p.name }))} 
 value={data.period_id} 
 onChange={(e) => setData('period_id', e.target.value)} 
 error={errors.period_id} 
 required 
 className="h-12 bg-slate-50 border-slate-100 rounded-lg" 
 />
 <FormSelect 
 label="LOKASI_PENUGASAN" 
 options={locations.map(l => ({ value: l.id, label: l.full_name || l.village_name }))} 
 value={data.location_id} 
 onChange={(e) => setData('location_id', e.target.value)} 
 error={errors.location_id} 
 required 
 className="h-12 bg-slate-50 border-slate-100 rounded-lg" 
 />
 </div>
 </div>
 </div>

 {/* Right: Personnel Assignment */}
 <div className="space-y-8">
 <div className="flex items-center justify-between pb-4 border-b border-slate-100">
 <div className="flex items-center gap-3 opacity-50">
 <GraduationCap className="h-4 w-4 text-slate-400" />
 <span className="text-[10px] font-semibold text-slate-400">PERSONNEL_ASSIGNMENT</span>
 </div>
 <button 
 type="button" 
 onClick={addLecturer} 
 className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-semibold rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all transition-colors"
 >
 <Plus className="w-3 h-3 mr-2 inline-block -mt-0.5" />
 ASSIGN_DPL
 </button>
 </div>

 <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
 {data.lecturers.length === 0 && (
 <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
 <p className="text-[10px] font-semibold text-slate-300">NO_OFFICERS_ASSIGNED</p>
 </div>
 )}
 {data.lecturers.map((l, index) => (
 <div key={index} className="bg-white border border-slate-100 p-6 rounded-lg relative group/item hover:border-primary/30 transition-all ">
 <div className="space-y-4">
 <select
 value={l.id}
 onChange={(e) => updateLecturer(index, 'id', e.target.value)}
 className="block w-full bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 px-4 py-3 focus:border-primary/50 outline-none"
 required
 >
 <option value="">-- SELECT_PERSONNEL --</option>
 {lecturers.map((lec) => (
 <option key={lec.id} value={lec.id}>{lec.name}</option>
 ))}
 </select>

 <div className="flex items-center gap-6">
 {(['Ketua', 'Anggota'] as const).map((role) => (
 <label key={role} className="flex items-center gap-2 cursor-pointer group/radio">
 <input
 type="radio"
 name={`role-${index}`}
 checked={l.role === role}
 onChange={() => updateLecturer(index, 'role', role)}
 className="h-4 w-4 border-slate-200 text-primary focus:ring-primary/20 accent-primary"
 />
 <span className={clsx("text-[9px] font-semibold transition-colors", l.role === role ? 'text-primary' : 'text-slate-300')}>
 {role === 'Ketua' ? 'LEAD_OFFICER' : 'UNIT_MEMBER'}
 </span>
 </label>
 ))}
 </div>
 </div>
 <button 
 type="button" 
 onClick={() => removeLecturer(index)} 
 className="absolute top-4 right-4 text-slate-200 hover:text-rose-500 transition-colors"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 ))}
 </div>
 {errors.lecturers && <p className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-4 py-2 rounded-lg">{errors.lecturers}</p>}
 </div>
 </div>

 <div className="flex items-center justify-between pt-10 border-t border-slate-50">
 <div className="flex items-center gap-4 text-slate-300">
 <ShieldCheck className="h-5 w-5" />
 <span className="text-[9px] font-semibold">DATA_INTEGRITY_VERIFIED_V3.2</span>
 </div>
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setShowForm(false)}
 className="px-8 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-900 transition-all"
 >
 CANCEL_OP
 </button>
 <button
 type="submit"
 disabled={processing}
 className="px-12 py-3 bg-primary text-white rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
 >
 {processing ? 'SYNCING...' : (editing ? 'CONFIRM_PARAMETERS_UPDATE' : 'INITIALIZE_UNIT_RECON')}
 </button>
 </div>
 </div>
 </form>
 </div>
 )}

 {/* Operations Toolbar */}
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="relative group flex-1 w-full max-w-2xl">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_OPERATIONAL_UNIT (CODE / NAME / LOCATION)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>
 <div className="flex items-center gap-3 text-slate-300">
 <div className="h-1 w-12 bg-slate-50 rounded-full" />
 <span className="text-[9px] font-semibold">Sectors_Active: <span className="text-primary">{filteredGroups.length}</span></span>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredGroups.map((g) => (
 <div key={g.id} className="group bg-white rounded-lg border border-slate-100 hover:border-primary/20 transition-all flex flex-col overflow-hidden relative">
 {/* Status Header Strip */}
 <div className={clsx(
 "h-1.5 w-full",
 g.status === 'active' ? 'bg-primary' : (g.status === 'closed' ? 'bg-slate-300' : 'bg-amber-400')
 )} />

 <div className="p-8 space-y-6 flex-grow ">
 <div className="flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-400">#{g.code}</span>
 <h3 className="text-xl font-semibold text-slate-900 leading-none mt-1 group-hover:text-primary transition-colors">{g.name}</h3>
 </div>
 <StatusBadge status={g.status} className="text-[8px] font-semibold px-4 py-1.5 rounded-lg border-none" />
 </div>
 
 <div className="bg-slate-50/50 rounded-lg p-4 flex items-center gap-4 border border-slate-100">
 <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-primary">
 <MapPin className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-slate-900 leading-none">{g.location?.village_name ?? 'HQ_COORD'}</span>
 <span className="text-[8px] font-semibold text-slate-400 mt-1 opacity-50">SECTOR_ASSIGNMENT</span>
 </div>
 </div>

 <div className="space-y-3">
 <div className="flex justify-between items-baseline px-1">
 <span className="text-[9px] font-semibold text-slate-400">MOBILIZATION_METRIC</span>
 <div className="text-right">
 <span className="text-xl font-semibold text-slate-900 leading-none">{g.registrations_count}</span>
 <span className="text-[10px] font-semibold text-slate-300 mx-1">/</span>
 <span className="text-xs font-semibold text-slate-400">{g.capacity}</span>
 </div>
 </div>
 <div className="w-full bg-slate-50 rounded-lg h-2 overflow-hidden flex p-0.5 border border-slate-200/50">
 <div
 className={clsx(
 "h-full rounded-sm transition-all duration-700",
 g.status === 'active' ? 'bg-primary shadow-[0_0_8px_rgba(16,168,83,0.3)]' : 'bg-slate-300'
 )}
 style={{ width: `${Math.min((g.registrations_count / g.capacity) * 100, 100)}%` }}
 />
 </div>
 </div>

 <div className="space-y-4 pt-2">
 <div className="flex items-center gap-2 opacity-50">
 <ShieldCheck className="h-3 w-3 text-slate-400" />
 <span className="text-[8px] font-semibold text-slate-400">OFFICER_COMMAND_LOG</span>
 </div>
 <div className="space-y-2">
 {g.lecturers.length > 0 ? (
 g.lecturers.slice(0, 2).map(l => (
 <div key={l.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 group/off hover:bg-white hover:border-emerald-100 transition-all">
 <div className="flex items-center gap-3">
 <div className={clsx("w-1.5 h-1.5 rounded-full", l.role === 'Ketua' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,168,83,0.5)]' : 'bg-slate-300')} />
 <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[120px]">{l.name}</span>
 </div>
 <span className="text-[8px] font-semibold text-primary/40">{l.role === 'Ketua' ? 'LEAD' : 'MEMBER'}</span>
 </div>
 ))
 ) : (
 <div className="py-4 text-center border border-dashed border-amber-100 bg-amber-50/50 rounded-lg">
 <span className="text-[8px] font-semibold text-amber-600">UNASSIGNED_DPL_ALERT</span>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-50 flex justify-between items-center">
 <div className="flex items-baseline gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
 <span className="text-[9px] font-semibold text-slate-900 truncate max-w-[100px]">{g.period?.name || 'TEMPORAL_ID_N/A'}</span>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => startEdit(g)}
 className="h-9 w-9 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 rounded-lg transition-all "
 >
 <Edit2 className="w-4 h-4 mx-auto" />
 </button>
 <button
 onClick={() => setDeleting(g)}
 className="h-9 w-9 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all "
 >
 <Trash2 className="w-4 h-4 mx-auto" />
 </button>
 </div>
 </div>
 </div>
 ))}

 {filteredGroups.length === 0 && (
 <div className="lg:col-span-3 py-32 flex flex-col items-center bg-white border-2 border-dashed border-slate-100 rounded-lg opacity-30">
 <Users2 className="h-16 w-16 text-slate-200 mb-6" />
 <span className="text-[10px] font-semibold text-slate-400">ZERO_UNITS_DETECTED_IN_SECTOR</span>
 </div>
 )}
 </div>

 {/* Tactical Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Activity className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white">UNIT_STRATEGY_PROTOCOL_V3.2</h4>
 <p className="text-[9px] font-semibold text-slate-500 mt-1 leading-relaxed max-w-2xl">
 Sistem orkestrasi unit menjamin pembagian personil secara merata. <br/>
 STATUS: MONITORING_SECTOR_DEPLOYMENT
 </p>
 </div>
 </div>
 <div className="flex gap-4 opacity-50 text-slate-400">
 <Globe2 className="h-6 w-6" />
 <ShieldCheck className="h-6 w-6" />
 </div>
 </div>
 </div>
 </div>

 <ConfirmDialog
 open={!!deleting}
 onClose={() => setDeleting(null)}
 onConfirm={() => { if (deleting) deleteForm.delete(`/admin/groups/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
 title="TERMINATE_UNIT_DEPLOYMENT"
 message={`Apakah Anda yakin ingin menghapus sektor "${deleting?.name}"? Seluruh data mobilisasi personel akan dibatalkan.`}
 confirmLabel="CONFIRM_DELETE"
 processing={deleteForm.processing}
 />
 </AppLayout>
 );
}
