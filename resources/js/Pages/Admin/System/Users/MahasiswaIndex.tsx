import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
 Database, FileSpreadsheet, KeyRound, Lock, RefreshCw, Search, Unlock,
 UserCheck, Users, Filter, GraduationCap, type LucideIcon, CheckCircle2, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface FacultyOption { id: number; name: string; }
interface ProgramOption { id: number; faculty_id: number; name: string; }
interface RegistryReference { id: number; nama: string; }
interface StudentAccount { id: number; username: string; name: string; email: string; is_active: boolean; }
interface StudentRecord { id: number; nim: string; nik: string | null; nama: string; mother_name: string | null; batch_year: number | null; gender: 'L' | 'P' | null; sks_completed: number | null; gpa: number | null; is_bta_ppi_passed: boolean; master_id: number | null; master_synced_at: string | null; address: string | null; fakultas: RegistryReference | null; prodi: RegistryReference | null; account: StudentAccount | null; has_account: boolean; }
interface Filters { search?: string; faculty_id?: string | number; program_id?: string | number; batch_year?: string | number; gender?: string; bta_ppi?: string; account_status?: string; sync_status?: string; }
interface Props { students: { data: StudentRecord[]; meta: PaginationMeta; }; filters: Filters; faculties: FacultyOption[]; programs: ProgramOption[]; batchYears: number[]; stats: { total: number; with_account: number; active_accounts: number; bta_passed: number; synced: number; }; syncInfo: { mode: string; source: string; last_synced_at: string | null; }; }

const emptyFilters: Required<Filters> = { search: '', faculty_id: '', program_id: '', batch_year: '', gender: '', bta_ppi: '', account_status: '', sync_status: '' };
function normalizeFilters(f: Filters): Required<Filters> { return { search: f.search ?? '', faculty_id: f.faculty_id ?? '', program_id: f.program_id ?? '', batch_year: f.batch_year ?? '', gender: f.gender ?? '', bta_ppi: f.bta_ppi ?? '', account_status: f.account_status ?? '', sync_status: f.sync_status ?? '' }; }
function buildQuery(f: Required<Filters>): Record<string, string | number> { const q: Record<string, string | number> = {}; Object.entries(f).forEach(([k, v]) => { if (v !== '' && v !== null) q[k] = v; }); return q; }
function formatDateTime(v: string | null | undefined): string {
 if (!v) return 'Belum pernah';
 try { const d = new Date(v); if (isNaN(d.getTime())) return 'Belum pernah'; return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
 catch { return 'Belum pernah'; }
}

export default function MahasiswaIndex({ students, filters, faculties, programs, batchYears, stats, syncInfo }: Props) {
 const [formFilters, setFormFilters] = useState<Required<Filters>>(normalizeFilters(filters));
 const [showFilters, setShowFilters] = useState(false);
 const [confirmReset, setConfirmReset] = useState<StudentRecord | null>(null);
 const [confirmToggle, setConfirmToggle] = useState<StudentRecord | null>(null);

 useEffect(() => { setFormFilters(normalizeFilters(filters)); }, [filters]);

 const visiblePrograms = formFilters.faculty_id ? programs.filter(p => String(p.faculty_id) === String(formFilters.faculty_id)) : programs;
 const submitFilters = () => router.get('/admin/mahasiswa', buildQuery(formFilters), { preserveState: true, replace: true, preserveScroll: true });
 const resetFilters = () => { setFormFilters(emptyFilters); router.get('/admin/mahasiswa', {}, { preserveState: true, replace: true, preserveScroll: true }); };
 const activeFilterCount = Object.values(buildQuery(formFilters)).filter(v => v !== '').length - (formFilters.search ? 1 : 0);

 return (
 <>
 <AppLayout title="Direktori Mahasiswa">
 <Head title="Manajemen Data Mahasiswa"/>

 <div className="space-y-6 font-sans pb-12">
 {/* HEADER */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <GraduationCap size={16} className="text-[#0d9488]"/>
 <span className="text-sm font-medium text-emerald-800">Manajemen Pengguna</span>
 </div>
 <h1 className="text-2xl font-black font-display uppercase tracking-tighter text-emerald-950 leading-tight">Direktori Mahasiswa</h1>
 <p className="text-sm text-emerald-800 max-w-2xl mt-1">Pengelolaan data kepesertaan dan sinkronisasi registrasi mahasiswa KKN.</p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <div className="px-3 py-1.5 bg-white border border-emerald-50 rounded-lg shadow-sm text-xs text-emerald-800">
 Sinkron: <strong className="text-emerald-800">{formatDateTime(syncInfo.last_synced_at)}</strong>
 </div>
 <Link href="/admin/mahasiswa/sinkron"className="h-10 px-4 bg-white border border-gray-300 text-emerald-800 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
 <RefreshCw size={15} /> Sinkronisasi
 </Link>
 </div>
 </div>

 {/* STATS */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard label="Total Mahasiswa"value={stats.total} icon={Database} />
 <StatCard label="Memiliki Akun"value={stats.with_account} icon={UserCheck} />
 <StatCard label="Lulus BTA-PPI"value={stats.bta_passed} icon={CheckCircle2} color="emerald"/>
 <StatCard label="Data Tersinkron"value={stats.synced} icon={RefreshCw} />
 </div>

 {/* TABLE PANEL */}
 <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
 {/* SEARCH & FILTER BAR */}
 <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="relative w-full sm:flex-1 sm:max-w-md">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800"/>
 <input
 value={formFilters.search}
 onChange={e => setFormFilters({ ...formFilters, search: e.target.value })}
 onKeyDown={e => e.key === 'Enter' && submitFilters()}
 className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-emerald-950 focus:border-[#0d9488] focus:ring-[#0d9488] shadow-sm"
 placeholder="Cari berdasarkan NIM atau Nama..."
 />
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setShowFilters(!showFilters)}
 className={clsx("h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 border shadow-sm transition-colors", showFilters ?"bg-[#0d9488] text-white border-emerald-600":"bg-white border-gray-300 text-emerald-800 hover:bg-gray-50")}
 >
 <Filter size={15} />
 {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
 </button>
 <button onClick={submitFilters} className="h-10 px-4 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0f766e] transition-colors shadow-sm">
 Terapkan
 </button>
 </div>
 </div>

 {/* FILTER PANEL */}
 {showFilters && (
 <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <FilterGroup label="Fakultas"value={String(formFilters.faculty_id)} onChange={v => setFormFilters({ ...formFilters, faculty_id: v, program_id: '' })} options={[{ value: '', label: 'Semua Fakultas' }, ...faculties.map(f => ({ value: String(f.id), label: f.name }))]} />
 <FilterGroup label="Program Studi"value={String(formFilters.program_id)} onChange={v => setFormFilters({ ...formFilters, program_id: v })} options={[{ value: '', label: 'Semua Prodi' }, ...visiblePrograms.map(p => ({ value: String(p.id), label: p.name }))]} />
 <FilterGroup label="Angkatan"value={String(formFilters.batch_year)} onChange={v => setFormFilters({ ...formFilters, batch_year: v })} options={[{ value: '', label: 'Semua Angkatan' }, ...batchYears.map(y => ({ value: String(y), label: String(y) }))]} />
 <FilterGroup label="Status BTA-PPI"value={formFilters.bta_ppi} onChange={v => setFormFilters({ ...formFilters, bta_ppi: v })} options={[{ value: '', label: 'Semua Status' }, { value: 'passed', label: 'Lulus' }, { value: 'failed', label: 'Belum Lulus' }]} />
 <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2 border-t border-emerald-50">
 <button onClick={resetFilters} className="text-sm text-emerald-800 hover:text-rose-600 transition-colors font-medium">Reset Semua Filter</button>
 </div>
 </div>
 )}

 {/* TABLE */}
 <div className="overflow-x-auto min-h-[300px]">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800">Data Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800">Afiliasi Studi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800">Performa Akademik</th>
 <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-800">Status Akun</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-800">Aksi</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {!students?.data ? (
 <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-emerald-800">Memuat data...</td></tr>
 ) : students.data.length === 0 ? (
 <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-emerald-800">Data mahasiswa tidak ditemukan.</td></tr>
 ) : students.data.map(s => (
 <tr key={s.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-emerald-950">{s.nama}</span>
 <span className="text-xs text-emerald-800 mt-0.5">NIM: {s.nim}{s.account && ` · @${s.account.username}`}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm text-[#1f2937] truncate max-w-xs">{s.prodi?.nama || '—'}</span>
 <span className="text-xs text-emerald-800 mt-0.5">{s.fakultas?.nama || '—'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center gap-2 text-xs text-emerald-800">
 <span>SKS: <strong>{s.sks_completed ?? 0}</strong></span>
 <span className="text-emerald-700">·</span>
 <span>GPA: <strong>{Number(s.gpa ?? 0).toFixed(2)}</strong></span>
 <span className="text-emerald-700">·</span>
 <span>Angk. <strong>{s.batch_year || '—'}</strong></span>
 </div>
 <span className={clsx("text-xs font-medium px-2 py-0.5 rounded w-fit", s.is_bta_ppi_passed ?"bg-[#f0fdfa] text-emerald-800":"bg-rose-100 text-rose-800")}>
 {s.is_bta_ppi_passed ? 'Lulus BTA-PPI' : 'Belum BTA-PPI'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 {!s.account ? (
 <span className="text-xs text-emerald-800">Tanpa Akun</span>
 ) : (
 <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", s.account.is_active ?"bg-[#f0fdfa] text-emerald-800":"bg-rose-100 text-rose-800")}>
 {s.account.is_active ? 'Aktif' : 'Terkunci'}
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button onClick={() => s.account && setConfirmReset(s)} disabled={!s.account} className="p-1.5 text-emerald-800 hover:text-[#0d9488] hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30"title="Reset Password">
 <KeyRound size={16} />
 </button>
 <button onClick={() => s.account && setConfirmToggle(s)} disabled={!s.account} className="p-1.5 text-emerald-800 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-30"title={s.account?.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
 {s.account?.is_active ? <Lock size={16} /> : <Unlock size={16} />}
 </button>
 <Link href={`/admin/mahasiswa/${s.id}`} className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors">
 Detail
 </Link>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="px-6 py-4 border-t border-emerald-50 bg-gray-50 flex items-center justify-between">
 <span className="text-xs text-emerald-800">Hal. {students.meta.current_page} — Total <strong>{students.meta.total}</strong> data</span>
 <Pagination meta={students.meta} />
 </div>
 </div>
 </div>
 </AppLayout>

 <ConfirmDialog
 open={!!confirmReset}
 onClose={() => setConfirmReset(null)}
 onConfirm={() => {
 if (confirmReset?.account) {
 router.post(`/admin/pengguna/${confirmReset.account.id}/reset-password-sementara`, {}, { preserveScroll: true });
 }
 setConfirmReset(null);
 }}
 title="Reset Password Sementara"
 message={`Hasilkan password sementara baru untuk mahasiswa"${confirmReset?.nama}"? Password lama akan digantikan dan ditampilkan sekali di layar ini.`}
 confirmLabel="Ya, Reset Sekarang"
 />

 <ConfirmDialog
 open={!!confirmToggle}
 onClose={() => setConfirmToggle(null)}
 onConfirm={() => {
 if (confirmToggle?.account) {
 router.patch(`/admin/pengguna/${confirmToggle.account.id}/toggle-status`, {}, { preserveScroll: true });
 }
 setConfirmToggle(null);
 }}
 title={confirmToggle?.account?.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
 message={confirmToggle?.account?.is_active
 ? `Akun milik"${confirmToggle?.nama}"akan dinonaktifkan. Mahasiswa tidak dapat login sampai akun diaktifkan kembali.`
 : `Akun milik"${confirmToggle?.nama}"akan diaktifkan. Mahasiswa dapat login kembali ke sistem.`
 }
 confirmLabel={confirmToggle?.account?.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
 confirmVariant={confirmToggle?.account?.is_active ? 'danger' : 'primary'}
 />
 </>
 );
}

function StatCard({ label, value, icon: Icon, color = 'slate' }: { label: string; value: number; icon: LucideIcon; color?: 'emerald' | 'slate' }) {
 return (
 <div className="bg-white border border-emerald-50 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
 <div className={clsx("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", color === 'emerald' ? 'bg-gray-50 text-[#0d9488]' : 'bg-gray-100 text-emerald-800')}>
 <Icon size={18} strokeWidth={2} />
 </div>
 <div>
 <p className="text-lg font-bold text-emerald-950 leading-tight tabular-nums">{value.toLocaleString('id-ID')}</p>
 <p className="text-xs text-emerald-800">{label}</p>
 </div>
 </div>
 );
}

function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; }) {
 return (
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-emerald-800">{label}</label>
 <div className="relative">
 <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-emerald-800 focus:border-[#0d9488] focus:ring-[#0d9488] appearance-none shadow-sm">
 {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
 </select>
 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none"/>
 </div>
 </div>
 );
}
