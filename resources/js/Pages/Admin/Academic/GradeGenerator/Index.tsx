import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Filter, Layers, FileSpreadsheet, FileText, Download, MapPin, User, ChevronRight } from 'lucide-react';

interface Period { id: number; name: string; grading_start?: string | null; grading_end?: string | null; }
interface Group { id: number; period_id: number; code: string; name: string; desa: string; kecamatan: string; kabupaten: string; dpl: string; }
interface Props { periods: Period[]; groups: Group[]; }

export default function GradeGeneratorIndex({ periods, groups }: Props) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const activeGroups = useMemo(() => selectedPeriodId ? groups.filter(g => String(g.period_id) === selectedPeriodId) : groups, [groups, selectedPeriodId]);

    return (
        <AppLayout title="Generator Blanko Nilai">
            <Head title="Generator Nilai | POS-KKN" />

            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-8 py-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Penilaian</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Generator <span className="text-emerald-600">Blanko Nilai</span>
                                </h1>
                                <p className="text-slate-500 max-w-2xl text-lg font-medium">
                                    Pusat distribusi blanko penilaian, ekspor massal kelompok, dan akses cepat ke koreksi nilai.
                                </p>
                            </div>
                            <div className="hidden xl:flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelompok Aktif</span>
                                <span className="text-2xl font-black text-slate-900 tabular-nums">{activeGroups.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-8 mt-8 space-y-8">
                    {/* Filter & Export */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                        <div className="flex flex-col xl:flex-row gap-6">
                            <div className="relative flex-1">
                                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <select value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all appearance-none">
                                    <option value="">Semua Periode</option>
                                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <a href={selectedPeriodId ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}` : '/admin/generator-nilai/export-zip'} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-3 active:scale-95 shrink-0">
                                <Download size={18} /> Unduh Arsip ZIP
                            </a>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kelompok</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lokasi</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">DPL</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {activeGroups.length > 0 ? activeGroups.map((group) => (
                                        <tr key={group.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{group.name}</p>
                                                <p className="text-xs text-slate-400">Kode: {group.code}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700">{group.desa}</p>
                                                        <p className="text-xs text-slate-400">{group.kecamatan}, {group.kabupaten}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700">{group.dpl || 'Belum ditugaskan'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/admin/grades?group_id=${group.id}`} className="h-10 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-600 hover:text-white flex items-center gap-2 transition-all active:scale-90 border border-slate-100 text-xs font-bold">
                                                        Koreksi <ChevronRight size={14} />
                                                    </Link>
                                                    <a href={`/admin/generator-nilai/${group.id}/export`} className="h-10 w-10 rounded-xl bg-slate-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-slate-100" title="Ekspor Excel">
                                                        <FileSpreadsheet size={16} />
                                                    </a>
                                                    <a href={`/admin/generator-nilai/${group.id}/export-pdf`} className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-rose-100" title="Ekspor PDF">
                                                        <FileText size={16} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <Layers size={64} strokeWidth={1.5} />
                                                    <p className="text-lg font-bold">Belum Ada Data Kelompok</p>
                                                    <p className="text-sm text-slate-400">Pilih periode untuk menampilkan kelompok</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white px-8 py-6 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-400">Total: {activeGroups.length} kelompok</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
