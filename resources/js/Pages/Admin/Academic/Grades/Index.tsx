import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, Button } from '@/Components/ui';
import { Save, Users, Activity, ShieldCheck, Target, Layers, Clock, AlertCircle, Zap, BookOpen, FileEdit, GraduationCap, Settings, Info, RefreshCw, Cpu, Database, Fingerprint, ChevronRight, ChevronDown, History } from 'lucide-react';
import { clsx } from 'clsx';
import type { DashboardMetricProps, GradeScoreField, GradeFormData } from '@/types';

interface Group { id: number; code: string; nama_kelompok: string; dpl?: { user?: { name: string }; }; }
interface StudentOption { id: number; name: string; email: string; username: string; nim?: string; }
interface Props { groups: Group[]; }

export default function AdminGradesIndex({ groups }: Props) {
 const form = useForm({
 kelompok_id: '', student_id: '',
 desa_interaksi_score: '', desa_disiplin_score: '', desa_kinerja_score: '',
 dpl_relevansi_score: '', dpl_ketercapaian_score: '', dpl_inovasi_score: '',
 dpl_administrasi_score: '', dpl_artikel_score: '',
 administration_score: '',
 });
 const { data, setData, post, processing, reset, errors, recentlySuccessful } = form;
 const [students, setStudents] = useState<StudentOption[]>([]);
 const [loadingStudents, setLoadingStudents] = useState(false);
 const fieldError = (field: string): string | undefined => (errors as Record<string, string | undefined>)[`scores.0.${field}`] ?? (errors as Record<string, string | undefined>)[field];

 useEffect(() => {
 const fetchStudents = async () => {
 if (!data.kelompok_id) { setStudents([]); setData('student_id', ''); return; }
 setLoadingStudents(true);
 try { const response = await axios.get(`/admin/kelompok/${data.kelompok_id}/mahasiswa`); setStudents(response.data); }
 catch { setStudents([]); }
 finally { setLoadingStudents(false); }
 };
 void fetchStudents();
 }, [data.kelompok_id]);

 const onSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const payload = {
 kelompok_id: data.kelompok_id,
 scores: [{ student_id: data.student_id, desa_interaksi_score: data.desa_interaksi_score, desa_disiplin_score: data.desa_disiplin_score, desa_kinerja_score: data.desa_kinerja_score, dpl_relevansi_score: data.dpl_relevansi_score, dpl_ketercapaian_score: data.dpl_ketercapaian_score, dpl_inovasi_score: data.dpl_inovasi_score, dpl_administrasi_score: data.dpl_administrasi_score, dpl_artikel_score: data.dpl_artikel_score, administration_score: data.administration_score }],
 };
 form.transform(() => payload);
 form.post(route('admin.nilai.store'), {
 onSuccess: () => { reset('desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score', 'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score', 'administration_score'); },
 });
 };

 return (
 <AppLayout title="Koreksi Nilai Manual">
 <Head title="Koreksi Nilai Manual - Panel Kontrol" />

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
 {/* --- MODERN HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Manajemen Akademik &middot; Koreksi Nilai</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-4">
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight pt-2">
 Koreksi <span>Nilai.</span>
 </h1>
 <p className="text-lg font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-2xl mt-4">
 Manajemen koreksi nilai manual untuk penyesuaian parameter akademik mahasiswa KKN UIN SAIZU secara transparan.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-6 shrink-0">
 <div className="px-8 py-5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-4 shadow-sm group">
 <ShieldCheck size={24} className="text-emerald-600 group-hover:rotate-12 transition-transform" strokeWidth={3} />
 <span className="text-sm font-bold text-black tracking-wider text-xs font-semibold">AKSES ADMINISTRATOR</span>
 </div>
 <button 
 onClick={onSubmit} 
 disabled={processing || !data.student_id} 
 className="h-10 px-6 bg-emerald-600 text-white hover:bg-emerald-600 rounded-xl font-bold transition-all shadow-sm flex items-center gap-6 active:scale-95 disabled:opacity-50 text-sm tracking-wider text-xs font-semibold border-none"
 >
 {processing ? <RefreshCw size={24} className="animate-spin" /> : <Save size={24} className="text-white" strokeWidth={3} />}
 {recentlySuccessful ? 'KOREKSI BERHASIL' : 'SIMPAN PERUBAHAN'}
 </button>
 </div>
 </div>
 </div>

 {/* --- STRATEGIC METRICS GRID --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 <MetricCard label="Status Identitas" value={data.student_id ? "TERDETEKSI" : "MENUNGGU"} icon={Fingerprint} color="emerald" desc="Verifikasi Mahasiswa" />
 <MetricCard label="Penyimpanan Data" value="NOMINAL" icon={Database} color="emerald" desc="Database Sinkron" />
 <MetricCard label="Versi Sistem" value="vGRAD_2026" icon={History} color="emerald" desc="Aturan Akademik" />
 <MetricCard label="Status Server" value="NOMINAL" icon={Activity} color="emerald" desc="Engine Performance" />
 </div>

 {/* --- CONFIGURATION FORM --- */}
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
 <div className="xl:col-span-8 space-y-10">
 <section className="bg-white border border-gray-200 rounded-[3.5rem] overflow-hidden shadow-sm">
 <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-white border border-gray-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:rotate-6">
 <FileEdit size={28} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-2xl font-bold text-black tracking-tight leading-none">Parameter Penilaian</h3>
 <p className="text-sm font-bold text-emerald-700/40 tracking-[0.25em] mt-2">Konfigurasi Skor Komponen Penilaian</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
 <span className="text-sm font-bold text-emerald-600 font-semibold text-xs border border-emerald-100 bg-emerald-50 px-3 py-1 rounded-lg">LIVE_SINKRON</span>
 </div>
 </div>

 <div className="p-12 space-y-12">
 {/* Entity Mapping */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <label className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold flex items-center gap-3">
 <Layers size={14} strokeWidth={3} className="text-emerald-500" /> Kelompok Mahasiswa
 </label>
 <div className="relative group">
 <FormSelect value={data.kelompok_id} onChange={(e) => setData('kelompok_id', e.target.value)} error={fieldError('kelompok_id')} className="h-16 w-full pl-6 pr-12 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer ">
 <option value="">PILIH KELOMPOK</option>
 {groups.map((g) => <option key={g.id} value={g.id}>{g.code || g.nama_kelompok}{g.dpl?.user?.name ? ` • DPL: ${g.dpl.user.name.toUpperCase()}` : ''}</option>)}
 </FormSelect>
 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-200 group-hover:text-emerald-500 transition-colors">
 <ChevronDown size={18} strokeWidth={3} />
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <label className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold flex items-center gap-3">
 <GraduationCap size={14} strokeWidth={3} className="text-emerald-500" /> Identitas Mahasiswa
 </label>
 <div className="relative group">
 <FormSelect value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} error={fieldError('student_id')} disabled={!data.kelompok_id || loadingStudents} className="h-16 w-full pl-6 pr-12 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-40 ">
 <option value="">{loadingStudents ? 'MENCARI DATA...' : 'PILIH MAHASISWA'}</option>
 {students.map((s) => <option key={s.id} value={s.id}>{s.nim ? `${s.nim} • ` : ''}{s.name.toUpperCase()}</option>)}
 </FormSelect>
 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-200 group-hover:text-emerald-500 transition-colors">
 <ChevronDown size={18} strokeWidth={3} />
 </div>
 </div>
 </div>
 </div>

 {/* Score Segments */}
 <div className="space-y-12">
 <CompactScoreSection title="PENILAIAN DESA (20%)" fields={[
 { id: 'desa_interaksi_score', label: 'INTERAKSI', icon: Users },
 { id: 'desa_disiplin_score', label: 'DISIPLIN', icon: Clock },
 { id: 'desa_kinerja_score', label: 'KINERJA', icon: Activity },
 ]} data={data} setData={setData} fieldError={fieldError} />

 <CompactScoreSection title="PENILAIAN DPL (40%)" fields={[
 { id: 'dpl_relevansi_score', label: 'RELEVANSI', icon: Target },
 { id: 'dpl_ketercapaian_score', label: 'CAPAIAN', icon: Zap },
 { id: 'dpl_inovasi_score', label: 'INOVASI', icon: Info },
 { id: 'dpl_administrasi_score', label: 'ADMIN', icon: FileEdit },
 { id: 'dpl_artikel_score', label: 'RISET', icon: BookOpen },
 ]} data={data} setData={setData} fieldError={fieldError} />

 <CompactScoreSection title="PUSAT (40%)" fields={[
 { id: 'administration_score', label: 'ADMIN PUSAT', icon: ShieldCheck },
 ]} data={data} setData={setData} fieldError={fieldError} />
 </div>
 </div>
 </section>
 </div>

 <div className="xl:col-span-4 space-y-10">
 <section className="bg-white border border-gray-200 rounded-xl p-10 space-y-10 shadow-sm">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm transition-transform hover:rotate-12">
 <Settings size={28} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-2xl font-bold text-black tracking-tight leading-none">Panduan Koreksi</h3>
 <p className="text-sm font-bold text-emerald-700/40 font-semibold text-xs mt-2">Aturan Koreksi Manual</p>
 </div>
 </div>
 <div className="space-y-6">
 {[
 { title: 'KOREKSI KHUSUS', desc: 'Gunakan hanya untuk kasus luar biasa yang tidak dapat dilakukan secara standar.' },
 { title: 'KALKULASI OTOMATIS', desc: 'Skor akhir akan diproses ulang oleh sistem setelah perubahan disimpan.' },
 { title: 'JEJAK AUDIT', desc: 'Setiap intervensi manual dicatat permanen dalam log keamanan administratif.' }
 ].map((item, i) => (
 <div key={i} className="flex gap-6 p-6 bg-gray-50/50 border border-gray-200 rounded-xl group hover:border-emerald-200 transition-all">
 <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 shrink-0 animate-pulse" />
 <div className="space-y-2">
 <p className="text-sm font-bold text-black leading-none">{item.title}</p>
 <p className="text-sm font-bold text-emerald-700/40 leading-relaxed ">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 <div className="bg-emerald-600 rounded-xl p-12 text-white relative overflow-hidden shadow-sm group">
 <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16 transition-transform group-hover:rotate-45 duration-1000">
 <Cpu size={300} strokeWidth={0.5} />
 </div>
 <div className="space-y-8 relative z-10">
 <div className="h-10 w-20 bg-emerald-600 text-black rounded-xl flex items-center justify-center border border-emerald-400/20 shadow-2xl transition-transform hover:scale-110">
 <ShieldCheck size={40} strokeWidth={2.5} />
 </div>
 <div className="space-y-4">
 <h4 className="text-3xl font-bold font-bold text-center leading-none">Aturan Keamanan.</h4>
 <p className="text-sm font-bold text-emerald-50/40 leading-relaxed opacity-80 group-hover:text-emerald-50/60 transition-colors">Sinkronisasi operasional aktif. Persistensi database diverifikasi di seluruh kluster sistem SIKKKN UIN SAIZU secara berkelanjutan.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, desc }: DashboardMetricProps & { color: string, desc: string }) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:border-emerald-200 transition-all group">
 <div className="flex items-center gap-4 mb-6">
 <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
 <Icon size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold">{label}</p>
 <p className="text-sm font-bold text-emerald-950 font-semibold text-xs">{desc}</p>
 </div>
 </div>
 <span className="text-3xl font-bold text-black tracking-tight">{value}</span>
 </div>
 );
}

function CompactScoreSection({ title, fields, data, setData, fieldError }: { title: string; fields: GradeScoreField[]; data: GradeFormData; setData: (field: string, value: string) => void; fieldError: (f: string) => string | undefined; }) {
 return (
 <div className="space-y-6">
 <div className="flex items-center gap-6">
 <span className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold shrink-0">{title}</span>
 <div className="h-px flex-1 bg-emerald-100/30" />
 </div>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-6">
 {fields.map((field) => (
 <div key={field.id} className="space-y-4 p-6 bg-white border border-gray-200 rounded-xl group/field hover:border-emerald-200 transition-all shadow-sm">
 <label className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold flex items-center gap-3 group-hover/field:text-emerald-500 transition-colors">
 <field.icon size={12} strokeWidth={3} /> {field.label}
 </label>
 <div className="relative">
 <input 
 type="number" 
 min="0" 
 max="100" 
 value={data[field.id as keyof typeof data]} 
 onChange={(e) => setData(field.id as keyof typeof data, e.target.value)} 
 className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-xl px-4 text-lg font-bold text-center text-black focus:border-emerald-500 outline-none transition-all tabular-nums placeholder:text-emerald-100" 
 placeholder="0" 
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-100 pointer-events-none transition-opacity group-focus-within/field:opacity-0 group-hover/field:text-emerald-300">%</span>
 </div>
 {fieldError(field.id) && <p className="text-sm font-bold text-rose-500 font-semibold text-xs leading-none mt-2">{fieldError(field.id)}</p>}
 </div>
 ))}
 </div>
 </div>
 );
}
