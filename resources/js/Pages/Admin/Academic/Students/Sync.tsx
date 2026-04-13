import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import type { LucideIcon } from '@/types';
import {
    RefreshCw,
    Users,
    Database,
    Link2,
    Clock3,
    Info,
    ListFilter,
    ArrowRight,
    Zap,
    CheckCircle2,
    Search,
    ChevronRight,
    Loader2,
    FileJson,
    UserCheck,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props extends PageProps {
    title: string;
    summary: {
        local_students: number;
        with_master_link: number;
        last_synced_at: string | null;
    };
}

function formatSyncTime(value: string | null): string {
    if (!value) return 'BELUM PERNAH';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export default function StudentSync({ title, summary }: Props) {
    const bulkForm = useForm({});
    const targetedForm = useForm({ nim_list: '' });

    function submitBulk() {
        bulkForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
    }

    function submitTargeted(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        targetedForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title="Sinkronisasi Data Mahasiswa" />

            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* --- HEADER --- */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Integrasi Data Akademik</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <h1 className="text-4xl font-extrabold text-black tracking-tight">
                            Sinkronisasi Mahasiswa
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="px-5 py-2.5 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-4 text-white shadow-xl shadow-emerald-100">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Sinkronisasi Terakhir</span>
                                    <span className="text-xs font-bold mt-1 text-emerald-400 uppercase">{formatSyncTime(summary.last_synced_at)}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-800" />
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        label="Data Lokal" 
                        value={summary.local_students.toLocaleString('id-ID')} 
                        icon={Users} 
                        color="emerald" 
                        desc="Jumlah mahasiswa di sistem KKN" 
                    />
                    <StatCard 
                        label="Terhubung SIAKAD" 
                        value={summary.with_master_link.toLocaleString('id-ID')} 
                        icon={Link2} 
                        color="sky" 
                        desc="Data yang tersinkron dengan induk" 
                    />
                    <StatCard 
                        label="Status Koneksi" 
                        value="STABIL" 
                        icon={RefreshCw} 
                        color="emerald" 
                        desc="Pipeline data induk aktif" 
                    />
                </div>

                {/* --- SYNC METHODS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Sinkronisasi Massal */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                             <div className="flex items-center gap-5">
                                  <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 transition-transform group-hover:scale-110">
                                       <Database size={24} />
                                  </div>
                                  <div>
                                       <h3 className="text-sm font-bold text-black uppercase tracking-wider">Metode Massal</h3>
                                       <p className="text-lg font-extrabold text-black leading-tight">Sinkronkan Seluruh Data</p>
                                  </div>
                             </div>
                        </div>
                        
                        <div className="p-8 space-y-8 flex-1 flex flex-col">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-6 flex-1">
                                <p className="text-sm font-bold text-emerald-900 leading-relaxed uppercase">
                                    Proses ini akan mengambil seluruh data mahasiswa aktif dari sistem pusat universitas untuk diperbarui ke database KKN.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Memperbarui identitas lengkap mahasiswa',
                                        'Sinkronisasi Program Studi & Fakultas',
                                        'Kalibrasi status akademik terbaru',
                                        'Update perolehan SKS & IPK terbaru'
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight leading-none">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={submitBulk}
                                disabled={bulkForm.processing || targetedForm.processing}
                                className="h-16 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 text-sm uppercase disabled:opacity-50 active:scale-95"
                            >
                                {bulkForm.processing ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={20} />
                                )}
                                {bulkForm.processing ? 'Sedang Memproses Data...' : 'Mulai Sinkronisasi Massal'}
                            </button>
                        </div>
                    </div>

                    {/* Sinkronisasi Terarah */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                             <div className="flex items-center gap-5">
                                  <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                       <ListFilter size={24} />
                                  </div>
                                  <div>
                                       <h3 className="text-sm font-bold text-black uppercase tracking-wider">Metode Spesifik</h3>
                                       <p className="text-lg font-extrabold text-black leading-tight">Sinkronkan Per NIM</p>
                                  </div>
                             </div>
                        </div>

                        <form onSubmit={submitTargeted} className="p-8 space-y-6 flex-1 flex flex-col">
                            <div className="space-y-3 flex-1">
                                <label htmlFor="sync-nim-list" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    Daftar NIM Mahasiswa
                                </label>
                                <textarea
                                    id="sync-nim-list"
                                    rows={5}
                                    value={targetedForm.data.nim_list}
                                    onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
                                    placeholder={'Masukkan NIM, pisahkan dengan baris baru\nContoh:\n22411001\n22411002'}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-sm font-bold text-black focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 font-mono"
                                />
                                {targetedForm.errors.nim_list && (
                                    <p className="text-xs font-bold text-red-500">{targetedForm.errors.nim_list}</p>
                                )}
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
                                 <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                 <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                                     Gunakan mode ini untuk memperbaiki data individu tanpa membebani server. Masukkan daftar NIM dipisahkan dengan enter.
                                 </p>
                            </div>

                            <button
                                type="submit"
                                disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
                                className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 text-sm uppercase disabled:opacity-50 active:scale-95"
                            >
                                {targetedForm.processing ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <ArrowRight size={20} />
                                )}
                                {targetedForm.processing ? 'Sedang Memperbarui...' : 'Sinkronkan NIM Terpilih'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- FOOTER GUIDE --- */}
                <div className="bg-emerald-950 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                         <FileJson size={200} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                        <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                       <UserCheck size={20} className="text-white" />
                                  </div>
                                  <h3 className="text-xl font-bold uppercase tracking-tight italic">Integritas Data Mahasiswa</h3>
                             </div>
                             <p className="text-base font-bold text-emerald-100/60 uppercase leading-relaxed max-w-3xl italic">
                                Sinkronisasi data adalah jembatan penghubung antara sistem KKN dan database universitas. Pastikan koneksi stabil sebelum menjalankan sinkronisasi massal untuk hasil yang akurat.
                             </p>
                        </div>
                        <div className="px-8 py-4 bg-emerald-900/50 border border-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Link Active</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: LucideIcon, color: 'emerald' | 'sky', desc: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-sky-50 text-sky-600 border border-sky-100"
                )}>
                    <Icon size={24} />
                </div>
                <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} />
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-3xl font-black text-black tracking-tight tabular-nums">{value}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tight pt-2">{desc}</p>
            </div>
        </div>
    );
}
