import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Download,
    Search,
    Filter,
    RefreshCw,
    Users,
    TrendingUp,
    GraduationCap,
    BookOpen,
    Eye,
    Zap,
    Layers,
    ShieldCheck,
    Activity,
    Binary,
    Fingerprint,
    Cpu,
    Database,
    Clock,
    Target,
    LayoutDashboard,
    Navigation,
    Flag,
    History,
    Shield,
    ChevronRight,
    SearchCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination, Badge } from '@/Components/ui';

interface EligibilityCheck {
    passed: boolean;
    key: string;
    message: string;
}

interface Student {
    mahasiswa_id: number;
    nim: string;
    nama: string;
    sks_completed: number;
    gpa: number | null;
    is_bta_ppi_passed: boolean;
    has_health_certificate: boolean;
    has_parent_permission: boolean;
    checks: EligibilityCheck[];
    is_eligible: boolean;
    issues: EligibilityCheck[];
    issue_count: number;
    mahasiswa?: {
        fakultas?: { nama: string };
        prodi?: { nama: string };
    };
}

interface Props {
    students: Student[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    stats: {
        total: number;
        eligible_count: number;
        not_eligible_count: number;
        eligibility_rate: number;
    };
    filters: {
        period_id?: number;
        faculty_id?: number;
        show_eligible: boolean;
    };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
}

export default function EligibilityIndex({ students, pagination, stats, filters, periods, faculties }: Props) {
    const [search, setSearch] = useState('');
    const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
    const [showEligible, setShowEligible] = useState(filters.show_eligible);

    const handleFilter = () => {
        router.get('/admin/cek-kelayakan', {
            period_id: periodId || undefined,
            faculty_id: facultyId || undefined,
            show_eligible: showEligible,
            search,
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = `/admin/cek-kelayakan/ekspor?period_id=${periodId}&faculty_id=${facultyId}`;
    };

    return (
        <AppLayout title="Komando Audit Kelayakan">
            <Head title="Audit Kelayakan Mahasiswa | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL: OTORITAS AUDIT AKADEMIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Academic Eligibility Audit System</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            AUDIT <span className="text-emerald-500">KELAYAKAN PESERTA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Evaluasi komprehensif parameter akademik, kuota SKS, dan validitas prasyarat administratif mahasiswa.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <button
                            onClick={handleExport}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group rounded-none"
                        >
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                            EKSPOR REKAPITULASI AUDIT
                        </button>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* METRIKS TACTICAL */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatBox icon={Users} label="Total Registry" value={stats.total} />
                        <StatBox icon={CheckCircle2} label="Audit Passed" value={stats.eligible_count} color="emerald" />
                        <StatBox icon={XCircle} label="Audit Failed" value={stats.not_eligible_count} color="rose" />
                        <StatBox icon={Target} label="Success Rate" value={`${stats.eligibility_rate}%`} color="amber" />
                    </div>

                    {/* FILTERS TACTICAL STRIP */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Filter size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Instrument Segmentasi Audit</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Otoritas Validasi & Kategorisasi Segmental</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                ANALYTICAL CONTROL FEED
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 xl:grid-cols-4 gap-10 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.2em] italic ml-1">Domain Periode Operasional</label>
                                <select
                                    value={periodId}
                                    onChange={(e) => setPeriodId(e.target.value)}
                                    className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">SEMUA PERIODE OPERASIONAL</option>
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>UNIT: {p.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.2em] italic ml-1">Struktur Unit Fakultas</label>
                                <select
                                    value={facultyId}
                                    onChange={(e) => setFacultyId(e.target.value)}
                                    className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">SEMUA UNIT FAKULTAS</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.2em] italic ml-1">Status Kelayakan Audit</label>
                                <div className="grid grid-cols-2 gap-2 h-16 bg-emerald-50/20 p-2 border border-emerald-50 shadow-inner">
                                    <button
                                        onClick={() => setShowEligible(true)}
                                        className={clsx(
                                            "flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic transition-all",
                                            showEligible ? "bg-emerald-950 text-white shadow-xl" : "bg-white text-emerald-100 hover:text-emerald-400"
                                        )}
                                    >
                                        STATUS_PASSED
                                    </button>
                                    <button
                                        onClick={() => setShowEligible(false)}
                                        className={clsx(
                                            "flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic transition-all",
                                            !showEligible ? "bg-rose-600 text-white shadow-xl" : "bg-white text-emerald-100 hover:text-emerald-400"
                                        )}
                                    >
                                        STATUS_FAILURE
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full h-16 bg-emerald-950 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.4em] italic transition-all active:scale-95 flex items-center justify-center gap-4 group/btn shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                                >
                                    EKSEKUSI AUDIT FILTER
                                    <Zap size={16} className="group-hover/btn:animate-pulse" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Output Ledger Kelayakan Pasien</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Data Terverifikasi SI-KOMANDO Registry</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl tabular-nums">
                                {pagination.total} ENTITAS TERKUNCI
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">PERSONEL & IDENTITAS</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">KUOTA SKS</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">METRIK GPA</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">SERTIFIKASI BTA</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">KESAHAN DOKUMEN</th>
                                        <th className="px-10 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">AUDIT STATUS</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">OPERATIONAL COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50 text-[12px]">
                                    {students.length > 0 ? students.map((student, idx) => (
                                        <tr key={student.mahasiswa_id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                            <td className="px-12 py-8 whitespace-nowrap">
                                                <div className="flex items-center gap-6 group-hover/row:translate-x-2 transition-transform duration-300">
                                                    <div className="h-14 w-14 bg-emerald-950 text-emerald-400 flex items-center justify-center font-black text-lg italic shadow-xl group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 uppercase">
                                                        {student.nama.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[13px] font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">
                                                            {student.nama}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint size={10} className="text-emerald-100" />
                                                            <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest italic leading-none">NIM. {student.nim}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className={clsx(
                                                        "px-5 py-2 text-[11px] font-black italic tabular-nums border group-hover/row:shadow-md transition-all",
                                                        student.sks_completed >= 100 ? "text-emerald-950 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
                                                    )}>
                                                        {student.sks_completed} SKS
                                                    </span>
                                                    <span className="text-[7.5px] font-black text-emerald-200 uppercase tracking-widest italic">CAPACITY_SCORE</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center text-[13px] font-black text-emerald-950 tabular-nums">
                                                <div className="flex flex-col items-center gap-1">
                                                    {student.gpa ? student.gpa.toFixed(2) : '--.--'}
                                                    <div className="h-0.5 w-6 bg-emerald-50" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <div className={clsx(
                                                        "px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] italic border shadow-sm transition-all",
                                                        student.is_bta_ppi_passed 
                                                            ? "bg-emerald-950 text-white border-emerald-900" 
                                                            : "bg-white text-emerald-100 border-emerald-50 opacity-40 shadow-none border-dashed"
                                                    )}>
                                                        {student.is_bta_ppi_passed ? 'CERTIFIED' : 'PENDING'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <DocStatus active={student.has_health_certificate} icon={Shield} />
                                                    <DocStatus active={student.has_parent_permission} icon={Binary} />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex justify-center">
                                                    {student.is_eligible ? (
                                                        <div className="px-6 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-3 shadow-sm group-hover/row:shadow-emerald-500/10 transition-all">
                                                            <CheckCircle2 size={16} className="animate-pulse" />
                                                            ELIGIBLE
                                                        </div>
                                                    ) : (
                                                        <div className="px-6 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-3 shadow-sm group-hover/row:bg-rose-100 transition-all">
                                                            <AlertTriangle size={16} />
                                                            {student.issue_count} ISSUES
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                    <Link
                                                        href={`/admin/mahasiswa/${student.mahasiswa_id}`}
                                                        className="h-12 w-12 bg-white border border-emerald-50 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500 flex items-center justify-center transition-all shadow-sm active:scale-95 group/btn"
                                                        title="VIEW PROFILE"
                                                    >
                                                        <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/registrations?search=${student.nim}`}
                                                        className="h-12 px-8 bg-white border border-emerald-50 text-emerald-950 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 italic transition-all active:scale-95 shadow-sm"
                                                    >
                                                        HISTORY
                                                        <History size={16} className="text-emerald-300" />
                                                    </Link>
                                                    <button className="h-12 w-12 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-12 py-56 text-center opacity-20">
                                                <div className="flex flex-col items-center gap-8">
                                                    <Cpu size={80} className="text-emerald-950" strokeWidth={0.5} />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-emerald-950">DATABASE REGISTRY NIHIL</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-12 py-10 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between bg-emerald-50/10 gap-8 italic mt-1 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-emerald-950 shadow-lg">
                                    <Database size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Operational Auditor Feed</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Entitas Audit: {pagination.total} Personel</p>
                                </div>
                            </div>
                             <Pagination
                                meta={{
                                    current_page: pagination.current_page,
                                    last_page: pagination.last_page,
                                    per_page: pagination.per_page,
                                    total: pagination.total,
                                    from: (pagination.current_page - 1) * pagination.per_page + 1,
                                    to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                    links: [],
                                    path: '/admin/cek-kelayakan',
                                }}
                            />
                        </div>
                    </div>

                    {/* SECURITY FOOTER MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                             <div className="space-y-8 flex-1">
                                 <div className="flex items-center gap-8">
                                    <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
                                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Otoritas Validasi Kelayakan</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Audit kelayakan menjamin integritas peserta pendaftaran KKN berdasarkan filter parameter akademik universitas. 
                                            Dataset ini disinkronkan secara real-time dengan sistem akademik pusat untuk mencegah anomali data administratif mahasiswa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">AUDIT_VERIFIED_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL COMMAND CENTER</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatBox({ icon: Icon, label, value, color = "emerald" }: { icon: React.ElementType; label: string; value: string | number; color?: "emerald" | "rose" | "amber" }) {
    const colors = {
        emerald: "text-emerald-500 bg-emerald-500",
        rose: "text-rose-500 bg-rose-500",
        amber: "text-amber-500 bg-amber-500"
    };

    return (
        <div className="bg-white border border-emerald-100 p-8 shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
            <div className={clsx("absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", colors[color].split(' ')[0])}>
                <Icon size={48} />
            </div>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className={clsx("p-2.5 text-white shadow-lg", colors[color].split(' ')[1])}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className={clsx("px-2 py-1 text-[8px] font-black uppercase tracking-widest italic border italic", color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : (color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'))}>
                    {label.toUpperCase()}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-4xl font-black tracking-tighter text-emerald-950 uppercase italic leading-none tabular-nums">
                    {value}
                </p>
                <div className={clsx("h-0.5 w-12 mt-3", colors[color].split(' ')[1])} />
            </div>
        </div>
    );
}

function DocStatus({ active, icon: Icon }: { active: boolean; icon: React.ElementType }) {
    return (
        <div className={clsx(
            "p-3 border transition-all", 
            active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-white text-emerald-100 border-emerald-50 opacity-40 shadow-none border-dashed'
        )}>
            <Icon size={14} strokeWidth={3} />
        </div>
    );
}
