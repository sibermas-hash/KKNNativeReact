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
    FileEdit,
    AlertCircle
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
    const fieldError = (field: string): string | undefined => (errors as Record<string, string | undefined>)[`scores.0.${field}`] ?? (errors as Record<string, string | undefined>)[field];

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
        <AppLayout title="Otoritas Koreksi Nilai Manual">
            <Head title="Koreksi Nilai Manual | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS KOREKSI PUSAT */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300 italic">Manual Override Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            KOREKSI <span className="text-rose-500">NILAI MANUAL</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <ShieldAlert size={12} className="text-rose-500" />
                             Otoritas overriding parameter penilaian untuk anomali data lapangan.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-rose-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.3em] italic mb-1">ACCESS STATUS</span>
                               <div className="flex items-center gap-3">
                                   <Key size={16} className="text-rose-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">RESTRICTED AUTHORITY</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* OVERRIDE FORM TACTICAL */}
                    <div className="lg:col-span-8 space-y-12">
                        <motion.section 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative"
                        >
                            <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                            <div className="px-10 py-8 border-b border-emerald-50 flex items-center gap-6 bg-emerald-50/10 relative z-10">
                                <div className="p-4 bg-emerald-950 text-emerald-400 shadow-xl">
                                    <Edit2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-950 italic">Instrument Penyesuaian Nilai</h2>
                                    <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Gunakan Hanya Untuk Kasus Luar Biasa (Overriding Standard Protocol)</p>
                                </div>
                            </div>
                            
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const payload = {
                                        kelompok_id: data.kelompok_id,
                                        scores: [
                                            {
                                                student_id: data.student_id,
                                                execution_score: data.execution_score,
                                                article_score: data.article_score,
                                                discipline_score: data.discipline_score,
                                                attitude_score: data.attitude_score,
                                            },
                                        ],
                                    };
                                    form.transform(() => payload);
                                    form.post('/admin/nilai', {
                                        onSuccess: () => {
                                            reset('execution_score', 'article_score', 'discipline_score', 'attitude_score');
                                            form.transform((p) => p);
                                        },
                                    });
                                }}
                                className="p-12 space-y-12 relative z-10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-3">
                                            <Layers size={14} className="text-emerald-500" />
                                            Kelompok Target
                                        </label>
                                        <FormSelect
                                            value={data.kelompok_id}
                                            onChange={(event) => setData('kelompok_id', event.target.value)}
                                            error={fieldError('kelompok_id')}
                                            className="h-16 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black italic tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none uppercase"
                                        >
                                            <option value="">PILIH UNIT KELOMPOK</option>
                                            {groups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.code || group.nama_kelompok}
                                                    {group.dpl?.user?.name ? ` - DPL: ${group.dpl.user.name}` : ''}
                                                </option>
                                            ))}
                                        </FormSelect>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-3">
                                            <GraduationCap size={14} className="text-emerald-500" />
                                            Entitas Mahasiswa
                                        </label>
                                        <FormSelect
                                            value={data.student_id}
                                            onChange={(event) => setData('student_id', event.target.value)}
                                            error={fieldError('student_id')}
                                            disabled={!data.kelompok_id || loadingStudents}
                                            className="h-16 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black italic tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none uppercase disabled:opacity-30"
                                        >
                                            <option value="">{loadingStudents ? 'MENARIK DATA REGISTRY...' : 'PILIH ENTITAS MAHASISWA'}</option>
                                            {students.map((student) => (
                                                <option key={student.id} value={student.id}>
                                                    {student.nim ? `${student.nim} - ` : ''}
                                                    {student.name}
                                                </option>
                                            ))}
                                        </FormSelect>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-emerald-50/30 p-10 border border-emerald-50">
                                    {[
                                        { id: 'execution_score', label: 'Pelaksanaan', icon: Settings },
                                        { id: 'article_score', label: 'Artikel/Output', icon: BookOpen },
                                        { id: 'discipline_score', label: 'Kedisiplinan', icon: Clock },
                                        { id: 'attitude_score', label: 'Sikap/Moral', icon: ShieldCheck }
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-3">
                                            <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest italic ml-1 flex items-center gap-2">
                                                <field.icon size={12} />
                                                {field.label}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data[field.id as keyof typeof data]}
                                                onChange={(event) => setData(field.id as keyof typeof data, event.target.value)}
                                                className="w-full h-14 bg-white border border-emerald-100 px-5 text-[14px] font-black text-emerald-950 italic tracking-tighter tabular-nums outline-none focus:border-emerald-500 transition-all text-center"
                                                placeholder="0.00"
                                            />
                                            {fieldError(field.id) && <p className="text-[8px] font-black text-rose-600 uppercase italic tracking-widest mt-1">{fieldError(field.id)}</p>}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col xl:flex-row items-center justify-between gap-12 pt-12 border-t border-emerald-50">
                                    <div className="flex items-center gap-6 p-6 bg-emerald-50/50 border border-emerald-50 border-dashed max-w-lg">
                                        <AlertCircle size={24} className="text-rose-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest italic leading-relaxed">
                                            Penyimpanan nilai manual akan memicu sinkronisasi ulang grade akhir mahasiswa pada pangkalan data utama secara real-time.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-20 px-12 bg-emerald-950 text-white font-black text-[12px] uppercase tracking-[0.4em] italic hover:bg-rose-600 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.3)] active:scale-95 disabled:opacity-30 border-none flex items-center justify-center gap-8 min-w-[320px]"
                                    >
                                        <Save className="w-6 h-6" />
                                        {processing ? 'WRITE_LOCKED: PROSES...' : 'EKSEKUSI PENYIMPANAN NILAI'}
                                    </button>
                                </div>
                            </form>
                        </motion.section>
                    </div>

                    {/* PROTOCOLS & STATUS TACTICAL */}
                    <div className="lg:col-span-4 space-y-12">
                        <motion.section 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-950 p-12 text-white shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                                    <div className="p-3 bg-rose-500 text-white shadow-xl">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] italic">Standard Protocol Review</h3>
                                </div>
                                <ul className="space-y-8">
                                    {[
                                        { title: 'KOREKSI KHUSUS', desc: 'Validasi manual hanya diperkenankan untuk koreksi anomali yang tidak terakomodir sistem standar.', icon: Target },
                                        { title: 'SINKRONISASI OTOMATIS', desc: 'Nilai akhir akan dikalkulasi ulang oleh kernel sistem segera setelah penyimpanan dikonfirmasi.', icon: Zap },
                                        { title: 'AUDIT INTEGRITY', desc: 'Setiap entri nilai dipantau dan direkam secara permanen dalam pangkalan data audit log.', icon: ShieldCheck }
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-6 group/item">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse group-hover/item:scale-150 transition-transform" />
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={12} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{item.title}</span>
                                                </div>
                                                <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest leading-relaxed italic opacity-50">{item.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.section>

                        <div className="bg-white border border-emerald-100 p-10 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
                            <div className="flex items-center gap-4 text-emerald-950 font-black text-[10px] uppercase tracking-[0.4em] italic leading-none mb-10">
                                <Binary className="h-5 w-5 text-emerald-500" />
                                SYSTEM STATE MONITOR
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between py-4 border-b border-emerald-50 group-hover:border-emerald-100 transition-colors">
                                    <span className="text-[10px] font-black text-emerald-200 uppercase italic tracking-widest">ENCRYPTION_MODE</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest">AES-256_ACTIVE</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-4 border-b border-emerald-50 group-hover:border-emerald-100 transition-colors">
                                    <span className="text-[10px] font-black text-emerald-200 uppercase italic tracking-widest">NETWORK_LATENCY</span>
                                    <span className="text-[10px] font-black text-emerald-950 tabular-nums italic tracking-tighter">0.14 MS</span>
                                </div>
                                <div className="flex items-center justify-between py-4 group-hover:border-emerald-100 transition-colors">
                                    <span className="text-[10px] font-black text-emerald-200 uppercase italic tracking-widest">TRANSACTION_QUEUE</span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase italic tracking-widest flex items-center gap-3">
                                        <Activity size={10} className="animate-pulse" />
                                        PENDING_COMMAND
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-6 opacity-30 hover:opacity-100 transition-opacity duration-1000">
                             <div className="flex items-center gap-4">
                                <Fingerprint size={20} className="text-emerald-300" />
                                <div className="h-px w-24 bg-emerald-50" />
                                <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.5em] uppercase italic px-4 uppercase">KOREKSI_NILAI</div>
                                <div className="h-px w-24 bg-emerald-50" />
                                <Database size={20} className="text-emerald-300" />
                             </div>
                             <p className="text-[8px] font-black text-emerald-950 uppercase tracking-[1em] italic text-center ml-2">
                                 SISTEM NILAI TERPUSAT • POS-KKN {new Date().getFullYear()}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Edit2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
