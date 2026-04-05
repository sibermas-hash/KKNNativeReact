import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';
import { 
    Terminal, 
    ShieldAlert, 
    User, 
    Users, 
    Activity, 
    Save, 
    Binary, 
    Cpu, 
    Fingerprint, 
    ShieldCheck, 
    Zap, 
    BookOpen, 
    GraduationCap, 
    Target,
    Layers,
    Database,
    Clock,
    AlertTriangle,
    Key,
    IdCard,
    Command,
    Settings,
    FileEdit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface Group {
    id: number;
    code: string;
    nama_kelompok: string;
    dpl?: {
        user?: {
            name: string;
        };
    };
}

interface StudentOption {
    id: number;
    name: string;
    email: string;
    username: string;
    nim?: string;
}

interface Props {
    groups: Group[];
}

export default function AdminGradesIndex({ groups }: Props) {
    const form = useForm({
        kelompok_id: '',
        student_id: '',
        execution_score: '',
        article_score: '',
        discipline_score: '',
        attitude_score: '',
    });
    const { data, setData, post, processing, reset, errors } = form;

    const [students, setStudents] = useState<StudentOption[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const fieldError = (field: string) => errors[`scores.0.${field}`] ?? errors[field];

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
    }, [data.kelompok_id, setData]);

    return (
        <AppLayout title="Manual Override Terminal">
            <Head title="Input Nilai Manual" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em] italic leading-none">VALUATION_OVERRIDE_TERMINAL_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Terminal className="w-10 h-10 text-rose-600" />
                            INPUT <span className="text-rose-600">NILAI_MANUAL</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Terminal koreksi kedaulatan data nilai. Hanya digunakan untuk intervensi otoritas administrator tinggi.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 shadow-sm animate-pulse">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic">RESTRICTED_ACCESS_ENABLED</span>
                        </div>
                    </div>
                </div>

                {/* Operations Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                    {/* Main Entry Form */}
                    <div className="xl:col-span-2">
                         <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.transform((formData) => ({
                                        kelompok_id: formData.kelompok_id,
                                        scores: [
                                            {
                                                student_id: formData.student_id,
                                                execution_score: formData.execution_score,
                                                article_score: formData.article_score,
                                                discipline_score: formData.discipline_score,
                                                attitude_score: formData.attitude_score,
                                            },
                                        ],
                                    }))
                                    .post('/admin/nilai', {
                                    onSuccess: () => {
                                        reset('execution_score', 'article_score', 'discipline_score', 'attitude_score');
                                        form.transform((payload) => payload);
                                    },
                                });
                            }}
                            className="bg-white rounded-[3.5rem] border border-slate-200 p-12 shadow-sm space-y-10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Cpu className="w-48 h-48 text-slate-950" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <Layers className="w-3 h-3 text-rose-500" />
                                        DEPLOYMENT_GROUP
                                    </span>
                                    <FormSelect
                                        value={data.kelompok_id}
                                        onChange={(event) => setData('kelompok_id', event.target.value)}
                                        error={fieldError('kelompok_id')}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all appearance-none uppercase"
                                    >
                                        <option value="">SELECT_KELOMPOK</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.code || group.nama_kelompok}
                                                {group.dpl?.user?.name ? ` - DPL: ${group.dpl.user.name}` : ''}
                                            </option>
                                        ))}
                                    </FormSelect>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <GraduationCap className="w-3 h-3 text-rose-500" />
                                        STUDENT_PERSONNEL
                                    </span>
                                    <FormSelect
                                        value={data.student_id}
                                        onChange={(event) => setData('student_id', event.target.value)}
                                        error={fieldError('student_id')}
                                        disabled={!data.kelompok_id || loadingStudents}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all appearance-none uppercase disabled:opacity-30"
                                    >
                                        <option value="">{loadingStudents ? 'SYNCING_BUFFER...' : 'SELECT_PERSONNEL'}</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.nim ? `${student.nim} - ` : ''}
                                                {student.name}
                                            </option>
                                        ))}
                                    </FormSelect>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <Settings className="w-3 h-3 text-rose-500" />
                                        EXECUTION_SCORE
                                    </span>
                                    <FormInput
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.execution_score}
                                        onChange={(event) => setData('execution_score', event.target.value)}
                                        error={fieldError('execution_score')}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all tabular-nums uppercase"
                                        placeholder="00.00"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <BookOpen className="w-3 h-3 text-rose-500" />
                                        ARTICLE_SCORE
                                    </span>
                                    <FormInput
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.article_score}
                                        onChange={(event) => setData('article_score', event.target.value)}
                                        error={fieldError('article_score')}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all tabular-nums uppercase"
                                        placeholder="00.00"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <Clock className="w-3 h-3 text-rose-500" />
                                        DISCIPLINE_SCORE
                                    </span>
                                    <FormInput
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.discipline_score}
                                        onChange={(event) => setData('discipline_score', event.target.value)}
                                        error={fieldError('discipline_score')}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all tabular-nums uppercase"
                                        placeholder="00.00"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                        <Activity className="w-3 h-3 text-rose-500" />
                                        ATTITUDE_SCORE
                                    </span>
                                    <FormInput
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.attitude_score}
                                        onChange={(event) => setData('attitude_score', event.target.value)}
                                        error={fieldError('attitude_score')}
                                        className="h-16 w-full bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-rose-500/5 transition-all tabular-nums uppercase"
                                        placeholder="00.00"
                                    />
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col items-center justify-between gap-8 border-t border-slate-100">
                                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    AUTO_CALCULATION_ENGINE_V4_STANDBY
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center gap-6 group hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30 disabled:grayscale"
                                >
                                    <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col items-start leading-none text-left">
                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5 leading-none">Execute Override</span>
                                        <span className="text-sm font-black italic tracking-tighter leading-none">COMMIT_VALUATION_PATCH</span>
                                    </div>
                                </button>
                            </div>
                        </motion.form>
                    </div>

                    {/* Operational Protocols */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10">
                                <AlertTriangle className="w-24 h-24 text-rose-500" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/20">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">PROTOCOL_OVERRIDE</h3>
                                </div>
                                <ul className="space-y-6">
                                    {[
                                        { title: 'CRITICAL_INTERVENTION', desc: 'Gunakan terminal ini hanya jika koreksi tidak dapat dilakukan melalui protokol penilaian standar DPL.' },
                                        { title: 'AUTO_REFRESH_MATRIX', desc: 'Indikator grade akan dikalkulasikan ulang secara otomatis oleh sistem setelah commit data berhasil.' },
                                        { title: 'PERSONNEL_VALIDATION', desc: 'Pastikan target unit dan identitas personalia terverifikasi sebelum mengeksekusi patch nilai.' }
                                    ].map((proto, i) => (
                                        <li key={i} className="flex gap-4">
                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic block leading-none">{proto.title}</span>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight italic leading-relaxed">{proto.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="p-10 bg-white border border-slate-200 rounded-[3.5rem] shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-6 mb-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] italic leading-none">
                                <Binary className="h-4 w-4 text-emerald-500" />
                                SYSTEM_STATUS_FEED
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">ENCRYPTION</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">ACTIVE_SHA256</span>
                                </div>
                                <div className="flex items-center justify-between py-4 border-b border-slate-50 font-black">
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">LATENCY</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest tabular-nums italic">0.24 MS</span>
                                </div>
                                <div className="flex items-center justify-between py-4 px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">BUFFER</span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase italic tracking-widest">WAITING_FOR_PATCH...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tactical Footer Monitor */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                         <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase leading-none">Security_Override_Module_V4</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Terminal koreksi nilai merupakan subsistem kedaulatan data tinggi. Transaksi yang dilakukan melalui terminal ini akan mencatat log auditor secara permanen untuk menjamin akuntabilitas data akademik KKN UIN SAIZU.
                                    </p>
                                </div>
                            </div>
                        </div>
                         
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity whitespace-nowrap">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             VALUATION_AUDIT • {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
