import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, Button } from '@/Components/ui';
import { Save, Users, Activity, ShieldCheck, Target, Layers, Clock, AlertCircle, Zap, BookOpen, FileEdit, GraduationCap, Settings, Info, RefreshCw, Cpu, Database, Fingerprint, ChevronRight } from 'lucide-react';
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
        <AppLayout title="Grade Authority">
            <Head title="Manual Grade Intervention | SIKKKN" />

            <div className="space-y-4 font-sans text-slate-900">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-base font-black tracking-tight uppercase italic leading-none">Manual Grade Intervention</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Surgical Correction Node / Exceptional Access</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-10 px-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3">
                            <AlertCircle size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 italic leading-none">Access Restricted</span>
                         </div>
                          <Button onClick={onSubmit} disabled={processing || !data.student_id} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 group transition-all">
                             {processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={16} className="text-white" />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{recentlySuccessful ? 'INTERVENTION_SECURED' : 'COMMIT_OVERRIDE'}</span>
                          </Button>
                    </div>
                </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <OverrideMetric label="Authority" value={data.student_id ? "IDENTIFIED" : "WAITING"} icon={Fingerprint} />
                    <OverrideMetric label="IOPS Status" value="LATENCY_LOW" icon={Activity} />
                    <OverrideMetric label="Storage" value="DB_LOCAL" icon={Database} />
                    <OverrideMetric label="Security" value="SIGNED_OFF" icon={ShieldCheck} />
                </div>

                {/* --- CONFIGURATION FORM --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-8 space-y-6">
                          <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                             <div className="p-3 bg-emerald-600 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <FileEdit size={14} className="text-white" />
                                     <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Intervention Parameters</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                      <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest italic">Live_Sync_Active</span>
                                  </div>
                             </div>

                            <div className="p-6 space-y-8">
                                {/* Entity Mapping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                            <Layers size={12} className="text-emerald-500" /> Component_Group
                                        </label>
                                        <FormSelect value={data.kelompok_id} onChange={(e) => setData('kelompok_id', e.target.value)} error={fieldError('kelompok_id')} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-lg text-xs font-black uppercase italic outline-none focus:bg-white transition-all appearance-none cursor-pointer">
                                            <option value="">SELECT_GROUP_NODE</option>
                                            {groups.map((g) => <option key={g.id} value={g.id}>{g.code || g.nama_kelompok}{g.dpl?.user?.name ? ` • DPL: ${g.dpl.user.name.toUpperCase()}` : ''}</option>)}
                                        </FormSelect>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                            <GraduationCap size={12} className="text-emerald-500" /> Identifier_Entity
                                        </label>
                                        <FormSelect value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} error={fieldError('student_id')} disabled={!data.kelompok_id || loadingStudents} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-lg text-xs font-black uppercase italic outline-none focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-40">
                                            <option value="">{loadingStudents ? 'SCANNING_DATA...' : 'SELECT_STUDENT_NODE'}</option>
                                            {students.map((s) => <option key={s.id} value={s.id}>{s.nim ? `${s.nim} • ` : ''}{s.name.toUpperCase()}</option>)}
                                        </FormSelect>
                                    </div>
                                </div>

                                {/* Score Segments */}
                                <div className="space-y-6">
                                     <CompactScoreSection title="VILLAGE_AUTHORITY (20%)" fields={[
                                        { id: 'desa_interaksi_score', label: 'INTERACTION', icon: Users },
                                        { id: 'desa_disiplin_score', label: 'DISCIPLINE', icon: Clock },
                                        { id: 'desa_kinerja_score', label: 'PERFORMANCE', icon: Activity },
                                    ]} data={data} setData={setData} fieldError={fieldError} />

                                    <CompactScoreSection title="OVERSEER_AUTHORITY (40%)" fields={[
                                        { id: 'dpl_relevansi_score', label: 'RELEVANCE', icon: Target },
                                        { id: 'dpl_ketercapaian_score', label: 'ACHIEVEMENT', icon: Zap },
                                        { id: 'dpl_inovasi_score', label: 'INNOVATION', icon: Info },
                                        { id: 'dpl_administrasi_score', label: 'ADMIN_OP', icon: FileEdit },
                                        { id: 'dpl_artikel_score', label: 'RESEARCH', icon: BookOpen },
                                    ]} data={data} setData={setData} fieldError={fieldError} />

                                    <CompactScoreSection title="CENTRAL_AUTHORITY (40%)" fields={[
                                        { id: 'administration_score', label: 'ADMIN_RECORDS (100%)', icon: ShieldCheck },
                                    ]} data={data} setData={setData} fieldError={fieldError} />
                                </div>
                            </div>
                         </section>
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                        <section className="bg-white border border-slate-100 rounded-xl p-6 space-y-6 shadow-sm">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 shadow-sm"><Settings size={16} /></div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Protocol Governance</span>
                             </div>
                             <div className="space-y-4">
                                {[
                                    { title: 'SURGICAL_OVERRIDE', desc: 'Sistem ini digunakan hanya untuk kasus khusus yang tidak terakomodasi evaluasi standar.' },
                                    { title: 'NOMINAL_CALCULATION', desc: 'Skor akhir akan diproses ulang oleh kernel kalkulasi SIKKKN setelah commit berhasil.' },
                                    { title: 'AUDIT_TRAIL_ACTIVE', desc: 'Setiap intervensi manual dicatat permanen dalam log keamanan administratif.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-amber-200 transition-all">
                                         <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1 shrink-0" />
                                         <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-700 uppercase italic leading-none">{item.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed opacity-80">{item.desc}</p>
                                         </div>
                                    </div>
                                ))}
                             </div>
                        </section>

                        <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Cpu size={120} /></div>
                            <div className="space-y-4 relative z-10">
                                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md text-white"><ShieldCheck size={24} /></div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight italic text-white">Kernel Security v4.20</h4>
                                    <p className="text-[9px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed italic opacity-80">Operational synchronization is active. Database persistence verified across all cluster endpoints.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function OverrideMetric({ label, value, icon: Icon }: DashboardMetricProps) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}

function CompactScoreSection({ title, fields, data, setData, fieldError }: { title: string; fields: GradeScoreField[]; data: GradeFormData; setData: (field: string, value: string) => void; fieldError: (f: string) => string | undefined; }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic shrink-0">{title}</span>
                 <div className="h-px flex-1 bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-xl group/field hover:border-emerald-200 transition-all">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2 group-hover/field:text-emerald-500 transition-colors">
                            <field.icon size={10} /> {field.label}
                        </label>
                        <div className="relative">
                            <input type="number" min="0" max="100" value={data[field.id as keyof typeof data]} onChange={(e) => setData(field.id as keyof typeof data, e.target.value)} className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-sm font-black italic text-center text-slate-900 focus:border-emerald-500 outline-none transition-all tabular-nums" placeholder="0" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-100 pointer-events-none group-focus-within/field:opacity-0">%</span>
                        </div>
                        {fieldError(field.id) && <p className="text-[7px] font-bold text-rose-500 uppercase tracking-widest truncate">{fieldError(field.id)}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
