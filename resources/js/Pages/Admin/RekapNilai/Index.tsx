import { useState, useMemo, useCallback, useEffect } from 'react'
import { router, Head, Deferred } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
    ArrowDownTrayIcon, FunnelIcon, CheckBadgeIcon,
    ExclamationTriangleIcon, AcademicCapIcon, ChartBarIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScoreRow {
    mahasiswa_id: number
    user_id: number
    nama: string
    nim: string
    fakultas: string
    prodi: string
    kode_kelompok: string
    kelompok_id: number
    desa: string
    nama_dpl: string
    nilai_laporan_akhir: number | null
    nilai_pelaksanaan: number | null
    nilai_artikel: number | null
    nilai_sikap: number | null
    nilai_kedisiplinan: number | null
    nilai_workshop: number | null
    nilai_administrasi: number | null
    nilai_akhir: number | null
    huruf: string | null
    is_finalized: boolean
    dpl_submitted_at: string | null
    mitra_submitted_at: string | null
    admin_submitted_at: string | null
}

interface Stats {
    total: number; finalized: number
    missing_dpl: number; missing_mitra: number
    distribusi: Record<string, number>
    rata_rata: number
}

// ── Grade helpers ──────────────────────────────────────────────────────────────
const gradeColor = (h: string | null) => {
    if (!h) return 'text-slate-400'
    const map: Record<string, string> = {
        A: 'text-emerald-400', 'A-': 'text-emerald-300',
        'B+': 'text-blue-400', B: 'text-blue-300', 'B-': 'text-sky-300',
        'C+': 'text-amber-400', C: 'text-amber-300', D: 'text-red-400',
    }
    return map[h] ?? 'text-slate-300'
}

const gradeBg = (h: string | null) => {
    if (!h) return 'bg-slate-800/50'
    if (h.startsWith('A')) return 'bg-emerald-500/10 border-emerald-500/20'
    if (h.startsWith('B')) return 'bg-blue-500/10 border-blue-500/20'
    if (h.startsWith('C')) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-red-500/10 border-red-500/20'
}

const fmt = (v: any) => v !== null && v !== undefined ? parseFloat(v).toFixed(1) : <span className="text-slate-600">—</span>

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: any; label: string; value: string | number
    sub?: string; color: string
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl p-5 border border-white/10 backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
                    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
                </div>
                <div className={`p-2.5 rounded-xl bg-current/10 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}

// ── Skeleton Components ────────────────────────────────────────────────────────
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
            ))}
        </div>
    )
}

function TableSkeleton() {
    return (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden p-8 space-y-4 animate-pulse">
            <div className="h-8 bg-white/5 rounded-xl w-1/4 mb-8" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                    <div className="h-4 bg-white/5 rounded w-full" />
                </div>
            ))}
        </div>
    )
}

function StatsStats({ stats }: { stats?: Stats }) {
    if (!stats) return <StatsSkeleton />;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatCard icon={AcademicCapIcon} label="Total Mahasiswa" value={stats.total} color="text-blue-400" />
            <StatCard icon={CheckBadgeIcon} label="Nilai Final" value={stats.finalized} color="text-emerald-400" sub={`${stats.total - stats.finalized} belum final`} />
            <StatCard icon={ExclamationTriangleIcon} label="Belum Nilai DPL" value={stats.missing_dpl} color="text-amber-400" />
            <StatCard icon={ChartBarIcon} label="Rata-rata Nilai" value={stats.rata_rata} color="text-violet-400" sub={`Median Grade: ${stats.rata_rata >= 80 ? 'A' : 'B'}`} />
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RekapNilaiIndex({
    rows, stats, filters, periodeId, periods, faculties, groups,
}: {
    rows?: ScoreRow[]; stats?: Stats; filters: Record<string, any>
    periodeId: number | null; periods: any[]; faculties: any[]; groups: any[]
}) {
    const [search, setSearch] = useState('')
    const [localFilters, setLocalFilters] = useState(filters)
    const [sortKey, setSortKey] = useState<keyof ScoreRow>('nama')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [editing, setEditing] = useState<{ id: number, col: string } | null>(null)
    const [editValue, setEditValue] = useState<string>('')
    const handleSaveInline = (row: ScoreRow, col: string) => {
        if (editValue === String(row[col as keyof ScoreRow])) {
            setEditing(null)
            return
        }

        router.post(route('admin.rekap-nilai.save-inline'), {
            user_id: row.mahasiswa_id,
            kelompok_id: row.kelompok_id,
            component: col,
            value: editValue === '' ? null : parseFloat(editValue)
        }, {
            preserveScroll: true,
            onSuccess: () => setEditing(null)
        })
    }
    const [selectedRow, setSelectedRow] = useState<ScoreRow | null>(null)
    const [finalizeProgress, setFinalizeProgress] = useState<{ total: number, processed: number, status: string } | null>(null)

    // Poll for finalization progress
    useEffect(() => {
        let timer: any;
        if (finalizeProgress && finalizeProgress.status === 'processing') {
            timer = setInterval(async () => {
                try {
                    const res = await fetch(route('admin.rekap-nilai.finalize-progress', { period_id: periodeId }));
                    const data = await res.json();
                    if (data) {
                        setFinalizeProgress(data);
                        if (data.status === 'completed') {
                            router.reload({ only: ['rows', 'stats'] });
                            setTimeout(() => setFinalizeProgress(null), 5000);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch progress', e);
                }
            }, 2000);
        }
        return () => clearInterval(timer);
    }, [finalizeProgress, periodeId]);

    const handleFinalizeMass = () => {
        router.post(route('admin.rekap-nilai.finalize-mass'), { period_id: periodeId }, {
            onSuccess: () => {
                setFinalizeProgress({ total: 0, processed: 0, status: 'processing' });
            }
        });
    }

    // Client-side sort & search
    const processed = useMemo(() => {
        let data = [...(rows || [])]
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(r =>
                r.nama.toLowerCase().includes(q) ||
                r.nim.includes(q) ||
                r.kode_kelompok.toLowerCase().includes(q)
            )
        }
        data.sort((a, b) => {
            const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
            const cmp = av < bv ? -1 : av > bv ? 1 : 0
            return sortDir === 'asc' ? cmp : -cmp
        })
        return data
    }, [rows, search, sortKey, sortDir])

    const handleSort = useCallback((key: keyof ScoreRow) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }, [sortKey])

    const applyFilters = () => router.get(route('admin.rekap-nilai.index'), {
        period_id: localFilters.period_id || periodeId, ...localFilters
    }, { preserveState: true })

    const handleExport = () => router.get(
        route('admin.rekap-nilai.export'),
        { period_id: periodeId, ...localFilters }
    )

    const SortIcon = ({ col }: { col: keyof ScoreRow }) =>
        sortKey === col
            ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
            : <span className="ml-1 opacity-20">↕</span>

    return (
        <AppLayout>
            <Head title="Rekap Nilai KKN" />
            <div className="p-6">
                {/* ── Progress Overlay ─────────────────────────── */}
                {finalizeProgress && (
                    <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${finalizeProgress.status === 'processing' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                <span className="text-sm font-bold text-white">
                                    {finalizeProgress.status === 'processing' ? 'Memproses Finalisasi Massal...' : 'Finalisasi Massal Selesai!'}
                                </span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                                {finalizeProgress.processed} / {finalizeProgress.total} Data
                            </span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${finalizeProgress.status === 'processing' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                style={{ width: `${finalizeProgress.total > 0 ? (finalizeProgress.processed / finalizeProgress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Header ─────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Rekap Nilai KKN</h1>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {stats ? `Ditemukan ${stats.total} mahasiswa` : 'Pilih periode untuk melihat data'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleExport} disabled={!periodeId}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-emerald-500/20 text-emerald-300 border border-emerald-500/30
                hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Export Excel
                        </button>
                        <button
                            onClick={() => router.get(route('admin.rekap-nilai.bulk-certificates'), { period_id: periodeId, ...localFilters })}
                            disabled={!periodeId || stats?.finalized === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-violet-500/20 text-violet-300 border border-violet-500/30
                hover:bg-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            Cetak Semua Sertifikat
                        </button>
                        <button
                            onClick={handleFinalizeMass}
                            disabled={!periodeId || (finalizeProgress?.status === 'processing')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-blue-500/20 text-blue-300 border border-blue-500/30
                hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <CheckBadgeIcon className="w-4 h-4" />
                            {finalizeProgress?.status === 'processing' ? 'Sedang Memproses...' : 'Finalisasi Semua'}
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ──────────────────────────────────── */}
                <Deferred data="stats" fallback={<StatsSkeleton />}>
                    <StatsStats stats={stats} />
                </Deferred>

                {/* ── Filter Bar ─────────────────────────────────── */}
                <div className="glass-card mb-6 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text" placeholder="Cari nama / NIM / kelompok..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl text-sm text-white outline-none
                bg-white/5 border border-white/10 placeholder-slate-500
                focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <select value={localFilters.period_id || periodeId || ''}
                        onChange={e => setLocalFilters(f => ({ ...f, period_id: e.target.value }))}
                        className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500/50">
                        <option value="" className="bg-slate-900 text-white">Semua Periode</option>
                        {(periods || []).map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
                    </select>
                    <select value={localFilters.faculty_id ?? ''}
                        onChange={e => setLocalFilters(f => ({ ...f, faculty_id: e.target.value }))}
                        className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500/50">
                        <option value="" className="bg-slate-900 text-white">Semua Fakultas</option>
                        {(faculties || []).map(f => <option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.name}</option>)}
                    </select>
                    <select value={localFilters.group_id ?? ''}
                        onChange={e => setLocalFilters(f => ({ ...f, group_id: e.target.value }))}
                        className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500/50">
                        <option value="" className="bg-slate-900 text-white">Semua Kelompok</option>
                        {(groups || []).map(g => <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.kode_kelompok}</option>)}
                    </select>
                    <select value={localFilters.huruf ?? ''}
                        onChange={e => setLocalFilters(f => ({ ...f, huruf: e.target.value }))}
                        className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500/50">
                        <option value="" className="bg-slate-900 text-white">Semua Grade</option>
                        {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D'].map(h => <option key={h} value={h} className="bg-slate-900 text-white font-mono">{h}</option>)}
                    </select>
                    <button onClick={applyFilters}
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600/20 text-blue-400
              border border-blue-500/30 hover:bg-blue-600/30 transition-all flex items-center gap-2">
                        <FunnelIcon className="w-4 h-4" /> Filter
                    </button>
                </div>

                {/* ── Table ──────────────────────────────────────── */}
                <Deferred data="rows" fallback={<TableSkeleton />}>
                    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-blue-500/10 border-b border-white/5">
                                        {[
                                            ['#', null],
                                            ['Mahasiswa', 'nama'],
                                            ['Kelompok', 'kode_kelompok'],
                                            ['A1', 'nilai_laporan_akhir', 'Laporan Akhir (DPL)'],
                                            ['A2', 'nilai_pelaksanaan', 'Pelaksanaan (DPL)'],
                                            ['A3', 'nilai_artikel', 'Artikel (DPL)'],
                                            ['B1', 'nilai_sikap', 'Sikap (Desa/Mitra)'],
                                            ['B2', 'nilai_kedisiplinan', 'Kedisiplinan (Desa/Mitra)'],
                                            ['C1', 'nilai_workshop', 'Workshop (LPPM)'],
                                            ['C2', 'nilai_administrasi', 'Administrasi (LPPM)'],
                                            ['Total', 'nilai_akhir', 'Rumus: (DPL*50%) + (Mitra*30%) + (LPPM*20%)'],
                                            ['Komponen', null, 'DPL · Desa · Admin'],
                                            ['Grade', 'huruf'],
                                            ['Status', 'is_finalized'],
                                            ['Aksi', null],
                                        ].map(([label, key, tip]) => (
                                            <th key={String(label)}
                                                onClick={() => key && handleSort(key as keyof ScoreRow)}
                                                title={tip as string}
                                                className={`px-4 py-4 text-left text-xs font-bold text-blue-200/60
                        uppercase tracking-wider whitespace-nowrap
                        ${tip ? 'cursor-help border-b border-white/5' : ''}
                        ${key ? 'cursor-pointer hover:text-white transition-colors' : ''}`}>
                                                {label}
                                                {tip && <span className="ml-0.5 text-[8px] opacity-30">ⓘ</span>}
                                                {key && <SortIcon col={key as keyof ScoreRow} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {processed.map((row, i) => (
                                        <tr key={row.mahasiswa_id}
                                            onClick={() => setSelectedRow(row)}
                                            className="hover:bg-white/5 transition-colors group cursor-pointer">
                                            <td className="px-4 py-4 text-slate-500 text-xs">{i + 1}</td>
                                            <td className="px-4 py-4">
                                                <p className="text-white font-semibold whitespace-nowrap group-hover:text-blue-400 transition-colors">{row.nama}</p>
                                                <p className="text-slate-500 text-[10px] font-mono">{row.nim} · {row.prodi}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-slate-300 font-medium whitespace-nowrap">{row.kode_kelompok}</p>
                                                <p className="text-slate-500 text-[10px]">{row.desa}</p>
                                            </td>
                                            {/* Nilai per komponen */}
                                            {[
                                                ['nilai_laporan_akhir', row.nilai_laporan_akhir],
                                                ['nilai_pelaksanaan', row.nilai_pelaksanaan],
                                                ['nilai_artikel', row.nilai_artikel],
                                                ['nilai_sikap', row.nilai_sikap],
                                                ['nilai_kedisiplinan', row.nilai_kedisiplinan],
                                                ['nilai_workshop', row.nilai_workshop],
                                                ['nilai_administrasi', row.nilai_administrasi]
                                            ].map(([col, v], idx) => {
                                                const isEditing = editing?.id === row.mahasiswa_id && editing?.col === col as string
                                                return (
                                                    <td key={idx}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditing({ id: row.mahasiswa_id, col: col as string })
                                                            setEditValue(v === null ? '' : String(v))
                                                        }}
                                                        className={`px-4 py-4 text-center text-xs transition-all ${v === null ? 'text-slate-600' : 'text-slate-300 font-mono'} ${isEditing ? 'bg-blue-500/20' : ''}`}>
                                                        {isEditing ? (
                                                            <input
                                                                autoFocus
                                                                className="w-12 bg-slate-900 border border-blue-500/50 rounded px-1 outline-none text-center"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                onBlur={() => handleSaveInline(row, col as string)}
                                                                onKeyDown={e => e.key === 'Enter' && handleSaveInline(row, col as string)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        ) : fmt(v)}
                                                    </td>
                                                )
                                            })}
                                            {/* Nilai Akhir */}
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-base font-black ${gradeColor(row.huruf)}`}>
                                                    {row.nilai_akhir ? parseFloat(row.nilai_akhir.toString()).toFixed(1) : '—'}
                                                </span>
                                            </td>
                                            {/* Kelengkapan */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <div title="DPL" className={`w-2 h-2 rounded-full ${row.dpl_submitted_at ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <div title="Mitra/Desa" className={`w-2 h-2 rounded-full ${row.mitra_submitted_at ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <div title="Admin/LPPM" className={`w-2 h-2 rounded-full ${row.admin_submitted_at ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                </div>
                                            </td>
                                            {/* Huruf */}
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black border ${gradeBg(row.huruf)} ${gradeColor(row.huruf)}`}>
                                                    {row.huruf ?? '—'}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-4">
                                                <div className="flex gap-1.5">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight
                          ${row.is_finalized
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-slate-700/50 text-slate-500 border border-white/5'}`}>
                                                        {row.is_finalized ? 'Final' : 'Draft'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {row.is_finalized && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); router.get(route('admin.rekap-nilai.certificate', row.mahasiswa_id)) }}
                                                        disabled={!row.is_finalized}
                                                        title="Download Sertifikat"
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-30">
                                                        <AcademicCapIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {processed.length === 0 && (
                                        <tr>
                                            <td colSpan={14} className="px-4 py-12 text-center text-slate-500">
                                                Tidak ada data ditemukan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 bg-white/2">
                            <p>
                                Menampilkan <span className="text-white font-bold">{processed.length}</span> baris
                            </p>
                            <Deferred data="stats" fallback={<p>Loading progress...</p>}>
                                <p>
                                    Progress Finalisasi: <span className="text-emerald-400 font-bold">{stats?.finalized}</span> / {stats?.total}
                                </p>
                            </Deferred>
                        </div>
                    </div>
                </Deferred>
            </div>

            {/* Score Detail Modal */}
            {selectedRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedRow(null)} />
                    <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white">{selectedRow.nama}</h2>
                                    <p className="text-slate-400 font-medium">NIM: {selectedRow.nim} · Kelompok {selectedRow.kode_kelompok}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl border font-black text-xl ${gradeBg(selectedRow.huruf)} ${gradeColor(selectedRow.huruf)}`}>
                                    {selectedRow.huruf ?? '—'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Komponen A (DPL)</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Laporan Akhir</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_laporan_akhir)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Pelaksanaan</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_pelaksanaan)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Artikel</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_artikel)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Komponen B (Mitra)</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Sikap</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_sikap)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Kedisiplinan</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_kedisiplinan)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Komponen C (Admin)</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Workshop</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_workshop)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Administrasi</span>
                                            <span className="text-white font-bold">{fmt(selectedRow.nilai_administrasi)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                <span className="text-blue-200 font-black uppercase text-xs tracking-widest">Calculated Final Score</span>
                                <span className="text-blue-400 font-black text-2xl">{selectedRow.nilai_akhir ?? '0.0'}</span>
                            </div>

                            <button
                                onClick={() => setSelectedRow(null)}
                                className="w-full mt-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                            >
                                Tutup Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
        }
      `}</style>
        </AppLayout>
    )
}
