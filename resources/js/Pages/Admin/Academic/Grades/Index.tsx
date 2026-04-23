import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect } from '@/Components/ui';
import {
 Users,
 Activity,
 ShieldCheck,
 Target,
 Layers,
 Clock,
 FileEdit,
 Database,
 History,
 Zap,
 Info,
 BookOpen,
 UserCheck,
 Video,
 ClipboardCheck,
 Hourglass,
 Layout,
 Star,
 GraduationCap,
 Save,
 RotateCcw,
 CheckCircle2,
 AlertCircle
} from 'lucide-react';
import type { DashboardMetricProps, GradeScoreField, GradeFormData } from '@/types';

interface Group {
 id: number;
 code: string;
 nama_kelompok: string;
}
interface StudentOption {
 id: number;
 name: string;
 nim?: string;
}
interface Props {
 groups: Group[];
}

export default function AdminGradesIndex({ groups }: Props) {
 const form = useForm({
 kelompok_id: '',
 student_id: '',
 // DESA (20%)
 desa_interaksi_score: '',
 desa_disiplin_score: '',
 desa_kinerja_score: '',
 // DPL (40%)
 dpl_relevansi_score: '',
 dpl_ketercapaian_score: '',
 dpl_inovasi_score: '',
 dpl_administrasi_score: '',
 dpl_artikel_score: '',
 // PUSAT / LPPM (40%)
 administration_score: '', 
 });

 const { data, setData, post, processing, errors, recentlySuccessful } = form;
 const [students, setStudents] = useState<StudentOption[]>([]);
 const [loadingStudents, setLoadingStudents] = useState(false);

 // --- LIVE CALCULATION LOGIC ---
 const calculateResult = useMemo(() => {
 const parse = (v: any) => parseFloat(v) || 0;
 
 // Weights
 const W_DESA = 0.20;
 const W_DPL = 0.40;
 const W_PUSAT = 0.40;

 // Component Averages
 const desaTotal = (parse(data.desa_interaksi_score) + parse(data.desa_disiplin_score) + parse(data.desa_kinerja_score)) / 3;
 const dplTotal = (parse(data.dpl_relevansi_score) + parse(data.dpl_ketercapaian_score) + parse(data.dpl_inovasi_score) + parse(data.dpl_administrasi_score) + parse(data.dpl_artikel_score)) / 5;
 const pusatTotal = parse(data.administration_score);

 const finalScore = (desaTotal * W_DESA) + (dplTotal * W_DPL) + (pusatTotal * W_PUSAT);
 
 // Grading Scale (Agt 56)
 let grade = 'E';
 let color = 'text-emerald-800'; // Default, will be modified below
 if (finalScore >= 86) { grade = 'A'; color = 'text-emerald-800'; }
 else if (finalScore >= 81) { grade = 'A-'; color = 'text-[#0d9488]'; }
 else if (finalScore >= 76) { grade = 'B+'; color = 'text-[#0d9488]'; }
 else if (finalScore >= 71) { grade = 'B'; color = 'text-[#0d9488]'; }
 else if (finalScore >= 66) { grade = 'B-'; color = 'text-amber-600'; }
 else if (finalScore >= 61) { grade = 'C+'; color = 'text-amber-600'; }
 else if (finalScore >= 56) { grade = 'C'; color = 'text-amber-700'; }
 else if (finalScore >= 42) { grade = 'D'; color = 'text-rose-600'; }
 else if (finalScore > 0) { grade = 'E'; color = 'text-rose-700'; }

 // Progress counter
 const fields = [
 'desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score',
 'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score',
 'administration_score'
 ];
 const filledCount = fields.filter(f => parse(data[f as keyof typeof data]) > 0).length;

 return { 
 score: finalScore.toFixed(2), 
 grade, 
 color, 
 progress: Math.round((filledCount / 9) * 100),
 filledCount
 };
 }, [data]);

 const fieldError = (field: string): string | undefined =>
 (errors as Record<string, string | undefined>)[`scores.0.${field}`] ??
 (errors as Record<string, string | undefined>)[field];

 useEffect(() => {
 const fetchStudents = async () => {
 if (!data.kelompok_id) {
 setStudents([]);
 setData('student_id', '');
 return;
 }
 setLoadingStudents(true);
 try {
 const response = await axios.get(`/admin/kelompok/${data.kelompok_id}/mahasiswa`);
 setStudents(response.data);
 } catch {
 setStudents([]);
 } finally {
 setLoadingStudents(false);
 }
 };
 void fetchStudents();
 }, [data.kelompok_id]);

 const handleReset = () => {
 form.reset(
 'desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score',
 'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score',
 'administration_score'
 );
 };

 const onSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const payload = {
 kelompok_id: data.kelompok_id,
 scores: [{
 student_id: data.student_id,
 desa_interaksi_score: data.desa_interaksi_score,
 desa_disiplin_score: data.desa_disiplin_score,
 desa_kinerja_score: data.desa_kinerja_score,
 dpl_relevansi_score: data.dpl_relevansi_score,
 dpl_ketercapaian_score: data.dpl_ketercapaian_score,
 dpl_inovasi_score: data.dpl_inovasi_score,
 dpl_administrasi_score: data.dpl_administrasi_score,
 dpl_artikel_score: data.dpl_artikel_score,
 administration_score: data.administration_score, 
 }],
 };
 form.transform(() => payload);
 form.post(window.route('admin.nilai.store'));
 };

 return (
 <AppLayout title="Pusat Penilaian Akademik">
 <Head title="Koreksi Nilai - SIBERMAS"/>

 <div className="max-w-full mx-auto space-y-6 pb-24 font-sans px-6 lg:px-12 bg-white">
 {/* --- DYNAMIC ANALYTICS HEADER --- */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-10 border-b-2 border-emerald-50 pb-10 sticky top-0 z-40 bg-white/95 backdrop-blur-xl -mx-6 px-12">
 <div className="flex items-center gap-8">
 <div className="space-y-2">
 <h1 className="text-4xl font-black text-emerald-950 leading-none tracking-tighter uppercase font-display">
 Sinkronisasi <span className="text-emerald-600">Nilai.</span>
 </h1>
 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.25em] font-display">
 Panel Koreksi Komponen Penilaian
 </p>
 </div>
 
 {/* LIVE SCORE BADGE */}
 {data.student_id && (
 <div className="flex items-center gap-6 pl-10 border-l-2 border-emerald-50/50">
 <div className="text-center">
 <p className="text-[10px] font-black text-emerald-800 leading-none mb-2 uppercase tracking-widest font-display">Skor Keseluruhan</p>
 <p className="text-4xl font-black text-emerald-950 leading-none font-display tabular-nums">{calculateResult.score}</p>
 </div>
 <div className="h-16 w-16 bg-emerald-950 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 border-2 border-emerald-800">
 <span className={`text-2xl font-black text-white font-display`}>
 {calculateResult.grade}
 </span>
 </div>
 </div>
 )}
 </div>

 <div className="flex items-center gap-4">
 <div className="hidden xl:flex items-center gap-8 mr-4">
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs font-semibold text-emerald-950">
 <span>Status Pengisian</span>
 <span className="text-emerald-800">{calculateResult.filledCount} / 9</span>
 </div>
 <div className="w-32 h-2 bg-gray-50 rounded-full overflow-hidden border border-emerald-50">
 <div 
 className="h-full bg-[#0d9488] transition-all duration-500 ease-out"
 style={{ width: `${calculateResult.progress}%` }} 
 />
 </div>
 </div>
 <div className="h-10 w-[2px] bg-gray-50"/>
 <Metric label="SISTEM"value="TERHUBUNG"icon={Database} />
 </div>
 
 <div className="flex items-center gap-3">
 <button
 onClick={handleReset}
 className="h-14 w-14 border-2 border-emerald-50 text-emerald-800 bg-white rounded-2xl hover:bg-emerald-50 hover:text-emerald-950 transition-all active:scale-95 flex items-center justify-center shadow-sm"
 title="Kosongkan Form"
 >
 <RotateCcw size={20} strokeWidth={3} />
 </button>
 <button
 onClick={onSubmit}
 disabled={processing || !data.student_id}
 className="h-14 px-12 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-600/30 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 active:scale-95 flex items-center gap-4 font-display"
 >
 {processing ? (
 <Activity className="animate-spin"size={18} />
 ) : (
 <Save size={18} strokeWidth={2.5} />
 )}
 {processing ? 'MENYIMPAN...' : 'SIMPAN PERMANEN'}
 </button>
 </div>
 </div>
 </div>

 {/* --- CONTEXTUAL SELECTION --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 bg-slate-50/30 border border-emerald-50 rounded-3xl shadow-sm">
 <div className="space-y-5">
 <label className="text-[10px] font-black text-emerald-900 flex items-center gap-4 uppercase tracking-[0.2em] font-display">
 <span className="h-7 w-7 bg-white text-emerald-700 rounded-xl flex items-center justify-center text-xs border-2 border-emerald-50 shadow-sm">01</span>
 LOKASI & KELOMPOK
 </label>
 <FormSelect
 value={data.kelompok_id}
 onChange={(e) => setData('kelompok_id', e.target.value)}
 className="h-16 w-full px-6 bg-white border-2 border-emerald-50 rounded-2xl text-sm font-black text-emerald-950 focus:border-emerald-600 focus:ring-0 transition-all shadow-sm font-display"
 >
 <option value="">-- PILIH KELOMPOK KKN --</option>
 {groups.map((g) => (
 <option key={g.id} value={g.id}>
 [{g.code}] {g.nama_kelompok?.toUpperCase()}
 </option>
 ))}
 </FormSelect>
 </div>

 <div className="space-y-5">
 <label className="text-[10px] font-black text-emerald-900 flex items-center gap-4 uppercase tracking-[0.2em] font-display">
 <span className="h-7 w-7 bg-white text-emerald-700 rounded-xl flex items-center justify-center text-xs border-2 border-emerald-50 shadow-sm">02</span>
 IDENTITAS MAHASISWA
 </label>
 <FormSelect
 value={data.student_id}
 onChange={(e) => setData('student_id', e.target.value)}
 className="h-16 w-full px-6 bg-white border-2 border-emerald-50 rounded-2xl text-sm font-black text-emerald-950 focus:border-emerald-600 focus:ring-0 transition-all shadow-sm disabled:bg-slate-50/50 font-display"
 disabled={!data.kelompok_id || loadingStudents}
 >
 <option value="">
 {loadingStudents ? 'MENGAMBIL DATA...' : '-- PILIH MAHASISWA --'}
 </option>
 {students.map((s) => (
 <option key={s.id} value={s.id}>
 {s.nim} • {s.name.toUpperCase()}
 </option>
 ))}
 </FormSelect>
 </div>
 </div>

 {/* --- INTELLIGENT ASSESSMENT BLOCKS --- */}
 <div className="space-y-16 pt-8">
 {!data.student_id ? (
 <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
 <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center text-[#0d9488] shadow-sm border border-emerald-50">
 <UserCheck size={32} strokeWidth={2} />
 </div>
 <div className="space-y-2">
 <p className="text-xl font-semibold text-emerald-950 er">Mahasiswa Belum Dipilih</p>
 <p className="text-xs font-bold text-emerald-800">Pilih Mahasiswa peserta KKN untuk memulai input nilai</p>
 </div>
 </div>
 ) : (
 <>
 <SmartSection
 title="Pemerintah Desa"
 subtitle="Penilaian dari Perangkat Desa"
 weight="20"
 fields={[
 { id: 'desa_interaksi_score', label: 'Interaksi Sosial', icon: Users },
 { id: 'desa_disiplin_score', label: 'Kedisiplinan & Etika', icon: Clock },
 { id: 'desa_kinerja_score', label: 'Kinerja Kelompok', icon: Activity },
 ]}
 data={data}
 setData={setData}
 fieldError={fieldError}
 />

 <SmartSection
 title="Dosen Pembimbing"
 subtitle="Evaluasi dari Dosen Pembimbing Lapangan"
 weight="40"
 fields={[
 { id: 'dpl_relevansi_score', label: 'Relevansi Program', icon: Target },
 { id: 'dpl_ketercapaian_score', label: 'Tingkat Capaian', icon: Zap },
 { id: 'dpl_inovasi_score', label: 'Nilai Inovasi', icon: Info },
 { id: 'dpl_administrasi_score', label: 'Kelengkapan Administrasi', icon: FileEdit },
 { id: 'dpl_artikel_score', label: 'Kualitas Artikel', icon: BookOpen },
 ]}
 data={data}
 setData={setData}
 fieldError={fieldError}
 />

 <SmartSection
 title="LPPM Pusat"
 subtitle="Verifikasi Institusional LPPM"
 weight="40"
 fields={[
 { id: 'administration_score', label: 'Skor Administrasi Pusat', icon: Layers },
 ]}
 data={data}
 setData={setData}
 fieldError={fieldError}
 />
 </>
 )}
 </div>

 {/* --- ACCESSIBILITY FOOTER --- */}
 <div className="mt-20 pt-10 border-t-2 border-emerald-50 flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <ShieldCheck className="text-[#0d9488]"size={24} />
 <p className="text-xs font-semibold text-emerald-950">Protokol Kepatuhan Aktif • Sesuai Panduan Penilaian</p>
 </div>
 <p className="text-xs font-semibold text-emerald-800">Sistem Informasi <span className="text-sky-600">SIBER</span><span className="text-emerald-600">MAS</span></p>
 </div>
 </div>
 </AppLayout>
 );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
 return (
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 border-2 border-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 shadow-sm bg-white">
 <Icon size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-[10px] font-black text-emerald-800 leading-none mb-1.5 uppercase tracking-widest font-display">{label}</p>
 <p className="text-xs font-black text-emerald-950 leading-none uppercase font-display">{value}</p>
 </div>
 </div>
 );
}

function SmartSection({
 title,
 subtitle,
 weight,
 fields,
 data,
 setData,
 fieldError,
}: {
 title: string;
 subtitle: string;
 weight: string;
 fields: GradeScoreField[];
 data: GradeFormData;
 setData: (field: string, value: string) => void;
 fieldError: (f: string) => string | undefined;
}) {
 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-l-8 border-emerald-600 pl-6 py-4 bg-slate-50/50 rounded-r-3xl border border-y-emerald-50/50 border-r-emerald-50/50 shadow-sm">
 <div>
 <h2 className="text-2xl font-black text-emerald-950 leading-none mb-2 uppercase tracking-tighter font-display">
 {title}
 </h2>
 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-display">{subtitle}</p>
 </div>
 <div className="flex items-center gap-4 pr-6">
 <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-display">Bobot Total</span>
 <span className="px-6 py-3 bg-white border-2 border-emerald-100 text-emerald-950 text-base font-black rounded-2xl shadow-sm font-display">
 {weight}%
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {fields.map((field) => {
 const val = parseFloat(data[field.id as keyof typeof data] as string) || 0;
 const isFilled = val > 0;
 const isError = val > 100;

 return (
 <div 
 key={field.id} 
 className={`flex flex-col gap-4 p-5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
 isError ? 'border-rose-400 bg-rose-50 shadow-md' :
 isFilled ? 'border-[#0d9488] bg-white shadow-sm shadow-none/50' : 
 'border-emerald-50 bg-gray-50'
 }`}
 >
 {/* Top Accent line */}
 {isFilled && !isError && (
 <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-500"/>
 )}
 {isError && (
 <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"/>
 )}

 <div className="flex items-center justify-between z-10 pt-1">
 <label className={`text-xs font-semibold flex items-center gap-2 ${isFilled ? 'text-emerald-950' : 'text-emerald-800'}`}>
 <field.icon size={14} strokeWidth={isFilled ? 3 : 2} className={isFilled && !isError ? 'text-[#0d9488]' : ''} />
 {field.label}
 </label>
 {isFilled && !isError && <CheckCircle2 size={16} className="text-[#0d9488]"strokeWidth={3} />}
 {isError && <AlertCircle size={16} className="text-rose-600 animate-bounce"strokeWidth={3} />}
 </div>
 
 <div className="relative z-10 mt-1">
 <input
 type="number"
 min="0"
 max="100"
 value={String(data[field.id as keyof typeof data] ?? '')}
 onChange={(e) => setData(field.id as any, e.target.value)}
 className={`w-full h-16 bg-white border-2 border-b-[6px] rounded-2xl flex items-center justify-center font-black text-4xl text-center focus:outline-none transition-all tabular-nums shadow-sm font-display ${
 isError ? 'border-rose-200 border-b-rose-500 text-rose-700 bg-rose-50 focus:border-rose-400 focus:border-b-rose-600' :
 isFilled ? 'border-emerald-100 border-b-emerald-600 text-emerald-950 focus:border-emerald-400 focus:border-b-emerald-700' : 
 'border-slate-100 border-b-slate-200 text-emerald-950 focus:border-emerald-200 focus:border-b-emerald-500'
 }`}
 placeholder="0"
 />
 </div>

 {fieldError(field.id) || isError ? (
 <p className="text-xs font-semibold text-rose-600 text-center mt-1 z-10">
 {isError ? 'MAKSIMAL 100 POIN' : fieldError(field.id)}
 </p>
 ) : (
 <p className={`text-xs font-semibold text-center mt-1 z-10 ${isFilled ? 'text-emerald-800' : 'text-emerald-800'}`}>
 MASUKKAN SKOR
 </p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
}
