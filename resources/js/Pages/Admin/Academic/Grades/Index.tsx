import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';
import { Save, Users, Activity, ShieldCheck, Target, Layers, Clock, AlertCircle, Zap, BookOpen, FileEdit, GraduationCap, Settings, Info } from 'lucide-react';
import { clsx } from 'clsx';

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
    const { data, setData, post, processing, reset, errors } = form;
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
    }, [data.kelompok_id, setData]);

    return (
        <AppLayout title="Koreksi Nilai Manual">
            <Head title="Koreksi Nilai Manual | POS-KKN" />

            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-8 py-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 bg-amber-500 rounded-full" />
                                <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Akses Terbatas</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                Koreksi <span className="text-amber-600">Nilai Manual</span>
                            </h1>
                            <p className="text-slate-500 max-w-2xl text-lg font-medium">
                                Penyesuaian nilai untuk kasus khusus yang tidak terakomodasi sistem standar.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <FileEdit size={22} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Formulir Koreksi Nilai</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Gunakan hanya untuk kasus luar biasa</p>
                                </div>
                            </div>

                            <form onSubmit={(event) => {
                                event.preventDefault();
                                const payload = {
                                    kelompok_id: data.kelompok_id,
                                    scores: [{ student_id: data.student_id, desa_interaksi_score: data.desa_interaksi_score, desa_disiplin_score: data.desa_disiplin_score, desa_kinerja_score: data.desa_kinerja_score, dpl_relevansi_score: data.dpl_relevansi_score, dpl_ketercapaian_score: data.dpl_ketercapaian_score, dpl_inovasi_score: data.dpl_inovasi_score, dpl_administrasi_score: data.dpl_administrasi_score, dpl_artikel_score: data.dpl_artikel_score, administration_score: data.administration_score }],
                                };
                                form.transform(() => payload);
                                form.post(route('admin.nilai.store'), {
                                    onSuccess: () => { reset('desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score', 'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score', 'administration_score'); form.transform((p) => p); },
                                });
                            }} className="p-8 space-y-8">
                                {/* Target Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                            <Layers size={14} className="text-emerald-500" /> Kelompok
                                        </label>
                                        <FormSelect value={data.kelompok_id} onChange={(e) => setData('kelompok_id', e.target.value)} error={fieldError('kelompok_id')} className="h-14 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all appearance-none">
                                            <option value="">Pilih Kelompok</option>
                                            {groups.map((g) => <option key={g.id} value={g.id}>{g.code || g.nama_kelompok}{g.dpl?.user?.name ? ` - DPL: ${g.dpl.user.name}` : ''}</option>)}
                                        </FormSelect>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                            <GraduationCap size={14} className="text-emerald-500" /> Mahasiswa
                                        </label>
                                        <FormSelect value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} error={fieldError('student_id')} disabled={!data.kelompok_id || loadingStudents} className="h-14 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all appearance-none disabled:opacity-40">
                                            <option value="">{loadingStudents ? 'Memuat data...' : 'Pilih Mahasiswa'}</option>
                                            {students.map((s) => <option key={s.id} value={s.id}>{s.nim ? `${s.nim} - ` : ''}{s.name}</option>)}
                                        </FormSelect>
                                    </div>
                                </div>

                                {/* Desa Aspects */}
                                <ScoreSection title="Penilaian Pemerintah Desa (Bobot 20%)" fields={[
                                    { id: 'desa_interaksi_score', label: 'Interaksi (30%)', icon: Users },
                                    { id: 'desa_disiplin_score', label: 'Disiplin (40%)', icon: Clock },
                                    { id: 'desa_kinerja_score', label: 'Kinerja (30%)', icon: Activity },
                                ]} data={data} setData={setData} fieldError={fieldError} cols={3} />

                                {/* DPL Aspects */}
                                <ScoreSection title="Penilaian DPL (Bobot 40%)" fields={[
                                    { id: 'dpl_relevansi_score', label: 'Relevansi', icon: Target },
                                    { id: 'dpl_ketercapaian_score', label: 'Capaian', icon: Zap },
                                    { id: 'dpl_inovasi_score', label: 'Inovasi', icon: Info },
                                    { id: 'dpl_administrasi_score', label: 'Admin', icon: FileEdit },
                                    { id: 'dpl_artikel_score', label: 'Artikel', icon: BookOpen },
                                ]} data={data} setData={setData} fieldError={fieldError} cols={5} />

                                {/* LPPM Aspects */}
                                <ScoreSection title="Penilaian LPPM / Admin (Bobot 40%)" fields={[
                                    { id: 'administration_score', label: 'Administrasi (100%)', icon: ShieldCheck },
                                ]} data={data} setData={setData} fieldError={fieldError} cols={1} />

                                {/* Submit */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                                    <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-5 border border-amber-100 max-w-lg">
                                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800/70 leading-relaxed">
                                            Penyimpanan nilai manual akan memicu sinkronisasi ulang grade akhir secara otomatis.
                                        </p>
                                    </div>
                                    <button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-3 active:scale-95 disabled:opacity-50 shrink-0">
                                        <Save size={18} />
                                        {processing ? 'Menyimpan...' : 'Simpan Nilai'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-amber-50 rounded-3xl border border-amber-100 p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
                                    <AlertCircle size={20} />
                                </div>
                                <h3 className="text-sm font-bold text-amber-900">Panduan Koreksi</h3>
                            </div>
                            <ul className="space-y-5">
                                {[
                                    { title: 'Koreksi Khusus', desc: 'Validasi manual hanya diperkenankan untuk koreksi anomali yang tidak terakomodasi sistem standar.' },
                                    { title: 'Sinkronisasi Otomatis', desc: 'Nilai akhir akan dikalkulasi ulang secara otomatis setelah penyimpanan dikonfirmasi.' },
                                    { title: 'Tercatat Permanen', desc: 'Setiap perubahan nilai dipantau dan direkam dalam log aktivitas sistem.' },
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-900">{item.title}</p>
                                            <p className="text-sm text-amber-800/60 leading-relaxed mt-0.5">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ScoreSection({ title, fields, data, setData, fieldError, cols }: { title: string; fields: { id: string; label: string; icon: React.ElementType }[]; data: any; setData: any; fieldError: (f: string) => string | undefined; cols: number }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{title}</span>
                <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-${cols > 3 ? cols : cols} gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100`}>
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                            <field.icon size={12} className="text-emerald-500" /> {field.label}
                        </label>
                        <input type="number" min="0" max="100" value={data[field.id as keyof typeof data]} onChange={(e) => setData(field.id as keyof typeof data, e.target.value)} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-base font-bold text-slate-900 tabular-nums outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all text-center" placeholder="0" />
                        {fieldError(field.id) && <p className="text-xs text-rose-600 mt-1">{fieldError(field.id)}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
