import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Database,
    FileSpreadsheet,
    KeyRound,
    Lock,
    RefreshCw,
    Search,
    Unlock,
    UserCheck,
    Users,
    X,
    Filter,
    ChevronDown,
    Activity,
    type LucideIcon,
    Zap,
    Cpu,
    Fingerprint,
    ChevronRight,
    ShieldCheck,
    Info,
    Calendar,
    GraduationCap,
    Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

interface FacultyOption { id: number; name: string; }
interface ProgramOption { id: number; faculty_id: number; name: string; }
interface RegistryReference { id: number; nama: string; }
interface StudentAccount { id: number; username: string; name: string; email: string; is_active: boolean; }
interface StudentRecord { id: number; nim: string; nik: string | null; nama: string; mother_name: string | null; batch_year: number | null; gender: 'L' | 'P' | null; sks_completed: number | null; gpa: number | null; is_bta_ppi_passed: boolean; master_id: number | null; master_synced_at: string | null; address: string | null; fakultas: RegistryReference | null; prodi: RegistryReference | null; account: StudentAccount | null; has_account: boolean; }
interface Filters { search?: string; faculty_id?: string | number; program_id?: string | number; batch_year?: string | number; gender?: string; bta_ppi?: string; account_status?: string; sync_status?: string; }
interface Props { students: { data: StudentRecord[]; meta: PaginationMeta; }; filters: Filters; faculties: FacultyOption[]; programs: ProgramOption[]; batchYears: number[]; stats: { total: number; with_account: number; active_accounts: number; bta_passed: number; synced: number; }; syncInfo: { mode: string; source: string; last_synced_at: string | null; }; }

const emptyFilters: Required<Filters> = { search: '', faculty_id: '', program_id: '', batch_year: '', gender: '', bta_ppi: '', account_status: '', sync_status: '', };
function normalizeFilters(filters: Filters): Required<Filters> { return { search: filters.search ?? '', faculty_id: filters.faculty_id ?? '', program_id: filters.program_id ?? '', batch_year: filters.batch_year ?? '', gender: filters.gender ?? '', bta_ppi: filters.bta_ppi ?? '', account_status: filters.account_status ?? '', sync_status: filters.sync_status ?? '', }; }
function buildQuery(filters: Required<Filters>): Record<string, string | number> { const query: Record<string, string | number> = {}; Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value !== null) query[key] = value; }); return query; }
function formatDateTime(v: string | null | undefined): string { 
    if (!v) return 'BELUM PERNAH'; 
    try {
        const date = new Date(v);
        if (isNaN(date.getTime())) return 'BELUM PERNAH';
        return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', }).format(date);
    } catch (e) {
        return 'BELUM PERNAH';
    }
}

export default function MahasiswaIndex({ students, filters, faculties, programs, batchYears, stats, syncInfo }: Props) {
    const [formFilters, setFormFilters] = useState<Required<Filters>>(normalizeFilters(filters));
    const [showFilters, setShowFilters] = useState(false);
    const { flash } = usePage<PageProps>().props;

    useEffect(() => { setFormFilters(normalizeFilters(filters)); }, [filters]);

    const visiblePrograms = formFilters.faculty_id ? programs.filter((p) => String(p.faculty_id) === String(formFilters.faculty_id)) : programs;
    const submitFilters = () => { router.get('/admin/mahasiswa', buildQuery(formFilters), { preserveState: true, replace: true, preserveScroll: true }); };
    const resetFilters = () => { setFormFilters(emptyFilters); router.get('/admin/mahasiswa', {}, { preserveState: true, replace: true, preserveScroll: true }); };

    const activeFilterCount = Object.values(buildQuery(formFilters)).filter(v => v !== '').length - (formFilters.search ? 1 : 0);

    return (
        <AppLayout>
            <Head title="Direktori Mahasiswa" />

            <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
                {/* --- PREMIUM HEADER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <GraduationCap size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Database Akademik Terintegrasi</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                Direktori <span className="text-emerald-500">Mahasiswa.</span>
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                                Pengelolaan Data Kepesertaan dan Sinkronisasi Registrasi Mahasiswa KKN UIN SAIZU
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                                <Clock size={16} className="text-slate-300" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Update Sinkronisasi</span>
                                    <span className="text-[11px] font-bold text-slate-700 leading-none tabular-nums">
                                        {formatDateTime(syncInfo.last_synced_at)}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/admin/mahasiswa/sinkron"
                                className="h-14 px-8 bg-emerald-500 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 group font-bold text-sm"
                            >
                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                                SINKRONISASI DATA
                            </Link>
                        </div>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StudentMetric label="Total Mahasiswa" value={stats.total} icon={Database} color="emerald" desc="Basis Data Lokal" />
                    <StudentMetric label="Memiliki Akun" value={stats.with_account} icon={UserCheck} color="sky" desc="Otoritas Terdaftar" />
                    <StudentMetric label="Lulus BTA-PPI" value={stats.bta_passed} icon={CheckCircle2} color="amber" desc="Prasyarat Utama" />
                    <StudentMetric label="Status Sinkron" value={stats.synced} icon={RefreshCw} color="emerald" desc="Validasi SIAKAD" />
                </div>

                {/* --- SEARCH & FILTERS --- */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <Search size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filter Pencarian</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Penelusuran Entitas Partisipan</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 flex-1 justify-end">
                            <div className="relative w-full max-w-md group">
                                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    value={formFilters.search} 
                                    onChange={e => setFormFilters({ ...formFilters, search: e.target.value })} 
                                    onKeyDown={e => e.key === 'Enter' && submitFilters()} 
                                    className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300" 
                                    placeholder="Cari berdasarkan NIM atau Nama..." 
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)} 
                                 className={clsx(
                                    "h-14 px-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all border shadow-sm", 
                                    showFilters ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Filter size={18} /> 
                                {activeFilterCount > 0 ? `FILTER (${activeFilterCount})` : 'FILTER'}
                            </button>
                            <Button onClick={submitFilters} className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.1em] transition-all shadow-xl shadow-emerald-50">TERAPKAN</Button>
                         </div>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-b border-slate-100 overflow-hidden">
                                <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                                     <FilterGroup label="Fakultas" value={String(formFilters.faculty_id)} onChange={v => setFormFilters({ ...formFilters, faculty_id: v, program_id: '' })} options={[ { value: '', label: '— SEMUA FAKULTAS —' }, ...faculties.map(f => ({ value: String(f.id), label: f.name })) ]} />
                                     <FilterGroup label="Program Studi" value={String(formFilters.program_id)} onChange={v => setFormFilters({ ...formFilters, program_id: v })} options={[ { value: '', label: '— SEMUA PRODI —' }, ...visiblePrograms.map(p => ({ value: String(p.id), label: p.name })) ]} />
                                     <FilterGroup label="Angkatan" value={String(formFilters.batch_year)} onChange={v => setFormFilters({ ...formFilters, batch_year: v })} options={[ { value: '', label: '— SEMUA ANGKATAN —' }, ...batchYears.map(y => ({ value: String(y), label: String(y) })) ]} />
                                     <FilterGroup label="Status BTA-PPI" value={formFilters.bta_ppi} onChange={v => setFormFilters({ ...formFilters, bta_ppi: v })} options={[ { value: '', label: '— SEMUA STATUS —' }, { value: 'passed', label: 'LULUS' }, { value: 'failed', label: 'BELUM LULUS' } ]} />
                                     <div className="lg:col-span-4 flex justify-end gap-2 pt-8 border-t border-slate-50">
                                         <button onClick={resetFilters} className="px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Reset Semua Parameter</button>
                                     </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- MAIN TABLE --- */}
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                                <tr>
                                    <th className="px-10 py-6">Entitas Mahasiswa</th>
                                    <th className="px-10 py-6">Afiliasi Studi</th>
                                    <th className="px-10 py-6">Performa Akademik</th>
                                    <th className="px-10 py-6 text-center">Status Akses</th>
                                    <th className="px-10 py-6 text-right">Opsi Operasional</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-slate-50">
                                {(!students || !students.data) ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center text-slate-400">
                                            Memuat data mahasiswa...
                                        </td>
                                    </tr>
                                ) : students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-200">
                                                <Info size={56} strokeWidth={1} />
                                                <p className="text-xs font-bold uppercase tracking-[0.4em]">Data tidak tersedia</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                                                        {student.nama}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em] opacity-70">
                                                        NIM: {student.nim} {student.account && ` • @${student.account.username}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-slate-700 uppercase leading-snug truncate max-w-[220px]">{student.prodi?.nama || '—'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none tracking-wider">{student.fakultas?.nama || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-500 tabular-nums">SKS: {student.sks_completed ?? 0}</span>
                                                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                                                        <span className="text-[10px] font-black text-slate-900 tabular-nums">GPA: {Number(student.gpa ?? 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {student.is_bta_ppi_passed ?
                                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">LULUS BTA</span> :
                                                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 uppercase tracking-widest">BELUM BTA</span>
                                                        }
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">ANGKATAN {student.batch_year || '—'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                 <div className="flex flex-col items-center gap-2">
                                                     {!student.account ?
                                                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">TANPA AKUN</span> :
                                                          <div className={clsx(
                                                              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all", 
                                                              student.account.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                                                          )}>
                                                              {student.account.is_active ? 'AKTIF' : 'TERKUNCI'}
                                                          </div>
                                                     }
                                                     {student.master_synced_at && (
                                                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-300 uppercase italic">
                                                               <RefreshCw size={9} />
                                                               <span className="tracking-tighter">{formatDateTime(student.master_synced_at)}</span>
                                                          </div>
                                                     )}
                                                 </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                 <div className="flex justify-end gap-2 outline-none">
                                                    <button 
                                                        onClick={() => { if (student.account && confirm(`Hasilkan password sementara untuk ${student.nama}?`)) router.post(`/admin/pengguna/${student.account.id}/reset-password-sementara`, {}, { preserveScroll: true }); }} 
                                                        disabled={!student.account} 
                                                        className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm rounded-xl flex items-center justify-center transition-all disabled:opacity-10 active:scale-90" 
                                                        title="Terbitkan Kredensial Baru"
                                                    >
                                                        <KeyRound size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { if (student.account && confirm(`Ubah status akses untuk ${student.nama}?`)) router.patch(`/admin/pengguna/${student.account.id}/toggle-status`, {}, { preserveScroll: true }); }} 
                                                        disabled={!student.account} 
                                                        className={clsx(
                                                            "h-10 w-10 border rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-10", 
                                                            student.account?.is_active ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm" : "bg-rose-50 border-rose-100 text-rose-500 shadow-inner"
                                                        )} 
                                                        title={student.account?.is_active ? "Nonaktifkan Akses" : "Aktifkan Akses"}
                                                    >
                                                        {student.account?.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                                                    </button>
                                                    <Link 
                                                        href={`/admin/mahasiswa/${student.id}`} 
                                                        className="h-10 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center shadow-lg active:scale-95 gap-2"
                                                    >
                                                        Detail <ChevronRight size={14} className="opacity-40" />
                                                    </Link>
                                                 </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tercatat: HAL. {students.meta.current_page} — TOTAL {students.meta.total} ENTITAS</span>
                        <Pagination meta={students.meta} />
                    </div>
                </div>

                {/* --- PREMIUM FOOTER --- */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none -mr-16 -mt-16 rotate-12">
                         <GraduationCap size={300} />
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                                <ShieldCheck size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold uppercase tracking-tight">Otoritas Validasi Identitas</h4>
                                <p className="text-sm font-medium text-emerald-50/80 max-w-3xl leading-relaxed">
                                    Sistem ini berfungsi sebagai titik sinkronisasi pusat antara data akademik universitas dan partisipasi lapangan. Validasi NIM, persyaratan BTA, dan status SKS dilakukan secara berkala untuk memastikan kepatuhan standar akademik KKN.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StudentMetric({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: LucideIcon, color: 'emerald' | 'sky' | 'amber', desc: string }) {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', colorMap[color])}>
                    <Icon size={20} />
                </div>
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{desc}</div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-3xl font-black text-black tracking-tight tabular-nums leading-none">
                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                </p>
            </div>
        </div>
    );
}

function FilterGroup({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: Array<{ value: string, label: string }> }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">{label}</label>
            <div className="relative">
                <select 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700 outline-none transition focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer pr-10"
                >
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
